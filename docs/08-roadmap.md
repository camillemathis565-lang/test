# 8–9. Roadmap MVP et V2

## Contrainte de calendrier

- Aujourd'hui : **octobre 2026**. Premier tour attendu en **avril 2027**.
- Les programmes complets sont en général publiés entre décembre et mars ; la liste officielle des candidats est publiée par le Conseil constitutionnel quelques semaines avant le premier tour, après la collecte des parrainages.
- La valeur maximale de la plateforme se situe de **février à avril 2027**. Un produit livré en mai a manqué sa cible.

**Conséquence** : un MVP resserré en ligne **mi-janvier 2027**, puis des livraisons hebdomadaires pendant la campagne. L'historique complet et l'international complet sont repoussés en V2 (post-élection, préparation des législatives et européennes suivantes).

## Phase 0 — Cadrage (mi-octobre → début novembre 2026, 3 semaines)

- Constitution du **comité scientifique pluraliste** (politistes, économistes, juriste électoral, spécialiste data) et de la charte de neutralité.
- Avis juridique écrit (droit électoral, presse, RGPD, droit d'auteur, AI Act) — voir [10](10-risques-juridiques.md).
- Choix de la structure juridique, premiers financements non partisans.
- Gel de la taxonomie v1 (thèmes + sous-thèmes) et des ~120 premiers enjeux comparables.
- Recrutement / mobilisation de l'équipe d'annotation, rédaction du guide d'annotation, test d'accord inter-annotateurs.

## Phase 1 — MVP « campagne » (novembre 2026 → mi-janvier 2027, ~10 semaines)

| Bloc | Contenu MVP |
|------|-------------|
| Données | Pipeline niveau 1 (programmes, sites, communiqués) + niveau 2 limité (grands discours, débats) ; archivage WARC ; extraction IA + validation humaine ; **2022** ingéré comme base historique (programmes des candidats 2022) |
| Partis couverts | Tous les partis présentant ou soutenant un candidat déclaré (référentiel France complet) |
| Fiches | Proposition, source, parti, candidat, thème |
| F1 Comparateur | Tableau, matrice, cartes ; accords / divergences / propositions uniques / sujets absents ; panneau de contexte avec indicateurs officiels (≈ 60 indicateurs clés) |
| F2 Historique | 2022 → 2027 uniquement, enjeux principaux |
| F5 | Coûts annoncés vs chiffrages tiers (quand disponibles), indicateurs de contexte |
| F6 Assistant | Questions sur 2027 et 2022, outils SQL + recherche hybride, vérificateur de citations, garde-fous |
| Transverse | Recherche plein texte, page Méthode, journal des corrections, formulaire de signalement / droit de réponse, open data (export CSV) |
| Qualité | Jeu d'évaluation de l'assistant (300 questions), tests de symétrie, audit externe d'accessibilité rapide |

Critère de sortie : 100 % des programmes publiés des candidats déclarés indexés et ≥ 90 % des propositions affichées vérifiées ; précision des citations de l'assistant ≥ 98 % sur le jeu d'évaluation.

## Phase 1.5 — Campagne (mi-janvier → second tour, livraisons hebdomadaires)

- Radar idéologique et **F4 alignement** (scores, matrice, réseau), après validation par le comité.
- Chronologie de campagne (apparition et modification des propositions).
- Couverture « soir de débat » : équipe d'astreinte, propositions nouvelles publiées < 12 h.
- **F3 pilote** : Allemagne, Espagne, Italie (données MARPOR + CHES + programmes récents).
- API publique (lecture), alertes e-mail par thème / parti.
- Widgets intégrables pour médias partenaires (tableau comparatif d'un thème).
- Préparation du **second tour** : vue duel A vs B dédiée.

## V2 — après l'élection (mai 2027 → mi-2028)

| Bloc | Contenu |
|------|---------|
| F2 complet | Historique **2002 → 2027** pour toutes les lignées, frises complètes, évolutions doublement validées |
| F3 complet | 12 pays : Allemagne, Royaume-Uni, Espagne, Italie, Pays-Bas, Suède, Danemark, États-Unis, Canada, Corée du Sud, Japon, Australie ; carte, diffusion des idées |
| Suivi des promesses | Après l'élection : suivi de la mise en œuvre des engagements du/de la président·e élu·e et de la majorité (textes votés, décrets), statut factuel par promesse |
| Votes parlementaires | Cohérence programme ↔ votes (open data AN / Sénat) |
| F5 avancé | Faisabilité juridique (constitution, traités), revues de consensus scientifique sourcées |
| Autres élections | Législatives, européennes 2029, municipales (niveau territorial déjà prévu dans le modèle) |
| Module « Où me situer ? » | Seulement après avis juridique favorable : questionnaire traité dans le navigateur, sans stockage, sans recommandation de vote |
| Recherche | Jeux de données versionnés (DOI), partenariats universitaires, export compatible MARPOR |
| Multilingue | Interface anglaise pour les observateurs internationaux |

## Jalons et dépendances critiques

```
Oct 26 ─ cadrage, comité, juridique
Nov 26 ─ pipeline + modèle de données + design system ─┐
Déc 26 ─ ingestion 2022 + premiers programmes 2027     ├─ annotation en continu
Jan 27 ─ ★ MVP public (mi-janvier)                      ┘
Fév 27 ─ alignement, chronologie, API, pilote international
Mar 27 ─ liste officielle des candidats → bascule « candidats officiels »
Avr 27 ─ ★ 1er tour · vue duel · ★ 2nd tour
Mai 27 ─ bilan, rapport public de neutralité, lancement V2
```

Risques de planning : retard de recrutement des annotateurs (mitigation : partenariat avec masters de science politique, rémunérés) ; programmes publiés tardivement (mitigation : priorité aux propositions phares annoncées, mise à jour continue).
