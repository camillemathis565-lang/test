"""Price levels and per-capita spending by country (Eurostat prc_ppp_ind)."""
import json

import pandas as pd
import requests

from . import config as C

EUROSTAT_GEOS = ["FR", "BE", "LU", "DE", "CH", "IT", "ES", "EU27_2020"]


def _query(na_item, cats):
    path = C.CACHE / f"eurostat_{na_item}_{'_'.join(cats)}.json"
    if path.exists():
        d = json.loads(path.read_text())
    else:
        params = [("format", "JSON"), ("lang", "en"), ("na_item", na_item),
                  ("sinceTimePeriod", "2021")]
        params += [("ppp_cat", c) for c in cats] + [("geo", g) for g in EUROSTAT_GEOS]
        r = requests.get(C.EUROSTAT_API + "prc_ppp_ind", params=params, timeout=120)
        r.raise_for_status()
        d = r.json()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(d))
    ids, sizes = d["id"], d["size"]
    idx = {k: {v: i for v, i in d["dimension"][k]["category"]["index"].items()} for k in ids}
    rows = []
    for flat, val in d["value"].items():
        flat = int(flat)
        coord = {}
        for k, s in zip(reversed(ids), reversed(sizes)):
            coord[k] = flat % s
            flat //= s
        inv = {k: {i: v for v, i in idx[k].items()} for k in ids}
        rows.append({k: inv[k][coord[k]] for k in ("ppp_cat", "geo", "time")} | {"value": val})
    df = pd.DataFrame(rows)
    latest = df.groupby("ppp_cat").time.max()
    df = df[df.time == df.ppp_cat.map(latest)]
    return df.pivot(index="geo", columns="ppp_cat", values="value"), latest.to_dict()


def price_and_spend():
    """Returns (pli, spend, years): per segment, a Series indexed by country."""
    cats = sorted({c for s in C.SEGMENTS.values() for c in s["eurostat_cats"]})
    pli, years = _query("PLI_EU27_2020", cats)
    exp, _ = _query("EXP_EUR_HAB", cats)
    for c, ov in C.PRICE_OVERRIDES.items():
        pli.loc[c] = pli.loc[ov] if isinstance(ov, str) else pd.Series(ov)
    for c, ov in C.SPEND_OVERRIDES.items():
        exp.loc[c] = exp.loc[ov]
    for (c, cat), ov in C.SPEND_CAT_OVERRIDES.items():
        exp.loc[c, cat] = exp.loc[ov, cat]
    out_p, out_s = {}, {}
    for seg, s in C.SEGMENTS.items():
        e = exp[s["eurostat_cats"]]
        out_s[seg] = e.sum(axis=1)                                  # EUR / inhabitant / year
        w = e.div(e.sum(axis=1), axis=0).fillna(1 / len(s["eurostat_cats"]))
        out_p[seg] = (pli[s["eurostat_cats"]] * w).sum(axis=1)       # spend-weighted PLI
    return pd.DataFrame(out_p), pd.DataFrame(out_s), years
