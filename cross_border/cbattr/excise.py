"""Tobacco and fuel: cross-border purchases, calibrated on the 2020 closure.

Outlets for these goods are everywhere (every village has a tabac and a
petrol station), so the choice is "buy locally" vs "make a trip to the
nearest outlet of a cheaper country". For a resident of cell i in country c:

    U_home  = 1
    U_k     = kappa * exp(-beta * t_ik) * (p_k / p_c) ** -gamma   for k != c
    s_ik    = U_k / (1 + sum_k U_k)          share of purchases made in k

t_ik is the road time to the nearest destination (centre or zone) in k.
When borders close (16 March - 15 June 2020) all purchases return home:
a French area's sales change by

    closed / open - 1 = own residents' consumption / (own residents' domestic
                        purchases + foreigners' purchases there) - 1

kappa, beta, gamma are fitted to observed 2020 changes (see TARGETS).
"""
import numpy as np
import pandas as pd
from scipy.optimize import least_squares
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree

from . import config as C

# --- Observed 2020 closure effects -------------------------------------------
# Tobacco, OFDT "Tabagisme et arrêt du tabac en 2020" and Assemblée nationale
# mission d'information (rapport n°4498): sales 16/03-14/06/2020 vs 2019 by
# border façade; non-border départements +2.4 % (Q2, constant delivery days).
TOBACCO_FACADES = {  # façade -> (départements, observed change)
    "Nord (Belgique)": (["Nord", "Aisne", "Ardennes", "Meuse"], 0.288),
    "Nord-Est (Luxembourg, Allemagne)": (["Meurthe-et-Moselle", "Moselle", "Bas-Rhin", "Haut-Rhin"], 0.446),
    "Suisse": (["Territoire de Belfort", "Doubs", "Jura", "Ain", "Haute-Savoie"], 0.026),
    "Sud-Ouest (Espagne, Andorre)": (["Pyrénées-Atlantiques", "Hautes-Pyrénées", "Haute-Garonne",
                                      "Ariège", "Pyrénées-Orientales"], 0.445),
}
TOBACCO_CONTROL = 0.024
# Département figures, April-May 2020 vs 2019 (answers to parliamentary written
# questions: Sénat QE 15024 for Moselle = mean of April +43 % and May +14 %;
# Assemblée nationale QE 30930 / 31078 / 32257 for the others; sources differ
# by a few points, e.g. 49 % or 52 % for the Pyrénées-Orientales).
TOBACCO_DEPTS = {"Pyrénées-Orientales": 0.49, "Ariège": 0.71, "Pyrénées-Atlantiques": 0.52,
                 "Nord": 0.40, "Moselle": 0.285}
# INSEE Analyses n°94 (2024): national surplus of sales during the closure
# (difference-in-differences vs 2010-2019) and surplus by access time to the
# nearest land border.
TOBACCO_NATIONAL = 0.095
TOBACCO_DISTANCE = {(0, 10): 0.90, (10, 20): 0.65}
# Pack of 20 cigarettes, 2020, EUR (INSEE Analyses n°94).
TOBACCO_PRICE_2020 = {"FR": 9.5, "BE": 6.7, "LU": 5.3, "DE": 6.5, "IT": 5.0, "ES": 5.0,
                      "AD": 3.8, "CH": 8.0, "MC": 9.5}

# Fuel: EU Weekly Oil Bulletin, Euro-super 95 incl. taxes, mean 16/03-15/06/2020
# (EUR/l). CH and AD are not in the bulletin (assumptions, see README).
FUEL_PRICE_2020 = {"FR": 1.284, "BE": 1.172, "LU": 0.969, "DE": 1.225, "IT": 1.404,
                   "ES": 1.116, "CH": 1.27, "AD": 1.00, "MC": 1.284}
BORDER_DEPTS = sorted({d for deps, _ in TOBACCO_FACADES.values() for d in deps} |
                      {"Savoie", "Hautes-Alpes", "Alpes-de-Haute-Provence", "Alpes-Maritimes"})


def times_to_countries(g, vxy, dest, cells, access_kmh=45):
    """Minutes from each cell to the nearest destination of each country, and
    the destination reached (index into dest)."""
    tree = cKDTree(vxy)
    d_dist, d_v = tree.query(dest[["x", "y"]].values)
    c_dist, c_v = tree.query(cells[["x", "y"]].values)
    acc = 60 / (access_kmh * 1000)
    out_t, out_j = {}, {}
    for k in sorted(dest.country.unique()):
        idx = np.where(dest.country.values == k)[0]
        verts, first = np.unique(d_v[idx], return_index=True)
        dist, _, src = dijkstra(g, directed=False, indices=verts, min_only=True,
                                return_predecessors=True, limit=300)
        vert_to_dest = dict(zip(verts, idx[first]))
        t = dist[c_v] + c_dist * acc
        j = np.array([vert_to_dest.get(s, -1) for s in src[c_v]])
        t[(j < 0) | ~np.isfinite(t)] = np.inf
        out_t[k], out_j[k] = t, j
    return pd.DataFrame(out_t), pd.DataFrame(out_j)


def shares(params, cells, T, prices):
    """Share of each cell's purchases made in each foreign country."""
    kappa, beta, gamma = np.exp(params[0]), params[1], params[2]
    # optional 4th parameter: extra friction for Switzerland (outside the EU
    # customs union: duty-free allowance of one carton, customs checks)
    theta = {"CH": np.exp(params[3])} if len(params) > 3 else {}
    own = cells.country.values
    p_own = pd.Series(prices).reindex(own).values
    U = {}
    for k in T.columns:
        rel = prices[k] / p_own
        u = kappa * theta.get(k, 1.0) * np.exp(-beta * T[k].values) * rel ** (-gamma)
        # nobody makes a trip abroad to pay more
        u[(own == k) | ~np.isfinite(T[k].values) | (rel >= 1)] = 0.0
        U[k] = u
    U = pd.DataFrame(U, index=cells.index)
    return U.div(1 + U.sum(axis=1), axis=0)


def closure_effects(params, cells, T, J, dest, prices, dept_of_dest, fr_pop_outside=0.0):
    """Predicted sales change on closure, per French département, per façade,
    nationally and per access-time band."""
    S = shares(params, cells, T, prices)
    pop = cells["pop"].values
    fr = (cells.country == "FR").values
    abroad = S.sum(axis=1).values
    # French residents: consumption stays home when closed
    dept = cells.dept.values
    own_cons = pd.Series(pop[fr], index=dept[fr]).groupby(level=0).sum()
    own_dom = pd.Series((pop * (1 - abroad))[fr], index=dept[fr]).groupby(level=0).sum()
    # foreign residents buying in France: at the département of the outlet reached
    fo = ~fr & (S["FR"].values > 0) if "FR" in S else np.zeros(len(cells), bool)
    inflow = pd.Series((pop * S["FR"].values)[fo],
                       index=dept_of_dest[J["FR"].values[fo]]).groupby(level=0).sum() \
        if fo.any() else pd.Series(dtype=float)
    open_ = own_dom.add(inflow, fill_value=0)
    dep = pd.DataFrame({"closed": own_cons, "open": open_}).fillna(0)
    dep["change"] = dep.closed / dep.open - 1
    fac = {}
    for name, (deps, _) in TOBACCO_FACADES.items():
        sub = dep.reindex(deps).dropna()
        fac[name] = sub.closed.sum() / sub.open.sum() - 1
    national = (own_cons.sum() + fr_pop_outside) / (open_.sum() + fr_pop_outside) - 1
    tb = T.drop(columns="FR").where(np.isfinite(T.drop(columns="FR")), np.inf).min(axis=1).values
    bands = {}
    for (a, b) in TOBACCO_DISTANCE:
        m = fr & (tb >= a) & (tb < b)
        bands[(a, b)] = pop[m].sum() / (pop[m] * (1 - abroad[m])).sum() - 1
    return dep, pd.Series(fac), national, pd.Series(bands), S


def fit(residual_fn, x0, lower=(-15, 0.0, 0.0, -10), upper=(5, 0.5, 20.0, 0.0)):
    lower, upper = list(lower)[:len(x0)], list(upper)[:len(x0)]
    return least_squares(residual_fn, x0, bounds=(lower, upper))
