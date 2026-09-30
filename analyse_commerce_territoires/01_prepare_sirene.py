"""Reconstitue, à plusieurs dates, le stock de commerces de détail en magasin actifs (Sirene),
géolocalisés en France métropolitaine.

Entrées (dans DATA_DIR) :
  - sirene_histo.parquet   : StockEtablissementHistorique (Insee, data.gouv.fr)
  - sirene_geoloc.parquet  : Géolocalisation des établissements Sirene (Insee, data.gouv.fr)
Sortie :
  - DATA_DIR/commerces.parquet : un établissement par ligne, statut actif/employeur à chaque date
"""
import os
import duckdb

DATA = os.environ.get("DATA_DIR", ".")
DATES = ["2012-01-01", "2016-01-01", "2019-01-01", "2022-01-01", "2025-01-01"]

con = duckdb.connect()
con.sql("SET threads=4")
con.sql("SET memory_limit='10GB'")
con.sql(f"CREATE VIEW h AS SELECT * FROM '{DATA}/sirene_histo.parquet'")
con.sql(f"CREATE VIEW g AS SELECT * FROM '{DATA}/sirene_geoloc.parquet'")

# Commerce de détail en magasin : NAF rév. 2, groupes 47.1 à 47.7 (hors marchés 47.8 et hors magasin 47.9).
RETAIL = ("etatAdministratifEtablissement = 'A' AND nomenclatureActivitePrincipaleEtablissement = 'NAFRev2' "
          "AND substr(activitePrincipaleEtablissement, 1, 4) BETWEEN '47.1' AND '47.7'")


def covers(d):
    return f"(dateDebut IS NULL OR dateDebut <= DATE '{d}') AND (dateFin IS NULL OR dateFin >= DATE '{d}')"


cols = []
for d in DATES:
    y = d[:4]
    cols.append(f"max(CASE WHEN {covers(d)} AND {RETAIL} THEN 1 ELSE 0 END) AS r{y}")
    cols.append(f"max(CASE WHEN {covers(d)} AND {RETAIL} AND caractereEmployeurEtablissement = 'O' THEN 1 ELSE 0 END) AS e{y}")
    cols.append(f"max(CASE WHEN {covers(d)} AND {RETAIL} THEN activitePrincipaleEtablissement END) AS naf{y}")

con.sql(f"""
CREATE TABLE statut AS
SELECT siret, {', '.join(cols)}
FROM h
WHERE substr(activitePrincipaleEtablissement, 1, 2) = '47'
GROUP BY siret
""")
con.sql(f"DELETE FROM statut WHERE {' + '.join('r' + d[:4] for d in DATES)} = 0")

con.sql(f"""
COPY (
  SELECT s.*, g.x, g.y, g.qualite_xy, g.plg_qp24, g.plg_code_commune AS com
  FROM statut s JOIN g USING (siret)
  WHERE g.epsg = '2154' AND g.x IS NOT NULL
) TO '{DATA}/commerces.parquet' (FORMAT PARQUET)
""")

tot = con.sql(f"SELECT count(*) FROM statut").fetchone()[0]
geo = con.sql(f"SELECT count(*), sum(CASE WHEN qualite_xy = '33' THEN 1 ELSE 0 END) FROM '{DATA}/commerces.parquet'").fetchone()
print(f"établissements ayant été commerces de détail actifs à au moins une date : {tot:,}")
print(f"dont géolocalisés en métropole : {geo[0]:,} (position aléatoire dans la commune : {geo[1]:,})")
print(con.sql(f"SELECT {', '.join(f'sum(r{d[:4]}) AS r{d[:4]}' for d in DATES)}, "
              f"{', '.join(f'sum(e{d[:4]}) AS e{d[:4]}' for d in DATES)} FROM '{DATA}/commerces.parquet'").df().T)
