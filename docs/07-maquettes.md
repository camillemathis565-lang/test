# 7. Maquettes des principales pages

Prototype cliquable (HTML autonome, données fictives) : [maquettes/index.html](../maquettes/index.html) — ouvrir dans un navigateur.

## 7.1 Principes UX/UI

Références : la sobriété typographique du *Financial Times* et de *The Economist*, la pédagogie des graphiques d'*Our World in Data*, la densité d'information de *Politico*, le soin éditorial du *Grand Continent*.

| Principe | Application |
|----------|-------------|
| Sobriété | Fond papier clair / mode sombre, une police à empattements pour les titres (ex. Source Serif), une sans-serif pour l'interface (ex. Inter), pas d'illustrations décoratives |
| Neutralité visuelle | **Palette neutre par défaut** (pas les couleurs des partis : le rouge/bleu induit des associations). Option « couleurs officielles des partis » désactivée par défaut. Ordre alphabétique par défaut, option « ordre aléatoire ». Même taille et même gabarit pour chaque parti |
| Traçabilité | Chaque affirmation porte une pastille de source `[1]` ; survol = citation exacte ; clic = document original surligné + archive |
| Statut visible | Pastille de vérification (« vérifié », « non vérifié — extrait automatiquement »), type de source (programme / discours / presse) et statut (promesse, objectif…) |
| Transparence | Chaque graphique a « Méthode », « Données » (téléchargement CSV) et « Limites » |
| Accessibilité | RGAA 4.1 / WCAG 2.2 AA ; chaque graphique a une table alternative ; motifs en plus des couleurs |
| Mobile d'abord | Les comparaisons basculent en cartes empilées sur téléphone |

## 7.2 Page d'accueil

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PROGRAMMES 2027          Thèmes  Partis  Comparer  Historique  Monde  Méthode│
├────────────────────────────────────────────────────────────────────────────┤
│  Comparez les programmes pour 2027, source par source.                     │
│  ┌──────────────────────────────────────────────────────────────┐ [Chercher]│
│  │ Posez une question : « Qui veut changer l'âge de la retraite ? »         │
│  └──────────────────────────────────────────────────────────────┘          │
│  Données au 12/01/2027 · 11 candidats · 4 812 propositions · 9 340 sources  │
├────────────────────────────────────────────────────────────────────────────┤
│  THÈMES                                                                    │
│  [Économie] [Travail] [Retraites] [Santé] [Éducation] [Environnement]      │
│  [Immigration] [Sécurité] [Justice] [Défense] [Europe] [Institutions] …    │
├────────────────────────────────────────────────────────────────────────────┤
│  CANDIDATS (ordre alphabétique · ⇄ aléatoire)                              │
│  [A]  [B]  [C]  [D]  [E]  [F] …    chacun : nb propositions, nb sources     │
├────────────────────────────────────────────────────────────────────────────┤
│  NOUVEAU DEPUIS 7 JOURS        │  JOURNAL DES CORRECTIONS │ COUVERTURE      │
│  · Parti C — 6 propositions    │  · 10/01 correction…      │ barres par parti│
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.3 Comparateur (F1)

```
┌ Comparer ──────────────────────────────────────────────────────────────────┐
│ Thème [Travail ▸ Retraites ▾]  Partis [A ✕][B ✕][C ✕][D ✕][+]  Élection [2027]│
│ Vue : (●) Tableau ( ) Matrice ( ) Cartes ( ) Chronologie ( ) Radar          │
│ Filtres : ☑ vérifiées uniquement  ☐ inclure objectifs généraux  Sources ≤ N2 │
├───────────────────────────┬────────────────┬───────────────┬───────────────┤
│ Enjeu                     │ Parti A        │ Parti B       │ Parti C       │
├───────────────────────────┼────────────────┼───────────────┼───────────────┤
│ Âge légal de départ       │ 62 ans [1][2]  │ 64 ans [3]    │ 60 ans [4]    │
│                           │ mesure détaill.│ prise de pos. │ promesse      │
│ Durée de cotisation       │ 42 ans [5]     │ ░ aucune prop.│ 40 ans [6]    │
│ Financement               │ …              │ …             │ …             │
├───────────────────────────┴────────────────┴───────────────┴───────────────┤
│ ACCORDS (2)   DIVERGENCES (3)   PROPOSITIONS UNIQUES (5)   SUJETS ABSENTS (4)│
│ ▸ A et C : maintien du dispositif carrières longues [1][6]                  │
├────────────────────────────────────────────────────────────────────────────┤
│ CONTEXTE ▸ Âge effectif moyen de départ (DREES, 2025) · Solde du système   │
│ (COR, rapport annuel) · Évaluations publiées (3) · Coûts : annoncés vs tiers│
└────────────────────────────────────────────────────────────────────────────┘
  Survol de [3] → bulle : « citation exacte… » — Discours, Lyon, 14/02/2027,
  vidéo 00:42:10 · Vérifié · Ouvrir la source ↗ · Archive ↗
```

## 7.4 Fiche proposition

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Retraites ▸ Âge de départ                              Réf. P27-RET-000142 │
│ Parti A — Ramener l'âge légal de départ à 62 ans                           │
│ [Mesure détaillée] [Niveau national] [Quinquennat] [✓ Vérifié · 2 relecteurs]│
├────────────────────────────────────────────────────────────────────────────┤
│ CITATION EXACTE                                                            │
│ « … » — Programme présidentiel, p. 34, publié le 18/01/2027                │
│ [Ouvrir le PDF à la page 34] [Archive horodatée] [Empreinte SHA-256]       │
│ Résumé (rédigé par IA, relu) : …                                           │
├────────────────────────────────────────────────────────────────────────────┤
│ COÛT                    Annoncé par le parti │ Estimations tierces         │
│                         8 Md€/an [src]       │ Institut X : 10–14 Md€ [src]│
├────────────────────────────────────────────────────────────────────────────┤
│ AUSSI DIT DANS (3)  · Discours 14/02 [vidéo 00:42] · Interview 20/02 …     │
│ HISTORIQUE DU PARTI ●2017 ●2022 ●2027 (assouplissement) [voir la frise]    │
│ PROPOSITIONS PROCHES : Parti C (similaire) · À l'étranger : 2 partis       │
│ [Signaler une erreur] [Citer cette proposition] [API]                      │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.5 Historique d'un parti (F2)

```
┌ Parti A — évolution 2002 → 2027 ───────────────────── lignée : X (2002–2016) → Parti A ┐
│ Thème [Tous ▾]   Types : ☑ nouvelles ☑ abandonnées ☑ changements ☑ durcis./assoupl. │
│                 2002   2007   2012   2017   2022   2027                            │
│ Âge légal        ●──────●──────●──────●──────●──────●                               │
│                  60     60     60     62↑    62     62     ↑ = durcissement [src]   │
│ Nucléaire        ·      ●──────●──────●──────●──────●      changement de position   │
│ Sortie de l'UE   ●──────●──────○      ○      ○      ○      ○ = non repris au progr. │
│ Clic sur un point → les deux extraits côte à côte + qualification + validateurs   │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 7.6 Monde (F3)

```
┌ Comparaison internationale ────────────────────────────────────────────────┐
│ Parti français [Parti A ▾]   Dimension [Globale ▾]   Élections ±4 ans      │
│ ┌──────────────── carte ───────────────┐  Partis les plus proches          │
│ │ pays colorés par proximité maximale   │  1. DE — Parti α  0,71 [0,64–0,77]│
│ │                                       │  2. ES — Parti β  0,68 [0,60–0,75]│
│ └───────────────────────────────────────┘  3. NL — Parti γ  0,66 …          │
│ Pourquoi ? Accords : … [src FR][src DE]   Divergences : …                   │
│ Diffusion d'une mesure : frise des premières apparitions par pays          │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.7 Alignement (F4)

Matrice de proximité partis × partis + réseau force-dirigé + radar à 6 axes, curseur temporel 2002 → 2027, sélecteur de dimension, panneau « méthode et limites » toujours visible.

## 7.8 Assistant (F6)

```
┌ Assistant — répond uniquement à partir des sources indexées ───────────────┐
│ Vous : Qui souhaite augmenter l'âge légal de départ ?                      │
│ Assistant :                                                                │
│  Valeur en vigueur : 64 ans (loi de 2023) [L1]                             │
│  Propositions supérieures à la valeur en vigueur : Parti D (65 ans) [E12]  │
│  Maintien : Parti B [E7]                                                   │
│  Propositions inférieures : Parti A (62) [E3], Parti C (60) [E9]           │
│  Aucune proposition trouvée : Parti E, Parti F (sources au 12/01/2027)     │
│  ── Sources (5) ─ [E3] Programme Parti A p.34 · [E7] … ─────────────────── │
│  ℹ Réponse générée par IA à partir de 5 extraits vérifiés. Signaler.       │
└────────────────────────────────────────────────────────────────────────────┘
```
(Données fictives.)

## 7.9 Page Méthode

Charte de neutralité, composition du comité scientifique, financements, méthodes de calcul et code, taux de couverture par parti, journal des corrections, procédure de droit de réponse, résultats des audits de symétrie de l'assistant.
