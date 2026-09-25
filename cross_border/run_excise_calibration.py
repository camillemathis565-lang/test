"""Calibrate tobacco and fuel cross-border purchases on the 2020 border closure.

    python run_excise_calibration.py      # after run_pipeline.py

Data needed in data/raw/ (downloaded automatically when missing):
  fuel_dept_annual.csv   SDES, annual petroleum sales by département
  fuel_national_monthly.csv  SDES, monthly national sales
Observed tobacco targets and 2020 prices are in cbattr/excise.py (sources there).
"""
import json
import pickle

import duckdb
import geopandas as gpd
import numpy as np
import pandas as pd
import requests

from cbattr import config as C
from cbattr import excise, geo, network, overpass, population
from run_pipeline import build_inputs

DIDO = "https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/"
FUEL_ANNUAL = ("445d1fbb-4ebd-48b0-b566-7d97f21a871e", "2024-09", "fuel_dept_annual.csv")
FUEL_MONTHLY = ("225af718-d728-45aa-9893-0075b6e38cca", "2021-10", "fuel_national_monthly.csv")
EXT_BUFFER_KM = 200
SP_COLS = ["SUPER_SANS_PLOMB_95", "SUPER_SANS_PLOMB_95_E10", "SUPER_SANS_PLOMB_98", "SUPER_ETH_E85"]


def dido(rid, millesime, name):
    p = C.RAW / name
    if not p.exists():
        r = requests.get(f"{DIDO}{rid}/csv", params={"millesime": millesime, "withColumnName": "true",
                                                    "withColumnDescription": "false"}, timeout=120)
        r.raise_for_status()
        p.write_bytes(r.content)
    return pd.read_csv(p, sep=";")


def fuel_targets():
    """Observed 2020/2019 change in gasoline sales, border départements, net of
    the non-border change; noise = SD of the same statistic in 2016-2019."""
    d = dido(*FUEL_ANNUAL)
    d["SP"] = d[SP_COLS].sum(axis=1, min_count=1)
    p = d.pivot_table(index="DEPARTEMENT_LIBELLE", columns="ANNEE", values="SP")
    border = p.index.isin(excise.BORDER_DEPTS)

    def rel(y1, y0):
        g = p[y1] / p[y0]
        ctrl = p.loc[~border, y1].sum() / p.loc[~border, y0].sum()
        return g / ctrl - 1

    obs = rel(2020, 2019)[border]
    noise = pd.concat([rel(y, y - 1)[border] for y in (2017, 2018, 2019)], axis=1).std(axis=1).mean()
    m = dido(*FUEL_MONTHLY)
    m20 = m[m.ANNEE == 2020].set_index("MOIS")
    sp = m20[[c for c in SP_COLS + ["SUPER_SANS_PLOMB"] if c in m20]].sum(axis=1)
    sp.index = sp.index.str[-2:].astype(int)
    window = 0.5 * sp[3] + sp[4] + sp[5] + 0.5 * sp[6]     # 16 March - 15 June
    w = window / sp.sum()
    return obs, noise, w


def main():
    I = build_inputs()
    cn, borders, areas, dest, places = (I[k] for k in ("cn", "borders", "areas", "dest", "places"))
    names = population.nuts_names()

    print("extended residents grid")
    land = gpd.GeoSeries(cn.geometry.values, crs=C.CRS).union_all()
    ext = areas["border_line"].buffer(EXT_BUFFER_KM * 1000).intersection(land)
    cells = population.demand_cells(cn, areas, places, area=ext)
    cells["dept"] = [names.get(n, n) if c == "FR" else n for n, c in zip(cells.nuts3, cells.country)]
    fr_total = duckdb.sql(f"select sum(TOT_P_2021) from '{population.grid_path()}' "
                          "where NUTS2024_0 = 'FR' and NUTS2024_1 != 'FRM' "
                          "and NUTS2024_1 not like 'FRY%'").fetchone()[0]
    fr_outside = fr_total - cells.loc[cells.country == "FR", "pop"].sum()
    print(f"  {len(cells):,} cells; French residents outside the grid: {fr_outside:,.0f}")

    print("road graph & times to each country")
    gp = C.CACHE / "road_graph.pkl"
    if gp.exists():
        g, vxy = pickle.loads(gp.read_bytes())
    else:
        g, vxy = network.build_graph(overpass.fetch_tiles("roads", geo.tiles(areas["network"])))
        gp.write_bytes(pickle.dumps((g, vxy)))
    T, J = excise.times_to_countries(g, vxy, dest, cells)
    dept_of_dest = np.array([names.get(n, n) for n in dest.nuts3])

    results = {}
    # ---------------- tobacco ----------------
    prices = excise.TOBACCO_PRICE_2020
    obs_fac = pd.Series({k: (1 + v) / (1 + excise.TOBACCO_CONTROL) - 1
                         for k, (_, v) in excise.TOBACCO_FACADES.items()})

    def resid_tob(x):
        _, fac, nat, bands, _ = excise.closure_effects(x, cells, T, J, dest, prices, dept_of_dest, fr_outside)
        r = list(np.log1p(fac.values) - np.log1p(obs_fac.values))
        r.append(2 * (np.log1p(nat) - np.log1p(excise.TOBACCO_NATIONAL)))
        r += list(0.5 * (np.log1p(bands.values) - np.log1p(np.array(list(excise.TOBACCO_DISTANCE.values())))))
        dep_ = excise.closure_effects(x, cells, T, J, dest, prices, dept_of_dest, fr_outside)[0]
        obs_d = pd.Series(excise.TOBACCO_DEPTS)
        pred_d = dep_.change.reindex(obs_d.index)
        r += list(0.7 * (np.log1p(pred_d.values) - np.log1p((1 + obs_d.values) / (1 + excise.TOBACCO_CONTROL) - 1)))
        return np.array(r)

    fit = excise.fit(resid_tob, np.array([np.log(0.2), 0.02, 2.5, -1.0]))
    dep, fac, nat, bands, S = excise.closure_effects(fit.x, cells, T, J, dest, prices, dept_of_dest, fr_outside)
    results["tobacco"] = {"params": fit.x, "fac": fac, "obs_fac": obs_fac, "nat": nat, "bands": bands,
                          "dep": dep, "S": S}

    # ---------------- fuel (gasoline) ----------------
    obs_fuel, noise, w = fuel_targets()
    fprices = excise.FUEL_PRICE_2020

    def resid_fuel(x):
        dep_, *_ = excise.closure_effects(x, cells, T, J, dest, fprices, dept_of_dest, fr_outside)
        pred = w * dep_.change.reindex(obs_fuel.index)
        return ((pred - obs_fuel) / noise).fillna(0).values

    null_cost = 0.5 * float(((obs_fuel / noise) ** 2).sum())
    transfer_cost = 0.5 * float((resid_fuel(fit.x) ** 2).sum())
    b_t, g_t = fit.x[1], fit.x[2]
    ffit = excise.fit(resid_fuel, np.array([fit.x[0], b_t, g_t]),
                      lower=(-15, b_t - 1e-9, g_t - 1e-9), upper=(5, b_t + 1e-9, g_t + 1e-9))
    fx = np.r_[ffit.x, fit.x[3]]
    print(f"  fuel: cost null={null_cost:.2f}, tobacco params={transfer_cost:.2f}, "
          f"kappa refit={ffit.cost:.2f}")
    fdep, ffac, fnat, fbands, FS = excise.closure_effects(fx, cells, T, J, dest, fprices,
                                                          dept_of_dest, fr_outside)
    results["fuel"] = {"params": fx, "dep": fdep, "obs": obs_fuel, "w": w, "noise": noise,
                       "nat": fnat, "S": FS, "costs": {"null": null_cost, "tobacco_params": transfer_cost,
                                                       "kappa_refit": float(ffit.cost)}}

    # ---------------- outputs ----------------
    rows = []
    for prod, pr in (("tobacco", prices), ("fuel", fprices)):
        Sx = results[prod]["S"]
        fr = (cells.country == "FR").values
        pop = cells["pop"].values
        for k in Sx.columns:
            out_ = (pop[fr] * Sx[k].values[fr]).sum()                  # FR residents buying in k
            in_ = (pop[cells.country.values == k] * Sx["FR"].values[cells.country.values == k]).sum() \
                if "FR" in Sx else 0.0
            if k != "FR":
                rows.append({"product": prod, "neighbour": k,
                             "fr_residents_buying_there_popeq": out_,
                             "their_residents_buying_in_fr_popeq": in_})
    flows = pd.DataFrame(rows)
    fr_cons = cells.loc[cells.country == "FR", "pop"].sum() + fr_outside
    flows["fr_share_of_national_consumption"] = flows.fr_residents_buying_there_popeq / fr_cons
    # EUR: cigarettes only, 2020 legal deliveries (DGDDI) x 2020 pack price
    ods = pd.read_excel(C.RAW / "tabac_ventes.ods", engine="odf", header=0)
    ods = ods[(ods.Mois.astype(str).str.endswith("2020")) & (ods.Localisation == "France continentale")]
    legal_eur = ods["Cigarettes_unité"].sum() / 20 * excise.TOBACCO_PRICE_2020["FR"]
    tob = flows["product"] == "tobacco"
    abroad_total = flows.loc[tob, "fr_share_of_national_consumption"].sum()
    flows.loc[tob, "eur_cigarettes_2020"] = (flows.loc[tob, "fr_share_of_national_consumption"]
                                             * legal_eur / (1 - abroad_total))
    print(f"  legal cigarette sales 2020 (continental France): {legal_eur / 1e9:.1f} bn EUR; "
          f"share of consumption bought abroad: {abroad_total:.1%}")

    t, f = results["tobacco"], results["fuel"]
    params = pd.DataFrame([
        {"product": "tobacco", "kappa": np.exp(t["params"][0]), "beta_per_min": t["params"][1],
         "gamma": t["params"][2], "theta_CH": np.exp(t["params"][3])},
        {"product": "fuel", "kappa": np.exp(f["params"][0]), "beta_per_min": f["params"][1],
         "gamma": f["params"][2], "theta_CH": np.exp(f["params"][3])}])
    fit_tob = pd.DataFrame({"observed_net_of_control": obs_fac, "model": t["fac"]})
    fit_tob.loc["National (INSEE)"] = [excise.TOBACCO_NATIONAL, t["nat"]]
    for (a, b), v in excise.TOBACCO_DISTANCE.items():
        fit_tob.loc[f"{a}-{b} min from border (INSEE)"] = [v, t["bands"][(a, b)]]
    fit_fuel = pd.DataFrame({"observed_2020_vs_2019_net_of_control": f["obs"],
                             "model_annual": f["w"] * f["dep"].change.reindex(f["obs"].index),
                             "model_during_closure": f["dep"].change.reindex(f["obs"].index)})
    dep_out = pd.DataFrame({
        "tobacco_sales_gain_if_closed": t["dep"].change,
        "fuel_sales_gain_if_closed": f["dep"].change,
    }).reindex(excise.BORDER_DEPTS)

    params.to_csv(C.OUT / "excise_parameters.csv", index=False, float_format="%.4g")
    dep_t = t["dep"].change
    for d_, v in excise.TOBACCO_DEPTS.items():
        fit_tob.loc[f"{d_} (Apr-May)"] = [(1 + v) / (1 + excise.TOBACCO_CONTROL) - 1, dep_t.get(d_, np.nan)]
    fit_tob.to_csv(C.OUT / "excise_fit_tobacco.csv", float_format="%.4g")
    (C.OUT / "excise_fuel_test.json").write_text(json.dumps(f["costs"], indent=1))
    fit_fuel.to_csv(C.OUT / "excise_fit_fuel.csv", float_format="%.4g")
    flows.to_csv(C.OUT / "excise_flows.csv", index=False, float_format="%.5g")
    dep_out.to_csv(C.OUT / "excise_departements.csv", float_format="%.4g")

    pd.set_option("display.width", 200)
    print("\nParameters:\n", params.round(4).to_string(index=False))
    print(f"\nTobacco fit (cost {fit.cost:.4f}):\n", fit_tob.round(3))
    print(f"\nFuel fit (w = {f['w']:.3f}, noise SD = {f['noise']:.3f}, cost {ffit.cost:.2f}):\n",
          fit_fuel.round(3).sort_values("observed_2020_vs_2019_net_of_control"))
    print("\nFlows (population-equivalents of full consumption):\n", flows.round(4).to_string(index=False))
    print("\nBorder départements, sales gain if borders closed:\n", dep_out.round(3))


if __name__ == "__main__":
    main()
