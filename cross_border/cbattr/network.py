"""Road travel times on the OSM major-road network (motorway..secondary)."""
import numpy as np
import pandas as pd
from pyproj import Transformer
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy.spatial import cKDTree

from . import config as C


def build_graph(elements):
    """Contract OSM ways into an undirected graph weighted in minutes.

    Returns (csr_matrix, vertex_xy) restricted to the largest connected
    component. One-way restrictions are ignored (fine at this scale).
    """
    nodes = {e["id"]: (e["lon"], e["lat"]) for e in elements if e["type"] == "node"}
    ways = [e for e in elements if e["type"] == "way" and "nodes" in e
            and e.get("tags", {}).get("highway") in C.ROAD_CLASSES]
    ids = np.fromiter(nodes.keys(), dtype=np.int64)
    lonlat = np.array(list(nodes.values()))
    x, y = Transformer.from_crs(C.WGS84, C.CRS, always_xy=True).transform(lonlat[:, 0], lonlat[:, 1])
    pos = pd.Series(np.arange(len(ids)), index=ids)

    use = np.zeros(len(ids), dtype=np.int32)
    seqs = []
    for w in ways:
        s = pos.reindex(w["nodes"]).dropna().astype(int).values
        if len(s) < 2:
            continue
        seqs.append((s, C.ROAD_CLASSES[w["tags"]["highway"]]))
        use[s] += 1
        use[s[0]] += 1
        use[s[-1]] += 1
    is_vertex = use >= 2

    src, dst, cost = [], [], []
    for s, kmh in seqs:
        seg = np.hypot(np.diff(x[s]), np.diff(y[s]))       # metres
        minutes = seg / 1000 / kmh * 60
        cut = np.where(is_vertex[s])[0]
        cum = np.concatenate([[0], np.cumsum(minutes)])
        for a, b in zip(cut[:-1], cut[1:]):
            if b > a:
                src.append(s[a]); dst.append(s[b]); cost.append(cum[b] - cum[a])
    src, dst, cost = map(np.asarray, (src, dst, cost))
    verts = np.unique(np.concatenate([src, dst]))
    remap = pd.Series(np.arange(len(verts)), index=verts)
    e = pd.DataFrame({"i": remap[src].values, "j": remap[dst].values, "c": cost})
    e = e[e.i != e.j]
    swap = e.i > e.j
    e.loc[swap, ["i", "j"]] = e.loc[swap, ["j", "i"]].values
    e = e.groupby(["i", "j"], as_index=False).c.min()   # parallel edges: keep fastest
    n = len(verts)
    g = coo_matrix((np.maximum(e.c.values, 1e-3), (e.i.values, e.j.values)), shape=(n, n)).tocsr()
    ncomp, lab = connected_components(g, directed=False)
    main = lab == np.bincount(lab).argmax()
    keep = np.where(main)[0]
    g = g[keep][:, keep]
    xy = np.c_[x[verts[keep]], y[verts[keep]]]
    print(f"  road graph: {len(ways):,} ways -> {g.shape[0]:,} vertices, "
          f"{g.nnz:,} edges ({ncomp} components, largest kept)")
    return g, xy


def travel_times(g, vxy, dest_xy, cell_xy, batch=64):
    """Minutes by road from each destination to each demand cell (float32,
    np.inf beyond MAX_TRAVEL_MIN). Includes access legs at ACCESS_SPEED_KMH."""
    tree = cKDTree(vxy)
    d_dist, d_v = tree.query(dest_xy)
    c_dist, c_v = tree.query(cell_xy)
    to_min = 60 / (C.ACCESS_SPEED_KMH * 1000)
    d_acc, c_acc = d_dist * to_min, c_dist * to_min
    uniq, inv = np.unique(d_v, return_inverse=True)
    T = np.full((len(dest_xy), len(cell_xy)), np.inf, dtype=np.float32)
    for k in range(0, len(uniq), batch):
        rows = uniq[k:k + batch]
        dm = dijkstra(g, directed=False, indices=rows, limit=C.MAX_TRAVEL_MIN)
        sub = dm[:, c_v]                                          # (batch, cells)
        for r in range(len(rows)):
            for di in np.where(inv == k + r)[0]:
                t = sub[r] + d_acc[di] + c_acc
                T[di] = np.where(t <= C.MAX_TRAVEL_MIN, t, np.inf)
        print(f"  travel times: {min(k + batch, len(uniq))}/{len(uniq)} origins", flush=True)
    return T, d_acc, c_acc
