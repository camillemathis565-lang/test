# Cross-border commercial attractiveness – all French land borders

This project estimates how attractive city centres and peripheral commercial
zones are on each side of France's land borders (Belgium, Luxembourg, Germany,
Switzerland, Italy, Monaco, Spain, Andorra). It also estimates how much retail
spending crosses each border, in each direction.

It follows on from the case study `Etude_de_cas_zone_peripherique_centre_ville.docx`,
which measured how peripheral zones affect city centres within France. This
project adds the international dimension.

```
pip install -r requirements.txt
python download.py        # fetch & cache OpenStreetMap data (~1 h, once)
python run_pipeline.py    # model -> outputs/*.csv, outputs/web_data.json
python build_report.py    # outputs/report.html (interactive map + tables)
```

## Method

| Step | What | Data |
|---|---|---|
| 1. Study area | Land borders of metropolitan France; residents within **40 km**, destinations within **70 km** | Eurostat GISCO country boundaries 1:1M |
| 2. Supply | **City centres**: shops within 1,200 m (city) / 700 m (town) of the OSM place node. **Commercial zones**: clusters of `landuse=retail` / `shop=mall` polygons ≥ 5 ha outside city centres | OpenStreetMap (`shop=*`, `amenity=*`, `landuse=retail`) |
| 3. Attractiveness | Retail mass (weighted shop count) plus quality indicators: share of comparison goods, diversity (effective number of shop types), anchors (department stores, malls, supermarkets), hospitality ratio, branded share. The composite **score (0–100)** is a weighted average of percentile ranks | OSM |
| 4. Demand | Residents on a 2 km grid (aggregated from the 2021 census 1 km grid) | Eurostat GISCO grid |
| 5. Travel time | Road network (motorway → secondary), Dijkstra shortest paths, max 75 min | OSM |
| 6. Prices & budgets | Price level indices and spending per inhabitant, by segment | Eurostat `prc_ppp_ind` (2024) |
| 7. Spatial interaction | Huff model with border friction and price differentials, two segments | – |

Huff model, per segment *s* (everyday: food, alcohol, tobacco; comparison: clothing, furnishing, equipment):

```
U_ij = A_j^α · exp(−β_s · t_ij) · θ^[border crossed] · (PLI_j / PLI_i)^−γ
P_ij = U_ij / Σ_k U_ik
F_ij = population_i · spending_s(country_i) · P_ij          [EUR / year]
```

* `A_j`: segment retail mass × (0.5 + quality)
* `β`: 0.12/min for everyday goods, 0.06/min for comparison goods (comparison trips are longer)
* `θ`: border friction. 0.55 inside Schengen/EU, 0.40 for Switzerland and Andorra (customs), 0.90 for Monaco
* `γ = 2`: price elasticity on the national price-level ratio

## Outputs (`outputs/`)

| File | Content |
|---|---|
| `destinations.csv` | Every centre/zone: indicators, score, rank, modelled turnover, share from foreign residents |
| `border_balance.csv` | For each neighbour: FR→neighbour and neighbour→FR spending, net, balance index `(in − out)/(in + out)` |
| `country_pair_flows.csv` | Origin country × destination country × destination type (centre / zone) × segment |
| `nuts3_cross_border.csv` | By NUTS3 area (French départements, Belgian arrondissements, German Kreise…): share of resident spending that goes abroad, foreign spending received, net |
| `sensitivity.csv` | Border balances for 5 border-friction levels × 3 price elasticities |
| `report.html` | Interactive report: map of spending that goes abroad, border balances, rankings |

## Caveats

* **Not calibrated.** α, β, θ and γ come from typical values in the literature, not from observed flows. Treat absolute euros as orders of magnitude. The *direction* and *ranking* of flows are more robust; `sensitivity.csv` shows how they move. To calibrate, fit the parameters with a Poisson gravity regression on observed flows (for example the mobile-phone footfall data from mytraffic × FACT used in the case study, card-payment data, or shopper surveys).
* **OSM completeness varies by country.** Germany and France are mapped more thoroughly than parts of Italy or Spain, which biases retail mass. Shop counts are a proxy for floor space. Vacancy is not measured.
* **National price levels.** Local price gaps (fuel and tobacco in Luxembourg and Andorra, the Swiss franc effect in Geneva and Basel) are only captured through national indices. Fuel is not modelled.
* Only residents within 40 km of the border are modelled. Tourists, cross-border commuters shopping near their workplace, and online sales are ignored.
* One-way streets and congestion are ignored. Speeds per road class are averages.

Data © OpenStreetMap contributors (ODbL), © EuroGeographics for administrative boundaries, Eurostat.
