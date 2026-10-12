# 6. Algorithmes de similarité et de scoring

Tous les scores sont **descriptifs**, versionnés (`method_version`), accompagnés de leur incertitude et du nombre d'éléments sur lesquels ils reposent. Le code de calcul et les poids sont publiés.

## 6.1 Trois signaux complémentaires

| Signal | Ce qu'il mesure | Données |
|--------|-----------------|---------|
| **Positionnel** | Les partis prennent-ils les mêmes positions sur les mêmes enjeux ? | `proposal_issue_position` (validées) |
| **Sémantique** | Proposent-ils des mesures qui se ressemblent dans leur contenu ? | Embeddings des propositions |
| **Saillance** | Accordent-ils de l'importance aux mêmes sujets ? | Répartition des propositions / quasi-phrases par thème |

## 6.2 Similarité positionnelle

Pour deux partis *a*, *b* et l'ensemble *I* des enjeux où les deux ont une position validée, pondérés par *w_i* (poids de l'enjeu dans la dimension considérée) :

```
x_{p,i} ∈ [-1, 1]      position normalisée (ordinal : pos/2 ; numérique : (v - min_i)/(max_i - min_i)*2 - 1,
                         bornes min_i / max_i définies par enjeu sur l'ensemble des valeurs observées et en vigueur)

d(a,b) = Σ_i w_i · |x_{a,i} − x_{b,i}|  /  (2 · Σ_i w_i)          ∈ [0, 1]
S_pos(a,b) = 1 − d(a,b)
```

**Données manquantes** : un enjeu sans position pour l'un des deux est exclu (pas d'imputation). Pour éviter qu'un faible recouvrement produise des scores extrêmes, on applique un **rétrécissement bayésien** vers la moyenne de la population de paires :

```
S_pos_shrunk = (n · S_pos + k · μ) / (n + k)      n = |I| (enjeux communs), k = 5, μ = moyenne des S_pos
```

**Incertitude** : bootstrap (1 000 rééchantillonnages des enjeux) → intervalle de confiance à 90 %. Affiché sur toutes les visualisations ; un score avec n < 8 enjeux communs est marqué « indicatif ».

## 6.3 Similarité sémantique entre ensembles de propositions

Embeddings BGE-M3 (dense, 1024 dimensions) des propositions (intitulé + résumé + citation).

Pour deux ensembles de propositions *A* et *B* sur un thème *T* :

```
pour chaque a ∈ A : m(a) = max_{b ∈ B} cos(a, b)
pour chaque b ∈ B : m(b) = max_{a ∈ A} cos(b, a)
S_sem(A,B) = ½ · ( moyenne_a m(a) + moyenne_b m(b) )          (correspondance bidirectionnelle)
```

Variante robuste utilisée pour la production (moins sensible aux propositions génériques) :
- seules les correspondances au-dessus d'un seuil τ calibré (≈ 0,78, à recalibrer sur un jeu annoté) comptent ;
- appariement un-à-un par **algorithme hongrois** sur la matrice 1 − cos pour éviter qu'une proposition générique soit appariée à tout ;
- correction de la similarité « de fond » : on soustrait la similarité moyenne entre propositions de partis tirés au hasard sur le même thème (les textes sur un même thème se ressemblent mécaniquement).

**Clusters d'équivalence (accords / propositions uniques)** : sur un thème, regroupement hiérarchique agglomératif (lien moyen, seuil τ) des propositions de tous les partis ; chaque cluster candidat est vérifié par le LLM (« ces propositions décrivent-elles la même mesure ? oui / variante / non ») puis validé par un humain pour publication. Les clusters à un seul parti = propositions uniques.

**Limite assumée** : la similarité sémantique ne distingue pas toujours « pour » et « contre » (« rétablir X » vs « supprimer X » sont proches en embedding). C'est pourquoi elle n'est jamais utilisée seule : elle sert à **trouver** des candidats, la position (6.2) sert à **qualifier**.

## 6.4 Similarité de saillance

Profil de saillance d'un parti = vecteur des parts de ses propositions (ou quasi-phrases MARPOR) par thème de niveau 1 ou 2.

```
S_sal(a,b) = 1 − JSD(s_a || s_b)          (divergence de Jensen-Shannon, base 2, ∈ [0,1])
```

## 6.5 Appariement historique (fonction 2)

Pour un parti (lignée résolue) entre les élections N−1 et N, par enjeu puis hors enjeu :

```
1. Candidats : paires (p ∈ N−1, q ∈ N) même enjeu, ou cos(p,q) ≥ 0,70 sur le même sous-thème
2. Appariement un-à-un : algorithme hongrois sur le coût 1 − cos (paires sous le seuil interdites)
3. Pour chaque paire appariée :
      Δpos = x_q − x_p (dans le sens de lecture de l'enjeu)
      si signe(x_p) ≠ signe(x_q) et |Δpos| ≥ 1        → changement_de_position
      sinon si Δpos ≥ 0,25                               → durcissement / assouplissement (selon le libellé de l'enjeu)
      sinon si paramètres/modalités différents           → modifiée
      sinon                                              → maintenue
4. p non apparié → « abandonnée » (seulement si absence confirmée en niveaux 1 et 2 ; sinon « non reprise au programme »)
   q non apparié → « nouvelle »
5. Qualification LLM + double validation humaine
```

## 6.6 Score combiné et dimensions d'alignement (fonction 4)

### Score combiné entre deux partis
```
S(a,b | dim) = α · S_pos_shrunk(a,b | dim) + β · S_sem(a,b | dim) + γ · S_sal(a,b | dim)
             avec α = 0,6 ; β = 0,25 ; γ = 0,15  (poids publiés, réglables en mode « explorer »)
```
Le poids principal va au signal positionnel, le plus interprétable et le plus contrôlé.

### Positions des partis sur les six dimensions
Dimensions : **économique** (intervention de l'État / marché, redistribution), **sociétale** (libertés individuelles et mœurs / ordre et tradition, axe proche de GAL-TAN), **environnementale** (priorité donnée à la transition écologique, rythme et instruments), **européenne** (intégration / souveraineté nationale), **institutionnelle** (démocratie représentative / participative, centralisation / décentralisation, pouvoirs de l'exécutif), **idéologique** (agrégat gauche-droite).

Méthode en deux temps :
1. **Modèle de réponse à l'item (IRT) bayésien** : chaque enjeu est un « item » avec une discrimination et une difficulté ; chaque parti a une position latente θ par dimension. Les positions des partis sur les enjeux (−2..+2) sont modélisées par un IRT ordinal (modèle de réponse graduée). Avantages : gère nativement les données manquantes, apprend quels enjeux sont discriminants, fournit des intervalles crédibles. Implémentation : PyMC / NumPyro.
2. **Calibration et contrôle externe** : corrélation des θ obtenus avec les scores CHES (dimensions comparables) et l'indice RILE du Manifesto Project ; un écart important déclenche une revue méthodologique (pas un ajustement silencieux).

Le **radar idéologique** affiche θ par dimension, normalisés en [−1, 1], avec intervalles.

### Réseaux dynamiques de similarité
- Nœuds = partis (France + étranger, filtrables) ; arêtes = S(a,b) au-dessus d'un seuil ou k plus proches voisins.
- Mise en page force-dirigée (ForceAtlas2) ; communautés (Louvain) ; épaisseur = similarité ; opacité = confiance.
- Dimension temporelle : une matrice par élection (2002 → 2027) et par mois de campagne 2027 ; animation et curseur.

## 6.7 Comparaison internationale

```
S_int(a_FR, b_XX) = α' · S_marpor(a,b) + β' · S_sem_multilingue(a,b) + γ' · S_ches(a,b)
```
- `S_marpor` : similarité des profils de catégories MARPOR (positions + saillances), disponibles pour les deux partis sur des élections proches dans le temps.
- `S_sem_multilingue` : 6.3 appliqué aux propositions extraites dans leur langue d'origine (embeddings multilingues ; pas de traduction préalable pour éviter le biais de traduction).
- `S_ches` : 1 − distance euclidienne normalisée sur les dimensions CHES communes (pays européens uniquement ; pour États-Unis, Canada, Corée du Sud, Japon, Australie, poids redistribué sur les deux autres signaux et incertitude accrue affichée).
- Avertissement systématique : des contextes institutionnels différents (bipartisme, fédéralisme, régime parlementaire) rendent les similarités indicatives.

## 6.8 Validation des algorithmes

| Contrôle | Méthode | Seuil d'acceptation |
|----------|---------|---------------------|
| Qualité des clusters d'équivalence | Jeu annoté (2 000 paires) | F1 ≥ 0,85 |
| Appariement historique | Jeu annoté sur 2017 ↔ 2022 | précision ≥ 0,90 avant validation humaine |
| Cohérence des dimensions | Corrélation avec CHES / RILE | Rapport public ; écart → revue |
| Stabilité | Variation des scores si on retire 10 % des enjeux | Écart-type publié |
| Symétrie | Permutation des étiquettes de partis | Scores identiques (test unitaire) |
