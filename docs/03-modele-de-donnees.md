# 3. Modèle de données

Schéma SQL complet et commenté : [db/schema.sql](../db/schema.sql) (PostgreSQL 16 + pgvector + ltree).

## 3.1 Diagramme entité-relation (simplifié)

```
 country ─┬─< election ─────────────< candidacy >──── person ──< party_role >── party
          │                                │                                    │  ▲
          └─< party ───────────────────────┘                    party_lineage ──┘  │ (FN→RN, UMP→LR…)
                │
  source ─< document_version ─< excerpt ──────────────────────────┐
    │  (tier, type, URL,        (SHA-256,   (citation exacte,      │
    │   auteur, date)            archive)    page / horodatage)    │
    │                                                              │ primary_excerpt_id (NOT NULL)
  author                                                           │
                                    topic (ltree) ──< issue        │
                                       ▲               ▲           │
                                       │               │           │
                          proposal ────┴───────────────┴───────────┘
                           │   │  │  │
       proposal_excerpt ───┘   │  │  └── proposal_issue_position (position −2..+2, valeur chiffrée)
       proposal_relation ──────┘  └───── cost_estimate (annoncé ≠ évalué)
       party_evolution, proposal_cluster, party_similarity, party_dimension_score (calculés)
       indicator ─< indicator_value ;  evaluation ─< evaluation_link ; factual_claim
       report, public_correction_log, review_event (gouvernance)
```

## 3.2 La fiche « proposition » — champs demandés et correspondance

| Champ demandé | Colonne(s) | Remarques |
|---------------|-----------|-----------|
| Parti | `proposal.party_id` → `party` | Lignée résolue via `party_lineage` pour l'historique |
| Candidat | `proposal.candidacy_id`, `proposal.person_id` | La personne qui s'exprime peut différer du candidat (porte-parole) |
| Date | `proposal.stated_on` | Date de l'énoncé ; la date de publication de la source est dans `source.published_at` |
| Source | `proposal.primary_excerpt_id` → `excerpt` → `document_version` → `source` | **Obligatoire** (NOT NULL) |
| Lien | `source.url` + `document_version.external_archive_url` + ancre (page / horodatage) | Lien profond vers le passage |
| Citation exacte | `excerpt.quote` (+ `quote_sha256`, contexte avant/après) | Verbatim, jamais reformulé |
| Résumé | `proposal.summary_fr` + `summary_origin` (ia / humain / ia_relu) | Origine affichée à l'utilisateur |
| Thème principal | `proposal.main_topic_id` | Niveau 1 ou 2 de la taxonomie |
| Sous-thème | `proposal.sub_topic_id` + `proposal_topic` (thèmes secondaires pondérés) | |
| Niveau territorial | `proposal.territorial_level` | européen → communal, outre-mer, international |
| Coût annoncé | `cost_estimate` avec `origin = 'annonce_parti'` | Les évaluations tierces sont des lignes distinctes, jamais fusionnées |
| Horizon temporel | `proposal.time_horizon` + `horizon_detail` | |
| Statut | `proposal.status` | objectif, promesse, proposition, mesure détaillée, prise de position, critique d'une autre mesure |

Champs ajoutés pour la comparaison fine et la confiance :
- `proposal_issue_position` : position sur une **question de politique publique** et **paramètre chiffré** (`numeric_value`, `conditions`).
- `review` : état de validation (extrait_auto → verifie → verifie_double ; conteste ; retire).
- `extraction_model`, `extraction_confidence` : reproductibilité.
- `marpor_code`, `cap_code` : interopérabilité avec les jeux de données internationaux.

### Exemple de proposition (JSON renvoyé par l'API — **données fictives**)

```json
{
  "ref": "P27-RET-000142",
  "party": {"slug": "parti-a", "name": "Parti A"},
  "candidate": {"slug": "candidat-a", "name": "Candidat·e A"},
  "stated_on": "2027-01-18",
  "title": "Âge légal de départ ramené à 62 ans",
  "summary": "Ramener l'âge légal de départ à 62 ans, avec maintien d'un dispositif carrières longues.",
  "summary_origin": "ia_relu",
  "status": "mesure_detaillee",
  "topic": {"code": "TRA.RET", "label": "Retraites"},
  "sub_topic": {"code": "TRA.RET.AGE", "label": "Âge de départ"},
  "territorial_level": "national",
  "time_horizon": "quinquennat",
  "issue_positions": [
    {"issue": "RETRAITES.AGE_LEGAL", "numeric_value": 62, "unit": "ans", "conditions": "carrières longues : départ anticipé maintenu"}
  ],
  "costs": [
    {"origin": "annonce_parti", "evaluator": "Parti A", "amount_low_eur": 8.0e9, "periodicity": "annuel", "is_net": false},
    {"origin": "evaluation_independante", "evaluator": "Institut X", "amount_low_eur": 10.0e9, "amount_high_eur": 14.0e9, "periodicity": "annuel"}
  ],
  "source": {
    "tier": "niveau_1",
    "type": "programme_presidentiel",
    "title": "Programme présidentiel 2027 — Parti A",
    "url": "https://exemple.invalid/programme.pdf#page=34",
    "archive_url": "https://archive.exemple.invalid/…",
    "published_at": "2027-01-18",
    "author": "Parti A",
    "quote": "« Nous ramènerons l'âge légal de départ à 62 ans… »",
    "page": 34,
    "sha256": "9f2c…"
  },
  "review": "verifie",
  "corroborations": 3
}
```

## 3.3 Taxonomie

- Fichier maître : [taxonomie/taxonomie.yaml](../taxonomie/taxonomie.yaml) — 22 thèmes de niveau 1, ~180 sous-thèmes, codes stables (`ECO.FISC.IR`), libellés FR/EN, correspondances **CAP** (Comparative Agendas Project), **MARPOR** (Manifesto Project) et **COFOG**.
- Stockée en `ltree` : requêtes « tout ce qui est sous Économie » en une clause (`path <@ 'ECO'`).
- **Extensible et versionnée** : `taxonomy_version`, `since_version`, `deprecated_in`, `replaced_by`. Un nouveau sujet (ex. « IA générative ») est ajouté sans casser les comparaisons historiques : les anciennes propositions restent classées et une règle de reclassement optionnelle est rejouée par le pipeline.
- Multi-étiquetage : une proposition peut toucher plusieurs thèmes (`proposal_topic`, pondéré), ex. « taxe carbone aux frontières » = Environnement/Climat + Commerce/Commerce extérieur + Europe.

## 3.4 Questions de politique publique (« enjeux »)

Fichier : [taxonomie/questions-politiques.yaml](../taxonomie/questions-politiques.yaml). Chaque enjeu définit :
- une formulation neutre (« Quel âge légal de départ à la retraite ? »),
- un type d'échelle (ordinale −2..+2, numérique, binaire, catégorielle) avec libellés neutres validés par le comité méthodologique,
- un **sens de lecture descriptif** (ex. « plus restrictif / moins restrictif ») qui permet de qualifier un durcissement ou un assouplissement sans jugement de valeur,
- des poids de contribution aux dimensions d'alignement (économique, sociétale…), publiés.

Ces enjeux sont le socle de la comparaison fine (F1), de l'historique (F2), de l'alignement (F4) et des réponses exhaustives de l'assistant (F6).

## 3.5 Règles d'intégrité

1. `proposal.primary_excerpt_id NOT NULL` : impossible de créer une proposition sans extrait.
2. `excerpt` exige au moins une ancre (caractères, page ou horodatage).
3. `document_version` immuable (empreinte SHA-256) ; une modification du site d'un parti crée une nouvelle version, l'ancienne reste consultable.
4. Coûts annoncés et évaluations : lignes distinctes, chacune avec son extrait.
5. Une `critique_autre_mesure` doit désigner sa cible.
6. Rien n'est supprimé physiquement : `review = 'retire'` + motif + entrée dans `public_correction_log`.
7. Toute valeur calculée (`party_similarity`, `party_dimension_score`) porte `method_version` et `n_issues` / `n_common_issues`.
