"""Rattache chaque commerce à une géographie (zone commerciale périphérique, centre-ville, QPV)
et calcule, pour chaque centre-ville et chaque QPV, son exposition aux zones périphériques.

Entrées (DATA_DIR) :
  - commerces.parquet (sortie de 01_prepare_sirene.py)
  - ZAE_France_metro_opendata.gpkg        : Cerema, base EmpCom (polygones photo-interprétés, 2021)
  - qpv/GPKG/QP2024_France_hexagonale_LB93.gpkg : ANCT, périmètres QPV 2024
  - ae/CHFLIEU_COMMUNE.shp, ae/COMMUNE.shp : IGN ADMIN EXPRESS COG 2024
  - pop/base-cc-evol-struct-pop-2020.CSV   : Insee, population 2014 et 2020
Sorties (DATA_DIR/geo) : commerces_geo.parquet, sites_peri.parquet, centres.parquet, qpv.parquet
"""
import os
import numpy as np
import pandas as pd
import geopandas as gpd
import pyogrio

DATA = os.environ.get("DATA_DIR", ".")
OUT = os.path.join(DATA, os.environ.get("GEO_SUBDIR", "geo"))
RAYON_FIXE = os.environ.get("RAYON_FIXE")  # test de robustesse : même rayon pour toutes les villes
os.makedirs(OUT, exist_ok=True)
YEARS = ["2012", "2016", "2019", "2022", "2025"]
PLM = {"75056", "69123", "13055"}  # Paris, Lyon, Marseille : centres traités à part, exclus ici
GRANDES_SURFACES = {"47.11D", "47.11F", "47.19A", "47.52B"}  # super/hypermarchés, grands magasins, bricolage GS

# --- commerces -------------------------------------------------------------------------------
c = pd.read_parquet(f"{DATA}/commerces.parquet")
c = c[c.qualite_xy != "33"].copy()  # position tirée au hasard dans la commune : inutilisable
pts = gpd.GeoDataFrame(c, geometry=gpd.points_from_xy(c.x, c.y), crs=2154)
for y in YEARS:
    pts[f"gs{y}"] = pts[f"naf{y}"].isin(GRANDES_SURFACES).astype(int) * pts[f"r{y}"]

# --- zones commerciales périphériques (Cerema EmpCom, polygones « commerce ») -----------------
zae = pyogrio.read_dataframe(f"{DATA}/ZAE_France_metro_opendata.gpkg")
zc = zae[zae.activite == "commerce"][["id_dep", "surf_ha", "idcom", "geometry"]]
sites = zc.dissolve(by="id_dep", aggfunc={"surf_ha": "sum", "idcom": "first"}).reset_index()
sites = sites.rename(columns={"id_dep": "site"})
# tolérance de 50 m : les adresses sont géocodées sur la voie, souvent en bordure de zone
zone_buf = sites[["site", "geometry"]].copy()
zone_buf["geometry"] = zone_buf.buffer(50)
j = gpd.sjoin(pts[["geometry"]], zone_buf, predicate="within", how="left")
j = j[~j.index.duplicated(keep="first")]
pts["site"] = j["site"]

# --- centres-villes : cercle autour du chef-lieu (mairie) des communes de 5 000 hab. ou plus ----
com = pyogrio.read_dataframe(f"{DATA}/ae/COMMUNE.shp", read_geometry=False)[
    ["INSEE_COM", "NOM", "POPULATION", "INSEE_DEP", "SIREN_EPCI"]]
chl = pyogrio.read_dataframe(f"{DATA}/ae/CHFLIEU_COMMUNE.shp")[["INSEE_COM", "geometry"]]
cen = chl.merge(com, on="INSEE_COM")
cen = cen[(cen.POPULATION >= 5000) & ~cen.INSEE_COM.isin(PLM)].copy()
cen["rayon"] = np.select([cen.POPULATION < 10000, cen.POPULATION < 50000], [300, 500], 700)
if RAYON_FIXE:
    cen["rayon"] = int(RAYON_FIXE)
cen["taille"] = pd.cut(cen.POPULATION, [5000, 10000, 20000, 50000, 100000, 1e9],
                       labels=["5-10k", "10-20k", "20-50k", "50-100k", "100k+"], right=False)
pop = pd.read_csv(f"{DATA}/pop/base-cc-evol-struct-pop-2020.CSV", sep=";", dtype={"CODGEO": str},
                  usecols=["CODGEO", "P20_POP", "P14_POP"])
cen = cen.merge(pop, left_on="INSEE_COM", right_on="CODGEO", how="left")
cen["dpop_14_20"] = cen.P20_POP / cen.P14_POP - 1
cen = gpd.GeoDataFrame(cen, geometry="geometry", crs=2154)

disc = cen[["INSEE_COM", "rayon", "geometry"]].copy()
disc["geometry"] = disc.buffer(disc.rayon)
hors_peri = pts[pts.site.isna()]
j = gpd.sjoin(hors_peri[["geometry"]], disc[["INSEE_COM", "geometry"]], predicate="within", how="inner")
# un commerce à cheval sur deux disques est rattaché au chef-lieu le plus proche
centre_pt = gpd.GeoSeries(cen.set_index("INSEE_COM").loc[j.INSEE_COM, "geometry"].values, index=j.index, crs=2154)
j["d"] = j.geometry.distance(centre_pt)
j = j.sort_values("d").loc[lambda d: ~d.index.duplicated(keep="first")]
pts["centre"] = j["INSEE_COM"]

# --- QPV ------------------------------------------------------------------------------------
pts["qpv"] = pts.plg_qp24.where(pts.plg_qp24.str.startswith("QN", na=False))
qpv = pyogrio.read_dataframe(f"{DATA}/qpv/GPKG/QP2024_France_hexagonale_LB93.gpkg")
qpv = qpv.to_crs(2154)[["code_qp", "lib_qp", "insee_com", "lib_com", "insee_dep", "geometry"]]

# --- comptes par site périphérique ------------------------------------------------------------
cnt_cols = [f"{k}{y}" for k in ("r", "e", "gs") for y in YEARS]
site_cnt = pts[pts.site.notna()].groupby("site")[cnt_cols].sum()
sites = sites.merge(site_cnt, left_on="site", right_index=True, how="left").fillna({k: 0 for k in cnt_cols})


def exposition(units, key, rayon_km):
    """Distance à la zone la plus proche, surface commerciale périphérique et commerces de périphérie
    dans un rayon donné autour de chaque unité (point ou polygone)."""
    near = gpd.sjoin_nearest(units[[key, "geometry"]], sites[["site", "geometry"]], distance_col="dist_m")
    near = near[~near[key].duplicated()].set_index(key)["dist_m"]
    buf = units[[key, "geometry"]].copy()
    buf["geometry"] = buf.buffer(rayon_km * 1000)
    inter = gpd.overlay(buf, zc[["id_dep", "geometry"]], how="intersection", keep_geom_type=True)
    surf = (inter.assign(ha=inter.area / 1e4).groupby(key)["ha"].sum())
    touch = gpd.sjoin(buf, sites[["site", "geometry"] + cnt_cols], predicate="intersects")
    dyn = touch.groupby(key)[cnt_cols].sum().add_prefix("peri_")
    res = pd.DataFrame(index=units[key])
    res["dist_peri_km"] = near / 1000
    res[f"surf_peri_{rayon_km}km_ha"] = surf
    res = res.join(dyn).fillna(0)
    return res


expo_cen = exposition(cen, "INSEE_COM", 10)
expo_qpv = exposition(qpv, "code_qp", 5)

# --- comptes centres, QPV, reste de la commune -------------------------------------------------
cen_cnt = pts[pts.centre.notna()].groupby("centre")[cnt_cols].sum()
cen = cen.merge(cen_cnt, left_on="INSEE_COM", right_index=True, how="left").fillna({k: 0 for k in cnt_cols})
cen = cen.merge(expo_cen, left_on="INSEE_COM", right_index=True, how="left")

qpv_cnt = pts[pts.qpv.notna()].groupby("qpv")[cnt_cols].sum()
qpv = qpv.merge(qpv_cnt, left_on="code_qp", right_index=True, how="left").fillna({k: 0 for k in cnt_cols})
qpv = qpv.merge(expo_qpv, left_on="code_qp", right_index=True, how="left")
# témoin : reste de la commune, hors QPV et hors zone périphérique
reste = pts[pts.qpv.isna() & pts.site.isna()].groupby("com")[cnt_cols].sum().add_prefix("reste_")
qpv = qpv.merge(reste, left_on="insee_com", right_index=True, how="left")
qpv = qpv.merge(pop[["CODGEO", "P20_POP", "P14_POP"]], left_on="insee_com", right_on="CODGEO", how="left")

# --- sauvegardes ---------------------------------------------------------------------------------
pts["zone"] = np.select([pts.site.notna(), pts.qpv.notna(), pts.centre.notna()],
                        ["peripherie", "qpv", "centre"], "autre")
pts.drop(columns="geometry").to_parquet(f"{OUT}/commerces_geo.parquet")
sites.to_parquet(f"{OUT}/sites_peri.parquet")
cen.to_parquet(f"{OUT}/centres.parquet")
qpv.to_parquet(f"{OUT}/qpv.parquet")

print("sites périphériques :", len(sites), "| surface commerce (ha) :", round(zc.surf_ha.sum()))
print("centres-villes :", len(cen), "| QPV :", len(qpv))
print(pts.groupby("zone")[[f"r{y}" for y in YEARS] + [f"e{y}" for y in YEARS]].sum())
