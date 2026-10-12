# 3. Modèle de données

PostgreSQL 16 + extensions `vector`, `pg_trgm`, `ltree`, `btree_gist`. Tous les identifiants sont des UUID v7. Toutes les tables « éditoriales » portent `created_at`, `updated_at`, `created_by`, et sont **historisées** (table `*_history` ou `audit_log`).

## 3.1 Schéma SQL (extrait de référence)

```sql
-- ===== Référentiels =====
CREATE TYPE source_level AS ENUM ('N1','N2','N3');
CREATE TYPE statement_status AS ENUM
  ('objectif','promesse','proposition','mesure_detaillee','prise_de_position','critique');
CREATE TYPE territorial_level AS ENUM
  ('international','europeen','national','regional','departemental','intercommunal','communal','outre_mer','multi');
CREATE TYPE time_horizon AS ENUM ('immediat_100j','quinquennat','moyen_terme_10a','long_terme','non_precise');
CREATE TYPE review_state AS ENUM ('auto','a_relire','relu','conteste','retire');

CREATE TABLE country (iso2 char(2) PRIMARY KEY, name_fr text NOT NULL, name_en text NOT NULL);

CREATE TABLE political_entity (            -- parti, mouvement, coalition
  id uuid PRIMARY KEY, country char(2) REFERENCES country,
  name text NOT NULL, short_name text, kind text CHECK (kind IN ('parti','mouvement','coalition','liste')),
  founded_on date, dissolved_on date, website text, wikidata_qid text,
  external_ids jsonb          -- {manifesto_party_id, parlgov_id, ches_id}
);
CREATE TABLE entity_lineage (              -- RPR→UMP→LR ; FN→RN ; etc.
  from_entity uuid REFERENCES political_entity, to_entity uuid REFERENCES political_entity,
  relation text CHECK (relation IN ('renommage','fusion','scission','successeur','alliance')),
  effective_on date, source_id uuid, PRIMARY KEY (from_entity,to_entity,effective_on)
);

CREATE TABLE person (
  id uuid PRIMARY KEY, full_name text NOT NULL, wikidata_qid text, birth_date date, country char(2)
);
CREATE TABLE candidacy (                   -- un candidat pour une élection donnée
  id uuid PRIMARY KEY, person_id uuid REFERENCES person, election_id uuid,
  entity_id uuid REFERENCES political_entity, status text CHECK (status IN
    ('declare','pressenti','investi','parraine','valide_cc','retire')),
  declared_on date, withdrawn_on date
);
CREATE TABLE election (
  id uuid PRIMARY KEY, country char(2), kind text, year int, round1_on date, round2_on date
);

-- ===== Sources et documents =====
CREATE TABLE source (                      -- une origine éditoriale (site, chaîne, média)
  id uuid PRIMARY KEY, name text, domain text, owner_entity uuid REFERENCES political_entity,
  default_level source_level NOT NULL, kind text, robots_policy text, legal_notes text
);
CREATE TABLE document (                    -- un objet logique (le programme 2027 d'un parti)
  id uuid PRIMARY KEY, source_id uuid REFERENCES source, doc_type text CHECK (doc_type IN
    ('programme','profession_de_foi','discours','interview','debat','communique','publication',
     'proposition_loi','amendement','presse','think_tank','rapport','post')),
  title text, author text, language char(2), published_at timestamptz,
  level source_level NOT NULL, election_id uuid, entity_id uuid, person_id uuid, canonical_url text
);
CREATE TABLE document_version (            -- chaque capture immuable
  id uuid PRIMARY KEY, document_id uuid REFERENCES document, url text NOT NULL,
  archive_url text, sha256 bytea NOT NULL, storage_key text NOT NULL, mime text,
  captured_at timestamptz NOT NULL, http_headers jsonb, text_content text,
  extraction jsonb,                        -- pages, bbox, timecodes, ocr_confidence
  supersedes uuid REFERENCES document_version
);

-- ===== Taxonomie extensible =====
CREATE TABLE taxonomy_version (id serial PRIMARY KEY, label text, released_on date, notes text);
CREATE TABLE theme (
  id uuid PRIMARY KEY, taxonomy_version int REFERENCES taxonomy_version,
  slug text NOT NULL, path ltree NOT NULL,   -- ex: economie.fiscalite.impot_revenu
  label_fr text NOT NULL, label_en text, definition text, scope_notes text,
  marpor_codes text[],                       -- correspondance Manifesto Project
  cap_code text,                             -- Comparative Agendas Project
  valid_from date, valid_to date, replaced_by uuid,
  UNIQUE (taxonomy_version, slug)
);
CREATE INDEX ON theme USING gist (path);

CREATE TABLE reference_question (          -- colonne vertébrale du comparateur
  id uuid PRIMARY KEY, theme_id uuid REFERENCES theme,
  question_fr text NOT NULL,               -- « Faut-il relever l'âge légal de départ ? »
  answer_scale jsonb,                      -- options ordonnées: [{code:'-2',label:'Abaisser nettement'},…]
  axis text                                -- économique|environnemental|sociétal|européen|institutionnel|null
);

-- ===== Cœur : propositions =====
CREATE TABLE proposition (
  id uuid PRIMARY KEY,
  entity_id    uuid NOT NULL REFERENCES political_entity,   -- parti
  candidacy_id uuid REFERENCES candidacy,                    -- candidat (nullable : position de parti)
  person_id    uuid REFERENCES person,                       -- locuteur si différent
  election_id  uuid REFERENCES election,
  stated_on    date NOT NULL,                                -- date
  status       statement_status NOT NULL,                    -- objectif, promesse…
  theme_id     uuid NOT NULL REFERENCES theme,               -- thème principal
  subtheme_id  uuid REFERENCES theme,                        -- sous-thème
  secondary_themes uuid[] DEFAULT '{}',
  territorial_level territorial_level NOT NULL DEFAULT 'national',
  territory_codes text[],                                    -- codes INSEE / ISO si pertinent
  summary_fr   text NOT NULL,                                -- résumé (≤ 35 mots)
  summary_origin text CHECK (summary_origin IN ('humain','ia_relu','ia_non_relu')),
  cost_amount numeric, cost_currency char(3) DEFAULT 'EUR', cost_unit text,   -- 'par_an'|'total'|'par_hab'
  cost_year int, cost_kind text CHECK (cost_kind IN ('annonce_par_parti','estime_tiers')),
  cost_citation_id uuid,                                     -- source du coût
  horizon time_horizon NOT NULL DEFAULT 'non_precise',
  horizon_date date,
  stance_target uuid REFERENCES proposition,                 -- pour 'critique' : mesure visée
  stance_target_entity uuid REFERENCES political_entity,
  reference_question_id uuid REFERENCES reference_question,
  stance_value smallint,                                     -- position sur l'échelle de la question
  stance_confidence real,
  group_id uuid,                                             -- regroupe les répétitions
  first_seen_on date,
  review review_state NOT NULL DEFAULT 'auto',
  reviewed_by uuid, reviewed_at timestamptz,
  best_level source_level NOT NULL,                          -- meilleur niveau de source disponible
  lang char(2) DEFAULT 'fr',
  embedding vector(1024),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('french', summary_fr)) STORED
);
CREATE INDEX ON proposition USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON proposition (entity_id, theme_id, stated_on);
CREATE INDEX ON proposition USING gin (fts);

CREATE TABLE citation (                    -- ≥ 1 par proposition (CHECK applicatif + trigger)
  id uuid PRIMARY KEY, proposition_id uuid NOT NULL REFERENCES proposition,
  document_version_id uuid NOT NULL REFERENCES document_version,
  quote_text text NOT NULL, quote_lang char(2),
  char_start int, char_end int, page int, bbox jsonb,
  timecode_start numeric, timecode_end numeric, speaker text,
  context_before text, context_after text,
  url text NOT NULL, archive_url text, author text, published_at timestamptz,
  is_primary boolean DEFAULT true,
  verified_exact boolean NOT NULL,          -- extrait retrouvé à l'identique dans le texte source
  translation_fr text, translation_origin text
);

-- ===== Comparaison & historique (dérivé, recalculable) =====
CREATE TABLE proposition_link (            -- paires de propositions proches
  a uuid REFERENCES proposition, b uuid REFERENCES proposition,
  kind text CHECK (kind IN ('equivalent','proche','oppose','plus_restrictif','plus_ambitieux','lie')),
  similarity real, nli_label text, algo_version text, explanation jsonb,
  review review_state DEFAULT 'auto', PRIMARY KEY (a,b,algo_version)
);
CREATE TABLE proposition_cluster (id uuid PRIMARY KEY, theme_id uuid, label text, algo_version text);
CREATE TABLE cluster_member (cluster_id uuid, proposition_id uuid, PRIMARY KEY(cluster_id,proposition_id));

CREATE TABLE position_change (             -- F2 : évolutions entre éditions
  id uuid PRIMARY KEY, entity_id uuid, theme_id uuid, reference_question_id uuid,
  from_proposition uuid, to_proposition uuid, from_election uuid, to_election uuid,
  change_type text CHECK (change_type IN ('maintenue','nouvelle','abandonnee','changement',
                                          'durcissement','assouplissement')),
  magnitude real, explanation text, review review_state DEFAULT 'a_relire'
);

CREATE TABLE ideology_score (              -- F4
  entity_id uuid, as_of date, dimension text CHECK (dimension IN
    ('global','economique','environnemental','societal','europeen','institutionnel')),
  score real, ci_low real, ci_high real, n_propositions int, method_version text,
  contributions jsonb, PRIMARY KEY (entity_id, as_of, dimension, method_version)
);
CREATE TABLE entity_similarity (           -- réseaux de similarité, y compris international
  a uuid, b uuid, as_of date, dimension text, theme_id uuid, distance real, ci real, method_version text,
  PRIMARY KEY (a,b,as_of,dimension,theme_id,method_version)
);

-- ===== Fact-checking =====
CREATE TABLE dataset_ref (                  -- série ou rapport public
  id uuid PRIMARY KEY, provider text, title text, url text, indicator_code text,
  series jsonb, license text, last_checked timestamptz
);
CREATE TABLE evidence_link (
  proposition_id uuid REFERENCES proposition, dataset_ref_id uuid REFERENCES dataset_ref,
  relation text CHECK (relation IN ('donnee_contexte','evaluation_existante','estimation_cout','etude_effet')),
  summary_fr text, consensus text CHECK (consensus IN ('consensus','debattu','donnees_insuffisantes','non_applicable')),
  citation_url text, reviewed boolean DEFAULT false
);

-- ===== Gouvernance =====
CREATE TABLE correction_request (id uuid PRIMARY KEY, proposition_id uuid, requester_kind text,
  requester_contact text, reason text, state text, resolution text, published_log boolean DEFAULT true,
  opened_at timestamptz, closed_at timestamptz);
CREATE TABLE audit_log (id bigserial PRIMARY KEY, actor uuid, action text, object_type text,
  object_id uuid, before jsonb, after jsonb, at timestamptz DEFAULT now());
CREATE TABLE llm_run (id uuid PRIMARY KEY, task text, model text, model_version text,
  prompt_hash text, input_ref uuid, output jsonb, cost_eur numeric, at timestamptz);
```

Contraintes d'intégrité clés : (1) trigger refusant `published` sans citation `verified_exact = true` ; (2) `document_version` immuable (aucun UPDATE) ; (3) `best_level` recalculé depuis les citations ; (4) suppression logique uniquement (`review='retire'` + motif public).

## 3.2 Statuts d'une déclaration
| Valeur | Définition opérationnelle |
|---|---|
| objectif | but sans moyen précisé (« réduire le chômage à 5 % ») |
| promesse | engagement formulé à la première personne ou au futur, sans détail de mise en œuvre |
| proposition | mesure concrète annoncée, peu détaillée |
| mesure_detaillee | mesure avec paramètres (montant, date, mécanisme, texte de loi) |
| prise_de_position | opinion sur un sujet, sans engagement d'action |
| critique | critique d'une mesure/acteur ; `stance_target` renseigné |

## 3.3 Taxonomie (v1, extensible)
Trois niveaux : **thème** (≈ 25) → **sous-thème** (≈ 150) → **tag libre contrôlé**. Versionnée (`taxonomy_version`), jamais de suppression : `valid_to` + `replaced_by`. Correspondances avec **MARPOR (CMP)** et **Comparative Agendas Project** pour la comparaison internationale. Règle d'ajout : un sous-thème est créé lorsque ≥ 5 propositions de ≥ 2 entités ne rentrent dans aucun existant (revue mensuelle, journal public).

```
economie
  fiscalite (impot_revenu, impot_societes, tva, patrimoine, successions, niches_fiscales, fiscalite_locale)
  dette_deficit · depenses_publiques (reforme_etat, fonction_publique, collectivites) · industrie
  pme_artisanat · commerce_exterieur · innovation_rd · concurrence_regulation · pouvoir_achat (prix, energie, carburants)
travail
  emploi · chomage (assurance_chomage, accompagnement) · temps_travail · dialogue_social
  retraites (age_legal, duree_cotisation, regimes_speciaux, financement, pensions) · salaires (smic, partage_valeur) · conditions_travail
education
  primaire · secondaire (college, lycee, voie_pro) · superieur (universites, selection, bourses) · recherche · apprentissage_formation · enseignants · laicite_ecole
sante
  hopital · medecine_ville (deserts_medicaux) · prevention · assurance_maladie · medicament · dependance_grand_age · sante_mentale · fin_de_vie
environnement
  biodiversite · climat (adaptation, objectifs) · energie (mix, prix) · nucleaire · renouvelables
  agriculture (pac, pesticides, elevage) · mobilite (transports_collectifs, automobile, aerien) · eau_dechets · amenagement_littoral
immigration (regulation_flux, asile, integration, nationalite, regularisation, europe_schengen)
securite (police, terrorisme, delinquance, armes, securite_routiere, cybersecurite)
justice (moyens, penal, prisons, mineurs, independance, procedure)
defense (budget, dissuasion, alliances_otan, industrie_defense, service_militaire, cyber_defense)
europe (budget_ue, institutions_ue, zone_euro, elargissement, souverainete_europeenne, derogations)
institutions (regime, referendum, mode_scrutin, parlement, decentralisation, transparence_vie_publique, etat_civil_laicite)
culture (patrimoine, audiovisuel_public, creation, langue, sport)
logement (offre, loyers, hlm_sru, renovation_energetique, accession, sans_abrisme)
numerique (ia, donnees_personnelles, plateformes, souverainete_numerique, inclusion, cybersecurite)
commerce (consommation, distribution, e_commerce, protection_consommateur)
ruralite (services_publics, amenagement_territoire, mobilite_rurale, agriculture_territoire)
outre_mer (vie_chere, statut_institutionnel, developpement, risques_naturels, mobilite)
politique_etrangere (diplomatie, afrique, indo_pacifique, moyen_orient, ukraine_russie, usa_chine, aide_developpement, francophonie)
famille_societe (egalite_hf, famille, droits_lgbt, bioethique, discriminations, vie_associative)
protection_sociale (minima, handicap, pauvrete, jeunesse)
```
Vocabulaire à valider par un comité scientifique pluraliste (politistes d'orientations variées). Les intitulés sont **descriptifs** et évitent les termes connotés (ex. « régulation des flux migratoires », « politique d'asile », pas de jargon partisan).

## 3.4 Vues d'entrepôt
`mv_matrix(theme, entity, n_props, stance_mode)` · `mv_timeline(entity, theme, year)` · `mv_latest_by_entity_theme` · rafraîchies après chaque lot publié.
