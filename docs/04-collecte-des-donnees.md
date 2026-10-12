# 4. Flux de collecte des données

## 4.1 Sources par niveau

### Niveau 1 — sources officielles des partis
| Source | Accès | Fréquence |
|--------|-------|-----------|
| Programmes présidentiels (PDF, sites dédiés) | Téléchargement + archivage WARC | À publication, puis surveillance quotidienne des modifications |
| Sites des partis (pages « propositions », « projet ») | Crawl ciblé, respect de robots.txt, diff de contenu | Quotidienne en campagne |
| Professions de foi (présidentielles 2002 → 2022) | Archives électorales du CEVIPOF / Sciences Po (fonds **Archelec**), publications officielles | Ingestion unique (historique) |
| Professions de foi 2027 | Publication officielle de la campagne | À publication |
| Publications officielles des partis (motions de congrès, projets, livrets thématiques) | Sites des partis, archives | Hebdomadaire |

### Niveau 2 — expression publique
| Source | Accès | Remarques |
|--------|-------|-----------|
| Discours (meetings, conventions) | Vidéos officielles des partis/candidats, transcriptions officielles si publiées | Transcription Whisper + diarisation, relecture des passages extraits |
| Interviews (presse écrite, radio, TV) | Liens vers le média ; transcription uniquement d'un court extrait cité | Droits voisins : pas de reproduction intégrale (voir [risques](10-risques-juridiques.md)) |
| Débats télévisés | Lien vers le diffuseur ; horodatage ; extraits courts | Idem |
| Communiqués de presse | Pages presse des partis, flux RSS | Quotidienne |
| Comptes officiels sur réseaux sociaux | API officielles quand disponibles, sinon saisie manuelle des messages significatifs | Seulement comptes officiels vérifiés |

### Niveau 3 — analyses et contexte
| Source | Usage |
|--------|-------|
| Presse | Contexte, détection de propositions nouvelles (signal), jamais seule base d'une proposition si une source primaire existe |
| Think tanks (orientations diverses, déclarées), instituts (OFCE, IPP, Institut Montaigne, Fondation Jean-Jaurès, Fondapol, Terra Nova, iFRAP, etc.) | Chiffrages et évaluations (`evaluation`, `cost_estimate`) — l'équilibre des orientations des évaluateurs est suivi et affiché |
| Rapports publics (Cour des comptes, Haut Conseil des finances publiques, Conseil d'orientation des retraites, France Stratégie, Conseil d'analyse économique, Haut Conseil pour le climat…) | Évaluations et contexte |
| Données parlementaires : open data de l'Assemblée nationale et du Sénat (propositions de loi, amendements, scrutins) | Propositions parlementaires significatives, cohérence votes / programmes (V2) |

### Données de contexte (fonction 5)
INSEE, DARES, DREES, DGFiP, Banque de France, Eurostat, OCDE, FMI, Banque mondiale, Agence de l'environnement (ADEME), CITEPA (émissions), RTE (électricité), Ministère de l'Intérieur (statistiques publiques), data.gouv.fr. Ingestion par API (SDMX quand disponible), avec millésime (`vintage`) pour savoir quelle donnée était disponible à quelle date.

### Données internationales (fonction 3)
- **Manifesto Project (MARPOR)** : programmes codés de nombreux pays (dont les 12 demandés) — base de comparaison standardisée.
- **Chapel Hill Expert Survey (CHES)** : positions des partis européens par dimension (gauche-droite économique, GAL-TAN, intégration européenne) — calibration.
- **ParlGov / Party Facts** : référentiels et correspondances d'identifiants de partis.
- **Comparative Agendas Project** : correspondance des thèmes.
- Programmes originaux des partis étrangers (langue d'origine), traités par embeddings multilingues ; traductions marquées comme telles.
- Vérifier la licence de chaque jeu (certains sont limités à un usage non commercial : impact sur l'API payante, voir [modèle économique](12-modele-economique.md)).

## 4.2 Pipeline (Dagster)

```
 [1] Découverte ──► [2] Capture & archivage ──► [3] Extraction du texte ──► [4] Segmentation
      │                  │                          │                          │
  sitemaps, RSS,     original S3 + WARC +       PDF : PyMuPDF + OCR         sections, paragraphes,
  veille presse,     SHA-256 ; demande          (Tesseract fra) si scan ;   tours de parole ;
  saisie manuelle,   d'archive externe ;        HTML : trafilatura ;        positions caractères /
  alertes            détection de changement    vidéo : Whisper large-v3    pages / horodatages
                     (nouvelle version)         + pyannote
                                                                                │
 [8] Publication ◄── [7] Validation humaine ◄── [6] Rapprochement ◄── [5] Extraction IA
      │                  │                          │                          │
  vues publiques,    file priorisée ;           doublons intra-parti ;      Claude Sonnet 5.5 (lots) :
  index OpenSearch,  double validation          liens inter-partis ;        propositions + statut +
  ISR front ;        des éléments sensibles ;   évolution vs élection       thèmes + enjeux + paramètres
  recalcul [9]       journal d'audit            précédente (lignée)         + coûts, en JSON strict ;
                                                                            citations exactes vérifiées
 [9] Calculs : clusters, matrices de comparaison, scores d'alignement, similarités internationales
```

### Étape 5 — extraction IA, détails

1. **Tri** (Claude Haiku 5.5) : le segment contient-il une proposition / position / critique / affirmation factuelle ? Langue ? Locuteur ?
2. **Extraction** (Claude Sonnet 5.5, API par lots à −50 %, taxonomie et consignes en cache de prompt) : sortie JSON validée par schéma strict :
   - `quote` : **copie exacte** d'un passage du segment. Contrôle automatique : la citation doit être retrouvée *littéralement* dans le texte source (après normalisation des espaces et apostrophes) ; sinon rejet.
   - `title`, `summary` neutre (consignes : pas d'adjectifs évaluatifs, reprise du vocabulaire du parti entre guillemets lorsqu'il est connoté, voir 4.4).
   - `status`, `topic_codes`, `issue_positions` (+ `numeric_value`, `conditions`), `territorial_level`, `time_horizon`, `costs` (seulement si chiffrés dans le texte).
   - `confidence` auto-évaluée + raisons.
3. **Codage MARPOR / CAP** pour la comparabilité internationale.
4. **Embeddings** BGE-M3 des extraits et propositions.

### Étape 6 — rapprochement
- Doublons : même parti, similarité cosinus > 0,90 et même enjeu → proposé comme « corroboration » (une seule proposition, plusieurs extraits).
- Évolution : appariement avec les propositions de la même lignée à l'élection précédente (voir [06](06-algorithmes-similarite.md) §6.5).
- Relations inter-partis : candidats via plus proches voisins, qualification (identique / similaire / opposé) par LLM, validation humaine pour les relations publiées.

### Étape 7 — validation humaine
- Équipe d'annotateurs formés (profil sciences politiques), charte d'annotation publique, accord inter-annotateurs mesuré (κ de Cohen ≥ 0,75 visé sur statut et enjeu).
- Priorisation : candidats officiels > autres partis ; programmes > discours ; thèmes les plus consultés ; confiance faible.
- Double validation obligatoire : évolutions (durcissement / assouplissement / changement de position), critiques, paramètres chiffrés, éléments signalés.
- Délai cible en campagne : programme d'un candidat officiel entièrement validé sous 72 h, propositions phares sous 24 h.

## 4.3 Historique 2002 → 2022

- Corpus : programmes et professions de foi des candidats à la présidentielle 2002, 2007, 2012, 2017, 2022 (fonds Archelec, archives des partis, Internet Archive, BnF — dépôt légal du web pour consultation).
- Résolution des lignées (ex. FN 2002-2017 → RN ; UMP 2007-2012 → LR ; Front de gauche 2012 → LFI 2017 ; En Marche 2017 → Renaissance ; Les Verts / EELV → Les Écologistes) : fichier [donnees-reference/partis-france.yaml](../donnees-reference/partis-france.yaml), à valider ligne à ligne par l'équipe.
- Les partis absents d'une élection (pas de candidat, soutien à un autre candidat) sont marqués comme tels : « pas de candidature propre en 2017 — soutien à X », et non « position abandonnée ».

## 4.4 Neutralité des formulations — règles de rédaction des résumés

1. Verbe descriptif (« propose », « prévoit », « s'oppose à », « critique ») ; aucun adjectif évaluatif (« ambitieux », « irréaliste », « dangereux »).
2. Les termes connotés propres à un camp sont cités entre guillemets et attribués (« ce que le parti appelle "…" »).
3. Même gabarit pour tous les partis ; longueur limitée (280 caractères).
4. Tests automatiques : lexique d'adjectifs évaluatifs, classifieur de polarité, contrôle de longueur ; tout échec renvoie en relecture.
5. Échantillonnage aléatoire mensuel relu par le comité scientifique pluraliste, résultats publiés.

## 4.5 Fraîcheur et surveillance

| Flux | Délai cible |
|------|-------------|
| Nouveau programme d'un candidat officiel | Archivé < 1 h, extrait < 6 h, validé < 72 h |
| Modification d'une page de programme | Détectée < 24 h, nouvelle version, diff affiché sur la fiche source |
| Débat télévisé majeur | Propositions nouvelles publiées (statut « non vérifié ») < 12 h, vérifiées < 48 h |
| Indicateurs statistiques | Selon calendrier des producteurs |
