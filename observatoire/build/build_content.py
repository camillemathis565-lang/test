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
    ("N33", "OCDE (Bianchini M., Mathis-Aide C.)", "La double transition et l'avenir des PME du commerce de détail dans les zones urbaines et rurales. Étude de cas de pays : la France (présentation à la DGE)", "2026", "", "Document de travail"),
    ("N34", "Commission européenne", "Plan pour la reprise et la résilience de la France", "2021, mis à jour", "https://commission.europa.eu/business-economy-euro/economic-recovery/recovery-and-resilience-facility/frances-recovery-and-resilience-plan_fr", "Organisation internationale"),
    ("N35", "DGE", "55 nouveaux lauréats du programme de reconquête du commerce rural au bénéfice de plus de 43 000 Français", "16/07/2024", "https://www.entreprises.gouv.fr/fr/presse/55-nouveaux-laureats-programme-reconquete-commerce-rural-benefice-43-000-francais", "Administration / opérateur public"),
    ("N36", "Ministères de l'Aménagement du territoire et de la Transition écologique", "La France dévoile sa feuille de route pour sortir des énergies fossiles", "2026", "https://www.ecologie.gouv.fr/actualites/france-devoile-sa-feuille-route-sortir-energies-fossiles", "Administration / opérateur public"),
    ("N37", "OCDE", "Financing SMEs and Entrepreneurs 2026", "2026", "https://doi.org/10.1787/075d8058-en", "Organisation internationale"),
    ("N38", "OCDE", "OECD Economic Surveys: France 2024", "2024", "https://doi.org/10.1787/bd96e2ed-en", "Organisation internationale"),
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
    F(1, "Part de la valeur ajoutée du commerce de détail réalisée par les PME", 42, "%", "2024", "N02", comp={"UE-27": 60}),
    F(1, "Part de l'emploi du commerce de détail dans les grandes entreprises", 45.6, "%", "2024", "N02", comp={"UE-27": 36.3}),
    F(1, "Écart entre part de valeur ajoutée et part de l'emploi des grands détaillants", 12, "points", "2024", "N02", comp={"UE-27": 4}),
    F(1, "Évolution de la valeur ajoutée réelle des moyennes entreprises (50 à 249 salariés)", 29.2, "%", "2008-2024", "N02", "A", "2024 : estimation du CCR", {"petites (10 à 49)": 16.8}),
    F(1, "Évolution de la productivité du travail des grands détaillants", 14, "%", "2008-2024", "N02", "A", "2024 : estimation du CCR", {"moyennes": 17.3, "petites": 6}),
    F(1, "Programme de reconquête du commerce rural : projets soutenus", 371, "projets", "03/2023-07/2024", "N35", "A", "10 M€ de subventions sur une enveloppe de 36 M€ sur trois ans"),
    F(1, "Plan national de relance et de résilience (PNRR)", 40.3, "Md€", "2021-2026", "N34", "A", "73 investissements et 24 réformes ; 40 % du plan France Relance (100 Md€)"),
    F(1, "Évolution de la valeur ajoutée réelle des grands détaillants", 37, "%", "2008-2024", "N02"),
    F(1, "Évolution de la valeur ajoutée réelle des micro-détaillants", -24, "%", "2008-2024", "N02"),
    F(1, "Évolution de la productivité du travail des micro-détaillants", -23, "%", "2008-2024", "N02"),
    F(1, "Part des dépenses en magasin réalisées en périphérie", 72, "%", "2024", "S13", "B", "Rexecode d'après Insee, Procos et Fevad", {"centres-villes": 15}),
    F(1, "Croissance annuelle de l'emploi salarié des points de vente, pôles périphériques", 1.6, "% par an", "2016-2022", "S07", comp={"pôles de centre-ville": 1.1}),
    F(1, "Taille moyenne d'un point de vente en périphérie", 586, "m²", "2022", "S07", comp={"centre-ville": 92}),
    F(2, "Détaillants (10 salariés et plus) dont le site web permet de commander", 41.5, "%", "2025", "N03", "A", "Hors ventes sur les places de marché ; hors micro-entreprises", {"UE-27": 41.6, "France 2009": 16.7}),
    F(2, "Entreprises utilisant l'IA (10 salariés et plus, toutes activités)", 18.2, "%", "2025", "N03", comp={"UE-27": 19.9, "France 2020": 4.8}),
    F(2, "Taux d'adoption de l'IA en France rapporté à celui de l'UE-27", 91, "%", "2025", "N03", "A", "Entreprises de 10 salariés et plus", {"2020": 80}),
    F(2, "Part du PNRR consacrée à la transition numérique", 21.6, "%", "2021-2026", "N33", "B", "Volet compétitivité : 4,9 Md€, dont numérisation des PME"),
    F(2, "TPE et PME utilisant l'IA", 40, "%", "2026", "N05", comp={"PME": 53}),
    F(2, "TPE et PME disposant d'au moins un outil de visibilité en ligne", 83, "%", "2026", "N05"),
    F(2, "TPE et PME tirant au moins 5 % de leurs clients d'internet", 46, "%", "2026", "N05"),
    F(2, "TPE et PME utilisant leurs données pour piloter l'activité", 76, "%", "2026", "N05"),
    F(2, "TPE et PME ayant subi un incident de cybersécurité dans l'année", 39, "%", "2026", "N05"),
    F(2, "TPE et PME ayant au moins une mesure de protection informatique", 84, "%", "2026", "N05"),
    F(2, "Français ayant déjà acheté sur une plateforme d'ultra-fast commerce", 30, "%", "2025", "N23", "A", "Environ trois sur dix"),
    F(3, "Évolution des émissions de gaz à effet de serre du commerce de détail", -56, "%", "2008-2024", "N04", "A", "1er rang de l'UE-27", {"UE-27": -39}),
    F(3, "Part de l'électricité produite à partir de sources renouvelables et nucléaires", 95, "%", "2024", "N36"),
    F(3, "Part du PNRR consacrée aux objectifs climatiques", 49.5, "%", "2021-2026", "N33", "B", "Volet transition écologique : 20 Md€, environ 23 Md€ avec REPowerEU (2,8 Md€)"),
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
    ("Prêt Action Climat et prêt vert", [3, 2], "National", "Financement", "Bpifrance, Banque des Territoires", "Plan Climat 2026", "5 000 à 50 000 € sur 2 à 10 ans (prêt vert), couplé à un prêt bancaire équivalent (1:1)", "Financement de la transition écologique et énergétique des TPE et PME. Prêt vert cofinancé par Bpifrance (49,6 %) et la Banque des Territoires (50,4 %).", "N18 N33"),
    ("France Num", [2], "National", "Accompagnement", "DGE", "Depuis 2018", "Plus de 4 000 Activateurs ; chèque France Num de 500 € ; Prêt Boost de 5 000 à 75 000 €", "Initiative de plus de 70 partenaires publics et privés pour la transformation numérique des TPE et PME : présence en ligne, numérisation administrative, logistique, cybersécurité ; agrégateur de plus de 200 financements publics avec CMA France ; baromètre annuel.", "N05 N33"),
    ("Programme de reconquête du commerce rural", [1, 6], "National", "Subvention", "DGE, préfectures", "2023-2026", "36 M€ sur trois ans ; 371 projets soutenus pour 10 M€ (07/2024)", "Implantation de commerces dans les communes rurales peu ou très peu denses dépourvues de commerce : commerces multiservices sédentaires (jusqu'à 80 000 €) et itinérants (jusqu'à 25 000 €).", "N35 N33"),
    ("Plan national de relance et de résilience (PNRR)", [2, 3, 1], "National et Union européenne", "Plan d'investissement", "Gouvernement, Commission européenne", "2021-2026", "40,3 Md€ : 73 investissements, 24 réformes", "Volet européen de France Relance (100 Md€). Compétitivité (4,9 Md€, dont numérisation des PME), transition écologique (20 Md€, environ 23 Md€ avec REPowerEU), cohésion sociale et territoriale (14,8 Md€). Effets surtout indirects sur le commerce de détail.", "N34 N33"),
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

Y = [str(y) for y in range(2008, 2025)]
SERIES = {
    "taille": {"ref": "N02", "annee": "2024", "cats": ["Micro (0-9)", "Petites (10-49)", "Moyennes (50-249)", "Grandes (250+)"],
               "rows": [["Entreprises, France", [95.2, 4.1, 0.6, 0.1]], ["Entreprises, UE-27", [93.9, 5.3, 0.7, 0.1]],
                        ["Emploi, France", [26.7, 15.8, 11.9, 45.6]], ["Emploi, UE-27", [31.9, 18.7, 13.1, 36.3]],
                        ["Valeur ajoutée, France", [15.9, 14.0, 12.2, 58.0]], ["Valeur ajoutée, UE-27", [21.9, 20.2, 17.8, 40.1]]]},
    "va": {"ref": "N02", "annees": Y, "series": [
        ["Micro (0-9)", [100.0, 93.1, 99.1, 101.3, 96.8, 92.7, 87.7, 87.0, 89.0, 83.5, 81.4, 76.1, 76.1, 85.5, 80.7, 77.1, 75.6]],
        ["Petites (10-49)", [100.0, 90.4, 96.6, 92.7, 92.3, 92.7, 93.8, 94.9, 98.7, 94.5, 94.6, 98.9, 103.4, 125.9, 127.4, 116.4, 116.8]],
        ["Moyennes (50-249)", [100.0, 101.5, 106.2, 110.6, 109.6, 110.3, 112.9, 117.0, 114.3, 125.4, 125.0, 126.7, 130.7, 141.8, 140.6, 130.3, 129.2]],
        ["Grandes (250+)", [100.0, 106.4, 105.9, 105.2, 105.4, 107.8, 109.7, 105.7, 110.4, 142.7, 136.3, 147.6, 140.8, 153.6, 150.4, 135.4, 137.2]]]},
    "prod": {"ref": "N02", "annees": Y, "series": [
        ["Micro (0-9)", [100.0, 94.3, 99.1, 98.7, 94.0, 88.7, 78.6, 93.7, 81.0, 90.6, 89.3, 93.2, 89.1, 94.9, 87.4, 78.8, 76.9]],
        ["Petites (10-49)", [100.0, 90.8, 96.6, 101.7, 98.2, 103.8, 103.4, 105.2, 106.2, 112.6, 113.3, 110.5, 106.0, 118.8, 114.9, 105.8, 106.0]],
        ["Moyennes (50-249)", [100.0, 102.0, 106.2, 114.6, 113.2, 113.4, 115.7, 116.2, 113.3, 123.4, 124.0, 119.0, 110.7, 119.3, 114.1, 118.4, 117.3]],
        ["Grandes (250+)", [100.0, 107.4, 105.9, 104.1, 103.4, 103.7, 108.4, 106.4, 109.8, 117.8, 116.6, 119.3, 106.3, 119.8, 117.5, 112.8, 114.0]]]},
    "ges": {"ref": "N04", "annees": Y, "series": [
        ["France", [100.0, 107.7, 112.4, 104.3, 107.1, 106.9, 102.1, 99.6, 93.9, 90.6, 83.4, 75.4, 65.1, 60.4, 52.8, 45.8, 44.0]],
        ["UE-27", [100.0, 101.0, 104.4, 99.7, 97.0, 97.8, 92.5, 90.6, 88.1, 90.1, 86.1, 79.3, 69.7, 71.2, 67.2, 61.5, 60.8]]]},
    "web": {"ref": "N03", "annees": ["2009", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2025"], "series": [
        ["France", [16.7, 19.0, 20.7, 30.1, 30.9, 33.5, 34.1, 33.9, 38.1, 49.0, 43.7, 44.7, 41.5]],
        ["UE-27", [15.7, 19.9, 17.8, 24.7, 23.1, 25.5, 26.6, 28.8, 28.4, 31.6, 35.6, 38.6, 41.6]]]},
    "ia": {"ref": "N03", "annees": ["2020", "2025"], "series": [["France", [4.81, 18.16]], ["UE-27", [5.98, 19.95]]]},
    "pnrr": {"ref": "N33", "total": 40.3, "rows": [["Transition écologique", 20.0], ["Cohésion sociale et territoriale", 14.8], ["Compétitivité (dont numérisation des PME)", 4.9]]},
}
TAXONOMIE = {"ref": "N33", "orientation": [["Vert uniquement", 22], ["Numérique uniquement", 5], ["Vert et numérique", 4], ["Territorial (revitalisation commerciale)", 2]],
             "nature": [["Technique (renforcement des capacités, conseil)", 18], ["Financier (prêts, subventions, aides)", 9], ["Financier et technique", 5]],
             "cible_commerce": 6}
ETAPES = [["2026-04", "T2 2026", "Début de l'étude"], ["2026-06-12", "12 juin 2026", "Strategic Foresight Workshop"], ["2026-07", "T3-T4 2026", "Entretiens et missions"],
          ["2027-01", "T1 2027", "Version préliminaire"], ["2027-04", "Avril 2027", "Discussion au CSMEE"], ["2027-06", "Juin 2027", "Lancement du rapport"]]

# base interviews : liste de l'équipe (document « Liste des personnes à interviewer »), sans coordonnées personnelles
INTERVIEWS = [
    ("i01", "Double transition", "Marie Adeline-Peix et Vincent Criquebec", "Bpifrance", "Directrice exécutive partenariats régionaux et action territoriale (M. Adeline-Peix) ; responsable du programme Diag Data IA, Bpifrance Conseil, plan « Osez l'IA », France 2030 (V. Criquebec)", "Financement de la transition écologique et de l'IA dans les PME, déploiement en région (Prêt Action Climat, plan Climat 2026, « Osez l'IA »)", [2, 3], [5, 6, 7]),
    ("i02", "Double transition", "Nicolas Bonnet", "CCI France", "Directeur général", "Le réseau des 121 CCI accompagne la numérisation et la transition écologique des commerçants", [2, 3, 1], [5, 6, 7]),
    ("i03", "Double transition", "Aurélien Palix et Bénédicte Roullier", "DGE", "Sous-directeur des réseaux et usages numériques (A. Palix) ; cheffe du pôle Transformation numérique des TPE-PME, pilote de France Num (B. Roullier)", "Baromètre France Num 2026 (plus de 9 000 TPE et PME), réseau des Activateurs, ateliers en région, adoption de l'IA par les TPE et PME", [2], [5, 7]),
    ("i04", "Double transition", "Guy Gras", "Conseil du Commerce de France", "Président", "Vision d'ensemble du secteur, toutes tailles et tous formats confondus", [1, 2, 3], [5, 6, 8]),
    ("i05", "Centres-villes et zones périphériques", "Julien Aubignat", "Procos (commerce spécialisé)", "Délégué général", "Panel des enseignes spécialisées : vacance et loyers par emplacement, seule source qui compare centre et périphérie", [5, 6], [1, 2]),
    ("i06", "Centres-villes et zones périphériques", "Frédéric Gibert", "Banque des Territoires", "Responsable du programme Action cœur de ville et du plan commerce", "Plan commerce, foncières de redynamisation, priorité aux entrées de ville", [6, 5, 7], [1, 7]),
    ("i07", "Centres-villes et zones périphériques", "Diane Gallais et Suzie Chevée", "ANCT", "Directrices des programmes Action cœur de ville (D. Gallais) et Petites villes de demain (S. Chevée)", "Bilan d'Action cœur de ville 2 (fin 2026), nouvelle vague du programme, lien avec le plan de transformation des zones commerciales", [6, 5], [1, 7, 8]),
    ("i08", "Centres-villes et zones périphériques", "Pascal Madry", "Institut pour la ville et le commerce", "Directeur", "Spécialiste de la surcapacité commerciale", [5, 6], [1, 2, 8]),
    ("i09", "Zones frontalières", "Frédéric Marquet", "Ville de Mulhouse", "Maire depuis mars 2026 ; manager du commerce de la ville de 2011 à 2024", "A piloté la relance du centre de Mulhouse, ville proche de Bâle et de l'Allemagne", [4, 6], [3, 4, 1]),
    ("i10", "Zones frontalières", "Jean Peyrony", "Mission opérationnelle transfrontalière (MOT)", "Directeur général", "Instance nationale des territoires transfrontaliers : vue d'ensemble de toutes les frontières", [4], [3, 4]),
    ("i11", "Zones frontalières", "Danièle Schmitt", "CCI Alsace Eurométropole", "Chargée du programme Business Twins", "Achats transfrontaliers entre l'Alsace et le Bade-Wurtemberg (Kehl, Strasbourg)", [4], [3, 4]),
]
interviews = [dict(zip(("id", "bloc", "personnes", "organisation", "fonction", "pourquoi", "axes", "questions"), x)) for x in INTERVIEWS]

# base des données manquantes : indicateurs demandés sans source territoriale ouverte, pistes et interlocuteurs
MANQUANTES = [
    ("m01", 1, "Chiffre d'affaires, valeur ajoutée et productivité par territoire", "Commune, EPCI", "Insee Ésane (national, par secteur) ; Commission européenne, SME Performance Review (national)", "National seulement", "Séries nationales par taille intégrées (axe 1) ; demander à l'Insee une exploitation Ésane par zone d'emploi", ["i04"], "Haute"),
    ("m02", 1, "Vacance commerciale par commune", "Commune, centre, zone", "Codata (privé) ; atlas Action cœur de ville (classes, villes ACV) ; taxe sur les friches commerciales", "Partiel", "Classes de l'atlas ANCT intégrées pour les villes ACV ; panel Procos pour comparer centre et périphérie", ["i05", "i07", "i06"], "Haute"),
    ("m03", 1, "Fréquentation et attractivité commerciale", "Centre, zone", "MyTraffic (privé, observatoire ANCT des villes ACV)", "Non ouvert", "Demander l'accès aux indicateurs de l'observatoire ACV", ["i07"], "Moyenne"),
    ("m04", 1, "Dépenses de consommation par territoire", "Département, commune", "Insee, comptes nationaux ; données de cartes bancaires (non ouvertes)", "Partiel", "Seule la part des dépenses à l'étranger est disponible (Insee, départements)", [], "Moyenne"),
    ("m05", 1, "Loyers commerciaux par emplacement", "Centre, périphérie", "Procos ; Cushman & Wakefield ; observatoires des CCI", "Non ouvert", "Panel Procos des enseignes spécialisées", ["i05", "i08"], "Moyenne"),
    ("m06", 2, "Omnicanalité, click and collect, outils de gestion, compétences numériques", "Territoire, taille", "Baromètre France Num (DGE) ; Eurostat, enquête TIC entreprises", "National seulement", "Demander à la DGE des résultats France Num par région et pour le commerce de détail", ["i03", "i02"], "Haute"),
    ("m07", 2, "Adoption du numérique et de l'IA par les micro-entreprises du commerce", "France, secteur", "OCDE et Eurostat (10 salariés et plus seulement) ; baromètre France Num (TPE)", "Partiel", "Les données OCDE excluent les 0-9 salariés, soit environ 95 % des détaillants : à compléter par France Num", ["i03", "i01"], "Haute"),
    ("m08", 2, "Ventes sur les places de marché (Amazon, Etsy…)", "France, secteur", "Fevad ; enquête TIC (module e-commerce)", "Non ouvert", "L'indicateur OCDE ne mesure que la commande sur le site propre de l'entreprise", ["i04"], "Moyenne"),
    ("m09", 2, "Cybersécurité des commerces", "Territoire", "Baromètre France Num ; Cybermalveillance.gouv.fr", "National seulement", "", ["i03"], "Basse"),
    ("m10", 3, "Émissions de CO₂ et consommation d'énergie des commerces", "Établissement, territoire", "OCDE, comptes d'émissions (national) ; ADEME, plateforme OPERAT (décret tertiaire)", "National seulement", "OPERAT n'est pas diffusée par établissement ; demander une exploitation agrégée à l'ADEME", ["i01", "i02"], "Haute"),
    ("m11", 3, "Mobilité des consommateurs, dépendance automobile, accessibilité en transports publics", "Commune, zone", "Enquête mobilité des personnes (SDES) ; horaires GTFS (transport.data.gouv.fr)", "Non intégré", "Calcul d'accessibilité possible à partir des GTFS", [], "Moyenne"),
    ("m12", 3, "Logistique urbaine, circuits courts, résilience climatique", "Commune", "Cerema, ADEME ; Agreste (recensement agricole) ; Géorisques", "Non intégré", "À intégrer dans une prochaine version", [], "Basse"),
    ("m13", 4, "Différentiels de prix (carburant, tabac, alimentation)", "Frontière", "prix-carburants.gouv.fr ; Eurostat, niveaux de prix ; OFDT", "Partiel", "Écarts de TVA intégrés ; séries de prix à intégrer", ["i10"], "Moyenne"),
    ("m14", 4, "Achats transfrontaliers détaillés (franco-allemands)", "Bassin de vie", "ESPON CROSSSHOP (résultats en 2027) ; Business Twin ; Insee Première n° 2075 (départements)", "Partiel", "Résultats ESPON attendus début 2027", ["i11", "i10", "i09"], "Haute"),
    ("m15", 4, "Revenus des territoires frontaliers", "Commune", "Insee Filosofi", "Ouvert, non intégré", "À intégrer", [], "Basse"),
    ("m16", 5, "Fréquentation et emploi des zones périphériques", "Zone", "MyTraffic ; inventaire Cerema (emploi partiellement renseigné)", "Non ouvert", "", ["i05", "i08"], "Moyenne"),
    ("m17", 6, "Mixité des usages et attractivité résidentielle des centres", "Centre", "Fichiers fonciers (Cerema, accès restreint) ; LOVAC ; DVF", "Partiel", "Atlas ACV (vacance des logements, ventes) intégré pour les villes ACV", ["i07"], "Moyenne"),
    ("m18", 6, "Bénéficiaires des dispositifs par commune (ACV, reconquête rurale, prêts verts, France Num)", "Commune", "ANCT ; DGE (lauréats) ; Bpifrance ; Banque des Territoires", "Partiel", "Listes ACV et PVD intégrées ; demander les lauréats et les montants pour évaluer les politiques (question 7)", ["i06", "i07", "i01", "i03"], "Haute"),
    ("m19", 7, "Inclusion numérique, mobilité et consommation locale en QPV", "QPV", "Indice de fragilité numérique (Mednum) ; recensement", "Non intégré", "À intégrer", ["i06"], "Basse"),
]
manquantes = [dict(zip(("id", "axe", "indicateur", "maille", "sources", "etat", "piste", "interlocuteurs", "priorite"), x)) for x in MANQUANTES]

# journal de bord : principaux ajouts (historique du dépôt de l'étude)
JOURNAL = [
    ("2026-09-17", "Analyse", "Étude de cas : influence des zones périphériques sur l'attractivité des centres-villes", ""),
    ("2026-09-29", "Analyse", "Recherche et rapport sur les zones commerciales périphériques", ""),
    ("2026-09-30", "Données", "Commerces en centre-ville et en QPV selon la proximité des zones périphériques (Sirene)", ""),
    ("2026-10-01", "Sources", "État de l'art et base de chiffres sourcés ; chiffres du rapport de la Cour des comptes vérifiés", ""),
    ("2026-10-01", "Fonction", "Registre en ligne (version 1) : chiffres, sources, catalogue des bases, cartographie des interviews, tableau de bord", ""),
    ("2026-10-06", "Livrable", "Note de politique publique sur les zones commerciales, les centres-villes et les QPV (Word)", ""),
    ("2026-10-07", "Fonction", "Registre : filtre par année dans les chiffres et les graphiques", ""),
    ("2026-10-08", "Analyse", "Villes Action cœur de ville : trajectoires du commerce de centre-ville, vacance 2025 (atlas ANCT), croisement avec Codata", ""),
    ("2026-10-09", "Livrable", "Proposition à la DGE : huit villes ACV pour les missions d'entretiens", ""),
    ("2026-10-09", "Interviews", "Liste des personnes à interviewer (Word)", ""),
    ("2026-10-12", "Fonction", "Observatoire version 2 : 34 744 communes, 1 372 zones commerciales, 1 362 QPV ; comparaisons, carte, analyses, 8 questions de recherche, Research Assistant", ""),
    ("2026-10-12", "Design", "Refonte visuelle : carte des communes en accueil, fiches territoriales, graphiques", ""),
    ("2026-10-12", "Sources", "Chiffres de la présentation OCDE à la DGE : séries de valeur ajoutée et de productivité par taille, émissions, vente en ligne, IA, PNRR, taxonomie des dispositifs", "Sources N02, N03, N04, N33 à N36"),
    ("2026-10-12", "Fonction", "Suivi de l'étude : journal de bord, base des interviews, base des données manquantes", "Statuts, notes et ajouts partagés entre les membres de l'équipe"),
]
journal = [dict(zip(("date", "type", "titre", "detail"), x)) for x in JOURNAL]

json.dump({"chiffres": chiffres, "sources": sources, "bases": bases, "national": NAT, "politiques": politiques,
           "tva": [{"pays": p, "taux": t, "ref": r} for p, t, r in TVA],
           "frontaliers": {"annee": 2021, "ref": "N08", "data": FRONTALIERS},
           "series": SERIES, "taxonomie": TAXONOMIE, "etapes": ETAPES, "interviews": interviews, "manquantes": manquantes, "journal": journal},
          open(os.path.join(OUT, "contenus.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("contenus.json :", len(chiffres), "chiffres v1,", len(sources), "sources,", len(bases), "bases,", len(NAT), "chiffres nationaux,", len(politiques), "dispositifs")
