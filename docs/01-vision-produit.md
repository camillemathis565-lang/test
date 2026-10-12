# 1. Vision produit

## 1.1 Promesse
> « Comprendre en 5 minutes ce que chaque candidat propose, sur n'importe quel sujet, avec la preuve à un clic. »

La plateforme est une **base de propositions sourcées**, pas un média d'opinion. Tout ce qui est affiché est soit une citation exacte, soit une donnée dérivée dont le calcul est inspectable.

## 1.2 Principes non négociables
1. **Traçabilité totale** : aucune phrase affichée sans lien vers (document, page/timecode, extrait original, date, auteur, URL archivée).
2. **Neutralité par construction** : mêmes schémas, mêmes gabarits, même ordre aléatoire/alphabétique pour tous les candidats ; pas de score « bon/mauvais » ; pas de recommandation de vote.
3. **Séparation stricte** entre : *ce qui est dit* (citation) → *ce qui est résumé* (IA, étiqueté, relu) → *ce qui est mesuré* (calculs, données publiques). Trois couleurs/pictos distincts dans l'UI.
4. **Humain dans la boucle** : toute proposition passe par une file de validation avant publication (double lecture sur Niveau 1).
5. **Abstention explicite** : « Aucune position trouvée » est une information distincte de « position non publiée » et de « position contraire ».
6. **Méthodologie publique** : prompts, modèles, seuils, jeux d'évaluation, journal des corrections et des modifications de sources.
7. **Droit de réponse / rectification** : canal officiel pour les équipes de campagne, avec traitement symétrique et délai garanti.

## 1.3 Utilisateurs et besoins
| Segment | Besoin principal | Fonctions clés |
|---|---|---|
| Citoyens | Comprendre vite, comparer 2-4 candidats | Comparateur, assistant, fiches thème |
| Journalistes | Retrouver une citation/date, détecter un revirement | Recherche exacte, historique, export CSV/JSON, API, citations permanentes (permalinks) |
| Étudiants / chercheurs | Corpus structuré et citable | Exports, DOI/versions du dataset, API, méthodologie |
| Fonctionnaires | Anticiper l'impact administratif | Coûts annoncés, niveau territorial, horizon |
| Think tanks / ONG | Suivre un thème, alertes | Veille thématique, alertes, comparaison internationale |
| Acteurs politiques | Vérifier la représentation fidèle | Espace de rectification, journal des modifications |

## 1.4 Les six fonctions (résumé fonctionnel)

### F1 — Comparateur entre partis/candidats
Entrées : thème (taxonomie, niveau 1-3), 2 à 8 entités, filtre de période, niveau de source minimal.
Sorties calculées par le moteur (cf. 04) : **Accords** (cluster de propositions équivalentes), **Divergences** (même question, réponses opposées), **Propositions uniques** (aucun voisin au-dessus du seuil), **Sujets absents** (thème sans proposition, avec mention du périmètre de recherche).
Vues : tableau, matrice (thèmes × candidats, cellule = nb de propositions + position), cartes, chronologie, radar idéologique (axes descriptifs, jamais un « score de qualité »).

### F2 — Évolution historique d'un parti
Lignée d'entités : `political_entity` + `entity_lineage` (RPR→UMP→LR ; FN→RN ; PCF ; PS ; Verts→EELV→LE ; MoDem ; LFI…) pour 2002, 2007, 2012, 2017, 2022, 2027.
Classification par paire d'éditions (cf. 04 §6) : maintenue / nouvelle / abandonnée / changement de position (durcissement, assouplissement). Frise chronologique avec, pour chaque changement, les deux citations côte à côte et les sources.
Précaution : un changement détecté automatiquement est « candidat » tant qu'il n'est pas validé par un relecteur.

### F3 — Comparaison internationale
Corpus : Manifesto Project (MARPOR), ParlGov, CHES (Chapel Hill Expert Survey), programmes officiels des partis étrangers (DE, UK, ES, IT, NL, SE, DK, US, CA, KR, JP, AU). Licences à vérifier source par source.
Sorties : parti étranger le plus proche par thème et global (avec intervalle d'incertitude), mesures équivalentes, diffusion d'une idée (carte + liste de partis + dates), cartographie réseau. Alignement via embeddings multilingues + codage des catégories MARPOR comme ancrage.
Avertissement UI obligatoire : les systèmes politiques diffèrent, la proximité est lexicale/thématique, pas une équivalence juridique.

### F4 — Moteur d'alignement idéologique
Scores 0-100 de **positionnement descriptif** sur 6 dimensions (idéologique global, économique, environnemental, sociétal, européen, institutionnel) + **distance** entre entités. Réseau dynamique de similarité (force-directed, seuil réglable, période réglable). Chaque score ouvre le détail : propositions qui ont contribué, poids, incertitude.

### F5 — Fact-checking / mise en contexte
Pour une proposition « vérifiable » (chiffre, coût, effet annoncé) : rattachement à des données officielles (INSEE, DREES, DARES, Cour des comptes, OFCE, IPP, HCFP, Eurostat, OCDE, Banque de France, DGFiP, Légifrance) ; affichage de la série, de l'évaluation existante, du consensus de la littérature s'il existe, de l'estimation de coût **avec sa source et sa méthode**. Aucun verdict « vrai/faux » propre à la plateforme : on affiche « Ce que disent les sources », avec statut `consensus | débattu | données insuffisantes`.

### F6 — Assistant conversationnel (RAG)
Réponses courtes, structurées, **chaque phrase suivie de références [n]** cliquables vers la citation exacte. Refus poli si aucune source ne soutient la réponse ; refus des demandes de recommandation de vote ou de jugement ; mêmes règles de symétrie. Mode « strict » : affiche uniquement des citations, sans reformulation.

## 1.5 UX/UI

### Direction
Éditorial sobre (FT, The Economist), données explorables (Our World in Data), densité d'information et lisibilité (Politico, Le Grand Continent). Fond clair, typographie à empattement pour les citations, sans-serif pour l'interface, **palette neutre pour les partis** (pas de couleurs partisanes imposées : teintes catégorielles accessibles, daltonisme-safe, attribuées de façon stable mais non idéologique).

### Règles de neutralité UI
- Ordre des candidats : alphabétique par défaut, rotation aléatoire à chaque session pour les listes « marketing » ; jamais par sondage.
- Mêmes dimensions de cartes, même nombre de caractères visibles.
- Pas de rouge/vert évaluatif. Pas d'icônes « pouce » ou « étoile ».
- Badges de nature : `Citation` (guillemets), `Résumé IA relu`, `Donnée publique`, `Calcul`.
- Badge de fiabilité de source N1/N2/N3 visible partout.

### Accessibilité & perf
RGAA 4 / WCAG 2.2 AA, navigation clavier des visualisations, alternative tabulaire pour chaque graphique, SSR, Core Web Vitals verts, mode sombre, imprimable (PDF d'un comparatif).

## 1.6 Maquettes (wireframes textuels)

### M1 — Accueil
```
┌──────────────────────────────────────────────────────────────┐
│ Programme·Comparé   Thèmes  Candidats  Historique  International  Méthode  🔎 │
├──────────────────────────────────────────────────────────────┤
│  « Que proposent les candidats sur… »  [ retraites        ▾ ] │
│  [Comparer]   ou   [Poser une question à l'assistant]        │
├──────────────────────────────────────────────────────────────┤
│ Thèmes (grille 6×4) : Économie · Travail · Éducation · Santé…│
│ Dernières propositions ajoutées (N1/N2/N3, date, source)     │
│ Barre de transparence : 12 483 propositions · 94 % relues ·  │
│ dernière mise à jour 12/10/2026 · [journal des corrections]  │
└──────────────────────────────────────────────────────────────┘
```

### M2 — Comparateur (tableau)
```
Thème : Retraites ▸ Âge légal     Candidats: [A][B][C][D] [+ ajouter]   Vue: ▣Tableau ▢Matrice ▢Cartes ▢Chrono ▢Radar
Synthèse calculée:  Accords (2) · Divergences (3) · Uniques (5) · Absents (1)   ⓘ comment c'est calculé
┌────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Sous-thème │ Candidat A       │ Candidat B       │ Candidat C       │
├────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Âge légal  │ « citation… »    │ « citation… »    │ — Aucune position│
│            │ Promesse·N1·2026 │ Objectif·N2·2026 │ trouvée (cherché │
│            │ [source ↗][cit.] │ [source ↗][cit.] │ dans 214 docs)   │
└────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### M3 — Fiche proposition (page permanente)
Citation exacte (avec contexte avant/après dépliable) · résumé étiqueté · métadonnées (statut, thème, niveau territorial, coût annoncé + source du coût, horizon) · source (URL, archive, hash, page/timecode, auteur, date de capture) · propositions proches (score + explication) · historique des versions de la fiche · bouton « Signaler une erreur ».

### M4 — Historique d'un parti
Frise 2002 → 2027, 6 colonnes ; lignes = thèmes ; pastilles typées (maintenue ●, nouvelle ◆, abandonnée ✕, changement ⇄ avec flèche durcissement/assouplissement) ; clic = panneau latéral avec les 2 citations et leurs sources.

### M5 — International
Carte du monde (choroplèthe douce) + liste classée « Partis les plus proches » avec par thème la distance et l'incertitude ; vue « Diffusion d'une mesure » : frise + carte des partis qui la proposent ; avertissement méthodologique permanent.

### M6 — Alignement
Réseau de similarité (nœuds = entités, arêtes = proximité > seuil réglable), curseur temporel, tableau des 6 scores avec intervalles de confiance, panneau « pourquoi ce score ».

### M7 — Assistant
Chat à gauche ; à droite le **volet de sources** qui se synchronise avec la phrase survolée ; boutons « Voir la citation exacte », « Ouvrir le document », « Comparer ces candidats ».

### M8 — Méthodologie & transparence
Définitions, taxonomie versionnée, prompts, modèles et versions, métriques de qualité (précision d'extraction, accord inter-annotateurs), journal public des corrections, politique de rectification, financement.
