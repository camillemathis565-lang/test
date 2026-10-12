# 12. Stratégie de montée en charge

## 12.1 Profil de trafic attendu

- Trafic très **saisonnier et en pics** : faible hors campagne, fort de février à avril 2027, pics ×20 à ×50 pendant et après les débats télévisés, le soir de la publication de la liste officielle et dans les jours précédant chaque tour.
- Lecture largement majoritaire (> 99 % des requêtes) ; écritures réservées au back-office et aux signalements.
- Hypothèse de dimensionnement : 50 000 utilisateurs simultanés en pic, 3 000 requêtes/s sur le front, 200 questions/s sur l'assistant.

## 12.2 Principes

1. **Tout ce qui peut être statique l'est** : pages parti, proposition, thème, comparaisons pré-calculées des candidats officiels → générées (ISR) et servies par le CDN. Revalidation ciblée par webhook à chaque publication éditoriale.
2. **Les calculs coûteux sont faits en amont** : matrices, clusters, scores, réseaux recalculés en lots par Dagster et stockés ; l'API lit des résultats.
3. **Séparation lecture/écriture** : réplicas PostgreSQL en lecture pour l'API publique ; primaire réservé au pipeline et au back-office.
4. **Dégradation gracieuse** : si l'assistant est saturé ou si le budget LLM journalier est atteint → réponses pré-générées pour les questions fréquentes, puis bascule vers la recherche classique avec un message clair. Le comparateur et les fiches ne dépendent jamais du LLM.
5. **Isolation** : l'assistant tourne dans un service et un pool de nœuds dédiés, avec files d'attente ; une saturation ne touche pas le reste du site.

## 12.3 Mesures par couche

| Couche | Mesures |
|--------|---------|
| CDN / WAF | Cache HTML et JSON (TTL court + stale-while-revalidate), protection anti-bots et anti-DDoS, limitation de débit par IP |
| Front Next.js | ISR, streaming SSR, images optimisées, bundle JS minimal sur les pages de lecture, dataviz chargées à la demande |
| API | Stateless, autoscaling horizontal (HPA sur CPU et latence), cache Redis des réponses de comparaison (clé = thème + partis triés + élection + version des données) |
| Base de données | PgBouncer, réplicas en lecture, index adaptés (HNSW pour vecteurs, GIN/GiST), vues matérialisées rafraîchies à la publication |
| Recherche | OpenSearch 3 nœuds → 6 en campagne, réplicas d'index |
| Assistant | Cache sémantique (questions proches → réponse en cache si les données n'ont pas changé), pré-génération des ~500 questions les plus fréquentes après chaque publication, file avec priorité, quotas par session, streaming SSE |
| LLM | Plafonds de débit négociés à l'avance avec le fournisseur, répartition des modèles (Haiku pour le tri et la vérification, Sonnet par défaut, Opus pour les cas complexes), traitement par lots pour l'ingestion hors heures de pointe |
| GPU | Embeddings des requêtes en ligne sur pool GPU dédié avec autoscaling ; repli CPU (modèle plus petit) en cas de saturation |

## 12.4 Préparation des pics

- **Tests de charge** (k6) à 2× le pic estimé, un mois avant le premier débat, puis avant chaque tour.
- **Pré-chauffage** : pré-génération des pages et des réponses de l'assistant pour le thème du débat annoncé.
- **Astreinte** les soirs de débat et de résultats (tech + éditorial).
- **Runbooks** : saturation de l'assistant, panne du fournisseur LLM, incident de données, attaque.
- **Gel des déploiements** 48 h avant chaque tour (hors correctifs critiques).

## 12.5 Observabilité et objectifs de service

| Objectif | Cible |
|----------|-------|
| Disponibilité des pages de lecture | 99,95 % pendant la campagne |
| Latence p95 page en cache | < 300 ms |
| Latence p95 comparaison personnalisée | < 800 ms |
| Premier token de l'assistant (p95) | < 2,5 s |
| Délai de publication après validation éditoriale | < 5 min |

Tableaux de bord : trafic, erreurs, latence, coût LLM par heure, taux de cache, file de validation éditoriale, signalements ouverts.

## 12.6 Au-delà de 2027

Hors campagne, réduction à une infrastructure minimale (le site reste servi par le CDN). L'architecture permet d'ajouter d'autres scrutins (législatives, européennes, municipales — avec le niveau territorial déjà dans le modèle) et d'autres pays sans refonte : les partitions par élection et par pays de la base absorbent la croissance. Au-delà de ~20 M vecteurs, migration de la recherche vectorielle vers un moteur dédié (Qdrant, ou la recherche vectorielle d'OpenSearch).
