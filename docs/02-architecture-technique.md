# 2. Architecture technique

## 2.1 Vue d'ensemble

```
                         ┌─────────────────────────────────────────────┐
  Utilisateurs ─────────►│ CDN + WAF (cache HTML/JSON, anti-bot)       │
                         └───────────────┬─────────────────────────────┘
                                         │
                ┌────────────────────────▼─────────────────────────┐
                │ Front-end Next.js (SSR/ISR, TypeScript)          │
                │ pages comparateur, fiches, frise, carte, chat    │
                └───────┬──────────────────────────┬───────────────┘
                        │ REST/JSON (OpenAPI)      │ SSE (streaming chat)
                ┌───────▼──────────────────────────▼───────────────┐
                │ API publique (FastAPI, Python 3.12)              │
                │ ─ catalogue, recherche, comparaison, historique  │
                │ ─ assistant RAG (orchestrateur d'outils)         │
                │ ─ droit de réponse, signalements                 │
                └──┬──────────┬──────────┬───────────┬─────────────┘
                   │          │          │           │
         ┌─────────▼──┐ ┌─────▼─────┐ ┌──▼────────┐ ┌▼──────────────┐
         │ PostgreSQL │ │ OpenSearch│ │ Redis     │ │ Service LLM   │
         │ + pgvector │ │ BM25 FR   │ │ cache,    │ │ (API Claude)  │
         │ (vérité)   │ │ + facettes│ │ quotas    │ │ + embeddings  │
         └─────▲──────┘ └─────▲─────┘ └───────────┘ │ auto-hébergés │
               │              │                     └──────▲────────┘
     ┌─────────┴──────────────┴─────────────────────────────┴───────┐
     │ Plateforme de données (Dagster) : collecte → archivage →      │
     │ extraction texte → transcription → découpage → extraction IA  │
     │ → classification → rapprochement → file de validation humaine │
     │ → publication → recalcul des scores et matrices               │
     └───────────┬───────────────────────────────────┬───────────────┘
                 │                                   │
         ┌───────▼────────┐                 ┌────────▼───────────┐
         │ Stockage objet │                 │ Back-office        │
         │ S3 (originaux, │                 │ éditorial (Next.js │
         │ WARC, médias)  │                 │ + API admin)       │
         └────────────────┘                 └────────────────────┘
```

## 2.2 Choix technologiques et justification

| Couche | Choix | Pourquoi | Alternatives écartées |
|--------|-------|----------|-----------------------|
| Front-end | **Next.js 15 (App Router), React, TypeScript, Tailwind CSS** + design tokens | SSR/ISR indispensable pour le référencement (« programme RN retraites ») et la tenue en charge (pages pré-rendues servies par CDN) | SPA pure (SEO faible), Astro (moins adapté à l'interactivité riche) |
| Visualisation | **Observable Plot / D3** (tableaux, matrices, frises), **visx** pour radars, **Sigma.js + graphology** (réseaux), **MapLibre GL** (carte internationale) | Contrôle fin, sobriété « FT / OWID », accessibilité gérable | Bibliothèques de dashboard génériques (esthétique peu sobre) |
| API | **FastAPI (Python 3.12)**, Pydantic v2, OpenAPI généré | Même langage que la chaîne NLP/ML, typage, performance suffisante | Node/NestJS (double pile avec Python ML) |
| Base de vérité | **PostgreSQL 16** + extensions **pgvector** (vecteurs, index HNSW), **ltree** (taxonomie), **pg_trgm** | Une seule base transactionnelle pour données relationnelles, versions, vecteurs ; intégrité référentielle des sources | Base vectorielle séparée dès le MVP (complexité inutile sous ~10 M vecteurs) |
| Recherche plein texte | **OpenSearch** (analyseur français : élision, stemming light_french, synonymes politiques) | BM25 de qualité en français, facettes, surlignage des extraits | Recherche Postgres seule (pertinence et surlignage moindres) |
| Cache / quotas | **Redis** | Cache des comparaisons, limitation de débit du chat, cache sémantique | — |
| Orchestration données | **Dagster** | Modèle « assets » = lignage natif (quel document a produit quelle proposition), reprise sur erreur, planification | Airflow (lignage moins naturel), scripts cron |
| Stockage objet | **S3 compatible hébergé en France** (Scaleway ou OVHcloud) | Souveraineté, coûts, archivage WARC des sources | — |
| LLM | **API Claude** : Claude Sonnet 5.5 (extraction, classification, chat standard), Claude Opus 5.5 (arbitrages difficiles, questions complexes du chat, évaluation), Claude Haiku 5.5 (tri, détection de langue/pertinence en masse) ; fonction *Citations* native de l'API pour ancrer les réponses dans les documents | Qualité en français, citations natives, traitement par lots à −50 % pour l'ingestion | — |
| Embeddings | **BGE-M3** auto-hébergé (multilingue, dense + sparse) sur GPU ; **bge-reranker-v2-m3** pour le reclassement | Multilingue indispensable pour la comparaison internationale (FR/DE/EN/ES/IT/NL/SV/DA/JA/KO), maîtrise des coûts, données hors tiers | Embeddings propriétaires (dépendance, coût récurrent) |
| Transcription | **Whisper large-v3** + diarisation **pyannote** (auto-hébergés) | Discours, débats, interviews avec horodatage pour lien direct au passage | — |
| Archivage web | **Browsertrix / SingleFile** (WARC), + demande d'archivage Internet Archive | Preuve de la source même si la page est modifiée ou supprimée | — |
| Infra | **Kubernetes managé** (Scaleway Kapsule ou OVH MKS), Terraform, ArgoCD | Montée en charge élastique les soirs de débat | PaaS (moins de contrôle GPU) |
| Observabilité | OpenTelemetry, Prometheus, Grafana, Loki, Sentry | — | — |
| Analytics | **Matomo auto-hébergé** en mode exempté de consentement (configuration CNIL) | Respect RGPD sans bandeau intrusif | Google Analytics |

Hébergement : **France / UE uniquement** pour les données. Les appels à l'API Claude ne transmettent que des documents publics (programmes, discours) et les questions des utilisateurs, débarrassées d'identifiants ; ce point est documenté dans le registre RGPD.

## 2.3 Composants applicatifs

### 2.3.1 Front-end public
- Rendu statique incrémental (ISR) pour les fiches parti, proposition, thème, comparaisons pré-calculées (revalidation à chaque publication via webhook).
- Rendu dynamique uniquement pour la recherche, les comparaisons personnalisées et le chat.
- Composant `<SourceCitation>` universel : survol = extrait exact + date + type de source ; clic = fiche source avec l'extrait surligné dans le document original et lien vers l'archive.
- Accessibilité : RGAA 4.1 / WCAG 2.2 AA, chaque graphique a une alternative tabulaire.

### 2.3.2 API publique
Modules : `catalogue` (partis, candidats, élections, taxonomie), `propositions`, `sources`, `recherche`, `comparaison`, `historique`, `international`, `alignement`, `contexte`, `assistant`, `signalements`. Détail des routes dans les [spécifications](13-specifications-techniques.md).

### 2.3.3 Plateforme de données
Pipeline décrit dans [04-collecte-des-donnees.md](04-collecte-des-donnees.md).

### 2.3.4 Moteur RAG politique
```
Question ─► garde-fous (hors périmètre, demande de consigne de vote)
        ─► analyse (entités : partis, candidats, années, thèmes, pays ; intention)
        ─► planificateur (le LLM choisit les outils)
              ├─ search_proposals(query, filtres)          hybride BM25 + dense + reclassement
              ├─ get_issue_positions(issue_id, partis, élection)   SQL structuré
              ├─ get_policy_parameter(param, partis)       ex. âge légal
              ├─ compare_parties(theme, partis)            matrices pré-calculées
              ├─ get_party_evolution(parti, issue, années)
              ├─ find_international_equivalents(proposal_id | issue_id, pays)
              ├─ get_similarity_scores(parti_a, parti_b, dimension)
              └─ get_context_indicators(theme)
        ─► génération avec citations obligatoires [id d'extrait]
        ─► vérificateur : chaque phrase factuelle ↔ extrait cité (contrôle d'entailment)
              phrase non soutenue → supprimée ou reformulée ; 0 source → « je n'ai pas trouvé »
        ─► réponse streamée + panneau des sources
```
Les questions factuelles structurées (« qui veut augmenter l'âge légal ? ») passent par les outils SQL sur les paramètres validés, et non par la seule recherche sémantique : c'est ce qui garantit l'exhaustivité et l'absence d'hallucination.

### 2.3.5 Moteur de comparaison et de similarité
Calculs en lots (Dagster) après chaque publication, stockés dans des tables matérialisées ; l'API ne fait que lire. Voir [05](05-moteurs-fonctionnels.md) et [06](06-algorithmes-similarite.md).

### 2.3.6 Back-office éditorial
- File de validation (propositions extraites par l'IA, triées par priorité : candidat majeur, thème saillant, confiance faible).
- Double validation pour : changements de position, durcissement/assouplissement, critiques d'autres mesures, contenus signalés.
- Gestion des signalements et du droit de réponse, journal des corrections public.
- Gestion de la taxonomie (versionnée), des questions de politique publique, des indicateurs.

## 2.4 Sécurité

- Authentification back-office : SSO + MFA obligatoire, rôles (annotateur, relecteur, éditeur, admin).
- Journal d'audit immuable de toutes les modifications éditoriales (qui, quand, avant/après).
- Protection contre l'injection de consignes (prompt injection) : les documents sources sont traités comme données ; les sorties d'extraction sont validées par schéma strict ; aucun outil d'écriture n'est exposé à l'assistant public.
- WAF, limitation de débit, protection anti-scraping raisonnable (l'API ouverte reste la voie officielle d'accès aux données).
- Sauvegardes PostgreSQL chiffrées (PITR), réplication inter-zones, test de restauration mensuel.
- Plan de réponse à incident incluant le scénario « tentative de manipulation des données en période électorale ».
