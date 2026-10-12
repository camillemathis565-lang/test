# 6. Spécifications techniques

## 6.1 Exigences fonctionnelles prioritaires (MoSCoW)
| ID | Exigence | Priorité |
|---|---|---|
| FR-01 | Toute proposition publiée a ≥ 1 citation vérifiée exacte, URL, URL archivée, date, auteur, hash | Must |
| FR-02 | Comparateur ≥ 2 entités, ≤ 8, par thème/sous-thème, filtres période/niveau de source | Must |
| FR-03 | Vues tableau et matrice ; cartes, chronologie, radar | Must / Should |
| FR-04 | Recherche plein texte exacte + sémantique, filtres, surlignage | Must |
| FR-05 | Page proposition avec permalien, contexte, historique de versions | Must |
| FR-06 | « Sujet absent » avec périmètre de recherche affiché | Must |
| FR-07 | Rectification/signalement avec journal public | Must |
| FR-08 | Export CSV/JSON/BibTeX des résultats | Should |
| FR-09 | Historique par parti 2002-2027 avec preuves | Should (MVP restreint) |
| FR-10 | Assistant avec citations systématiques et refus hors périmètre | Should (bêta MVP) |
| FR-11 | Comparaison internationale & diffusion d'une idée | Could (V2) |
| FR-12 | Scores d'alignement avec IC et explication | Could (V2) |
| FR-13 | Fact-checking sourcé sans verdict | Could (pilote MVP) |
| FR-14 | Mode silence électoral | Must |
| FR-15 | Alertes e-mail par thème/candidat | Could |

## 6.2 API publique (REST + JSON, OpenAPI 3.1)
```
GET  /v1/entities                         ?type=parti|candidat &election=2027
GET  /v1/themes                           ?version=latest  (arbre)
GET  /v1/propositions                     ?entity=&theme=&status=&from=&to=&level=&q=&cursor=
GET  /v1/propositions/{id}                (inclut citations[])
GET  /v1/citations/{id}
GET  /v1/compare                          ?theme=retraites.age_legal&entities=a,b,c&from=&to=
     → { agreements[], divergences[], unique[], absent[], coverage{} , algo_version }
GET  /v1/timeline                         ?entity=&theme=&from=2002&to=2027
GET  /v1/changes                          ?entity=&from_election=2017&to_election=2022&type=
GET  /v1/similarity                       ?entity=&dimension=global|economique|…&scope=fr|world&country=de
GET  /v1/scores                           ?entity=&as_of=
GET  /v1/evidence                         ?proposition=
POST /v1/ask                              { question, mode: "synthese"|"citations", lang }  (SSE)
POST /v1/corrections                      { proposition_id, reason, contact }
GET  /v1/datasets/export                  (versions figées, DOI)
```
Réponses : pagination par curseur, `ETag`, `Cache-Control` agressif pour les ressources publiées, `algo_version` et `taxonomy_version` dans chaque réponse dérivée, clé d'API pour > 60 req/min, licence indiquée par ressource.

Exemple `proposition` :
```json
{
  "id": "0192…", "entity": {"id":"…","name":"Parti X"}, "candidate": {"id":"…","name":"…"},
  "stated_on": "2026-11-04", "status": "mesure_detaillee",
  "theme": "travail.retraites", "subtheme": "travail.retraites.age_legal",
  "territorial_level": "national",
  "summary": {"text":"…","origin":"ia_relu","reviewed_at":"2026-11-05"},
  "cost": {"amount": 12.0, "currency":"EUR", "unit":"Md/an", "kind":"annonce_par_parti", "citation_id":"…"},
  "horizon": "quinquennat", "stance": {"question":"age_legal","value":2,"confidence":0.93},
  "citations": [{"id":"…","quote":"…","url":"…","archive_url":"…","page":12,"published_at":"…","author":"…","sha256":"…","level":"N1"}]
}
```

## 6.3 Exigences non fonctionnelles
| Domaine | Exigence |
|---|---|
| Disponibilité | 99,9 % mensuel hors maintenance ; 99,99 % la semaine des scrutins (CDN statique) |
| Performance | LCP < 2,5 s p75 ; API lecture p95 < 300 ms (cache) ; assistant premier token < 2 s p95 |
| Charge | 10 M pages vues/jour en pic ; 2 000 req/s API au CDN ; assistant 50 req/s avec file |
| Sécurité | OWASP ASVS L2, SSO + MFA back-office, secrets en coffre, WAF, rate-limit, SBOM, scans (SAST/DAST/dépendances), pentest avant bêta, journal d'audit immuable |
| Intégrité | Hash SHA-256, WORM, horodatage RFC 3161, signatures des exports |
| Confidentialité | Hébergement UE, pas de cookies tiers, analytics sans traceurs, rétention logs 12 mois max, logs de l'assistant pseudonymisés (30 jours) |
| Accessibilité | RGAA 4.1 / WCAG 2.2 AA |
| Internationalisation | i18n dès le MVP (FR), EN en V2, dates/nombres localisés |
| Observabilité | Traces, métriques, alertes d'anomalie de données (chute de collecte, dérive des scores) |
| Qualité des données | Cf. §4.10 ; seuils bloquants en CI/CD pour toute mise à jour de modèle |
| Reproductibilité | Chaque résultat dérivé rejouable à partir de (données, `algo_version`, `taxonomy_version`) |

## 6.4 Back-office
Files : `a_relire` (triées par risque), `conflits` (détection de contradictions), `rectifications`, `sources en échec`. Écran de relecture : texte source à gauche avec extrait surligné, fiche pré-remplie à droite, raccourcis clavier, diff de version, motif obligatoire si modification. Rôles : lecteur, relecteur, éditeur senior, admin données, juriste, auditeur (lecture seule). Quatre-yeux pour N1 et pour toute modification d'une proposition déjà publiée. Statistiques de relecture par relecteur et par entité (détection de biais de traitement).

## 6.5 Tests et assurance qualité
- Unitaires/intégration (pytest, vitest), contrats API (Schemathesis), e2e (Playwright), accessibilité (axe), visuels.
- Tests de non-régression des modèles sur le jeu d'or ; **tests de symétrie** : les mêmes entrées permutées entre partis doivent donner des sorties équivalentes (même structure, même longueur, même ton).
- Red-teaming de l'assistant : demandes de vote, injection via documents, questions piégées, tentatives de caricature d'un candidat, sujets sensibles.
- Charge (k6) avec scénario soirée de débat ; chaos engineering sur la BDD et le CDN.

## 6.6 Livraison continue et exploitation
Trunk-based, CI (lint, tests, scans), déploiements progressifs (canary), feature flags (assistant, F4/F5), migrations réversibles, gel des changements pendant la semaine du scrutin, astreinte 24/7 pendant les 3 semaines précédant chaque tour, runbooks (silence électoral, retrait d'une proposition contestée, bascule en mode dégradé).

## 6.7 Gouvernance de la donnée
Politique de licences par source ; catalogue des sources avec niveau, fréquence, responsable ; versionnement du dataset (SemVer + DOI) ; journal public des modifications ; politique de retrait (motifs admis : erreur de citation, source retirée par erreur, injonction judiciaire) ; politique d'archivage à long terme (dépôt à la BnF/Archive.org, dataset Zenodo).

## 6.8 Risques produit/techniques majeurs et parades
| Risque | Parade |
|---|---|
| Hallucination de citation | Vérification d'exactitude automatique + rejet |
| Résumé qui déforme | Mode « citation seule », relecture, mesure de fidélité |
| Biais perçu | Symétrie mesurable, comité pluraliste, audit, transparence |
| Retard de collecte en campagne | Priorisation N1, file d'urgence, relecteurs d'astreinte |
| Coût LLM explosif | Plafonds, cache, modèles légers/auto-hébergés |
| Attaque / pic | CDN statique, mode dégradé, WAF |
| Dépendance à un fournisseur LLM | Abstraction `LLMProvider`, évaluation multi-modèles |
| Dérive de la taxonomie | Versionnement, revue mensuelle, correspondance MARPOR/CAP |
| Changement de dates ou de candidats | Modèle `candidacy` flexible, statuts, page « candidats » pilotée par le comité |

## 6.9 Décisions à prendre rapidement
1. Forme juridique et gouvernance (association vs fondation vs société à mission).
2. Liste des critères d'entrée des candidats (déclarés, parrainages, validation du Conseil constitutionnel) — règle publique, appliquée mécaniquement.
3. Choix du fournisseur LLM/hébergement UE et contrats de non-rétention.
4. Composition du comité scientifique pluraliste.
5. Périmètre exact du MVP (10 thèmes prioritaires proposés : retraites, fiscalité, pouvoir d'achat, emploi/chômage, santé, éducation, énergie/climat, immigration, sécurité/justice, Europe/institutions).
