"""Step 1: download (and cache) all OpenStreetMap inputs."""
from cbattr import geo, overpass

if __name__ == "__main__":
    cn = geo.countries()
    areas = geo.study_areas(cn, geo.land_borders(cn))
    overpass.fetch_tiles("supply", geo.tiles(areas["supply"]))
    overpass.fetch_tiles("roads", geo.tiles(areas["network"]))
