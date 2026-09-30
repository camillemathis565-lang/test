"""Évolution des commerces en centre-ville et en QPV selon l'exposition aux zones commerciales
périphériques. Produit des tableaux CSV dans ./resultats.

Mesure principale : établissements employeurs du commerce de détail en magasin (NAF 47.1-47.7),
plus proches des magasins physiques que l'ensemble des établissements, gonflé par les
micro-entrepreneurs domiciliés. L'ensemble des établissements sert de variante.
"""
import os
import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

DATA = os.environ.get("DATA_DIR", ".")
GEO = os.path.join(DATA, os.environ.get("GEO_SUBDIR", "geo"))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.environ.get("RES_SUBDIR", "resultats"))
os.makedirs(OUT, exist_ok=True)
Y = ["2012", "2016", "2019", "2022", "2025"]

c = pd.read_parquet(f"{GEO}/commerces_geo.parquet")
cen = pd.read_parquet(f"{GEO}/centres.parquet")
qpv = pd.read_parquet(f"{GEO}/qpv.parquet")


def save(df, name):
    df.to_csv(f"{OUT}/{name}.csv", index=True)
    print(f"\n== {name}\n{df}")


# 1. Trajectoires nationales par type de territoire ------------------------------------------------
lib = {"peripherie": "Zones commerciales périphériques", "centre": "Centres-villes (communes ≥ 5 000 hab.)",
       "qpv": "Quartiers prioritaires (QPV)", "autre": "Reste du territoire"}
traj = c.groupby("zone")[[f"{k}{y}" for k in "re" for y in Y]].sum().rename(index=lib)
save(traj, "01_stocks_par_territoire")
idx = pd.concat({
    "employeurs": traj[[f"e{y}" for y in Y]].div(traj["e2012"], axis=0).mul(100).set_axis(Y, axis=1),
    "tous": traj[[f"r{y}" for y in Y]].div(traj["r2012"], axis=0).mul(100).set_axis(Y, axis=1),
}).round(1)
save(idx, "02_indices_2012_100")

per = []
for a, b in zip(Y[:-1], Y[1:]):
    n = int(b) - int(a)
    g = (traj[f"e{b}"] / traj[f"e{a}"]) ** (1 / n) - 1
    per.append(g.rename(f"{a}-{b}"))
save((pd.concat(per, axis=1) * 100).round(2), "03_croissance_annuelle_employeurs_par_periode")

# 2. Composition : quels commerces reculent en centre et progressent en périphérie ---------------
TYPES = [("47.1", "Commerce non spécialisé (super/hyper, supérettes)"),
         ("47.2", "Alimentaire spécialisé"), ("47.3", "Carburants"),
         ("47.4", "Équipement informatique et télécom"),
         ("47.5", "Équipement du foyer (bricolage, meubles, électroménager)"),
         ("47.6", "Culture et loisirs"), ("47.71", "Habillement"), ("47.72", "Chaussures et maroquinerie"),
         ("47.73", "Pharmacies"), ("47.7", "Autres commerces spécialisés")]


def type_of(naf):
    if not isinstance(naf, str):
        return None
    for p, l in TYPES:
        if naf.startswith(p):
            return l
    return None


for y in ("2012", "2025"):
    c[f"type{y}"] = c[f"naf{y}"].map(type_of)
comp = pd.concat({y: c[c[f"e{y}"] == 1].groupby(["zone", f"type{y}"]).size() for y in ("2012", "2025")}, axis=1)
comp.index.names = ["zone", "type"]
comp = comp.fillna(0).astype(int)
comp["evol_pct"] = ((comp["2025"] / comp["2012"] - 1) * 100).round(1)
comp = comp.rename(index=lib, level=0)
save(comp, "04_composition_employeurs")

# 3. Centres-villes : évolution selon l'exposition aux zones périphériques ------------------------
cen["g_e"] = cen.e2025 / cen.e2012 - 1
cen["g_r"] = cen.r2025 / cen.r2012 - 1
cen["dev_peri"] = (cen.peri_e2025 - cen.peri_e2012) / cen.e2012  # nouveaux commerces employeurs de
# périphérie (≤ 10 km) pour 1 commerce employeur du centre en 2012
cen["log_surf"] = np.log1p(cen.surf_peri_10km_ha)
cen["dist_cl"] = pd.cut(cen.dist_peri_km, [-0.1, 1, 3, 10, 1e3], labels=["< 1 km", "1-3 km", "3-10 km", "> 10 km"])
s = cen[cen.e2012 >= 10].copy()  # centres assez fournis pour que l'évolution ait un sens
# terciles de surface périphérique calculés à taille de commune donnée
s["surf_t"] = s.groupby("taille", observed=True)["surf_peri_10km_ha"].transform(
    lambda v: pd.qcut(v.rank(method="first"), 3, labels=["faible", "moyenne", "forte"]))
s["dev_t"] = s.groupby("taille", observed=True)["dev_peri"].transform(
    lambda v: pd.qcut(v.rank(method="first"), 3, labels=["faible", "moyen", "fort"]))


def agg(df, by):
    g = df.groupby(by, observed=True).agg(centres=("INSEE_COM", "size"), e2012=("e2012", "sum"),
                                          e2025=("e2025", "sum"), r2012=("r2012", "sum"), r2025=("r2025", "sum"),
                                          surf_peri_moy_ha=("surf_peri_10km_ha", "mean"))
    g["evol_employeurs_pct"] = ((g.e2025 / g.e2012 - 1) * 100).round(1)
    g["evol_tous_pct"] = ((g.r2025 / g.r2012 - 1) * 100).round(1)
    return g.round(1)


save(agg(s, "taille"), "05_centres_par_taille")
save(agg(s, "dist_cl"), "06_centres_par_distance")
save(agg(s, ["taille", "surf_t"]), "07_centres_taille_x_surface_peri")
save(agg(s, "surf_t"), "07b_centres_surface_peri")
save(agg(s, "dev_t"), "08_centres_developpement_peri")

s["dep"] = s.INSEE_DEP
res = {}
for label, f in {
    "surface périphérique (log ha ≤ 10 km)": "g_e ~ log_surf + dpop_14_20 + C(taille) + C(dep)",
    "développement périphérique 2012-2025": "g_e ~ dev_peri_w + dpop_14_20 + C(taille) + C(dep)",
    "terciles de surface (réf. faible)": "g_e ~ C(surf_t, Treatment('faible')) + dpop_14_20 + C(taille) + C(dep)",
}.items():
    s["dev_peri_w"] = s.dev_peri.clip(upper=s.dev_peri.quantile(0.99))
    m = smf.wls(f, data=s.dropna(subset=["dpop_14_20"]), weights=s.dropna(subset=["dpop_14_20"]).e2012).fit(
        cov_type="cluster", cov_kwds={"groups": s.dropna(subset=["dpop_14_20"]).dep})
    keep = [k for k in m.params.index if not k.startswith(("C(dep)", "C(taille)", "Intercept"))]
    res[label] = pd.DataFrame({"coef": m.params[keep], "ic95_bas": m.conf_int().loc[keep, 0],
                               "ic95_haut": m.conf_int().loc[keep, 1], "p": m.pvalues[keep], "n": int(m.nobs)})
save(pd.concat(res).round(4), "09_regressions_centres")

# variante : ensemble des établissements (le test à rayon fixe se lance via RAYON_FIXE dans 02_geographies.py)
m = smf.wls("g_r ~ log_surf + dpop_14_20 + C(taille) + C(dep)", data=s.dropna(subset=["dpop_14_20"]),
            weights=s.dropna(subset=["dpop_14_20"]).r2012).fit(
    cov_type="cluster", cov_kwds={"groups": s.dropna(subset=["dpop_14_20"]).dep})
save(pd.DataFrame({"coef": m.params[["log_surf", "dpop_14_20"]], "p": m.pvalues[["log_surf", "dpop_14_20"]]}).round(4),
     "09b_regression_centres_tous_etablissements")

# 4. QPV : évolution relative au reste de la commune, selon la distance à une zone ------------------
# Paris, Lyon, Marseille : Sirene code les arrondissements, les QPV la commune
c["com_plm"] = c.com
c.loc[c.com.between("75101", "75120"), "com_plm"] = "75056"
c.loc[c.com.between("69381", "69389"), "com_plm"] = "69123"
c.loc[c.com.between("13201", "13216"), "com_plm"] = "13055"
cols = [f"{k}{y}" for k in "re" for y in Y]
reste = c[(c.zone != "qpv") & (c.zone != "peripherie")].groupby("com_plm")[cols].sum()
# un QPV peut s'étendre sur plusieurs communes : le témoin est la somme de ces communes
qc = qpv[["code_qp", "insee_com"]].assign(com=qpv.insee_com.str.split(r",\s*")).explode("com")
reste_q = qc.merge(reste, left_on="com", right_index=True, how="inner").groupby("code_qp")[cols].sum()
qpv = qpv.drop(columns=[k for k in qpv.columns if k.startswith("reste_")]).merge(
    reste_q.add_prefix("reste_"), left_on="code_qp", right_index=True, how="left")
popi = pd.read_csv(f"{DATA}/pop/base-cc-evol-struct-pop-2020.CSV", sep=";", dtype={"CODGEO": str},
                   usecols=["CODGEO", "P20_POP", "P14_POP"]).set_index("CODGEO")
pq = qc.merge(popi, left_on="com", right_index=True, how="inner").groupby("code_qp")[["P20_POP", "P14_POP"]].sum()
qpv = qpv.drop(columns=["P20_POP", "P14_POP"]).merge(pq, left_on="code_qp", right_index=True, how="left")
qpv["dist_cl"] = pd.cut(qpv.dist_peri_km, [-0.1, 0.001, 1, 3, 1e3],
                        labels=["contiguë", "< 1 km", "1-3 km", "> 3 km"])
q = qpv[(qpv.e2012 >= 5) & qpv.reste_e2012.notna()].copy()
q["g_q"] = q.e2025 / q.e2012 - 1
q["g_reste"] = q.reste_e2025 / q.reste_e2012 - 1
q["ecart"] = q.g_q - q.g_reste
q["dpop"] = q.P20_POP / q.P14_POP - 1
q["dev_peri"] = (q.peri_e2025 - q.peri_e2012) / q.e2012


def agg_q(df, by):
    g = df.groupby(by, observed=True).agg(qpv=("code_qp", "size"), e2012=("e2012", "sum"), e2025=("e2025", "sum"),
                                          r2012=("r2012", "sum"), r2025=("r2025", "sum"))
    g["evol_qpv_pct"] = ((g.e2025 / g.e2012 - 1) * 100).round(1)
    w = df.groupby(by, observed=True).apply(lambda d: np.average(d.g_reste, weights=d.e2012), include_groups=False)
    g["evol_reste_commune_pct"] = (w * 100).round(1)
    g["ecart_pts"] = (g.evol_qpv_pct - g.evol_reste_commune_pct).round(1)
    g["evol_qpv_tous_pct"] = ((g.r2025 / g.r2012 - 1) * 100).round(1)
    return g


save(agg_q(q, "dist_cl"), "10_qpv_par_distance")
q["dev_t"] = pd.qcut(q.dev_peri.rank(method="first"), 3, labels=["faible", "moyen", "fort"])
save(agg_q(q, "dev_t"), "11_qpv_developpement_peri")

q["log_surf"] = np.log1p(q.surf_peri_5km_ha)
q["dep"] = q.insee_dep
res = {}
for label, f in {
    "surface périphérique (log ha ≤ 5 km)": "ecart ~ log_surf + dpop + C(dep)",
    "zone contiguë ou < 1 km": "ecart ~ proche + dpop + C(dep)",
}.items():
    q["proche"] = (q.dist_peri_km < 1).astype(int)
    d = q.dropna(subset=["dpop"])
    m = smf.wls(f, data=d, weights=d.e2012).fit(cov_type="cluster", cov_kwds={"groups": d.dep})
    keep = [k for k in m.params.index if not k.startswith(("C(dep)", "Intercept"))]
    res[label] = pd.DataFrame({"coef": m.params[keep], "ic95_bas": m.conf_int().loc[keep, 0],
                               "ic95_haut": m.conf_int().loc[keep, 1], "p": m.pvalues[keep], "n": int(m.nobs)})
save(pd.concat(res).round(4), "12_regressions_qpv")

# 5. Exemples : villes moyennes (20-100k) aux trajectoires contrastées ----------------------------
ex = s[s.taille.isin(["20-50k", "50-100k"])][["NOM", "POPULATION", "e2012", "e2025", "g_e", "surf_peri_10km_ha",
                                               "peri_e2012", "peri_e2025", "dist_peri_km"]].copy()
ex["g_e"] = (ex.g_e * 100).round(1)
ex["peri_evol"] = ex.peri_e2025 - ex.peri_e2012
save(ex.sort_values("g_e").head(15).set_index("NOM").round(1), "13_exemples_plus_forts_reculs")
save(ex.sort_values("g_e").tail(10).set_index("NOM").round(1), "14_exemples_plus_fortes_hausses")

# 6. Panel : chaque centre (ou QPV) comparé à lui-même d'une période à l'autre ---------------------
# Effets fixes unité (supprime les différences permanentes entre villes) et département x période
# (supprime les chocs communs à un territoire, dont l'essor du e-commerce).


def panel(df, key, dep, relatif=False):
    rows = []
    for i, (a, b) in enumerate(zip(Y[:-1], Y[1:])):
        d = pd.DataFrame({"id": df[key].values, "dep": df[dep].values, "t": i,
                          "dlog_e": np.log(df[f"e{b}"] + 1).values - np.log(df[f"e{a}"] + 1).values,
                          "dperi": ((df[f"peri_e{b}"] - df[f"peri_e{a}"]) / (df[f"e{a}"] + 1)).values,
                          "gs_open": ((df[f"peri_gs{b}"] - df[f"peri_gs{a}"]) > 0).astype(int).values,
                          "w": df[f"e{a}"].values})
        if relatif:
            d["dlog_e"] -= (np.log(df[f"reste_e{b}"] + 1) - np.log(df[f"reste_e{a}"] + 1)).values
        rows.append(d)
    p = pd.concat(rows).sort_values(["id", "t"])
    p["dperi"] = p.dperi.clip(p.dperi.quantile(0.01), p.dperi.quantile(0.99))
    p["dperi_lag"] = p.groupby("id").dperi.shift(1)
    return p


def fit(p, f, label):
    d = p.dropna(subset=[v for v in ("dperi_lag",) if v in f] + ["dlog_e"])
    m = smf.wls(f, data=d, weights=d.w.clip(lower=1)).fit(cov_type="cluster", cov_kwds={"groups": d.id})
    keep = [k for k in ("dperi", "dperi_lag", "gs_open") if k in m.params.index]
    return pd.DataFrame({"modele": label, "coef": m.params[keep], "ic95_bas": m.conf_int().loc[keep, 0],
                         "ic95_haut": m.conf_int().loc[keep, 1], "p": m.pvalues[keep], "n": int(m.nobs)})


FE = " + C(id) + C(dep):C(t)"
pc = panel(s, "INSEE_COM", "INSEE_DEP")
small = s[s.taille.isin(["5-10k", "10-20k"])]
big = s[~s.taille.isin(["5-10k", "10-20k"])]
pq = panel(q, "code_qp", "insee_dep", relatif=True)
save(pd.concat([
    fit(pc, "dlog_e ~ dperi" + FE, "centres : essor de la périphérie ≤ 10 km"),
    fit(pc, "dlog_e ~ gs_open" + FE, "centres : ouverture nette d'une grande surface ≤ 10 km"),
    fit(pc, "dlog_e ~ dperi + dperi_lag" + FE, "centres : effet décalé d'une période"),
    fit(panel(small, "INSEE_COM", "INSEE_DEP"), "dlog_e ~ dperi" + FE, "centres 5-20k hab."),
    fit(panel(big, "INSEE_COM", "INSEE_DEP"), "dlog_e ~ dperi" + FE, "centres 20k hab. et plus"),
    fit(pq, "dlog_e ~ dperi" + FE, "QPV (écart au reste de la commune) : essor périphérie ≤ 5 km"),
    fit(pq, "dlog_e ~ gs_open" + FE, "QPV : ouverture nette d'une grande surface ≤ 5 km"),
]).round(4), "15_panel_effets_fixes")
