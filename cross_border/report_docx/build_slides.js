// 3-slide briefing for DGE / DG GROW. Run: NODE_PATH=$(npm root -g) node report_docx/build_slides.js
const pptxgen = require("pptxgenjs");
const path = require("path");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "Retail SMEs in France's border regions";

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
  slide.addText(text, { x: 0.6, y: 6.95, w: 12.1, h: 0.35, fontFace: BF, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
}
function stat(slide, x, y, w, big, label, color = NAVY) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 1.55, fill: { color: SOFT }, line: { color: SOFT } });
  slide.addText(big, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.62, fontFace: HF, fontSize: 30, bold: true, color, margin: 0, isTextBox: true });
  slide.addText(label, { x: x + 0.2, y: y + 0.74, w: w - 0.4, h: 0.72, fontFace: BF, fontSize: 12, color: INK, margin: 0, valign: "top", isTextBox: true });
}

// ---------------- Slide 1 ----------------
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  title(s, "1 · Cross-border retail flows", "The border works both ways, but losses fall on specific products and places");
  stat(s, 0.6, 1.85, 2.85, "€6.1 bn", "spent across the border each year by French border-strip residents");
  stat(s, 3.6, 1.85, 2.85, "€6.0 bn", "spent in France by residents of neighbouring border areas", BLUE);
  s.addText([
    { text: "France loses on everyday goods, gains on comparison goods.", options: { bold: true, breakLine: true } },
    { text: "French residents cross mainly for food, drink and tobacco (€3.5 bn), attracted by lower prices. Foreign residents come for clothing and equipment (€3.2 bn).", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Who bears the loss.", options: { bold: true, breakLine: true } },
    { text: "Supermarkets in peripheral zones lose about €500 m a year; town-centre shops gain about €360 m on comparison goods. Independents are close to break-even overall; tobacconists are the exception.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Where.", options: { bold: true, breakLine: true } },
    { text: "Moselle, Meurthe-et-Moselle, Pyrénées-Atlantiques and Haut-Rhin send 25–35% of comparison spending abroad; Nord and Haute-Savoie are net winners." },
  ], { x: 0.6, y: 3.62, w: 5.85, h: 3.2, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 2 });

  const data = [{ name: "Net for France", labels: ["Switzerland", "Belgium", "Luxembourg", "Italy", "Andorra", "Monaco", "Spain", "Germany"],
    values: [619, 380, 103, 59, -7, -12, -447, -842] }];
  s.addText("Net retail spending balance for France, by neighbour (€ m per year)", { x: 6.9, y: 1.85, w: 5.8, h: 0.4,
    fontFace: BF, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addChart(pres.charts.BAR, data, {
    x: 6.8, y: 2.25, w: 5.95, h: 4.45, barDir: "bar", chartColors: [BLUE],
    invertIfNegative: false, showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: INK,
    dataLabelFormatCode: "+#,##0;-#,##0", catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: BF, catAxisLabelPos: "low", catAxisOrientation: "maxMin",
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    catAxisLineShow: false, barGapWidthPct: 45, valAxisMinVal: -1100, valAxisMaxVal: 850,
  });
  source(s, "Excluding fuel; residents within 40 km of the border. Spatial model, orders of magnitude; signs robust for Germany, Spain, Belgium and Italy. Source: authors' calculations (OpenStreetMap, Eurostat).");
  s.addNotes("Main message: France is not a net loser on general retail at its borders – roughly €6bn goes out and €6bn comes in. The imbalance is by product and place: price-driven everyday purchases leave (Germany, Spain, Luxembourg), while France attracts Swiss and Belgian shoppers for comparison goods. Losses concentrate on peripheral food retail and on a handful of départements. Figures come from an uncalibrated model: treat them as orders of magnitude.");
}

// ---------------- Slide 2 ----------------
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  title(s, "2 · Excise goods", "Tax differentials are the main driver of leakage, and tobacco is the sharpest case");
  stat(s, 0.6, 1.85, 2.85, "9.1%", "of French cigarette consumption bought legally abroad (≈ €1.7 bn a year)", RED);
  stat(s, 3.6, 1.85, 2.85, "+50–60%", "tobacconists' sales if purchases came back (Pyrénées-Or., Ariège, Moselle)", RED);
  s.addText([
    { text: "Calibrated on the 2020 border closure.", options: { bold: true, breakLine: true } },
    { text: "The model reproduces the observed national surplus (+10.0% vs +9.5%, INSEE) and is consistent with KPMG (11.9%). Shoppers drive up to an hour for tobacco.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Visible in the retail fabric.", options: { bold: true, breakLine: true } },
    { text: "Within 20 km of the border there are 25% fewer tobacconists and 17% fewer fuel stations per resident than nationally, and up to 64% fewer near Luxembourg.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "In Europe, France is a net importer of excise goods.", options: { bold: true, breakLine: true } },
    { text: "11.9% of cigarettes consumed are bought abroad, but only 1.3% of French sales go to non-residents. Fuel cannot be measured with public data." },
  ], { x: 0.6, y: 3.62, w: 5.85, h: 3.2, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 2 });

  s.addText("Border zone (0–20 km) vs mainland France, per 10 000 inhabitants (%)", { x: 6.9, y: 1.85, w: 5.8, h: 0.4,
    fontFace: BF, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });
  const labels = ["Spain", "Italy", "Switzerland", "Belgium", "Germany", "Luxembourg"];
  s.addChart(pres.charts.BAR, [
    { name: "Tobacconists", labels, values: [6, 8, -12, -31, -37, -64] },
    { name: "Fuel stations", labels, values: [21, -7, 7, -33, -14, -57] },
  ], {
    x: 6.8, y: 2.25, w: 5.95, h: 4.45, barDir: "bar", chartColors: [RED, LIGHTBLUE],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 10, dataLabelColor: INK, dataLabelFormatCode: "+0;-0",
    catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: BF, catAxisLabelPos: "low", catAxisOrientation: "maxMin", valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendFontSize: 11,
    legendFontFace: BF, catAxisLineShow: false, barGapWidthPct: 40, valAxisMinVal: -80, valAxisMaxVal: 35,
  });
  source(s, "Sources: authors' calculations; Hillion & Monchâtre (2024), INSEE Analyses 94; Douchet (2021), OFDT; KPMG (2025); Insee BPE 2025; DGDDI tobacconist directory 2018.");
  s.addNotes("Tobacco is where the border really costs French retail: about 9% of consumption, roughly €1.7bn a year, is bought legally abroad. The estimate is calibrated on the 2020 border closure and matches INSEE and KPMG. The effect is visible on the ground: much thinner networks of tobacconists and fuel stations near Luxembourg, Germany and Belgium; no gap near Switzerland, where prices are close to French levels. Tobacconists are independents, so this is an SME issue. Lowering tobacco taxes is not the answer (Finland 2004 shows the health cost).");
}

// ---------------- Slide 3 ----------------
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  title(s, "3 · Policy", "A border-blind policy framework: what DGE and DG GROW can do");

  // Gaps column
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 3.7, h: 4.9, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText("Gaps", { x: 0.85, y: 2.0, w: 3.2, h: 0.45, fontFace: HF, fontSize: 20, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText([
    { text: "Only 9 of 29 instruments target border areas; ACV, PVD and the 2025 local-retail plan ignore border exposure", options: { bullet: true, breakLine: true } },
    { text: "No official measure of cross-border retail spending", options: { bullet: true, breakLine: true } },
    { text: "Flat €2 500 bonus for border tobacconists vs 10–60% of sales at stake", options: { bullet: true, breakLine: true } },
    { text: "Interreg Grande Région (DE, LU borders) has no SME priority", options: { bullet: true } },
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
    [1, "Border exposure index", "to target ACV / PVD successors and the 2026 envelopes of the local-retail plan"],
    [2, "Official measurement", "quarterly survey (Norway model), open tobacco & fuel sales by département"],
    [3, "Tobacconist support", "proportional to exposure, without lowering tobacco taxes"],
    [4, "Commercial planning", "cross-border impact assessment within 30 km of a border"],
  ]);
  card(8.75, "EU (DG GROW)", [
    [5, "Excise convergence", "ambitious Tobacco Taxation Directive, short transition to 2028"],
    [6, "Interreg 2028–2034", "a proximity-retail and town-centre strand, starting with Grande Région"],
    [7, "BRIDGEforEU", "log obstacles facing small cross-border traders (VAT refunds, rules)"],
    [8, "Retail transition pathway", "add a border dimension and harmonised border-shopping statistics"],
  ]);
  source(s, "Sources: authors' review of 29 EU, national, bilateral and local instruments (Sept. 2026); recommendations from the draft chapter \"Retail SMEs in France's border regions\".");
  s.addNotes("The policy stack largely ignores borders. On the French side, the priority is to target existing tools rather than create new ones: an exposure index, an official statistic, support for tobacconists scaled to exposure, and a cross-border check in commercial planning. On the EU side, DG GROW's levers are excise convergence, the next Interreg generation, the BRIDGEforEU obstacle mechanism and adding a territorial/border dimension to the retail transition pathway, including harmonised statistics on border shopping. Items 5 and 8 are also where France can bring evidence from this work.");
}

pres.writeFile({ fileName: path.join(__dirname, "Border_retail_briefing_DGE_DGGROW.pptx") }).then((f) => console.log(f));
