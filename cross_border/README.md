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

## Independent shops (SMEs) vs chains

`python run_business_impact.py` (after `run_pipeline.py`) compares the actual
flows with a counterfactual where borders are closed (θ = 0). For each
destination, the difference is split between **chain** shops (OSM `brand` /
`brand:wikidata` tag, franchises included) and **independent** shops (untagged,
mostly SMEs; markets included) according to their share of the segment's
retail mass.

| File | Content |
|---|---|
| `business_impact_destinations.csv` | Per destination × ownership: turnover with closed borders, gain from foreign residents, loss of domestic residents going abroad, net, net % |
| `business_impact_by_country_type.csv` | Same, by country × centre/zone × ownership |
| `business_impact_france_nuts3.csv` | Same, by French département |
| `business_impact_sensitivity.csv` | France net by ownership for 5 border-friction levels |

Brand tagging is more complete in France (37 % of shops tagged) than in Spain
or Italy (14–16 %), so the independent share is overstated there.

## Tobacco and fuel, calibrated on the 2020 border closure

`python run_excise_calibration.py` (after `run_pipeline.py`). Tobacco and fuel
outlets are everywhere, so the choice is modelled as "buy locally" vs "make a
trip to the nearest outlet in a cheaper country":
`U_k = κ · θ_k · exp(−β·t_ik) · (p_k/p_home)^−γ`, `U_home = 1`, trips only
towards cheaper countries. Residents within 200 km of the border are included.

**Tobacco**: κ, β, γ and a Swiss friction θ_CH are fitted to the observed sales
increases during the closure of 16 March – 15 June 2020:
- by border façade (OFDT 2021, Assemblée nationale mission report n°4498), net
  of the non-border change (+2.4 %);
- national surplus of +9.5 % (INSEE Analyses n°94);
- access-time bands (INSEE) and five départements (parliamentary written
  questions).
2020 pack prices come from INSEE. Legal cigarette sales come from DGDDI.

**Fuel**: gasoline sales by département (SDES, annual) cannot identify a
closure effect. The 3-month closure is ~17 % of 2020 volume, and lockdown and
local shocks dominate: the best fit is "no border effect". Monthly
département data (CPDP, restricted access) or Luxembourg's monthly sales
(STATEC) would be needed.

Outputs: `excise_parameters.csv`, `excise_fit_tobacco.csv`, `excise_fit_fuel.csv`,
`excise_fuel_test.json`, `excise_flows.csv`, `excise_departements.csv`.

## Caveats

* **Not calibrated.** α, β, θ and γ come from typical values in the literature, not from observed flows. Treat absolute euros as orders of magnitude. The *direction* and *ranking* of flows are more robust; `sensitivity.csv` shows how they move. To calibrate, fit the parameters with a Poisson gravity regression on observed flows (for example the mobile-phone footfall data from mytraffic × FACT used in the case study, card-payment data, or shopper surveys).
* **OSM completeness varies by country.** Germany and France are mapped more thoroughly than parts of Italy or Spain, which biases retail mass. Shop counts are a proxy for floor space. Vacancy is not measured.
* **National price levels.** Local price gaps (fuel and tobacco in Luxembourg and Andorra, the Swiss franc effect in Geneva and Basel) are only captured through national indices. Fuel is not modelled.
* Only residents within 40 km of the border are modelled. Tourists, cross-border commuters shopping near their workplace, and online sales are ignored.
* One-way streets and congestion are ignored. Speeds per road class are averages.

Data © OpenStreetMap contributors (ODbL), © EuroGeographics for administrative boundaries, Eurostat.
