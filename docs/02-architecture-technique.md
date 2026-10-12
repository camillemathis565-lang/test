# 2. Architecture technique

## 2.1 Vue d'ensemble
```
                         ┌───────────── Front (Next.js, SSR/ISR, CDN) ─────────────┐
                         │ Comparateur · Historique · International · Assistant    │
                         └───────────────────────────┬──────────────────────────────┘
                                                     │ HTTPS (REST + SSE)
                                           ┌─────────▼─────────┐
                                           │ API Gateway / BFF │  auth, quotas, cache
                                           └─┬──────┬──────┬───┘
            ┌────────────────────────────────┘      │      └─────────────────────┐
   ┌────────▼────────┐  ┌──────────────────────┐  ┌─▼───────────────┐   ┌────────▼────────┐
   │ Service Catalogue│  │ Service Comparaison  │  │ Service Assistant│   │ Service Recherche│
   │ (propositions,   │  │ (clusters, accords,  │  │ (RAG, citations, │   │ (OpenSearch BM25 │
   │ entités, taxo)   │  │ scores, alignement)  │  │ garde-fous)      │   │ + vecteurs)      │
   └────────┬─────────┘  └──────────┬───────────┘  └────────┬─────────┘   └────────┬────────┘
            └──────────────┬────────┴───────────────────────┴──────────────────────┘
                 ┌─────────▼──────────┐   ┌───────────────┐   ┌──────────────────────┐
                 │ PostgreSQL 16 +    │   │ Object storage│   │ Redis (cache, files) │
                 │ pgvector + PostGIS?│   │ (S3 UE, WORM) │   └──────────────────────┘
                 └─────────▲──────────┘   └──────▲────────┘
                           │                     │
 ┌─────────────────────────┴─────────────────────┴───────────────────────────────────┐
 │ PIPELINE DE DONNÉES (Dagster/Temporal) : Collecte → Archivage → Extraction texte → │
 │ Segmentation → Détection de propositions (LLM) → Normalisation → Classification →  │
 │ Embeddings → Déduplication/clustering → Validation humaine → Publication           │
 └───────────────────────────────────────────────────────────────────────────────────┘
 Back-office : file de relecture, gestion sources, rectifications, journal d'audit.
```

## 2.2 Choix technologiques

| Couche | Choix | Justification | Alternative |
|---|---|---|---|
| Front | **Next.js (React, TypeScript)**, Tailwind, **Observable Plot / D3** (viz), **MapLibre** (carte), **Visx** | SSR/SEO, perf, écosystème viz | SvelteKit |
| BFF/API | **FastAPI (Python)** pour services data/IA ; **tRPC/Next route handlers** pour BFF | Python = écosystème NLP | NestJS |
| BDD principale | **PostgreSQL 16 + pgvector + pg_trgm + ltree** | Un seul moteur transactionnel + vecteurs + taxonomie hiérarchique ; simplicité opérationnelle | Qdrant dédié (si > ~10 M vecteurs) |
| Recherche | **OpenSearch** (BM25, filtres, surlignage de citation exacte) + hybride avec pgvector | Recherche textuelle exacte indispensable aux journalistes | Meilisearch/Typesense (MVP) |
| Stockage documents | **S3 compatible UE** (Scaleway/OVH/Outscale), versionnement, **Object Lock (WORM)** | Preuve d'intégrité, archivage immuable | |
| Orchestration | **Dagster** (assets, lineage) ; Temporal pour les workflows longs si besoin | Traçabilité des données | Airflow |
| Collecte | Scrapy + Playwright, yt-dlp (vidéo), flux RSS, API Assemblée/Sénat, API Légifrance/PISTE, API Data.gouv | Couverture | |
| Extraction | PyMuPDF + **Docling/Unstructured** + OCR (Tesseract/PaddleOCR) ; **Whisper large-v3 / API STT** + diarisation (pyannote) | PDF scannés, discours, débats | |
| LLM | Modèles Claude via API (UE si possible) pour extraction/résumé/Q&R ; **modèle open-weights auto-hébergé** (Mistral/Llama) pour tâches volumineuses à faible risque | Qualité + coût + souveraineté ; abstraction `LLMProvider` | |
| Embeddings | **multilingual-e5-large / bge-m3** (auto-hébergés, GPU) | Multilingue FR/EN/DE/ES/IT/NL/SV/DA/JA/KO, pas d'envoi de données | API d'embeddings |
| Reranking | bge-reranker-v2-m3 | Précision du RAG | |
| Observabilité | OpenTelemetry, Grafana/Prometheus/Loki, Sentry, **Langfuse** (traces LLM) | | |
| Infra | **Kubernetes (Scaleway Kapsule / OVH) ou Fly/Render au MVP**, Terraform, GitHub Actions, CDN Cloudflare/Bunny (UE) | Souveraineté données | |
| Auth | Anonyme pour lecture ; comptes (OIDC) pour alertes/API ; SSO back-office | | |

Principe : **monolithe modulaire** (Python + Next) au MVP ; extraction en services seulement si la charge l'impose.

## 2.3 Stockage des documents et preuve
Chaque document capturé produit un enregistrement `document_version` :
- fichier brut (PDF/HTML/vidéo/audio) en WORM ; **SHA-256** ; date/heure de capture ; en-têtes HTTP ; capture WARC (via `warcio`) ;
- soumission automatique à **Internet Archive / archive.org** et horodatage RFC 3161 pour valeur probante ;
- texte extrait + carte de coordonnées (page, bbox, timecode) pour retrouver l'extrait ;
- version suivante si le contenu change (le site d'un parti est modifié) : on ne remplace jamais.

## 2.4 Flux de collecte (livrable 4)

1. **Registre des sources** (`source_registry`) : par entité, liste de sites officiels, chaînes YouTube, comptes, flux RSS, pages « programme », dépôt des professions de foi (CNCCEP/préfectures), JO, `assemblee-nationale.fr` (propositions de loi, amendements), `senat.fr`, `elysee.fr` pour discours institutionnels, `vie-publique.fr`, `ina.fr` (débats), `legifrance`.
2. **Planification** : fréquences par niveau (N1 : quotidien ; N2 : toutes les 2-6 h en campagne ; N3 : quotidien) + détection de changement (ETag/hash).
3. **Capture & archivage** (§2.3), vérification de robots.txt/CGU, limitation de débit.
4. **Extraction** : texte, locuteurs, timecodes, métadonnées (auteur, date de publication vs date de capture).
5. **Segmentation** : paragraphes/phrases avec fenêtre de contexte ; attribution du locuteur ; filtre « propos rapportés » (une citation par un journaliste ≠ position du candidat).
6. **Détection de propositions** (LLM, sortie JSON contrainte par schéma) : *extrait exact obligatoire* ; la citation est **vérifiée par correspondance exacte (ou fuzzy ≥ 0,98) contre le texte source** — sinon rejet automatique (anti-hallucination).
7. **Normalisation** : résumé ≤ 35 mots, thème/sous-thème (classifieur + LLM), statut, niveau territorial, horizon, coût (extraction de montants + devise + année), entités nommées (lois, institutions).
8. **Déduplication** : même proposition répétée (discours, tract, interview) → `proposition_group` avec première occurrence et occurrences ultérieures (utile pour la chronologie).
9. **Contrôle qualité** : score de confiance ; <0,8 → relecture obligatoire ; échantillon aléatoire de 10 % du reste ; N1 → double lecture.
10. **Publication** : statut `published`, indexation, recalcul incrémental des clusters/comparaisons ; journal d'audit.
11. **Veille** : alertes de changement (nouvelle version d'un programme, contradiction détectée entre deux déclarations).

Historique 2002-2022 : chargement initial **semi-manuel** (programmes déjà publiés : sites des partis, archives, Sciences Po CEVIPOF/Manifesto Project, BnF/Gallica, Archive.org) ; les mêmes pipelines puis revue humaine renforcée.

Corpus étranger : Manifesto Project API (codage CMP), programmes officiels des partis, ParlGov, CHES ; traduction **non** utilisée comme citation : la citation reste en langue originale + traduction étiquetée « traduction automatique ».

## 2.5 RAG politique

- **Index** : chaque `proposition` et chaque `passage` de document est un chunk (≈ 200-400 tokens) avec métadonnées filtrables (entité, date, thème, niveau de source, type de document, pays).
- **Récupération hybride** : BM25 + vecteurs → fusion RRF → reranker → top-k ; **récupération par entité** pour garantir la symétrie (k équilibré entre candidats cités ou entre tous les partis du périmètre — « équité de rappel »).
- **Routage de requête** : classification (question factuelle / comparaison / historique / international / hors périmètre) → outils : `search_propositions`, `compare(theme, entities)`, `timeline(entity, theme)`, `nearest_international(entity, theme)`, `get_stats(indicator)`. L'assistant **n'invente pas** : il compose des appels à ces outils.
- **Génération avec citations obligatoires** : la réponse est produite en JSON `[{phrase, citation_ids[]}]` ; un vérificateur rejette toute phrase sans id ou dont l'id n'étaie pas la phrase (contrôle d'entailment NLI + similarité). Phrase non étayée → supprimée ; si plus rien → « Je n'ai pas trouvé de source ».
- **Garde-fous** : pas de recommandation de vote, pas de jugement de valeur, pas de prédiction électorale, anti prompt-injection (les documents sont des données, jamais des instructions), journalisation, red-teaming avant mise en ligne.
- **Cache sémantique** des questions fréquentes (réponses validées éditorialement).

## 2.6 Moteur d'analyse sémantique
Pipeline NLP : embeddings, NER (organisations, lois, montants), classification de thème (hiérarchique), détection de **position** (pour/contre/neutre sur une « question de référence » du thème), détection de **modalité** (promesse vs objectif vs critique), extraction de quantités (âge 64→62, 35h→32h, +X Md€). Un référentiel de **questions de référence** (« Faut-il relever l'âge légal de départ à la retraite ? ») sert de colonne vertébrale du comparateur.

## 2.7 Système de citations
Objet `citation` : `{id, proposition_id, document_version_id, quote_text, char_start, char_end, page, bbox, timecode_start/end, speaker, url, archive_url, sha256, captured_at, published_at, author}`. Permalien `/c/{id}` ; copie en un clic avec format (APA, MLA, Chicago, BibTeX, format presse) ; surlignage de l'extrait dans le PDF ou lecture vidéo au timecode.

## 2.8 Montée en charge (livrable 12)
Profil : trafic **très concentré** (débats, soirée électorale, pics ×50-100), contenu **majoritairement statique/cachable**.
- **Palier 1 (MVP, ≤ 50 k visiteurs/jour)** : 1 cluster modeste, Postgres managé avec réplique, CDN agressif.
- **Palier 2 (≤ 500 k/jour)** : pages ISR + cache edge (stale-while-revalidate), réplicas de lecture, Redis, pré-calcul de tous les comparatifs « paires de candidats × thèmes » (nombre borné : ~15 candidats → 105 paires × ~25 thèmes).
- **Palier 3 (pics 5-10 M requêtes/h)** : site servi quasi intégralement depuis le CDN/statique ; API en lecture seule dégradable ; **assistant protégé** (file d'attente, quotas par IP/session, bascule vers réponses mises en cache, mode « citations seules » en cas de saturation) ; budgets LLM plafonnés avec coupure automatique.
- Pipelines d'ingestion **découplés** du service lecture ; gel des modifications de schéma 3 semaines avant le scrutin ; tests de charge (k6) ; plan de reprise (RPO 15 min, RTO 1 h) ; dossier de résilience DDoS (WAF, rate-limit).
- Coûts IA maîtrisés : modèles légers pour tri/classification, gros modèle pour extraction validée et réponses finales ; mise en cache des prompts ; batch asynchrone pour la collecte.
