# Vacance commerciale 2025 par ville ACV (atlas ANCT)

L'atlas national Action cœur de ville (ANCT, T4 2025, p. 23) cartographie la part d'emplacements commerciaux
vacants en 2025 par commune, en 5 tranches (données Codata). La carte est une image : `dots.py` détecte les
points par leur couleur sur un rendu à 300 dpi de la page 23 (`pdftoppm -r 300 -f 23 -l 23`), et `match.py`
rattache chaque point à sa commune en projetant les centroïdes des villes ACV (Lambert-93) sur la carte
(ajustement polynomial, erreur médiane < 0,5 px). Les binômes ACV (Lens-Liévin, Douai/Sin-le-Noble…) partagent
un point. Non attribuées : Trappes, Pontoise, Valenciennes, Douai, Saint-Michel-sur-Orge, Corse.

Sorties : `resultats/18_atlas_vacance_2025_par_ville.csv` et `resultats/19_acv_typologie_villes.csv`
(trajectoire Sirene + tranche de vacance 2025 + palmarès FACT/Codata + typologie).
