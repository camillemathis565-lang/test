"""Retail density on each side of each border, within 20 km (OpenStreetMap, both sides)."""
import sys
sys.path.insert(0, ".")
import geopandas as gpd
import numpy as np
import pandas as pd
from cbattr import config as C, geo, overpass, supply, population

cn = geo.countries(); b = geo.land_borders(cn); areas = geo.study_areas(cn, b)
els = overpass.fetch_tiles("supply", geo.tiles(areas["supply"]))
places, shops, hosp, markets, retail = supply.parse(els, cn)
shops = shops[shops.group.isin(["everyday", "personal", "household", "leisure", "anchor"])]
cells = population.demand_cells(cn, areas, places)
cg = gpd.GeoSeries(gpd.points_from_xy(cells.x, cells.y), crs=C.CRS)
MERGE = {"MC": "IT", "AD": "ES"}
def nearest(gs):
    d = pd.DataFrame({c: gs.distance(b.loc[c, "geometry"]).values / 1000 for c in b.index})
    return d.min(axis=1).values, d.idxmin(axis=1).map(lambda c: MERGE.get(c, c)).values
cells["d"], cells["nb"] = nearest(cg)
sg = shops.geometry.reset_index(drop=True)
shops = shops.reset_index(drop=True)
shops["d"], shops["nb"] = nearest(sg)
rows = []
for nb in ["BE", "LU", "DE", "CH", "IT", "ES"]:
    for side in ["FR", nb]:
        own = [side] + ([k for k, v in MERGE.items() if v == side] if side != "FR" else [])
        c = cells[(cells.d < 20) & (cells.nb == nb) & cells.country.isin(own)]
        s = shops[(shops.d < 20) & (shops.nb == nb) & shops.country.isin(own)]
        rows.append({"border": nb, "side": "France" if side == "FR" else "Neighbour",
                     "residents": c["pop"].sum(), "shops": len(s),
                     "shops_per_1000": len(s) / c["pop"].sum() * 1000,
                     "comparison_share": s.group.isin(["personal", "household", "leisure", "anchor"]).mean()})
r = pd.DataFrame(rows)
r.to_csv("report_docx/data/both_sides_osm.csv", index=False, float_format="%.4f")
print(r.round(3).to_string(index=False))
