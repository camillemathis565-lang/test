# 5. Pilotage : roadmaps, coûts, juridique, modèle économique

## 5.1 Roadmap MVP (livrable 8) — contrainte : scrutin attendu en avril 2027
Date de référence : 12/10/2026. **Principe : faire peu, mais irréprochable ; la crédibilité se joue sur la qualité des données et la neutralité, pas sur le nombre de fonctions.**

| Phase | Période | Contenu | Critère de sortie |
|---|---|---|---|
| 0. Cadrage | S0-S2 (oct. 2026) | Équipe, charte éditoriale/neutralité, comité scientifique, avis juridique, taxonomie v1, registre des sources, choix infra | Charte signée, taxonomie v1 validée |
| 1. Fondations | S2-S8 | Schéma BDD, pipeline collecte→extraction→relecture, back-office, système de citations, jeu d'or v1 | Pipeline de bout en bout sur 3 partis |
| 2. MVP privé | S8-S14 (déc. – janv.) | **F1 comparateur (tableau + matrice)**, fiche proposition, recherche, 25 thèmes, candidats déclarés, programmes N1 | ≥ 90 % des candidats déclarés couverts sur 10 thèmes prioritaires ; 100 % de citations vérifiées exactes |
| 3. MVP public (bêta) | S14-S18 (fin janv. – fév. 2027) | Page méthodologie, rectification, export CSV, accessibilité, charge | Tests de charge OK, audit sécurité & RGAA |
| 4. Campagne | mars – avril 2027 | **F6 assistant en bêta fermée puis ouverte**, **F2 historique pour les 5-6 principaux partis**, mise à jour continue des programmes officiels (professions de foi) | Assistant : 0 réponse sans source sur le jeu de test ; SLA mises à jour < 24 h |

Hors MVP : F3 international complet, F4 réseaux dynamiques, F5 complet (un pilote limité sur retraites/énergie/fiscalité peut être inclus).
Scénario réaliste : si le démarrage effectif est décalé, **réduire le périmètre thématique avant de réduire les contrôles qualité**.

## 5.2 Roadmap V2 (livrable 9) — après le scrutin / pour les législatives, européennes, municipales
- **T+1 (mai-juil. 2027)** : F2 complet 2002-2027 ; F4 scores + réseau ; F5 étendu (20 thèmes) ; API publique v1 ; multilingue (EN) ; espace chercheur (dataset versionné + DOI Zenodo).
- **T+2 (sept.-déc. 2027)** : F3 comparaison internationale (UE-27 + 12 pays cibles) ; alertes personnalisées ; comparaison « mon profil » (quiz transparent, jamais de recommandation, uniquement positions proches par thème, optionnel) à évaluer juridiquement ; vidéos/débats temps réel avec transcription.
- **2028+** : élargissement aux élections législatives, municipales (2026 déjà passées, 2032), européennes 2029, autres pays (extension du modèle) ; suivi de l'exécution des promesses du gagnant (promise tracker) ; partenariats médias/universités.

## 5.3 Estimation des coûts et de la complexité (livrable 10)

### Équipe MVP (≈ 6 mois, ordres de grandeur, France, charges incluses)
| Rôle | ETP | Coût indicatif |
|---|---|---|
| Product manager / lead éditorial | 1 | 60-80 k€ |
| Tech lead full-stack | 1 | 75-95 k€ |
| Dev back-end / data (Python, pipelines) | 2 | 120-160 k€ |
| Dev front / data-viz | 1,5 | 80-110 k€ |
| ML/NLP engineer | 1 | 70-90 k€ |
| Designer UX/UI | 0,75 | 40-55 k€ |
| Analystes politiques / annotateurs (relecture) | 4-6 | 100-160 k€ |
| Juriste (externe) + comité scientifique (défraiements) | – | 25-60 k€ |
| **Total équipe** | ~12-14 personnes | **≈ 570-810 k€** |

### Infra & IA (mensuel, ordre de grandeur)
| Poste | MVP | Campagne / pics |
|---|---|---|
| Cloud (K8s, BDD, stockage, CDN) | 2-4 k€ | 8-20 k€ |
| LLM API (extraction + assistant) | 3-8 k€ | 10-40 k€ (plafonné) |
| GPU embeddings/STT (auto-hébergé) | 1-3 k€ | 3-6 k€ |
| Outils (monitoring, Sentry, Langfuse, etc.) | 1 k€ | 2 k€ |

**Budget total MVP + campagne : ~0,8 à 1,3 M€.** V2 (12 mois) : ~1,0 à 1,8 M€.
### Complexité
- Élevée : extraction fiable + stance + relation de paire (qualité éditoriale) ; neutralité perçue ; charge en pic.
- Moyenne : visualisations, RAG avec citations, back-office de relecture.
- Faible/moyenne : front, API, recherche.
- Risque majeur de planning : **volume de relecture humaine** (≈ 8 000-15 000 propositions pour 12-15 candidats + historique) → dimensionner les annotateurs, outiller (pré-remplissage, raccourcis clavier, diff).

## 5.4 Risques juridiques et réglementaires (livrable 11)
*(À faire valider par un avocat spécialisé en droit électoral, numérique et PI.)*

| Domaine | Risque | Mesure |
|---|---|---|
| **Droit électoral** | Pendant la campagne officielle et les périodes de réserve, plafonds/obligations de neutralité des médias audiovisuels ; la plateforme n'est pas un service de communication audiovisuelle, mais toute apparence de soutien ou d'influence est à proscrire. La **CNCCEP/Arcom** et le Conseil constitutionnel suivent le scrutin. Règles de **publication de sondages** (loi 1977, Commission des sondages) si utilisés — **ne pas intégrer de sondages**. Interdiction de diffuser des éléments de propagande le jour du scrutin et la veille (Code électoral L49) : prévoir un **mode « silence électoral »** (gel des mises à jour de contenus de campagne, bandeau, désactivation de l'assistant) | Charte, avis juridique, procédure de silence, aucune donnée de sondage |
| **Désinformation / loi de 2018** | Loi du 22/12/2018 (manipulation de l'information en période électorale), pouvoir de référé du juge ; exigences de transparence pour plateformes en ligne de grande taille | Politique de sourcing, journal de corrections, procédure de réponse rapide |
| **Diffamation / dénigrement** | Attribuer à tort une position à une personne (loi de 1881) | Citation exacte vérifiée, double lecture, retrait rapide, droit de réponse |
| **Droit d'auteur / bases de données** | Reproduction de programmes, articles de presse (droits voisins), extraits vidéo | Courtes citations avec identification (exception de citation, art. L122-5 CPI), liens plutôt que copies pour la presse ; accord avec les partis pour hébergement des programmes ; respect des licences (Manifesto Project : licence et citation) ; droit sui generis des bases tiers |
| **RGPD** | Opinions politiques = donnée sensible (art. 9) ; ici surtout des **personnes publiques s'exprimant publiquement**, mais attention aux responsables locaux, aux posts de militants, aux utilisateurs de l'assistant | Minimisation, pas de profilage utilisateur, analytics sans cookies (Matomo/Plausible UE), AIPD (DPIA), base légale = intérêt légitime/mission d'information, registre, DPO, hébergement UE |
| **Règlement IA (UE 2024/1689)** | Obligations de transparence pour systèmes interagissant avec des personnes (art. 50), contenus synthétiques ; les systèmes destinés à **influencer le résultat d'une élection** sont à haut risque (annexe III) → à analyser : un outil d'information factuelle n'a pas cet objet, mais **éviter toute recommandation de vote** et documenter | Étiquetage IA, journal, évaluation d'impact, pas de recommandation |
| **DSA** | Statut d'intermédiaire, signalement de contenus, transparence sur les systèmes de recommandation | Mécanisme de signalement, CGU |
| **Scraping / CGU** | Violation des CGU, robots.txt, extraction substantielle de bases | Respect robots.txt, API officielles, accords |
| **Responsabilité éditoriale** | Plainte de partis ou de candidats pour déséquilibre | Gouvernance pluraliste, règles de symétrie publiques, audit externe |
| **Cyber & ingérence** | Attaques DDoS, défiguration, manipulation de la base, désinformation sur la plateforme | WAF, WORM, signatures, plan de réponse incident, ANSSI/Viginum en contact |
| **Neutralité perçue** | Défiance, accusation de biais | Transparence méthodologique, comité pluraliste, financement public des soutiens, open source des méthodes |

## 5.5 Gouvernance et indépendance
Structure à but non lucratif (association loi 1901 ou fondation) ; **comité scientifique pluraliste** ; **comité d'éthique** ; **charte de financement** (aucun financement d'un parti ou d'un candidat, plafonds par donateur, publication) ; audits externes (méthodes et données) ; code et méthodes en open source (licence AGPL pour le code, CC BY-SA pour les données, hors contraintes des sources).

## 5.6 Modèle économique (livrable 13)
Principe : **le grand public gratuit et sans publicité politique**, financement diversifié et transparent.

| Source | Description | Part cible (an 2) |
|---|---|---|
| Subventions & fondations | Fondations indépendantes, programmes de recherche (ANR, Horizon Europe), mécénat | 35-45 % |
| Licences API / données | Médias, think tanks, instituts, entreprises de veille (plan Pro, SLA, volumes) | 25-30 % |
| Dons individuels | Contribution volontaire, membres | 10-15 % |
| Offres institutionnelles | Universités, bibliothèques, administrations (accès avancé, formation) | 10-15 % |
| Services | Veille thématique sur mesure pour ONG/associations (jamais pour un parti en campagne) | 5-10 % |
Exclus : publicité ciblée, vente de données utilisateurs, financement par un parti/candidat ou une campagne, sponsoring de contenu.

Plans : **Gratuit** (consultation, export limité) · **Chercheur/Étudiant** (gratuit sur justificatif, API quotas) · **Pro** (~99-499 €/mois : API, alertes, export illimité) · **Entreprise/Média** (sur devis, SLA).
Seuil de viabilité indicatif : ~1,2 M€/an en V2 couvert à ≥ 60 % par des revenus non philanthropiques à 3 ans.
