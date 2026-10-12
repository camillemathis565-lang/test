-- =====================================================================
-- Programmes 2027 — Schéma PostgreSQL 16
-- Extensions : pgvector (vecteurs), ltree (taxonomie), pg_trgm (recherche floue)
-- Principe : aucune proposition sans extrait source (contrainte NOT NULL + FK).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
CREATE TYPE proposal_status AS ENUM (
  'objectif',            -- intention générale ("réduire la dette")
  'promesse',            -- engagement ferme ("nous ferons X")
  'proposition',         -- mesure envisagée, peu détaillée
  'mesure_detaillee',    -- mesure avec paramètres, calendrier, financement
  'prise_de_position',   -- opinion exprimée sans engagement de mise en œuvre
  'critique_autre_mesure'-- critique d'une mesure d'un autre acteur
);

CREATE TYPE source_tier AS ENUM ('niveau_1', 'niveau_2', 'niveau_3');
-- niveau_1 : programmes officiels, sites des partis, professions de foi
-- niveau_2 : discours, interviews, débats
-- niveau_3 : presse, think tanks, rapports

CREATE TYPE source_type AS ENUM (
  'programme_officiel', 'programme_presidentiel', 'profession_de_foi',
  'site_parti', 'publication_officielle_parti', 'communique_presse',
  'discours', 'interview', 'debat_televise', 'reseau_social_officiel',
  'proposition_loi', 'amendement', 'question_parlementaire', 'vote_parlementaire',
  'article_presse', 'rapport_think_tank', 'rapport_public', 'evaluation_chiffrage',
  'manifeste_etranger', 'autre'
);

CREATE TYPE territorial_level AS ENUM (
  'europeen', 'national', 'regional', 'departemental', 'intercommunal', 'communal',
  'outre_mer', 'international'
);

CREATE TYPE time_horizon AS ENUM (
  'immediat',        -- dès l'élection / 100 premiers jours
  'court_terme',     -- < 1 an
  'quinquennat',     -- dans le mandat
  'long_terme',      -- au-delà du mandat
  'non_precise'
);

CREATE TYPE review_state AS ENUM (
  'extrait_auto',     -- produit par IA, non relu
  'en_revue',
  'verifie',          -- validé par un annotateur
  'verifie_double',   -- validé par deux personnes (obligatoire pour éléments sensibles)
  'conteste',         -- signalement en cours
  'retire'            -- retiré (motif obligatoire, conservé dans le journal)
);

CREATE TYPE relation_type AS ENUM (
  'identique', 'equivalente', 'similaire', 'oppose', 'critique',
  'evolution_de', 'remplace', 'precise', 'contredit'
);

CREATE TYPE evolution_type AS ENUM (
  'maintenue', 'nouvelle', 'abandonnee', 'modifiee',
  'durcissement', 'assouplissement', 'changement_de_position', 'precision'
);

CREATE TYPE cost_origin AS ENUM ('annonce_parti', 'evaluation_independante', 'evaluation_publique');

-- ---------------------------------------------------------------------
-- Référentiels : pays, élections, partis, personnes
-- ---------------------------------------------------------------------
CREATE TABLE country (
  iso2        char(2) PRIMARY KEY,
  name_fr     text NOT NULL,
  name_en     text NOT NULL
);

CREATE TABLE election (
  id            serial PRIMARY KEY,
  country_iso2  char(2) NOT NULL REFERENCES country(iso2),
  kind          text NOT NULL,          -- presidentielle, legislatives, europeennes, federal, general...
  year          smallint NOT NULL,
  first_round   date,
  second_round  date,
  UNIQUE (country_iso2, kind, year)
);

CREATE TABLE party (
  id              serial PRIMARY KEY,
  country_iso2    char(2) NOT NULL REFERENCES country(iso2),
  slug            text NOT NULL UNIQUE,
  name            text NOT NULL,
  short_name      text NOT NULL,
  founded         date,
  dissolved       date,
  website         text,
  wikidata_qid    text,                 -- identifiant pivot (ex. Q...)
  manifesto_id    integer,              -- code partie Manifesto Project (MARPOR) si existant
  parlgov_id      integer,
  ches_id         integer,              -- Chapel Hill Expert Survey
  europarl_group  text,                 -- groupe au Parlement européen si pertinent
  color_official  text,                 -- couleur du parti (option d'affichage, désactivée par défaut)
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Filiations : changement de nom, fusion, scission, succession (FN → RN, UMP → LR...)
CREATE TABLE party_lineage (
  id              serial PRIMARY KEY,
  predecessor_id  integer NOT NULL REFERENCES party(id),
  successor_id    integer NOT NULL REFERENCES party(id),
  kind            text NOT NULL CHECK (kind IN ('renommage','fusion','scission','succession','coalition')),
  effective_date  date,
  source_excerpt_id uuid,               -- justification sourcée (FK ajoutée plus bas)
  UNIQUE (predecessor_id, successor_id)
);

-- Coalitions / alliances électorales (ex. union de la gauche, alliances de second tour)
CREATE TABLE coalition (
  id           serial PRIMARY KEY,
  election_id  integer NOT NULL REFERENCES election(id),
  name         text NOT NULL
);
CREATE TABLE coalition_member (
  coalition_id integer REFERENCES coalition(id),
  party_id     integer REFERENCES party(id),
  PRIMARY KEY (coalition_id, party_id)
);

CREATE TABLE person (
  id            serial PRIMARY KEY,
  full_name     text NOT NULL,
  slug          text NOT NULL UNIQUE,
  wikidata_qid  text,
  birth_year    smallint
);

CREATE TABLE party_role (                     -- fonctions dans un parti (porte-parole, président...)
  person_id   integer REFERENCES person(id),
  party_id    integer REFERENCES party(id),
  role        text NOT NULL,
  start_date  date,
  end_date    date,
  PRIMARY KEY (person_id, party_id, role, start_date)
);

CREATE TABLE candidacy (
  id            serial PRIMARY KEY,
  election_id   integer NOT NULL REFERENCES election(id),
  person_id     integer NOT NULL REFERENCES person(id),
  party_id      integer REFERENCES party(id),      -- parti principal de soutien
  status        text NOT NULL CHECK (status IN ('pressenti','declare','officiel','retire','elimine','elu')),
  declared_on   date,
  official_on   date,                               -- liste officielle du Conseil constitutionnel
  UNIQUE (election_id, person_id)
);

-- ---------------------------------------------------------------------
-- Taxonomie (arbre extensible et versionné)
-- ---------------------------------------------------------------------
CREATE TABLE taxonomy_version (
  id          serial PRIMARY KEY,
  label       text NOT NULL,          -- ex. "2026.10"
  published   timestamptz NOT NULL DEFAULT now(),
  notes       text
);

CREATE TABLE topic (
  id              serial PRIMARY KEY,
  code            text NOT NULL UNIQUE,            -- ex. ECO.FISC.IR
  path            ltree NOT NULL UNIQUE,           -- ex. ECO.FISC.IR
  label_fr        text NOT NULL,
  label_en        text NOT NULL,
  description     text,
  level           smallint NOT NULL,               -- 1 = thème, 2 = sous-thème, 3 = sujet fin
  cap_major       smallint,                        -- Comparative Agendas Project (code majeur)
  marpor_codes    text[],                          -- catégories Manifesto Project (ex. {per504,per505})
  cofog_code      text,                            -- classification des fonctions des administrations (ONU)
  since_version   integer REFERENCES taxonomy_version(id),
  deprecated_in   integer REFERENCES taxonomy_version(id),
  replaced_by     integer REFERENCES topic(id)
);
CREATE INDEX topic_path_gist ON topic USING gist (path);

-- Questions de politique publique (enjeux comparables) et leurs échelles
CREATE TABLE issue (
  id              serial PRIMARY KEY,
  code            text NOT NULL UNIQUE,            -- ex. RETRAITES.AGE_LEGAL
  topic_id        integer NOT NULL REFERENCES topic(id),
  question_fr     text NOT NULL,                   -- "Quel âge légal de départ à la retraite ?"
  question_en     text NOT NULL,
  scale_kind      text NOT NULL CHECK (scale_kind IN ('ordinale_5','numerique','binaire','categorielle')),
  scale_labels    jsonb,                           -- libellés neutres des positions (-2..+2) ou catégories
  -- Sens de lecture utilisé pour qualifier durcissement/assouplissement : défini par le comité méthodologique,
  -- descriptif et non normatif (ex. "plus restrictif" pour l'immigration, "plus tardif" pour l'âge légal)
  direction_label_pos text,
  direction_label_neg text,
  dimension_weights jsonb,                         -- contribution aux dimensions d'alignement {economique: 1.0, ...}
  parameter_unit  text,                            -- "ans", "%", "EUR", "postes"...
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Sources, documents, versions, extraits
-- ---------------------------------------------------------------------
CREATE TABLE author (                              -- auteur d'une source (personne ou organisation)
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  person_id   integer REFERENCES person(id),
  party_id    integer REFERENCES party(id),
  org_kind    text                                 -- parti, media, think_tank, administration, universite...
);

CREATE TABLE source (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier             source_tier NOT NULL,
  type             source_type NOT NULL,
  title            text NOT NULL,
  url              text NOT NULL,
  canonical_url    text,
  publisher        text,                           -- éditeur (parti, média, institution)
  author_id        integer REFERENCES author(id),
  published_at     timestamptz,                    -- date de publication / de l'événement
  event_name       text,                           -- ex. "Débat d'entre-deux-tours"
  language         char(2) NOT NULL DEFAULT 'fr',
  country_iso2     char(2) NOT NULL DEFAULT 'FR' REFERENCES country(iso2),
  election_id      integer REFERENCES election(id),
  license_note     text,                           -- régime de réutilisation (citation courte, licence ouverte...)
  discovered_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (url, published_at)
);

-- Chaque capture d'un document est conservée (le site d'un parti peut changer)
CREATE TABLE document_version (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        uuid NOT NULL REFERENCES source(id),
  fetched_at       timestamptz NOT NULL DEFAULT now(),
  sha256           char(64) NOT NULL,
  mime_type        text NOT NULL,
  storage_key      text NOT NULL,                  -- objet S3 de l'original
  warc_key         text,                           -- archive WARC
  external_archive_url text,                       -- ex. capture Internet Archive
  text_key         text,                           -- texte extrait (S3)
  page_count       integer,
  duration_seconds integer,                        -- vidéo/audio
  transcript_kind  text CHECK (transcript_kind IN ('officielle','auto_whisper','auto_relue')),
  is_current       boolean NOT NULL DEFAULT true,
  UNIQUE (source_id, sha256)
);

CREATE TABLE excerpt (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id uuid NOT NULL REFERENCES document_version(id),
  quote            text NOT NULL,                  -- citation exacte, verbatim
  quote_sha256     char(64) NOT NULL,
  char_start       integer,
  char_end         integer,
  page_start       integer,
  page_end         integer,
  time_start_ms    integer,                        -- horodatage vidéo
  time_end_ms      integer,
  speaker_person_id integer REFERENCES person(id), -- locuteur (débats, interviews)
  context_before   text,                           -- contexte pour lecture honnête
  context_after    text,
  language         char(2) NOT NULL DEFAULT 'fr',
  translation_fr   text,                           -- pour sources étrangères (traduction marquée comme telle)
  embedding        vector(1024),                   -- BGE-M3 dense
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (char_start IS NOT NULL OR page_start IS NOT NULL OR time_start_ms IS NOT NULL)
);
CREATE INDEX excerpt_embedding_hnsw ON excerpt USING hnsw (embedding vector_cosine_ops);
CREATE INDEX excerpt_quote_trgm ON excerpt USING gin (quote gin_trgm_ops);

ALTER TABLE party_lineage
  ADD CONSTRAINT party_lineage_excerpt_fk FOREIGN KEY (source_excerpt_id) REFERENCES excerpt(id);

-- ---------------------------------------------------------------------
-- Propositions politiques
-- ---------------------------------------------------------------------
CREATE TABLE proposal (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref         text NOT NULL UNIQUE,          -- référence stable lisible, ex. P27-RET-000142
  party_id           integer REFERENCES party(id),
  candidacy_id       integer REFERENCES candidacy(id),
  person_id          integer REFERENCES person(id), -- responsable politique qui s'exprime
  election_id        integer REFERENCES election(id),
  stated_on          date NOT NULL,                 -- date de la prise de parole / publication
  primary_excerpt_id uuid NOT NULL REFERENCES excerpt(id),   -- traçabilité obligatoire
  summary_fr         text NOT NULL,                 -- résumé neutre (≤ 280 caractères)
  summary_origin     text NOT NULL CHECK (summary_origin IN ('ia','humain','ia_relu')),
  title_fr           text NOT NULL,                 -- intitulé court
  main_topic_id      integer NOT NULL REFERENCES topic(id),
  sub_topic_id       integer REFERENCES topic(id),
  territorial_level  territorial_level NOT NULL DEFAULT 'national',
  time_horizon       time_horizon NOT NULL DEFAULT 'non_precise',
  horizon_detail     text,                          -- ex. "d'ici 2030"
  status             proposal_status NOT NULL,
  targets_actor      text,                          -- pour 'critique_autre_mesure' : mesure/acteur visé
  targets_proposal_id uuid REFERENCES proposal(id),
  review             review_state NOT NULL DEFAULT 'extrait_auto',
  extraction_confidence real CHECK (extraction_confidence BETWEEN 0 AND 1),
  extraction_model   text,                          -- modèle et version de prompt ayant extrait
  embedding          vector(1024),
  marpor_code        text,                          -- codage MARPOR (quasi-phrase) pour comparabilité internationale
  cap_code           smallint,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (party_id IS NOT NULL OR person_id IS NOT NULL),
  CHECK (status <> 'critique_autre_mesure' OR targets_actor IS NOT NULL OR targets_proposal_id IS NOT NULL)
);
CREATE INDEX proposal_party_topic ON proposal (party_id, main_topic_id, election_id);
CREATE INDEX proposal_embedding_hnsw ON proposal USING hnsw (embedding vector_cosine_ops);
CREATE INDEX proposal_review ON proposal (review);

-- Extraits supplémentaires corroborant la même proposition (répétitions dans d'autres sources)
CREATE TABLE proposal_excerpt (
  proposal_id  uuid REFERENCES proposal(id) ON DELETE CASCADE,
  excerpt_id   uuid REFERENCES excerpt(id),
  role         text NOT NULL CHECK (role IN ('principal','corroboration','precision','nuance','contradiction')),
  PRIMARY KEY (proposal_id, excerpt_id)
);

-- Thèmes secondaires (une proposition peut toucher plusieurs politiques)
CREATE TABLE proposal_topic (
  proposal_id uuid REFERENCES proposal(id) ON DELETE CASCADE,
  topic_id    integer REFERENCES topic(id),
  weight      real NOT NULL DEFAULT 1.0,
  PRIMARY KEY (proposal_id, topic_id)
);

-- Position d'une proposition sur une question de politique publique
CREATE TABLE proposal_issue_position (
  proposal_id    uuid REFERENCES proposal(id) ON DELETE CASCADE,
  issue_id       integer REFERENCES issue(id),
  position       smallint CHECK (position BETWEEN -2 AND 2),  -- échelle ordinale
  category       text,                                        -- échelle catégorielle
  numeric_value  numeric,                                     -- paramètre chiffré (ex. 62)
  numeric_value_max numeric,                                  -- fourchette éventuelle
  conditions     text,                                        -- ex. "sauf carrières longues"
  confidence     real,
  review         review_state NOT NULL DEFAULT 'extrait_auto',
  PRIMARY KEY (proposal_id, issue_id)
);

-- Coûts : annoncés par le parti ET évaluations tierces, côte à côte, jamais fusionnés
CREATE TABLE cost_estimate (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
  origin          cost_origin NOT NULL,
  evaluator       text NOT NULL,                  -- parti, institut, administration
  amount_low_eur  numeric,
  amount_high_eur numeric,
  periodicity     text CHECK (periodicity IN ('annuel','total_mandat','ponctuel','non_precise')),
  horizon_year    smallint,
  is_net          boolean,                        -- net des recettes / économies associées
  method_note     text,
  excerpt_id      uuid NOT NULL REFERENCES excerpt(id)
);

-- Relations entre propositions (même parti dans le temps, ou entre partis, ou international)
CREATE TABLE proposal_relation (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id       uuid NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
  to_id         uuid NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
  type          relation_type NOT NULL,
  similarity    real,                               -- score sémantique
  method        text NOT NULL,                      -- 'embedding+llm', 'humain'...
  rationale     text,                               -- justification courte
  review        review_state NOT NULL DEFAULT 'extrait_auto',
  UNIQUE (from_id, to_id, type),
  CHECK (from_id <> to_id)
);

-- Évolutions d'un parti (lignée incluse) d'une élection à l'autre sur une question
CREATE TABLE party_evolution (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id          integer NOT NULL REFERENCES party(id),   -- parti actuel (lignée résolue)
  issue_id          integer REFERENCES issue(id),
  topic_id          integer REFERENCES topic(id),
  from_election_id  integer REFERENCES election(id),
  to_election_id    integer NOT NULL REFERENCES election(id),
  from_proposal_id  uuid REFERENCES proposal(id),
  to_proposal_id    uuid REFERENCES proposal(id),
  type              evolution_type NOT NULL,
  delta_position    smallint,
  delta_numeric     numeric,
  explanation_fr    text NOT NULL,                  -- description factuelle, sans jugement
  review            review_state NOT NULL DEFAULT 'extrait_auto',
  CHECK (from_proposal_id IS NOT NULL OR to_proposal_id IS NOT NULL)
);

-- ---------------------------------------------------------------------
-- Contexte : indicateurs publics et évaluations (fonction 5)
-- ---------------------------------------------------------------------
CREATE TABLE indicator (
  id            serial PRIMARY KEY,
  code          text NOT NULL UNIQUE,                -- ex. INSEE.CHOMAGE.BIT
  label_fr      text NOT NULL,
  producer      text NOT NULL,                       -- INSEE, DARES, Eurostat, Banque de France...
  unit          text NOT NULL,
  frequency     text,
  dataset_url   text NOT NULL,
  api_ref       text,                                -- identifiant de série (SDMX, BDM...)
  license       text
);
CREATE TABLE indicator_value (
  indicator_id  integer REFERENCES indicator(id),
  geo           text NOT NULL DEFAULT 'FR',
  period        text NOT NULL,                       -- 2026-Q2, 2025...
  value         numeric NOT NULL,
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  vintage       text,                                -- millésime de publication
  PRIMARY KEY (indicator_id, geo, period, vintage)
);
CREATE TABLE topic_indicator (
  topic_id      integer REFERENCES topic(id),
  issue_id      integer REFERENCES issue(id),
  indicator_id  integer REFERENCES indicator(id),
  relevance_note text,
  PRIMARY KEY (topic_id, indicator_id)
);

-- Évaluations publiées (Cour des comptes, COR, HCFP, OFCE, IPP, think tanks...)
CREATE TABLE evaluation (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        uuid NOT NULL REFERENCES source(id),
  evaluator        text NOT NULL,
  evaluator_kind   text NOT NULL CHECK (evaluator_kind IN ('institution_publique','academique','think_tank','media','organisation_internationale')),
  declared_orientation text,                        -- orientation déclarée ou documentée, pour transparence
  summary_fr       text NOT NULL,
  consensus_level  text CHECK (consensus_level IN ('convergent','partage','divergent','insuffisant','non_applicable')),
  consensus_basis  text,                            -- d'où vient la qualification (revue de littérature citée)
  excerpt_id       uuid NOT NULL REFERENCES excerpt(id)
);
CREATE TABLE evaluation_link (
  evaluation_id uuid REFERENCES evaluation(id) ON DELETE CASCADE,
  proposal_id   uuid REFERENCES proposal(id),
  issue_id      integer REFERENCES issue(id),
  PRIMARY KEY (evaluation_id, proposal_id)
);

-- Affirmations factuelles vérifiables faites par un acteur ("le chômage a augmenté de X")
CREATE TABLE factual_claim (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  excerpt_id      uuid NOT NULL REFERENCES excerpt(id),
  claim_text      text NOT NULL,
  indicator_id    integer REFERENCES indicator(id),
  claimed_value   numeric,
  reference_value numeric,
  reference_period text,
  comparison      text CHECK (comparison IN ('conforme','ecart','non_comparable','donnee_indisponible')),
  comparison_note text NOT NULL,                    -- explication factuelle de l'écart (périmètre, date, définition)
  review          review_state NOT NULL DEFAULT 'extrait_auto'
);

-- ---------------------------------------------------------------------
-- Scores et matrices pré-calculés (fonctions 1, 3, 4)
-- ---------------------------------------------------------------------
CREATE TABLE dimension (
  code        text PRIMARY KEY,   -- ideologique, economique, environnementale, societale, europeenne, institutionnelle
  label_fr    text NOT NULL,
  method_note text NOT NULL
);

CREATE TABLE party_dimension_score (
  party_id      integer REFERENCES party(id),
  election_id   integer REFERENCES election(id),
  dimension     text REFERENCES dimension(code),
  score         real NOT NULL,          -- échelle commune [-1, 1]
  ci_low        real,
  ci_high       real,
  n_issues      integer NOT NULL,       -- nombre d'enjeux renseignés (transparence)
  method_version text NOT NULL,
  computed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, election_id, dimension, method_version)
);

CREATE TABLE party_similarity (
  party_a       integer REFERENCES party(id),
  party_b       integer REFERENCES party(id),
  election_a    integer REFERENCES election(id),
  election_b    integer REFERENCES election(id),
  dimension     text REFERENCES dimension(code),
  topic_id      integer REFERENCES topic(id),      -- NULL = global
  positional_sim real,
  semantic_sim   real,
  salience_sim   real,
  combined_sim   real NOT NULL,
  ci_low         real,
  ci_high        real,
  n_common_issues integer NOT NULL,
  top_agreements  jsonb,                           -- [{issue_id, explication}] pour justification
  top_divergences jsonb,
  method_version text NOT NULL,
  computed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (party_a, party_b, election_a, election_b, dimension, method_version),
  CHECK (party_a < party_b OR election_a <> election_b)
);

-- Regroupements de propositions équivalentes (accords / propositions uniques)
CREATE TABLE proposal_cluster (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    integer NOT NULL REFERENCES topic(id),
  election_id integer REFERENCES election(id),
  label_fr    text NOT NULL,
  method_version text NOT NULL
);
CREATE TABLE proposal_cluster_member (
  cluster_id  uuid REFERENCES proposal_cluster(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES proposal(id) ON DELETE CASCADE,
  PRIMARY KEY (cluster_id, proposal_id)
);

-- ---------------------------------------------------------------------
-- Gouvernance éditoriale, corrections, droit de réponse
-- ---------------------------------------------------------------------
CREATE TABLE editor (
  id     serial PRIMARY KEY,
  email  text NOT NULL UNIQUE,
  role   text NOT NULL CHECK (role IN ('annotateur','relecteur','editeur','admin')),
  declared_interests text               -- déclaration d'intérêts (adhésions, mandats) — publique si rôle éditeur
);

CREATE TABLE review_event (
  id           bigserial PRIMARY KEY,
  entity_type  text NOT NULL,
  entity_id    text NOT NULL,
  editor_id    integer REFERENCES editor(id),
  from_state   review_state,
  to_state     review_state NOT NULL,
  diff         jsonb,
  comment      text,
  at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report (                    -- signalement (public, parti, journaliste)
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  reporter_kind text NOT NULL CHECK (reporter_kind IN ('public','parti_officiel','journaliste','chercheur','interne')),
  reporter_contact text,               -- conservé 12 mois max, non publié
  reason        text NOT NULL,
  evidence_url  text,
  status        text NOT NULL DEFAULT 'ouvert' CHECK (status IN ('ouvert','en_cours','accepte','rejete')),
  resolution    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);

CREATE TABLE public_correction_log (     -- journal public des corrections
  id            bigserial PRIMARY KEY,
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  summary_fr    text NOT NULL,
  report_id     uuid REFERENCES report(id),
  published_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Assistant conversationnel : journal minimal (pas d'identifiant utilisateur)
-- ---------------------------------------------------------------------
CREATE TABLE assistant_answer_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_hash   char(64) NOT NULL,       -- empreinte, pas le texte brut par défaut
  question_text   text,                    -- conservé uniquement si l'utilisateur donne son accord (amélioration)
  answer_text     text NOT NULL,
  cited_excerpts  uuid[] NOT NULL,
  unsupported_sentences_removed integer NOT NULL DEFAULT 0,
  model           text NOT NULL,
  prompt_version  text NOT NULL,
  latency_ms      integer,
  feedback        smallint,                -- -1 / 0 / +1
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Vues utiles
-- ---------------------------------------------------------------------
-- Propositions publiables : vérifiées, non retirées, avec leur source principale
CREATE VIEW v_proposal_public AS
SELECT p.*, e.quote, e.page_start, e.time_start_ms,
       s.url, s.title AS source_title, s.tier, s.type AS source_type, s.published_at AS source_date,
       dv.external_archive_url, dv.sha256
FROM proposal p
JOIN excerpt e          ON e.id = p.primary_excerpt_id
JOIN document_version dv ON dv.id = e.document_version_id
JOIN source s           ON s.id = dv.source_id
WHERE p.review IN ('verifie','verifie_double');

-- Exemple : "Qui souhaite augmenter l'âge légal ?" — paramètre chiffré vs référence en vigueur
-- SELECT party.short_name, pip.numeric_value, pip.conditions, v.url, v.quote
-- FROM proposal_issue_position pip
-- JOIN v_proposal_public v ON v.id = pip.proposal_id
-- JOIN party ON party.id = v.party_id
-- JOIN issue i ON i.id = pip.issue_id AND i.code = 'RETRAITES.AGE_LEGAL'
-- WHERE v.election_id = :election_2027 AND pip.numeric_value > :valeur_en_vigueur;
