// Proposition de missions d'entretiens (8 villes ACV) : tableau descriptif + tableau de comparaison. Style sobre.
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
  LevelFormat, Footer, Header, PageNumber, ExternalHyperlink, HeadingLevel, PageOrientation, VerticalAlign, ShadingType } = require("docx");

const OUT = path.join(__dirname, "proposition_missions_entretiens_8_villes_ACV.docx");
const INK = "1A1A1A", GREY = "666666", SOFT = "D9D9D9", BAND = "F2F2F2";
const fr = (s) => s.replace(/ ([:;!?%»])/g, " $1").replace(/« /g, "« ").replace(/(\d) (\d{3})/g, "$1 $2").replace(/ (pts?|km|hab\.)\b/g, " $1");
function runs(text, base = {}) {
  const out = [], re = /(\*\*[^*]+\*\*)/g, t = fr(text); let last = 0, m;
  while ((m = re.exec(t))) { if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    out.push(new TextRun({ text: m[0].slice(2, -2), bold: true, ...base })); last = m.index + m[0].length; }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });

// ---------- Tableau 1 : description des villes ----------
const VILLES = [
  ["Bressuire", "19 900 hab.", "Nouvelle-Aquitaine", "La plus forte baisse durable de vacance commerciale mesurée parmi les villes du programme.", [
    "Vacance commerciale du centre-ville divisée par deux : **17,9 % en 2019, 8,6 % en 2025** (−9,3 points), avec une baisse presque chaque année (baromètre Codata 2026). La moyenne des communes Action Cœur de Ville est de 14,5 % en 2025 (atlas ANCT).",
    "Le recul des commerces employeurs s'est presque arrêté : 50 en 2012, 43 en 2019, 42 en 2025.",
    "Habitat attractif : moins de 3 % de logements vides depuis deux ans ou plus, ventes immobilières en hausse depuis 2018.",
    "Démarches du programme : accompagnement en transition écologique (Cerema et ANCT), design actif."]],
  ["Sète et Frontignan", "44 700 et 23 800 hab.", "Occitanie", "La réussite la plus solide : le commerce de centre-ville repart et la vacance est basse, à l'échelle du bassin de Thau.", [
    "Sète : **180 commerces employeurs en 2012, 153 en 2019, 174 en 2025** (+14 % depuis 2019). L'ensemble des établissements progresse aussi (+3 %).",
    "Vacance commerciale en baisse de 4,4 points entre 2018 et 2022 (FACT et Codata), entre 5 et 10 % en 2025.",
    "Habitat : 3 à 4 % de logements vides depuis deux ans ou plus, ventes en hausse.",
    "L'agglomération Sète Agglopôle Méditerranée est **territoire pilote de sobriété foncière depuis 2020** : elle cherche à limiter l'étalement urbain.",
    "Frontignan, voisine : **vacance commerciale sous 5 %**, moins de 3 % de logements vides, ventes en hausse, commerces en légère hausse (30 → 33)."]],
  ["Creil", "36 100 hab.", "Hauts-de-France", "Le plus fort rebond du commerce de centre-ville parmi les 228 villes du programme.", [
    "Commerces employeurs : 59 en 2012, 40 en 2019 (−32 %), **55 en 2025 (+38 %)**. L'ensemble des établissements progresse de 13 %.",
    "Vacance commerciale entre 10 et 15 % en 2025.",
    "Population en hausse (+3 % entre 2014 et 2020), ventes immobilières en hausse.",
    "Démarches du programme : transition écologique, design actif."]],
  ["Draguignan", "39 700 hab.", "Provence-Alpes-Côte d'Azur", "Un déclin enrayé par une stratégie sur plusieurs axes : patrimoine, foncier, commerce.", [
    "Commerces employeurs : 138 en 2012, 95 en 2019 (−31 %), **91 en 2025 (−4 %)** : le recul s'est presque arrêté, et l'ensemble des établissements est stable.",
    "Vacance commerciale entre 10 et 15 % en 2025.",
    "Habitat : 3 à 4 % de logements vides, ventes en hausse.",
    "**Lauréat de « Réinventons nos cœurs de ville »** (reconversion d'un site patrimonial vacant) et **territoire pilote de sobriété foncière depuis 2020** (Dracénie Provence Verdon Agglomération)."]],
  ["Vitry-le-François", "11 500 hab.", "Grand Est", "Le commerce repart alors que la ville perd des habitants.", [
    "Commerces employeurs : 56 en 2012, 41 en 2019 (−27 %), **50 en 2025 (+22 %)**. L'ensemble des établissements progresse aussi (+9 %).",
    "Vacance commerciale entre 5 et 10 % en 2025.",
    "Contexte défavorable : population en forte baisse (−12,8 % entre 2014 et 2020) et vacance des logements élevée (plus de 7 %)."]],
  ["Vitré", "19 000 hab.", "Bretagne", "Un centre qui tient, porté par une population en hausse.", [
    "Commerces employeurs : 55 en 2012, 48 en 2019, 46 en 2025 : le recul a nettement ralenti (−13 % avant 2019, **−4 % depuis**).",
    "**Moins de 3 % de logements vides** et population en hausse (+5,9 % entre 2014 et 2020).",
    "Vacance commerciale entre 10 et 15 % en 2025.",
    "Démarches du programme : transition écologique, design actif."]],
  ["Poissy", "40 000 hab.", "Île-de-France", "Un centre-ville qui gagne des commerces depuis 2012 et compte parmi les plus fréquentés du programme.", [
    "Commerces employeurs : 79 en 2012, 81 en 2019, **85 en 2025** : hausse continue.",
    "**Environ 2,55 millions de visites par mois** en 2022-2023 (MyTraffic), 5e centre le plus fréquenté des villes ACV.",
    "Vacance commerciale entre 5 et 10 % en 2025, moins de 3 % de logements vides.",
    "Population en forte hausse : +7,4 % entre 2014 et 2020. Démarche du programme : transition écologique."]],
  ["Lorient", "57 800 hab.", "Bretagne", "Une ville qui mise sur l'habitat et la sobriété foncière, avec un centre qui résiste mieux que la moyenne.", [
    "Commerces employeurs : 272 en 2012, 258 en 2019, 243 en 2025. Le recul est modéré (−6 % depuis 2019, contre −9 % en moyenne dans les villes du programme).",
    "Vacance commerciale entre 10 et 15 % en 2025 ; **moins de 3 % de logements vides**, ventes immobilières en hausse.",
    "**Territoire pilote de sobriété foncière depuis 2022** (l'un des 11 en France) ; accompagnée en transition écologique."]],
];
const W1 = 9638, WID1 = [1800, 1500, 6338];
const hcell = (t, w) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: line(INK, 8), bottom: line(INK, 4), left: none, right: none },
  margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: fr(t), bold: true, size: 18, color: INK })] })] });
const table1 = new Table({ width: { size: W1, type: WidthType.DXA }, columnWidths: WID1, rows: [
  new TableRow({ tableHeader: true, children: ["Ville", "Région", "Pourquoi"].map((t, i) => hcell(t, WID1[i])) }),
  ...VILLES.map(([ville, pop, region, lead, items], k) => {
    const b = { top: none, bottom: k === VILLES.length - 1 ? line(INK, 8) : line(SOFT), left: none, right: none }, m = { top: 100, bottom: 100, left: 100, right: 100 };
    return new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: WID1[0], type: WidthType.DXA }, borders: b, margins: m, children: [
        new Paragraph({ children: [new TextRun({ text: fr(ville), bold: true, size: 20, color: INK })] }),
        new Paragraph({ children: [new TextRun({ text: fr(pop), size: 16, color: GREY })] })] }),
      new TableCell({ width: { size: WID1[1], type: WidthType.DXA }, borders: b, margins: m, children: [new Paragraph({ children: runs(region, { size: 18 }) })] }),
      new TableCell({ width: { size: WID1[2], type: WidthType.DXA }, borders: b, margins: m, children: [
        new Paragraph({ spacing: { after: 60 }, children: runs(lead, { bold: true, size: 18, color: INK }) }),
        ...items.map((t) => new Paragraph({ numbering: { reference: "cell", level: 0 }, spacing: { after: 40, line: 252 }, children: runs(t, { size: 17 }) }))] }),
    ] });
  })] });

// ---------- Tableau 2 : comparaison ----------
const COLS = ["Indicateur", "Bressuire", "Sète", "Creil", "Draguignan", "Vitry-le-F.", "Vitré", "Poissy", "Lorient", "Moyenne ACV"];
const W2 = 15137, WID2 = [2737, 1300, 1300, 1300, 1400, 1300, 1300, 1300, 1300, 1400];
const ROWS = [ // ** = meilleure valeur de la ligne
  ["Population (habitants)", "19 900", "44 700", "36 100", "39 700", "11 500", "19 000", "40 000", "57 800", "–"],
  ["Commerces employeurs 2012-2019", "−14 %", "−15 %", "−32 %", "−31 %", "−27 %", "−13 %", "**+3 %**", "−5 %", "−12 %"],
  ["Commerces employeurs 2019-2025", "−2 %", "+14 %", "**+38 %**", "−4 %", "+22 %", "−4 %", "+5 %", "−6 %", "−9 %"],
  ["Ensemble des établissements 2019-2025", "−5 %", "+3 %", "**+13 %**", "stable", "+9 %", "−5 %", "−2 %", "−5 %", "–"],
  ["Vacance commerciale 2025", "**8,6 %**", "5-10 %", "10-15 %", "10-15 %", "5-10 %", "10-15 %", "5-10 %", "10-15 %", "14,5 %"],
  ["Baisse de vacance mesurée", "**−9,3 pts** (2019-2025)", "−4,4 pts (2018-2022)", "–", "–", "–", "–", "–", "–", "–"],
  ["Logements vides depuis 2 ans ou plus (2025)", "**< 3 %**", "3-4 %", "5-7 %", "3-4 %", "> 7 %", "**< 3 %**", "**< 3 %**", "**< 3 %**", "–"],
  ["Ventes immobilières depuis 2018", "Hausse", "Hausse", "Hausse", "Hausse", "Baisse", "Baisse", "n.d.", "Hausse", "54 % en hausse"],
  ["Population 2014-2020", "+2,9 %", "+1,0 %", "+3,0 %", "−1,5 %", "−12,8 %", "+5,9 %", "**+7,4 %**", "−0,4 %", "–"],
  ["Démarches du programme", "Transition, design actif", "Sobriété foncière", "Transition, design actif", "Réinventons, sobriété foncière", "Aucune", "Transition, design actif", "Transition", "Sobriété foncière, transition", "–"],
  ["Fréquentation (MyTraffic)", "–", "–", "–", "–", "–", "–", "**2,55 M visites/mois**", "–", "–"],
  ["Score final (sur 12,5)", "**8,5**", "8,0", "6,0", "5,5", "5,5", "5,0", "5,0", "3,5", "–"],
];
const c2 = (t, i, k, head) => new TableCell({
  width: { size: WID2[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
  shading: (!head && i === COLS.length - 1) ? { type: ShadingType.CLEAR, color: "auto", fill: BAND } : undefined,
  borders: { top: head ? line(INK, 8) : none, bottom: head ? line(INK, 4) : k === ROWS.length - 1 ? line(INK, 8) : line(SOFT), left: none, right: none },
  margins: { top: 60, bottom: 60, left: 70, right: 70 },
  children: [new Paragraph({ alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, children: runs(t, { size: 16, bold: (head || i === 0) || undefined, color: INK }) })] });
const table2 = new Table({ width: { size: W2, type: WidthType.DXA }, columnWidths: WID2, rows: [
  new TableRow({ tableHeader: true, children: COLS.map((t, i) => c2(t, i, -1, true)) }),
  ...ROWS.map((r, k) => new TableRow({ cantSplit: true, children: r.map((t, i) => c2(t, i, k, false)) }))] });

const small = (t) => new Paragraph({ spacing: { before: 80, after: 60, line: 252 }, children: runs(t, { size: 15, color: GREY }) });
const link = (label, url, tail = "") => new Paragraph({ numbering: { reference: "src", level: 0 }, spacing: { after: 40 },
  children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: fr(label), style: "Hyperlink", size: 16 })] }), ...runs(tail, { size: 16 })] });
const title = (t, sub) => [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "OCDE – Étude de cas France – Proposition à la DGE", size: 16, color: GREY })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr(t), size: 32, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 200 }, border: { bottom: line(INK, 6) }, children: [new TextRun({ text: fr(sub), size: 18, color: GREY })] })];

const S1 = [
  ...title("Proposition de missions d'entretiens dans les villes ACV", "Huit villes Action Cœur de Ville qui se démarquent · octobre 2026 · Document de travail"),
  new Paragraph({ spacing: { after: 160, line: 264 }, children: runs("« Commerces employeurs » : commerces de détail en magasin employant au moins un salarié, dans un rayon de 300 à 700 m autour de la mairie (calculs de l'auteur à partir d'Insee, Sirene). Ces éléments montrent des évolutions favorables, sans prouver l'effet du programme : c'est l'objet des entretiens.", { size: 17, color: GREY }) }),
  table1,
];
const S2 = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(fr("Comparaison des huit villes"))] }),
  new Paragraph({ spacing: { after: 140 }, children: runs("La meilleure valeur de chaque ligne est en gras. La dernière colonne donne la moyenne des villes Action Cœur de Ville quand elle est connue. Pour Sète, Frontignan (voisine) a une vacance commerciale sous 5 % et moins de 3 % de logements vides.", { size: 17, color: GREY }) }),
  table2,
  small("Lecture : vacance commerciale en tranches de 5 points (atlas ANCT), sauf Bressuire (taux exact, baromètre Codata 2026). « Transition » : accompagnement Cerema et ANCT en transition écologique ; « Réinventons » : lauréat de « Réinventons nos cœurs de ville ». Score final : classement composite de l'auteur sur 12,5 points (commerce, vacance, habitat, démarches, fréquentation)."),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Sources")] }),
  link("Insee, Base Sirene des entreprises et de leurs établissements", "https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/", " et géolocalisation des établissements, 2012-2025 ; calculs de l'auteur"),
  link("Insee, Évolution et structure de la population en 2020", "https://www.insee.fr/fr/statistiques/7632446?sommaire=7632456"),
  link("ANCT, Atlas national Action cœur de ville, T4 2025", "https://media.anct.gouv.fr/ressources/2026-10/atlas-national-acv-t4-2025_0.pdf", " : vacance commerciale (p. 23, Codata 2025), logements vacants (p. 22, LOVAC 2025), ventes immobilières (p. 24, notaires de France), démarches du programme (p. 14, 28 à 32)"),
  link("Codata et FACT, Baromètre de l'offre commerciale dans les centres-villes 2026", "https://8646969.fs1.hubspotusercontent-na1.net/hubfs/8646969/CODATA/Codata-Barom%C3%A8tre-offre-commerciale-dans-les-centres-villes-2026.pdf"),
  link("Banque des Territoires, « Action cœur de ville : des résultats sur la vacance commerciale », 21 septembre 2023", "https://www.banquedesterritoires.fr/action-coeur-de-ville-des-resultats-sur-la-vacance-commerciale", " (FACT et Codata 2018-2022)"),
  link("ANCT, Villes de France et MyTraffic, L'observatoire des mobilités dans les villes ACV, mars 2024", "https://agence-cohesion-territoires.gouv.fr/sites/default/files/2024-04/Observatoire%20des%20mobilit%C3%A9s%202023%20%2817%29.pdf"),
];
const bullet = (ref, size, left) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
  style: { run: { color: GREY, size }, paragraph: { indent: { left, hanging: 220 } } } }] });
const hdr = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Missions d'entretiens dans les villes ACV · Document de travail"), size: 15, color: GREY })] })] });
const ftr = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] });
const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Proposition de missions d'entretiens dans les villes ACV",
  styles: { default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: INK, font: "Arial" }, paragraph: { spacing: { before: 120, after: 100 }, keepNext: true, outlineLevel: 0 } }] },
  numbering: { config: [bullet("cell", 17, 240), bullet("src", 16, 300)] },
  sections: [
    { properties: { page: { margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } }, headers: { default: hdr }, footers: { default: ftr }, children: S1 },
    { properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } }, headers: { default: hdr }, footers: { default: ftr }, children: S2 },
  ],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
