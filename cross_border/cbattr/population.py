"""Residents near the border, from the Eurostat/GISCO 1 km census grid (2021)."""
import duckdb
import geopandas as gpd
import numpy as np
import pandas as pd
import requests

from . import config as C
from .geo import assign_country


def grid_path():
    p = C.RAW / "grid_1km.parquet"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        with requests.get(C.GISCO_GRID, stream=True, timeout=900) as r:
            r.raise_for_status()
            with open(p, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
    return p


def demand_cells(cn, areas, places, area=None):
    """2 km population cells within the demand buffer, tagged with a country.

    places: OSM settlements (used only for countries missing from the grid).
    """
    area = areas["demand"] if area is None else area
    minx, miny, maxx, maxy = area.bounds
    q = f"""
        select X_LLC + 500 as x, Y_LLC + 500 as y, TOT_P_2021 as pop,
               NUTS2024_3 as nuts3
        from '{grid_path()}'
        where TOT_P_2021 > 0
          and X_LLC between {minx - 1000} and {maxx}
          and Y_LLC between {miny - 1000} and {maxy}
    """
    df = duckdb.sql(q).df()
    pts = gpd.GeoSeries(gpd.points_from_xy(df.x, df.y), crs=C.CRS)
    inside = pts.within(area).values
    df = df[inside].reset_index(drop=True)
    df["country"] = assign_country(gpd.GeoSeries(gpd.points_from_xy(df.x, df.y), crs=C.CRS), cn).values
    df = df.dropna(subset=["country"])

    # Andorra / Monaco are (largely) absent from the grid: spread the national total over
    # OSM settlements, proportional to their tagged population (or equally).
    extra = []
    for c, total in C.GRID_MISSING_POP.items():
        p = places[places.country == c]
        if p.empty or df.loc[df.country == c, "pop"].sum() > 0.2 * total:
            continue
        w = p["population"].fillna(0).clip(lower=0).values.astype(float)
        w = w / w.sum() if w.sum() > 0 else np.full(len(p), 1 / len(p))
        extra.append(pd.DataFrame({"x": p.geometry.x.values, "y": p.geometry.y.values,
                                   "pop": total * w, "country": c, "nuts3": c}))
    if extra:
        df = pd.concat([df, *extra], ignore_index=True)

    # aggregate to DEMAND_CELL_KM cells, keeping country as part of the key so
    # that a cell straddling a border is split into one record per side
    size = C.DEMAND_CELL_KM * 1000
    df["gx"] = (df.x // size).astype(int)
    df["gy"] = (df.y // size).astype(int)
    df["wx"] = df.x * df["pop"]
    df["wy"] = df.y * df["pop"]
    key = ["gx", "gy", "country"]
    g = df.groupby(key, as_index=False)[["pop", "wx", "wy"]].sum()
    main_nuts = df.sort_values("pop").groupby(key).nuts3.last()
    g["nuts3"] = main_nuts.reindex(pd.MultiIndex.from_frame(g[key])).values
    g["x"] = g.wx / g["pop"]   # population-weighted centroid
    g["y"] = g.wy / g["pop"]
    g["nuts3"] = [pick_nuts(c, k) for c, k in zip(g.nuts3, g.country)]
    g = g[g["pop"] >= 5].drop(columns=["wx", "wy"]).reset_index(drop=True)
    d = gpd.GeoSeries(gpd.points_from_xy(g.x, g.y), crs=C.CRS)
    g["dist_border_km"] = d.distance(areas["border_line"]).values / 1000
    return g


def pick_nuts(code, country):
    """Grid cells on a border carry codes like 'FRL03-ITC16': keep the part
    that belongs to the cell's own country (Monaco/Andorra have no NUTS)."""
    if country in ("MC", "AD"):
        return country
    if not isinstance(code, str) or not code:
        return None
    parts = code.split("-")
    own = [p for p in parts if p.startswith(country)]
    return own[0] if own else parts[0]


def nuts3_at(xy):
    """NUTS 2024 level-3 code of the 1 km grid cell containing each point."""
    df = pd.DataFrame({"i": range(len(xy)),
                       "X": (np.floor(xy[:, 0] / 1000) * 1000).astype(int),
                       "Y": (np.floor(xy[:, 1] / 1000) * 1000).astype(int)})
    con = duckdb.connect()
    con.register("pts", df)
    r = con.sql(f"""select pts.i, g.NUTS2024_3 as nuts3 from pts
                    left join '{grid_path()}' g on g.X_LLC = pts.X and g.Y_LLC = pts.Y""").df()
    return r.drop_duplicates("i").set_index("i").nuts3.reindex(range(len(xy))).values


def nuts_names():
    p = C.RAW / "NUTS_AT_2024.csv"
    if not p.exists():
        r = requests.get(C.GISCO_NUTS_NAMES, timeout=120)
        r.raise_for_status()
        p.write_bytes(r.content)
    names = pd.read_csv(p).set_index("NUTS_ID").NAME_LATN.str.strip()
    return pd.concat([names, pd.Series({"MC": "Monaco", "AD": "Andorra"})])
