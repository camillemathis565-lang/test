"""Huff spatial-interaction model with border friction and price differentials.

For a resident cell i and destination j, in spending segment s:

    U_ij = A_j^alpha * exp(-beta * t_ij) * theta^[border crossed] * (PLI_j / PLI_i)^-gamma
    P_ij = U_ij / sum_k U_ik
    F_ij = pop_i * spend_s(country_i) * P_ij        (EUR / year)
"""
import numpy as np
import pandas as pd

from . import config as C


def friction_matrix(dest_cty, cell_cty, scale=1.0):
    """theta for each (destination, cell) pair; 1 when no border is crossed."""
    th = np.ones((len(dest_cty), len(cell_cty)), dtype=np.float32)
    dc, cc = np.asarray(dest_cty), np.asarray(cell_cty)
    for a in np.unique(dc):
        for b in np.unique(cc):
            if a == b:
                continue
            # the less permeable of the two countries sets the friction
            t = min(C.BORDER_FRICTION.get(a, C.BORDER_FRICTION["default"]),
                    C.BORDER_FRICTION.get(b, C.BORDER_FRICTION["default"]))
            t = min(1.0, t * scale)
            th[np.ix_(dc == a, cc == b)] = t
    return th


def run(dest, cells, T, pli, spend, theta_scale=1.0, gamma=C.PRICE_GAMMA):
    """Returns {segment: flow matrix F (dest x cells, EUR/yr)}."""
    th = friction_matrix(dest.country, cells.country, theta_scale)
    flows = {}
    for seg, s in C.SEGMENTS.items():
        A = dest[f"huff_mass_{seg}"].values.astype(np.float64)
        p_d = pli[seg].reindex(dest.country).values
        p_c = pli[seg].reindex(cells.country).values
        price = (p_d[:, None] / p_c[None, :]) ** (-gamma)
        U = (A[:, None] ** s["alpha"]) * np.exp(-s["beta"] * T) * th * price
        U[~np.isfinite(T)] = 0
        tot = U.sum(axis=0)
        P = np.divide(U, tot, out=np.zeros_like(U), where=tot > 0)
        budget = cells["pop"].values * spend[seg].reindex(cells.country).values
        flows[seg] = (P * budget[None, :]).astype(np.float32)
    return flows


def summarise(dest, cells, flows):
    """Tables: destination turnover, country-pair flows, cell leakage."""
    d = dest[["dest", "name", "type", "country"]].copy()
    cell_c = cells.country.values
    pair_rows = []
    leak = {}
    for seg, F in flows.items():
        d[f"turnover_{seg}"] = F.sum(axis=1)
        foreign = cell_c[None, :] != d.country.values[:, None]
        d[f"foreign_{seg}"] = (F * foreign).sum(axis=1)
        for oc in np.unique(cell_c):
            colmask = cell_c == oc
            sub = F[:, colmask].sum(axis=1)
            tmp = pd.DataFrame({"dest_country": d.country, "dest_type": d.type, "v": sub})
            for (dc, dt), v in tmp.groupby(["dest_country", "dest_type"]).v.sum().items():
                pair_rows.append({"segment": seg, "origin": oc, "dest_country": dc,
                                  "dest_type": dt, "eur": v})
        out = (F * (cell_c[None, :] != d.country.values[:, None])).sum(axis=0)
        leak[seg] = np.divide(out, F.sum(axis=0), out=np.zeros(F.shape[1]),
                              where=F.sum(axis=0) > 0)
    d["turnover"] = sum(d[f"turnover_{s}"] for s in flows)
    d["foreign"] = sum(d[f"foreign_{s}"] for s in flows)
    d["foreign_share"] = d.foreign / d.turnover.replace(0, np.nan)
    pairs = pd.DataFrame(pair_rows)
    return d, pairs, leak


def border_balance(pairs):
    """France <-> neighbour flows, both directions, and the balance index."""
    rows = []
    p = pairs.groupby(["segment", "origin", "dest_country"]).eur.sum()
    for seg in list(C.SEGMENTS) + ["all"]:
        q = p.groupby(level=[1, 2]).sum() if seg == "all" else p.loc[seg]
        for nb in C.NEIGHBOURS:
            out_ = q.get(("FR", nb), 0.0)   # French residents spending in nb
            in_ = q.get((nb, "FR"), 0.0)    # nb residents spending in France
            rows.append({"segment": seg, "neighbour": nb,
                         "fr_to_nb_eur": out_, "nb_to_fr_eur": in_,
                         "net_for_france_eur": in_ - out_,
                         "balance_index": (in_ - out_) / (in_ + out_) if in_ + out_ else np.nan})
    return pd.DataFrame(rows)
