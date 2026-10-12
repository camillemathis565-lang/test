"""Prépare les données de l'Observatoire national du commerce de détail (v2).

Toutes les sorties sont écrites dans observatoire/data/ au format JSON compact (colonnes).
Entrées (SRC, répertoire de travail) :
  data/geo/commerces_geo.parquet   commerces de détail en magasin (NAF 47.1 à 47.7), Sirene 2012-2025,
                                   géolocalisés et rattachés à une zone (périphérie, centre, QPV, autre)
  data/geo/sites_peri.parquet      zones commerciales périphériques (Cerema, polygones « commerce »)
  data/geo/qpv.parquet             QPV 2024 (ANCT) et exposition aux zones périphériques
  data/geo/centres.parquet         centres-villes (cercle autour de la mairie, communes de 5 000 hab. et plus)
  data/sirene_stock.parquet        stock Sirene (tranches d'effectifs, e-commerce 47.91, réseaux)
  data/ae/COMMUNE.shp              IGN ADMIN EXPRESS (centroïdes, contours départementaux)
  naf_dl/conso_com.csv             Cerema, consommation d'espaces NAF 2011-2025 (référentiel communal 2025)
  pop2023_dl/x/donnees_communes.csv  Insee, populations légales 2023
  hist_dl/h.xlsx                   Insee, séries historiques de population
  ins2075_dl/IP2075.xlsx           Insee Première n° 2075 (achats transfrontaliers 2024)
  acv/cdc.csv, pvd_dl/pvd.csv      listes Action cœur de ville et Petites villes de demain
"""
import json, os, glob
import numpy as np
import pandas as pd
import geopandas as gpd
import pyarrow.parquet as pq
import pyarrow.compute as pc
import pyogrio

SRC = os.environ["SRC"]
OUT = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(OUT, exist_ok=True)
Y = ["2012", "2016", "2019", "2022", "2025"]
YY = [y[2:] for y in Y]


def plm(code):
    """Arrondissements municipaux de Paris, Lyon et Marseille -> code de la commune."""
    code = str(code)
    if code.startswith("751") and len(code) == 5: return "75056"
    if code.startswith("6938"): return "69123"
    if code.startswith("132") and code[3:].isdigit() and 1 <= int(code[3:]) <= 16: return "13055"
    return code


def fnum(v):
    v = round(float(v), 1)
    return int(v) if v == int(v) else v


def dump(name, obj):
    p = os.path.join(OUT, name)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    print(f"{name}: {os.path.getsize(p)/1e6:.2f} Mo")


def cols(df):
    """Tableau colonne par colonne : {"cols": [...], "data": {col: [valeurs]}}."""
    out = {}
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_float_dtype(s):
            out[c] = [None if pd.isna(v) else fnum(v) for v in s]
        elif pd.api.types.is_integer_dtype(s):
            out[c] = [int(v) for v in s]
        else:
            out[c] = [None if pd.isna(v) else str(v) for v in s]
    return {"n": len(df), "cols": list(df.columns), "data": out}


# ---------------------------------------------------------------- référentiel communal (Cerema 2025)
conso = pd.read_csv(f"{SRC}/naf_dl/conso_com.csv", dtype=str)
conso = conso[~conso.iddep.str.startswith("97")]  # France métropolitaine (les données commerce ne couvrent que l'Hexagone et la Corse)
num = [c for c in conso.columns if c.startswith(("naf", "art"))]
conso[num] = conso[num].apply(pd.to_numeric, errors="coerce").fillna(0) / 10000  # m² -> ha
com = pd.DataFrame({"code": conso.idcom, "nom": conso.idcomtxt, "dep": conso.iddep, "reg": conso.idreg,
                    "epci": conso.epci25, "dens": conso.libdens_aav, "aav": conso.cateaav2020,
                    "littoral": (conso.littoral == "C").astype(int),
                    "montagne": (conso.montagne_urba == "in").astype(int)})
# artificialisation (ha) : total et pour l'activité, par période
yrs = [(f"{a:02d}", f"{a+1:02d}") for a in range(11, 25)]  # consommation de l'année 2011 (naf11art12) à 2024 (naf24art25)
com["art_tot"] = sum(conso[f"naf{a}art{b}"] for a, b in yrs).values
com["art_act"] = sum(conso[f"art{a}act{b}"] for a, b in yrs).values
com["art_hab"] = sum(conso[f"art{a}hab{b}"] for a, b in yrs).values
com["art_act_1115"] = sum(conso[f"art{a}act{b}"] for a, b in yrs[:4]).values
com["art_act_1519"] = sum(conso[f"art{a}act{b}"] for a, b in yrs[4:8]).values
com["art_act_1924"] = sum(conso[f"art{a}act{b}"] for a, b in yrs[8:]).values
nat_art = {"annees": [f"20{a}" for a, _ in yrs],
           "total": [round(float(conso[f"naf{a}art{b}"].sum()), 0) for a, b in yrs],
           "activite": [round(float(conso[f"art{a}act{b}"].sum()), 0) for a, b in yrs],
           "habitat": [round(float(conso[f"art{a}hab{b}"].sum()), 0) for a, b in yrs]}
names = {"dep": dict(zip(conso.iddep, conso.iddeptxt)), "reg": dict(zip(conso.idreg, conso.idregtxt)),
         "epci": dict(zip(conso.epci25, conso.epci25txt))}

# ---------------------------------------------------------------- population (Insee)
p23 = pd.read_csv(f"{SRC}/pop2023_dl/x/donnees_communes.csv", sep=";", dtype=str)
p23 = dict(zip(p23.COM, pd.to_numeric(p23.PMUN)))
h = pd.read_excel(f"{SRC}/hist_dl/h.xlsx", sheet_name=0, header=5, dtype={"CODGEO": str}, usecols=["CODGEO", "PMUN2013", "PMUN2016"])
com["pop"] = com.code.map(p23).fillna(0).astype(int)
com["pop13"] = com.code.map(dict(zip(h.CODGEO, h.PMUN2013))).fillna(0).astype(int)

# ---------------------------------------------------------------- centroïdes (IGN, Lambert 93, en hm)
ae = pyogrio.read_dataframe(f"{SRC}/data/ae/COMMUNE.shp", columns=["INSEE_COM", "INSEE_DEP"])
ae = ae[~ae.INSEE_DEP.str.startswith("97")]
ct = ae.geometry.representative_point()
xy = dict(zip(ae.INSEE_COM, zip((ct.x / 100).round().astype(int), (ct.y / 100).round().astype(int))))
com["x"] = com.code.map(lambda c: xy.get(c, (None, None))[0])
com["y"] = com.code.map(lambda c: xy.get(c, (None, None))[1])
# départements : contours simplifiés pour la carte (chemins SVG en km)
dep = ae.dissolve(by="INSEE_DEP").simplify(1500)
def path(g):
    polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
    out = []
    for p in polys:
        if p.area < 2e7:  # îlots de moins de 20 km²
            continue
        c = np.asarray(p.exterior.coords) / 1000
        out.append("M" + "L".join(f"{x:.1f},{-y:.1f}" for x, y in c) + "Z")
    return "".join(out)
dep_geo = {k: path(g) for k, g in dep.items()}

# ---------------------------------------------------------------- commerces (Sirene, en magasin)
c = pd.read_parquet(f"{SRC}/data/geo/commerces_geo.parquet",
                    columns=["com", "zone"] + [f"r{y}" for y in Y] + [f"e{y}" for y in Y] + [f"gs{y}" for y in Y] + ["naf2025"])
c["com"] = c.com.map(plm)
g = c.groupby("com")
agg = pd.DataFrame(index=g.size().index)
for y, s in zip(Y, YY):
    agg[f"r{s}"] = g[f"r{y}"].sum()
    agg[f"e{s}"] = g[f"e{y}"].sum()
agg["gs12"] = g["gs2012"].sum(); agg["gs25"] = g["gs2025"].sum()
for z, k in [("centre", "c"), ("peripherie", "p"), ("qpv", "q")]:
    gz = c[c.zone == z].groupby("com")
    for y, s in [("2012", "12"), ("2019", "19"), ("2025", "25")]:
        agg[f"{k}_r{s}"] = gz[f"r{y}"].sum()
    agg[f"{k}_e25"] = gz["e2025"].sum()
# secteurs (NAF 47.1 à 47.7), établissements actifs en 2025
n = c[c.r2025 == 1].assign(g=lambda d: d.naf2025.str[3:4])
sec = n.pivot_table(index="com", columns="g", values="r2025", aggfunc="sum").add_prefix("n")
agg = agg.join(sec)
agg["tab"] = n[n.naf2025 == "47.26Z"].groupby("com").size()  # débits de tabac
agg["phar"] = n[n.naf2025 == "47.73Z"].groupby("com").size()  # pharmacies
# entrées et sorties entre deux photographies
for (a, sa), (b, sb) in zip(zip(Y, YY), list(zip(Y, YY))[1:]):
    agg[f"in{sb}"] = c.assign(v=((c[f"r{a}"] == 0) & (c[f"r{b}"] == 1)).astype(int)).groupby("com").v.sum()
    agg[f"out{sb}"] = c.assign(v=((c[f"r{a}"] == 1) & (c[f"r{b}"] == 0)).astype(int)).groupby("com").v.sum()

# ---------------------------------------------------------------- stock Sirene : taille, e-commerce, réseaux
MID = {"00": 0, "01": 1.5, "02": 4, "03": 7.5, "11": 14.5, "12": 34.5, "21": 74.5, "22": 149.5, "31": 224.5,
       "32": 374.5, "41": 749.5, "42": 1499.5, "51": 3499.5, "52": 7499.5, "53": 10000}
pf = pq.ParquetFile(f"{SRC}/data/sirene_stock.parquet")
parts = []
for b in pf.iter_batches(batch_size=2_000_000, columns=["siren", "etatAdministratifEtablissement", "activitePrincipaleEtablissement",
                                                        "codeCommuneEtablissement", "trancheEffectifsEtablissement"]):
    m = pc.and_(pc.equal(b.column(1), "A"), pc.starts_with(b.column(2), "47."))
    parts.append(b.filter(m).to_pandas())
st = pd.concat(parts, ignore_index=True)
st.columns = ["siren", "etat", "naf", "com", "tr"]
st["com"] = st.com.map(plm)
ecom = st[st.naf.isin(["47.91A", "47.91B"])].groupby("com").size().rename("ecom")
mag = st[st.naf.str[:4].isin([f"47.{i}" for i in range(1, 8)])].copy()
mag["emp"] = mag.tr.map(MID).fillna(0)
mag["sz"] = np.select([mag.tr.isin(["00", "NN"]) | mag.tr.isna(), mag.tr.isin(["01", "02", "03"]), mag.tr.isin(["11", "12"])], [0, 1, 2], 3)
nb = mag.groupby("siren").size()
mag["res"] = mag.siren.map(nb).ge(10).astype(int)  # point de vente d'une entreprise qui en compte 10 ou plus
gm = mag.groupby("com")
st_agg = pd.DataFrame({"emp": gm.emp.sum().round(), "res": gm.res.sum(),
                       "sz0": gm.sz.apply(lambda s: (s == 0).sum()), "sz1": gm.sz.apply(lambda s: (s == 1).sum()),
                       "sz2": gm.sz.apply(lambda s: (s == 2).sum()), "sz3": gm.sz.apply(lambda s: (s == 3).sum())})
agg = agg.join(st_agg, how="outer").join(ecom, how="outer")

# ---------------------------------------------------------------- QPV, zones, programmes
qpv = pd.read_parquet(f"{SRC}/data/geo/qpv.parquet").drop(columns="geometry")
qpv["com1"] = qpv.insee_com.str.split(",").str[0].str.strip().map(plm)  # commune principale du quartier
sites = gpd.GeoDataFrame(pd.read_parquet(f"{SRC}/data/geo/sites_peri.parquet").assign(
    geometry=lambda d: gpd.GeoSeries.from_wkb(d.geometry)), crs=2154)
sites["com1"] = sites.idcom.str.split(",").str[0].str.strip()
acv = pd.read_csv(f"{SRC}/acv/cdc.csv", sep=";", dtype=str, encoding="utf-8-sig")
pvd = pd.read_csv(f"{SRC}/pvd_dl/pvd.csv", dtype=str)
com = com.merge(agg.reset_index().rename(columns={"index": "code", "com": "code"}), on="code", how="left")
com["nqpv"] = com.code.map(qpv.com1.value_counts())
com["nzone"] = com.code.map(sites.groupby("com1").size())
com["zsurf"] = com.code.map(sites.groupby("com1").surf_ha.sum())
com["acv"] = com.code.isin(acv.insee_com).astype(int)
com["pvd"] = com.code.isin(pvd.insee_com).astype(int)
intcols = [k for k in com.columns if k not in ("code", "nom", "dep", "reg", "epci", "dens", "aav", "x", "y")
           and not k.startswith("art")]
com[intcols] = com[intcols].fillna(0).round().astype(int)
for k in [k for k in com.columns if k.startswith("art")] + ["zsurf"]:
    com[k] = com[k].astype(float).round(1)
print("communes :", len(com), "commerces 2025 :", com.r25.sum())

# ---------------------------------------------------------------- espaces frontaliers (départements)
BORDER = {"Belgique": ["59", "02", "08", "55", "54"], "Luxembourg": ["54", "57"], "Allemagne": ["57", "67", "68"],
          "Suisse": ["68", "90", "25", "39", "01", "74"], "Italie": ["74", "73", "05", "04", "06"], "Monaco": ["06"],
          "Espagne": ["64", "65", "31", "09", "66"], "Andorre": ["09", "66"]}
x = pd.read_excel(f"{SRC}/ins2075_dl/IP2075.xlsx", sheet_name=None, header=None)
f1 = x["Figure 1"].iloc[3:, :3].dropna()
f1 = {str(r[0]).zfill(2): float(r[2]) for r in f1.itertuples(index=False) if str(r[0]).strip()[:2].isalnum() and isinstance(r[2], (int, float))}
def table(sheet, start, ncol):
    t = x[sheet].iloc[start:, :ncol]
    t = t[t.iloc[:, 0].astype(str).str.match(r"^[A-Z][a-zé]+$") & t.iloc[:, 1].notna()]
    return {r[0]: [None if pd.isna(v) else float(v) for v in r[1:]] for r in t.itertuples(index=False)}
border = {
    "pays": BORDER,
    "part_depenses_dep": f1,
    "caracteristiques": {"cols": ["Nombre moyen d'opérations", "Montant total moyen (€)", "Montant moyen par opération (€)",
                                  "Part en juillet-août (%)", "Part le week-end (%)"], "data": table("Figure 2", 4, 6)},
    "points_de_vente": {"cols": ["Stations-services, tabac", "Alimentation (dont supermarchés)", "Autres",
                                 "Hébergement et restauration", "Habillement, chaussures"], "data": table("Figure 3", 3, 6)},
    "frequence": {"cols": ["Occasionnels", "Réguliers", "Très réguliers"], "data": table("Figure 4", 3, 4)},
    "menages": {r[0]: r[1] for r in x["Tableau complémentaire 1"].iloc[4:12, :2].itertuples(index=False)},
    "source": {"titre": "Insee Première n° 2075 (octobre 2025), achats de l'autre côté de la frontière en 2024",
               "url": "https://www.insee.fr/fr/statistiques/8647092", "date": "2025-10-02",
               "champ": "Achats physiques par carte bancaire des clients actifs du Crédit Mutuel Alliance Fédérale"},
}

# ---------------------------------------------------------------- tables détaillées : zones, QPV, centres
sites_ct = sites.geometry.representative_point()
zones = pd.DataFrame({"id": sites.site, "com": sites.com1, "coms": sites.idcom, "surf": sites.surf_ha.round(1),
                      "x": (sites_ct.x / 100).round().astype(int), "y": (sites_ct.y / 100).round().astype(int)})
for s, y in zip(YY, Y):
    zones[f"r{s}"] = sites[f"r{y}"].fillna(0).astype(int).values
    zones[f"e{s}"] = sites[f"e{y}"].fillna(0).astype(int).values
    zones[f"gs{s}"] = sites[f"gs{y}"].fillna(0).astype(int).values
qg = gpd.GeoSeries.from_wkb(pd.read_parquet(f"{SRC}/data/geo/qpv.parquet", columns=["geometry"]).geometry, crs=2154)
qct = qg.representative_point()
q = pd.DataFrame({"code": qpv.code_qp, "nom": qpv.lib_qp, "com": qpv.com1, "coms": qpv.insee_com, "dep": qpv.insee_dep,
                  "x": (qct.x / 100).round().astype(int), "y": (qct.y / 100).round().astype(int),
                  "dist": qpv.dist_peri_km.round(2), "surf5": qpv.surf_peri_5km_ha.round(0)})
for s, y in zip(YY, Y):
    q[f"r{s}"] = qpv[f"r{y}"].fillna(0).astype(int).values
    q[f"e{s}"] = qpv[f"e{y}"].fillna(0).astype(int).values
    q[f"pr{s}"] = qpv[f"peri_r{y}"].fillna(0).astype(int).values
cen = pd.read_parquet(f"{SRC}/data/geo/centres.parquet").drop(columns="geometry")
ce = pd.DataFrame({"code": cen.INSEE_COM, "rayon": cen.rayon, "taille": cen.taille.astype(str),
                   "dist": cen.dist_peri_km.round(2), "surf10": cen.surf_peri_10km_ha.round(0)})
for s, y in zip(YY, Y):
    ce[f"r{s}"] = cen[f"r{y}"].fillna(0).astype(int).values
    ce[f"e{s}"] = cen[f"e{y}"].fillna(0).astype(int).values
    ce[f"pr{s}"] = cen[f"peri_r{y}"].fillna(0).astype(int).values

# ---------------------------------------------------------------- villes ACV : atlas ANCT et baromètre Codata
res = "/home/user/test/analyse_commerce_territoires/resultats"
acvf = pd.read_csv(f"{res}/23_classement_final_villes_acv.csv", dtype={"insee_com": str})
acvf = acvf[["insee_com", "vacance_commerciale_2025", "vacance_logement_2025", "ventes_immo_tendance_2018_2023",
             "reinventons_statut", "territoire_pilote_sobriete_fonciere", "accompagnement_cerema_transition",
             "design_actif", "mobilisation", "score_final", "codata_2019_2025", "mytraffic"]]
acvf.columns = ["code", "vac_com", "vac_log", "ventes", "reinventons", "tpsf", "transition", "design", "mobilisation",
                "score", "codata", "mytraffic"]

# ---------------------------------------------------------------- codes compacts
DENS = sorted(com.dens.fillna("?").unique()); AAV = sorted(com.aav.fillna("?").unique()); EPCI = sorted(com.epci.fillna("?").unique())
com["dens"] = com.dens.fillna("?").map({v: i for i, v in enumerate(DENS)})
com["aav"] = com.aav.fillna("?").map({v: i for i, v in enumerate(AAV)})
com["epci"] = com.epci.fillna("?").map({v: i for i, v in enumerate(EPCI)})
dep_reg = dict(zip(com.dep, com.reg)); com = com.drop(columns="reg")
com["zsurf"] = com.zsurf.round().astype(int)
names.update({"dens": DENS, "aav": AAV, "epci_codes": EPCI, "dep_reg": dep_reg})

# ---------------------------------------------------------------- écriture
dump("communes.json", cols(com))
dump("noms.json", names)
dump("geo_dep.json", dep_geo)
dump("zones.json", cols(zones))
dump("qpv.json", cols(q))
dump("centres.json", cols(ce))
dump("acv.json", cols(acvf))
dump("frontieres.json", border)
dump("artif_nat.json", nat_art)
