// Method briefing for management: how the cross-border model works, data, assumptions, confidence, limits.
// Run: NODE_PATH=$(npm root -g) node report_docx/build_slides_method.js
const pptxgen = require("pptxgenjs");
const path = require("path");

const NAVY = "1B2A4A", INK = "22303F", MUTED = "5F6B7A", SOFT = "EEF2F7", BLUE = "2E6DB4",
  LIGHTBLUE = "A9CBE8", RED = "C0504D", WHITE = "FFFFFF", GREY = "B8C2CC", GREEN = "3A7D44", AMBER = "C98A1B";
const HF = "Cambria", BF = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; pres.title = "Cross-border retail model: method and limits";

const title = (s, k, x) => {
  s.background = { color: WHITE };
  s.addText(k.toUpperCase(), { x: 0.6, y: 0.35, w: 12, h: 0.3, fontFace: BF, fontSize: 11, bold: true, color: BLUE, charSpacing: 2, margin: 0 });
  s.addText(x, { x: 0.6, y: 0.68, w: 12.1, h: 0.95, fontFace: HF, fontSize: 26, bold: true, color: NAVY, margin: 0, valign: "top" });
};
const source = (s, x) => s.addText(x, { x: 0.6, y: 7.02, w: 12.1, h: 0.35, fontFace: BF, fontSize: 9, color: MUTED, margin: 0 });
const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY } } });
const pill = (t, c) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: c }, align: "center" } });
const table = (s, rows, colW, y, fs = 11, rowH) => s.addTable(rows, {
  x: 0.6, y, w: 12.1, colW, rowH, fontFace: BF, fontSize: fs, color: INK, valign: "middle",
  border: { type: "solid", pt: 0.75, color: "D5DCE4" }, margin: [3, 6, 3, 6], autoPage: false,
});

// ---------- Slide 1: how it works ----------
let s = pres.addSlide();
title(s, "1 · How the model works", "A shopping-trip model shares each household's budget between the shops it can reach");
const steps = [
  ["1", "Who shops", "25 m residents within 40 km of the border (10.8 m in France), in 2 km cells"],
  ["2", "How much", "Spending per person in each country, for everyday and comparison goods"],
  ["3", "Where", "1,302 town centres and retail zones within 70 km, built from 317,000 mapped shops"],
  ["4", "How attractive", "Each destination scored on size, driving time, border crossing and price gap"],
  ["5", "Flows in €", "Budget shared in proportion to the scores, then summed by country"],
];
const bw = 2.25, gap = 0.21;
steps.forEach(([n, h, d], i) => {
  const x = 0.6 + i * (bw + gap);
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.8, w: bw, h: 1.95, fill: { color: i === 3 ? NAVY : SOFT }, line: { color: i === 3 ? NAVY : SOFT } });
  const c = i === 3 ? WHITE : NAVY;
  s.addText(n, { x: x + 0.15, y: 1.9, w: 0.5, h: 0.45, fontFace: HF, fontSize: 22, bold: true, color: i === 3 ? LIGHTBLUE : BLUE, margin: 0 });
  s.addText(h, { x: x + 0.15, y: 2.35, w: bw - 0.3, h: 0.35, fontFace: HF, fontSize: 15, bold: true, color: c, margin: 0 });
  s.addText(d, { x: x + 0.15, y: 2.75, w: bw - 0.3, h: 0.95, fontFace: BF, fontSize: 11, color: i === 3 ? WHITE : INK, valign: "top", margin: 0 });
  if (i < steps.length - 1) s.addText("›", { x: x + bw - 0.02, y: 2.5, w: gap + 0.04, h: 0.5, fontFace: BF, fontSize: 22, bold: true, color: GREY, align: "center", margin: 0 });
});
// formula card
s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 4.0, w: 5.9, h: 2.85, fill: { color: WHITE }, line: { color: GREY, width: 1 } });
s.addText("The attractiveness score (step 4)", { x: 0.8, y: 4.12, w: 5.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: NAVY, margin: 0 });
s.addText([
  { text: "Score = Size × Distance decay × Border penalty × Price effect", options: { bold: true, color: BLUE, breakLine: true } },
  { text: " ", options: { fontSize: 5, breakLine: true } },
  { text: "Size: ", options: { bold: true } }, { text: "number of shops, big boxes weighted more", options: { breakLine: true } },
  { text: "Distance decay: ", options: { bold: true } }, { text: "attraction falls with each minute of driving", options: { breakLine: true } },
  { text: "Border penalty: ", options: { bold: true } }, { text: "crossing a border counts as a handicap (language, habits)", options: { breakLine: true } },
  { text: "Price effect: ", options: { bold: true } }, { text: "cheaper countries attract more (Eurostat price levels)", options: { breakLine: true } },
  { text: " ", options: { fontSize: 5, breakLine: true } },
  { text: "Share of budget going to a destination = its score ÷ sum of all scores. These shares are probabilities: the outputs are expected values, not measured spending.", options: { italic: true, color: MUTED } },
], { x: 0.8, y: 4.52, w: 5.55, h: 2.25, fontFace: BF, fontSize: 11.5, color: INK, valign: "top", margin: 0 });
// example card
s.addShape(pres.shapes.RECTANGLE, { x: 6.75, y: 4.0, w: 5.95, h: 2.85, fill: { color: SOFT }, line: { color: SOFT } });
s.addText("Illustrative example", { x: 6.95, y: 4.12, w: 5.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: NAVY, margin: 0 });
s.addText([
  { text: "1,000 residents near Strasbourg spend €3,475 each a year on food, drink and tobacco: ", options: {} },
  { text: "€3.5 m in total.", options: { bold: true, breakLine: true } },
  { text: " ", options: { fontSize: 5, breakLine: true } },
  { text: "If the scores give 70% to French destinations and 30% to Kehl (close, large, cheaper):", options: { breakLine: true } },
  { text: "  → €2.4 m stays in France", options: { bold: true, color: NAVY, breakLine: true } },
  { text: "  → €1.0 m is spent in Germany", options: { bold: true, color: RED, breakLine: true } },
  { text: " ", options: { fontSize: 5, breakLine: true } },
  { text: "Repeated for every cell on both sides, this gives the €6 bn each way.", options: { italic: true, color: MUTED } },
], { x: 6.95, y: 4.52, w: 5.6, h: 2.25, fontFace: BF, fontSize: 11.5, color: INK, valign: "top", margin: 0 });
source(s, "Model type: Huff spatial interaction model (Huff, 1963), standard in retail location studies. Illustrative example with round shares; €3,475 is the Eurostat 2024 figure for France.");
s.addNotes(`The question: how much do border residents spend in shops on the other side, and does France win or lose?

The model follows five steps. First, who shops: everyone living within 40 km of a French land border, on both sides, from the 2021 census grid. That is about 25 million people, 10.8 million of them in France. Second, how much: the average spending per person in each country from Eurostat, split into everyday goods (food, drink, tobacco) and comparison goods (clothing, furniture, equipment). Third, where: every town centre and retail zone within 70 km of the border, built from OpenStreetMap's 317,000 shops. Fourth, the key step: each destination gets an attractiveness score for each group of residents. Bigger is better, nearer is better, crossing a border is a handicap, and cheaper countries attract more. Fifth, each household's budget is shared between destinations in proportion to their scores, and we add up what crosses the border.

The important point: the shares are probabilities. The euro figures are what we expect on average given the assumptions, not observed spending. This is a well-established model family (Huff), used by retailers and planners to estimate catchment areas.`);

// ---------- Slide 2: data ----------
s = pres.addSlide();
title(s, "2 · Data sources", "All inputs are public, official or open data; nothing is measured directly on cross-border purchases");
table(s, [
  [hdr("Input"), hdr("Source"), hdr("Year"), hdr("Used for")],
  ["Residents", "Eurostat / GISCO, 1 km population grid (2021 census)", "2021", "Who shops and where they live"],
  ["Spending per person", "Eurostat, prc_ppp_ind, expenditure per inhabitant (food, alcohol and tobacco, clothing, furnishing)", "2024", "Household budgets by country"],
  ["Price levels", "Eurostat, prc_ppp_ind, price level indices (EU27 = 100)", "2024", "Price effect: France 116 vs Germany 102, Spain 93, Switzerland 154 (everyday goods)"],
  ["Shops and retail zones", "OpenStreetMap, via the Overpass API (shop tags, retail land use, brands)", "2026", "Destinations, their size, chains vs independents"],
  ["Road network", "OpenStreetMap roads (motorway to secondary)", "2026", "Driving times, cell to destination"],
  ["Borders and regions", "Eurostat / GISCO, countries 2020, NUTS 2024, communes (LAU) 2024", "2020–24", "Geography, results by département"],
  ["Tobacco (calibration)", "DGDDI monthly deliveries; INSEE (Hillion and Monchâtre, 2024) on the 2020 closure", "2019–20", "Fitting the tobacco model on observed data"],
  ["Fuel (test)", "SDES (DiDo), petroleum sales by département and month", "2019–20", "Testing the same approach for fuel"],
  ["Retail structure", "INSEE BPE 2025; URSSAF employment by commune and activity (NAF 47)", "2012–25", "Profile of retail in border areas (section 2.2)"],
], [2.1, 5.2, 0.9, 3.9], 1.85, 12, 0.49);
source(s, "Not used, because not available: card payment data, customs data on individual purchases, surveys of cross-border shoppers. These are the sources that would allow the results to be validated.");
s.addNotes(`Every input is public and traceable. Population comes from the Eurostat census grid, spending and price levels from Eurostat's purchasing power parity data for 2024, and shops and roads from OpenStreetMap, the open map maintained by volunteers and widely used by public administrations.

What we do not have is a direct measure of cross-border purchases: no card payment data, no survey. That is the main reason the results are modelled estimates. The exception is tobacco, where the 2020 border closure gives us an observed shock (DGDDI sales data and INSEE's estimate) that we use to fit the model.

If asked about OpenStreetMap: coverage is very good in France, Germany, Switzerland and Belgium, less even in Spain and Italy. It counts shops, not floor space or turnover.`);

// ---------- Slide 3: assumptions ----------
s = pres.addSlide();
title(s, "3 · Key assumptions", "Three settings drive the results; they are set from the literature, not fitted to cross-border data");
table(s, [
  [hdr("Setting"), hdr("Value used"), hdr("What it means"), hdr("Effect on results")],
  ["Border penalty (θ)", "0.55 (Switzerland, Andorra 0.40; Monaco 0.90)", "A shop across the border is worth about half of the same shop at home (language, habits, customs)", pill("Strong: flows scale almost in proportion", RED)],
  ["Price sensitivity (γ)", "2 (tested 0, 2, 3)", "A country 10% cheaper is about 20–25% more attractive", pill("Medium: decides the Swiss balance", AMBER)],
  ["Distance decay (β)", "0.12 per minute (everyday), 0.06 (comparison)", "Everyday attraction halves every ~6 min of driving; comparison every ~12 min", pill("Medium: shapes the reach", AMBER)],
  ["Shop size", "Shop count; supermarket = 4, mall or department store = 20", "Proxy for floor space, which is not available across countries", pill("Low to medium", GREEN)],
  ["Study area", "Residents within 40 km; shops within 70 km; trips up to 75 min", "Captures regular shopping trips, not longer excursions", pill("Low: stated scope", GREEN)],
], [2.1, 3.1, 4.1, 2.8], 1.85, 12, 0.58);
s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.55, w: 12.1, h: 1.3, fill: { color: SOFT }, line: { color: SOFT } });
s.addText([
  { text: "How we handled it: ", options: { bold: true, color: NAVY } },
  { text: "the model was re-run 15 times with the border penalty from ×0.5 to ×1.6 and price sensitivity at 0, 2 and 3. Results are reported as a central value with the range across these runs. Only tobacco was fitted to observed data (2020 closure); for tobacco, the fitted distance decay is much weaker: attraction halves only after about an hour." },
], { x: 0.8, y: 5.65, w: 11.7, h: 1.1, fontFace: BF, fontSize: 12, color: INK, valign: "middle", margin: 0 });
source(s, "Settings in cbattr/config.py; sensitivity runs in outputs/sensitivity.csv; tobacco calibration in outputs/excise_parameters.csv.");
s.addNotes(`This is the slide to be transparent on. The model has three dials. The border penalty says how much people are put off by crossing a border. The price sensitivity says how much a cheaper country attracts. The distance decay says how quickly attraction falls with driving time.

These values are reasonable and in line with the literature, but they were not fitted to cross-border shopping data, because no such data are published for France. The border penalty is the most influential: halve it and the flows roughly halve.

So we tested: 15 runs with different values. The directions of the results did not change; the amounts did. That is why we report ranges. For tobacco we could do better, because the 2020 border closure is a natural experiment: we fitted the model to what actually happened to tobacconists' sales.`);

// ---------- Slide 4: confidence ----------
s = pres.addSlide();
title(s, "4 · How far to trust each result", "Directions are robust; amounts are orders of magnitude");
table(s, [
  [hdr("Finding"), hdr("Central estimate"), hdr("Range across 15 runs"), hdr("Confidence")],
  ["France loses spending to Germany", "−€840 m a year", "−€0.6 to −1.2 bn", pill("Robust direction", GREEN)],
  ["France loses spending to Spain", "−€450 m", "−€0.3 to −0.7 bn", pill("Robust direction", GREEN)],
  ["France gains from Belgium", "+€380 m", "+€0.2 to +0.4 bn", pill("Robust direction", GREEN)],
  ["France gains from Switzerland", "+€620 m", "+€0.3 to +1.7 bn; negative if prices ignored", pill("Price-driven", AMBER)],
  ["Flows are roughly balanced overall", "€6.1 bn out, €6.0 bn in", "€3.6 to 8.5 bn each way", pill("Order of magnitude", AMBER)],
  ["Chains lose more than independent SMEs", "Chains −€150 m; SMEs ≈ 0", "Chains −€100 to −160 m; SMEs −€60 to +80 m", pill("Robust for chains", GREEN)],
  ["Tobacco bought abroad: 9.1% of French consumption", "Fitted on 2020 closure", "INSEE 9.5%, KPMG 11.9%", pill("Calibrated", GREEN)],
  ["Luxembourg balance; results for one town", "+€100 m", "Commuters not modelled", pill("Do not quote", RED)],
], [4.3, 2.6, 3.3, 1.9], 1.85, 13, 0.55);
source(s, "Net = spending by neighbours' residents in France minus spending by French residents abroad, everyday and comparison goods, excluding fuel. Range: border penalty ×0.5 to ×1.6, price sensitivity 2 to 3.");
s.addNotes(`This is how I suggest we use the results in the report.

Green: we can state the direction with confidence. France is a net loser towards Germany and Spain, a net gainer from Belgium, in every one of the 15 runs. Chains bear more of the loss than independent shops.

Amber: the Swiss surplus depends on the price gap (switch prices off and it disappears), which matches what we know of Swiss shopping tourism in France. The €6 billion each way is an order of magnitude: between about €3.5 and €8.5 billion depending on the border penalty. In writing, I would say "several billion euros in each direction".

Tobacco is different: it is fitted to the 2020 border closure and lands close to INSEE's and KPMG's independent estimates, so it is our most solid number.

Red: Luxembourg, because cross-border commuters who shop near their workplace are missing, and any single town, because the shop data are too uneven at that level.`);

// ---------- Slide 5: limits and next steps ----------
s = pres.addSlide();
title(s, "5 · Limits and next steps", "What the model leaves out, and how to validate it before publication");
const lim = [
  ["Not observed spending", "Outputs are expected values from probabilities, not measured purchases."],
  ["Commuters and tourists missing", "Trips start from home only; frontaliers shopping near work (Luxembourg, Geneva, Basel) are not captured."],
  ["Fuel and online excluded", "Fuel could not be calibrated: sales by département are only annual. Online purchases are outside the model."],
  ["Shop counts, not turnover", "OpenStreetMap measures presence, not floor space or sales; coverage is uneven in Spain and Italy."],
  ["Chains vs SMEs by proxy", "A shop tagged with a brand counts as a chain (franchises included); an untagged shop counts as independent."],
];
lim.forEach(([h, d], i) => {
  const y = 1.85 + i * 0.98;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 0.08, h: 0.8, fill: { color: RED }, line: { color: RED } });
  s.addText(h, { x: 0.85, y, w: 5.6, h: 0.32, fontFace: HF, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  s.addText(d, { x: 0.85, y: y + 0.34, w: 5.6, h: 0.5, fontFace: BF, fontSize: 11.5, color: INK, valign: "top", margin: 0 });
});
s.addShape(pres.shapes.RECTANGLE, { x: 6.9, y: 1.85, w: 5.8, h: 4.9, fill: { color: NAVY }, line: { color: NAVY } });
s.addText("To validate before publication", { x: 7.15, y: 2.0, w: 5.3, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: WHITE, margin: 0 });
s.addText([
  { text: "Banque de France: ", options: { bold: true, color: LIGHTBLUE } }, { text: "'travel' line of the balance of payments with Switzerland, Germany and Spain.", options: { breakLine: true } },
  { text: " ", options: { fontSize: 6, breakLine: true } },
  { text: "Card payment data: ", options: { bold: true, color: LIGHTBLUE } }, { text: "regional banks (e.g. Crédit Mutuel in Alsace) or Cartes Bancaires, spending by residents abroad and by foreign cards in France.", options: { breakLine: true } },
  { text: " ", options: { fontSize: 6, breakLine: true } },
  { text: "Local surveys: ", options: { bold: true, color: LIGHTBLUE } }, { text: "CCI Grand Est, INSEE studies on frontaliers.", options: { breakLine: true } },
  { text: " ", options: { fontSize: 6, breakLine: true } },
  { text: "If direction and scale match on one border, the report can state that the model is consistent with observed data.", options: { italic: true } },
], { x: 7.15, y: 2.55, w: 5.35, h: 4.1, fontFace: BF, fontSize: 14, color: WHITE, valign: "top", margin: 0 });
source(s, "The report recommends an official measure of cross-border spending (as in Norway's quarterly survey or Germany's empty-pack survey for tobacco) and monthly tobacco and fuel sales by département.");
s.addNotes(`Five limits to state openly. The main one: the figures are modelled, not measured. The second: commuters are missing, which matters for Luxembourg and Switzerland. Third: fuel and online are outside the scope. Fourth: OpenStreetMap counts shops, not turnover. Fifth: the split between chains and SMEs relies on brand tags.

The fix is a validation against one observed source before publication: the Banque de France balance of payments, card payment data from a regional bank, or a CCI survey. If the model matches on one border, we can say so in the report and the numbers become much easier to defend.`);

// ---------- Slide 6: Q&A ----------
s = pres.addSlide();
title(s, "Backup · Likely questions", "Short answers to the questions most likely to come up");
const qa = [
  ["Are these real figures?", "No. They are model estimates (expected values). Only the tobacco share is fitted to observed data."],
  ["Why not use card data?", "Not publicly available; it is the best way to validate and is listed as a next step."],
  ["Why €6 bn and not a range?", "€6 bn is the central run; the range is €3.6 to 8.5 bn. In the report: 'several billion euros each way'."],
  ["Why does France gain from Switzerland?", "Prices: Swiss everyday goods cost about a third more than French ones. Without the price effect, the surplus disappears."],
  ["Why does Germany win even without prices?", "Large retail sites just across the border (Kehl, Saarbrücken) and good road access."],
  ["Is the model standard?", "Yes: Huff (1963), widely used by retailers and planners for catchment areas."],
  ["What about fuel?", "Not in the €6 bn. Annual data by département cannot isolate the 2020 closure; monthly data would be needed."],
  ["Can we give results by town?", "Not reliably: shop data are too uneven at that level. Results by département or border are fine."],
];
qa.forEach(([q, a], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.6 + col * 6.15, y = 1.85 + row * 1.25;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w: 5.95, h: 1.1, fill: { color: SOFT }, line: { color: SOFT } });
  s.addText(q, { x: x + 0.2, y: y + 0.1, w: 5.6, h: 0.32, fontFace: BF, fontSize: 12.5, bold: true, color: NAVY, margin: 0 });
  s.addText(a, { x: x + 0.2, y: y + 0.43, w: 5.6, h: 0.62, fontFace: BF, fontSize: 11.5, color: INK, valign: "top", margin: 0 });
});
source(s, "Huff, D. L. (1963), 'A probabilistic analysis of shopping center trade areas', Land Economics, 39(1), 81–90.");
s.addNotes("Backup slide: keep it for questions.");

pres.writeFile({ fileName: path.join(__dirname, "Cross_border_model_method_briefing.pptx") }).then((f) => console.log(f));
