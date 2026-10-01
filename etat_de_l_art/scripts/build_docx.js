const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, Header, PageNumber, TableOfContents,
  ExternalHyperlink,
} = require("docx");

const NAVY = "003087", BAND = "0070C0", TINT = "EBF4FB", GREY = "595959";
const FONT = "Arial";
const W = 9638; // largeur utile A4, marges 2 cm

// Typographie française : espaces insécables
const fr = (s) => s
  .replace(/ ([:;!?%»])/g, " $1")
  .replace(/« /g, "« ")
  .replace(/(\d) (\d{3})/g, "$1 $2")
  .replace(/(\d) (\d{3})/g, "$1 $2")
  .replace(/n° /g, "n° ");

// Texte riche : **gras**, _italique_, [Sxx] en gris
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|(?<![\w])_[^_]+_(?![\w])|\[S\d{2}(?:, S\d{2})*\])/g;
  let last = 0, m;
  const t = fr(text);
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    const s = m[0];
    if (s.startsWith("**")) out.push(new TextRun({ text: s.slice(2, -2), bold: true, ...base }));
    else if (s.startsWith("_")) out.push(new TextRun({ text: s.slice(1, -1), italics: true, ...base }));
    else out.push(new TextRun({ text: s, color: GREY, size: 17, ...base }));
    last = m.index + s.length;
  }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}

const P = (text, opts = {}) => new Paragraph({ children: runs(text), spacing: { after: 120, line: 276 }, ...opts });
const B = (text) => new Paragraph({ children: runs(text), numbering: { reference: "bul", level: 0 }, spacing: { after: 60, line: 264 } });
const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(fr(text))], pageBreakBefore: false });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(fr(text))] });
// Bloc « source » : titre de la source puis paragraphes
const SRC = (label, ref, scope) => new Paragraph({
  keepNext: true, spacing: { before: 160, after: 60 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: BAND, space: 6 } },
  indent: { left: 120 },
  children: [
    new TextRun({ text: fr(label), bold: true, color: NAVY }),
    new TextRun({ text: "  " + ref, color: GREY, size: 17 }),
    ...(scope ? [new TextRun({ text: fr("  —  Champ : " + scope), italics: true, color: GREY, size: 18 })] : []),
  ],
});
const NOTE = (text) => new Paragraph({
  children: runs(text, { size: 19 }), spacing: { before: 80, after: 160, line: 264 },
  shading: { type: ShadingType.CLEAR, color: "auto", fill: TINT }, indent: { left: 120, right: 120 },
});

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function table(cols, widths, rows) {
  const mk = (txt, i, head) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: fr(txt), size: 17, bold: head, color: head ? "FFFFFF" : undefined })] })],
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: cols.map((c, i) => mk(c, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => mk(c, i, false)) }))],
  });
}

const children = [];
const add = (...xs) => children.push(...xs);

// ---------- Page de titre
add(
  new Paragraph({ spacing: { before: 1800, after: 120 }, children: [new TextRun({ text: "OCDE · Centre pour l'entrepreneuriat, les PME, les régions et les villes", color: BAND, size: 20, bold: true })] }),
  new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: fr("Zones commerciales périphériques, centres-villes et quartiers prioritaires"), bold: true, size: 44, color: NAVY })] }),
  new Paragraph({ spacing: { after: 480 }, children: [new TextRun({ text: "État de l'art : études, statistiques et rapports publics", size: 30, color: NAVY })] }),
  P("Document de travail préparé pour l'étude de cas France « La double transition et l'avenir des PME du commerce de détail dans les zones urbaines et rurales »."),
  P("Version du 1er octobre 2026."),
  new Paragraph({ spacing: { before: 600 }, children: [] }),
  NOTE("**Comment lire ce document.** Il rassemble ce que disent les sources, une par une, sans les comparer ni combiner leurs chiffres. Chaque source est présentée avec son champ (ce qu'elle mesure, sur quel territoire, à quelle date). Les références entre crochets [S01] renvoient à l'onglet « Sources » du classeur Excel joint (chiffres_zones_commerciales_centres_villes_QPV.xlsx), qui détaille chaque chiffre (année, champ, niveau de vérification)."),
  new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: "Sommaire", bold: true, size: 28, color: NAVY })], spacing: { after: 200 } }),
  ...["Objet et méthode", "1. L'ampleur des zones commerciales de périphérie", "2. Ce que les sources disent des centres-villes",
    "3. Ce que les sources disent des quartiers prioritaires", "4. La littérature économique", "5. Régulation et politiques publiques",
    "6. Évolutions récentes : la périphérie elle-même en question", "7. Ce que la littérature ne permet pas encore d'établir", "Références"]
    .map((t) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr(t), size: 22 })] })),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ---------- Introduction
add(
  H1("Objet et méthode"),
  P("Ce document recense les travaux disponibles sur le développement des zones commerciales de périphérie en France et sur ce qu'ils disent de ses effets sur les centres-villes et sur les quartiers prioritaires de la politique de la ville (QPV). Il couvre la statistique publique (Insee, Cerema, ONPV), les rapports institutionnels (Cour des comptes, Sénat, Assemblée nationale, inspections, mission gouvernementale de 2025), les données des administrations et opérateurs (CNAC, ANCT, ANRU, Banque des Territoires), les données de fédérations et cabinets privés (Procos, Codata, FACT, Icade × SCET) et la littérature économique."),
  P("Trois précautions guident la lecture :"),
  B("**Les chiffres ne sont pas interchangeables.** Un même indicateur (vacance commerciale, surfaces autorisées, part de la périphérie) est mesuré sur des champs différents selon les sources. Chaque chiffre est donc donné avec son champ et n'est pas rapproché de ceux des autres sources."),
  B("**Les sources n'ont pas le même statut.** La statistique publique et les rapports officiels sont distingués des données privées, souvent produites par des acteurs du secteur."),
  B("**Le niveau de vérification varie.** Les chiffres relus dans le document d'origine sont distingués, dans le classeur, de ceux lus via un relais (presse, synthèse). Les chiffres dont l'origine n'a pas pu être établie sont signalés."),
  H2("Principales sources mobilisées"),
  table(["Source", "Type", "Date", "Ce qu'elle couvre"], [2700, 1700, 900, 4338], [
    ["Cerema, inventaire des zones commerciales (EmpCom) [S01, S02]", "Opérateur public", "2023-2025", "Nombre, contours et emprise des zones de périphérie"],
    ["Insee Première n° 1858 [S05]", "Statistique publique", "2021", "Pôles du commerce de proximité, emploi 2009-2015"],
    ["Insee Première n° 1782 [S06]", "Statistique publique", "2019", "Centres-villes des villes de taille intermédiaire, 2009-2015"],
    ["Insee Première n° 2091 [S07]", "Statistique publique", "2026", "Emploi des points de vente par type de pôle, 2016-2022"],
    ["Dossier de presse « Un nouvel horizon pour les zones commerciales » [S08]", "Gouvernement", "2023", "Diagnostic et plan de transformation des zones"],
    ["Rapport d'activité 2024 de la CNAC [S10]", "Administration", "2025", "Autorisations CDAC et CNAC 2020-2024, critère d'artificialisation"],
    ["Sénat, rapport n° 910 [S22]", "Parlement", "2022", "Revitalisation des centres-villes, causes de la dévitalisation"],
    ["Cour des comptes [S23, S24, S25, S26]", "Juridiction financière", "2016-2023", "Politique de l'État en faveur du commerce de proximité, politique de la ville, Action Cœur de Ville"],
    ["Mission sur l'avenir du commerce de proximité [S27, S28]", "Mission gouvernementale", "2025", "Centres-villes et QPV, 30 recommandations"],
    ["ONPV, Insee, ANCT, ANRU [S30 à S34]", "Statistique et opérateurs", "2021-2025", "Tissu économique et contexte social des QPV"],
    ["Procos (Codata, Kyris, Stackr) [S09]", "Fédération privée", "2025", "Vacance, fréquentation, autorisations CDAC"],
    ["Icade × SCET, baromètre des entrées de ville [S11]", "Acteurs privés", "2026", "Projets de transformation, vacance des zones (FACT), sondage d'élus"],
    ["Note du CAE n° 77 [S12]", "Conseil d'analyse économique", "2023", "Synthèse de la littérature sur le petit commerce"],
  ]),
);

// ---------- 1. Poids des zones
add(
  H1("1. L'ampleur des zones commerciales de périphérie"),
  P("Les sources s'accordent sur l'existence d'environ 1 500 grandes zones commerciales de périphérie, issues d'une cinquantaine d'années de développement. Elles divergent sur la mesure de leur poids économique, parce qu'elles mesurent des choses différentes : surface, emploi, chiffre d'affaires, dépenses en magasin ou ensemble des ventes."),
  SRC("Cerema (2023-2025)", "[S01, S02]", "zones de périphérie significatives, France métropolitaine"),
  P("Le Cerema a réalisé en 2022 un inventaire national des zones d'activité, présenté en février 2023 et publié en open data en janvier 2024 (base EmpCom). Il retient 1 527 contours correspondant aux emprises commerciales les plus importantes : plus de 20 000 m² de surface bâtie, et une surface commerciale de plus de 60 000 m² (ou comprise entre 25 000 et 150 000 m² avec plus de 15 000 m² de surface commerciale). Dans sa communication de 2025, le Cerema parle de « 1 500 zones recensées » couvrant « 500 millions de mètres carrés, soit cinq fois la superficie de Paris ». Ce chiffre porte sur l'emprise des zones et non sur la surface de vente."),
  P("Le Cerema souligne la dépendance à l'automobile : la voiture individuelle représente 84 % des déplacements vers ces zones dans les métropoles et 88 % dans les villes moyennes."),
  SRC("Insee Première n° 1858 (Bédué et Cohen, 2021)", "[S05]", "pôles du commerce de proximité, France métropolitaine et La Réunion, 2009-2015"),
  P("L'Insee identifie 7 951 pôles du commerce de proximité en 2015 (commerce de détail et services de la vie courante), dont 62 % sont des pôles de périphérie. Ces derniers rassemblent 23 % des établissements des pôles, mais **65 % de la surface commerciale** et 45 % des emplois. Leurs établissements sont plus grands et plus spécialisés : 38 % de leurs salariés travaillent dans le commerce alimentaire (20 % en centre-ville) et 20 % dans l'équipement de la maison (9 % en centre-ville)."),
  SRC("Insee Première n° 2091 (Bloch et Pichavant, 2026)", "[S07]", "points de vente aux ménages, France, 2016-2022"),
  P("Avec une méthode actualisée, l'Insee indique qu'en 2022 les pôles de centre-ville (47 % des pôles) et les pôles de périphérie rassemblent chacun 37 % des salariés des points de vente aux ménages. Un point de vente compte en moyenne 12 salariés et 586 m² de surface de vente en périphérie, contre 3 salariés et 92 m² en centre-ville."),
  SRC("Gouvernement, dossier de presse « Un nouvel horizon pour les zones commerciales » (septembre 2023)", "[S08]", "dépenses des Français en magasin"),
  P("Le dossier de presse reprend le chiffre de plus de 1 500 zones et 500 millions de m². Il indique que les entrées de ville, et en particulier les zones commerciales, « concentrent 72 % des dépenses des Français dans les magasins contre 15 % en centre-ville et 13 % dans les espaces dits “interstices” (ruralité, banlieue dense) ». La source statistique de cette répartition n'est pas détaillée."),
  SRC("Procos (2025) et Procos cité par le Cerema (2020)", "[S09, S03]", "chiffre d'affaires et parts de marché du commerce de détail"),
  P("Procos écrit en 2025 que les lieux de commerce de périphérie « représentent plus de 70 % du chiffre d'affaires du commerce de détail ». Le Cerema cite un chiffre Procos de 2020 : les quelque 1 500 zones représentent 75 % des parts de marché du commerce de détail."),
  SRC("Rexecode (2024), d'après Insee, Procos et Fevad", "[S13]", "ensemble des ventes du commerce de détail, internet compris"),
  P("Selon la répartition reprise dans la présentation de l'étude, la périphérie réalise 67 % des ventes du commerce de détail en 2024, le centre-ville 11 %, le commerce de proximité 11 % et internet 11 %."),
  SRC("Sénat, rapport n° 910 (2022)", "[S22]"),
  P("Le Sénat parle d'« obésité commerciale » : les surfaces commerciales ont doublé entre 2000 et 2020 sans hausse équivalente des dépenses des ménages."),
);

// ---------- 2. Centres-villes
add(
  H1("2. Ce que les sources disent des centres-villes"),
  H2("2.1 Emploi et établissements"),
  SRC("Insee Première n° 1858 (2021)", "[S05]", "pôles du commerce de proximité, 2009-2015"),
  P("Entre 2009 et 2015, l'emploi salarié des pôles progresse de 1,2 % par an, avec des dynamiques opposées : **+2,3 % par an dans les pôles de périphérie et +0,2 % dans ceux de centre-ville** (« stabilité »). Hors pôles, il recule de 1,2 % par an. L'emploi baisse dans 38 % des pôles de centre-ville et 23 % des pôles de périphérie."),
  P("L'Insee souligne le rôle de la démographie : l'emploi « se replie nettement » dans 57 % des pôles de centre-ville situés dans des aires en recul démographique, contre 30 % dans les aires les plus dynamiques. Le tourisme protège aussi les centres."),
  P("L'Insee croise enfin, par intercommunalité, l'évolution de l'emploi en périphérie et en centre-ville. Là où l'emploi des pôles de périphérie croît de plus de 1 % par an, celui des centres-villes baisse de plus de 1 % par an dans 46 % des cas. Là où l'emploi de la périphérie recule d'au moins 1 % par an, cette proportion est de 43 %. Le lien entre les deux dynamiques apparaît donc faible à cette échelle."),
  SRC("Insee Première n° 1782 (Cazaubiel et Guymarc, 2019)", "[S06]", "centres-villes de 368 villes de taille intermédiaire, 2009-2015"),
  P("Dans 82 % des centres-villes de villes de taille intermédiaire, l'emploi salarié du commerce de proximité suit une tendance négative ; dans la moitié d'entre eux, la baisse dépasse 1,4 % par an. Chaque année, 600 établissements et 3 500 emplois salariés disparaissent dans ces centres-villes, alors que les agglomérations gagnent 100 établissements et 1 600 salariés par an. Dans 37 % de ces villes, l'emploi baisse en centre-ville mais augmente dans l'agglomération. Le commerce de centre-ville résiste mieux dans les villes attractives sur le plan démographique, de l'emploi ou du tourisme."),
  SRC("Insee Première n° 2091 (2026)", "[S07]", "points de vente aux ménages, 2016-2022"),
  P("Entre 2016 et 2022, l'emploi salarié des points de vente croît de 1,1 % par an dans les pôles de centre-ville, 1,6 % dans les pôles de périphérie et 1,9 % hors des pôles. Les pôles de périphérie contribuent pour 40 % à la hausse de l'emploi, ceux de centre-ville pour 28 %. En périphérie, le nombre d'établissements augmente de 1,7 % par an et la surface de vente de 1,3 %. L'emploi du commerce d'habillement recule de 2,2 % par an sur l'ensemble du territoire (un emploi sur huit en six ans) et le nombre d'établissements d'habillement baisse de 14,9 %."),
  SRC("Conseil d'analyse économique, note n° 77 (Allain et Epaulard, 2023)", "[S12]", "petit commerce au sens large"),
  P("Le CAE compte un peu plus de 430 000 établissements de petit commerce en 2019 (commerce de détail hors grandes surfaces, bars, restaurants, services aux ménages), soit environ 12 % de l'emploi total. Il conclut à « une mutation du petit commerce » plus qu'à un déclin général, avec une forte hétérogénéité selon les territoires : les villes isolées et les zones rurales concentrent les situations préoccupantes."),

  H2("2.2 Vacance commerciale"),
  P("La vacance commerciale est l'indicateur le plus cité, mais aucune série publique continue n'existe. Les chiffres proviennent de panels différents (nombre de villes, rues marchandes ou ensemble des sites, villes d'un programme). Ils sont présentés ici source par source."),
  SRC("CGEDD (2016), cité par Public Sénat", "[S18]", "panel de 187 centres-villes"),
  P("La vacance commerciale passe de 6 % en 2001 à plus de 10 % en 2015."),
  SRC("CGEDD et IGF (2016)", "[S19]", "900 centres-villes"),
  P("La vacance augmente dans 87 % des 900 centres-villes étudiés."),
  SRC("Institut pour la Ville et le Commerce, cité par la Banque des Territoires", "[S20]", "centres-villes des agglomérations de plus de 25 000 habitants"),
  P("La vacance augmente d'environ un point par an depuis 2010 et atteint 11,3 % en 2016."),
  SRC("Codata, cité par Procos (février 2025)", "[S09]", "rues marchandes, centres commerciaux et zones commerciales"),
  P("Le taux de vacance « tous sites » passe de 9,73 % à 10,64 % entre 2023 et 2024. La hausse est surtout marquée dans les rues marchandes (de 9,73 % à 10,85 %) et les centres commerciaux (de 14,95 % à 16,7 %), alors que les zones commerciales sont plus stables (de 6,79 % à 7,24 %). Les écarts régionaux vont de 8,92 % en Bretagne à 12,46 % en Occitanie."),
  SRC("Codata, Digest 2026", "[S14]", "pied d'immeuble de centre-ville"),
  P("La vacance en pied d'immeuble de centre-ville atteint 11,7 % en 2025, contre 10,8 % en 2024."),
  SRC("Codata et FACT, villes Action Cœur de Ville", "[S16, S17]", "centres-villes des villes ACV"),
  P("En 2022, la vacance atteint 12,5 % dans les villes ACV contre 7,39 % dans un groupe de comparaison ; elle a baissé de 1,7 point depuis le pic de 2020 dans les villes ACV, contre 0,3 point hors programme. En 2024, le baromètre Codata / FACT relève 13,4 % dans les villes ACV et 7,7 % hors ACV. Certaines villes ont fortement réduit leur vacance entre 2018 et 2022 : Vierzon (de 28,8 % à 22,2 %), Calais (d'environ 21,5 % à 14 %), Bagnols-sur-Cèze (de 21,3 % à 14,3 %)."),
  SRC("Banque des Territoires (données 2020-2022)", "[S21]", "centres-villes selon la taille du bassin"),
  P("La vacance reste sous 9 % dans les cœurs de métropole (de 7,6 % à 8,3 %), stagne autour de 11 % dans les grandes villes, et baisse entre 2020 et 2022 dans les villes moyennes (de 13,6 % à 12,6 %) et les petites villes (de 13,1 % à 12 %)."),
  SRC("Mission sur l'avenir du commerce de proximité (novembre 2025)", "[S27, S28]"),
  P("La mission relève qu'environ une boutique sur dix est fermée en centre-ville et que la vacance a doublé en dix ans. Les synthèses du rapport citent un taux national de 14 % en 2024 ; le champ exact de ce chiffre reste à vérifier dans le rapport intégral."),

  H2("2.3 Fréquentation et composition de l'offre"),
  SRC("Procos, observatoire de la fréquentation (avec Stackr)", "[S09]", "fréquentation des magasins, 2024 par rapport à 2023"),
  P("La fréquentation des magasins baisse de 1,6 % en 2024. Elle recule davantage en centre-ville (−1,8 %) qu'en périphérie (−1,2 %) ou en centre commercial (−0,8 %). Procos y voit l'effet cumulé des difficultés d'accès aux centres-villes et de l'implantation des enseignes discount en périphérie."),
  SRC("Cour des comptes, « La politique de l'État en faveur du commerce de proximité » (2023)", "[S23]", "commerce de proximité, 2017-2022"),
  P("La Cour décrit un secteur d'environ 700 000 entreprises et 1,1 million d'emplois, salariés et non salariés ; 68 % des entreprises n'ont aucun salarié. La part de marché du commerce alimentaire spécialisé passe de 22 % en 1993 à 17 % en 2017, puis remonte à 20 % en 2021, avec l'essor des supérettes. Les ventes en ligne représentent 12,5 % des ventes du commerce de détail en 2022. Selon les synthèses du rapport, la vacance commerciale en centre-ville passe de 7 % en 2012 à 12,3 % en 2020, et près de 40 villes dépassent 20 %."),
  P("Environ 500 millions d'euros d'aides ont été attribués au secteur entre 2018 et 2022. L'État a cessé les aides économiques directes aux petits commerces au profit de programmes territoriaux (Action Cœur de Ville, Petites villes de demain) ; les crédits du FISAC sont passés de 80 millions d'euros en 2007 à 16 millions en 2018 avant sa suppression. La Cour pointe une profusion de dispositifs aux résultats inégaux, une coordination insuffisante entre l'État et les collectivités et un manque d'indicateurs de suivi. Le rapport n'a pas pu être ouvert directement : ces chiffres proviennent de synthèses et sont à vérifier."),
  SRC("Sénat (2022) et Codata (2025)", "[S22, S15]"),
  P("Le Sénat note que l'équipement de la personne représente 40 à 60 % de l'offre de certains centres-villes, ce qui les expose. Selon Codata, la part de l'habillement dans l'offre en pied d'immeuble passe de 20,92 % en 2015 à 15,05 % en 2024, tandis que la restauration progresse."),

  H2("2.4 Causes retenues par les rapports publics"),
  SRC("Sénat, rapport n° 910 (2022)", "[S22]"),
  P("Le Sénat retient un diagnostic multifactoriel : essor du commerce en ligne, « obésité commerciale », surreprésentation de l'équipement de la personne, « suréquipement commercial périphérique », départ vers la périphérie des « générateurs de trafic » historiques, et fragilité des locaux de centre-ville. Il juge inefficace de traiter le seul volet commercial sans agir sur le logement, et de s'appuyer uniquement sur le droit « sans réorienter les flux économiques et financiers qui ont permis l'émergence de périphéries très denses ». Il formule 43 mesures, dont un objectif de « zéro artificialisation commerciale nette » en périphérie."),
  SRC("Assemblée nationale, rapport d'information n° 4968 (2022)", "[S43]"),
  P("Le rapport identifie l'étalement urbain comme cause principale : la population s'est déplacée des centres vers les périphéries, et le commerce l'a suivie."),
  SRC("Cerema, « Zones commerciales et centres-villes : trouver le bon équilibre »", "[S03]"),
  P("Le Cerema estime que « l'opposition entre centre-ville et périphérie doit être dépassée » et que « les centres-villes commerçants et les zones commerciales de périphérie semblent donc emprunter le même chemin avec quelques années de décalage »."),
);

// ---------- 3. QPV
add(
  H1("3. Ce que les sources disent des quartiers prioritaires"),
  P("Les travaux sur les QPV sont moins nombreux et surtout qualitatifs. Ils décrivent un double mouvement : la périphérie attire la demande solvable, tandis que les quartiers cumulent faible pouvoir d'achat et image dégradée."),
  SRC("Cour des comptes, rapport public annuel 2016 et rapport sur l'attractivité des quartiers prioritaires", "[S24, S25]"),
  P("La Cour constate un déclin économique et commercial continu des quartiers, qui n'attirent pas de nouvelles activités. Les services de proximité, souvent en pied d'immeuble, ont tendance à se relocaliser vers la périphérie. Elle note que « le développement commercial s'opère en périphérie des quartiers » plutôt qu'en leur sein, et que l'attractivité des quartiers a peu progressé en dix ans. Elle avance deux causes : économique (le faible pouvoir d'achat des habitants) et symbolique (l'image d'insécurité, réelle ou perçue)."),
  SRC("Sénat, « Un nouveau pacte de solidarité pour les quartiers » (2006)", "[S29]"),
  P("Le rapport relevait déjà la présence de très grands équipements commerciaux à proximité immédiate des zones urbaines sensibles, en contraste avec la vétusté ou l'insuffisance de leurs commerces de proximité."),
  SRC("ONPV et Insee : contexte socio-économique", "[S31, S32, S33]", "QPV"),
  P("La France compte 1 362 QPV en métropole au 1er janvier 2025 (156 dans les DROM, 91 en Polynésie et à Saint-Martin), soit plus de 6 millions d'habitants. Le taux de chômage y est de 18,3 % en 2022, contre 7,5 % dans les unités urbaines englobantes (25 % en 2014). En 2021, 45 % des habitants vivent sous le seuil de pauvreté, et le niveau de vie médian est de 1 213 € par mois contre 1 900 € dans le reste des agglomérations."),
  SRC("ONPV, tissu économique des QPV (2023)", "[S30]"),
  P("Le nombre d'entreprises implantées en QPV a presque doublé en cinq ans, porté par le commerce, le transport et la construction. Au 1er janvier 2021, 15,8 % des établissements des QPV de métropole relèvent du commerce de détail ; en 2021, ce secteur représente 9,2 % des 92 590 établissements créés."),
  SRC("Mission sur l'avenir du commerce de proximité (2025)", "[S27]"),
  P("La mission décrit dans les QPV une carence en commerces de première nécessité, en services de santé et bancaires, un immobilier commercial obsolète et un climat d'insécurité. Elle propose de faire des QPV le « laboratoire d'un nouveau modèle de centre-ville » et un dispositif « Entrepreneuriat Quartier 2030 »."),
  SRC("ANRU (2025)", "[S34]"),
  P("L'ANRU cite parmi les causes de fragilisation du commerce des quartiers en renouvellement urbain l'érosion du pouvoir d'achat, l'évolution des modes de consommation, la concurrence des zones commerciales périphériques et l'obsolescence de l'immobilier commercial. Le commerce de proximité y fait l'objet de 122 opérations, pour une dotation ANRU de 322 millions d'euros."),
  NOTE("**Point d'attention.** Aucune des sources consultées ne mesure de façon quantitative et localisée l'effet d'une zone commerciale sur un QPV voisin, ni la part des achats des habitants des QPV réalisée en périphérie. Il n'existe pas non plus d'indicateur national de vacance commerciale propre aux QPV."),
);

// ---------- 4. Littérature économique
add(
  H1("4. La littérature économique"),
  P("Les travaux économétriques qui isolent l'effet causal des grandes surfaces sur le commerce de centre-ville sont rares en France. Les principaux résultats disponibles sont les suivants."),
  SRC("Quantin et Turner (Insee, 2015)", "[S52]", "petit commerce alimentaire de proximité"),
  P("Selon la note du CAE, cette étude sur longue période montre que deux ans après l'implantation d'une grande surface, la probabilité de sortie des petits commerces alimentaires de proximité est importante, en particulier dans les villes moyennes et petites. Le texte d'origine n'a pas été consulté."),
  SRC("Bertrand et Kramarz (2002)", "[S50]", "réglementation de l'entrée des grandes surfaces en France"),
  P("Les auteurs étudient les décisions des commissions départementales chargées d'autoriser les grandes surfaces. Selon la note du CAE, ce frein réglementaire à l'entrée des grandes surfaces alimentaires « a augmenté la concentration de la distribution et a ralenti la croissance de l'emploi dans ce secteur »."),
  SRC("Sadun (2015)", "[S51]", "Royaume-Uni"),
  P("L'étude porte sur le durcissement de la réglementation britannique des implantations commerciales hors des centres dans les années 1990. Elle montre que cette réglementation n'a pas protégé les commerçants indépendants : les grandes chaînes se sont repliées sur des formats plus petits, installés en centre-ville, en concurrence directe avec eux."),
  SRC("Études étrangères citées par le CAE", "[S12]"),
  P("En Espagne, entre 20 et 30 % des petits commerces alimentaires de centre-ville disparaissent dans les quatre ans qui suivent l'entrée d'une grande surface, mais 75 % des emplacements libérés sont repris par d'autres petits commerces, non alimentaires. Aux États-Unis, l'ouverture d'un Walmart crée une centaine d'emplois dans le commerce de détail du comté la première année, dont la moitié a disparu au bout de cinq ans ; aucun effet n'est mesurable dans les comtés voisins."),
);

// ---------- 5. Régulation et politiques
add(
  H1("5. Régulation et politiques publiques"),
  H2("5.1 Le cadre juridique"),
  P("Le droit de l'aménagement commercial est passé d'une logique de protection du petit commerce à une logique de sobriété foncière [S45] :"),
  B("**Loi Royer (1973)** : autorisation requise au-delà de 1 000 m² de surface de vente (1 500 m² dans les villes de plus de 40 000 habitants)."),
  B("**Loi Raffarin (1996)** : seuil abaissé à 300 m²."),
  B("**Loi de modernisation de l'économie (2008)** : seuil relevé à 1 000 m² ; création des commissions départementales d'aménagement commercial (CDAC)."),
  B("**Loi ELAN (2018)** : création des opérations de revitalisation de territoire (ORT) ; le préfet peut suspendre pour trois ans (renouvelables un an) l'examen des projets situés en périphérie d'une commune en ORT."),
  B("**Loi Climat et résilience (2021)** : interdiction de principe des projets commerciaux qui artificialisent les sols ; aucune dérogation au-delà de 10 000 m² de surface de vente ; entre 3 000 et 10 000 m², dérogation soumise à l'accord du préfet. Depuis le 15 octobre 2022, les commissions examinent le critère d'artificialisation pour toute demande [S10]."),
  H2("5.2 Les autorisations commerciales"),
  SRC("CNAC, rapport d'activité 2024", "[S10]", "avis et décisions des CDAC et de la CNAC, 2020-2024"),
  P("Les surfaces de vente autorisées par les CDAC s'élèvent à 583 466 m² en 2020, 688 220 m² en 2021, 765 384 m² en 2022, 625 386 m² en 2023 et 605 844 m² en 2024 (taux d'autorisation de 88 % en 2024). La CNAC a examiné 234 940 m² en 2024, contre 487 999 m² en 2023 (−52 %), et la surface moyenne examinée est passée de 2 696 m² à 1 620 m². La CNAC attribue cette baisse au cadre de sobriété foncière, à l'évolution vers des formats plus compacts, à la priorité donnée aux centres-villes et au contexte économique. En 2024, 29 dossiers examinés par la CNAC étaient susceptibles d'artificialiser 199 045 m² : 12 ont été autorisés (115 375 m²) et 17 refusés (83 668 m²)."),
  SRC("Procos, d'après Kyris (février 2025)", "[S09]", "surfaces autorisées en CDAC, hors retraits et non-lieux"),
  P("Selon cette série, les surfaces autorisées en CDAC passent de 1,31 million de m² en 2019 à 0,47 million en 2024, « soit une baisse de 67 % » et « 7 fois moins qu'en 2011 ». Procos parle du « plus bas niveau depuis 30 ans ». Sur cinq ans (2020-2024), les grands promoteurs ont livré 1,77 million de m² sur 376 projets, contre 5,4 millions de m² sur 518 projets cinq ans plus tôt."),
  SRC("Banque des Territoires (2024)", "[S40]"),
  P("L'article rapporte environ 1,7 million de m² examinés en CDAC en 2017, et indique que la CNAC a évité en 2023 l'artificialisation de 89 870 m² en rejetant 29 projets."),
  H2("5.3 Les programmes de revitalisation"),
  SRC("Action Cœur de Ville", "[S35, S36, S26, S22]"),
  P("Lancé en mars 2018 pour 222 villes ou binômes (244 communes lauréates en 2025), le programme a mobilisé plus de 6 milliards d'euros sur 2018-2022 ; une enveloppe de 5 milliards d'euros accompagne la phase 2023-2026, avec un accent sur les entrées de ville. L'ANCT fait état de près de 29 000 commerces et locaux restructurés. La Cour des comptes relève une hausse de 14 % des transactions immobilières et une fréquentation en hausse de 15 % en 2021 (contre 2 % hors programme), mais juge le programme « ambitieux mais difficile à évaluer ». Le Sénat et la Cour pointent une évaluation insuffisante."),
  SRC("Petites villes de demain", "[S37]"),
  P("Le programme, lancé en octobre 2020 pour les communes de moins de 20 000 habitants, soutient 1 646 communes au 31 décembre 2024 et a engagé 3,7 milliards d'euros, au-delà des 3 milliards prévus."),
  SRC("Banque des Territoires, foncières de redynamisation", "[S38]"),
  P("Le plan d'un milliard d'euros consacre 800 millions aux foncières de redynamisation, avec l'objectif d'une centaine de foncières et de 6 000 commerces vacants ou dégradés remis sur le marché."),
  SRC("Plan de transformation des zones commerciales (2023-2024)", "[S08, S39]"),
  P("Lancé en septembre 2023, le plan a retenu 74 lauréats en mars 2024 (26 millions d'euros) puis 16 en mai 2024 (5,4 millions d'euros), soit 90 projets et 31,4 millions d'euros. Le potentiel annoncé est de 25 000 logements pour les 74 premiers projets."),
  SRC("Politique de la ville : EPARECA, ANRU, ANCT", "[S46, S47, S34]"),
  P("L'EPARECA, créé en 1996 et aujourd'hui intégré à l'ANCT, a restructuré plus de 50 centres commerciaux ou pôles artisanaux de quartier depuis 2001. Les opérations associent plusieurs financeurs : au Mans, la restructuration d'un centre commercial (4,2 millions d'euros, 2023-2025) est financée par la métropole, l'ANCT, l'ANRU et le fonds de restructuration des locaux d'activité."),
  SRC("Mission sur l'avenir du commerce de proximité (2025)", "[S27, S28]"),
  P("La mission formule 30 recommandations en cinq axes ; le Gouvernement en retient neuf, dont le soutien aux foncières et aux managers de commerce, un outil de diagnostic de la vacance et un dispositif propre aux QPV."),
  H2("5.4 Les évaluations"),
  P("Les rapports convergent sur un point : l'évaluation des dispositifs est insuffisante (Sénat 2022 [S22], Cour des comptes 2022 et 2023 [S26, S23]). Un rapport IGF / IGEDD sur la revitalisation commerciale des centres-villes [S49] et le rapport de la Cour des comptes de mars 2026 sur le développement des activités commerciales en centre-ville [S48] n'ont pas pu être consultés en intégralité."),
);

// ---------- 6. Évolutions récentes
add(
  H1("6. Évolutions récentes : la périphérie elle-même en question"),
  P("Plusieurs sources récentes décrivent un essoufflement des zones commerciales elles-mêmes."),
  SRC("Cerema", "[S03]", "zones commerciales de périphérie"),
  P("Le chiffre d'affaires des zones serait en baisse et leur taux de vacance « aurait doublé entre 2007 et 2020 (de moins de 4 % à plus de 8 % en 2020) »."),
  SRC("Codata, cité par Procos (2025)", "[S09]"),
  P("La vacance des zones commerciales passe de 6,79 % en 2023 à 7,24 % en 2024. Elle est « quasi absente » des soixante plus grandes zones (4 %)."),
  SRC("FACT, cité dans le baromètre Icade × SCET (2026)", "[S11]", "zones commerciales"),
  P("Le taux de vacance des zones commerciales est de 6,9 % en 2021 et 2022, 7,4 % en 2023, 8,1 % en 2024, 8,4 % en 2025 et 8,5 % en 2026 ; il « se creuse depuis 2022 ». Le délégué général de la FACT décrit une hétérogénéité croissante : les zones leaders restent dynamiques, d'autres se fragilisent. Il appelle à « éviter toute opposition entre centre-ville et périphérie »."),
  SRC("Icade × SCET, baromètre des entrées de ville, 2e édition (2026)", "[S11]", "projets recensés en France métropolitaine ; sondage de 1 000 élus de communes de plus de 10 000 habitants"),
  P("Le baromètre recense 437 projets de transformation d'entrées de ville sur 8 606 hectares ; 56 % sont au stade de l'intention et 1 % sont achevés ; environ deux tiers sont initiés par des acteurs privés (65 % ou 66 % selon les pages), un tiers par des acteurs publics. Dans le sondage Quorum, 93 % des élus jugent les entrées de ville stratégiques ; 53 % citent le financement comme premier frein et 43 % la réglementation. L'équipement de la personne aurait perdu près de 14 000 établissements en dix ans (revue _Urbanisme_). Le journaliste Olivier Dauvers y estime que « la France est en surcapacité commerciale ». Le baromètre est publié par des acteurs de l'immobilier et son recensement n'est pas exhaustif."),
  SRC("Gouvernement (2023)", "[S08]"),
  P("Le dossier de presse insiste sur la diversité des zones : certaines sont très dynamiques, d'autres connaissent une forte vacance ; certaines sont en zone tendue, d'autres en territoire peu dense ou en décroissance. Il en conclut que les solutions de transformation ne peuvent pas être uniformes et doivent s'articuler avec la reconquête des centres-villes."),
  SRC("Cerema, friches en zones commerciales (2024)", "[S04]"),
  P("123 sites économiques à vocation commerciale (7 %) comportent au moins une friche ; environ 10 % de leur surface est en friche (409 hectares). Le Cerema y voit un « réservoir » pour des activités industrielles et logistiques."),
  SRC("Consommation d'espaces", "[S41, S10]"),
  P("Selon le portail national de l'artificialisation, 15 119 hectares d'espaces naturels, agricoles et forestiers ont été consommés en 2024, tous usages confondus, le plus bas niveau depuis 2011. Le rapport de la CNAC rappelle une moyenne de 24 315 hectares par an sur 2009-2023 (Cerema)."),
);

// ---------- 7. Lacunes
add(
  H1("7. Ce que la littérature ne permet pas encore d'établir"),
  P("Les sources rassemblées décrivent bien la divergence entre périphérie et centres, mais plusieurs questions restent sans réponse documentée :"),
  B("**L'effet propre de la périphérie.** Aucune étude publique française récente n'isole l'effet causal de l'ouverture d'une zone ou d'une grande surface sur le commerce d'un centre-ville voisin. Les rapports officiels établissent une corrélation et un mécanisme plausible, en le combinant avec le commerce en ligne et la démographie."),
  B("**Les QPV.** Il n'existe ni indicateur national de vacance commerciale en QPV, ni mesure de la part des achats des habitants réalisée en périphérie."),
  B("**Les surfaces et le chiffre d'affaires localisés.** Les chiffres de parts de marché (65 % de la surface, 67 %, 70 %, 72 % ou 75 % selon les sources et les champs) ne s'appuient pas sur une série publique unique et régulière."),
  B("**La vacance.** Les séries proviennent de panels privés (Codata, FACT) aux définitions différentes ; l'outil national de diagnostic annoncé en 2025 n'est pas encore disponible."),
  B("**L'évaluation des programmes.** Les effets d'Action Cœur de Ville, des ORT ou du plan de transformation des zones commerciales sur la vacance et l'emploi ne sont pas évalués de façon contrefactuelle."),
  P("L'onglet « Données manquantes » du classeur détaille, pour chaque lacune, les données qui permettraient de la combler, leur détenteur et leurs conditions d'accès."),
);

// ---------- Bibliographie
const fs2 = JSON.parse(fs.readFileSync(__dirname + "/sources.json", "utf8"));
add(H1("Références"));
const groups = {};
fs2.forEach((s) => { (groups[s[4]] = groups[s[4]] || []).push(s); });
Object.keys(groups).forEach((g) => {
  add(H2(g));
  groups[g].forEach((s) => {
    const kids = [new TextRun({ text: `[${s[0]}] `, color: GREY, size: 17 }), new TextRun({ text: fr(`${s[1]}, `), size: 19 }),
      new TextRun({ text: fr(s[2]), italics: true, size: 19 }), new TextRun({ text: fr(`, ${s[3]}.`), size: 19 })];
    if (s[5]) kids.push(new TextRun({ text: " ", size: 19 }), new ExternalHyperlink({ link: s[5], children: [new TextRun({ text: s[5], style: "Hyperlink", size: 17 })] }));
    add(new Paragraph({ children: kids, spacing: { after: 80 }, indent: { left: 360, hanging: 360 } }));
  });
});

const doc = new Document({
  creator: "OCDE – étude de cas France",
  title: "Zones commerciales périphériques, centres-villes et QPV : état de l'art",
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: NAVY }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: BAND }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "OCDE · Document de travail · État de l'art", size: 16, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((buf) => {
  const out = "/home/user/test/etat_de_l_art/etat_de_l_art_zones_commerciales_centres_villes_QPV.docx";
  fs.writeFileSync(out, buf); console.log(out);
});
