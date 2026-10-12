# Observatoire du commerce de détail (version 2)

Plateforme publiée : https://claude.ai/artifact/M3Cr5q9xH7mjFWU5wq8wj5 (version 1 du registre : https://claude.ai/artifact/5cnSPeBPzkuzvPmuBV8f9H).

## Contenu

- `index.html` : application (une seule page, sans dépendance externe hormis les polices).
- `data/*.json` : données publiées avec la page.
  - `communes.json` : 34 744 communes de l'Hexagone et de Corse, 70 variables (commerces Sirene 2012-2025, centre, périphérie, QPV, secteurs, entrées et sorties, tailles, e-commerce, artificialisation 2011-2024, population, programmes).
  - `zones.json`, `qpv.json`, `centres.json` : zones commerciales périphériques, quartiers prioritaires, centres-villes.
  - `frontieres.json` : Insee Première n° 2075 (achats transfrontaliers 2024).
  - `contenus.json` : sources, jeux de données, chiffres nationaux sourcés, politiques et dispositifs (dont le registre v1).
- `build/build_data.py` et `build/build_content.py` : scripts de préparation.

## Reconstruire les données

```
SRC=<répertoire de travail> python3 build/build_data.py
V1DB=<export de la base du registre v1> python3 build/build_content.py
```

`SRC` contient les fichiers listés en tête de `build_data.py` (Sirene, inventaire Cerema des zones, QPV 2024, ADMIN EXPRESS, CONSOENAF 2011-2025, populations Insee, Insee Première n° 2075, listes ACV et PVD).

## Limites connues

- Indicateurs non disponibles en données ouvertes à l'échelle territoriale (chiffre d'affaires, fréquentation, vacance exhaustive, usages numériques, émissions) : listés dans l'onglet « Sources et données », rubrique « Données manquantes ».
- Indices de vitalité et de durabilité : expérimentaux, calculés en centiles au sein d'un même niveau territorial.
- Les comparaisons des questions de recherche sont descriptives et ne mesurent pas d'effet causal.
