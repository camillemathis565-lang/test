// Retail en France : 15 personnes à interviewer (double transition, zones périphériques, zones frontalières). Style sobre, A4 paysage.
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
  LevelFormat, Footer, Header, PageNumber, ExternalHyperlink, HeadingLevel, PageOrientation, ShadingType } = require("docx");

const OUT = path.join(__dirname, "personnes_a_interviewer_retail_France.docx");
const INK = "1A1A1A", GREY = "666666", SOFT = "D9D9D9", BAND = "F2F2F2";
const fr = (s) => s.replace(/ ([:;!?%»])/g, " $1").replace(/« /g, "« ").replace(/(\d) (\d{3})/g, "$1 $2");
function runs(text, base = {}) {
  const out = [], re = /(\*\*[^*]+\*\*)/g, t = fr(text); let last = 0, m;
  while ((m = re.exec(t))) { if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    out.push(new TextRun({ text: m[0].slice(2, -2), bold: true, ...base })); last = m.index + m[0].length; }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });

// [nom, lien ou null, fonction, pourquoi, questions, en poste]
const AXES = [
  ["Double transition (numérique et écologique)", [
    ["Yohann Petiot", "https://fashionunited.fr/actualite/retail/dialogue-social-lunion-du-grand-commerce-de-centre-ville-ucv-conserve-la-representativite-patronale/2026011240392",
      "Directeur général, Alliance du Commerce ; délégué général de l'UCV (grands magasins, enseignes de mode)", "Voix des enseignes de centre-ville face à l'e-commerce et à l'ultra fast fashion",
      "Coût de la mise en conformité environnementale ? Part du numérique dans les ventes ? Effet de la loi anti fast fashion ?", "Oui (janv. 2026)"],
    ["Nicolas Bonnet", "https://www.cci.fr/sites/g/files/mwbcuj1451/files/2025-04/CP%20-%20Nomination%20Nicolas%20Bonnet%20-%20directeur%20ge%CC%81ne%CC%81ral%20CCI%20France.pdf",
      "Directeur général, CCI France", "Le réseau des 121 CCI accompagne la numérisation et la transition écologique des commerçants",
      "Quels dispositifs fonctionnent pour les TPE ? Quelles données locales les CCI détiennent-elles ?", "Oui (mai 2025)"],
    ["Joël Fourny", "https://www.assemblee-nationale.fr/dyn/17/organes/commissions-permanentes/affaires-economiques/actualites/audition-du-president-de-cma-france",
      "Président, CMA France (chambres de métiers et de l'artisanat)", "Artisans et commerce alimentaire de proximité : énergie, déchets, vente en ligne",
      "Quels freins à la double transition pour les artisans ? Quelles aides sont utilisées ?", "Oui (sept. 2026)"],
    ["Gildas Minvielle", "https://www.lsa-conso.fr/mode-les-ventes-risquent-de-baisser-a-nouveau-en-2026-selon-les-previsions-de-l-institut-francais-de-la-mode,463424",
      "Directeur de l'observatoire économique, Institut français de la mode", "Données de panel sur la fréquentation des magasins et le report vers le numérique (mode −1,3 % sur 9 mois en 2025)",
      "Fréquentation : centre ou périphérie ? Part de l'ultra fast fashion ? Seconde main ?", "Oui (nov. 2025)"],
    ["Marc Lolivier", null, "Délégué général, Fevad (fédération du e-commerce)", "Chiffres de référence du e-commerce et du click-and-collect",
      "Concurrence ou complémentarité avec le commerce physique ? Logistique du dernier kilomètre ?", "**À vérifier**"],
  ]],
  ["Zones commerciales périphériques", [
    ["Julien Aubignat", "https://www.procos.org/", "Délégué général, Procos (commerce spécialisé)", "Panel des enseignes spécialisées : vacance et loyers par type d'emplacement",
      "Écart de performance centre / périphérie ? Les enseignes reviennent-elles en centre-ville ?", "Oui (juin 2026)"],
    ["Judith Jiguet", "https://www.fcd.fr/media/filer_public/20/89/2089e9fe-2b5f-4499-83ee-3987251588c8/fcd_ra_200625_vf.pdf",
      "Déléguée générale, FCD (grande distribution)", "Les hypermarchés sont le cœur des zones périphériques",
      "Réduction des surfaces ? Projets de mixité (logement) sur les parkings ? Effet du ZAN ?", "Oui (depuis 2025)"],
    ["Marie Cheval", "https://www.lsa-conso.fr/marie-cheval-reelue-presidente-de-la-fact,456461",
      "Présidente, FACT (propriétaires de centres et parcs commerciaux) ; PDG de Carmila", "Propriétaires des zones : leurs plans de reconversion décident du devenir des entrées de ville",
      "Combien de m² à reconvertir ? Modèle économique de la mixité ? Partage de données de fréquentation ?", "**À vérifier** (mandat 2024-2026)"],
    ["Sylvain Grisot", "https://www.lecese.fr/print/pdf/node/14980",
      "Urbaniste, fondateur de dixit.net ; auteur du Manifeste pour un urbanisme circulaire", "Transformation des zones commerciales sans nouvelle artificialisation",
      "Exemples réussis de reconversion ? Obstacles juridiques et fonciers ?", "Oui"],
    ["David Lestoux", "https://www.objectifgard.com/actualites/gard-la-cci-invite-les-commercants-a-preparer-des-aujourdhui-le-commerce-de-demain-165411.php",
      "Directeur, Agence LA ! (fondateur de Lestoux & Associés)", "Conseil auprès de nombreuses collectivités sur l'équilibre centre / périphérie",
      "Quels outils d'urbanisme freinent vraiment la périphérie ? Exemples de villes moyennes ?", "Oui (juin 2026)"],
  ]],
  ["Zones frontalières", [
    ["Danièle Schmitt", null, "Point de contact, CCI Alsace Eurométropole", "Achats transfrontaliers entre l'Alsace et le Bade-Wurtemberg (Kehl, Strasbourg)",
      "Volume des achats des Français en Allemagne ? Effet des écarts de prix et de TVA ? Données CCI ?", "Contact fourni"],
    ["Liederik Cordonni", null, "Point de contact, Kernpunt (Belgique)", "Regard flamand : la Flandre fait du renforcement des centres le principe de sa politique commerciale depuis 2021",
      "Quels outils transposables en France ? Flux d'achats avec les Hauts-de-France ?", "Contact fourni"],
    ["Frédéric Marquet", "https://www.jds.fr/magazine/la-rencontre/frederic-marquet-maire-de-mulhouse-1501609_A",
      "Maire de Mulhouse depuis mars 2026 ; manager du commerce de la ville de 2011 à 2024", "A piloté la relance du centre de Mulhouse, ville proche de Bâle et de l'Allemagne",
      "Recettes de la relance ? Concurrence des achats en Suisse et en Allemagne ?", "Oui (mars 2026)"],
    ["Pierre Cuny", "https://www.resultats-elections.interieur.gouv.fr/municipales2026/ensemble_geographique/44/57/57672/",
      "Maire de Thionville (ville Action cœur de ville), réélu en mars 2026", "Bassin de travailleurs frontaliers vers le Luxembourg : effet sur le commerce local",
      "Où consomment les frontaliers ? Stratégie du centre-ville face au Luxembourg ?", "Oui (mars 2026)"],
    ["Jean Peyrony", "https://www.espaces-transfrontaliers.org/wp-content/uploads/2026/05/MOT_rapport_activite_2025.pdf",
      "Directeur général, Mission opérationnelle transfrontalière (MOT)", "Instance nationale des territoires transfrontaliers : vue d'ensemble de toutes les frontières",
      "Données sur les flux de consommation ? Frontières les plus touchées ? Bonnes pratiques européennes ?", "Oui (mai 2026)"],
  ]],
];

const W = 15137, WID = [2300, 3300, 3700, 4237, 1600];
const COLS = ["Personne", "Fonction et organisation", "Pourquoi l'interviewer", "Questions clés", "En poste"];
const m = { top: 80, bottom: 80, left: 100, right: 100 };
const hcell = (t, w) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: line(INK, 8), bottom: line(INK, 4), left: none, right: none },
  margins: m, children: [new Paragraph({ children: [new TextRun({ text: fr(t), bold: true, size: 17, color: INK })] })] });
const rows = [new TableRow({ tableHeader: true, children: COLS.map((t, i) => hcell(t, WID[i])) })];
let n = 0;
AXES.forEach(([axe, people], a) => {
  rows.push(new TableRow({ cantSplit: true, children: [new TableCell({ columnSpan: 5, width: { size: W, type: WidthType.DXA },
    shading: { fill: BAND, type: ShadingType.CLEAR, color: "auto" }, borders: { top: none, bottom: line(SOFT), left: none, right: none }, margins: m,
    children: [new Paragraph({ keepNext: true, children: [new TextRun({ text: fr(axe), bold: true, size: 17, color: INK })] })] })] }));
  people.forEach(([nom, url, fonction, pourquoi, questions, poste], k) => {
    n++;
    const last = a === AXES.length - 1 && k === people.length - 1;
    const b = { top: none, bottom: last ? line(INK, 8) : line(SOFT), left: none, right: none };
    const name = url ? [new ExternalHyperlink({ link: url, children: [new TextRun({ text: `${n}. ${nom}`, bold: true, size: 18, color: INK, underline: {} })] })]
                     : [new TextRun({ text: `${n}. ${nom}`, bold: true, size: 18, color: INK })];
    const cell = (i, children) => new TableCell({ width: { size: WID[i], type: WidthType.DXA }, borders: b, margins: m, children });
    rows.push(new TableRow({ cantSplit: true, children: [
      cell(0, [new Paragraph({ children: name })]),
      cell(1, [new Paragraph({ children: runs(fonction, { size: 17 }) })]),
      cell(2, [new Paragraph({ children: runs(pourquoi, { size: 17 }) })]),
      cell(3, [new Paragraph({ children: runs(questions, { size: 17, color: INK }) })]),
      cell(4, [new Paragraph({ children: runs(poste, { size: 16, color: GREY }) })]),
    ] }));
  });
});
const table = new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: WID, rows });

const p = (t, o = {}) => new Paragraph({ spacing: { after: 100, line: 264 }, children: runs(t, { size: 18, ...o }) });
const li = (ref, t, level = 0) => new Paragraph({ numbering: { reference: ref, level }, spacing: { after: 50, line: 252 }, children: runs(t, { size: 18 }) });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(fr(t))] });
const src = (label, url) => new Paragraph({ numbering: { reference: "src", level: 0 }, spacing: { after: 40 },
  children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: fr(label), style: "Hyperlink", size: 16 })] })] });

const body = [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "OCDE – Étude de cas France", size: 16, color: GREY })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr("Retail en France : personnes à interviewer"), size: 32, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 200 }, border: { bottom: line(INK, 6) }, children: [new TextRun({ text: fr("Double transition · zones commerciales périphériques · zones frontalières · 9 octobre 2026 · Document de travail"), size: 18, color: GREY })] }),
  h1("Objet et critères"),
  p("Quinze personnes à interviewer pour le rapport OCDE sur le commerce de détail en France, réparties sur les trois axes de l'étude : cinq par axe."),
  li("dash", "**Double transition (numérique et écologique)** : fédérations d'enseignes, réseau consulaire, e-commerce, observatoires de la consommation."),
  li("dash", "**Zones commerciales périphériques** : propriétaires et exploitants de zones, grande distribution, experts de la transformation des entrées de ville et de la sobriété foncière."),
  li("dash", "**Zones frontalières** : acteurs de terrain le long des frontières allemande, suisse, belge et luxembourgeoise, et instance nationale de coopération transfrontalière."),
  p("Trois critères ont guidé le choix : la personne détient une donnée ou une expérience que les sources publiques n'apportent pas ; elle est en poste aujourd'hui (vérifié en octobre 2026, après les municipales de mars 2026) ; elle est accessible sans passer par la DGE, commanditaire de l'étude."),
  h1("Les 15 personnes"),
  p("Onze personnes sont confirmées dans leur poste ; deux sont des contacts fournis directement ; deux restent à vérifier avant prise de contact (colonne « En poste »). Chaque nom souligné renvoie à la page qui confirme sa fonction.", { color: GREY, size: 17 }),
  table,
  h1("Ordre de priorité"),
  p("Commencer par les cinq entretiens qui couvrent chacun deux axes ou apportent des données introuvables ailleurs :"),
  li("num", "**Frédéric Marquet (Mulhouse)** : relance d'un centre-ville et concurrence frontalière, vues à la fois comme manager du commerce et comme maire."),
  li("num", "**Julien Aubignat (Procos)** : seules données d'enseignes comparant centre et périphérie."),
  li("num", "**Jean Peyrony (MOT)** : cadrage de l'axe frontalier avant les entretiens de terrain."),
  li("num", "**Marie Cheval (FACT)** ou son successeur : avenir des zones périphériques vu par leurs propriétaires."),
  li("num", "**Yohann Petiot (Alliance du Commerce)** : double transition vue par les enseignes."),
  p("Les dix autres entretiens viennent ensuite, en commençant par les contacts déjà identifiés (Danièle Schmitt, Liederik Cordonni)."),
  h1("Points d'attention"),
  li("dash", "**FACT** : le mandat de Marie Cheval (2024-2026) arrivait à échéance en juin 2026 ; le résultat de l'assemblée générale 2026 n'a pas été trouvé."),
  li("dash", "**Fevad** : Marc Lolivier en est délégué général depuis de nombreuses années, mais aucune source de 2026 ne le confirme."),
  li("dash", "**Kernpunt** : la fonction de Liederik Cordonni et la mission exacte de Kernpunt sont à préciser."),
  li("dash", "**Instances renouvelées** : beaucoup de présidences d'agglomération et d'associations ont changé après les municipales de mars 2026 ; vérifier la fonction exacte au moment de la prise de contact."),
  h1("Sources"),
  p("Vérifications faites par recherche web le 9 octobre 2026.", { color: GREY, size: 17 }),
  src("FashionUnited, UCV et Alliance du Commerce, janvier 2026", AXES[0][1][0][1]),
  src("CCI France, nomination de Nicolas Bonnet, avril 2025", AXES[0][1][1][1]),
  src("Assemblée nationale, audition du président de CMA France, septembre 2026", AXES[0][1][2][1]),
  src("LSA, prévisions de l'Institut français de la mode, novembre 2025", AXES[0][1][3][1]),
  src("Procos, site officiel", AXES[1][1][0][1]),
  src("FCD, rapport annuel", AXES[1][1][1][1]),
  src("LSA, Marie Cheval réélue présidente de la FACT, juin 2024", AXES[1][1][2][1]),
  src("CESE, audition de Sylvain Grisot", AXES[1][1][3][1]),
  src("Objectif Gard, conférence de David Lestoux, juin 2026", AXES[1][1][4][1]),
  src("JDS, Frédéric Marquet maire de Mulhouse", AXES[2][1][2][1]),
  src("Ministère de l'Intérieur, résultats des municipales 2026 à Thionville", AXES[2][1][3][1]),
  src("MOT, rapport d'activité 2025, mai 2026", AXES[2][1][4][1]),
  src("VLAIO, politique flamande de renforcement des centres", "https://www.vlaio.be/nl/vlaio-netwerk/detailhandel/detailhandelsbeleid"),
];

const bullet = (ref, size, left) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
  style: { run: { color: GREY, size }, paragraph: { indent: { left, hanging: 220 } } } }] });
const hdr = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Retail en France : personnes à interviewer · Document de travail"), size: 15, color: GREY })] })] });
const ftr = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] });
const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Retail en France : personnes à interviewer",
  styles: { default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: INK, font: "Arial" }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 0 } }] },
  numbering: { config: [bullet("dash", 18, 300), bullet("src", 16, 300),
    { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    headers: { default: hdr }, footers: { default: ftr }, children: body }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
