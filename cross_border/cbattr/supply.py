"""Shopping destinations: city centres and peripheral commercial zones.

A *city centre* is the area within CENTRE_RADIUS_M of an OSM place=city/town
node. A *commercial zone* is a cluster of landuse=retail / shop=mall polygons
(>= ZONE_MIN_HA) that does not overlap a city centre. Shops inside a zone
belong to it; the remaining shops belong to the nearest centre in range.
"""
import re

import geopandas as gpd
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
from shapely.geometry import LineString, Polygon
from shapely.ops import polygonize, unary_union

from . import config as C
from .geo import assign_country

GROUP_OF = {v: g for g, vals in C.SHOP_GROUPS.items() for v in vals}


def _pop(v):
    if not v:
        return np.nan
    m = re.match(r"^\s*([\d\s.,']+)", str(v))
    if not m:
        return np.nan
    digits = re.sub(r"[^\d]", "", m.group(1))
    return float(digits) if digits else np.nan


def parse(elements, cn):
    """Split raw Overpass elements into places, shops, hospitality, polygons."""
    pts, polys = [], []
    for e in elements:
        t = e.get("tags", {})
        if "geometry" in e or "members" in e:
            polys.append(e)
            continue
        if e["type"] == "node":
            lat, lon = e.get("lat"), e.get("lon")
        else:
            c = e.get("center") or {}
            lat, lon = c.get("lat"), c.get("lon")
        if lat is None:
            continue
        pts.append({
            "osm": f"{e['type'][0]}{e['id']}", "lat": lat, "lon": lon,
            "shop": t.get("shop"), "amenity": t.get("amenity"), "place": t.get("place"),
            "name": t.get("name:fr") or t.get("name"),
            "population": _pop(t.get("population")),
            "branded": bool(t.get("brand") or t.get("brand:wikidata")),
            "is_way": e["type"] != "node",
        })
    p = pd.DataFrame(pts)
    g = gpd.GeoDataFrame(p, geometry=gpd.points_from_xy(p.lon, p.lat), crs=C.WGS84).to_crs(C.CRS)
    g["country"] = assign_country(g.geometry, cn).values
    g = g.dropna(subset=["country"])

    places = g[g.place.notna()].copy()
    shops = g[g.shop.notna() & ~g.shop.isin(C.EXCLUDED_SHOPS)].copy()
    shops["group"] = shops.shop.map(GROUP_OF)
    shops.loc[shops.shop.isin(C.SERVICE_SHOPS), "group"] = "service"
    shops["group"] = shops["group"].fillna("other")
    hosp = g[g.amenity.isin(C.HOSPITALITY)].copy()
    markets = g[g.amenity == "marketplace"].copy()

    geoms = []
    for e in polys:
        t = e.get("tags", {})
        name = t.get("name")
        if e["type"] == "way":
            coords = [(n["lon"], n["lat"]) for n in e["geometry"] if n]
            if len(coords) >= 4 and coords[0] == coords[-1]:
                geoms.append({"name": name, "mall": t.get("shop") == "mall",
                              "geometry": Polygon(coords)})
        else:
            lines = [LineString([(n["lon"], n["lat"]) for n in m["geometry"]])
                     for m in e.get("members", []) if m.get("role") == "outer"
                     and m.get("geometry") and len(m["geometry"]) >= 2]
            for poly in polygonize(lines):
                geoms.append({"name": name, "mall": False, "geometry": poly})
    retail = gpd.GeoDataFrame(geoms, crs=C.WGS84).to_crs(C.CRS)
    retail = retail[retail.is_valid & (retail.area > 0)]
    return places, shops, hosp, markets, retail


def _zones(retail, centres):
    """Merge nearby retail polygons into zones, drop those inside centres."""
    half = C.ZONE_MERGE_M / 2
    merged = unary_union(retail.geometry.buffer(half).values).buffer(-half)
    parts = gpd.GeoDataFrame(geometry=list(getattr(merged, "geoms", [merged])), crs=C.CRS)
    parts = parts[parts.area >= C.ZONE_MIN_HA * 1e4].reset_index(drop=True)
    circles = centres.geometry.buffer(centres.radius)
    hit = gpd.sjoin(parts, gpd.GeoDataFrame(geometry=circles.values, crs=C.CRS),
                    predicate="intersects").index.unique()
    parts = parts.drop(index=hit).reset_index(drop=True)
    parts["area_ha"] = parts.area / 1e4
    # name: largest named mall / retail polygon inside
    named = retail[retail.name.notna()].copy()
    named["a"] = named.area
    j = gpd.sjoin(named, parts[["geometry"]], predicate="intersects")
    best = j.sort_values(["mall", "a"], ascending=False).groupby("index_right").name.first()
    parts["zone_name"] = best.reindex(parts.index).values
    return parts


def destinations(places, shops, hosp, markets, retail, areas):
    in_supply = places.within(areas["supply"])
    centres = places[places.place.isin(C.CENTRE_PLACES) & in_supply].copy()
    centres["radius"] = centres.place.map(C.CENTRE_RADIUS_M)
    centres = centres.reset_index(drop=True)
    zones = _zones(retail[retail.intersects(areas["supply"])], centres)

    def assign(points):
        """-> Series of destination keys ('Z12' / 'C5') or NaN."""
        key = pd.Series(np.nan, index=points.index, dtype=object)
        j = gpd.sjoin(gpd.GeoDataFrame(geometry=points.geometry, crs=C.CRS),
                      gpd.GeoDataFrame(geometry=zones.buffer(C.ZONE_SHOP_TOLERANCE_M), crs=C.CRS),
                      predicate="within")
        j = j[~j.index.duplicated()]
        key.loc[j.index] = "Z" + j.index_right.astype(str)
        rest = key.isna()
        if rest.any():
            tree = cKDTree(np.c_[centres.geometry.x, centres.geometry.y])
            xy = np.c_[points.geometry.x[rest], points.geometry.y[rest]]
            dist, idx = tree.query(xy, k=4, distance_upper_bound=max(C.CENTRE_RADIUS_M.values()))
            # nearest centre whose own radius covers the shop
            chosen = np.full(len(xy), -1)
            for k in range(dist.shape[1]):
                ok = (chosen < 0) & np.isfinite(dist[:, k])
                ii = np.where(ok, idx[:, k], 0)
                ok &= dist[:, k] <= centres.radius.values[ii]
                chosen[ok] = idx[ok, k]
            k2 = pd.Series(np.where(chosen >= 0, "C" + chosen.astype(str), None),
                           index=points.index[rest])
            key.loc[k2.index] = k2.values
        return key

    shops = shops.copy()
    shops["dest"] = assign(shops)
    hosp_dest = assign(hosp)
    market_dest = assign(markets)

    s = shops.dropna(subset=["dest"])
    counts = s.pivot_table(index="dest", columns="group", values="osm", aggfunc="count",
                           fill_value=0)
    for gname in [*C.SHOP_GROUPS, "service", "other"]:
        if gname not in counts:
            counts[gname] = 0
    d = counts.copy()
    d["supermarkets"] = s[s.shop == "supermarket"].groupby("dest").size()
    d["n_retail"] = counts[[*C.SHOP_GROUPS, "other"]].sum(axis=1)
    d["n_hospitality"] = hosp_dest.value_counts()
    d["n_markets"] = market_dest.value_counts()
    d["branded"] = s[s.branded].groupby("dest").size()
    d["shop_types"] = s.groupby("dest").shop.nunique()
    p = s.groupby(["dest", "shop"]).size()
    shares = p / p.groupby(level=0).transform("sum")
    d["diversity"] = np.exp(-(shares * np.log(shares)).groupby(level=0).sum())  # effective n of types
    d = d.fillna(0)

    comp = d[C.COMPARISON_GROUPS].sum(axis=1)
    W = C.MASS_WEIGHTS
    d["n_comparison"] = comp
    d["n_anchors"] = d["anchor"] + d["supermarkets"]
    d["mass_everyday"] = (d["everyday"] - d["supermarkets"]) * W["everyday"] \
        + d["supermarkets"] * C.SUPERMARKET_WEIGHT + d["n_markets"] * C.MARKETPLACE_WEIGHT
    d["mass_comparison"] = sum(d[g] * W[g] for g in C.COMPARISON_GROUPS) + d["anchor"] * W["anchor"]
    d["mass_total"] = d.mass_everyday + d.mass_comparison + d["service"] * W["service"] \
        + d["other"] * W["other"]
    d["comparison_share"] = comp / d.n_retail.replace(0, np.nan)
    d["hospitality_ratio"] = d.n_hospitality / (d.n_retail + d.n_hospitality).replace(0, np.nan)
    d["brand_share"] = d.branded / d.n_retail.replace(0, np.nan)
    d = d.fillna(0)

    # attach identity / geometry
    rows = []
    for key in d.index:
        i = int(key[1:])
        if key[0] == "C":
            c = centres.loc[i]
            rows.append({"dest": key, "type": "city_centre", "name": c["name"],
                         "place": c.place, "population": c.population,
                         "x": c.geometry.x, "y": c.geometry.y, "area_ha": np.nan})
        else:
            z = zones.loc[i]
            pt = z.geometry.representative_point()
            rows.append({"dest": key, "type": "commercial_zone", "name": z.zone_name,
                         "place": None, "population": np.nan,
                         "x": pt.x, "y": pt.y, "area_ha": z.area_ha})
    ident = pd.DataFrame(rows).set_index("dest")
    out = ident.join(d)

    keep = ((out.type == "city_centre") & (out.n_retail >= C.MIN_CENTRE_SHOPS)) | \
           ((out.type == "commercial_zone") & (out.n_retail >= C.ZONE_MIN_SHOPS))
    out = out[keep].copy()

    # commercial zones: name after the nearest settlement when unnamed
    tree = cKDTree(np.c_[places.geometry.x, places.geometry.y])
    _, ni = tree.query(np.c_[out.x, out.y])
    near = places.name.values[ni]
    out["near_town"] = near
    zmask = out.type == "commercial_zone"
    out.loc[zmask, "name"] = [f"{n} – {near_}" if isinstance(n, str) and n else f"Zone commerciale {near_}"
                              for n, near_ in zip(out.loc[zmask, "name"], out.loc[zmask, "near_town"])]
    return out.reset_index(), zones, shops


def score(dest):
    """Composite 0-100 attractiveness score + Huff masses (per segment)."""
    d = dest.copy()
    d["log_mass"] = np.log1p(d.mass_total)
    d["anchors"] = d.n_anchors
    d["diversity"] = d["diversity"]
    pct = {k: d[k].rank(pct=True) for k in C.SCORE_WEIGHTS}
    d["score"] = 100 * sum(w * pct[k] for k, w in C.SCORE_WEIGHTS.items())
    qual = {k: w for k, w in C.SCORE_WEIGHTS.items() if k != "log_mass"}
    d["quality"] = sum(w * pct[k] for k, w in qual.items()) / sum(qual.values())
    for seg, s in C.SEGMENTS.items():
        d[f"huff_mass_{seg}"] = d[s["mass"]] * (0.5 + d.quality)
    d["rank"] = d.score.rank(ascending=False, method="min").astype(int)
    return d
