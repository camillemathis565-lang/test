"""Map: share of in-store card spending made in neighbouring countries, by département, 2024 (Insee Première n° 2075).
Run from cross_border/: python report_docx/map_spending_abroad.py"""
import sys
import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.patches import Patch

sys.path.insert(0, ".")
from cbattr import config as C

DATA = """57;13.9
66;12.0
54;9.5
68;8.8
74;8.7
64;8.4
67;7.8
08;7.7
01;7.0
59;7.0
06;6.4
09;5.9
55;5.6
65;5.4
11;5.3
40;4.9
25;4.8
90;4.4
31;4.2
34;4.2
05;4.2
75;3.8
82;3.5
32;3.4
92;3.1
81;3.1
33;3.0
12;2.9
30;2.8
39;2.7
13;2.7
69;2.5
73;2.5
47;2.5
38;2.4
94;2.4
84;2.4
51;2.2
02;2.2
62;2.2
93;2.2
88;2.1
78;2.1
83;2.1
91;2.0
46;2.0
04;2.0
07;1.9
70;1.9
77;1.9
48;1.9
63;1.8
95;1.8
16;1.8
17;1.8
19;1.8
42;1.7
26;1.7
52;1.7
60;1.7
24;1.7
21;1.6
10;1.6
43;1.5
71;1.5
35;1.5
56;1.5
80;1.5
44;1.5
15;1.4
03;1.4
45;1.4
76;1.4
79;1.4
87;1.4
85;1.4
89;1.3
29;1.3
37;1.3
14;1.3
50;1.3
86;1.3
58;1.2
23;1.2
49;1.2
22;1.1
28;1.1
18;1.1
41;1.1
27;1.1
61;1.0
72;1.0
53;1.0
36;0.9"""
v = pd.DataFrame([l.split(";") for l in DATA.splitlines()], columns=["dep", "pct"]).astype({"pct": float})
v.to_csv("report_docx/data/insee_ip2075_depenses_etranger_dep.csv", index=False)

lau = gpd.read_file(C.RAW / "LAU_2024.geojson")
lau = lau[lau.CNTR_CODE == "FR"].copy()
lau["dep"] = lau.GISCO_ID.str[3:5]
lau = lau[~lau.dep.isin(["97"])]
dep = lau.dissolve("dep").reset_index().to_crs(2154)
dep = dep.merge(v, on="dep", how="left")
cn = gpd.read_file(C.RAW / "countries_01m.geojson").to_crs(2154)

bins = [(9, 99, "9 % ou plus", "8B0F14"), (6, 9, "De 6 à moins de 9 %", "D7301F"), (3, 6, "De 3 à moins de 6 %", "F39C8B"), (0, 3, "Moins de 3 %", "FBE3DC")]
def col(p):
    if pd.isna(p): return "#C8C8C8"
    for lo, hi, _, c in bins:
        if lo <= p < hi: return "#" + c
dep["c"] = dep.pct.map(col)

fig, ax = plt.subplots(figsize=(7.2, 7.2), dpi=220)
xmin, ymin, xmax, ymax = dep.total_bounds
pad = 95000
ax.set_facecolor("white")
cn[cn.CNTR_ID != "FR"].boundary.plot(ax=ax, color="#C9CED4", linewidth=0.5)
dep.plot(ax=ax, color=dep.c, edgecolor="white", linewidth=0.35)
cn[cn.CNTR_ID == "FR"].boundary.plot(ax=ax, color="#7F8C99", linewidth=0.6)
LAB = {"57": (95, 60), "54": (-120, 40), "59": (-110, 25), "68": (95, -10), "74": (100, 0), "66": (0, -70), "64": (-80, -45), "08": (-15, 95)}
for code, (dx, dy) in LAB.items():
    r = dep[dep.dep == code].iloc[0]
    p = r.geometry.representative_point()
    ax.annotate(f"{r.NUTS_NAME if False else ''}{r.pct:.1f}".replace(".", ",") + " %", (p.x, p.y), xytext=(p.x + dx * 1000, p.y + dy * 1000),
                ha="center", va="center", fontsize=12, fontweight="bold", color="#404040",
                arrowprops=dict(arrowstyle="-", color="#404040", lw=0.6, shrinkA=2, shrinkB=0))
ax.set_xlim(xmin - pad, xmax + pad); ax.set_ylim(ymin - pad / 2, ymax + pad / 2)
ax.set_axis_off()
fig.savefig("report_docx/fig_map_spending_abroad.png", bbox_inches="tight", pad_inches=0.02, facecolor="white")
print("ok", dep.pct.isna().sum(), "missing")
