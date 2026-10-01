# Chargement de la base unique (base.json), partagée avec le registre en ligne
import json, os
_B = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "base.json"), encoding="utf-8"))
_V = _B["meta"]["verifications"]
V_A, V_B, V_C, V_D, V_E = (_V[k] for k in "ABCDE")
(T_STAT, T_INST, T_ADM, T_LOI, T_ACAD, T_PRIV, T_PRESSE) = _B["meta"]["types"]
SOURCES = [(s["ref"], s["organisme"], s["titre"], s["date"], s["type"], s["lien"]) for s in _B["sources"]]
F = [(c["theme"], c["indicateur"], c["valeur"], c["unite"], c["annees"], c["territoire"], c["champ"], c["ref"], _V[c["verification"]], c["remarques"]) for c in _B["chiffres"]]
GAPS = [(g["categorie"], g["besoin"], g["donnee"], g["detenteur"], g["apport"], g["acces"], g["statut"], g["priorite"], g["demarche"]) for g in _B["manques"]]
OWN = [(o["indicateur"], o["valeur"], o["unite"], o["annees"], o["champ"]) for o in _B["propres"]]
