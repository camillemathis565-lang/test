# Programmes 2027 — Comparateur des programmes politiques français

Dossier de conception d'une plateforme **factuelle, sourcée et politiquement neutre** pour comparer les programmes des partis et candidats à l'élection présidentielle française de 2027 (LFI, RN, Renaissance, PCF, PS, Les Écologistes, Place publique, LR, Reconquête, Horizons, MoDem, etc.), leur évolution depuis 2002, et leur proximité avec des partis étrangers.

> Principe cardinal : **aucune affirmation sans source retrouvable en un clic.** Toute synthèse produite par IA est rattachée à un extrait original (URL, date, auteur, citation exacte, archive horodatée).

## Sommaire des livrables

| # | Livrable | Fichier |
|---|----------|---------|
| 1 | Vision produit détaillée | [docs/01-vision-produit.md](docs/01-vision-produit.md) |
| 2 | Architecture technique | [docs/02-architecture-technique.md](docs/02-architecture-technique.md) |
| 3 | Schéma de base de données | [docs/03-modele-de-donnees.md](docs/03-modele-de-donnees.md) + [db/schema.sql](db/schema.sql) |
| 4 | Flux de collecte des données | [docs/04-collecte-des-donnees.md](docs/04-collecte-des-donnees.md) |
| 5 | Système de comparaison (fonctions 1 à 6) | [docs/05-moteurs-fonctionnels.md](docs/05-moteurs-fonctionnels.md) |
| 6 | Algorithmes de similarité | [docs/06-algorithmes-similarite.md](docs/06-algorithmes-similarite.md) |
| 7 | Maquettes des principales pages | [docs/07-maquettes.md](docs/07-maquettes.md) + [maquettes/index.html](maquettes/index.html) (prototype cliquable) |
| 8–9 | Roadmap MVP et V2 | [docs/08-roadmap.md](docs/08-roadmap.md) |
| 10 | Coût et complexité | [docs/09-couts-complexite.md](docs/09-couts-complexite.md) |
| 11 | Risques juridiques et réglementaires | [docs/10-risques-juridiques.md](docs/10-risques-juridiques.md) |
| 12 | Montée en charge | [docs/11-montee-en-charge.md](docs/11-montee-en-charge.md) |
| 13 | Modèle économique | [docs/12-modele-economique.md](docs/12-modele-economique.md) |
| 14 | Spécifications techniques complètes | [docs/13-specifications-techniques.md](docs/13-specifications-techniques.md) |

Annexes :
- Taxonomie complète et extensible des politiques publiques : [taxonomie/taxonomie.yaml](taxonomie/taxonomie.yaml)
- Référentiel des partis français (filiations 2002 → 2027) : [donnees-reference/partis-france.yaml](donnees-reference/partis-france.yaml)
- Référentiel des partis étrangers (12 pays) : [donnees-reference/partis-international.yaml](donnees-reference/partis-international.yaml)
- Catalogue des « questions de politique publique » (axes de comparaison) : [taxonomie/questions-politiques.yaml](taxonomie/questions-politiques.yaml)

## Avertissement sur les contenus d'exemple

Les maquettes et exemples utilisent des partis anonymisés (« Parti A », « Parti B »…) et des propositions fictives. **Aucune position n'est attribuée à un parti réel dans ce dossier** : publier une position non sourcée contredirait le principe fondateur du projet. Les référentiels de partis (noms, dates de création, filiations) sont des données institutionnelles à revérifier lors de l'ingestion.

## Calendrier critique

Nous sommes en octobre 2026 ; le premier tour est attendu en avril 2027. La roadmap ([docs/08-roadmap.md](docs/08-roadmap.md)) prévoit donc un **MVP « campagne » en ligne mi-janvier 2027**, avant la publication de la plupart des programmes, puis un enrichissement continu pendant la campagne. L'historique 2002-2017 complet et la comparaison internationale complète arrivent en V2.
