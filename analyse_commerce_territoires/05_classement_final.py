"""Classement final des villes ACV à interviewer : score composite et transparent croisant
Sirene (trajectoire du commerce employeur de centre-ville), atlas ANCT T4 2025 (vacance commerciale et
des logements, ventes immobilières, dispositifs mobilisés), baromètre Codata/FACT 2026 (séries 2019-2025),
palmarès FACT/Codata 2018-2022 et observatoire des mobilités ANCT/MyTraffic (mars 2024)."""
import pandas as pd, numpy as np
R = "resultats"
d = pd.read_csv(f"{R}/22_score_atlas_seul.csv", dtype={"insee_com": str})
t = pd.read_csv(f"{R}/19_acv_typologie_villes.csv", dtype={"INSEE_COM": str})
d = d.merge(t[["INSEE_COM", "e2012", "e2019", "e2025", "evol_2012_2019_pct", "evol_2019_2025_pct", "tous_2019_2025_pct", "fact_18_22", "dpop_2014_2020_pct"]],
            left_on="insee_com", right_on="INSEE_COM", how="left")
CODATA = {"Saint-Dizier": (19.7, 16.8), "Cavaillon": (19.4, 16.8), "Guéret": (27.7, 23.8), "Gap": (12.4, 11.6), "Vesoul": (13.9, 12.9),
          "Pithiviers": (23.1, 17.4), "Grasse": (18.9, 26.4), "Bressuire": (17.9, 8.6), "Nemours": (18.1, 15.6), "Foix": (13.4, 14.8),
          "Épernay": (8.8, 7.6), "Moulins": (16.3, 18.8)}
MYTRAFFIC = {"Pau": "2,55 M visites/mois ; attractivité 87,7 %", "Chambéry": "2,7 M visites/mois", "Revel": "+13 % de visiteurs extérieurs",
             "Vannes": "2,25 M visites/mois", "Poissy": "2,55 M visites/mois", "Limoges": "2,9 M visites/mois ; attractivité 89,7 %",
             "Briançon": "+12,3 % de visiteurs extérieurs", "Millau": "+20,2 % de visiteurs extérieurs", "Saint-Michel-sur-Orge": "+13,9 % de visiteurs extérieurs",
             "Albi": "attractivité 90,1 %", "Nevers": "attractivité 89,1 %", "Mont-de-Marsan": "attractivité 88,3 %", "Châteauroux": "attractivité 90 %",
             "Boulogne-sur-Mer": "attractivité 90,7 %", "Colmar": "attractivité 87,6 %"}
LVL = {"< 5 %": 3, "5-10 %": 2, "10-15 %": 1, "15-20 %": 0, "> 20 %": 0}
def lvl(v): return 3 if v < 5 else 2 if v < 10 else 1 if v < 15 else 0
rows = []
for _, r in d.iterrows():
    s = {}
    ok = r.e2019 >= 30 if pd.notna(r.e2019) else False
    post, pre = r.evol_2019_2025_pct, r.evol_2012_2019_pct
    s["pts_commerce_sirene"] = (2 if post >= 5 else 1 if post >= -5 else 0) + (1 if (pre <= -10 and post >= -5) else 0) + (0.5 if r.tous_2019_2025_pct >= 0 else 0) if ok else 0
    cod = CODATA.get(r.lib_com)
    s["pts_vacance_niveau"] = lvl(cod[1]) if cod else LVL.get(r.vacance_commerciale_2025, 0)
    s["pts_vacance_tendance"] = (2 if cod[0] - cod[1] >= 3 else 1 if cod[0] - cod[1] >= 1 else 0) if cod else (1 if pd.notna(r.fact_18_22) and s["pts_vacance_niveau"] >= 1 else 0)
    s["pts_habitat"] = {"< 3 %": 1, "3-4 %": 0.5}.get(r.vacance_logement_2025, 0) + (0.5 if r.ventes_immo_tendance_2018_2023 == "hausse" else 0)
    s["pts_mobilisation"] = min(2, 0.5 * r.mobilisation)
    s["pts_frequentation"] = 0.5 if r.lib_com in MYTRAFFIC else 0
    rows.append(s)
S = pd.DataFrame(rows, index=d.index)
d = pd.concat([d, S], axis=1)
d["score_final"] = S.sum(axis=1)
d["codata_2019_2025"] = d.lib_com.map(lambda n: f"{CODATA[n][0]} % → {CODATA[n][1]} %" if n in CODATA else "")
d["mytraffic"] = d.lib_com.map(MYTRAFFIC).fillna("")
out = d.sort_values("score_final", ascending=False)
out.to_csv(f"{R}/23_classement_final_villes_acv.csv", index=False)
cols = ["lib_com", "Nom Officiel Région", "POPULATION", "score_final"] + list(S.columns) + ["evol_2019_2025_pct", "vacance_commerciale_2025", "codata_2019_2025", "vacance_logement_2025", "ventes_immo_tendance_2018_2023", "mobilisation", "mytraffic"]
pd.set_option("display.width", 320)
print(out[cols].head(30).to_string(index=False))
