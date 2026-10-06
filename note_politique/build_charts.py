"""Graphiques de la note de politique publique (PNG, 200 dpi)."""
import csv, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "..", "analyse_commerce_territoires", "resultats")
OUT = os.path.join(HERE, "figures")

# Palette catégorielle validée (ordre fixe, une couleur par territoire)
PERI, CENTRE, QPV, RESTE = "#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"
INK, INK2, GRID = "#0b0b0b", "#52514e", "#e4e3df"
plt.rcParams.update({
    "font.family": "Liberation Sans", "font.size": 8.5, "axes.edgecolor": INK2, "axes.labelcolor": INK2,
    "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": .6, "axes.axisbelow": True,
    "legend.frameon": False, "legend.fontsize": 8, "savefig.dpi": 200, "figure.dpi": 100,
})
fr = lambda v, d=1: f"{v:,.{d}f}".replace(",", " ").replace(".", ",")

def save(fig, name):
    fig.savefig(os.path.join(OUT, name), bbox_inches="tight", pad_inches=.06, facecolor="white")
    plt.close(fig)

def rows(name):
    with open(os.path.join(RES, name), encoding="utf8") as f:
        return list(csv.DictReader(f))

def legend_top(ax, ncol):
    ax.legend(loc="lower left", bbox_to_anchor=(0, 1.02), ncol=ncol, handlelength=1.2, columnspacing=1.4, borderaxespad=0)

# 1.1 Poids des pôles de périphérie (Insee 2015)
fig, ax = plt.subplots(figsize=(6.3, 1.9))
cats, vals = ["Établissements", "Emplois salariés", "Surface commerciale"], [23, 45, 65]
ax.barh(cats, [100]*3, color="#f0efec", height=.55)
ax.barh(cats, vals, color=PERI, height=.55)
for i, v in enumerate(vals): ax.text(v + 1.2, i, f"{v} %", va="center", color=INK, fontweight="bold")
ax.set_xlim(0, 100); ax.grid(False); ax.invert_yaxis(); ax.tick_params(left=False)
ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.0f} %")); ax.spines["left"].set_visible(False)
save(fig, "g1_1_poids_peripherie.png")

# 1.2 Croissance annuelle de l'emploi salarié par type de pôle (deux études, deux panneaux)
fig, axs = plt.subplots(1, 2, figsize=(6.3, 2.4), sharey=True)
for ax, (per, data) in zip(axs, [("2009-2015 (Insee Première n° 1858)", [2.3, 0.2, -1.2]), ("2016-2022 (Insee Première n° 2091)", [1.6, 1.1, 1.9])]):
    labs = ["Pôles de\npériphérie", "Pôles de\ncentre-ville", "Hors pôles"]
    b = ax.bar(labs, data, color=[PERI, CENTRE, RESTE], width=.55)
    for r, v in zip(b, data): ax.text(r.get_x()+r.get_width()/2, v + (.08 if v >= 0 else -.08), fr(v) + " %", ha="center", va="bottom" if v >= 0 else "top", color=INK)
    ax.axhline(0, color=INK2, lw=.8); ax.set_title(per, fontsize=8.5, color=INK, loc="left"); ax.tick_params(bottom=False)
axs[0].set_ylim(-1.8, 2.9); axs[0].yaxis.set_major_formatter(FuncFormatter(lambda v, _: fr(v, 0) + " %"))
fig.tight_layout(w_pad=2)
save(fig, "g1_2_emploi_poles.png")

# 2.1 Indice 2012 = 100 des commerces employeurs
idx = {r["zone"]: [float(r[y]) for y in ("2012", "2016", "2019", "2022", "2025")] for r in rows("02_indices_2012_100.csv") if r[""] == "employeurs"}
years = [2012, 2016, 2019, 2022, 2025]
series = [("Zones commerciales périphériques", "Zones périphériques", PERI), ("Reste du territoire", "Reste du territoire", RESTE),
          ("Quartiers prioritaires (QPV)", "QPV", QPV), ("Centres-villes (communes ≥ 5 000 hab.)", "Centres-villes", CENTRE)]
fig, ax = plt.subplots(figsize=(6.3, 2.9))
for key, lab, c in series:
    ax.plot(years, idx[key], color=c, lw=2, marker="o", ms=4.5, mec="white", mew=1, label=lab)
    ax.annotate(f"{lab} : {fr(idx[key][-1])}", (2025, idx[key][-1]), xytext=(8, 0), textcoords="offset points", va="center", color=INK, fontsize=8)
ax.axhline(100, color=INK2, lw=.8); ax.set_xticks(years); ax.set_xlim(2011.5, 2025.4); ax.set_ylim(85, 130)
ax.spines["left"].set_visible(False); ax.tick_params(left=False); legend_top(ax, 4)
save(fig, "g2_1_indices.png")

# 2.2 Évolution par activité 2012-2025
compo = [("Chaussures et maroquinerie", -2.2, -37.9, -42.4), ("Équipement du foyer", 9.1, -32.3, -34.4), ("Habillement", 11.6, -25.3, -32.8),
         ("Culture et loisirs", 19.3, -19.1, -25.5), ("Informatique et télécom", 18.9, -24.1, 5.3), ("Pharmacies", 18.7, -18.1, -16.2),
         ("Alimentaire spécialisé", 99.1, 15.8, 3.4), ("Supérettes, super et hyper", 46.2, 51.7, 39.2)]
fig, ax = plt.subplots(figsize=(6.3, 4.1))
h = .26
for j, (lab, c) in enumerate([("Zones périphériques", PERI), ("Centres-villes", CENTRE), ("QPV", QPV)]):
    ys = [i + (j-1)*(h+.02) for i in range(len(compo))]
    vals = [r[j+1] for r in compo]
    ax.barh(ys, vals, height=h, color=c, label=lab)
    for y, v in zip(ys, vals): ax.text(v + (1.5 if v >= 0 else -1.5), y, fr(v), va="center", ha="left" if v >= 0 else "right", fontsize=6.8, color=INK2)
ax.set_yticks(range(len(compo))); ax.set_yticklabels([r[0] for r in compo]); ax.invert_yaxis()
ax.axvline(0, color=INK2, lw=.8); ax.set_xlim(-55, 112); ax.grid(axis="y", visible=False); ax.tick_params(left=False)
ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:+.0f} %".replace("+0", "0"))); legend_top(ax, 3)
save(fig, "g2_2_activites.png")

# 2.3 Vacance par type de site (Procos / Codata)
fig, ax = plt.subplots(figsize=(6.3, 2.3))
sites = [("Rues marchandes", 9.73, 10.85), ("Centres commerciaux", 14.95, 16.7), ("Zones commerciales", 6.79, 7.24)]
x = range(len(sites)); w = .34
for k, (yr, c) in enumerate([("2023", "#86b6ef"), ("2024", "#1c5cab")]):
    xs = [i + (k-.5)*(w+.03) for i in x]; vs = [s[k+1] for s in sites]
    ax.bar(xs, vs, width=w, color=c, label=yr)
    for xx, v in zip(xs, vs): ax.text(xx, v + .3, fr(v, 2) + " %", ha="center", va="bottom", fontsize=7.5, color=INK)
ax.set_xticks(list(x)); ax.set_xticklabels([s[0] for s in sites]); ax.set_ylim(0, 19.5); ax.tick_params(bottom=False)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.0f} %")); legend_top(ax, 2)
save(fig, "g2_3_vacance_sites.png")

# 3.1 QPV et reste de la commune, par distance à la zone la plus proche
q = rows("10_qpv_par_distance.csv")
labs = {"contiguë": "Contigu à une zone", "< 1 km": "Moins de 1 km", "1-3 km": "1 à 3 km", "> 3 km": "Plus de 3 km"}
fig, ax = plt.subplots(figsize=(6.3, 2.6))
x = range(len(q)); w = .36
for k, (key, lab, c) in enumerate([("evol_qpv_pct", "QPV", QPV), ("evol_reste_commune_pct", "Reste de la commune", RESTE)]):
    xs = [i + (k-.5)*(w+.03) for i in x]; vs = [float(r[key]) for r in q]
    ax.bar(xs, vs, width=w, color=c, label=lab)
    for xx, v in zip(xs, vs): ax.text(xx, v + (.6 if v >= 0 else -.6), fr(v), ha="center", va="bottom" if v >= 0 else "top", fontsize=7.5, color=INK)
ax.set_xticks(list(x)); ax.set_xticklabels([f"{labs[r['dist_cl']]}\n({r['qpv']} QPV)" for r in q]); ax.tick_params(bottom=False)
ax.axhline(0, color=INK2, lw=.8); ax.set_ylim(-21, 26); ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:+.0f} %".replace("+0", "0"))); legend_top(ax, 2)
save(fig, "g3_1_qpv_distance.png")

# 4.1 Centres-villes par distance
c6 = rows("06_centres_par_distance.csv")
labs = {"< 1 km": "Moins de 1 km", "1-3 km": "1 à 3 km", "3-10 km": "3 à 10 km", "> 10 km": "Plus de 10 km"}
fig, ax = plt.subplots(figsize=(6.3, 2.3))
vs = [float(r["evol_employeurs_pct"]) for r in c6]
b = ax.bar([f"{labs[r['dist_cl']]}\n({r['centres']} centres)" for r in c6], vs, color=CENTRE, width=.5)
for r, v in zip(b, vs): ax.text(r.get_x()+r.get_width()/2, v - .5, fr(v) + " %", ha="center", va="top", color=INK)
ax.axhline(0, color=INK2, lw=.8); ax.set_ylim(-17, 1); ax.tick_params(bottom=False)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.0f} %"))
save(fig, "g4_1_centres_distance.png")

# 4.2 Effets estimés (points de %, IC 95 %)
p = rows("15_panel_effets_fixes.csv")
names = {("dperi", "centres : essor de la périphérie ≤ 10 km"): "Centres : essor de la périphérie (≤ 10 km)",
         ("gs_open", "centres : ouverture nette d'une grande surface ≤ 10 km"): "Centres : ouverture d'une grande surface (≤ 10 km)",
         ("dperi_lag", "centres : effet décalé d'une période"): "Centres : essor de la périphérie, période suivante",
         ("dperi", "centres 5-20k hab."): "Centres des villes de 5 000 à 20 000 hab.",
         ("dperi", "centres 20k hab. et plus"): "Centres des villes de 20 000 hab. et plus",
         ("dperi", "QPV (écart au reste de la commune) : essor périphérie ≤ 5 km"): "QPV : essor de la périphérie (≤ 5 km)",
         ("gs_open", "QPV : ouverture nette d'une grande surface ≤ 5 km"): "QPV : ouverture d'une grande surface (≤ 5 km)"}
pts = [(names[(r[""], r["modele"])], 100*float(r["coef"]), 100*float(r["ic95_bas"]), 100*float(r["ic95_haut"]), "QPV" in r["modele"]) for r in p if (r[""], r["modele"]) in names]
fig, ax = plt.subplots(figsize=(6.3, 2.9))
for i, (lab, c, lo, hi, isq) in enumerate(pts):
    col = QPV if isq else CENTRE
    ax.plot([lo, hi], [i, i], color=col, lw=2, solid_capstyle="round"); ax.plot(c, i, "o", color=col, ms=7, mec="white", mew=1.2)
ax.axvline(0, color=INK, lw=.9); ax.set_yticks(range(len(pts))); ax.set_yticklabels([x[0] for x in pts]); ax.invert_yaxis()
ax.grid(axis="y", visible=False); ax.tick_params(left=False); ax.set_xlim(-2.5, 9.5)
ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:+.0f}".replace("+0", "0") + " pt"))
ax.set_xlabel("Effet estimé par période, en points de % (point : estimation ; trait : intervalle de confiance à 95 %)", fontsize=7.6)
save(fig, "g4_2_effets.png")

# 5.1 Surfaces CDAC et vacance en zone (deux panneaux, deux échelles distinctes)
fig, axs = plt.subplots(1, 2, figsize=(6.3, 2.5))
cd = [("2020", 583.5), ("2021", 688.2), ("2022", 765.4), ("2023", 625.4), ("2024", 605.8)]
b = axs[0].bar([c[0] for c in cd], [c[1] for c in cd], color=PERI, width=.55)
for r, (_, v) in zip(b, cd): axs[0].text(r.get_x()+r.get_width()/2, v + 12, fr(v, 0), ha="center", fontsize=7.5, color=INK)
axs[0].set_ylim(0, 880); axs[0].set_title("Surfaces autorisées en CDAC (milliers de m²)", fontsize=8.3, loc="left", color=INK); axs[0].tick_params(bottom=False)
axs[0].axvline(2.5, color=INK2, lw=.8, ls=(0, (3, 2))); axs[0].text(2.55, 840, "critère\nd'artificialisation", fontsize=6.8, color=INK2, va="top")
vac = [("2021", 6.9), ("2022", 6.9), ("2023", 7.4), ("2024", 8.1), ("2025", 8.4), ("2026", 8.5)]
axs[1].plot([v[0] for v in vac], [v[1] for v in vac], color=PERI, lw=2, marker="o", ms=4.5, mec="white", mew=1)
for i, (_, v) in enumerate(vac):
    if i in (0, 3, 5): axs[1].annotate(fr(v) + " %", (i, v), xytext=(0, 7), textcoords="offset points", ha="center", fontsize=7.5, color=INK)
axs[1].set_ylim(0, 10); axs[1].set_title("Vacance des zones commerciales (%)", fontsize=8.3, loc="left", color=INK)
fig.tight_layout(w_pad=2.5)
save(fig, "g5_1_cdac_vacance.png")

# 5.2 Habillement et chaussures, indice 2012 = 100
idx6 = {"peri": [100, 114.8, 115.2, 114.4, 108.7], "centre": [100, 95.5, 86.6, 79.6, 72.3], "qpv": [100, 93.2, 78.3, 72.6, 65.4], "reste": [100, 104.1, 99.1, 93.8, 88.2]}
fig, ax = plt.subplots(figsize=(6.3, 2.7))
for key, lab, c in [("peri", "Zones périphériques", PERI), ("reste", "Reste du territoire", RESTE), ("centre", "Centres-villes", CENTRE), ("qpv", "QPV", QPV)]:
    ax.plot(years, idx6[key], color=c, lw=2, marker="o", ms=4.5, mec="white", mew=1, label=lab)
    ax.annotate(f"{lab} : {fr(idx6[key][-1])}", (2025, idx6[key][-1]), xytext=(8, 0), textcoords="offset points", va="center", fontsize=8, color=INK)
ax.axhline(100, color=INK2, lw=.8); ax.set_xticks(years); ax.set_xlim(2011.5, 2025.4); ax.set_ylim(60, 122)
ax.spines["left"].set_visible(False); ax.tick_params(left=False); legend_top(ax, 4)
save(fig, "g5_2_habillement.png")

# 5.3 Croissance annuelle par période
g = {r["zone"]: r for r in rows("03_croissance_annuelle_employeurs_par_periode.csv")}
pers = ["2012-2016", "2016-2019", "2019-2022", "2022-2025"]
fig, ax = plt.subplots(figsize=(6.3, 2.6)); w = .2
for k, (key, lab, c) in enumerate(series):
    xs = [i + (k-1.5)*(w+.015) for i in range(4)]; vs = [float(g[key][p]) for p in pers]
    ax.bar(xs, vs, width=w, color=c, label=lab)
    for xx, v in zip(xs, vs): ax.text(xx, v + (.08 if v >= 0 else -.08), fr(v), ha="center", va="bottom" if v >= 0 else "top", fontsize=6.6, color=INK2)
ax.set_xticks(range(4)); ax.set_xticklabels(pers); ax.axhline(0, color=INK2, lw=.8); ax.tick_params(bottom=False); ax.set_ylim(-2.3, 3.6)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: fr(v, 0) + " %")); legend_top(ax, 4)
save(fig, "g5_3_croissance_periodes.png")
print("ok", sorted(os.listdir(OUT)))
