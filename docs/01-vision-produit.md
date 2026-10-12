# 1. Vision produit

## 1.1 Mission

Permettre à toute personne de répondre en moins de deux minutes, preuves à l'appui, à la question : **« Que proposent les partis sur ce sujet, en quoi diffèrent-ils, et d'où vient cette information ? »**

La plateforme (nom de travail : **Programmes 2027**) est une infrastructure de connaissance publique : une base de données structurée et sourcée de propositions politiques, avec des outils de comparaison, d'historique, de mise en contexte et un assistant conversationnel qui ne répond qu'à partir de sources citées.

## 1.2 Promesse de valeur par public

| Public | Besoin principal | Ce que la plateforme apporte |
|--------|------------------|------------------------------|
| Citoyens | Comprendre vite, sans jargon, sans être orienté | Fiches thématiques en langage clair, comparateur, assistant qui cite ses sources |
| Journalistes | Vérifier vite une citation, retrouver une position ancienne, détecter un revirement | Recherche plein texte et sémantique, chronologie par parti, export de citations avec archive, alertes |
| Étudiants / enseignants | Matériau pédagogique fiable | Fiches de méthode, historique 2002-2027, jeux de données ouverts |
| Chercheurs | Données codées, reproductibles | API, exports (CSV/Parquet), codage compatible Manifesto Project (MARPOR) et Comparative Agendas Project (CAP) |
| Fonctionnaires / administrations | Anticiper les orientations possibles par politique publique | Vue par politique publique, paramètres chiffrés (âge légal, taux, montants), coûts annoncés vs évaluations |
| Think tanks / ONG | Suivre leurs sujets, comparer aux évaluations | Alertes thématiques, liens vers évaluations publiées, comparaison internationale |
| Acteurs politiques | Vérifier la représentation fidèle de leurs positions | Droit de réponse et de correction outillé, journal public des corrections |

## 1.3 Principes non négociables

1. **Traçabilité totale** : chaque proposition pointe vers un extrait exact (citation verbatim, URL, date, auteur, archive horodatée, empreinte SHA-256 du document). Contrainte imposée au niveau de la base (clé étrangère obligatoire), pas seulement dans l'interface.
2. **IA assistante, jamais autorité** : l'IA extrait, classe, rapproche et résume ; un humain valide avant publication du statut « vérifié ». Les contenus non validés sont affichés comme tels.
3. **Neutralité procédurale** plutôt que neutralité proclamée : mêmes règles pour tous les partis, méthodes publiques, ordre d'affichage alphabétique ou aléatoire (au choix de l'utilisateur), palette de couleurs neutre par défaut, tableau de bord public de couverture (nombre de propositions et de sources par parti), audits de symétrie de l'assistant.
4. **Pas de verdict partisan** : la plateforme ne dit jamais qu'une mesure est bonne ou mauvaise. Elle montre ce qui est proposé, ce que disent les données publiques et les évaluations publiées, et qui les a produites.
5. **L'absence est une information, mais prudente** : « aucune proposition trouvée dans les sources indexées à la date du JJ/MM » — jamais « le parti n'a pas de position ».
6. **Ouverture** : données sous licence ouverte (ODbL), méthodologie et code d'évaluation publiés, journal des corrections public.
7. **Indépendance financière** : aucun financement d'un parti, candidat, élu en campagne ou entité liée ; liste publique des financeurs (voir [modèle économique](12-modele-economique.md) et [risques juridiques](10-risques-juridiques.md)).

## 1.4 Périmètre fonctionnel

| Fonction | Description | Version |
|----------|-------------|---------|
| F0 — Fiches sources & propositions | Page par proposition, par document, par parti, par candidat | MVP |
| F1 — Comparateur entre partis | Thème × partis : accords, divergences, propositions uniques, sujets absents ; tableau, matrice, cartes, chronologie, radar, mise en contexte socio-économique | MVP (tableau, matrice, cartes, contexte) → V1.5 (radar, chronologie) |
| F2 — Évolution historique | 2002 → 2027 : maintenu / nouveau / abandonné / changement / durcissement / assouplissement ; frise | MVP (2022 → 2027) → V2 (2002 → 2027) |
| F3 — Comparaison internationale | 12 pays, partis analogues, mesures équivalentes, diffusion d'une idée, carte | V2 (pilote Allemagne + Espagne + Italie en V1.5) |
| F4 — Alignement idéologique | Scores de proximité par dimension, réseaux dynamiques | V1.5 |
| F5 — Mise en contexte / fact-checking | Données publiques, statistiques officielles, évaluations, coûts | MVP (indicateurs + coûts annoncés) → V1.5 (évaluations indépendantes) |
| F6 — Assistant conversationnel | Questions en langage naturel, citations systématiques | MVP (questions sur 2027 et 2022) |
| Transverse | Recherche, alertes, API, exports, droit de réponse | MVP (recherche, droit de réponse) → V1.5 (API, alertes) |

## 1.5 Concepts clés du produit

- **Source** : un document original (programme PDF, page web, vidéo, transcription, communiqué, texte parlementaire).
- **Extrait** : un passage exact d'une source, avec positions (caractères, page ou horodatage vidéo).
- **Proposition** : une unité d'engagement ou de position politique, rattachée à un ou plusieurs extraits, classée dans la taxonomie, avec statut (objectif, promesse, proposition, mesure détaillée, prise de position, critique d'une autre mesure).
- **Question de politique publique** (« enjeu ») : formulation neutre et comparable, ex. « Âge légal de départ à la retraite ». Chaque proposition pertinente reçoit une **position** sur l'échelle de cette question et, si possible, un **paramètre chiffré** (ex. 62 ans). C'est le pivot de la comparaison fine et de la détection de durcissement / assouplissement.
- **Paramètre de politique** : valeur structurée (âge, taux, montant, effectif, date) qui permet de répondre à « qui veut augmenter l'âge légal ? » par une requête, pas par une interprétation.
- **Contexte** : indicateurs publics et évaluations publiées associés à un thème ou une question.

## 1.6 Indicateurs de succès

| Indicateur | Cible campagne 2027 |
|------------|---------------------|
| Couverture : candidats déclarés avec programme indexé sous 48 h après publication | 100 % |
| Propositions publiées « vérifiées » (validation humaine) | ≥ 90 % des propositions affichées par défaut |
| Délai moyen de correction après signalement fondé | < 24 h |
| Précision des citations de l'assistant (évaluation humaine sur échantillon) | ≥ 98 % des affirmations soutenues par la source citée |
| Écart de traitement entre partis (test de symétrie) | Aucun écart significatif sur la batterie de tests |
| Audience | 1–3 M visiteurs uniques sur la campagne (hypothèse de planification, pas un objectif garanti) |
| Satisfaction « j'ai compris les différences » | ≥ 80 % sur enquête in-app |

## 1.7 Ce que la plateforme n'est pas

- Pas un sondage, pas une prédiction électorale, pas un classement des candidats.
- Pas une « boussole électorale » qui recommande un vote (un module « où me situer » optionnel, traité côté navigateur, sans stockage, est envisagé en V2 seulement après avis juridique — voir [risques](10-risques-juridiques.md)).
- Pas un média d'opinion : aucune tribune, aucun éditorial.
