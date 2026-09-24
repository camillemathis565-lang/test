"""Cross-border commercial attractiveness along all French land borders.

    python download.py        # 1. fetch & cache OSM data (slow, once)
    python run_pipeline.py    # 2. model -> outputs/

See README.md for the method and caveats.
"""
import json
import pickle

import geopandas as gpd
import numpy as np
import pandas as pd

from cbattr import config as C
from cbattr import geo, huff, network, overpass, population, prices, supply


def cached(name, fn):
    p = C.CACHE / f"{name}.pkl"
    if p.exists():
        return pickle.loads(p.read_bytes())
    v = fn()
    p.write_bytes(pickle.dumps(v))
    return v


def main():
    C.OUT.mkdir(exist_ok=True)
    print("1/7 borders & study area")
    cn = geo.countries()
    borders = geo.land_borders(cn)
    areas = geo.study_areas(cn, borders)

    print("2/7 shops, centres, commercial zones")
    elements = overpass.fetch_tiles("supply", geo.tiles(areas["supply"]))
    places, shops, hosp, markets, retail = supply.parse(elements, cn)
    dest, zones, shops = supply.destinations(places, shops, hosp, markets, retail, areas)
    xy = dest[["x", "y"]].values
    dest["country"] = geo.assign_country(gpd.GeoSeries(gpd.points_from_xy(xy[:, 0], xy[:, 1]),
                                                       crs=C.CRS), cn).values
    dest = dest.dropna(subset=["country"]).reset_index(drop=True)
    dest = supply.score(dest)
    dest["nuts3"] = population.nuts3_at(dest[["x", "y"]].values)
    dest["dist_border_km"] = gpd.GeoSeries(gpd.points_from_xy(dest.x, dest.y), crs=C.CRS) \
        .distance(areas["border_line"]).values / 1000
    print(f"  {len(shops):,} shops -> {(dest.type == 'city_centre').sum()} city centres, "
          f"{(dest.type == 'commercial_zone').sum()} commercial zones")

    print("3/7 residents")
    cells = population.demand_cells(cn, areas, places)
    print(f"  {len(cells):,} cells, {cells['pop'].sum():,.0f} residents within "
          f"{C.DEMAND_BUFFER_KM} km of a French land border")

    print("4/7 road network & travel times")
    def _tt():
        roads = overpass.fetch_tiles("roads", geo.tiles(areas["network"]))
        g, vxy = network.build_graph(roads)
        return network.travel_times(g, vxy, dest[["x", "y"]].values, cells[["x", "y"]].values)
    T, _, _ = cached(f"tt_{len(dest)}_{len(cells)}", _tt)
    reach = np.isfinite(T).any(axis=0)
    print(f"  {reach.mean():.1%} of cells reach at least one destination "
          f"within {C.MAX_TRAVEL_MIN} min")

    print("5/7 prices & Huff model")
    pli, spend, years = prices.price_and_spend()
    flows = huff.run(dest, cells, T, pli, spend)
    dsum, pairs, leak = huff.summarise(dest, cells, flows)
    bal = huff.border_balance(pairs)

    print("6/7 sensitivity analysis")
    sens = []
    for scale in C.SENSITIVITY_THETA_SCALE:
        for gamma in [0.0, C.PRICE_GAMMA, C.PRICE_GAMMA * 1.5]:
            f = huff.run(dest, cells, T, pli, spend, theta_scale=scale, gamma=gamma)
            _, pr, _ = huff.summarise(dest, cells, f)
            b = huff.border_balance(pr)
            b = b[b.segment == "all"].assign(theta_scale=scale, gamma=gamma)
            sens.append(b)
    sens = pd.concat(sens, ignore_index=True)

    print("7/7 writing outputs")
    names = population.nuts_names()
    dest = dest.merge(dsum.drop(columns=["name", "type", "country"]), on="dest")
    dest["nuts3_name"] = dest.nuts3.map(names)
    ll = gpd.GeoSeries(gpd.points_from_xy(dest.x, dest.y), crs=C.CRS).to_crs(C.WGS84)
    dest["lon"], dest["lat"] = ll.x.round(5), ll.y.round(5)
    cols = ["rank", "score", "name", "type", "country", "nuts3", "nuts3_name", "lon", "lat",
            "dist_border_km", "population", "area_ha", "n_retail", "n_comparison",
            "everyday", "personal", "household", "leisure", "anchor", "supermarkets",
            "service", "n_hospitality", "n_markets", "shop_types", "diversity",
            "comparison_share", "hospitality_ratio", "brand_share", "mass_everyday",
            "mass_comparison", "quality", "turnover_everyday", "turnover_comparison",
            "turnover", "foreign", "foreign_share"]
    dest.sort_values("rank")[cols].to_csv(C.OUT / "destinations.csv", index=False,
                                          float_format="%.4g")

    for seg in flows:
        cells[f"leak_{seg}"] = leak[seg]
    cells["leak_all"] = sum(leak[s] * cells["pop"] * spend[s].reindex(cells.country).values
                            for s in flows) / sum(cells["pop"] * spend[s].reindex(cells.country).values
                                                  for s in flows)
    cells["reachable"] = reach
    # NUTS3 view: residents' spending abroad + foreign spending received
    budget = {s: cells["pop"] * spend[s].reindex(cells.country).values for s in flows}
    rows = []
    for (cty, n3), idx in cells.groupby(["country", "nuts3"]).groups.items():
        idx = np.asarray(idx)
        r = {"country": cty, "nuts3": n3, "name": names.get(n3, n3),
             "residents_in_zone": cells.loc[idx, "pop"].sum()}
        for s in flows:
            b = budget[s][idx].sum()
            r[f"spend_{s}_eur"] = b
            r[f"abroad_{s}_share"] = (leak[s][idx] * budget[s][idx]).sum() / b if b else np.nan
        dm = (dest.nuts3 == n3).values
        r["destinations"] = int(dm.sum())
        r["inflow_from_abroad_eur"] = dest.loc[dm, "foreign"].sum()
        r["outflow_abroad_eur"] = sum((leak[s][idx] * budget[s][idx]).sum() for s in flows)
        r["net_eur"] = r["inflow_from_abroad_eur"] - r["outflow_abroad_eur"]
        rows.append(r)
    nuts = pd.DataFrame(rows).sort_values(["country", "nuts3"])
    nuts.to_csv(C.OUT / "nuts3_cross_border.csv", index=False, float_format="%.4g")

    pairs.to_csv(C.OUT / "country_pair_flows.csv", index=False, float_format="%.6g")
    bal.to_csv(C.OUT / "border_balance.csv", index=False, float_format="%.6g")
    sens.to_csv(C.OUT / "sensitivity.csv", index=False, float_format="%.6g")
    pd.DataFrame({"pli_" + k: v for k, v in pli.items()} | {"spend_" + k: v for k, v in spend.items()}) \
        .to_csv(C.OUT / "prices_spending.csv", float_format="%.1f")

    # compact web payload for the interactive report
    cl = gpd.GeoSeries(gpd.points_from_xy(cells.x, cells.y), crs=C.CRS).to_crs(C.WGS84)
    web = {
        "meta": {"demand_km": C.DEMAND_BUFFER_KM, "supply_km": C.SUPPLY_BUFFER_KM,
                 "max_min": C.MAX_TRAVEL_MIN, "cell_km": C.DEMAND_CELL_KM,
                 "friction": C.BORDER_FRICTION, "gamma": C.PRICE_GAMMA,
                 "segments": {k: {"alpha": v["alpha"], "beta": v["beta"]} for k, v in C.SEGMENTS.items()},
                 "price_years": years, "n_shops": int(len(shops)),
                 "residents": float(cells["pop"].sum())},
        "cells": [[round(a, 3), round(b, 3), int(p), round(float(l1), 3), round(float(l2), 3)]
                  for a, b, p, l1, l2 in zip(cl.x, cl.y, cells["pop"], cells.leak_everyday,
                                             cells.leak_comparison)],
        "dest": json.loads(dest.sort_values("rank")[cols].to_json(orient="records", double_precision=4)),
        "balance": json.loads(bal.to_json(orient="records")),
        "pairs": json.loads(pairs.to_json(orient="records")),
        "sensitivity": json.loads(sens.to_json(orient="records")),
        "nuts": json.loads(nuts.to_json(orient="records", double_precision=4)),
        "prices": {"pli": json.loads(pli.to_json()), "spend": json.loads(spend.to_json())},
    }
    simp = cn.simplify(800).to_crs(C.WGS84)
    web["countries"] = json.loads(gpd.GeoDataFrame(geometry=simp.values, crs=C.WGS84)
                                  .assign(id=simp.index).to_json())
    bl = borders.simplify(300).to_crs(C.WGS84)
    web["borders"] = json.loads(gpd.GeoDataFrame(geometry=bl.values, crs=C.WGS84)
                                .assign(id=bl.index).to_json())
    (C.OUT / "web_data.json").write_text(json.dumps(web, separators=(",", ":")))

    print("\nFrance <-> neighbours, all segments (EUR million / year):")
    b = bal[bal.segment == "all"].copy()
    for c in ["fr_to_nb_eur", "nb_to_fr_eur", "net_for_france_eur"]:
        b[c] = (b[c] / 1e6).round(0)
    print(b.drop(columns="segment").to_string(index=False))


if __name__ == "__main__":
    main()
