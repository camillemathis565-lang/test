// Tableau simple : Ville | Région | Pourquoi elle se démarque (Word, A4 portrait)
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
  LevelFormat, Footer, Header, PageNumber, VerticalAlign, ExternalHyperlink, HeadingLevel, ShadingType } = require("docx");

const OUT = path.join(__dirname, "villes_ACV_qui_se_demarquent.docx");
const NAVY = "003087", BAND = "0070C0", GREY = "595959", PINK = "C2255C", PINK_SOFT = "FDEEF4";
const W = 9638;
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
const WID = [1800, 1500, 6338];

const VILLES = [
  ["Bressuire", "19 900 hab.", "Nouvelle-Aquitaine", "La plus forte baisse durable de vacance commerciale mesurée parmi les villes du programme.", [
    "Vacance commerciale du centre-ville divisée par deux : **17,9 % en 2019, 8,6 % en 2025** (−9,3 points), avec une baisse presque chaque année (baromètre Codata 2026). La moyenne des villes ACV est de 14,5 % en 2025.",
    "Le recul des commerces employeurs s'est presque arrêté : 50 en 2012, 43 en 2019, 42 en 2025.",
    "Habitat attractif : moins de 3 % de logements vides depuis deux ans ou plus, ventes immobilières en hausse entre 2018 et 2023.",
    "Démarches du programme : accompagnement en transition écologique (Cerema et ANCT), design actif.",
    "**À comprendre :** quels leviers ont fait baisser la vacance (nouvelles implantations, reconversion de locaux, action foncière) ?"]],
  ["Sète et Frontignan", "44 700 et 23 800 hab.", "Occitanie", "La réussite la plus solide : le commerce de centre-ville repart et la vacance est basse, à l'échelle du bassin de Thau.", [
    "Sète : **180 commerces employeurs en 2012, 153 en 2019, 174 en 2025** (+14 % depuis 2019). L'ensemble des établissements progresse aussi (+3 %).",
    "Vacance commerciale en baisse de 4,4 points entre 2018 et 2022 (FACT et Codata), entre 5 et 10 % en 2025.",
    "Habitat : 3 à 4 % de logements vides depuis deux ans ou plus, ventes en hausse.",
    "L'agglomération Sète Agglopôle Méditerranée est **territoire pilote de sobriété foncière depuis 2020** : elle cherche à limiter l'étalement urbain.",
    "Frontignan, voisine : **vacance commerciale sous 5 %**, moins de 3 % de logements vides, ventes en hausse, commerces en légère hausse (30 → 33).",
    "**À comprendre :** le rôle de la maîtrise foncière intercommunale dans la reprise du centre. Une seule mission pour les deux villes."]],
  ["Privas", "8 500 hab.", "Auvergne-Rhône-Alpes", "Une très petite préfecture qui a inversé le déclin de son commerce.", [
    "Commerces employeurs : 46 en 2012, 35 en 2019 (−24 %), **37 en 2025 (+6 %)**.",
    "Vacance commerciale entre 5 et 10 % en 2025, bien sous la moyenne des villes ACV.",
    "Population en hausse (+3,1 % entre 2014 et 2020) et ventes immobilières en hausse.",
    "Démarches du programme : transition écologique, design actif.",
    "Point de vigilance : vacance des logements élevée (plus de 7 %).",
    "**À comprendre :** comment une ville de moins de 10 000 habitants relance son commerce, et si le rebond tient avec de si petits effectifs."]],
  ["Creil", "36 100 hab.", "Hauts-de-France", "Le plus fort rebond du commerce de centre-ville parmi les 228 villes du programme.", [
    "Commerces employeurs : 59 en 2012, 40 en 2019 (−32 %), **55 en 2025 (+38 %)**. L'ensemble des établissements progresse de 13 %.",
    "Vacance commerciale entre 10 et 15 % en 2025.",
    "Population en hausse (+3 % entre 2014 et 2020), ventes immobilières en hausse.",
    "Démarches du programme : transition écologique, design actif.",
    "**À comprendre :** ce qui explique un tel rebond, et comment le centre-ville s'articule avec les quartiers prioritaires de la ville."]],
  ["Draguignan", "39 700 hab.", "Provence-Alpes-Côte d'Azur", "Un déclin enrayé par une stratégie sur plusieurs axes : patrimoine, foncier, commerce.", [
    "Commerces employeurs : 138 en 2012, 95 en 2019 (−31 %), **91 en 2025 (−4 %)** : le recul s'est presque arrêté, et l'ensemble des établissements est stable.",
    "Vacance commerciale entre 10 et 15 % en 2025.",
    "Habitat : 3 à 4 % de logements vides, ventes en hausse.",
    "**Lauréat de « Réinventons nos cœurs de ville »** (reconversion d'un site patrimonial vacant) et **territoire pilote de sobriété foncière depuis 2020** (Dracénie Provence Verdon Agglomération).",
    "**À comprendre :** comment ces démarches se sont combinées pour stabiliser le commerce."]],
  ["Vitry-le-François", "11 500 hab.", "Grand Est", "Le commerce repart alors que la ville perd des habitants.", [
    "Commerces employeurs : 56 en 2012, 41 en 2019 (−27 %), **50 en 2025 (+22 %)**. L'ensemble des établissements progresse aussi (+9 %).",
    "Vacance commerciale entre 5 et 10 % en 2025.",
    "Contexte défavorable : population en forte baisse (−12,8 % entre 2014 et 2020) et vacance des logements élevée (plus de 7 %).",
    "**À comprendre :** ce qui fait revenir des commerces malgré la baisse de la population (clientèle du bassin, offre ciblée, actions de la ville)."]],
  ["Mazamet", "10 100 hab.", "Occitanie", "Une des vacances commerciales les plus basses de toutes les villes du programme.", [
    "**Vacance commerciale sous 5 % en 2025** (atlas ANCT), contre 14,5 % en moyenne. Seules 7 villes ACV sont dans ce cas.",
    "Commerces employeurs : 45 en 2012, 34 en 2019 (−24 %), 34 en 2025 : le recul s'est arrêté.",
    "Démarche du programme : transition écologique.",
    "Points de vigilance : vacance des logements élevée (plus de 7 %), population en légère baisse.",
    "**À comprendre :** comment une petite ville garde ses locaux commerciaux occupés, et si cette situation date d'avant le programme."]],
  ["Vitré", "19 000 hab.", "Bretagne", "Le cas breton le plus solide : un centre qui tient, porté par une population en hausse.", [
    "Commerces employeurs : 55 en 2012, 48 en 2019, 46 en 2025 : le recul a nettement ralenti (−13 % avant 2019, **−4 % depuis**).",
    "**Moins de 3 % de logements vides** et population en hausse (+5,9 % entre 2014 et 2020).",
    "Vacance commerciale entre 10 et 15 % en 2025.",
    "Démarches du programme : transition écologique, design actif.",
    "**À comprendre :** le lien entre attractivité résidentielle et commerce de centre-ville."]],
  ["Poissy", "40 000 hab.", "Île-de-France", "Un centre-ville qui gagne des commerces depuis 2012 et compte parmi les plus fréquentés du programme.", [
    "Commerces employeurs : 79 en 2012, 81 en 2019, **85 en 2025** : hausse continue.",
    "**Environ 2,55 millions de visites par mois** en 2022-2023 (MyTraffic), 5e centre le plus fréquenté des villes ACV.",
    "Vacance commerciale entre 5 et 10 % en 2025, moins de 3 % de logements vides.",
    "Population en forte hausse : +7,4 % entre 2014 et 2020. Démarche du programme : transition écologique.",
    "**À comprendre :** la part de la croissance démographique et celle des actions de la ville dans la bonne santé du centre."]],
  ["Sélestat", "19 300 hab.", "Grand Est", "Une ville moyenne qui a stoppé l'érosion de son centre.", [
    "Commerces employeurs : 99 en 2012, 78 en 2019 (−21 %), **79 en 2025** : le recul s'est arrêté.",
    "L'ensemble des établissements progresse depuis 2019 (+5 %), signe d'un regain d'activité.",
    "Vacance commerciale entre 5 et 10 % en 2025, 3 à 4 % de logements vides.",
    "**À comprendre :** quelles actions ont stabilisé le centre, alors que l'atlas ne signale aucune démarche particulière du programme."]],
];

const head = ["Ville", "Région", "Pourquoi elle se démarque"].map((t, i) => new TableCell({
  width: { size: WID[i], type: WidthType.DXA }, borders: { top: line(NAVY, 10), bottom: line(NAVY, 6), left: none, right: none },
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: NAVY })] })] }));
const rows = VILLES.map(([ville, pop, region, lead, items], k) => {
  const last = k === VILLES.length - 1;
  const b = { top: none, bottom: last ? line(NAVY, 10) : line("D9D9D9"), left: none, right: none };
  const m = { top: 100, bottom: 100, left: 100, right: 100 };
  return new TableRow({ cantSplit: true, children: [
    new TableCell({ width: { size: WID[0], type: WidthType.DXA }, borders: b, margins: m, children: [
      new Paragraph({ children: [new TextRun({ text: `${k + 1}. `, bold: true, color: PINK, size: 20 }), new TextRun({ text: fr(ville), bold: true, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: fr(pop), size: 16, color: GREY })] })] }),
    new TableCell({ width: { size: WID[1], type: WidthType.DXA }, borders: b, margins: m, children: [new Paragraph({ children: runs(region, { size: 18 }) })] }),
    new TableCell({ width: { size: WID[2], type: WidthType.DXA }, borders: b, margins: m, children: [
      new Paragraph({ spacing: { after: 60 }, children: runs(lead, { bold: true, size: 18, color: NAVY }) }),
      ...items.map((t) => new Paragraph({ numbering: { reference: "cell", level: 0 }, spacing: { after: 40, line: 252 }, children: runs(t, { size: 17 }) }))] }),
  ] });
});

const link = (label, url, tail = "") => new Paragraph({ numbering: { reference: "src", level: 0 }, spacing: { after: 40 },
  children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: fr(label), style: "Hyperlink", size: 16 })] }), ...runs(tail, { size: 16 })] });

const C = [
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "OCDE · ÉTUDE DE CAS FRANCE · PROPOSITION À LA DGE", bold: true, size: 16, color: PINK, characterSpacing: 20 })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr("Dix villes Action Cœur de Ville qui se démarquent"), size: 36, color: NAVY })] }),
  new Paragraph({ spacing: { after: 200 }, border: { bottom: line(PINK, 8) }, children: [new TextRun({ text: fr("Classement proposé pour les missions d'entretiens · 8 octobre 2026 · Document de travail"), size: 18, color: GREY })] }),
  new Paragraph({ spacing: { after: 160, line: 264 }, children: runs("Villes classées par score décroissant. « Commerces employeurs » : commerces de détail en magasin employant au moins un salarié, dans un rayon de 300 à 700 m autour de la mairie (Insee, Sirene). Ces éléments montrent des évolutions favorables, sans prouver l'effet du programme : c'est l'objet des entretiens.", { size: 17, color: GREY }) }),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: WID, rows: [new TableRow({ tableHeader: true, children: head }), ...rows] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Sources")] }),
  link("Insee, Base Sirene des entreprises et de leurs établissements", "https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/", " et géolocalisation des établissements, 2012-2025 ; calculs de l'auteur"),
  link("Insee, Évolution et structure de la population en 2020", "https://www.insee.fr/fr/statistiques/7632446?sommaire=7632456"),
  link("ANCT, Atlas national Action cœur de ville, T4 2025", "https://media.anct.gouv.fr/ressources/2026-10/atlas-national-acv-t4-2025_0.pdf", " (vacance commerciale et des logements, ventes immobilières, démarches du programme)"),
  link("Codata et FACT, Baromètre de l'offre commerciale dans les centres-villes 2026", "https://8646969.fs1.hubspotusercontent-na1.net/hubfs/8646969/CODATA/Codata-Barom%C3%A8tre-offre-commerciale-dans-les-centres-villes-2026.pdf"),
  link("Banque des Territoires, « Action cœur de ville : des résultats sur la vacance commerciale », 21 septembre 2023", "https://www.banquedesterritoires.fr/action-coeur-de-ville-des-resultats-sur-la-vacance-commerciale", " (FACT et Codata 2018-2022)"),
  link("ANCT, Villes de France et MyTraffic, L'observatoire des mobilités dans les villes ACV, mars 2024", "https://agence-cohesion-territoires.gouv.fr/sites/default/files/2024-04/Observatoire%20des%20mobilit%C3%A9s%202023%20%2817%29.pdf"),
];
const bullet = (ref, text, color, size, left) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.BULLET, text, alignment: AlignmentType.LEFT,
  style: { run: { color, size }, paragraph: { indent: { left, hanging: 220 } } } }] });
const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Dix villes Action Cœur de Ville qui se démarquent",
  styles: { default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: BAND, font: "Arial" }, paragraph: { spacing: { before: 280, after: 100 }, keepNext: true, outlineLevel: 0 } }] },
  numbering: { config: [bullet("cell", "■", PINK, 12, 240), bullet("src", "■", PINK, 12, 300)] },
  sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Villes ACV qui se démarquent · Document de travail"), size: 15, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, bold: true, color: NAVY })] })] }) },
    children: C }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
