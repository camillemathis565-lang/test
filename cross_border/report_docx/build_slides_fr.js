// 3-slide briefing for DGE / DG GROW. Run: NODE_PATH=$(npm root -g) node report_docx/build_slides.js
const pptxgen = require("pptxgenjs");
const path = require("path");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "Les PME du commerce dans les zones frontalières";

const NAVY = "1B2A4A", INK = "22303F", MUTED = "5F6B7A", SOFT = "EEF2F7", BLUE = "2E6DB4",
  LIGHTBLUE = "A9CBE8", RED = "C0504D", AMBER = "D98E2B", WHITE = "FFFFFF";
const HF = "Cambria", BF = "Calibri";

function title(slide, kicker, text) {
  slide.addText(kicker.toUpperCase(), { x: 0.6, y: 0.35, w: 12, h: 0.3, fontFace: BF, fontSize: 11, bold: true,
    color: BLUE, charSpacing: 2, margin: 0, isTextBox: true });
  slide.addText(text, { x: 0.6, y: 0.68, w: 12.1, h: 0.95, fontFace: HF, fontSize: 28, bold: true, color: NAVY,
    margin: 0, valign: "top", isTextBox: true });
}
function source(slide, text) {
  slide.addText(text, { x: 0.6, y: 7.02, w: 12.1, h: 0.35, fontFace: BF, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
}
function stat(slide, x, y, w, big, label, color = NAVY) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 1.55, fill: { color: SOFT }, line: { color: SOFT } });
  slide.addText(big, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.62, fontFace: HF, fontSize: 30, bold: true, color, margin: 0, isTextBox: true });
  slide.addText(label, { x: x + 0.2, y: y + 0.74, w: w - 0.4, h: 0.72, fontFace: BF, fontSize: 11, color: INK, margin: 0, valign: "top", isTextBox: true });
}

// ---------------- Slide 1 ----------------
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  title(s, "1 · Flux commerciaux transfrontaliers", "La frontière fonctionne dans les deux sens, mais les pertes touchent certains produits et territoires");
  stat(s, 0.6, 1.85, 2.85, "6,1 Md€", "dépensés chaque année à l'étranger par les Français de la bande frontalière");
  stat(s, 3.6, 1.85, 2.85, "6,0 Md€", "dépensés en France par les résidents des zones frontalières voisines", BLUE);
  s.addText([
    { text: "La France perd sur les achats courants, gagne sur les achats réfléchis.", options: { bold: true, breakLine: true } },
    { text: "Les Français traversent surtout pour l'alimentation, les boissons et le tabac (3,5 Md€), attirés par les prix. Les voisins viennent pour l'habillement et l'équipement (3,2 Md€).", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Qui supporte la perte.", options: { bold: true, breakLine: true } },
    { text: "Les supermarchés des zones périphériques perdent environ 500 M€ par an ; les commerces de centre-ville gagnent environ 360 M€ sur les achats réfléchis. Les indépendants sont globalement à l'équilibre, sauf les buralistes.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Où.", options: { bold: true, breakLine: true } },
    { text: "En Moselle, Meurthe-et-Moselle, Pyrénées-Atlantiques et Haut-Rhin, 25 à 35 % des achats réfléchis partent à l'étranger ; le Nord et la Haute-Savoie sont gagnants nets." },
  ], { x: 0.6, y: 3.62, w: 5.85, h: 3.2, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 2 });

  const data = [{ name: "Solde pour la France", labels: ["Suisse", "Belgique", "Luxembourg", "Italie", "Andorre", "Monaco", "Espagne", "Allemagne"],
    values: [619, 380, 103, 59, -7, -12, -447, -842] }];
  s.addText("Solde net des dépenses commerciales pour la France, par pays voisin (M€ par an)", { x: 6.9, y: 1.85, w: 5.8, h: 0.4,
    fontFace: BF, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addChart(pres.charts.BAR, data, {
    x: 6.8, y: 2.25, w: 5.95, h: 4.45, barDir: "bar", chartColors: [BLUE],
    invertIfNegative: false, showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: INK,
    dataLabelFormatCode: "+0;-0", catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: BF, catAxisLabelPos: "low", catAxisOrientation: "maxMin",
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    catAxisLineShow: false, barGapWidthPct: 45, valAxisMinVal: -1100, valAxisMaxVal: 850,
  });
  source(s, "Hors carburant ; résidents à moins de 40 km de la frontière. Modèle spatial, ordres de grandeur ; signes robustes pour l'Allemagne, l'Espagne, la Belgique et l'Italie. Source : calculs des auteurs (OpenStreetMap, Eurostat).");
  s.addNotes("Message principal : la France n'est pas perdante nette sur le commerce général à ses frontières – environ 6 Md€ sortent et 6 Md€ entrent. Le déséquilibre tient aux produits et aux territoires : les achats courants guidés par les prix partent (Allemagne, Espagne, Luxembourg), tandis que la France attire les Suisses et les Belges pour les achats réfléchis. Les pertes se concentrent sur le commerce alimentaire périphérique et quelques départements. Chiffres issus d'un modèle non calé : ce sont des ordres de grandeur.");
}

// ---------------- Slide 2 ----------------
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  title(s, "2 · Produits soumis à accises", "Les écarts de fiscalité expliquent l'essentiel de l'évasion, le tabac en tête");
  stat(s, 0.6, 1.85, 2.85, "9,1 %", "des cigarettes consommées achetées légalement à l'étranger (≈ 1,7 Md€/an)", RED);
  stat(s, 3.6, 1.85, 2.85, "+50–60 %", "de ventes des buralistes si ces achats revenaient (P.-O., Ariège, Moselle)", RED);
  s.addText([
    { text: "Calé sur la fermeture des frontières de 2020.", options: { bold: true, breakLine: true } },
    { text: "Le modèle reproduit le surplus national observé (+10,0 % contre +9,5 %, INSEE) et concorde avec KPMG (11,9 %). On roule jusqu'à une heure pour acheter du tabac.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Visible dans le tissu commercial.", options: { bold: true, breakLine: true } },
    { text: "À moins de 20 km de la frontière, on compte 25 % de buralistes et 17 % de stations-service en moins par habitant qu'en moyenne nationale, et jusqu'à 64 % de moins près du Luxembourg.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "En Europe, la France est importatrice nette de produits soumis à accises.", options: { bold: true, breakLine: true } },
    { text: "11,9 % des cigarettes consommées sont achetées à l'étranger, contre 1,3 % des ventes françaises vendues à des non-résidents. Le carburant n'est pas mesurable avec les données publiques." },
  ], { x: 0.6, y: 3.62, w: 5.85, h: 3.2, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 2 });

  s.addText("Zone frontalière (0–20 km) par rapport à la moyenne nationale, pour 10 000 habitants (%)", { x: 6.9, y: 1.85, w: 5.8, h: 0.4,
    fontFace: BF, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });
  const labels = ["Espagne", "Italie", "Suisse", "Belgique", "Allemagne", "Luxembourg"];
  s.addChart(pres.charts.BAR, [
    { name: "Buralistes", labels, values: [6, 8, -12, -31, -37, -64] },
    { name: "Stations-service", labels, values: [21, -7, 7, -33, -14, -57] },
  ], {
    x: 6.8, y: 2.25, w: 5.95, h: 4.45, barDir: "bar", chartColors: [RED, LIGHTBLUE],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 10, dataLabelColor: INK, dataLabelFormatCode: "+0;-0",
    catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: BF, catAxisLabelPos: "low", catAxisOrientation: "maxMin", valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendFontSize: 11,
    legendFontFace: BF, catAxisLineShow: false, barGapWidthPct: 40, valAxisMinVal: -80, valAxisMaxVal: 35,
  });
  source(s, "Sources : calculs des auteurs ; Hillion et Monchâtre (2024), Insee Analyses n° 94 ; Douchet (2021), OFDT ; KPMG (2025) ; Insee BPE 2025 ; DGDDI, annuaire des buralistes 2018.");
  s.addNotes("Le tabac est le poste où la frontière coûte vraiment au commerce français : environ 9 % de la consommation, soit près de 1,7 Md€ par an, est achetée légalement à l'étranger. L'estimation est calée sur la fermeture des frontières de 2020 et concorde avec l'INSEE et KPMG. L'effet se voit sur le terrain : réseaux de buralistes et de stations-service bien moins denses près du Luxembourg, de l'Allemagne et de la Belgique ; aucun écart près de la Suisse, où les prix sont proches des prix français. Les buralistes sont des indépendants : c'est un sujet PME. Baisser la fiscalité du tabac n'est pas la réponse (la Finlande en 2004 montre le coût sanitaire).");
}

// ---------------- Slide 3 ----------------
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  title(s, "3 · Politiques publiques", "Des politiques qui ignorent la frontière : ce que peuvent faire la DGE et la DG GROW");

  // Gaps column
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 3.7, h: 4.9, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText("Lacunes", { x: 0.85, y: 2.0, w: 3.2, h: 0.45, fontFace: HF, fontSize: 20, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText([
    { text: "9 dispositifs sur 29 seulement ciblent les zones frontalières ; ACV, PVD et le plan commerce 2025 ignorent l'exposition frontalière", options: { bullet: true, breakLine: true } },
    { text: "Aucune mesure officielle des achats transfrontaliers", options: { bullet: true, breakLine: true } },
    { text: "Bonus forfaitaire de 2 500 € pour les buralistes frontaliers, alors que 10 à 60 % des ventes sont en jeu", options: { bullet: true, breakLine: true } },
    { text: "Interreg Grande Région (frontières DE, LU) sans priorité PME", options: { bullet: true } },
  ], { x: 0.85, y: 2.55, w: 3.25, h: 4.0, fontFace: BF, fontSize: 13, color: WHITE, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 9 });

  function card(x, head, items) {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w: 4.0, h: 4.9, fill: { color: SOFT }, line: { color: SOFT } });
    s.addText(head, { x: x + 0.25, y: 2.0, w: 3.5, h: 0.45, fontFace: HF, fontSize: 20, bold: true, color: NAVY, margin: 0, isTextBox: true });
    items.forEach(([n, t, d], i) => {
      const y = 2.6 + i * 1.02;
      s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.02, w: 0.42, h: 0.42, fill: { color: BLUE }, line: { color: BLUE } });
      s.addText(String(n), { x: x + 0.25, y: y + 0.02, w: 0.42, h: 0.42, fontFace: BF, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText([{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { color: MUTED } }],
        { x: x + 0.82, y: y - 0.04, w: 2.95, h: 0.95, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, isTextBox: true });
    });
  }
  card(4.55, "France (DGE)", [
    [1, "Indice d'exposition frontalière", "pour cibler les suites d'ACV / PVD et le plan commerce 2026"],
    [2, "Mesure officielle", "enquête trimestrielle ; ventes tabac et carburant ouvertes par département"],
    [3, "Soutien aux buralistes", "proportionnel à l'exposition, sans baisser la fiscalité du tabac"],
    [4, "Urbanisme commercial", "étude d'impact transfrontalière à moins de 30 km d'une frontière"],
  ]);
  card(8.75, "UE (DG GROW)", [
    [5, "Convergence des accises", "directive tabac ambitieuse, transition courte d'ici 2028"],
    [6, "Interreg 2028–2034", "un volet commerce de proximité et centres-villes, à commencer par la Grande Région"],
    [7, "BRIDGEforEU", "recenser les obstacles des petits commerçants transfrontaliers (détaxe, règles)"],
    [8, "Transition pathway", "ajouter une dimension frontalière et des statistiques harmonisées"],
  ]);
  source(s, "Sources : revue par les auteurs de 29 dispositifs européens, nationaux, bilatéraux et locaux (sept. 2026) ; recommandations du projet de chapitre sur les PME du commerce dans les zones frontalières.");
  s.addNotes("Les politiques ignorent largement la frontière. Côté français, la priorité est de mieux cibler les outils existants plutôt que d'en créer de nouveaux : un indice d'exposition, une statistique officielle, un soutien aux buralistes proportionnel à l'exposition et un volet transfrontalier dans l'urbanisme commercial. Côté européen, les leviers de la DG GROW sont la convergence des accises, la prochaine génération Interreg, le mécanisme BRIDGEforEU et l'ajout d'une dimension territoriale et frontalière au transition pathway du commerce, avec des statistiques harmonisées sur les achats transfrontaliers.");
}

pres.writeFile({ fileName: path.join(__dirname, "Commerce_frontalier_note_DGE_DGGROW_FR.pptx") }).then((f) => console.log(f));
