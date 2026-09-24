"""Country polygons, French land borders and the study-area buffers."""
import geopandas as gpd
import numpy as np
import requests
from shapely.geometry import box
from shapely.ops import unary_union

from . import config as C

METRO_FR_BBOX = box(-5.5, 41.0, 10.0, 51.5)  # excludes overseas territories


def _download(url, path):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        r = requests.get(url, timeout=600)
        r.raise_for_status()
        path.write_bytes(r.content)
    return path


def countries():
    """Metropolitan France and its land neighbours, in the metric CRS."""
    path = _download(C.GISCO_COUNTRIES, C.RAW / "countries_01m.geojson")
    g = gpd.read_file(path)
    g = g[g.CNTR_ID.isin(["FR", *C.NEIGHBOURS])][["CNTR_ID", "geometry"]].copy()
    fr = g.CNTR_ID == "FR"
    g.loc[fr, "geometry"] = g.loc[fr, "geometry"].intersection(METRO_FR_BBOX)
    return g.to_crs(C.CRS).set_index("CNTR_ID")


def land_borders(cn):
    """One (Multi)LineString per neighbour: the France–neighbour land border."""
    fr_line = cn.loc["FR", "geometry"].boundary
    rows = []
    for c in C.NEIGHBOURS:
        seg = fr_line.intersection(cn.loc[c, "geometry"].buffer(50))
        rows.append({"CNTR_ID": c, "length_km": seg.length / 1000, "geometry": seg})
    return gpd.GeoDataFrame(rows, crs=C.CRS).set_index("CNTR_ID")


def study_areas(cn, borders):
    """Buffers around all French land borders, clipped to the 9 countries."""
    line = unary_union(borders.geometry.values)
    land = unary_union(cn.geometry.values)
    return {
        "border_line": line,
        "demand": line.buffer(C.DEMAND_BUFFER_KM * 1000).intersection(land),
        "supply": line.buffer(C.SUPPLY_BUFFER_KM * 1000).intersection(land),
        "network": line.buffer(C.NETWORK_BUFFER_KM * 1000).intersection(land),
    }


def assign_country(points, cn):
    """Country code of each point geometry (GeoSeries in C.CRS); None outside."""
    j = gpd.sjoin(gpd.GeoDataFrame(geometry=points, crs=C.CRS),
                  cn.reset_index()[["CNTR_ID", "geometry"]], how="left",
                  predicate="within")
    j = j[~j.index.duplicated()]
    return j["CNTR_ID"].reindex(points.index)


def tiles(area, step=C.TILE_DEG):
    """WGS84 query tiles (s, w, n, e) covering a polygon given in C.CRS."""
    a = gpd.GeoSeries([area], crs=C.CRS).to_crs(C.WGS84).iloc[0]
    w, s, e, n = a.bounds
    out = []
    for x in np.arange(np.floor(w / step) * step, e, step):
        for y in np.arange(np.floor(s / step) * step, n, step):
            t = box(x, y, x + step, y + step)
            if t.intersects(a):
                out.append((round(y, 4), round(x, 4), round(y + step, 4), round(x + step, 4)))
    return out
