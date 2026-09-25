"""Structural profile of retail in French border areas (section 2.2).

Commune-level indicators by straight-line distance to the nearest land border
and by neighbouring country, mainland France excluding Corsica.

Inputs (data/raw/):
  ds_bpe_2025/DS_BPE_2025_data.csv   INSEE, Base permanente des équipements 2025
  urssaf_retail_commune.csv          URSSAF, establishments & employees, commune x APE (NAF 47)
  popref/DS_POPULATIONS_REFERENCE_2023_data.csv   INSEE, municipal population 2023
  buralistes_2018.csv                DGDDI, directory of tobacconists 2018
  LAU_2024.geojson                   Eurostat GISCO, communes (LAU) 2024
Run from cross_border/:  python report_docx/retail_profile.py
"""
import json
import sys
from pathlib import Path

import duckdb
import geopandas as gpd
import numpy as np
import pandas as pd

sys.path.insert(0, ".")
from cbattr import config as C
from cbattr import geo

RAW = C.RAW
OUT = Path("report_docx/data"); OUT.mkdir(parents=True, exist_ok=True)
BANDS = [0, 10, 20, 30, 50, 75, 100]
BAND_LABELS = ["0–10", "10–20", "20–30", "30–50", "50–75", "75–100"]
GROUP = {"BE": "Belgium", "LU": "Luxembourg", "DE": "Germany", "CH": "Switzerland",
         "IT": "Italy", "MC": "Italy", "ES": "Spain", "AD": "Spain"}

BPE_GROUPS = {
    "small_food": ["B201", "B202", "B204", "B205", "B206", "B207", "B208", "B209", "B210"],
    "large_food": ["B104", "B105"],
    "non_food": ["B103", "B302", "B303", "B304", "B306", "B307", "B308", "B309", "B310", "B311", "B312",
                 "B313", "B315", "B317", "B318", "B319", "B321", "B322", "B323", "B324", "B325"],
    "fuel": ["B316"],
}


def communes():
    lau = gpd.read_file(RAW / "LAU_2024.geojson")
    lau = lau[lau.CNTR_CODE == "FR"].copy()
    lau["code"] = lau.GISCO_ID.str[3:]
    lau = lau[~lau.code.str[:2].isin(["2A", "2B"]) & ~lau.code.str[:2].isin(["97"])]
    lau = lau.to_crs(C.CRS)
    lau["pt"] = lau.geometry.representative_point()
    cn = geo.countries()
    b = geo.land_borders(cn)
    for c in b.index:
        lau[f"d_{c}"] = gpd.GeoSeries(lau.pt, crs=C.CRS).distance(b.loc[c, "geometry"]) / 1000
    d = lau[[f"d_{c}" for c in b.index]]
    lau["dist_km"] = d.min(axis=1)
    lau["nb"] = d.idxmin(axis=1).str[2:]
    lau["neighbour"] = lau.nb.map(GROUP)
    lau["band"] = pd.cut(lau.dist_km, BANDS, labels=BAND_LABELS, right=False)
    return lau


def main():
    lau = communes()
    pop = duckdb.sql(f"""select GEO as code, OBS_VALUE as pop from
        '{RAW}/popref/DS_POPULATIONS_REFERENCE_2023_data.csv'
        where GEO_OBJECT='COM' and POPREF_MEASURE='PMUN'""").df()
    bpe = duckdb.sql(f"""select GEO as code, FACILITY_TYPE as t, OBS_VALUE as n from
        '{RAW}/ds_bpe_2025/DS_BPE_2025_data.csv'
        where GEO_OBJECT='COM' and FACILITY_TYPE like 'B%' and BPE_MEASURE='FACILITIES'""").df()
    bpe["code"] = bpe.code.str.replace(r"^\d{4}-COM-", "", regex=True)
    for g, codes in BPE_GROUPS.items():
        bpe.loc[bpe.t.isin(codes), "grp"] = g
    bw = bpe.dropna(subset=["grp"]).pivot_table(index="code", columns="grp", values="n", aggfunc="sum", fill_value=0)

    u = pd.read_csv(RAW / "urssaf_retail_commune.csv", sep=";", dtype={"code_commune": str}, encoding="utf-8-sig")
    u["big"] = u.code_ape.isin(["4711D", "4711F", "4711E"])  # super/hypermarkets, multi-commerce
    ua = u.groupby("code_commune").agg(
        est24=("nombre_d_etablissements_2024", "sum"), emp24=("effectifs_salaries_2024", "sum"),
        emp12=("effectifs_salaries_2012", "sum"), est12=("nombre_d_etablissements_2012", "sum"))
    ub = u[u.big].groupby("code_commune").effectifs_salaries_2024.sum().rename("emp24_big")
    ua = ua.join(ub).fillna(0)

    bur = pd.read_csv(RAW / "buralistes_2018.csv", sep=";")
    ll = bur.geom.str.split(",", expand=True).astype(float)
    bp = gpd.GeoDataFrame(geometry=gpd.points_from_xy(ll[1], ll[0]), crs=C.WGS84).to_crs(C.CRS)
    j = gpd.sjoin(bp, lau[["code", "geometry"]], predicate="within")
    tob = j.groupby("code").size().rename("tobacconists")

    df = lau[["code", "LAU_NAME", "dist_km", "neighbour", "band"]].merge(pop, on="code", how="left")
    df = df.merge(bw, left_on="code", right_index=True, how="left").merge(ua, left_on="code", right_index=True, how="left")
    df = df.merge(tob, left_on="code", right_index=True, how="left")
    cols = list(BPE_GROUPS) + ["est24", "emp24", "emp12", "est12", "emp24_big", "tobacconists"]
    df[cols] = df[cols].fillna(0)
    df["pop"] = df["pop"].fillna(0)
    print(f"communes: {len(df):,}; population matched: {df['pop'].sum()/1e6:.1f}m; "
          f"BPE outlets matched: {df[list(BPE_GROUPS)].sum().sum():,.0f}; retail jobs: {df.emp24.sum():,.0f}")
    df.to_csv(OUT / "communes_retail_profile.csv", index=False)

    def agg(g):
        p = g["pop"].sum()
        r = {"pop": p, "communes": len(g)}
        for k in BPE_GROUPS:
            r[f"{k}_per10k"] = g[k].sum() / p * 1e4
        r["outlets_per10k"] = sum(g[k].sum() for k in ["small_food", "large_food", "non_food"]) / p * 1e4
        r["jobs_per1000"] = g.emp24.sum() / p * 1e3
        r["jobs_per_est"] = g.emp24.sum() / g.est24.sum()
        r["big_share"] = g.emp24_big.sum() / g.emp24.sum()
        r["jobs_growth_12_24"] = g.emp24.sum() / g.emp12.sum() - 1
        r["est_growth_12_24"] = g.est24.sum() / g.est12.sum() - 1
        r["tob_per10k"] = g.tobacconists.sum() / p * 1e4
        return pd.Series(r)

    near = df[df.dist_km < 100]
    by_band = near.groupby(["neighbour", "band"], observed=True).apply(agg).reset_index()
    by_band_all = near.groupby("band", observed=True).apply(agg).reset_index().assign(neighbour="All borders")
    near = near.assign(zone=np.select([near.dist_km < 20, near.dist_km >= 50], ["border", "hinterland"], "middle"))
    zones = near[near.zone != "middle"].groupby(["neighbour", "zone"]).apply(agg).reset_index()
    zones_all = near[near.zone != "middle"].groupby("zone").apply(agg).reset_index().assign(neighbour="All borders")
    nat = agg(df).to_frame("Mainland France").T
    pd.concat([by_band, by_band_all]).to_csv(OUT / "profile_by_band.csv", index=False, float_format="%.4f")
    pd.concat([zones, zones_all]).to_csv(OUT / "profile_border_vs_hinterland.csv", index=False, float_format="%.4f")
    nat.to_csv(OUT / "profile_mainland.csv", float_format="%.4f")
    pd.set_option("display.width", 250)
    print(pd.concat([zones, zones_all]).round(3).to_string(index=False))
    print(nat.round(3).to_string())
    print(pd.concat([by_band, by_band_all])[["neighbour", "band", "pop", "outlets_per10k", "large_food_per10k",
                                             "jobs_per1000", "tob_per10k", "jobs_growth_12_24"]].round(2).to_string(index=False))


if __name__ == "__main__":
    main()
