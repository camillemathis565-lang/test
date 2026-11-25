"""Figure : commerces employeurs (NAF 47.1-47.7) par lieu d'implantation, indice 2012 = 100.
Lit resultats/01_stocks_par_territoire.csv (sortie de 03_analyse.py)."""
import csv, os, textwrap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
rows = {r["zone"]: r for r in csv.DictReader(open(os.path.join(HERE, "..", "resultats", "01_stocks_par_territoire.csv")))}
Y = [2012, 2016, 2019, 2022, 2025]
ser = {z: [int(rows[z][f"e{y}"]) for y in Y] for z in rows}
ser["Total"] = [sum(v[i] for v in ser.values()) for i in range(len(Y))]
idx = {z: [x / v[0] * 100 for x in v] for z, v in ser.items()}

BLUE, ORANGE, GREY, INK, INK2, GRID = "#257de0", "#f47230", "#b4b4ac", "#191919", "#666666", "#e6e6e6"
S = [  # (clé, libellé, couleur, épaisseur, pointillé, gras)
    ("Zones commerciales périphériques", "Peripheral zones", BLUE, 2.6, False, True),
    ("Reste du territoire", "Rest of territory", GREY, 2.0, False, False),
    ("Total", "All shops", GREY, 2.0, True, False),
    ("Quartiers prioritaires (QPV)", "Priority neighbourhoods (QPV)", GREY, 2.0, False, False),
    ("Centres-villes (communes ≥ 5 000 hab.)", "Town centres", ORANGE, 2.6, False, True),
]
plt.rcParams.update({"font.family": "Inter", "font.size": 10.5})
fig, ax = plt.subplots(figsize=(9.2, 6.3), dpi=200)
fig.subplots_adjust(left=0.08, right=0.70, top=0.84, bottom=0.27)
for k, lab, c, lw, dash, _ in reversed(S):
    ax.plot(Y, idx[k], color=c, lw=lw, ls=(0, (4, 3)) if dash else "-", solid_capstyle="round", zorder=3 if c != GREY else 2)
    ax.scatter(Y, idx[k], s=22, color=c, zorder=4, edgecolors="white", linewidths=1.2)
# libellés directs en bout de ligne, écartés pour éviter les chevauchements
ends = sorted(((idx[k][-1], k, lab, c, b) for k, lab, c, _, _, b in S), reverse=True)
pos, minsep = [], 2.6
for v, *_ in ends:
    p = v if not pos or pos[-1] - v >= minsep else pos[-1] - minsep
    pos.append(p)
for (v, k, lab, c, b), p in zip(ends, pos):
    pct = v - 100
    ax.annotate(f"{lab}  {pct:+.1f}%".replace("-", "−"), xy=(2025, v), xytext=(2025.5, p), va="center", fontsize=10.5,
                color=c if c != GREY else INK2, fontweight="bold" if b else "normal", annotation_clip=False)
ax.axhline(100, color="#9c9c9c", lw=0.9, zorder=1)
ax.set_xlim(2011.6, 2025.4); ax.set_ylim(85, 130)
ax.set_xticks(Y); ax.set_yticks(range(85, 131, 5))
ax.grid(axis="y", color=GRID, lw=0.8); ax.set_axisbelow(True)
for s in ("top", "right", "left"): ax.spines[s].set_visible(False)
ax.spines["bottom"].set_color("#c8c8c8")
ax.tick_params(colors=INK2, length=0)
ax.set_xlabel("Stock on 1 January", color=INK2, fontsize=9.5, labelpad=6)
ax.set_ylabel("Index, 2012 = 100", color=INK2, fontsize=9.5)
fig.text(0.08, 0.945, "Employer shops: +25% in peripheral zones, −9% in town centres (2012-2025)",
         fontsize=13, fontweight="bold", color=INK)
fig.text(0.08, 0.895, "Active employer retail establishments (NAF 47.1-47.7, excl. online and market sales) by location, index 2012 = 100",
         fontsize=10, color=INK2)
note = ("Note: Metropolitan France. Each shop is counted where it is located, whatever the location of the firm's head office. Employer = at least one employee. "
        "Town centres: 300-700 m around the town hall, municipalities with 5,000+ inhabitants (excl. Paris, Lyon, Marseille). "
        "Locations are mutually exclusive (peripheral zone > QPV > town centre > rest). "
        f"Shops in 2012 and 2025: peripheral zones {ser['Zones commerciales périphériques'][0]:,} → {ser['Zones commerciales périphériques'][-1]:,}; "
        f"town centres {ser['Centres-villes (communes ≥ 5 000 hab.)'][0]:,} → {ser['Centres-villes (communes ≥ 5 000 hab.)'][-1]:,}; "
        f"QPV {ser['Quartiers prioritaires (QPV)'][0]:,} → {ser['Quartiers prioritaires (QPV)'][-1]:,}; all shops {ser['Total'][0]:,} → {ser['Total'][-1]:,}.")
fig.text(0.08, 0.075, textwrap.fill(note, 158), fontsize=7.6, color=INK2, va="bottom", linespacing=1.45)
fig.text(0.08, 0.03, "Source: OECD calculations based on Insee (Sirene stock and geolocation), Cerema (commercial zones), ANCT (QPV 2024), IGN (Admin Express).",
         fontsize=7.6, color=INK2)
for ext in ("png", "svg"):
    fig.savefig(os.path.join(HERE, f"fig_commerces_employeurs_par_zone.{ext}"), facecolor="white")
print({k: [round(x, 1) for x in v] for k, v in idx.items()})
