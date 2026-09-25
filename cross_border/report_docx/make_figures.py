"""Figures for the OECD-style chapter (PNG, 200 dpi). Run from cross_border/."""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

OUT = Path("report_docx/figures")
D = Path("outputs")
DARK, MID, LIGHT, GREY = "#1f4e79", "#4f8fcf", "#a9cbe8", "#8c8c8c"
plt.rcParams.update({
    "font.family": "Liberation Sans", "font.size": 9, "axes.edgecolor": "#555555",
    "axes.linewidth": 0.6, "axes.spines.top": False, "axes.spines.right": False,
    "xtick.color": "#333333", "ytick.color": "#333333", "axes.labelcolor": "#333333",
    "axes.grid": True, "grid.color": "#e3e3e3", "grid.linewidth": 0.6, "axes.axisbelow": True,
    "legend.frameon": False, "savefig.dpi": 200, "savefig.bbox": "tight",
})
NAMES = {"BE": "Belgium", "LU": "Luxembourg", "DE": "Germany", "CH": "Switzerland",
         "IT": "Italy", "MC": "Monaco", "ES": "Spain", "AD": "Andorra"}


def fig1_map():
    w = json.loads((D / "web_data.json").read_text())
    cells = np.array(w["cells"])
    fig, ax = plt.subplots(figsize=(6.3, 5.6))
    for f in w["countries"]["features"]:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            x, y = np.array(poly[0]).T
            ax.fill(x, y, color="#f2f2f2" if f["properties"]["id"] != "FR" else "#e8e8e8",
                    ec="#b0b0b0", lw=0.4, zorder=1)
    sc = ax.scatter(cells[:, 0], cells[:, 1], c=np.clip(cells[:, 4], 0, 0.75), cmap="Blues",
                    s=1.1, marker="s", linewidths=0, vmin=0, vmax=0.75, zorder=2)
    for f in w["borders"]["features"]:
        g = f["geometry"]
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        for ln in lines:
            x, y = np.array(ln).T
            ax.plot(x, y, color="#222222", lw=0.8, zorder=3)
    ax.set_xlim(-2.2, 10.6); ax.set_ylim(41.9, 51.3)
    ax.set_aspect(1 / np.cos(np.radians(46.5)))
    ax.axis("off")
    cb = fig.colorbar(sc, ax=ax, fraction=0.035, pad=0.01)
    cb.set_ticks([0, .25, .5, .75]); cb.set_ticklabels(["0%", "25%", "50%", "75%+"])
    cb.outline.set_linewidth(0.4)
    for lbl, (x, y) in {"FRANCE": (2.3, 46.8), "BELGIUM": (4.6, 50.75), "GERMANY": (8.6, 49.4),
                        "SWITZ.": (7.8, 46.75), "ITALY": (8.6, 45.0), "SPAIN": (-0.6, 42.15)}.items():
        ax.text(x, y, lbl, fontsize=7, color="#666666", ha="center")
    fig.savefig(OUT / "fig1_leakage_map.png"); plt.close(fig)


def fig2_balance():
    b = pd.read_csv(D / "border_balance.csv")
    b = b[(b.segment == "all") & ~b.neighbour.isin(["MC", "AD"])].copy()
    b["name"] = b.neighbour.map(NAMES)
    b = b.sort_values("fr_to_nb_eur")
    y = np.arange(len(b))
    fig, ax = plt.subplots(figsize=(6.3, 3.0))
    ax.barh(y + 0.19, b.fr_to_nb_eur / 1e6, 0.36, color=DARK, label="Spending by French residents in the neighbouring country")
    ax.barh(y - 0.19, b.nb_to_fr_eur / 1e6, 0.36, color=LIGHT, label="Spending by the neighbour's residents in France")
    ax.set_yticks(y, b.name); ax.grid(axis="y", visible=False)
    ax.set_xlabel("EUR million per year")
    ax.legend(loc="lower right", fontsize=8)
    fig.savefig(OUT / "fig2_border_balance.png"); plt.close(fig)


def fig3_impact():
    rows = [("Comparison goods", "Town centres", "Chains", 130.8, .041), ("Comparison goods", "Town centres", "Independents", 231.1, .029),
            ("Comparison goods", "Peripheral zones", "Chains", 152.8, .046), ("Comparison goods", "Peripheral zones", "Independents", 98.0, .033),
            ("Everyday goods", "Town centres", "Chains", -64.9, -.008), ("Everyday goods", "Town centres", "Independents", -194.1, -.011),
            ("Everyday goods", "Peripheral zones", "Chains", -367.1, -.039), ("Everyday goods", "Peripheral zones", "Independents", -131.4, -.046)]
    df = pd.DataFrame(rows, columns=["seg", "type", "own", "net", "pct"])
    labels = [f"{s.split()[0]} · {t.lower()} · {o.lower()}" for s, t, o in zip(df.seg, df.type, df.own)]
    y = np.arange(len(df))[::-1]
    fig, ax = plt.subplots(figsize=(6.3, 3.1))
    ax.barh(y, df.net, color=[DARK if v > 0 else MID for v in df.net], height=0.6)
    for yi, v, p in zip(y, df.net, df.pct):
        ax.text(v + (8 if v > 0 else -8), yi, f"{v:+.0f} ({p:+.1%})", va="center",
                ha="left" if v > 0 else "right", fontsize=7.5, color="#333333")
    ax.axvline(0, color="#555555", lw=0.6)
    ax.set_yticks(y, labels); ax.grid(axis="y", visible=False)
    ax.set_xlim(-520, 360); ax.set_xlabel("Net effect of open borders, EUR million per year")
    fig.savefig(OUT / "fig3_impact_by_type.png"); plt.close(fig)


def fig4_tobacco_fit():
    f = pd.read_csv(D / "excise_fit_tobacco.csv", index_col=0)
    ren = {"Nord (Belgique)": "Façade Nord (Belgium)", "Nord-Est (Luxembourg, Allemagne)": "Façade Nord-Est (LU, DE)",
           "Suisse": "Façade Switzerland", "Sud-Ouest (Espagne, Andorre)": "Façade Sud-Ouest (ES, AD)",
           "National (INSEE)": "France (INSEE)", "0-10 min from border (INSEE)": "Communes < 10 min from border",
           "10-20 min from border (INSEE)": "Communes 10–20 min from border"}
    f.index = [ren.get(i, i.replace(" (Apr-May)", "")) for i in f.index]
    f = f.iloc[::-1]
    y = np.arange(len(f))
    fig, ax = plt.subplots(figsize=(6.3, 3.6))
    for yi, (o, m) in zip(y, f.values):
        ax.plot([o * 100, m * 100], [yi, yi], color="#c9c9c9", lw=1.2, zorder=1)
    ax.scatter(f.iloc[:, 0] * 100, y, color=DARK, s=26, zorder=2, label="Observed (2020 closure)")
    ax.scatter(f.iloc[:, 1] * 100, y, facecolor="white", edgecolor=MID, lw=1.3, s=26, zorder=3, label="Model")
    ax.set_yticks(y, f.index); ax.grid(axis="y", visible=False)
    ax.set_xlabel("Increase in tobacco sales during the border closure, %")
    ax.legend(loc="lower right", fontsize=8)
    fig.savefig(OUT / "fig4_tobacco_fit.png"); plt.close(fig)


def fig5_tobacco_depts():
    d = pd.read_csv(D / "excise_departements.csv", index_col=0).tobacco_sales_gain_if_closed.sort_values()
    d = d[d > 0.2]
    fig, ax = plt.subplots(figsize=(6.3, 3.3))
    ax.barh(d.index, d.values * 100, color=DARK, height=0.6)
    for i, v in enumerate(d.values):
        ax.text(v * 100 + 1, i, f"{v:.0%}", va="center", fontsize=7.5)
    ax.grid(axis="y", visible=False); ax.set_xlim(0, 72)
    ax.set_xlabel("Increase in tobacconists' sales if cross-border purchases returned, %")
    fig.savefig(OUT / "fig5_tobacco_departements.png"); plt.close(fig)


def butterfly(df, left, right, llab, rlab, fname, cap=25, height=3.6):
    df = df.assign(net=df[right] - df[left]).sort_values("net", ascending=False)
    y = np.arange(len(df))
    fig, ax = plt.subplots(figsize=(6.3, height))
    ax.barh(y, -df[left], color=DARK, height=0.62, label=llab)
    ax.barh(y, np.minimum(df[right], cap), color=LIGHT, height=0.62, label=rlab)
    for yi, l, r in zip(y, df[left], df[right]):
        ax.text(-l - 0.6, yi, f"{l:.1f}", va="center", ha="right", fontsize=7)
        ax.text(min(r, cap) + 0.6, yi, f"{r:.1f}" + (" ›" if r > cap else ""), va="center", fontsize=7)
    ax.set_yticks(y, df.country)
    for t in ax.get_yticklabels():
        if t.get_text() == "France":
            t.set_fontweight("bold")
    ax.axvline(0, color="#555555", lw=0.6); ax.grid(axis="y", visible=False)
    ax.set_xlim(-26, cap + 6)
    ticks = [-20, -10, 0, 10, 20]
    ax.set_xticks(ticks, [f"{abs(t)}" for t in ticks]); ax.set_xlabel("%")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.14), ncol=1, fontsize=8)
    fig.savefig(OUT / fname); plt.close(fig)


def fig6_7_international():
    k = pd.read_csv(D / "intl_tobacco_flows_kpmg2024.csv")
    keep = ["France", "Belgium", "Luxembourg", "Germany", "Switzerland", "Italy", "Spain", "Norway", "Netherlands",
            "Ireland", "UK", "Denmark", "Sweden", "Finland", "Austria", "Poland", "Czech Republic", "Estonia"]
    k = k[k.country.isin(keep)].replace({"Czech Republic": "Czechia", "UK": "United Kingdom"})
    butterfly(k, "legal_inflow_pct", "outflow_pct_of_sales",
              "Consumption bought legally abroad (% of consumption)",
              "Legal sales consumed abroad (% of legal domestic sales)", "fig6_tobacco_international.png", height=4.2)
    e = pd.read_csv(D / "intl_household_spending_abroad_eurostat2023.csv")
    keep2 = ["France", "Belgium", "Luxembourg", "Germany", "Switzerland", "Italy", "Spain", "Norway", "Netherlands",
             "Ireland", "Denmark", "Sweden", "Finland", "Austria", "Poland", "Czechia", "Portugal", "Croatia"]
    e = e[e.country.isin(keep2)]
    butterfly(e, "out_pct", "in_pct", "Residents' spending abroad (% of resident household consumption)",
              "Non-residents' spending in the country (% of domestic household consumption)",
              "fig7_household_international.png", cap=26, height=4.2)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    fig1_map(); fig2_balance(); fig3_impact(); fig4_tobacco_fit(); fig5_tobacco_depts(); fig6_7_international()
    print(sorted(p.name for p in OUT.glob("*.png")))
