// Retail en France : les 12 personnes retenues pour les entretiens (double transition, centres et périphérie, frontières). Style sobre, A4 paysage.
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
  LevelFormat, Footer, Header, PageNumber, ExternalHyperlink, HeadingLevel, PageOrientation, ShadingType } = require("docx");

const OUT = path.join(__dirname, "liste_12_personnes_a_interviewer_retail_France.docx");
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

const L = {
  peix: "https://www.bpifrance.fr/nous-decouvrir/direction-generale/marie-adeline-peix",
  bonnet: "https://www.cci.fr/sites/g/files/mwbcuj1451/files/2025-04/CP%20-%20Nomination%20Nicolas%20Bonnet%20-%20directeur%20ge%CC%81ne%CC%81ral%20CCI%20France.pdf",
  petiot: "https://fashionunited.fr/actualite/retail/dialogue-social-lunion-du-grand-commerce-de-centre-ville-ucv-conserve-la-representativite-patronale/2026011240392",
  criquebec: "https://www.francenum.gouv.fr/guides-et-conseils/intelligence-artificielle/comprendre-et-adopter-lia/diag-data-ia-beneficiez-dun",
  moati: "https://www.ffbatiment.fr/actualites-batiment/actualite/prospective-consommation-modes-de-vie",
  gibert: "https://www.banquedesterritoires.fr/sites/default/files/2025-12/2025-12%2002%20Atelier%20foncieres%2018-VDEF.pdf",
  consille: "https://francevilledurable.fr/2025/10/28/interview-dominique-consille-directrice-des-programmes-action-coeur-de-ville-et-petites-villes-de-demain/",
  aubignat: "https://www.procos.org/",
  urrutia: "https://www.toute-la-franchise.com/article-commerce-cooperatif-associe-modele-solide-economie",
  marquet: "https://www.jds.fr/magazine/la-rencontre/frederic-marquet-maire-de-mulhouse-1501609_A",
  peyrony: "https://www.espaces-transfrontaliers.org/wp-content/uploads/2026/05/MOT_rapport_activite_2025.pdf",
};

// [nom, lien ou null, fonction, pourquoi, questions, en poste]
const AXES = [
  ["Double transition (numérique et écologique)", [
    ["Marie Adeline-Peix", L.peix, "Directrice exécutive partenariats régionaux et action territoriale, Bpifrance",
      "Financement de la transition écologique et de l'IA dans les PME, déploiement en région (Prêt Action Climat, plan Climat 2026, « Osez l'IA »)",
      "Part des commerçants parmi les bénéficiaires ? Freins au financement de la transition pour les TPE ? Rôle des régions ?", "Oui (2026)"],
    ["Nicolas Bonnet", L.bonnet, "Directeur général, CCI France", "Le réseau des 121 CCI accompagne la numérisation et la transition écologique des commerçants",
      "Quels dispositifs fonctionnent pour les TPE ? Quelles données locales les CCI détiennent-elles ?", "Oui (mai 2025)"],
    ["Yohann Petiot", L.petiot, "Directeur général, Alliance du Commerce ; délégué général de l'UCV (grands magasins, enseignes de mode)",
      "Co-rapporteur du rapport du CNC « Commerce français : accélérer la transition circulaire » (janv. 2026) ; voix des enseignes de centre-ville",
      "Coût de la mise en conformité environnementale ? Part du numérique dans les ventes ? Effet de la loi anti fast fashion ?", "Oui (janv. 2026)"],
    ["Vincent Criquebec", L.criquebec, "Responsable du programme Diag Data IA, Bpifrance Conseil (plan « Osez l'IA », France 2030)",
      "Seul interlocuteur opérationnel du plan d'adoption de l'IA par les PME",
      "Combien de commerces ont fait le diagnostic ? Quels usages de l'IA dans le commerce ? Pourquoi si peu de TPE ?", "**À vérifier** (2024)"],
    ["Philippe Moati", L.moati, "Co-fondateur de L'ObSoCo ; professeur à l'université Paris Cité",
      "Chercheur sur les transformations de la consommation : sobriété (Consommer sans détruire, 2025) et plateformisation",
      "Les consommateurs reviennent-ils vers le commerce de proximité ? Effet des plateformes sur les centres et les périphéries ?", "Oui (2025)"],
  ]],
  ["Centres-villes et zones commerciales périphériques", [
    ["Frédéric Gibert", L.gibert, "Responsable du programme Action cœur de ville et du plan commerce, Banque des Territoires",
      "Plan commerce, foncières de redynamisation (93 au capital de la Banque des Territoires), priorité aux entrées de ville",
      "Bilan des foncières ? Financement de la reconversion des entrées de ville ? Suites du rapport sur le commerce de proximité ?", "Oui (déc. 2025)"],
    ["Dominique Consille", L.consille, "Directrice des programmes Action cœur de ville et Petites villes de demain, ANCT",
      "Bilan d'Action cœur de ville 2 (fin 2026), nouvelle vague du programme, lien avec le plan de transformation des zones commerciales",
      "Quels résultats sur la vacance commerciale ? Que change la nouvelle vague pour les entrées de ville ?", "**À vérifier**"],
    ["Julien Aubignat", L.aubignat, "Délégué général, Procos (commerce spécialisé)", "Panel des enseignes spécialisées : vacance et loyers par type d'emplacement",
      "Écart de performance centre / périphérie ? Les enseignes reviennent-elles en centre-ville ?", "Oui (juin 2026)"],
    ["Olivier Urrutia", L.urrutia, "Délégué général, Fédération du commerce coopératif et associé",
      "Ses membres (Leclerc, Intermarché, Système U, Intersport…) occupent l'essentiel des zones périphériques",
      "Projets de réduction ou de mixité des surfaces ? Formats de proximité en centre-ville ? Transition énergétique des magasins ?", "Oui (2025)"],
  ]],
  ["Zones frontalières", [
    ["Frédéric Marquet", L.marquet, "Maire de Mulhouse depuis mars 2026 ; manager du commerce de la ville de 2011 à 2024",
      "A piloté la relance du centre de Mulhouse, ville proche de Bâle et de l'Allemagne",
      "Recettes de la relance ? Concurrence des achats en Suisse et en Allemagne ?", "Oui (mars 2026)"],
    ["Jean Peyrony", L.peyrony, "Directeur général, Mission opérationnelle transfrontalière (MOT)",
      "Instance nationale des territoires transfrontaliers : vue d'ensemble de toutes les frontières",
      "Données sur les flux de consommation ? Frontières les plus touchées ? Bonnes pratiques européennes ?", "Oui (mai 2026)"],
    ["Danièle Schmitt", null, "CCI Alsace Eurométropole (point de contact)", "Achats transfrontaliers entre l'Alsace et le Bade-Wurtemberg (Kehl, Strasbourg)",
      "Volume des achats des Français en Allemagne ? Effet des écarts de prix et de TVA ? Données CCI ?", "Contact fourni"],
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

// Remplaçants
const RW = [2300, 4600, 3000, 5237];
const REMP = [
  ["Pascal Madry", "Directeur, Institut pour la ville et le commerce", "Périphérie", "Spécialiste de la surcapacité commerciale (« obésité commerciale ») ; poste à vérifier"],
  ["Sylvain Grisot", "Urbaniste, fondateur de dixit.net", "Périphérie et transition écologique", "Reconversion des zones commerciales sans nouvelle artificialisation"],
  ["Hélène Yildiz", "Université de Lorraine", "Frontières", "Recherche sur les comportements d'achat en zone transfrontalière (Grande Région)"],
  ["Pierre Cuny", "Maire de Thionville, réélu en mars 2026", "Frontières", "Ville Action cœur de ville au cœur du bassin des frontaliers du Luxembourg"],
  ["Judith Jiguet", "Déléguée générale, FCD (grande distribution)", "Périphérie", "Les hypermarchés, cœur des zones périphériques"],
];
const rh = (t, w) => hcell(t, w);
const remp = new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: RW, rows: [
  new TableRow({ tableHeader: true, children: ["Personne", "Fonction et organisation", "Axe", "Apport"].map((t, i) => rh(t, RW[i])) }),
  ...REMP.map((r, k) => new TableRow({ cantSplit: true, children: r.map((t, i) => new TableCell({ width: { size: RW[i], type: WidthType.DXA },
    borders: { top: none, bottom: k === REMP.length - 1 ? line(INK, 8) : line(SOFT), left: none, right: none }, margins: m,
    children: [new Paragraph({ children: runs(t, { size: 17, bold: i === 0 || undefined, color: INK }) })] })) })),
] });

const p = (t, o = {}) => new Paragraph({ spacing: { after: 100, line: 264 }, children: runs(t, { size: 18, ...o }) });
const li = (t) => new Paragraph({ numbering: { reference: "dash", level: 0 }, spacing: { after: 50, line: 252 }, children: runs(t, { size: 18 }) });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(fr(t))] });
const src = (label, url) => new Paragraph({ numbering: { reference: "src", level: 0 }, spacing: { after: 40 },
  children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: fr(label), style: "Hyperlink", size: 16 })] })] });

const body = [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "OCDE – Étude de cas France", size: 16, color: GREY })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr("Retail en France : les 12 personnes à interviewer"), size: 32, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 200 }, border: { bottom: line(INK, 6) }, children: [new TextRun({ text: fr("Double transition · centres-villes et zones périphériques · zones frontalières · 9 octobre 2026 · Document de travail"), size: 18, color: GREY })] }),
  p("Douze personnes réparties sur les trois axes du rapport : cinq sur la double transition, quatre sur les centres-villes et les zones périphériques, trois sur les zones frontalières. Frédéric Marquet couvre à la fois les frontières et la relance d'un centre-ville."),
  p("Neuf sont confirmées dans leur poste en 2026 ou fin 2025 ; deux restent à vérifier (Dominique Consille, Vincent Criquebec) ; Danièle Schmitt est un contact fourni directement. Chaque nom souligné renvoie à la page qui confirme sa fonction.", { color: GREY, size: 17 }),
  table,
  h1("Remplaçants"),
  p("Par ordre de préférence, si une personne ne répond pas ou n'est plus en poste :", { color: GREY, size: 17 }),
  remp,
  h1("Points d'attention"),
  li("**Deux interlocuteurs Bpifrance** (Marie Adeline-Peix et Vincent Criquebec) : leurs angles diffèrent, mais un entretien commun est possible pour libérer une place."),
  li("**Dominique Consille** : en poste à l'ANCT en octobre 2025, mais son profil public mentionne désormais le ministère de l'Intérieur ; à défaut, demander son successeur à l'ANCT."),
  li("**Vincent Criquebec** : la dernière source qui le cite à ce poste date de 2024."),
  li("**À solliciter par la DGE**, sans les compter dans les 12 : Guillaume Avrin (coordinateur national pour l'IA) et l'équipe du plan de transformation des zones commerciales."),
  h1("Sources"),
  p("Vérifications faites par recherche web le 9 octobre 2026.", { color: GREY, size: 17 }),
  src("Bpifrance, page de Marie Adeline-Peix", L.peix),
  src("CCI France, nomination de Nicolas Bonnet, avril 2025", L.bonnet),
  src("FashionUnited, UCV et Alliance du Commerce, janvier 2026", L.petiot),
  src("Conseil national du commerce, Commerce français : accélérer la transition circulaire, janvier 2026", "https://www.entreprises.gouv.fr/files/files/Publications/2026/rapports/rapport-cnc-accelerer-commerce-circulaire.pdf"),
  src("France Num, Diag Data IA (Vincent Criquebec)", L.criquebec),
  src("FFB, interview de Philippe Moati, mars 2025", L.moati),
  src("Banque des Territoires, atelier des foncières de redynamisation, décembre 2025", L.gibert),
  src("France Villes Durables, interview de Dominique Consille, octobre 2025", L.consille),
  src("Procos, site officiel", L.aubignat),
  src("Toute la franchise, commerce coopératif et associé, 2025", L.urrutia),
  src("JDS, Frédéric Marquet maire de Mulhouse", L.marquet),
  src("MOT, rapport d'activité 2025, mai 2026", L.peyrony),
];

const bullet = (ref, size, left) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
  style: { run: { color: GREY, size }, paragraph: { indent: { left, hanging: 220 } } } }] });
const hdr = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Retail en France : 12 personnes à interviewer · Document de travail"), size: 15, color: GREY })] })] });
const ftr = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] });
const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Retail en France : les 12 personnes à interviewer",
  styles: { default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: INK, font: "Arial" }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 0 } }] },
  numbering: { config: [bullet("dash", 18, 300), bullet("src", 16, 300)] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    headers: { default: hdr }, footers: { default: ftr }, children: body }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
