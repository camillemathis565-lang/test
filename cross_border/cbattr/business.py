"""Who gains and who loses from cross-border flows: chains vs independents.

Ownership proxy: an OSM shop tagged brand=* or brand:wikidata=* is a chain
(retail banner, including franchises); an untagged shop is an independent
(mostly SMEs). Markets (amenity=marketplace) count as independent.

Each destination's modelled turnover in a segment is split between its
chain and independent shops in proportion to their share of the segment's
retail mass (same weights as the Huff mass).

Impact = actual flows - counterfactual flows with closed borders
(theta = 0: nobody crosses). For a destination:
    gain_foreign   = spending by residents of other countries (0 when closed)
    loss_domestic  = domestic residents' spending now going abroad (<= 0)
    net            = gain_foreign + loss_domestic
"""
import numpy as np
import pandas as pd

from . import config as C
from . import huff


def segment_weights(shops):
    """Weight of each shop in each segment's mass (0 when not in segment)."""
    W = C.MASS_WEIGHTS
    w_every = np.where(shops.group == "everyday",
                       np.where(shops.shop == "supermarket", C.SUPERMARKET_WEIGHT, W["everyday"]), 0.0)
    w_comp = np.select([shops.group.isin(C.COMPARISON_GROUPS), shops.group == "anchor"],
                       [shops.group.map(W).fillna(0).values, W["anchor"]], 0.0)
    return pd.DataFrame({"everyday": w_every, "comparison": w_comp}, index=shops.index)


def ownership_split(dest, shops):
    """Per destination: chain share of each segment's mass, and shop counts."""
    s = shops.dropna(subset=["dest"]).copy()
    w = segment_weights(s)
    s = s.join(w)
    s["chain"] = s.branded
    in_seg = (s.everyday > 0) | (s.comparison > 0)
    g = s[in_seg].groupby(["dest", "chain"])
    mass = g[["everyday", "comparison"]].sum().unstack("chain", fill_value=0)
    count = g.size().unstack("chain", fill_value=0)
    out = pd.DataFrame(index=dest.dest)
    markets = dest.set_index("dest").n_markets * C.MARKETPLACE_WEIGHT
    for seg in C.SEGMENTS:
        ch = mass.get((seg, True), pd.Series(dtype=float)).reindex(out.index).fillna(0)
        ind = mass.get((seg, False), pd.Series(dtype=float)).reindex(out.index).fillna(0)
        if seg == "everyday":
            ind = ind + markets.reindex(out.index).fillna(0)
        tot = ch + ind
        out[f"chain_share_{seg}"] = np.where(tot > 0, ch / tot.replace(0, np.nan), 0.0)
    out["n_chain"] = count.get(True, pd.Series(dtype=float)).reindex(out.index).fillna(0).astype(int)
    out["n_indep"] = count.get(False, pd.Series(dtype=float)).reindex(out.index).fillna(0).astype(int)
    return out.reset_index()


def impact(dest, cells, T, pli, spend, shops):
    """Destination x ownership table of turnover, gains and losses (EUR/yr)."""
    actual = huff.run(dest, cells, T, pli, spend)
    closed = huff.run(dest, cells, T, pli, spend, theta_scale=0.0)
    cell_c = np.asarray(cells.country, dtype=object)
    dest_c = np.asarray(dest.country, dtype=object)
    foreign = cell_c[None, :] != dest_c[:, None]
    own = ownership_split(dest, shops).set_index("dest").reindex(dest.dest)

    rows = []
    for seg in C.SEGMENTS:
        Fa, Fc = actual[seg], closed[seg]
        base = Fc.sum(axis=1)
        gain = (Fa * foreign).sum(axis=1)
        loss = (Fa * ~foreign).sum(axis=1) - base
        cs = own[f"chain_share_{seg}"].values
        for owner, share in (("chain", cs), ("independent", 1 - cs)):
            rows.append(pd.DataFrame({
                "dest": dest.dest.values, "segment": seg, "ownership": owner,
                "turnover_closed": base * share, "gain_foreign": gain * share,
                "loss_domestic": loss * share,
            }))
    t = pd.concat(rows, ignore_index=True)
    t["net"] = t.gain_foreign + t.loss_domestic
    meta = dest[["dest", "name", "type", "country", "nuts3"]].merge(own.reset_index(), on="dest")
    t = t.merge(meta, on="dest")
    t["n_shops"] = np.where(t.ownership == "chain", t.n_chain, t.n_indep)
    return t.drop(columns=["n_chain", "n_indep"])


def summarise(t, by):
    """Aggregate an impact table; n_shops counted once (not per segment)."""
    money = ["turnover_closed", "gain_foreign", "loss_domestic", "net"]
    g = t.groupby(by)[money].sum()
    shops = t[t.segment == "everyday"].groupby(by).n_shops.sum()
    g["n_shops"] = shops.reindex(g.index).fillna(0).astype(int)
    g["gain_pct"] = g.gain_foreign / g.turnover_closed
    g["loss_pct"] = g.loss_domestic / g.turnover_closed
    g["net_pct"] = g.net / g.turnover_closed
    g["net_per_shop"] = g.net / g.n_shops.replace(0, np.nan)
    return g.reset_index()
