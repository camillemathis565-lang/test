# 10. Estimation du coût et de la complexité

Ordres de grandeur pour la planification, à affiner avec des devis. Montants hors taxes.

## 10.1 Complexité par module

| Module | Complexité technique | Complexité éditoriale / méthodologique | Commentaire |
|--------|---------------------|----------------------------------------|-------------|
| Collecte & archivage | Moyenne | Faible | Briques connues (crawl, WARC, OCR, Whisper) |
| Extraction IA + validation | Moyenne | **Élevée** | Le goulot est humain : annotation, double validation, accord inter-annotateurs |
| Taxonomie & enjeux | Faible | **Élevée** | Formulations neutres, échelles, sens de lecture : travail de comité |
| F1 Comparateur | Moyenne | Moyenne | |
| F2 Historique 2002 → 2027 | Moyenne | **Élevée** | Lignées, documents anciens scannés, qualifications sensibles |
| F3 International | **Élevée** | **Élevée** | Multilinguisme, contextes institutionnels, licences de données |
| F4 Alignement (IRT) | **Élevée** | **Élevée** | Méthode à défendre publiquement |
| F5 Contexte / fact-checking | Moyenne | **Élevée** | Choix des évaluations, équilibre |
| F6 Assistant RAG | **Élevée** | Moyenne | Vérification des citations, symétrie, garde-fous |
| Front & dataviz | Moyenne | Moyenne | Accessibilité de visualisations riches |

## 10.2 Équipe

### MVP (≈ 4 mois, octobre 2026 → janvier 2027)
| Rôle | ETP |
|------|-----|
| Direction produit / éditoriale | 1 |
| Développeurs full-stack (Next.js / FastAPI) | 2 |
| Ingénieur·e data / ML (pipeline, RAG, embeddings) | 1,5 |
| Designer produit / dataviz | 0,75 |
| DevOps / SRE (mutualisé) | 0,5 |
| Responsable méthodologie (politiste) | 1 |
| Annotateurs / vérificateurs | 4–6 (temps partiel possible) |
| Juriste (conseil externe) | forfait |
| Comité scientifique | défraiement |

### Campagne (≈ 4 mois) : équipe MVP + 4 annotateurs supplémentaires + astreinte soirs de débat.
### V2 (12 mois) : équipe resserrée (≈ 7 ETP) + 3–4 annotateurs (historique et international).

## 10.3 Budget indicatif

| Poste | MVP (4 mois) | Campagne (4 mois) | V2 (12 mois) |
|-------|-------------|-------------------|--------------|
| Masse salariale chargée (tech + produit + méthodo) | 230–300 k€ | 230–300 k€ | 550–750 k€ |
| Annotation / vérification | 60–100 k€ | 100–150 k€ | 150–220 k€ |
| Juridique, comité, audit accessibilité | 30–50 k€ | 20–30 k€ | 40–60 k€ |
| Infrastructure (cloud FR, GPU embeddings/transcription, CDN) | 10–20 k€ | 25–60 k€ | 40–80 k€ |
| API LLM (ingestion + assistant) | 3–10 k€ | 20–80 k€ | 15–40 k€ |
| Design, marque, divers | 15–30 k€ | 10–20 k€ | 20–40 k€ |
| **Total** | **≈ 350–510 k€** | **≈ 405–640 k€** | **≈ 815 k€ – 1,2 M€** |

Version « commando » (bénévolat partiel, partenariat universitaire, périmètre réduit au comparateur + assistant) : ≈ 150–250 k€ jusqu'au second tour, au prix d'une couverture plus faible et d'un risque de qualité accru.

## 10.4 Détail des coûts LLM

Tarifs publics de l'API Claude (par million de tokens, entrée / sortie) : Claude Opus 5.5 4 $ / 20 $ ; Claude Sonnet 5.5 2 $ / 10 $ ; Claude Haiku 5.5 0,10 $ / 0,50 $. Traitement par lots : −50 %. Lectures en cache de prompt nettement moins chères que l'entrée standard. Tarifs à revérifier au moment de l'engagement.

### Ingestion (traitement par lots)
| Hypothèse | Volume |
|-----------|--------|
| Programmes 2002 → 2027 France (~100 documents × ~60 k tokens) | 6 M tokens |
| Discours, interviews, communiqués campagne 2027 (~20 000 documents × ~8 k tokens) | 160 M tokens |
| Programmes étrangers (12 pays × ~6 partis × 3 élections × ~60 k) | 13 M tokens |
| **Total entrée** | **≈ 180 M tokens** |

- Tri par Claude Haiku 5.5 (lots) : 180 M × 0,05 $ ≈ **9 $**.
- Extraction par Claude Sonnet 5.5 (lots) sur ~50 % des segments retenus : 90 M tokens d'entrée × 1 $ + ~10 M tokens de sortie × 5 $ ≈ **140 $**, plus la taxonomie et les consignes en cache.
- Qualifications (relations, évolutions, clusters) et ré-extractions : ×3 de marge.
- **Ingestion totale : quelques centaines à ~2 000 $**, négligeable devant l'annotation humaine.

### Assistant (poste variable principal)
- Requête type : ~15 k tokens de contexte (extraits récupérés + consignes) + ~800 tokens de réponse + vérification.
- Claude Sonnet 5.5 : ≈ 0,03 $ (entrée) + 0,008 $ (sortie) + ≈ 0,004 $ (vérification par Haiku) ≈ **0,04 $ par question**.
- Claude Opus 5.5 pour les questions complexes (≈ 10 % du trafic) : ≈ 0,08 $ par question.
- Hypothèse campagne : 1 M de questions → **≈ 40–50 k$** sans optimisation. Avec cache de prompt sur les consignes, **cache sémantique** des questions fréquentes (les questions se concentrent sur quelques thèmes) et réponses pré-générées pour les ~500 questions les plus courantes : **≈ 15–25 k$**.
- Garde-fous de coût : quota par session, plafond budgétaire journalier avec bascule vers les réponses pré-générées et la recherche classique.

## 10.5 Infrastructure (campagne)

| Composant | Dimensionnement indicatif |
|-----------|---------------------------|
| Kubernetes (API, front SSR, workers) | 6–20 nœuds généralistes, autoscaling |
| PostgreSQL managé | 1 primaire + 2 réplicas en lecture, 16–32 vCPU |
| OpenSearch | 3 nœuds |
| GPU | 1–2 GPU de classe L4/L40S pour embeddings, reranking, Whisper (à la demande pour la transcription) |
| CDN + WAF | Essentiel : > 90 % des pages servies depuis le cache |
| Stockage objet | Quelques To (vidéos exclues : on stocke l'audio et les liens) |
