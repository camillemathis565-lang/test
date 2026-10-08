"""Trajectoire du commerce de centre-ville dans les villes Action Cœur de Ville (ACV), avant (2012-2019)
et après (2019-2025) le lancement du programme en 2018. Sert à repérer les villes où la tendance s'inverse,
pour le choix des terrains d'entretien. Lecture descriptive : aucun effet causal du programme n'est estimé.

Entrées : centres.parquet (produit par 02_geographies.py) et la liste des villes ACV de la Caisse des Dépôts
(opendata.caissedesdepots.fr, jeu « villes_action_coeurdeville », export CSV).
"""
import os
import pandas as pd

DATA = os.environ.get("DATA_DIR", ".")
GEO = os.path.join(DATA, os.environ.get("GEO_SUBDIR", "geo"))
ACV = os.environ.get("ACV_CSV", os.path.join(DATA, "..", "acv", "cdc.csv"))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resultats")

cen = pd.read_parquet(f"{GEO}/centres.parquet").drop(columns="geometry")
acv = pd.read_csv(ACV, sep=";", dtype=str)
m = cen.merge(acv[["insee_com", "id_acv", "Nom Officiel Département", "Nom Officiel Région"]],
              left_on="INSEE_COM", right_on="insee_com")

# Agrégats : centres ACV et hors ACV
rows = []
for lab, d in [("Centres des villes ACV", m), ("Centres hors ACV", cen[~cen.INSEE_COM.isin(acv.insee_com)]), ("Ensemble des centres", cen)]:
    rows.append({"groupe": lab, "centres": len(d), "e2012": d.e2012.sum(), "e2019": d.e2019.sum(), "e2025": d.e2025.sum(),
                 "evol_2012_2019_pct": round(100 * (d.e2019.sum() / d.e2012.sum() - 1), 1),
                 "evol_2019_2025_pct": round(100 * (d.e2025.sum() / d.e2019.sum() - 1), 1)})
agg = pd.DataFrame(rows)

# Par ville : employeurs (mesure principale) et ensemble des établissements (contrôle)
m["evol_2012_2019_pct"] = (100 * (m.e2019 / m.e2012 - 1)).round(1)
m["evol_2019_2025_pct"] = (100 * (m.e2025 / m.e2019 - 1)).round(1)
m["tous_2019_2025_pct"] = (100 * (m.r2025 / m.r2019 - 1)).round(1)
m["dpop_2014_2020_pct"] = (100 * m.dpop_14_20).round(1)
m["inversion"] = (m.e2019 >= 30) & (m.evol_2012_2019_pct <= -5) & (m.evol_2019_2025_pct >= 5)
cols = ["NOM", "INSEE_COM", "Nom Officiel Département", "Nom Officiel Région", "POPULATION", "e2012", "e2016", "e2019", "e2022", "e2025",
        "evol_2012_2019_pct", "evol_2019_2025_pct", "tous_2019_2025_pct", "dpop_2014_2020_pct", "dist_peri_km", "inversion"]
villes = m[cols].sort_values(["inversion", "evol_2019_2025_pct"], ascending=False)

agg.to_csv(f"{OUT}/16_acv_agregats.csv", index=False)
villes.to_csv(f"{OUT}/17_acv_trajectoires_villes.csv", index=False)
print(agg.to_string(index=False))
print(villes[villes.inversion].to_string(index=False))
