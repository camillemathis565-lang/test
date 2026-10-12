# 5. Système de comparaison — fonctions 1 à 6

## F1 — Comparateur entre partis

### Entrées
- Un **thème** (ou sous-thème, ou enjeu précis) de la taxonomie.
- **Plusieurs partis** et/ou **plusieurs candidats** (jusqu'à 12 en vue tableau, illimité en vue matrice).
- Élection (2027 par défaut) ; filtres : statut (masquer « objectifs » vagues), niveau de source, vérifiées uniquement (par défaut oui).

### Sorties calculées
| Catégorie | Règle de calcul | Affichage |
|-----------|-----------------|-----------|
| **Accords** | Sur un enjeu : partis dont les positions sont identiques (ordinal) ou dont les paramètres chiffrés sont dans une tolérance définie par enjeu ; ou propositions dans un même cluster d'équivalence (voir [06](06-algorithmes-similarite.md) §6.3) | « Partis A, C et D proposent… » + sources de chacun |
| **Divergences** | Positions de signes opposés, ou écart ≥ 2 crans, ou écart chiffré au-delà de la tolérance | Échelle horizontale avec chaque parti positionné ; l'écart est montré, pas commenté |
| **Propositions uniques** | Clusters ne contenant qu'un seul parti parmi la sélection | Liste par parti |
| **Sujets absents** | Sous-thèmes / enjeux sans aucune proposition vérifiée d'un parti dans les sources indexées | Case grisée « Aucune proposition trouvée dans les sources indexées au JJ/MM/AAAA » + lien « Signaler une source manquante » |

### Modes de visualisation
1. **Tableau comparatif** — lignes = enjeux / sous-thèmes ; colonnes = partis ; cellule = intitulé court + paramètre + pastille de statut + nombre de sources ; survol = citation.
2. **Matrice** — partis × enjeux, couleur = position sur l'échelle (palette divergente neutre, sans rouge/bleu partisans), cellule vide hachurée = absence ; tri par regroupement hiérarchique pour faire apparaître les blocs.
3. **Cartes** — une carte par parti avec ses 5 propositions principales sur le thème, sources en pied de carte ; adaptée au mobile.
4. **Chronologie** — axe temporel de la campagne : date de première apparition de chaque proposition, modifications, reprises par d'autres partis.
5. **Radar idéologique** — 6 axes (dimensions de F4) pour les partis sélectionnés, avec intervalle de confiance et nombre d'enjeux ayant servi au calcul ; avertissement méthodologique accessible en un clic.
6. **Mise en contexte socio-économique et géopolitique** — panneau latéral par thème (voir F5) :
   - indicateurs clés (dernière valeur, tendance 10 ans, comparaison UE) avec producteur et date ;
   - pour chaque proposition chiffrée : **hypothèses du programme vs références publiques** (ex. hypothèse de croissance du programme vs prévisions du HCFP, de la Commission européenne, du FMI, de la Banque de France) — présenté comme un écart factuel, sans qualification ;
   - contexte géopolitique pour Défense / Europe / Politique étrangère : engagements internationaux en vigueur (traités, cibles OTAN, règles budgétaires européennes) que la mesure modifierait ou respecterait, avec source juridique.
   - Aucun « score de cohérence » unique par parti : l'agrégat serait un jugement. On affiche les éléments, l'utilisateur conclut.

### Algorithme de génération d'une page de comparaison
```
entrée: theme T, partis P[], election E
enjeux ← issues sous T (path <@ T)
pour chaque enjeu i, parti p:
    positions[i][p] ← proposition vérifiée la plus récente de p sur i (statut le plus engageant en cas de conflit,
                       conflit signalé si deux sources concordantes divergent)
accords, divergences ← comparaison par paires sur positions (règles ci-dessus)
clusters ← proposal_cluster(T, E) restreint à P
uniques ← clusters avec |partis| = 1
absents ← (sous-thèmes(T) × P) \ couverture
renvoyer {matrice, accords, divergences, uniques, absents, contexte(T), métadonnées(couverture, date)}
```
Pré-calcul pour toutes les combinaisons thème × ensemble des candidats officiels ; calcul à la volée (avec cache) pour les sélections personnalisées.

## F2 — Évolution historique d'un parti

### Périmètre
Élections présidentielles 2002, 2007, 2012, 2017, 2022, 2027, en suivant la **lignée** du parti (renommages, successions). Lorsque le parti n'existait pas ou ne présentait pas de candidat, la frise l'indique explicitement.

### Classification des évolutions (par enjeu ou par proposition)
| Type | Définition opérationnelle |
|------|---------------------------|
| Maintenue | Proposition équivalente (similarité ≥ seuil et même position) aux deux élections |
| Nouvelle | Présente en N, aucune équivalente en N−1 sur l'enjeu |
| Abandonnée | Présente en N−1, absente en N **dans les sources de niveau 1** (on vérifie aussi niveau 2 avant de conclure ; sinon « non reprise dans le programme ») |
| Modifiée / précision | Même direction, paramètres ou modalités changés |
| Durcissement / assouplissement | Déplacement de la position dans le sens de lecture défini pour l'enjeu (ex. immigration : « plus restrictif » / « moins restrictif » ; retraites : « âge plus tardif » / « plus précoce ») — terme descriptif défini par enjeu, jamais un jugement |
| Changement de position | Changement de signe de la position, ou passage pour/contre |

### Processus
1. Appariement des propositions N−1 ↔ N (même lignée) par enjeu, puis par similarité sémantique (algorithme de [06](06-algorithmes-similarite.md) §6.5).
2. Qualification proposée par l'IA avec justification + les deux extraits.
3. **Double validation humaine obligatoire** avant publication (sujet sensible).
4. Affichage : frise horizontale par enjeu (une ligne par enjeu, un point par élection, couleur = position, flèche = type d'évolution), chaque point cliquable vers ses sources.

### Vue « Parti » — frise chronologique
```
Retraites — âge légal     2002 ●────2007 ●────2012 ●────2017 ●────2022 ●────2027 ●
                                 maintenu   modifié   durcissement  assouplissement  nouveau
                          [source][source] …
```

## F3 — Comparaison internationale

### Pays
Allemagne, Royaume-Uni, Espagne, Italie, Pays-Bas, Suède, Danemark, États-Unis, Canada, Corée du Sud, Japon, Australie. Référentiel des partis : [donnees-reference/partis-international.yaml](../donnees-reference/partis-international.yaml).

### Méthodes combinées
1. **Programme à programme (codage commun)** : profils MARPOR (part de chaque catégorie dans le programme) → similarité des saillances et des positions (indices type RILE et sous-échelles).
2. **Mesure à mesure (sémantique multilingue)** : embeddings BGE-M3 sur les propositions extraites des programmes étrangers (dans leur langue) ; recherche des plus proches voisins d'une proposition française → qualification par LLM (« mesure équivalente », « similaire », « même objectif, instrument différent ») → validation humaine des correspondances publiées.
3. **Positions d'experts** : CHES pour la calibration des dimensions européennes (gauche-droite économique, GAL-TAN, intégration européenne).

### Questions traitées
| Question | Méthode |
|----------|---------|
| « Ce parti français ressemble le plus à quel parti allemand ? » | Classement des partis allemands par similarité combinée ([06](06-algorithmes-similarite.md) §6.6), avec intervalle de confiance, répartition par dimension et enjeux qui contribuent le plus à la proximité et à la distance |
| « Quels partis européens proposent une mesure similaire ? » | Plus proches voisins sur la proposition, filtrés par seuil et validés ; liste avec extraits dans la langue originale + traduction signalée |
| « Quelle est la diffusion internationale de cette idée ? » | Chronologie de la première apparition de mesures équivalentes par pays/parti → carte animée et frise ; on parle de **chronologie de la diffusion**, pas d'« inspiration » (une influence n'est affirmée que si une source l'énonce explicitement) |

### Cartographie internationale
- Carte MapLibre : pays colorés par proximité au parti sélectionné (meilleur parti analogue du pays).
- Graphe : partis (nœuds) × similarité (arêtes au-dessus d'un seuil), communautés détectées (Louvain), filtre par dimension.

## F4 — Moteur d'alignement idéologique

Scores par paire de partis et par dimension : **idéologique (global), économique, environnementale, sociétale, européenne, institutionnelle**. Calcul détaillé dans [06](06-algorithmes-similarite.md). Restitution :
- matrice de proximité (heatmap) partis × partis ;
- **réseau dynamique** : graphe force-dirigé dont le curseur temporel (2002 → 2027, ou mois de campagne 2027) recalcule les arêtes ; filtres par dimension ;
- pour chaque score : n enjeux communs, intervalle de confiance, 3 principaux accords et 3 principales divergences avec sources ;
- méthode, poids et code publiés ; possibilité de régler soi-même les poids des enjeux (mode « explorer »).

## F5 — Moteur de fact-checking et de mise en contexte

### Trois objets distincts
1. **Affirmations factuelles** sur le passé ou le présent (« le chômage a augmenté de X % depuis 2022 ») → comparaison avec la statistique officielle : `conforme` / `écart` / `non comparable` / `donnée indisponible`, avec explication factuelle de l'écart (périmètre, définition, période). Pas de « vrai / faux » ni de « trompeur ».
2. **Promesses** (projections) → pas de vérification possible ; on affiche :
   - les **données publiques** de contexte,
   - les **évaluations publiées** (Cour des comptes, COR, HCFP, OFCE, IPP, OCDE, think tanks d'orientations diverses — orientation déclarée affichée),
   - le **niveau de consensus** *tel qu'énoncé par des revues de littérature ou institutions citées* (convergent / partagé / divergent / insuffisant), jamais déterminé par la plateforme seule,
   - les **coûts** : annoncé par le parti vs estimations tierces, côte à côte, avec méthodes.
3. **Faisabilité juridique** (V2) : la mesure nécessite-t-elle une révision constitutionnelle, une modification des traités européens, une loi organique ? Avec source juridique et avis publiés le cas échéant ; présenté comme « conditions de mise en œuvre », pas comme jugement.

### Règles anti-partialité
- Même traitement pour tous : si une évaluation existe pour un parti sur un enjeu, la recherche d'évaluations est menée avec la même intensité pour les autres.
- Tableau public de couverture des évaluations par parti.
- Diversité des évaluateurs suivie et affichée.

## F6 — Assistant conversationnel (RAG politique)

### Exemples de questions et stratégie
| Question | Outils mobilisés |
|----------|------------------|
| « Que proposent les partis sur les retraites ? » | `compare_parties(TRA.RET, candidats_officiels)` puis synthèse par parti, ordre alphabétique, citation par phrase |
| « Qui souhaite augmenter l'âge légal ? » | `get_policy_parameter(RETRAITES.AGE_LEGAL)` comparé à la valeur en vigueur (issue de la loi, sourcée) → liste exhaustive structurée, puis citations |
| « Quels partis ont changé de position sur le nucléaire depuis 2017 ? » | `get_party_evolution(issue=ENERGIE.NUCLEAIRE, depuis=2017)` sur évolutions validées |
| « Quel parti français est le plus proche de la CDU allemande ? » | `get_similarity_scores(party=CDU, pays=FR)` → classement + IC + enjeux explicatifs + avertissement méthodologique |

### Règles de réponse (prompt système, extrait)
- Ne répondre qu'à partir des résultats d'outils ; chaque phrase factuelle porte une référence `[E:<id d'extrait>]`.
- Présenter les partis par ordre alphabétique (ou aléatoire si l'utilisateur l'a choisi), avec un traitement de longueur comparable.
- Si l'information manque pour un parti : le dire explicitement, sans extrapoler.
- Refuser poliment : consignes de vote, « qui est le meilleur », prédictions électorales, jugements de valeur ; proposer à la place une comparaison factuelle.
- Distinguer explicitement : programme officiel / déclaration orale / proposition non vérifiée.
- Mentionner la date de fraîcheur des données.

### Vérification post-génération
1. Découpage de la réponse en phrases ; pour chaque phrase factuelle, contrôle que l'extrait cité la soutient (modèle d'entailment ou Claude Haiku 5.5 en juge, avec la citation exacte).
2. Phrase non soutenue → supprimée ; si > 20 % supprimées → régénération ; si échec → réponse « je n'ai pas trouvé d'information suffisamment sourcée ».
3. Les citations sont rendues comme des puces cliquables ouvrant l'extrait exact dans son document.

### Évaluation continue
- Jeu de 500+ questions de référence (réponses attendues + sources), rejoué à chaque changement de prompt ou de modèle.
- **Tests de symétrie** : mêmes questions avec permutation des noms de partis ; mesure des écarts de longueur, de tonalité, de taux de refus.
- Tests adverses : injection via documents, demandes de consigne de vote déguisées, questions pièges sur des citations inventées.
- Métriques publiées : précision des citations, taux de « je ne sais pas », écarts de symétrie.
