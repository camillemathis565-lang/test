"""Parameters of the cross-border commercial attractiveness model.

Every modelling assumption lives here so it can be changed (and cited) in one
place. Values marked "assumption" are not calibrated on observed flows; the
pipeline runs a sensitivity analysis on the most influential ones.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
CACHE = ROOT / "data" / "cache"
OUT = ROOT / "outputs"

CRS = "EPSG:3035"  # ETRS89-LAEA, metric, same as the Eurostat population grid
WGS84 = "EPSG:4326"

# --- Study area ---------------------------------------------------------------
# All land borders of metropolitan France.
NEIGHBOURS = ["BE", "LU", "DE", "CH", "IT", "MC", "ES", "AD"]
COUNTRY_NAMES = {
    "FR": "France", "BE": "Belgium", "LU": "Luxembourg", "DE": "Germany",
    "CH": "Switzerland", "IT": "Italy", "MC": "Monaco", "ES": "Spain",
    "AD": "Andorra",
}
DEMAND_BUFFER_KM = 40   # residents living within this distance of the border
SUPPLY_BUFFER_KM = 70   # shopping destinations considered (wider: avoids edge effects)
NETWORK_BUFFER_KM = 85  # road network extent
DEMAND_CELL_KM = 2      # 1 km census cells aggregated to 2 km for the O-D matrix

# Countries whose residents are missing from the Eurostat grid: population
# is placed on OSM settlement nodes instead (assumption: national totals).
GRID_MISSING_POP = {"AD": 85_000, "MC": 38_000}

# --- Data sources -------------------------------------------------------------
GISCO_COUNTRIES = ("https://gisco-services.ec.europa.eu/distribution/v2/countries/"
                   "geojson/CNTR_RG_01M_2020_4326.geojson")
GISCO_NUTS_NAMES = "https://gisco-services.ec.europa.eu/distribution/v2/nuts/csv/NUTS_AT_2024.csv"
GISCO_GRID = "https://gisco-services.ec.europa.eu/grid/grid_1km.parquet"
OVERPASS_URLS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
EUROSTAT_API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
TILE_DEG = 0.5  # Overpass query tile size

# --- Supply: city centres -----------------------------------------------------
CENTRE_PLACES = ["city", "town"]
CENTRE_RADIUS_M = {"city": 1200, "town": 700}
MIN_CENTRE_SHOPS = 15  # below this a town centre is not treated as a destination

# --- Supply: peripheral commercial zones ---------------------------------------
ZONE_MERGE_M = 150     # landuse=retail polygons closer than this form one zone
ZONE_MIN_HA = 5.0
ZONE_MIN_SHOPS = 5
ZONE_SHOP_TOLERANCE_M = 60

# --- Shop classification (OSM shop=* values) ------------------------------------
SHOP_GROUPS = {
    "everyday": {
        "supermarket", "convenience", "bakery", "butcher", "greengrocer", "deli",
        "cheese", "pastry", "confectionery", "alcohol", "beverages", "wine",
        "tobacco", "e-cigarette", "kiosk", "newsagent", "seafood", "frozen_food",
        "dairy", "farm", "coffee", "tea", "chocolate", "health_food", "spices",
        "pasta", "food", "water", "chemist", "general", "variety_store",
    },
    "personal": {
        "clothes", "shoes", "fashion_accessories", "jewelry", "watches", "bag",
        "boutique", "leather", "perfumery", "cosmetics", "optician", "sports",
        "outdoor", "fabric", "second_hand", "charity", "fashion", "baby_goods",
        "wool", "hat", "tailor",
    },
    "household": {
        "furniture", "electronics", "hardware", "doityourself", "houseware",
        "interior_decoration", "kitchen", "bed", "appliance", "computer",
        "mobile_phone", "hifi", "lighting", "garden_centre", "paint", "carpet",
        "bathroom_furnishing", "tiles", "curtain", "flooring", "electrical",
        "glaziery", "trade", "security", "window_blind", "florist",
    },
    "leisure": {
        "books", "stationery", "toys", "games", "music", "video_games", "art",
        "gift", "photo", "craft", "musical_instrument", "bicycle", "pet",
        "hobby", "anime", "collector", "model", "frame", "video", "ticket",
        "lottery", "antiques", "camera", "fishing", "hunting", "weapons",
    },
    "anchor": {"department_store", "mall"},
}
SERVICE_SHOPS = {"hairdresser", "beauty", "laundry", "dry_cleaning", "travel_agency",
                 "massage", "tattoo", "copyshop", "pawnbroker", "money_lender",
                 "rental", "repair", "hearing_aids", "medical_supply", "nutrition_supplements",
                 "car_repair", "estate_agent", "insurance", "funeral", "locksmith",
                 "shoe_repair", "telecommunication", "bookmaker", "betting", "piercing"}
COMPARISON_GROUPS = ["personal", "household", "leisure"]
EXCLUDED_SHOPS = {"vacant", "no", "yes", "car", "car_parts", "tyres", "motorcycle",
                  "fuel", "gas", "storage_rental", "funeral_directors"}
HOSPITALITY = {"restaurant", "cafe", "bar", "pub", "fast_food", "ice_cream",
               "biergarten", "cinema", "theatre"}

# Floor-space proxy weights: how much "retail mass" one OSM feature represents
# (assumption; big boxes count as several small shops).
MASS_WEIGHTS = {"everyday": 1.0, "personal": 1.5, "household": 1.5, "leisure": 1.2,
                "service": 0.4, "other": 0.5, "anchor": 20.0}
SUPERMARKET_WEIGHT = 4.0      # supermarkets sit in "everyday" but weigh more
MARKETPLACE_WEIGHT = 5.0      # amenity=marketplace

# Composite attractiveness score (0-100) = weighted percentile ranks.
SCORE_WEIGHTS = {
    "log_mass": 0.45,
    "comparison_share": 0.15,
    "diversity": 0.15,
    "anchors": 0.10,
    "hospitality_ratio": 0.10,
    "brand_share": 0.05,
}

# --- Travel times -------------------------------------------------------------
ROAD_CLASSES = {  # km/h, effective average incl. junctions (assumption)
    "motorway": 105, "motorway_link": 50, "trunk": 80, "trunk_link": 45,
    "primary": 60, "primary_link": 40, "secondary": 50, "secondary_link": 35,
}
ACCESS_SPEED_KMH = 25  # from a population cell / shop cluster to the nearest road node
MAX_TRAVEL_MIN = 75

# --- Huff model, one per spending segment ---------------------------------------
# alpha: sensitivity to destination mass; beta: distance decay per minute.
SEGMENTS = {
    "everyday": {
        "alpha": 1.0, "beta": 0.12,
        "mass": "mass_everyday",
        "eurostat_cats": ["A0101", "A0102"],   # food, alcohol & tobacco
    },
    "comparison": {
        "alpha": 1.0, "beta": 0.06,
        "mass": "mass_comparison",
        "eurostat_cats": ["A0103", "A0105"],   # clothing, furnishing & equipment
    },
}
# Border friction theta: utility multiplier applied when a trip crosses a
# national border (language, habits, customs). Assumption; see sensitivity.
BORDER_FRICTION = {"default": 0.55, "CH": 0.40, "AD": 0.40, "MC": 0.90}
SENSITIVITY_THETA_SCALE = [0.5, 0.75, 1.0, 1.25, 1.6]
# Price elasticity gamma: utility multiplied by (PLI_dest / PLI_origin)^-gamma
PRICE_GAMMA = 2.0
# Eurostat has no price levels for Andorra / Monaco (assumption, EU27=100):
# Andorra is tax-advantaged on tobacco/alcohol; Monaco is in the French
# customs & VAT area.
PRICE_OVERRIDES = {
    "AD": {"A0101": 100.0, "A0102": 62.0, "A0103": 95.0, "A0105": 98.0},
    "MC": "FR",
}
SPEND_OVERRIDES = {"AD": "ES", "MC": "FR"}  # per-capita spending proxy
# Eurostat spending follows the domestic concept: Luxembourg's alcohol/tobacco
# line (~4,000 EUR/inhabitant) mostly records purchases by non-residents, i.e.
# the very cross-border flows being modelled. Use Belgium's resident level.
SPEND_CAT_OVERRIDES = {("LU", "A0102"): "BE"}
