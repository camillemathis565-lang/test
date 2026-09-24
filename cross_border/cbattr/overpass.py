"""Tiled, cached Overpass API downloads (OpenStreetMap data, ODbL)."""
import gzip
import hashlib
import json
import time
from concurrent.futures import ThreadPoolExecutor

import subprocess

from . import config as C

SUPPLY_QUERY = """[out:json][timeout:300];
(
  nwr["shop"]({bb});
  nwr["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|biergarten|cinema|theatre|marketplace)$"]({bb});
  node["place"~"^(city|town|village)$"]({bb});
);
out tags center qt;
(
  way["landuse"="retail"]({bb});
  relation["landuse"="retail"]({bb});
  way["shop"="mall"]({bb});
);
out geom qt;
"""

ROADS_QUERY = """[out:json][timeout:300];
way["highway"~"^({classes})$"]({bb});
out body qt;
>;
out skel qt;
"""


def _fetch(query, tag):
    C.CACHE.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha1(query.encode()).hexdigest()[:16]
    path = C.CACHE / f"{tag}_{key}.json.gz"
    if path.exists():
        with gzip.open(path, "rt") as f:
            return json.load(f)
    last = None
    for attempt in range(6):
        url = C.OVERPASS_URLS[attempt % len(C.OVERPASS_URLS)] if attempt >= 3 else C.OVERPASS_URLS[0]
        try:
            # the openstreetmap.fr instance only serves whitelisted clients (curl)
            r = subprocess.run(["curl", "-sS", "-m", "420", "-w", "\n%{http_code}",
                                "--data-urlencode", "data@-", url],
                               input=query, capture_output=True, text=True)
            body, _, code = r.stdout.rpartition("\n")
            if code == "200" and body.lstrip().startswith("{"):
                data = json.loads(body)
                if "remark" in data and "runtime error" in data["remark"]:
                    raise RuntimeError(data["remark"])
                with gzip.open(path, "wt") as f:
                    json.dump(data, f)
                return data
            last = f"HTTP {code}: {body[:200]} {r.stderr[:200]}"
        except Exception as e:  # network errors, timeouts
            last = repr(e)
        time.sleep(10 * (attempt + 1))
    raise RuntimeError(f"Overpass failed for {tag}: {last}")


def fetch_tiles(kind, tiles, workers=2):
    """Download every tile; returns the concatenated, de-duplicated elements."""
    def one(t):
        bb = ",".join(str(v) for v in t)
        if kind == "supply":
            q = SUPPLY_QUERY.format(bb=bb)
        else:
            q = ROADS_QUERY.format(bb=bb, classes="|".join(C.ROAD_CLASSES))
        return _fetch(q, kind)["elements"]

    seen, out = set(), []
    with ThreadPoolExecutor(workers) as ex:
        for i, elements in enumerate(ex.map(one, tiles), 1):
            for e in elements:
                k = (e["type"], e["id"], "geometry" in e or "members" in e)
                if k not in seen:
                    seen.add(k)
                    out.append(e)
            if i % 20 == 0 or i == len(tiles):
                print(f"  {kind}: {i}/{len(tiles)} tiles, {len(out):,} elements", flush=True)
    return out
