"""Contenus éditoriaux de l'observatoire : chiffres nationaux sourcés, politiques et dispositifs, registre v1.

Chaque chiffre porte une référence de source (S.. = registre v1, N.. = sources ajoutées en v2) et un niveau de
fiabilité : A = source primaire officielle ou statistique publique, B = source secondaire ou relayée, C = estimation.
"""
import json, os, glob

V1 = os.environ["V1DB"]
OUT = os.path.join(os.path.dirname(__file__), "..", "data")


def load(coll):
    return [json.load(open(f, encoding="utf-8")) for f in sorted(glob.glob(f"{V1}/{coll}/*.json"))]


chiffres = [{k: d.get(k, "") for k in ("id", "theme", "indicateur", "valeur", "unite", "annees", "territoire", "champ", "ref", "verification", "remarques")}
            for d in load("chiffres")]
sources = [{"ref": d["ref"], "organisme": d["organisme"], "titre": d["titre"], "date": d["date"], "lien": d["lien"], "type": d.get("type", "")}
           for d in load("sources")]
bases = [{k: d.get(k, "") for k in ("id", "nom", "producteur", "contenu", "maille", "periode", "acces", "format", "lien", "apport", "usage")}
         for d in load("bases")]

NEW_SOURCES = [
    ("N01", "OCDE", "Local Retail, Global Trends (rapport complet)", "2026", "https://www.oecd.org/en/publications/local-retail-global-trends_55e2edec-en/full-report.html", "Organisation internationale"),
    ("N02", "Commission européenne (CCR / Eurostat)", "SME Performance Review 2025", "2025", "https://single-market-economy.ec.europa.eu/smes/sme-strategy-and-sme-friendly-business-conditions/sme-performance-review_en", "Organisation internationale"),
    ("N03", "OCDE", "Going Digital Toolkit et base ICT Access and Usage by Businesses", "2026", "https://goingdigital.oecd.org/datakitchen/#/cover/1/toolkit/indicator/explore/en", "Organisation internationale"),
    ("N04", "OCDE", "Air Emissions Accounts", "2026", "https://www.oecd.org/en/data/datasets/air-emissions-accounts.html", "Organisation internationale"),
    ("N05", "DGE, France Num", "Baromètre France Num 2026 : quatre TPE PME sur dix utilisent l'IA", "28/09/2026", "https://presse.economie.gouv.fr/barometre-france-num-2026-quatre-tpe-pme-sur-dix-utilisent-desormais-lintelligence-artificielle/", "Administration / opérateur public"),
    ("N06", "Insee (Ast D., Bichler G.)", "En 2024, les achats de l'autre côté de la frontière représentent jusqu'à 14 % des dépenses des résidents frontaliers, Insee Première n° 2075", "02/10/2025", "https://www.insee.fr/fr/statistiques/8647092", "Statistique publique"),
    ("N07", "Insee", "Les résidents frontaliers ajustent fortement leurs achats de carburant en Allemagne à l'écart de prix avec la France, Insee Analyses n° 97", "2024", "https://www.insee.fr/fr/statistiques/8236361", "Statistique publique"),
    ("N08", "Insee", "Un travailleur frontalier sur cinq parcourt plus de 50 km pour aller travailler, Insee Première n° 2027", "11/2024", "https://www.insee.fr/fr/statistiques/8292201", "Statistique publique"),
    ("N09", "Addictions France, d'après Santé publique France et OFDT (étude du 31/05/2024)", "Décryptage n° 58 : achats transfrontaliers de tabac", "05/2024", "https://addictions-france.org/datafolder/uploads/2024/05/Decryptage-N%C2%B058-Une-etude-detonante.pdf", "Source secondaire"),
    ("N10", "Cerema, Portail national de l'artificialisation", "Consommation d'espaces naturels, agricoles et forestiers 2011-2025 (fichier communal)", "24/07/2026", "https://www.data.gouv.fr/datasets/6a01b9280dd2d45907e5fc61", "Données ouvertes"),
    ("N11", "ANCT", "Programme Petites villes de demain : liste des communes bénéficiaires (COG 2026)", "19/08/2026", "https://www.data.gouv.fr/fr/datasets/programme-petites-villes-de-demain/", "Données ouvertes"),
    ("N12", "Caisse des Dépôts", "Action Cœur de Ville : liste des communes", "2024", "https://opendata.caissedesdepots.fr/", "Données ouvertes"),
    ("N13", "Insee", "Populations légales 2023 (fichier d'ensemble)", "18/12/2025", "https://www.insee.fr/fr/statistiques/8680726", "Statistique publique"),
    ("N14", "Insee", "Séries historiques de population (1876 à 2023)", "12/2025", "https://www.insee.fr/fr/statistiques/3698339", "Statistique publique"),
    ("N15", "IGN", "ADMIN EXPRESS (contours et chefs-lieux des communes)", "2024", "https://geoservices.ign.fr/adminexpress", "Données ouvertes"),
    ("N16", "ANCT", "Quartiers prioritaires de la politique de la ville 2024 (périmètres)", "2024", "https://www.data.gouv.fr/fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/", "Données ouvertes"),
    ("N17", "Ministère de la Transition écologique", "Dispositif éco énergie tertiaire (décret tertiaire)", "2024", "https://www.ecologie.gouv.fr/politiques-publiques/dispositif-eco-energie-tertiaire", "Administration / opérateur public"),
    ("N18", "Bpifrance", "Prêt Action Climat et plan Climat 2026", "03/2026", "https://www.bpifrance.fr/catalogue-offres/pret-action-climat", "Administration / opérateur public"),
    ("N19", "Bpifrance", "Lancement du plan « Osez l'IA »", "07/2025", "https://presse.bpifrance.fr/lancement-du-plan-osez-lia", "Administration / opérateur public"),
    ("N20", "ESPON", "CROSSSHOP : cross-border shopping in the French-German border region", "2025-2027", "https://www.espon.eu/projects/crossshop-cross-border-shopping-french-german-border-region", "Organisation internationale"),
    ("N21", "Conseil national du commerce (Mayer E., Petiot Y.)", "Commerce français : accélérer la transition circulaire", "01/2026", "https://www.entreprises.gouv.fr/files/files/Publications/2026/rapports/rapport-cnc-accelerer-commerce-circulaire.pdf", "Administration / opérateur public"),
    ("N22", "Sénat", "Face à la décommercialisation, réinventer le commerce physique (rapport d'information)", "2026", "https://www.senat.fr/rap/r25-821/r25-82123.html", "Parlement"),
    ("N23", "CRÉDOC (Lehuédé F. et al.)", "Ultra-fast commerce : des acheteurs conscients des enjeux environnementaux mais happés par les stratégies marketing", "11/2025", "https://www.credoc.fr/publications/ultra-fast-commerce-des-acheteurs-conscients-des-enjeux-environnementaux-mais-happes-par-les-strategies-marketing", "Recherche"),
    ("N24", "Mission opérationnelle transfrontalière", "Rapport d'activité 2025", "05/2026", "https://www.espaces-transfrontaliers.org/wp-content/uploads/2026/05/MOT_rapport_activite_2025.pdf", "Administration / opérateur public"),
    ("N25", "Codata et FACT", "Baromètre de l'offre commerciale dans les centres-villes 2026", "2026", "https://8646969.fs1.hubspotusercontent-na1.net/hubfs/8646969/CODATA/Codata-Barom%C3%A8tre-offre-commerciale-dans-les-centres-villes-2026.pdf", "Source privée"),
    ("N26", "Banque des Territoires", "Les foncières de redynamisation", "2025", "https://www.banquedesterritoires.fr/foncieres-de-redynamisation", "Administration / opérateur public"),
    ("N27", "Commission européenne", "Taux de TVA appliqués dans les États membres", "2025", "https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/vat-rates_en", "Organisation internationale"),
    ("N28", "Administration fédérale des contributions (Suisse)", "Taux de TVA en vigueur depuis le 1er janvier 2024", "2024", "https://www.estv.admin.ch/estv/fr/accueil/mehrwertsteuer/mwst-steuersaetze.html", "Administration étrangère"),
    ("N29", "Insee", "Base Sirene des entreprises et de leurs établissements (stock, historique, géolocalisation)", "09/2026", "https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/", "Données ouvertes"),
    ("N31", "ANCT", "Atlas national Action cœur de ville, T4 2025", "10/2026", "https://media.anct.gouv.fr/ressources/2026-10/atlas-national-acv-t4-2025_0.pdf", "Administration / opérateur public"),
    ("N32", "IHK Südlicher Oberrhein et CCI Alsace Eurométropole", "Business Twin : Unternehmenspartnerschaften am Oberrhein (Interreg Rhin supérieur)", "s.d.", "https://www.ihk.de/freiburg/unternehmen-beraten/international/frankreich/interreg-oberrhein/business-twin-unternehmenspartnerschaften-am-oberrhein-6812532", "Chambre consulaire"),
    ("N30", "Cerema", "Inventaire des zones d'activités économiques (polygones « commerce »)", "2023", "https://www.cerema.fr/fr/actualites/donnees-geolocalisation-1500-zones-commerciales-peripherie", "Données ouvertes"),
]
sources += [{"ref": r, "organisme": o, "titre": t, "date": d, "lien": l, "type": ty} for r, o, t, d, l, ty in NEW_SOURCES]

NEW_BASES = [
    ("B28", "Consommation d'espaces NAF 2011-2025 (CONSOENAF)", "Cerema", "Hectares consommés chaque année par commune et par destination (habitat, activité, mixte, routes, fer)", "Commune", "2011-2024", "Ouverte", "CSV, GeoPackage", "https://www.data.gouv.fr/datasets/6a01b9280dd2d45907e5fc61", "Artificialisation liée aux activités économiques", "Utilisée dans l'observatoire (axes 3 et 5)"),
    ("B29", "Petites villes de demain : liste des communes", "ANCT", "1 642 communes bénéficiaires et date de signature", "Commune", "2020-2026", "Ouverte", "CSV", "https://www.data.gouv.fr/fr/datasets/programme-petites-villes-de-demain/", "Comparer communes PVD et autres", "Utilisée dans l'observatoire"),
    ("B30", "Achats transfrontaliers par carte bancaire (Insee Première n° 2075)", "Insee, Crédit Mutuel Alliance Fédérale", "Part des dépenses en magasin réalisées dans un pays voisin, par département ; profils par pays", "Département, pays", "2024", "Ouverte (données des figures)", "XLSX", "https://www.insee.fr/fr/statistiques/8647092", "Seule mesure nationale des achats transfrontaliers", "Utilisée dans l'observatoire (axe 4)"),
    ("B31", "Populations légales 2023 et séries historiques", "Insee", "Population municipale par commune", "Commune", "1876-2023", "Ouverte", "CSV, XLSX", "https://www.insee.fr/fr/statistiques/8680726", "Densités commerciales, évolutions démographiques", "Utilisée dans l'observatoire"),
    ("B32", "Baromètre France Num", "DGE, CRÉDOC", "Usage du numérique et de l'IA par les TPE et PME (plus de 9 000 répondants)", "France, taille, secteur", "Annuel depuis 2020", "Résultats publiés ; pas de microdonnées ouvertes", "PDF, datavisualisation", "https://www.francenum.gouv.fr/", "Maturité numérique des TPE et PME", "Chiffres nationaux dans l'axe 2"),
    ("B33", "ICT Access and Usage by Businesses", "OCDE", "Indicateurs de numérisation par secteur (entreprises de 10 salariés et plus)", "Pays, secteur", "2009-2025", "Ouverte", "SDMX, CSV", "https://goingdigital.oecd.org/datakitchen/#/cover/1/toolkit/indicator/explore/en", "Comparaison France / UE-27", "Chiffres nationaux dans l'axe 2"),
]
bases += [dict(zip(("id", "nom", "producteur", "contenu", "maille", "periode", "acces", "format", "lien", "apport", "usage"), b)) for b in NEW_BASES]

# ----------------------------------------------------------------------------- chiffres nationaux par axe
def F(axe, ind, val, unit, annee, ref, fiab="A", champ="", comp=None):
    return {"axe": axe, "indicateur": ind, "valeur": val, "unite": unit, "annee": annee, "ref": ref, "fiabilite": fiab, "champ": champ, "comparaison": comp}

NAT = [
    F(1, "Part des micro-entreprises parmi les détaillants", 95.2, "%", "2024", "N02", comp={"UE-27": 93.9}),
    F(1, "Part de la valeur ajoutée du commerce de détail réalisée par les grandes entreprises", 58, "%", "2024", "N02", comp={"UE-27": 40}),
    F(1, "Part de l'emploi du commerce de détail dans les PME", 54, "%", "2024", "N02", comp={"UE-27": 64}),
    F(1, "Évolution de la valeur ajoutée réelle des grands détaillants", 37, "%", "2008-2024", "N02"),
    F(1, "Évolution de la valeur ajoutée réelle des micro-détaillants", -24, "%", "2008-2024", "N02"),
    F(1, "Évolution de la productivité du travail des micro-détaillants", -23, "%", "2008-2024", "N02"),
    F(1, "Part des dépenses en magasin réalisées en périphérie", 72, "%", "2024", "S13", "B", "Rexecode d'après Insee, Procos et Fevad", {"centres-villes": 15}),
    F(1, "Croissance annuelle de l'emploi salarié des points de vente, pôles périphériques", 1.6, "% par an", "2016-2022", "S07", comp={"pôles de centre-ville": 1.1}),
    F(1, "Taille moyenne d'un point de vente en périphérie", 586, "m²", "2022", "S07", comp={"centre-ville": 92}),
    F(2, "Détaillants (10 salariés et plus) dont le site web permet de commander", 42, "%", "2025", "N03", "A", "Ordre de grandeur 40 à 45 %, France et UE-27 comparables", {"2009": 20}),
    F(2, "Entreprises utilisant l'IA (10 salariés et plus, toutes activités)", 18.2, "%", "2025", "N03", comp={"UE-27": 19.9, "France 2020": 4.8}),
    F(2, "TPE et PME utilisant l'IA", 40, "%", "2026", "N05", comp={"PME": 53}),
    F(2, "TPE et PME disposant d'au moins un outil de visibilité en ligne", 83, "%", "2026", "N05"),
    F(2, "TPE et PME tirant au moins 5 % de leurs clients d'internet", 46, "%", "2026", "N05"),
    F(2, "TPE et PME utilisant leurs données pour piloter l'activité", 76, "%", "2026", "N05"),
    F(2, "TPE et PME ayant subi un incident de cybersécurité dans l'année", 39, "%", "2026", "N05"),
    F(2, "TPE et PME ayant au moins une mesure de protection informatique", 84, "%", "2026", "N05"),
    F(2, "Français ayant déjà acheté sur une plateforme d'ultra-fast commerce", 30, "%", "2025", "N23", "A", "Environ trois sur dix"),
    F(3, "Évolution des émissions de gaz à effet de serre du commerce de détail", -56, "%", "2008-2024", "N04", "A", "1er rang de l'UE-27"),
    F(3, "Objectif de réduction de la consommation d'énergie des bâtiments tertiaires de plus de 1 000 m²", -40, "%", "2030", "N17", "A", "Puis -50 % en 2040 et -60 % en 2050"),
    F(3, "Consommation d'espaces naturels, agricoles et forestiers (tous usages)", 15119, "ha", "2024", "N10", "A", "Plus bas niveau depuis 2011"),
    F(3, "Surfaces commerciales autorisées en CDAC", 0.47, "M m²", "2024", "S10", comp={"2019": 1.3}),
    F(4, "Travailleurs frontaliers résidant en France métropolitaine", 465000, "personnes", "2021", "N08", comp={"Suisse": 224000, "Luxembourg": 105000, "Allemagne": 50000, "Belgique": 46000, "Monaco": 33000}),
    F(4, "Distance domicile-travail moyenne des frontaliers", 34, "km", "2021", "N08", comp={"non-frontaliers": 14}),
    F(4, "Part maximale des dépenses en magasin réalisées à l'étranger (Moselle)", 13.9, "%", "2024", "N06"),
    F(4, "Ménages des départements frontaliers ayant acheté en magasin à l'étranger", 50, "%", "2024", "N06", "A", "Plus d'un ménage sur deux"),
    F(4, "Part des fumeurs des départements frontaliers ayant acheté leur dernier paquet à l'étranger", 42, "%", "2024", "N09", "B", "", {"autres départements": 7}),
    F(4, "Baisse des ventes des buralistes depuis 2017, départements frontaliers", -33.2, "%", "2017-2022", "N09", "B", "", {"autres départements": -24.6}),
    F(4, "Part des achats de carburant des ménages frontaliers réalisés en Allemagne", 8, "%", "2021", "N07", "A", "Après la taxe carbone allemande (plus de 15 % fin 2020)", {"fin 2020": 15}),
    F(5, "Zones commerciales de périphérie recensées", 1500, "zones", "2023", "S02", "A", "Environ 500 millions de m²"),
    F(5, "Vacance commerciale en périphérie", 8.4, "%", "2025", "S14", "B", "", {"2022": 6.9, "centres-villes": 11.7, "centres commerciaux": 16.8}),
    F(5, "Projets lauréats du plan de transformation des zones commerciales", 90, "projets", "2024", "S39", "A", "31,4 M€ (74 lauréats en mars, 16 en mai)"),
    F(6, "Villes du programme Action Cœur de Ville", 244, "villes", "2024", "S35", "A", "Dont 228 en métropole"),
    F(6, "Moyens annoncés pour Action Cœur de Ville", 12, "Md€", "2018-2026", "S36", "A", "5 Md€ en 2018-2022 puis 7 Md€ en 2023-2026"),
    F(6, "Vacance commerciale moyenne des communes Action Cœur de Ville", 14.5, "%", "2025", "N31", "A"),
    F(7, "Quartiers prioritaires de la politique de la ville (Hexagone)", 1362, "quartiers", "2024", "N16", "A", "Périmètres 2024"),
]

POLITIQUES = [
    # nom, axe(s), échelon, type, porteur, période, moyens, description, source
    ("Action Cœur de Ville", [6, 1], "National", "Programme territorial", "ANCT, Banque des Territoires, Action Logement, Anah", "2018-2026", "5 Md€ (2018-2022) puis 7 Md€ (2023-2026)", "Revitalisation des centres de 244 villes moyennes : logement, commerce, mobilité, espaces publics, services.", "S35"),
    ("Petites villes de demain", [6, 1], "National", "Programme territorial", "ANCT", "2020-2026, prolongé", "Ingénierie et cofinancements", "Revitalisation de 1 642 communes de moins de 20 000 habitants exerçant des fonctions de centralité.", "N11"),
    ("Plan de transformation des zones commerciales", [5, 3], "National", "Appel à projets", "DGE, ANCT, DGALN", "2023-2027", "31,4 M€ pour 90 projets", "Études, ingénierie et travaux pour transformer des zones commerciales de périphérie (logement, mixité).", "S39"),
    ("Foncières de redynamisation", [6, 7], "National", "Investissement", "Banque des Territoires", "Depuis 2020", "93 foncières au capital de la Banque des Territoires", "Rachat, rénovation et remise sur le marché de locaux commerciaux vacants en centre-ville et en QPV.", "N26"),
    ("Objectif zéro artificialisation nette (loi Climat et résilience)", [3, 5], "National", "Réglementation", "État, collectivités", "2021-2050", "", "Division par deux de la consommation d'espaces 2021-2031 par rapport à 2011-2021 ; encadrement des nouvelles surfaces commerciales.", "S41"),
    ("Commissions départementales d'aménagement commercial (CDAC)", [5, 1], "Départemental", "Réglementation", "Préfectures, CNAC", "Depuis 1973 (loi Royer)", "", "Autorisation des surfaces commerciales de plus de 1 000 m² ; surfaces autorisées en baisse de 67 % entre 2019 et 2024.", "S10"),
    ("Décret tertiaire (dispositif éco énergie tertiaire)", [3], "National", "Réglementation", "Ministère de la Transition écologique, ADEME", "2019-2050", "", "Réduction de la consommation d'énergie des bâtiments tertiaires de plus de 1 000 m², dont les grandes surfaces : -40 % en 2030.", "N17"),
    ("Prêt Action Climat et prêt vert", [3, 2], "National", "Financement", "Bpifrance, Banque des Territoires", "Plan Climat 2026", "5 000 à 50 000 € sur 2 à 10 ans (prêt vert)", "Financement de la transition écologique et énergétique des TPE et PME.", "N18"),
    ("France Num", [2], "National", "Accompagnement", "DGE", "Depuis 2018", "Réseau d'Activateurs, ateliers", "Initiative pour la transformation numérique des TPE et PME ; baromètre annuel.", "N05"),
    ("Osez l'IA (France 2030)", [2], "National", "Financement et accompagnement", "DGE, SGPI, Bpifrance", "Depuis 07/2025", "Environ 200 M€", "Diagnostics Data IA cofinancés, accélérateurs IA, sensibilisation des PME.", "N19"),
    ("Mission sur l'avenir du commerce de proximité", [6, 7], "National", "Rapport et mesures", "Gouvernement", "2025-2026", "100 M€ supplémentaires en 2026 pour les foncières", "30 recommandations, neuf mesures retenues pour les centres-villes et les QPV.", "S28"),
    ("Rapport du CNC sur le commerce circulaire", [3], "National", "Rapport", "Conseil national du commerce", "01/2026", "", "Seconde main, réparation, location, consigne, vrac, invendus : recommandations pour passer à l'échelle.", "N21"),
    ("Interreg VI (2021-2027)", [4], "Union européenne", "Coopération territoriale", "Commission européenne, régions", "2021-2027", "6 programmes aux frontières françaises", "Projets transfrontaliers ; le commerce n'y est pas prioritaire.", "N24"),
    ("BRIDGEforEU", [4], "Union européenne", "Réglementation", "Commission européenne, MOT (point de coordination)", "Depuis 05/2025", "", "Levée des obstacles juridiques à la coopération transfrontalière.", "N24"),
    ("ESPON CROSSSHOP", [4], "Union européenne", "Étude", "ESPON, Région Grand Est, Euro-Institut", "12/2025-01/2027", "224 760 €", "Première étude européenne sur les achats transfrontaliers, frontière franco-allemande.", "N20"),
    ("Business Twin", [4], "Local", "Accompagnement", "CCI Alsace Eurométropole, IHK Südlicher Oberrhein (Interreg Rhin supérieur)", "En cours", "314 272 € cofinancés", "Partenariats entre PME françaises et allemandes du Rhin supérieur, sur le modèle des jumelages.", "N32"),
    ("Protocole buralistes 2023-2027", [4], "National", "Aide sectorielle", "État, Confédération des buralistes", "2023-2027", "Aide forfaitaire", "Soutien aux buralistes, notamment en zone frontalière (décrets n° 2023-507 et 2023-957).", "S45"),
    ("Politique de la ville (contrats de ville, ANRU)", [7], "National", "Programme territorial", "ANCT, ANRU", "Contrats de ville 2024-2030", "", "Renouvellement urbain et restructuration des centres commerciaux de quartier.", "S34"),
]
politiques = [dict(zip(("nom", "axes", "echelon", "type", "porteur", "periode", "moyens", "description", "ref"), p)) for p in POLITIQUES]

TVA = [  # taux normal de TVA, en %
    ("France", 20, "N27"), ("Belgique", 21, "N27"), ("Luxembourg", 17, "N27"), ("Allemagne", 19, "N27"),
    ("Suisse", 8.1, "N28"), ("Italie", 22, "N27"), ("Espagne", 21, "N27"), ("Monaco", 20, "N27"), ("Andorre", 4.5, "N27"),
]
FRONTALIERS = {"Suisse": 224000, "Luxembourg": 105000, "Allemagne": 50000, "Belgique": 46000, "Monaco": 33000, "Espagne, Italie, Andorre": 5000}

json.dump({"chiffres": chiffres, "sources": sources, "bases": bases, "national": NAT, "politiques": politiques,
           "tva": [{"pays": p, "taux": t, "ref": r} for p, t, r in TVA],
           "frontaliers": {"annee": 2021, "ref": "N08", "data": FRONTALIERS}},
          open(os.path.join(OUT, "contenus.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("contenus.json :", len(chiffres), "chiffres v1,", len(sources), "sources,", len(bases), "bases,", len(NAT), "chiffres nationaux,", len(politiques), "dispositifs")
