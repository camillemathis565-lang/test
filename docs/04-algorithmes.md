# 4. Moteur de comparaison et algorithmes

Tous les algorithmes sont **versionnés** (`algo_version`), **déterministes à version fixée**, **expliqués** (chaque résultat stocke ses contributions) et **évalués** sur un jeu d'or annoté (cf. §7).

## 4.1 Unité de comparaison : la « question de référence »
Pour chaque sous-thème, un petit nombre de questions normalisées (ex. *âge légal de départ à la retraite* : échelle −2 « abaisser nettement » … +2 « relever nettement », + « non concerné »). Chaque proposition est liée à ≤ 1 question et reçoit une `stance_value` + confiance. Cela rend la comparaison **sémantique ET ordonnée**, et pas seulement « textuellement proche ».

## 4.2 Similarité entre deux propositions (score S ∈ [0,1])
```
S = 0.45·cos(emb_a, emb_b)                # embedding multilingue (bge-m3)
  + 0.20·sim_rerank(a,b)                  # cross-encoder sur (résumé, citation)
  + 0.15·jaccard(entités_nommées, lois, institutions)
  + 0.10·sim_paramètres(a,b)              # chiffres: âge, taux, montants, dates (distance normalisée)
  + 0.10·1[même sous-thème]
```
Puis **NLI/LLM contraint** pour qualifier la relation entre deux propositions à S ≥ 0,70 :
`équivalent | proche | opposé | plus_restrictif | plus_ambitieux | sans_rapport`. Une paire à forte similarité lexicale mais *opposée* (« augmenter / baisser l'âge ») est ainsi bien classée en divergence. Les poids sont calibrés par régression logistique sur le jeu d'or, pas fixés « à la main ».

Seuils initiaux : `équivalent ≥ 0,85 & NLI=équivalent` ; `proche 0,70-0,85` ; < 0,55 = pas de lien.

## 4.3 Accords / divergences / uniques / absents
Pour un thème T et un ensemble E d'entités :
1. Prendre les propositions publiées (filtrées par période et niveau de source).
2. Clusteriser (HDBSCAN sur graphe de similarités, contrainte : une entité par cluster ≤ 1 proposition « tête » ; les autres sont des occurrences).
3. Par cluster :
   - **Accord** : ≥ 2 entités, relation `équivalent|proche`, `stance_value` de même signe.
   - **Divergence** : même `reference_question`, `stance_value` de signes opposés ou écart ≥ 2, ou relation `opposé`.
   - **Proposition unique** : cluster mono-entité, aucun voisin ≥ 0,55.
   - **Sujet absent** : pour chaque sous-thème du thème, entité sans proposition publiée. L'UI affiche *le périmètre cherché* (nb de documents, sources, dates) car l'absence dépend de la couverture.
4. Chaque case porte une **couverture** (nombre de documents analysés par entité) pour éviter qu'un parti qui publie peu soit interprété comme « sans position ».

## 4.4 Moteur d'alignement idéologique (F4)

### Méthode (transparente, non-boîte-noire)
**Ancrage** par jugements d'experts publiés plutôt que par un modèle opaque :
- Variables : `stance_value` sur les questions de référence rattachées à un axe (ex. axe économique : fiscalité du capital, salaire minimum, dépense publique, dérégulation… ; axe européen : transfert de compétences, euro, budget UE ; axe sociétal : bioéthique, laïcité, immigration (rattachement discuté) ; axe institutionnel : VIe République, RIC, proportionnelle ; axe environnemental : climat, nucléaire, pesticides).
- Les orientations de chaque question sont **fixées par un comité pluraliste** et publiées : pour chaque question, qui est « + » et « − » sur l'axe, avec justification. Alternatives à tester : codage MARPOR (RILE, per-codes), CHES pour l'ancrage 0-10 des partis.
- Score de l'entité *e* sur l'axe *k* : moyenne pondérée  
  `score(e,k) = Σ_q w_q·conf_q·norm(stance_q) / Σ w_q·conf_q`, poids `w_q` = importance égale par défaut (pas de pondération par saillance sans la montrer) ; **intervalle de confiance par bootstrap** sur les propositions ; si couverture < n_min questions → « non calculable ».
- Score global = **vecteur** de 6 composantes, non résumé en un seul chiffre par défaut ; le « global » est une moyenne des 5 autres, affichée mais optionnelle.
- **Proximité** entre entités : `1 − d(e1,e2)` avec `d` = distance euclidienne pondérée normalisée sur les axes communs, ou distance cosinus des vecteurs `stance` (par défaut), + distance Wasserstein sur les distributions thématiques (saillance). Les deux sont exposées.

### Réseau de similarité dynamique
Graphe `G_t` par fenêtre temporelle (recalcul mensuel puis hebdo en campagne) ; arêtes si proximité ≥ seuil (réglable) ; positionnement par `ForceAtlas2`/UMAP (stabilisé : initialisation sur la configuration précédente pour éviter les sauts visuels) ; détection de communautés (Louvain) **présentée comme descriptive** et sans noms politiques imposés.

### Garde-fous méthodologiques
Axes et orientations publics, tests de sensibilité (changement de poids/axes → stabilité du classement affichée), comparaison avec des références externes (CHES, MARPOR, Voter Advice Applications), publication des écarts. Mention : « ce score décrit des positions déclarées, il ne mesure ni la qualité ni la faisabilité ».

## 4.5 Comparaison internationale (F3)
1. **Espace commun** : embeddings multilingues + classification dans la taxonomie via les correspondances MARPOR/CAP.
2. **Proximité de programmes** (partis A français, B étranger, thème T) : `sim(A,B,T) = moyenne des meilleures correspondances (best-match average, symétrisée) entre propositions de A et de B sur T` + corrélation des vecteurs `stance` sur les questions communes (traduites) ; version globale = moyenne pondérée sur les thèmes à couverture suffisante (≥ 3 propositions dans chaque parti).
3. **Question « quel parti allemand ressemble le plus à X ? »** → liste classée (CDU, SPD, Grünen, FDP, AfD, Linke, BSW…) avec score, intervalle, thèmes qui contribuent le plus et ceux qui divergent le plus.
4. **Mesure équivalente** : recherche k-NN cross-lingue d'une proposition dans les corpus étrangers, filtre par pays/année, rerank + NLI → « partis proposant une mesure similaire ».
5. **Diffusion d'une idée** : à partir d'un cluster, histogramme par pays/année de la première occurrence, réseau d'emprunts *possibles* (antériorité) — libellé « apparition antérieure », jamais « inspiration prouvée » sauf citation explicite par le parti (champ `inspired_by` sourcé).
6. Limites affichées : différences de régimes politiques, de compétences, de langue ; couverture inégale des pays.

## 4.6 Évolution historique (F2)
Pour une entité *e* et deux éditions *Y1<Y2* (lignée prise en compte) :
1. Prendre les `reference_question` abordées dans chaque édition.
2. Pour chaque question : si présente aux deux → comparer `stance` : même signe & écart ≤ 0,5 → **maintenue** ; écart > 0,5 → **changement** ; direction vers extrémités → **durcissement** (|stance| augmente dans le même sens), vers 0 ou inverse partiel → **assouplissement**.
3. Absente en Y2, présente en Y1 → **abandonnée** (après vérification qu'elle n'est pas dans une source N2/N3 de la période : sinon « non reprise dans le programme, mais évoquée dans… »).
4. Absente en Y1, présente en Y2 → **nouvelle**.
5. Pour les propositions hors question de référence : appariement par similarité (S ≥ 0,75 & NLI) puis même logique.
6. Chaque classification stocke les deux citations, le calcul, et reste `a_relire` jusqu'à validation humaine ; l'UI marque « détecté automatiquement » vs « confirmé ».
7. Cas particuliers : changement de nom de parti (lignée), alliances/coalitions, programmes de candidats ≠ parti, positions ponctuelles contradictoires dans une même édition (affichées côte à côte).

## 4.7 Fact-checking (F5)
- **Détection** : une proposition est « vérifiable » si elle contient une quantité (chiffre, taux, date) ou une affirmation causale (« créera 500 000 emplois »).
- **Appariement aux données** : catalogue d'indicateurs (`dataset_ref`) alimenté par API (INSEE BDM, Eurostat, OCDE, data.gouv, Banque mondiale) ; recherche d'indicateurs par embeddings + règles ; affichage de la série temporelle et du dernier point, avec lien.
- **Évaluations existantes** : Cour des comptes, HCFP, OFCE, IPP, France Stratégie, CAE, Conseil d'orientation des retraites, DGTrésor, ADEME/RTE (énergie), GIEC pour climat ; recherche dans le corpus N3 + curation manuelle ; extraction d'estimations de coût avec méthode, périmètre, année.
- **Consensus** : mention `consensus | débattu | insuffisant` **uniquement** si au moins 2 sources indépendantes ou une revue/synthèse reconnue (type méta-analyse) ; sinon « non établi ».
- **Interdits** : pas de note « vrai/faux/trompeur » ; la plateforme dit *ce que mesurent les sources*, pas *si le candidat a raison*. Les coûts annoncés par un parti et les coûts estimés par un tiers sont **toujours affichés distinctement**.
- Revue humaine obligatoire avant publication, relecteurs formés à la symétrie de traitement.

## 4.8 Assistant (F6) — questions types
| Question | Chemin |
|---|---|
| « Que proposent les partis sur les retraites ? » | `compare(theme=retraites, entities=all)` → synthèse par parti avec citations |
| « Qui souhaite augmenter l'âge légal ? » | filtre `reference_question=age_legal` & `stance_value>0` ; liste + citations ; mention des partis sans position |
| « Quels partis ont changé de position sur le nucléaire depuis 2017 ? » | `position_change` (theme=nucleaire, Y1=2017, Y2=2022/2027, type∈changement) + citations des deux dates |
| « Quel parti français est le plus proche de la CDU ? » | `nearest(entity=CDU, country=FR, dim=global)` + scores par thème + avertissement méthodologique |
Toujours : (1) citations, (2) périmètre de recherche, (3) lien vers la vue interactive correspondante.

## 4.9 Gestion de l'incertitude et du biais
- Biais de couverture (certains partis publient plus) : normalisation par la couverture, et affichage du volume de sources.
- Biais de modèle : évaluation par entité (rappel/précision par parti) ; seuil de relecture plus élevé là où l'extraction est moins fiable ; audits trimestriels par un comité pluraliste.
- Biais de formulation : un même contenu est résumé par le même gabarit ; vérification que la **tonalité** des résumés (analyse de sentiment/valence) n'est pas statistiquement différente entre entités.

## 4.10 Évaluation (jeu d'or)
Constituer ≥ 1 500 propositions annotées par 2 annotateurs (κ de Cohen ≥ 0,7) couvrant tous les partis et thèmes. Métriques : rappel/précision de détection, exactitude des citations (cible 100 % par construction), exactitude thème (≥ 92 %), stance (F1 ≥ 0,85), relation de paire (F1 ≥ 0,85), fidélité des résumés (revue humaine ≥ 98 % sans distorsion). Régression automatique à chaque changement de modèle ou de prompt.
