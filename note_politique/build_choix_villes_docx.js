// Proposition à la DGE : choix des villes Action Cœur de Ville pour les missions d'entretiens (Word, A4 paysage)
const fs = require("fs"), path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, LevelFormat, Footer, Header, PageNumber, PageOrientation, VerticalAlign, ExternalHyperlink, HeadingLevel,
} = require("docx");

const OUT = path.join(__dirname, "choix_villes_ACV_missions_entretiens_DGE.docx");
const NAVY = "003087", BAND = "0070C0", GREY = "595959", PINK = "C2255C", PINK_SOFT = "FDEEF4", LIGHT = "F2F2F2";
const W = 15137;

const fr = (s) => s.replace(/ ([:;!?%»])/g, " $1").replace(/« /g, "« ")
  .replace(/(\d) (\d{3})/g, "$1 $2").replace(/ (pts?|km|hab\.)\b/g, " $1");
function runs(text, base = {}) {
  const out = [], re = /(\*\*[^*]+\*\*)/g, t = fr(text); let last = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    out.push(new TextRun({ text: m[0].slice(2, -2), bold: true, ...base })); last = m.index + m[0].length;
  }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: 120, line: 276 }, ...o.p });
const L = (t, ref = "bul") => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, spacing: { after: 70, line: 264 } });
const H = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(fr(t))] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(fr(t))] });
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });

// Cellule : texte simple, ou tableau de lignes (plusieurs paragraphes)
function cell(content, width, { head = false, last = false, fill, bold, color, size = 16, align } = {}) {
  const lines = Array.isArray(content) ? content : [content];
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
    borders: { top: head ? line(NAVY, 10) : none, bottom: head ? line(NAVY, 6) : last ? line(NAVY, 10) : line("D9D9D9"), left: none, right: none },
    margins: { top: 70, bottom: 70, left: 80, right: 80 },
    children: lines.map((t) => new Paragraph({ alignment: align, spacing: { after: 20 }, children: runs(t, { size, bold: head || bold || undefined, color: head ? NAVY : color }) })),
  });
}
const COLS = ["Rang", "Ville", "Score /12,5", "Commerce de centre-ville (Sirene)", "Vacance commerciale", "Habitat et démarches du programme", "Fréquentation (MyTraffic)", "Angle de l'entretien", "Choix DGE"];
const WID = [600, 1900, 750, 2000, 2000, 2400, 1300, 2387, 1800];
const CHOIX = ["☐ Retenue", "☐ Remplaçante", "☐ Écartée"];
function choiceTable(rows, rankFill) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: WID, rows: [
    new TableRow({ tableHeader: true, children: COLS.map((c, i) => cell(c, WID[i], { head: true })) }),
    ...rows.map((r, k) => { const last = k === rows.length - 1;
      return new TableRow({ cantSplit: true, children: [
        cell(String(r[0]), WID[0], { last, bold: true, color: PINK, size: 22, align: AlignmentType.CENTER, fill: rankFill }),
        cell([`**${r[1]}**`, r[2]], WID[1], { last }),
        cell(r[3], WID[2], { last, bold: true, align: AlignmentType.CENTER }),
        cell(r[4], WID[3], { last }), cell(r[5], WID[4], { last }), cell(r[6], WID[5], { last }), cell(r[7], WID[6], { last }), cell(r[8], WID[7], { last }),
        cell(CHOIX, WID[8], { last, fill: LIGHT }),
      ] }); }),
  ] });
}
const link = (label, url, tail = "") => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 60 },
  children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: fr(label), style: "Hyperlink", size: 18 })] }), ...runs(tail, { size: 18 })] });

const C = [];
C.push(
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "OCDE · ÉTUDE DE CAS FRANCE · ZONES COMMERCIALES, CENTRES-VILLES ET QPV", bold: true, size: 16, color: PINK, characterSpacing: 20 })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr("Choix des villes Action Cœur de Ville pour les missions d'entretiens"), size: 40, color: NAVY })] }),
  new Paragraph({ spacing: { after: 260 }, border: { bottom: line(PINK, 8) }, children: [new TextRun({ text: fr("Note à l'attention de la Direction générale des Entreprises (DGE) · 8 octobre 2026 · Document de travail"), size: 19, color: GREY })] }),
);

C.push(H("Objet"));
C.push(P("Nous proposons à la DGE **dix villes Action Cœur de Ville (ACV)**, classées selon un score qui croise toutes les données publiques disponibles, ainsi que **cinq villes remplaçantes et un cas de comparaison**. Ces villes se démarquent par leur commerce de centre-ville, leur vacance commerciale, leur habitat ou leur mobilisation du programme. Les entretiens doivent établir ce qui explique ces résultats et la part qui revient au programme."));
C.push(P("**Il est demandé à la DGE de cocher, pour chaque ville, la colonne « Choix DGE ».** Les interlocuteurs visés dans chaque ville sont le chef de projet ACV, le manager de commerce, l'élu chargé du commerce, la CCI et l'union commerciale."));

C.push(H("Les dix villes proposées"));
C.push(choiceTable([
  [1, "Bressuire", "Nouvelle-Aquitaine · 19 900 hab.", "8,5", "50 → 43 → 42 commerces employeurs (2012, 2019, 2025) : recul quasi stoppé depuis 2019 (−2 %)", "**17,9 % → 8,6 %** de 2019 à 2025 (baromètre Codata)", "Moins de 3 % de logements vides, ventes en hausse ; transition écologique, design actif", "–", "La plus forte baisse durable de vacance mesurée : quels leviers ?"],
  [2, "Sète et Frontignan", "Occitanie · 44 700 et 23 800 hab.", "8,0 et 6,5", "Sète : 180 → 153 → **174** (+14 % depuis 2019). Frontignan : 30 → 31 → 33", "Sète : −4,4 pts en 2018-2022 (FACT), 5-10 % en 2025. Frontignan : **< 5 %**", "Sète : logements vides 3-4 %, ventes en hausse, pilote sobriété foncière. Frontignan : < 3 %", "–", "La réussite la plus solide, à l'échelle du bassin de Thau (une seule mission)"],
  [3, "Privas", "Auvergne-Rhône-Alpes · 8 500 hab.", "7,0", "46 → 35 → 37 : −24 % avant 2019, puis +6 %", "5-10 % en 2025 (atlas)", "Ventes en hausse ; transition écologique, design actif", "–", "Une très petite préfecture qui redresse son commerce"],
  [4, "Creil", "Hauts-de-France · 36 100 hab.", "6,0", "59 → 40 → **55** : plus fort rebond des villes ACV (+38 %)", "10-15 % en 2025 (atlas)", "Ventes en hausse, population +3 % ; transition écologique, design actif", "–", "Rebond dans une ville populaire ; lien avec les quartiers prioritaires"],
  [5, "Draguignan", "Provence-Alpes-Côte d'Azur · 39 700 hab.", "5,5", "138 → 95 → 91 : −31 % avant 2019, −4 % depuis", "10-15 % en 2025 (atlas)", "Logements vides 3-4 %, ventes en hausse ; lauréat « Réinventons », pilote sobriété foncière", "–", "Stratégie sur plusieurs axes : patrimoine, foncier, commerce"],
  [6, "Vitry-le-François", "Grand Est · 11 500 hab.", "5,5", "56 → 41 → **50** (+22 % depuis 2019)", "5-10 % en 2025 (atlas)", "Population −12,8 % (2014-2020)", "–", "Le commerce repart dans une ville qui perd des habitants"],
  [7, "Mazamet", "Occitanie · 10 100 hab.", "5,5", "45 → 34 → 34 : recul arrêté depuis 2019", "**< 5 %** en 2025 (atlas)", "Transition écologique", "–", "Une petite ville à la vacance très basse : comment ?"],
  [8, "Vitré", "Bretagne · 19 000 hab.", "5,0", "55 → 48 → 46 : recul ralenti (−4 %)", "10-15 % en 2025 (atlas)", "Moins de 3 % de logements vides, population +5,9 % ; transition écologique, design actif", "–", "Le cas breton le plus solide"],
  [9, "Poissy", "Île-de-France · 40 000 hab.", "5,0", "79 → 81 → 85 : hausse continue", "5-10 % en 2025 (atlas)", "Moins de 3 % de logements vides, population +7,4 % ; transition écologique", "2,55 M visites par mois", "Un centre fréquenté, porté par la démographie"],
  [10, "Sélestat", "Grand Est · 19 300 hab.", "5,0", "99 → 78 → 79 : −21 % avant 2019, puis stable ; ensemble des établissements +5 %", "5-10 % en 2025 (atlas)", "Logements vides 3-4 %", "–", "Une ville moyenne qui stabilise son centre"],
], PINK_SOFT));

C.push(H("Villes remplaçantes et cas de comparaison"));
C.push(choiceTable([
  [11, "Valence", "Auvergne-Rhône-Alpes · 64 500 hab.", "5,0", "271 → 243 → 233 : recul ralenti (−4 %)", "10-15 % en 2025 (atlas)", "Logements vides 3-4 %, ventes en hausse ; transition écologique, foncière", "–", "Une grande ville qui mobilise le programme"],
  [12, "Lunéville", "Grand Est · 17 800 hab.", "5,0", "54 → 46 → 52 (+13 % depuis 2019)", "5-10 % en 2025 (atlas)", "Population −7,6 %", "–", "Rebond partiel : quels commerces arrivent ?"],
  [13, "Denain", "Hauts-de-France · 20 600 hab.", "5,0", "50 → 36 → 43 (+19 % depuis 2019)", "10-15 % en 2025 (atlas)", "Transition écologique", "–", "Rebond dans un bassin en difficulté"],
  [14, "Pau", "Nouvelle-Aquitaine · 77 100 hab.", "4,5", "332 → 266 → 244 : recul (−8 %)", "10-15 % en 2025 (atlas)", "Logements vides 3-4 %, ventes en hausse ; lauréat « Réinventons », transition, design actif, foncière", "2,55 M visites par mois ; attractivité 87,7 %", "La ville qui mobilise le plus le programme : quels effets sur le commerce ?"],
  [15, "Revel", "Occitanie · 9 700 hab.", "4,5", "38 → 31 → 29 : recul (−6 %)", "5-10 % en 2025 (atlas)", "Ventes en hausse ; lauréat « Réinventons », design actif", "+13 % de visiteurs extérieurs (2022-2023)", "Supérette et marché comme moteurs de fréquentation"],
  [16, "Calais (cas de comparaison)", "Hauts-de-France · 67 400 hab.", "4,5", "91 → 74 → 81 (+10 % depuis 2019)", "−7,7 pts en 2018-2022 (FACT), puis **plus de 20 %** en 2025", "Ville pilote du design actif", "–", "Rechute : pourquoi la vacance est-elle remontée ?"],
], LIGHT));

C.push(H("Méthode de classement"));
C.push(P("Chaque ville ACV de métropole (228 villes) reçoit un score sur 12,5 points. Au plus deux villes par région parmi les dix premières ; Sète et Frontignan, voisines, forment une seule mission."));
const MW = [3600, 1100, 4700, 5737];
C.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: MW, rows: [
  new TableRow({ tableHeader: true, children: ["Critère", "Points", "Mesure", "Source"].map((c, i) => cell(c, MW[i], { head: true })) }),
  ...[
    ["Commerce de centre-ville", "3,5", "Rebond ou arrêt du déclin des commerces employeurs depuis 2019, confirmé par l'ensemble des établissements (villes de 30 commerces ou plus)", "Insee, Sirene 2012-2025 ; calculs de l'auteur"],
    ["Niveau de vacance commerciale 2025", "3", "< 5 % : 3 ; 5-10 % : 2 ; 10-15 % : 1", "Baromètre Codata 2026 quand il existe, sinon atlas ANCT T4 2025 (p. 23)"],
    ["Baisse de la vacance depuis 2019", "2", "Baisse d'au moins 3 points : 2 ; d'au moins 1 point : 1", "Baromètre Codata 2026 ; palmarès FACT et Codata 2018-2022"],
    ["Habitat", "1,5", "Logements vides depuis 2 ans ou plus (< 3 % : 1 ; 3-4 % : 0,5) ; ventes en hausse 2018-2023 : 0,5", "Atlas ANCT (p. 22 et 24)"],
    ["Démarches du programme", "2", "0,5 par démarche : lauréat « Réinventons », sobriété foncière, transition écologique, design actif, foncière, « Mon centre-ville 2030 »", "Atlas ANCT (p. 14, 27 à 32)"],
    ["Fréquentation", "0,5", "Ville citée positivement par l'observatoire", "Observatoire des mobilités ANCT et MyTraffic (2024)"],
  ].map((r, k, a) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, MW[i], { last: k === a.length - 1, bold: i === 0, align: i === 1 ? AlignmentType.CENTER : undefined })) })),
] }));

C.push(H("Précautions"));
[
  "Le classement repère des villes qui se démarquent ; il **ne prouve pas l'effet du programme**. C'est l'objet des entretiens.",
  "Le centre-ville Sirene est un cercle de 300 à 700 m autour de la mairie, pas le périmètre de l'opération de revitalisation (ORT). Les effectifs sont petits dans certaines villes (Privas, Mazamet, Vitry-le-François).",
  "Les données de l'atlas sont lues sur ses cartes (erreur de position médiane inférieure à 1 pixel) et ne donnent que des tranches de 5 points. Pour 5 des 12 villes du baromètre Codata, l'atlas indique une tranche différente.",
  "La vacance commerciale ne distingue pas la vacance courte de la vacance de longue durée. Les données MyTraffic ne sont publiées que pour une quinzaine de villes.",
].forEach((t) => C.push(L(t)));

C.push(H("Données à demander avant les missions"));
[
  "À l'ANCT : taux de vacance Codata par ville depuis 2018 et données MyTraffic des villes retenues",
  "Aux villes : relevés locaux de vacance, liste des locaux vides depuis plus de deux ans, ouvertures et fermetures depuis 2019",
  "Au ministère du Logement (DGALN) : contours des périmètres ORT, pour recalculer les données Sirene sur le périmètre réel",
  "À la DGE : décisions des commissions d'aménagement commercial (CDAC) depuis 2018 dans les intercommunalités retenues",
].forEach((t) => C.push(L(t, "box")));

C.push(H("Sources"));
C.push(H2("Données statistiques (analyse Sirene)"));
C.push(link("Insee, Base Sirene des entreprises et de leurs établissements (stock et historique des établissements)", "https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/", ", version de septembre 2026"));
C.push(link("Insee, Géolocalisation des établissements du répertoire Sirene pour les études statistiques", "https://www.data.gouv.fr/fr/datasets/geolocalisation-des-etablissements-du-repertoire-sirene-pour-les-etudes-statistiques/"));
C.push(link("Cerema, Base EmpCom des principales emprises d'activités commerciales", "https://datafoncier.cerema.fr/base-empcom-des-principales-emprises-dactivites-commerciales", " (contours 2021)"));
C.push(link("ANCT, Quartiers prioritaires de la politique de la ville (périmètres 2024)", "https://www.data.gouv.fr/fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/"));
C.push(link("IGN, ADMIN EXPRESS (communes et chefs-lieux, 2024)", "https://geoservices.ign.fr/adminexpress"));
C.push(link("Insee, Évolution et structure de la population en 2020", "https://www.insee.fr/fr/statistiques/7632446?sommaire=7632456", " (population 2014 et 2020)"));
C.push(link("Caisse des Dépôts, Liste des villes Action cœur de ville", "https://opendata.caissedesdepots.fr/explore/dataset/villes_action_coeurdeville/"));
C.push(H2("Programme Action Cœur de Ville"));
C.push(link("ANCT, Atlas national Action cœur de ville, T4 2025", "https://media.anct.gouv.fr/ressources/2026-10/atlas-national-acv-t4-2025_0.pdf", " : vacance commerciale (p. 23, données Codata 2025), vacance des logements (p. 22), ventes immobilières (p. 24), foncières (p. 14), Mon centre-ville 2030 (p. 27), transition écologique (p. 28-29), sobriété foncière (p. 30), Réinventons nos cœurs de ville (p. 31), design actif (p. 32)"));
C.push(H2("Vacance commerciale"));
C.push(link("Codata et FACT, Baromètre de l'offre commerciale dans les centres-villes 2026", "https://8646969.fs1.hubspotusercontent-na1.net/hubfs/8646969/CODATA/Codata-Barom%C3%A8tre-offre-commerciale-dans-les-centres-villes-2026.pdf", " (p. 8-9 : vacance 2019-2025 des 12 villes ACV du palmarès)"));
C.push(link("Banque des Territoires, « Action cœur de ville : des résultats sur la vacance commerciale », 21 septembre 2023", "https://www.banquedesterritoires.fr/action-coeur-de-ville-des-resultats-sur-la-vacance-commerciale", " (étude FACT et Codata 2018-2022)"));
C.push(link("Banque des Territoires, « La progression de la vacance commerciale ralentit, surtout dans les villes moyennes », 2 décembre 2025", "https://www.banquedesterritoires.fr/la-progression-de-la-vacance-commerciale-ralentit-surtout-dans-les-villes-moyennes", " (étude FACT 2019-2024)"));
C.push(H2("Fréquentation"));
C.push(link("ANCT, Villes de France et MyTraffic, L'observatoire des mobilités dans les villes ACV, mars 2024", "https://agence-cohesion-territoires.gouv.fr/sites/default/files/2024-04/Observatoire%20des%20mobilit%C3%A9s%202023%20%2817%29.pdf", " (septembre 2022 - août 2023)"));
C.push(link("ANCT, Banque des Territoires et MyTraffic, Observatoire des mobilités dans les villes ACV, octobre 2021", "https://www.banquedesterritoires.fr/sites/default/files/2021-10/Observatoire%20des%20mobilit%C3%A9s%20dans%20les%20villes%20ACV_compressed.pdf"));
C.push(P("Tables de calcul : dépôt du projet, dossier analyse_commerce_territoires/resultats (fichiers 17 à 23).", { run: { size: 17, italics: true, color: GREY }, p: { spacing: { before: 120 } } }));

const bullet = (ref, text, color) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.BULLET, text, alignment: AlignmentType.LEFT,
  style: { run: { color, size: text === "■" ? 14 : 20 }, paragraph: { indent: { left: 360, hanging: 300 } } } }] });
const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Choix des villes Action Cœur de Ville pour les missions d'entretiens",
  styles: {
    default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: BAND, font: "Arial" }, paragraph: { spacing: { before: 280, after: 140 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 20, bold: true, color: NAVY, font: "Arial" }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [bullet("bul", "■", PINK), bullet("box", "☐", NAVY)] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Choix des villes ACV · Proposition à la DGE · Document de travail"), size: 15, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, bold: true, color: NAVY })] })] }) },
    children: C,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
