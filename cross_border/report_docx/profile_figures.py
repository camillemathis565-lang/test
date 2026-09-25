"""Figures 7-11 for section 2.2 (retail structural profile)."""
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

D = Path("report_docx/data"); OUT = Path("report_docx/figures")
plt.rcParams.update({
    "font.family": "Liberation Sans", "font.size": 9, "axes.edgecolor": "#555555", "axes.linewidth": 0.6,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "grid.color": "#e3e3e3",
    "grid.linewidth": 0.6, "axes.axisbelow": True, "legend.frameon": False, "savefig.dpi": 200, "savefig.bbox": "tight"})
NB = ["Belgium", "Luxembourg", "Germany", "Switzerland", "Italy", "Spain"]
COL = {"Belgium": "#1f4e79", "Luxembourg": "#c0504d", "Germany": "#4f8fcf", "Switzerland": "#e8a33d",
       "Italy": "#6aa84f", "Spain": "#8e7cc3", "All borders": "#222222"}
band = pd.read_csv(D / "profile_by_band.csv")
zones = pd.read_csv(D / "profile_border_vs_hinterland.csv")
nat = pd.read_csv(D / "profile_mainland.csv", index_col=0).iloc[0]
order = ["0–10", "10–20", "20–30", "30–50", "50–75", "75–100"]


def lines(col, fname, ylabel, natval, ylim=None):
    fig, ax = plt.subplots(figsize=(6.3, 3.2))
    x = np.arange(len(order))
    for n in NB + ["All borders"]:
        bb = band[band.neighbour == n].set_index("band").reindex(order)
        s = bb[col].where(bb["pop"] >= 50000)  # hide bands with too few residents
        ax.plot(x, s.values, marker="o", ms=3.5, lw=2.2 if n == "All borders" else 1.4, color=COL[n],
                label=n, zorder=3 if n == "All borders" else 2)
    ax.axhline(natval, color="#777777", lw=1, ls="--", zorder=1)
    ax.text(len(order) - 0.5, natval, " Mainland\n France", va="center", fontsize=7.5, color="#555555")
    ax.set_xticks(x, [o + " km" for o in order]); ax.set_ylabel(ylabel)
    if ylim: ax.set_ylim(*ylim)
    ax.set_xlim(-0.3, len(order) - 0.4)
    ax.legend(ncol=4, fontsize=7.5, loc="upper center", bbox_to_anchor=(0.5, -0.13))
    fig.savefig(OUT / fname); plt.close(fig)


lines("outlets_per10k", "fig7_outlets_by_distance.png", "Retail outlets per 10 000 inhabitants", nat.outlets_per10k)
lines("tob_per10k", "fig9_tobacconists_by_distance.png", "Tobacconists per 10 000 inhabitants", nat.tob_per10k, (0, 6))

# Fig 8: border zone (<20 km) relative to mainland France, by indicator and neighbour
ind = [("outlets_per10k", "All retail outlets"), ("large_food_per10k", "Super- and hypermarkets"),
       ("fuel_per10k", "Fuel stations"), ("tob_per10k", "Tobacconists")]
bz = zones[zones.zone == "border"].set_index("neighbour")
groups = NB + ["All borders"]
fig, ax = plt.subplots(figsize=(6.3, 3.6))
w = 0.2; y = np.arange(len(groups))[::-1]
shades = ["#1f4e79", "#4f8fcf", "#a9cbe8", "#e8a33d"]
for k, (c, lab) in enumerate(ind):
    v = (bz.loc[groups, c] / nat[c] - 1) * 100
    ax.barh(y + (1.5 - k) * w, v.values, w, color=shades[k], label=lab)
ax.axvline(0, color="#555555", lw=0.6)
ax.set_yticks(y, groups); ax.grid(axis="y", visible=False)
ax.set_xlabel("Difference from mainland France, % (per 10 000 inhabitants)")
ax.legend(ncol=2, fontsize=7.5, loc="upper center", bbox_to_anchor=(0.5, -0.14))
fig.savefig(OUT / "fig8_border_zone_vs_mainland.png"); plt.close(fig)

# Fig 10: retail employment growth 2012-2024, border zone vs hinterland
fig, ax = plt.subplots(figsize=(6.3, 3.0))
g2 = [g for g in groups if g != "Luxembourg"]  # Luxembourg hinterland too small (36 000 residents)
x = np.arange(len(g2))
b_ = zones[zones.zone == "border"].set_index("neighbour").loc[g2, "jobs_growth_12_24"] * 100
h_ = zones[zones.zone == "hinterland"].set_index("neighbour").loc[g2, "jobs_growth_12_24"] * 100
ax.bar(x - 0.19, b_.values, 0.36, color="#1f4e79", label="Border zone (0–20 km)")
ax.bar(x + 0.19, h_.values, 0.36, color="#a9cbe8", label="Hinterland (50–100 km)")
for xi, v in zip(x, b_.values): ax.text(xi - 0.19, v + (0.6 if v >= 0 else -2), f"{v:.0f}", ha="center", fontsize=7)
for xi, v in zip(x, h_.values): ax.text(xi + 0.19, v + (0.6 if v >= 0 else -2), f"{v:.0f}", ha="center", fontsize=7)
ax.axhline(nat.jobs_growth_12_24 * 100, color="#777777", lw=1, ls="--")
ax.text(len(g2) - 0.45, nat.jobs_growth_12_24 * 100 + 0.8, "Mainland France", fontsize=7.5, color="#555555", ha="right")
ax.axhline(0, color="#555555", lw=0.6)
ax.set_xticks(x, g2); ax.grid(axis="x", visible=False); ax.set_ylabel("%")
ax.legend(fontsize=7.5, loc="upper left")
fig.savefig(OUT / "fig10_retail_jobs_growth.png"); plt.close(fig)

# Fig 11: both sides of the border (OSM)
bs = pd.read_csv(D / "both_sides_osm.csv")
names = {"BE": "Belgium", "LU": "Luxembourg", "DE": "Germany", "CH": "Switzerland", "IT": "Italy", "ES": "Spain"}
bs["name"] = bs.border.map(names)
fr = bs[bs.side == "France"].set_index("name").loc[NB]; nb = bs[bs.side == "Neighbour"].set_index("name").loc[NB]
fig, ax = plt.subplots(figsize=(6.3, 2.9))
x = np.arange(len(NB))
ax.bar(x - 0.19, fr.shops_per_1000, 0.36, color="#1f4e79", label="French side")
ax.bar(x + 0.19, nb.shops_per_1000, 0.36, color="#a9cbe8", label="Neighbouring side")
for xi, a, c in zip(x, fr.shops_per_1000, nb.shops_per_1000):
    ax.text(xi - 0.19, a + 0.1, f"{a:.1f}", ha="center", fontsize=7); ax.text(xi + 0.19, c + 0.1, f"{c:.1f}", ha="center", fontsize=7)
ax.set_xticks(x, NB); ax.grid(axis="x", visible=False); ax.set_ylabel("Shops per 1 000 residents")
ax.legend(fontsize=7.5, loc="upper left")
fig.savefig(OUT / "fig11_both_sides.png"); plt.close(fig)
print("ok")
