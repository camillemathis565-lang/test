// Builds the OECD-style chapter "Retail SMEs in France's border regions" (.docx)
// Run from cross_border/: node report_docx/build_docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, Header, Footer, PageNumber, TableOfContents,
  LevelFormat, PageBreak, FootnoteReferenceRun,
} = require("docx");

const FIG = path.join(__dirname, "figures");
const BLUE = "1F4E79", MIDBLUE = "4F8FCF", LIGHT = "DCE9F5", BOXBG = "EEF4FA", GREY = "595959";
const FONT = "Arial";
const TEXT_W = 9026; // A4 width 11906 - 2 x 1440 margins

// ---------- helpers ----------
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, ...o });
// inline markup: **bold**, *italic*
function runs(text, base = {}) {
  text = text.replace(/\[\d+\]/g, ""); // Harvard in-text: (Author, year)
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(run(text.slice(last, m.index), base));
    const s = m[0];
    if (s.startsWith("**")) out.push(run(s.slice(2, -2), { ...base, bold: true }));
    else out.push(run(s.slice(1, -1), { ...base, italics: true }));
    last = m.index + s.length;
  }
  if (last < text.length) out.push(run(text.slice(last), base));
  return out;
}
const P = (text, o = {}) => new Paragraph({
  children: runs(text, { size: 21 }), spacing: { after: 140, line: 276 },
  alignment: AlignmentType.JUSTIFIED, ...o,
});
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)], pageBreakBefore: true });
const H1nb = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [run(t)] });
const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level }, children: runs(text, { size: 21 }),
  spacing: { after: 90, line: 264 }, alignment: AlignmentType.JUSTIFIED,
});
const caption = (label, title, sub) => {
  const out = [new Paragraph({
    keepNext: true, spacing: { before: 240, after: sub ? 20 : 100 },
    children: [run(label + " ", { bold: true, size: 20, color: BLUE }), run(title, { bold: true, size: 20, color: BLUE })],
  })];
  if (sub) out.push(new Paragraph({ keepNext: true, spacing: { after: 100 }, children: [run(sub, { italics: true, size: 18, color: GREY })] }));
  return out;
};
const noteSource = (note, source) => {
  const out = [];
  if (note) out.push(new Paragraph({ spacing: { before: 60, after: 20 }, children: [run("Note: ", { size: 16, italics: true, color: GREY }), ...runs(note, { size: 16, color: GREY })] }));
  out.push(new Paragraph({ spacing: { before: note ? 0 : 60, after: 240 }, children: [run("Source: ", { size: 16, italics: true, color: GREY }), ...runs(source, { size: 16, color: GREY })] }));
  return out;
};
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const figure = (file, widthPx = 600) => {
  const f = path.join(FIG, file);
  const { w, h } = pngSize(f);
  return new Paragraph({
    alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(f), transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
      altText: { title: file, description: file, name: file } })],
  });
};
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const cellBorders = { top: border, bottom: border, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } };
function table(headers, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const mk = (txt, i, head, shade) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders: cellBorders,
    shading: head ? { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" } : (shade ? { fill: shade, type: ShadingType.CLEAR, color: "auto" } : undefined),
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: String(txt).split("\n").map((line) => new Paragraph({
      alignment: (!head && opts.num && opts.num.includes(i)) ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: runs(line, { size: 17, bold: head, color: head ? BLUE : undefined }),
    })),
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => mk(h, i, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false, opts.highlight && opts.highlight(r) ? BOXBG : undefined)) })),
    ],
  });
}
function box(label, title, paras) {
  const cell = new TableCell({
    width: { size: TEXT_W, type: WidthType.DXA },
    shading: { fill: BOXBG, type: ShadingType.CLEAR, color: "auto" },
    borders: { top: { style: BorderStyle.SINGLE, size: 12, color: BLUE }, bottom: border, left: border, right: border },
    margins: { top: 140, bottom: 140, left: 200, right: 200 },
    children: [
      new Paragraph({ spacing: { after: 120 }, children: [run(label + " ", { bold: true, size: 20, color: BLUE }), run(title, { bold: true, size: 20, color: BLUE })] }),
      ...paras.map((t) => typeof t === "string"
        ? new Paragraph({ spacing: { after: 100, line: 264 }, alignment: AlignmentType.JUSTIFIED, children: runs(t, { size: 19 }) })
        : t),
    ],
  });
  return [new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [TEXT_W], rows: [new TableRow({ children: [cell] })] }),
    new Paragraph({ spacing: { after: 200 }, children: [] })];
}
const boxBullet = (t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 70, line: 256 }, children: runs(t, { size: 19 }) });

// ---------- content ----------
const children = [];

// Cover
children.push(
  new Paragraph({ spacing: { before: 2600, after: 200 }, children: [run("RETAIL SMEs IN FRANCE", { size: 20, color: GREY, bold: true, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } },
    children: [run("Retail SMEs in France's border regions", { size: 52, bold: true, color: BLUE })] }),
  new Paragraph({ spacing: { after: 600 }, children: [run("Cross-border competition, policy gaps and options for France", { size: 30, color: "404040" })] }),
  new Paragraph({ spacing: { after: 80 }, children: [run("Draft chapter for internal review", { size: 21, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [run("September 2026", { size: 21 })] }),
  new Paragraph({ spacing: { before: 2400 }, children: [run("This chapter forms part of a broader report on retail SMEs in France. The figures on cross-border spending come from a spatial interaction model built for this chapter. They should be read as orders of magnitude, except for tobacco, where the model is calibrated on observed data from the 2020 border closure.", { size: 17, italics: true, color: GREY })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// TOC
children.push(
  new Paragraph({ spacing: { after: 200 }, children: [run("Table of contents", { size: 32, bold: true, color: BLUE })] }),
  new TableOfContents("Table of contents", { hyperlink: true, headingStyleRange: "1-2" }),
);

// Overview
children.push(H1("Overview"));
[
  "France shares land borders with eight countries and some 2 700 km of frontier. About 25 million people live within 40 km of these borders, 10.8 million of them on the French side. For the retail businesses in these areas, the relevant market does not stop at the border. Residents compare prices, ranges and opening hours on both sides, and small businesses compete with shops that operate under different tax, wage and regulatory conditions.",
  "This chapter estimates the size and direction of cross-border retail spending along all French land borders and assesses what it means for small and medium-sized retailers. It combines a spatial model of shopping trips, built on 317 000 shops, the 2021 census grid and road travel times, with a calibration on the natural experiment of the 2020 border closure for tobacco. It then reviews the EU, national, bilateral and local measures that reach retail SMEs in border areas and compares France with other European countries facing large price differences at their borders.",
  "The results show a mixed picture. For general retail, France's borders work in both directions: residents of the French border strip spend around EUR 6.1 billion a year in neighbouring countries, and residents on the other side spend around EUR 6.0 billion in France. France loses spending on everyday goods, where lower prices in Germany, Spain and Luxembourg draw shoppers across, and gains on clothing, equipment and other comparison goods, notably from Swiss and Belgian residents. The losses fall mainly on supermarkets in peripheral commercial zones and on tobacconists. Tobacco is the clearest case: around 9% of French cigarette consumption, roughly EUR 1.7 billion a year, is bought legally in neighbouring countries, and in the most exposed départements tobacconists' sales would rise by 50% to 60% if these purchases returned.",
  "The policy framework has not caught up with these patterns. The main national programmes for town centres and local retail allocate funds without reference to border exposure. Border-specific instruments exist, but they deal mainly with governance, customs enforcement or tobacconists, and no public body measures cross-border retail flows on a regular basis. The chapter proposes nine measures, most of which adjust existing tools: a border exposure index to target existing programmes, an official measurement of cross-border spending, support for tobacconists proportional to exposure, cross-border impact assessment in commercial planning, better capture of foreign customers, a retail strand in the next generation of Interreg programmes, co-development funding for the most exposed towns, continued pressure for convergence of excise duties at EU level, and a trigger mechanism for sudden price or currency shocks.",
].forEach((t) => children.push(P(t)));

// Key findings
children.push(H1nb("Key findings"));
children.push(new Paragraph({ spacing: { before: 120 } }));
[
  "**Cross-border retail spending is large but roughly balanced overall.** French border-strip residents spend around EUR 6.1 billion a year across the border and neighbouring residents spend around EUR 6.0 billion in France (excluding fuel). The balance differs sharply by border: France loses around EUR 840 million net to Germany and EUR 450 million to Spain, and gains around EUR 620 million from Switzerland and EUR 380 million from Belgium.",
  "**France loses on everyday goods and gains on comparison goods.** French residents cross the border mostly for food, drink and tobacco (EUR 3.5 billion out of 6.1 billion), attracted by lower prices. Foreign residents come to France mainly for clothing, furnishings and equipment (EUR 3.2 billion out of 6.0 billion).",
  "**Peripheral food retail and tobacconists bear most of the loss.** Once gains are netted against losses, supermarkets and hypermarkets in peripheral commercial zones lose around EUR 500 million a year. Town-centre shops gain around EUR 360 million on comparison goods. Independent retailers are close to break-even overall, and chains lose around 0.6% of turnover.",
  "**Exposure is concentrated in a few territories.** Residents of Meurthe-et-Moselle, Moselle, the Pyrénées-Atlantiques and the Haut-Rhin who live near the border spend 25% to 35% of their comparison-goods budget abroad. The Nord and Haute-Savoie, by contrast, are net beneficiaries.",
  "**Tobacco is the sharpest case.** Calibrated on the 2020 closure, the model finds that 9.1% of French cigarette consumption is bought legally abroad, close to independent estimates of 9.5% (INSEE) and 11.9% (KPMG). Tobacconists' sales would rise by 50% to 60% in the Pyrénées-Orientales, Ariège and Moselle if these purchases came back. Shoppers travel far for tobacco: the attraction of a trip halves only after about an hour of driving.",
  "**Fuel cannot be assessed with public data.** Annual sales by département do not show a measurable closure effect in 2020, and monthly data by département are not publicly available.",
  "**In a European comparison, France is two-way on general retail but a net importer of excise goods.** Norway, Denmark and Switzerland see spending flow only outwards. France receives almost as much as it loses on general retail and earns a surplus once tourism is included (non-residents' spending equals 4.4% of household consumption in France, against 3.5% spent abroad by French residents). On tobacco, however, 11.9% of consumption is bought legally abroad while only 1.3% of French sales go to foreigners.",
  "**The policy framework largely ignores borders.** Of 29 instruments reviewed, 9 were designed for border areas and 10 ignore borders altogether. None of the large town-centre and local-retail programmes uses border exposure as an allocation criterion, and no official statistic measures cross-border retail spending.",
].forEach((t) => children.push(bullet(t)));

children.push(H2("Main policy recommendations"));
[
  "Create a **border exposure index** at intercommunal level and use it to target Action Cœur de Ville, Petites Villes de Demain and the 2025 plan for local retail.",
  "Build an **official measure of cross-border retail spending**, drawing on Norway's quarterly survey and Germany's empty-pack survey, and open monthly tobacco and fuel sales data by département.",
  "Make **support for tobacconists proportional to measured exposure**, without lowering tobacco taxes.",
  "Require a **cross-border impact assessment in commercial planning** within 30 km of a land border.",
  "Help small retailers **capture foreign customers**, through simpler VAT refunds and cross-border marketing.",
  "Include **proximity retail in Interreg 2028–2034** and use the BRIDGEforEU coordination point for obstacles facing small traders.",
  "Negotiate **co-development funding** for the most exposed border towns, keep up pressure for **convergence of excise duties**, and set up a **trigger mechanism** for sudden price or currency shocks.",
].forEach((t) => children.push(bullet(t)));

// 1. Introduction
children.push(H1("1. Introduction"));
children.push(H2("1.1. Why border regions matter for French retail SMEs"));
[
  "Retail SMEs account for most retail employment in Europe and play a central role in the vitality of towns and villages (OECD, 2026[1]). In France, the decline of town-centre retail has been a policy concern for more than a decade: commercial vacancy in town centres rose from around 6% in 2010 to 14% in 2024 (DGE, 2025[2]). Programmes such as Action Cœur de Ville and Petites Villes de Demain, and the plan for local retail adopted in November 2025, respond to this concern.",
  "Border regions add a layer that national retail policy rarely considers. A household in Thionville, Mulhouse or Hendaye can reach supermarkets, shopping centres and tobacconists in another country within minutes. Price differences driven by excise duties, VAT and exchange rates can be large. In spring 2020, a pack of cigarettes cost EUR 9.5 in France, against EUR 5.3 in Luxembourg and EUR 3.8 in Andorra (Hillion and Monchâtre, 2024[3]). A litre of unleaded petrol cost EUR 1.28 in France and EUR 0.97 in Luxembourg (European Commission, 2026[4]). Where such gaps exist, part of local demand leaves the country, and the businesses that lose it are often small ones.",
  "The reverse also holds. French border towns attract Swiss, Belgian and Italian shoppers, and some commercial zones near Geneva or Strasbourg depend heavily on them. The Grand Genève consumption survey estimates that Swiss residents of the Geneva area spend EUR 482 million a year in France, three times what French residents spend in Switzerland (Grand Genève, 2024[5]). For these areas, the border is an asset to be managed rather than a threat.",
].forEach((t) => children.push(P(t)));
children.push(H2("1.2. Scope, data and approach"));
[
  "The chapter covers the eight land borders of metropolitan France: Belgium, Luxembourg, Germany, Switzerland, Italy, Monaco, Spain and Andorra. It asks four questions. How large are cross-border retail flows, and in which direction? Which types of business gain or lose? How does France compare with other European countries with large price differences at their borders? And do current policies address these patterns?",
  "The analysis rests on a spatial interaction model of the Huff type, estimated separately for everyday goods and comparison goods (Box 1). For tobacco, where the choice is between buying locally and making a trip abroad, a simpler model is calibrated on the sales increases observed when borders closed between March and June 2020. The policy review draws on official sources from the European Commission, French ministries and agencies, parliamentary documents, chambers of commerce and cross-border observatories.",
].forEach((t) => children.push(P(t)));
children.push(...box("Box 1.", "How the cross-border spending model works", [
  "The model estimates where the residents of each 2 km grid square spend their retail budget. Destinations are the 707 town centres and 595 peripheral commercial zones located within 70 km of a French land border, identified from OpenStreetMap shop data (OpenStreetMap contributors, 2026[6]).",
  "Each destination has an attractiveness score based on the number and type of shops, the share of comparison goods, the diversity of the offer, the presence of anchor stores, restaurants and cafés, and national chains. The probability that a household chooses a destination rises with this attractiveness and falls with road travel time, calculated on the motorway-to-secondary road network. Two further terms capture the border: a friction factor for crossing it (language, habits, customs) and the ratio of national price levels for the relevant basket of goods (Eurostat, 2025b[7]).",
  "Household budgets combine population from the 2021 census grid (Eurostat, 2023[8]) with spending per inhabitant by country and product group. Everyday goods (food, drink, tobacco) and comparison goods (clothing, furnishings, equipment) are modelled separately, with a stronger distance effect for everyday goods.",
  "Except for tobacco, the parameters are values commonly used in the literature, not estimates from observed flows. The results should therefore be read as orders of magnitude. A sensitivity analysis varies the border friction and the price effect; the direction of the balance with Germany, Spain, Belgium and Italy holds in all scenarios, while the balances with Switzerland and Luxembourg depend on the price effect. Annex A gives further detail.",
]));
children.push(H2("1.3. Structure of the chapter"));
children.push(P("Section 2 presents the estimated retail flows along France's land borders and identifies the businesses and territories most affected. Section 3 turns to excise goods, tobacco and fuel. Section 4 places France in a European perspective and reviews how other countries have responded to similar pressures. Section 5 reviews the policy framework and identifies gaps. Section 6 concludes and sets out recommendations."));

// 2. Flows
children.push(H1("2. Cross-border retail flows along France's land borders"));
children.push(H2("2.1. A two-way border with sharp differences between neighbours"));
[
  "Residents of the French border strip spend an estimated EUR 6.1 billion a year in retail outlets across the border, excluding fuel. Residents of the neighbouring strips spend around EUR 6.0 billion in France. At the aggregate level the border is therefore close to balanced, which distinguishes France from countries such as Norway or Switzerland, whose residents shop abroad but receive few foreign shoppers in return (Section 4).",
  "The aggregate hides large differences between borders (Figure 1, Table 1). France runs a deficit of around EUR 840 million a year with Germany, where lower food and drink prices and dense retail offers in towns such as Kehl, Saarbrücken and Lörrach attract Alsatian and Lorraine shoppers. The deficit with Spain, around EUR 450 million, is the most one-sided: French residents spend almost five times more in Spain than Spanish residents spend in France. By contrast, France gains around EUR 620 million from Switzerland, where prices are higher, and around EUR 380 million from Belgium, largely because the Lille metropolitan area attracts Belgian shoppers.",
].forEach((t) => children.push(P(t)));
children.push(...caption("Figure 1.", "Cross-border retail spending by neighbouring country", "EUR million per year, residents living within 40 km of the border, excluding fuel"));
children.push(figure("fig2_border_balance.png"));
children.push(...noteSource("Monaco and Andorra are not shown (flows below EUR 50 million). Estimates from an uncalibrated spatial interaction model; they indicate orders of magnitude.",
  "Authors' calculations based on OpenStreetMap contributors (2026[6]), Eurostat (2023[8]; 2025b[7])."));
children.push(...caption("Table 1.", "Balance of cross-border retail spending for France", "EUR million per year"));
children.push(table(
  ["Neighbour", "Spent by French residents in the neighbour", "Spent by neighbours' residents in France", "Net for France", "Balance index", "Robust to assumptions"],
  [["Germany", "2 104", "1 262", "−842", "−0.25", "Yes"], ["Spain", "567", "120", "−447", "−0.65", "Yes"],
   ["Switzerland", "973", "1 593", "+619", "+0.24", "Depends on price effect"], ["Belgium", "1 801", "2 181", "+380", "+0.10", "Yes"],
   ["Luxembourg", "476", "579", "+103", "+0.10", "No (fuel not modelled)"], ["Italy", "141", "200", "+59", "+0.17", "Yes"],
   ["Monaco", "44", "32", "−12", "−0.16", "–"], ["Andorra", "7", "0", "−7", "−0.94", "Underestimated"],
   ["**Total**", "**6 113**", "**5 967**", "**−147**", "**−0.01**", ""]],
  [1500, 1650, 1650, 1150, 1100, 1976], { num: [1, 2, 3, 4] }));
children.push(...noteSource("The balance index is (inflow − outflow) / (inflow + outflow) and ranges from −1 (spending only leaves France) to +1 (spending only enters France). \"Robust\" means the sign of the balance holds across all border-friction and price-elasticity scenarios tested.",
  "Authors' calculations."));
children.push(P("The composition of the flows differs by direction. French residents who cross the border spend more on everyday goods (EUR 3.5 billion) than on comparison goods (EUR 2.6 billion), which is consistent with trips motivated by price. Foreign residents who shop in France spend more on comparison goods (EUR 3.2 billion) than on everyday goods (EUR 2.7 billion). They are attracted by the range and density of the French offer, particularly in town centres such as Lille, Strasbourg and Annecy and in large shopping centres near the border."));
children.push(H2("2.2. Where the spending goes: town centres and peripheral zones"));
[
  "The type of destination also differs. Around 86% of the spending of French residents abroad goes to town centres, reflecting the density of shops in German, Belgian and Spanish border towns. Foreign residents shopping in France direct 36% of their spending to peripheral commercial zones, and Luxembourg residents as much as 65%. Some French zones depend heavily on foreign customers: foreign residents account for around 52% of the modelled turnover of the Roppenheim outlet centre near the German border, 41% at Val Thoiry and in Saint-Julien-en-Genevois, and around a third at Étrembières and Géric (Terville).",
  "On the other side of the border, several German towns rely on French customers to a remarkable degree. French residents account for an estimated 62% of the modelled retail turnover of Weil am Rhein, 56% of Rheinfelden and 46% of Kehl. These border towns illustrate the concentration of flows in a small number of gateway locations, a pattern also observed between Norway and Sweden (Section 4).",
  "The attractiveness scores show that French town centres are, on average, less attractive than their German and Swiss neighbours. The median score of French town centres is 55 out of 100, the same as in Belgium, against 62 in Germany and 71 in Switzerland. The most attractive destinations in the study area are the centres of Lille, Luxembourg, Ghent, Bern, Brussels, Basel, Annecy and Strasbourg.",
].forEach((t) => children.push(P(t)));
children.push(H2("2.3. Which territories are most exposed"));
children.push(P("Exposure is highly concentrated (Figure 2). Residents living near the Luxembourg and German borders in Meurthe-et-Moselle and Moselle send an estimated 35% and 30% of their comparison-goods spending abroad. The Pyrénées-Atlantiques and Haut-Rhin follow at around 25%. In net terms, Moselle loses around EUR 350 million a year and the Pyrénées-Atlantiques around EUR 280 million, while Haute-Savoie gains around EUR 480 million and the Nord around EUR 350 million."));
children.push(...caption("Figure 2.", "Share of residents' spending on comparison goods that goes abroad", "2 km grid squares within 40 km of a French land border"));
children.push(figure("fig1_leakage_map.png", 560));
children.push(...noteSource("Comparison goods are clothing, footwear, furnishings, household equipment and leisure goods. Darker squares indicate a higher share of spending made in another country. The black line shows France's land borders.",
  "Authors' calculations based on OpenStreetMap contributors (2026[6]) and Eurostat (2023[8])."));
children.push(H2("2.4. Who gains and who loses: independents and chains"));
[
  "To identify the businesses affected, the model compares the current situation with a hypothetical one in which no one crosses the border. The difference is then divided between shops belonging to national or international chains and independent shops, according to their weight in each destination's retail offer. Chains are identified by brand information in OpenStreetMap, which includes franchises; independent shops are mostly SMEs.",
  "The main dividing line runs between product groups rather than between types of business (Figure 3). All categories gain on comparison goods, by between 2.9% and 4.6% of turnover. All lose on everyday goods, and the losses are largest in peripheral zones: around EUR 370 million a year for chains and EUR 130 million for independents, or around 4% of their everyday-goods turnover. Independent shops in town centres gain the most in absolute terms on comparison goods (around EUR 230 million) but lose around EUR 190 million on everyday goods. Overall, independents are close to break-even, while chains lose around EUR 150 million, or 0.6% of turnover.",
  "This overall result conceals one clear exception. Tobacconists are almost all independent, and they bear a loss that the general model understates. Section 3 examines this case using observed data.",
].forEach((t) => children.push(P(t)));
children.push(...caption("Figure 3.", "Net effect of open borders on French retail turnover, by product group, location and ownership", "EUR million per year and, in brackets, share of turnover"));
children.push(figure("fig3_impact_by_type.png"));
children.push(...noteSource("Net effect = spending by foreign residents minus the spending of French residents that goes abroad, compared with a situation in which no one crosses the border. \"Chains\" are shops carrying a brand tag in OpenStreetMap, including franchises. Excludes fuel.",
  "Authors' calculations."));

// 3. Excise goods
children.push(H1("3. Excise goods: tobacco and fuel"));
children.push(H2("3.1. Tobacco: evidence from the 2020 border closure"));
[
  "Tobacco and fuel differ from other retail products. Points of sale are present in almost every village, so the choice facing a consumer is not which shop to visit but whether to make a trip abroad. Price differences are also much larger, as they result mainly from excise duties. For these products, the chapter uses a simpler model in which households choose between buying locally and travelling to the nearest outlet in a cheaper country (Annex A).",
  "The closure of land borders between 16 March and 15 June 2020 offers a rare opportunity to observe what happens when cross-border purchases become impossible. Tobacco sales in the border départements rose by 21.9% in the second quarter of 2020, against 2.4% in the rest of France (Douchet, 2021[9]). The increase reached 44.6% along the borders with Germany and Luxembourg, 44.5% along the Spanish and Andorran border and 28.8% along the Belgian border, but only 2.6% along the Swiss border, where prices are close to French levels (Assemblée nationale, 2021[10]). At national level, INSEE estimates the surplus of sales during the closure at 9.5% (Hillion and Monchâtre, 2024[3]).",
].forEach((t) => children.push(P(t)));
children.push(...box("Box 2.", "Using the 2020 border closure to calibrate the tobacco model", [
  "The tobacco model has four parameters: the general propensity to buy abroad, the rate at which this propensity declines with travel time, the sensitivity to the price gap between countries, and an additional friction for Switzerland, which lies outside the EU customs union. They were estimated by fitting the model's predictions to twelve observed figures:",
  boxBullet("the sales increase by border façade during the closure, net of the increase in non-border départements (Douchet, 2021[9]; Assemblée nationale, 2021[10]);"),
  boxBullet("the national surplus and the surplus by access time to the border (Hillion and Monchâtre, 2024[3]);"),
  boxBullet("figures for five départements reported in answers to parliamentary questions (Sénat, 2020[11]; Assemblée nationale, 2020[12])."),
  "The model reproduces the national surplus (10.0% against 9.5%) and the main façades well. It overestimates the Swiss façade and Moselle, where cross-border commuters were still allowed to travel to Luxembourg during the closure and probably continued to buy tobacco there. It underestimates the very steep increase observed within ten minutes of the border.",
  "The estimated price sensitivity (3.1) is identical to the elasticity of cross-border cigarette purchases estimated for US state borders (DeCicca, Kenkel and Liu, 2013[13]), which gives some confidence in the result.",
]));
children.push(...caption("Figure 4.", "Observed and modelled increase in tobacco sales during the 2020 border closure", "Per cent, net of the increase in non-border départements where applicable"));
children.push(figure("fig4_tobacco_fit.png"));
children.push(...noteSource("Façade figures cover 16 March–14 June 2020 compared with the same period of 2019; département figures cover April–May 2020. The INSEE figures by access time to the border are not netted.",
  "Douchet (2021[9]); Assemblée nationale (2020[12]; 2021[10]); Sénat (2020[11]); Hillion and Monchâtre (2024[3]); authors' calculations."));
[
  "In normal times, the calibrated model estimates that 9.1% of French cigarette consumption is bought legally in neighbouring countries. This is consistent with INSEE's lower-bound estimate of 9.5% of sales and with KPMG's estimate that 11.9% of consumption in France comes from legal purchases abroad (KPMG, 2025[14]). Valued at 2020 prices, these purchases amount to around EUR 1.7 billion a year: around EUR 350 million each in Italy, Luxembourg and Belgium, EUR 250–270 million each in Germany and Spain, and EUR 190 million in Andorra.",
  "Consumers travel far for tobacco. The attraction of a trip halves only after about an hour of driving, against a few minutes for everyday groceries. The effects therefore extend well beyond the immediate border area, and the impact on tobacconists is large across entire départements (Figure 5). If cross-border purchases returned to French outlets, tobacconists' sales would increase by around 60% in the Pyrénées-Orientales, 55% in Ariège and Moselle, and more than 30% in Meurthe-et-Moselle, the Alpes-Maritimes, Bas-Rhin, Haute-Garonne, the Pyrénées-Atlantiques, the Ardennes and the Meuse.",
  "These figures should be read in context. Most of the retail price of a pack of cigarettes consists of taxes, so the direct loss for a tobacconist is the margin on lost sales and the loss of footfall for other activities such as press, lottery and café services. The largest loser in financial terms is the State. France's high tobacco taxes are a public health instrument, and nothing in this analysis suggests they should be lowered (Section 4).",
].forEach((t) => children.push(P(t)));
children.push(...caption("Figure 5.", "Increase in tobacconists' sales if cross-border purchases returned to France", "Per cent of current sales, border départements with an increase above 20%"));
children.push(figure("fig5_tobacco_departements.png"));
children.push(...noteSource("Model calibrated on the 2020 border closure, 2020 prices. Includes purchases by residents of the whole département, not only the border strip.",
  "Authors' calculations based on Hillion and Monchâtre (2024[3]), Douchet (2021[9]) and DGDDI (2026[15])."));
children.push(H2("3.2. Fuel: a blind spot"));
[
  "Fuel prices also differ widely. During the 2020 closure, a litre of unleaded petrol cost EUR 1.28 in France, EUR 1.17 in Belgium, EUR 1.12 in Spain and EUR 0.97 in Luxembourg (European Commission, 2026[4]). In Luxembourg, non-residents account for around two-thirds of road fuel consumption (IEA, 2020[16]).",
  "The same calibration approach does not work for fuel with public data. Sales by département are available only on an annual basis (SDES, 2024[17]), and the three-month closure represents about 17% of gasoline sales in 2020. The effect of lockdown on traffic and local shocks, such as industrial shutdowns, dominate the changes between 2019 and 2020. The best fit is obtained with no border effect, which means the data cannot detect one, not that none exists. Some départements behave as expected, with sales holding up better in the Pyrénées-Atlantiques (+9 points relative to the rest of France) and the Nord (+4 points), but the pattern is not systematic. Monthly data by département would be needed to measure fuel flows, and service stations are often the anchor of retail activity in rural border areas.",
].forEach((t) => children.push(P(t)));

// 4. International
children.push(H1("4. France in international perspective"));
children.push(H2("4.1. Inflows and outflows compared with other European countries"));
[
  "Three indicators allow France to be compared with other European countries: flows of cigarettes, household spending across borders as recorded in national accounts, and dedicated estimates of border shopping. Each covers a different scope, and together they give a consistent picture.",
  "For tobacco, KPMG's annual study of 38 European markets estimates for each country the share of consumption bought legally abroad and the share of legal sales consumed abroad (KPMG, 2025[14]). France is among the largest net importers (Figure 6). Around 11.9% of cigarettes consumed in France are bought legally abroad, while only 1.3% of French sales are consumed outside France. Relative to consumption, only Norway, the Netherlands, Ireland and Germany import more on a net basis. France also has the highest share of contraband and counterfeit cigarettes in Europe, at 37.6% of consumption. Several of its neighbours are major exporters: Luxembourg sells 88% of its legal cigarettes to non-residents, and Spain 10%. The study is commissioned by a tobacco manufacturer, and its estimates of illicit trade have been questioned; its figures on legal flows are consistent with the independent estimates presented in Section 3.",
].forEach((t) => children.push(P(t)));
children.push(...caption("Figure 6.", "Cigarettes bought abroad and sold to non-residents, selected European countries, 2024", "Per cent"));
children.push(figure("fig6_tobacco_international.png"));
children.push(...noteSource("Left: share of consumption bought legally abroad, including duty-free. Right: share of legal domestic sales consumed in other countries. Contraband and counterfeit are excluded. Countries sorted by net position. Luxembourg's value is truncated (88%).",
  "KPMG (2025[14])."));
children.push(P("National accounts record all spending by residents abroad and by non-residents in the country, including tourism (Eurostat, 2025a[18]). On this broader measure, France is a net earner: non-residents' spending equals 4.4% of household consumption in France, while French residents spend the equivalent of 3.5% of their consumption abroad (Figure 7). Belgium, Germany and Norway are net spenders abroad. The measure includes hotels, restaurants and transport, so tourist destinations such as Spain, Italy and France look favourable. It confirms, however, that France's high prices do not push household spending abroad across the board."));
children.push(...caption("Figure 7.", "Household spending abroad and spending by non-residents, selected European countries, 2023", "Per cent of household final consumption"));
children.push(figure("fig7_household_international.png"));
children.push(...noteSource("Left: final consumption expenditure of resident households in the rest of the world (P33) as a share of household consumption (national concept). Right: final consumption expenditure of non-resident households on the economic territory (P34) as a share of household consumption (domestic concept). Includes tourism.",
  "Eurostat (2025a[18])."));
children.push(P("Dedicated estimates of border shopping exist in a few countries (Table 2). They show that Swiss residents spend the most per inhabitant in shops abroad, followed by Danish and Norwegian residents. France's estimated outflow per inhabitant is lower at national level, but among residents of the border strip it reaches around EUR 565 a year, closer to Swiss levels. What sets France apart is that the flow runs in both directions."));
children.push(...caption("Table 2.", "Estimates of border shopping, selected countries", null));
children.push(table(
  ["Country", "Measure and source", "Total", "Per inhabitant (approx.)", "Direction"],
  [["Switzerland", "Purchases in physical shops abroad, 2025 (IRM-HSG, 2025[19])", "CHF 7–8 billion", "EUR 880", "Outward"],
   ["Denmark", "Grocery border trade, 2024 (DSK, 2025[20])", "DKK 9 billion +", "EUR 200", "Outward"],
   ["Norway", "Day-trip border shopping, 2024 (SSB, 2025[21])", "NOK 11 billion", "EUR 170", "Outward"],
   ["**France**", "Retail excluding fuel, border strip, plus cigarettes (authors' calculations)", "EUR 6.1 bn + 1.7 bn out\nEUR 6.0 bn in", "EUR 115 nationally\nEUR 565 per border-strip resident", "Both ways"]],
  [1250, 3100, 1650, 1800, 1226], { highlight: (r) => r[0] === "**France**" }));
children.push(...noteSource("Per-inhabitant values use national population and approximate 2024–25 exchange rates. Sources use different methods (official survey, industry estimate, academic study, model); only orders of magnitude are comparable.",
  "IRM-HSG (2025[19]); DSK (2025[20]); SSB (2025[21]); authors' calculations."));
children.push(H2("4.2. How other countries have responded"));
[
  "Several European countries have faced large and persistent price gaps with their neighbours (Table 3). Their experience offers six lessons for France.",
  "First, **countries that manage border shopping measure it**. Statistics Norway publishes a quarterly survey of border shopping (SSB, 2025[21]), the Danish tax ministry publishes estimates with a documented method, Germany relies on an annual empty-pack survey for tobacco, and the Irish Revenue Commissioners have used station-level data to estimate fuel tourism (Kennedy et al., 2017[22]). France relies on occasional studies and on answers to parliamentary questions.",
  "Second, **cutting taxes to match a neighbour reduces leakage only partly and has costs**. Denmark abolished its soft-drink tax in 2014, explicitly to protect retail jobs in the border region (Lexology, 2013[23]). Norway repealed its sugar taxes on chocolate and soft drinks in 2021, partly because of border trade with Sweden (News in English, 2022[24]). Finland cut alcohol excise by a third in 2004 before Estonia joined the EU; alcohol consumption rose by 10% in 2004, and deaths from alcohol-related liver disease rose by 46% between 2001–03 and 2004–06 (Mäkelä and Österberg, 2009[25]).",
  "Third, **convergence on the other side of the border is what reduces flows durably**. The share of non-German-taxed cigarettes in Germany coming from Czechia halved between 2020 and 2024 as Czech prices rose (Statista, 2025[26]). Luxembourg has raised its diesel excise as part of its climate policy (OECD, 2025[27]).",
  "Fourth, **tighter allowances and controls have limited effect when price gaps are large**. Switzerland halved its duty-free allowance to CHF 150 in January 2025 (BAZG, 2024[28]), yet purchases abroad continued to rise (IRM-HSG, 2025[19]).",
  "Fifth, **flows concentrate in a few gateway towns**. Strömstad alone receives 57% of Norwegian spending in Sweden (SSB, 2025[21]). The same pattern appears on France's borders, which argues for targeting at town rather than département level.",
  "Sixth, **price gaps can open suddenly**. The depreciation of sterling in 2008–09 raised cross-border shopping from Ireland to Northern Ireland by 25% within a year (Irish Times, 2009[29]).",
].forEach((t) => children.push(P(t)));
children.push(...caption("Table 3.", "Policy responses to cross-border shopping in selected countries", null));
children.push(table(
  ["Border", "Products and scale", "Measurement", "Policy response"],
  [["Denmark → Germany, Sweden", "Beer, soft drinks, sweets, tobacco; grocery border trade above DKK 9 billion (2024)", "Tax ministry estimates; retail associations", "Soft-drink tax halved in 2013, abolished in 2014 to protect border-region retail"],
   ["Norway → Sweden", "NOK 11 billion (2024), 43% groceries; 57% in Strömstad", "Quarterly official survey (SSB)", "Sugar taxes on chocolate and soft drinks repealed in 2021"],
   ["Finland → Estonia", "Alcohol after 2004 EU enlargement", "Government monitoring of traveller imports", "Alcohol excise cut by 33% in 2004; sharp rise in alcohol-related harm"],
   ["Switzerland → neighbours", "CHF 9.2 billion abroad (2025)", "University studies (IRM-HSG)", "Duty-free allowance halved to CHF 150 in 2025"],
   ["Germany → Poland, Czechia", "19.8% of cigarettes not German-taxed (2024)", "Annual empty-pack survey", "No tax cut; leakage fell as neighbours' prices rose"],
   ["Luxembourg ← neighbours (fuel)", "About two-thirds of road fuel bought by non-residents", "Government, IEA and OECD reviews", "Diesel excise raised under climate policy"],
   ["Ireland ↔ Northern Ireland", "Groceries and alcohol (2008–09); 13% of Irish diesel sales to cross-border buyers (2013–15)", "Household survey; station-level tax data", "Pressure for excise cuts; monitoring of fuel tourism"],
   ["US state borders", "13–25% of consumers buy cigarettes in border areas", "Academic studies", "PACT Act (2010): registration, reporting and tax stamps for remote sales"]],
  [1900, 2600, 2000, 2526]));
children.push(...noteSource(null,
  "DSK (2025[20]); Lexology (2013[23]); SSB (2025[21]); News in English (2022[24]); Mäkelä and Österberg (2009[25]); IRM-HSG (2025[19]); BAZG (2024[28]); Statista (2025[26]); IEA (2020[16]); OECD (2025[27]); Irish Times (2009[29]); Kennedy et al. (2017[22]); Lovenheim (2008[30]); DeCicca, Kenkel and Liu (2013[13]); ATF (n.d.[31])."));

// 5. Policy framework
children.push(H1("5. The policy framework and its gaps"));
children.push(P("A review of 29 instruments at EU, national, bilateral and local levels shows that 9 were designed specifically for border areas, 10 include a border clause or option, and 10 make no reference to borders. Annex B lists them."));
children.push(H2("5.1. EU level"));
[
  "The BRIDGEforEU Regulation, in force since June 2025, requires each member state to set up a cross-border coordination point to identify and resolve legal and administrative obstacles (European Parliament and Council of the EU, 2025[32]). It does not address retail directly, but it offers a channel for obstacles facing small traders. The proposed revision of the Tobacco Taxation Directive would raise EU minimum excise duties, partly adjusted to national price levels, from 2028 (European Commission, 2025[33]). It is the only EU instrument acting on the price gaps that drive cross-border tobacco purchases, though it does not cover Andorra or Switzerland.",
  "Interreg cross-border programmes reach retail SMEs only indirectly. The France–Wallonia–Flanders, Upper Rhine and France–Switzerland programmes fund SME digitalisation, including e-commerce, and advisory services, but retail is not a named target. The Grande Région programme, which covers the borders with Germany and Luxembourg where France's largest deficits arise, has no priority for SMEs at all (Interact, 2026[34]). The EU transition pathway for retail sets a voluntary agenda for the green and digital transition of retail SMEs without a territorial dimension (European Commission, 2024[35]).",
].forEach((t) => children.push(P(t)));
children.push(H2("5.2. National level"));
[
  "The main national programmes for town centres and local retail do not take borders into account. Action Cœur de Ville covers 234 medium-sized towns with EUR 5 billion committed by partners over 2023–26 (Banque des Territoires, n.d.[36]). The plan for local retail adopted in November 2025 adds EUR 100 million in 2026 for property companies that buy and refurbish vacant shops, EUR 20 million for town-centre managers, and measures on vacancy taxation and governance (DGE, 2025[2]). The France Ruralités Revitalisation zones, which replaced the former rural revitalisation zones in 2024, offer five years of profit-tax exemption to businesses with fewer than 11 employees, based on population density and income (AMF, 2024[37]). The plan to transform peripheral commercial zones selected 74 projects for EUR 26 million (Ministère de l'Économie, 2023b[38]). None of these instruments uses exposure to neighbouring countries as a criterion, and the density and income criteria of the rural zones exclude most urban border towns where the model finds the largest losses.",
  "Commercial planning is similarly limited. The Climate and Resilience Act prohibits new retail developments on undeveloped land, with exemptions below 10 000 m² (République française, 2021[39]; 2022[40]), without considering supply across the border. The 3DS law of 2022 allows foreign neighbouring municipalities to take part in consultations of the departmental commissions for commercial planning, but does not require an assessment of cross-border effects (MOT, 2022[41]).",
  "Border-specific measures concern mainly tobacco. The protocol with tobacconists for 2023–27 finances the transformation of outlets with up to EUR 33 000 per business and, in border départements, extends the end-of-activity indemnity and raises the diversification bonus to EUR 2 500 (Ministère de l'Économie, 2023a[42]; Confédération des buralistes, 2023[43]). This bonus is a flat amount, whereas the calibrated model shows that the share of sales at stake varies from about 10% to 60% between départements. Since March 2024, customs can treat a purchase of tobacco abroad as commercial on the basis of twelve criteria, from one carton (DGDDI, 2024[44]). This strengthens enforcement but does not change the price gap.",
].forEach((t) => children.push(P(t)));
children.push(H2("5.3. Bilateral and local levels"));
[
  "Several bilateral frameworks recognise the specific situation of border areas. The Treaty of Aachen created a Franco-German cross-border cooperation committee to examine obstacles arising from legislation (MOT, n.d.[45]), and the European Collectivity of Alsace leads cross-border cooperation in its territory (République française, 2019[46]). Relations with Luxembourg are more difficult. At the December 2025 session of the intergovernmental commission, fiscal compensation for French border territories was not on the agenda (L'essentiel, 2025[47]), despite calls from the Meurthe-et-Moselle département for a fairer framework (Département de Meurthe-et-Moselle, 2025[48]). A proposal for a border compensation grant tabled in the Senate has not been adopted (Sénat, 2023[49]).",
  "At local level, a few chambers of commerce and observatories measure cross-border shopping. The CCI Moselle maintains a household purchasing panel that covers neighbouring areas of Germany, Belgium and Luxembourg (CCI Moselle, 2019[50]). The Grand Genève consumption survey and the Geneva cross-border statistical observatory provide the most detailed data on the Franco-Swiss border (Grand Genève, 2024[5]). The CCI Bayonne Pays Basque publishes data on spending retention and leakage in the Basque Country. These efforts use different methods and cover only parts of the border.",
].forEach((t) => children.push(P(t)));
children.push(H2("5.4. Main gaps"));
children.push(P("Set against the findings of Sections 2 to 4, the review points to eight gaps (Table 4)."));
children.push(...caption("Table 4.", "Gaps between the policy framework and cross-border retail patterns", null));
children.push(table(
  ["", "Gap", "Evidence"],
  [["1", "Programmes do not take borders into account", "No border criterion in Action Cœur de Ville, Petites Villes de Demain, the 2025 plan, rural revitalisation zones or the commercial-zone plan; urban border towns mostly excluded from rural tax zones"],
   ["2", "Cross-border flows are not measured officially", "Only local and heterogeneous surveys; tobacco sales by département and monthly fuel sales not published"],
   ["3", "Support for tobacconists is not proportional to exposure", "Flat EUR 2 500 bonus against 10–60% of sales at stake; EU minimum rates apply only from 2028"],
   ["4", "Commercial planning ignores supply across the border", "Consultation of foreign municipalities optional; no cross-border impact assessment"],
   ["5", "Interreg barely reaches retail", "No SME priority in the Grande Région programme; elsewhere limited to digitalisation"],
   ["6", "Border communes bear costs without compensation", "Fiscal compensation off the France–Luxembourg agenda; Senate proposal not adopted"],
   ["7", "Foreign customers are not actively cultivated", "No programme for small retailers serving Swiss or Belgian customers; VAT refund from EUR 100.01 with paperwork"],
   ["8", "Fuel is a blind spot", "No public data to measure flows; no policy addresses the role of service stations in rural border retail"]],
  [500, 3000, 5526]));
children.push(...noteSource(null, "Authors' assessment based on the sources cited in Section 5 and Annex B."));

// 6. Conclusion and recommendations
children.push(H1("6. Conclusion and recommendations"));
children.push(H2("6.1. Conclusion"));
[
  "France's land borders are not a uniform source of leakage. For general retail, the flows run in both directions and roughly offset each other, and France earns more from foreign visitors than its residents spend abroad once tourism is included. This distinguishes France from countries such as Norway, Denmark or Switzerland, whose high prices push spending outwards across the board.",
  "The pressure is concentrated on specific products, territories and businesses. Everyday goods, and above all tobacco, leave the country where price gaps are large. The losses fall on supermarkets in peripheral zones, on tobacconists and on a limited number of territories along the borders with Germany, Luxembourg and Spain. At the same time, town centres and commercial zones near Switzerland and Belgium benefit from foreign customers.",
  "The policy framework does not reflect this geography. National retail programmes ignore borders, the instruments that do address them are mostly about governance or enforcement, and the data needed to target support do not exist in official form. Policy should therefore be targeted at the places and products most exposed, rather than aimed at the competitiveness of retail in general, while the advantages France enjoys in comparison goods and tourism are preserved.",
].forEach((t) => children.push(P(t)));
children.push(H2("6.2. Recommendations"));
children.push(P("The nine recommendations below are grouped in two priorities. The first four can be implemented within existing budgets and legal bases in 2026–27. The others require negotiation with neighbouring countries or the EU, or new legislation. Table 5 summarises them."));
const recs = [
  ["Create a border exposure index and use it to target existing programmes.", "DGE, ANCT and INSEE should publish an annual index at intercommunal level measuring the share of residents' retail spending that goes abroad. It should be used to reserve part of the 2026 envelopes for property companies and town-centre managers for the most exposed intercommunalities, as a selection criterion in the programmes that follow Action Cœur de Ville and Petites Villes de Demain after 2026, and to extend the tax treatment of the rural revitalisation zones to small town-centre shops in highly exposed border communes."],
  ["Build an official measure of cross-border retail spending.", "INSEE and DGE should set up an observatory of cross-border retail that brings together the existing local surveys under a common method. A quarterly module in an existing household survey, on the model of Statistics Norway, would provide a national indicator. DGDDI should publish monthly tobacco deliveries by département and commission an official empty-pack survey, as in Germany, and SDES should publish monthly fuel sales by département. Card-payment data and mobile footfall data, such as the mytraffic and FACT observatory, could complement these sources."],
  ["Make support for tobacconists proportional to exposure.", "Within the remaining years of the 2023–27 protocol, transformation aid and the diversification bonus should be modulated according to the share of sales at stake in each département, for example in three bands above 20%, 35% and 50%. Priority should go to conversion into local service points (parcels, payments, public services) in exposed rural communes. Tobacco taxes should not be reduced: the Finnish experience shows the health cost of aligning prices with a neighbour."],
  ["Require a cross-border impact assessment in commercial planning.", "Applications to the departmental commissions for commercial planning, and the commercial planning documents of territorial coherence schemes within 30 km of a land border, should include an assessment of catchment overlap with supply across the border. Consultation of foreign authorities, which the 3DS law already allows, should become the default."],
  ["Help small retailers capture foreign customers.", "VAT refunds for Swiss and Andorran residents should be fully digital at the point of sale, with validation at the main road crossings and a simpler process for small shops. Cross-border marketing of town centres, supported by Interreg and chambers of commerce, should target the Genevois, the Jura, the Lille area and the Nice–Menton area."],
  ["Include proximity retail in Interreg 2028–2034 and use BRIDGEforEU.", "France's position for the next cohesion period should call for a strand on proximity retail and town centres in the Grande Région, Upper Rhine and POCTEFA programmes. The French cross-border coordination point should collect obstacles facing small traders and bring them to the Franco-German committee and to bilateral bodies with Spain and Luxembourg."],
  ["Seek co-development funding for the most exposed border towns.", "France should negotiate with Luxembourg a co-development fund with a line dedicated to the revitalisation of town-centre retail in the most exposed communes, taking the Franco-Genevan compensation for cross-border workers as a reference. Failing agreement, the border compensation grant proposed in the Senate could be examined, targeted using the exposure index."],
  ["Keep up pressure for convergence of excise duties.", "France should support an ambitious revision of the Tobacco Taxation Directive with the shortest possible transition, raise price gaps on tobacco and fuel in bilateral talks with Andorra, and use climate and energy tax cooperation with Luxembourg to narrow the fuel gap. Remote and online tobacco sales should be made traceable through registration and reporting requirements, following the US PACT Act."],
  ["Set up a trigger mechanism for sudden price or currency shocks.", "When the price gap with a neighbour on a basket of monitored products, or the exchange rate, moves beyond a set threshold for two consecutive quarters, a pre-agreed temporary envelope should open for the most exposed intercommunalities. This is preferable to reactive tax cuts."],
];
recs.forEach(([t, d], i) => children.push(new Paragraph({
  spacing: { after: 140, line: 276 }, alignment: AlignmentType.JUSTIFIED,
  children: [run(`${i + 1}. ${t} `, { bold: true, size: 21, color: BLUE }), ...runs(d, { size: 21 })],
})));
children.push(...caption("Table 5.", "Summary of recommendations", null));
children.push(table(
  ["", "Recommendation", "Lead", "Priority", "Indicator"],
  [["1", "Border exposure index to target existing programmes", "DGE, ANCT, INSEE, Banque des Territoires", "1 (2026–27)", "Share of envelopes reaching the most exposed intercommunalities"],
   ["2", "Official measure of cross-border retail spending", "INSEE, DGE, DGDDI, SDES", "1 (2026–27)", "Quarterly indicator published; open data by département"],
   ["3", "Tobacconist support proportional to exposure", "Ministry of the Economy, DGDDI, Confédération des buralistes", "1 (2026–27)", "Closures in border départements compared with national trend"],
   ["4", "Cross-border impact assessment in commercial planning", "DGE, DGALN, prefectures", "1 (2026–27)", "Share of border applications with an assessment"],
   ["5", "Capture foreign customers", "DGDDI, Business France, CCIs", "2", "VAT refund forms issued by small shops in border départements"],
   ["6", "Proximity retail in Interreg; use of BRIDGEforEU", "SGAE, ANCT, regions", "2", "Retail projects funded; obstacles resolved"],
   ["7", "Co-development funding for exposed towns", "Ministry for Europe and Foreign Affairs, border départements", "2", "Funds committed per exposed commune"],
   ["8", "Convergence of excise duties", "Ministry of the Economy (DLF), SGAE", "2", "Price gap per pack; share of consumption bought abroad"],
   ["9", "Trigger mechanism for price and currency shocks", "DGE, DG Trésor, ANCT", "2", "Time between shock and support"]],
  [400, 2600, 2300, 1100, 2626]));
children.push(...noteSource("Priority 1: feasible within existing budgets and legal bases in 2026–27. Priority 2: requires negotiation or legislation.", "Authors."));

// Annex A
children.push(H1("Annex A. Data and methodology"));
children.push(H2("Spatial interaction model"));
[
  "For each resident grid square *i* and destination *j*, the utility of shopping in *j* for product group *s* is the product of four terms: the attractiveness of *j* raised to a power α, an exponential distance decay exp(−β·t), where *t* is road travel time in minutes, a border friction θ applied when *i* and *j* are in different countries, and the ratio of price levels between the two countries raised to the power −γ. The probability of choosing *j* is its utility divided by the sum of utilities of all destinations reachable within 75 minutes. Spending flows are the product of these probabilities, population and spending per inhabitant.",
  "Default parameters are α = 1, β = 0.12 per minute for everyday goods and 0.06 for comparison goods, θ = 0.55 within the EU, 0.40 for Switzerland and Andorra and 0.90 for Monaco, and γ = 2. Sensitivity tests multiply θ by 0.5 to 1.6 and set γ to 0, 2 and 3.",
].forEach((t) => children.push(P(t)));
children.push(H2("Tobacco model"));
children.push(P("For tobacco, the utility of buying locally is set to one, and the utility of a trip to the nearest outlet in a cheaper country *k* is κ·θₖ·exp(−β·t)·(pₖ/p)^(−γ). The estimated parameters are κ = 0.072, β = 0.0116 per minute, γ = 3.1 and θ for Switzerland close to zero. Residents within 200 km of the border are included. 2020 pack prices come from Hillion and Monchâtre (2024[3]) and legal cigarette sales from DGDDI (2026[15])."));
children.push(...caption("Table A.1.", "Data sources", null));
children.push(table(
  ["Data", "Source", "Use"],
  [["Shops, restaurants, retail zones, roads", "OpenStreetMap contributors (2026[6])", "Destinations, attractiveness, travel times"],
   ["Population, 1 km grid, 2021", "Eurostat (2023[8])", "Resident demand"],
   ["Price levels and spending per inhabitant", "Eurostat (2025b[7])", "Price effect and budgets"],
   ["Country boundaries and NUTS regions", "Eurostat GISCO", "Study area"],
   ["Tobacco sales and 2020 closure effects", "DGDDI (2026[15]); Douchet (2021[9]); Hillion and Monchâtre (2024[3]); Assemblée nationale (2021[10])", "Tobacco calibration"],
   ["Fuel sales by département and prices", "SDES (2024[17]); European Commission (2026[4])", "Fuel test"],
   ["Cross-border flows in Europe", "KPMG (2025[14]); Eurostat (2025a[18])", "International comparison"]],
  [2800, 3600, 2626]));
children.push(H2("Limitations"));
[
  "Except for tobacco, the model is not calibrated on observed flows. OpenStreetMap coverage and brand tagging are more complete in France and Germany than in Spain and Italy, which biases the attractiveness scores and the distinction between chains and independents. The model ignores tourists, cross-border commuters shopping near their workplace, online sales and fuel. Travel times assume free-flowing traffic. The international comparison combines sources with different methods and should be read as orders of magnitude.",
].forEach((t) => children.push(P(t)));

// Annex B
children.push(H1("Annex B. Inventory of policy instruments"));
children.push(...caption("Table B.1.", "Instruments reaching retail SMEs in French border areas", null));
const inv = [
  ["EU", "BRIDGEforEU Regulation (EU) 2025/925", "Cross-border coordination points to resolve obstacles", "Partial"],
  ["EU", "Tobacco Taxation Directive revision (proposal, 2025)", "Higher minimum excise from 2028", "Partial"],
  ["EU", "Interreg VI-A France–Wallonia–Flanders", "SME competitiveness, digitalisation, e-commerce", "Partial"],
  ["EU", "Interreg VI-A Upper Rhine", "SME digitalisation and advisory services", "Partial"],
  ["EU", "Interreg VI-A France–Switzerland", "SME digitalisation and e-commerce", "Partial"],
  ["EU", "Interreg VI-A Grande Région", "No SME priority", "None"],
  ["EU", "Interreg VI-A POCTEFA", "SME business development", "Partial"],
  ["EU", "Transition pathway for retail (2024)", "Green, digital and skills agenda for retail SMEs", "None"],
  ["National", "Action Cœur de Ville 2023–26", "Town-centre revitalisation in 234 towns", "None"],
  ["National", "Petites Villes de Demain, Villages d'avenir", "Support for small towns and villages", "None"],
  ["National", "Plan for local retail (November 2025)", "Property companies, town-centre managers, vacancy tax", "None"],
  ["National", "France Ruralités Revitalisation zones", "Tax exemptions for small businesses in rural areas", "None"],
  ["National", "Commercial-zone transformation plan (2023)", "Conversion of peripheral zones", "None"],
  ["National", "Climate and Resilience Act, art. 215; Decree 2022-1312", "Limits on new retail on undeveloped land", "None"],
  ["National", "3DS law, arts. 182–189", "Foreign municipalities in commercial planning consultations", "Border-specific"],
  ["National", "Tobacconist protocol 2023–27", "Transformation aid; border bonus of EUR 2 500", "Border-specific"],
  ["National", "Decree 2024-276", "Criteria for commercial tobacco purchases abroad", "Border-specific"],
  ["National", "VAT refund for non-EU residents", "Refund from EUR 100.01 via PABLO", "Partial"],
  ["National", "State–MOT roadmap", "Support for cross-border projects", "Partial"],
  ["Bilateral", "Treaty of Aachen, cross-border committee", "Franco-German obstacle resolution", "Border-specific"],
  ["Bilateral", "European Collectivity of Alsace", "Lead on cross-border cooperation in Alsace", "Border-specific"],
  ["Bilateral", "France–Luxembourg intergovernmental commission", "Co-development; no fiscal compensation", "Partial"],
  ["Bilateral", "Swiss duty-free allowance (CHF 150, 2025)", "Reduces duty-free Swiss purchases in France", "Border-specific"],
  ["Local", "CCI Moselle observatory", "Cross-border household purchasing panel", "Border-specific"],
  ["Local", "CCI Alsace Eurométropole", "Retail observatory; tobacconist audits", "Partial"],
  ["Local", "Grand Genève survey and cross-border observatory", "Franco-Swiss consumption data", "Border-specific"],
  ["Local", "CCI Bayonne Pays Basque", "Retail data and cross-border business links", "Border-specific"],
  ["Local", "CCI Pyrénées-Orientales", "Cross-border programmes", "Partial"],
  ["Local", "Eurometropolis Lille–Kortrijk–Tournai", "Cross-border cooperation; CCI grouping", "Partial"],
];
children.push(table(["Level", "Instrument", "Relevance for retail SMEs", "Border dimension"], inv, [1100, 3300, 3226, 1400]));
children.push(...noteSource("\"Border-specific\": designed for border areas. \"Partial\": border clause or option. \"None\": no border dimension.", "Authors' review of official sources, September 2026."));

// References (Harvard)
children.push(H1("References"));
const refs = [
  "AMF (2024) *France ruralités revitalisation : le nouveau dispositif qui remplacera les ZRR au 1er juillet 2024*. Paris: Association des maires de France. Available at: https://www.amf.asso.fr/documents-france-ruralites-revitalisation-nouveau-dispositif-qui-remplacera-les-zrr-au-1er-juillet-2024/42098 (Accessed: 25 September 2026). [37]",
  "Assemblée nationale (2020) *Question écrite n° 30930*. Paris: Assemblée nationale. Available at: https://www.assemblee-nationale.fr/dyn/15/questions/QANR5L15QE30930.pdf (Accessed: 25 September 2026). [12]",
  "Assemblée nationale (2021) *Rapport d'information n° 4498 de la mission d'information sur l'évolution de la consommation de tabac et du rendement de la fiscalité applicable aux produits du tabac pendant le confinement*. Paris: Assemblée nationale. Available at: https://www.assemblee-nationale.fr/dyn/docs/RINFANR5L15B4498.raw (Accessed: 25 September 2026). [10]",
  "ATF (n.d.) *Prevent All Cigarette Trafficking (PACT) Act*. Washington, DC: Bureau of Alcohol, Tobacco, Firearms and Explosives. Available at: https://www.atf.gov/alcohol-tobacco/prevent-all-cigarette-trafficking-pact-act (Accessed: 25 September 2026). [31]",
  "Banque des Territoires (n.d.) *Écologie et entrées de villes : deux axes majeurs du programme Action Cœur de Ville jusqu'en 2026*. Paris: Caisse des Dépôts. Available at: https://www.banquedesterritoires.fr/programme-action-coeur-de-ville-2026 (Accessed: 25 September 2026). [36]",
  "BAZG (2024) *Taxe sur la valeur ajoutée : franchise-valeur à 150 francs*. Bern: Office fédéral de la douane et de la sécurité des frontières. Available at: https://www.bazg.admin.ch/fr/taxe-sur-la-valeur-ajoutee-franchise-valeur-a-150-francs (Accessed: 25 September 2026). [28]",
  "CCI Moselle (2019) *Observatoire du commerce et de la consommation : des informations stratégiques pour les entreprises et les territoires*. Metz: CCI Moselle Métropole Metz. Available at: https://www.moselle.cci.fr/2019/10/observatoire-du-commerce-et-de-la-consommation-des-informations-strategiques-pour-les-entreprises-et-les-territoires/ (Accessed: 25 September 2026). [50]",
  "Confédération des buralistes (2023) *Fonds de transformation : guide pratique 2023-2027*. Paris: Confédération des buralistes. Available at: https://www.buralistes.fr/system/files/2023-10/Brochure-Transformation-2023-WEB4.pdf (Accessed: 25 September 2026). [43]",
  "DeCicca, P., Kenkel, D. and Liu, F. (2013) 'Excise tax avoidance: the case of state cigarette taxes', *Journal of Health Economics*, 32(6), pp. 1130–1141. doi:10.1016/j.jhealeco.2013.08.005. [13]",
  "Département de Meurthe-et-Moselle (2025) *Coopération et développement transfrontaliers*. Nancy: Conseil départemental de Meurthe-et-Moselle. Available at: https://www.meurthe-et-moselle.fr/sites/default/files/media/downloads/2025-238-int-transfrontalier.pdf (Accessed: 25 September 2026). [48]",
  "DGDDI (2024) *Achat et transport de tabac en Europe vers la France : les nouvelles règles en 2024*. Montreuil: Direction générale des douanes et droits indirects. Available at: https://www.douane.gouv.fr/actualites/achat-et-transport-de-tabac-en-europe-vers-la-france-les-nouvelles-regles-en-2024 (Accessed: 25 September 2026). [44]",
  "DGDDI (2026) *Ventes de tabac : livraisons aux buralistes* [dataset]. Montreuil: Direction générale des douanes et droits indirects. Available at: https://www.douane.gouv.fr/la-douane/opendata/categories/tabacs-manufactures (Accessed: 25 September 2026). [15]",
  "DGE (2025) *Lever le rideau : redynamiser le commerce de proximité – 9 mesures retenues*. Paris: Direction générale des Entreprises. Available at: https://www.entreprises.gouv.fr/la-dge/actualites/mission-sur-lavenir-du-commerce-de-proximite-neuf-mesures-retenues-pour (Accessed: 25 September 2026). [2]",
  "Douchet, M.-A. (2021) *Tabagisme et arrêt du tabac en 2020*. Paris: Observatoire français des drogues et des tendances addictives. Available at: https://documentation-administrative.gouv.fr/adm-01859246v1/document (Accessed: 25 September 2026). [9]",
  "DSK (2025) *Danskerne grænsehandlede dagligvarer for over 9 mia. kroner i 2024*. Copenhagen: De Samvirkende Købmænd. Available at: https://dsk.dk/wp-content/uploads/2025/06/Analysenotat-Danskerne-graensehandlede-dagligvarer-for-over-9-mia.-kroner-i-2024.pdf (Accessed: 25 September 2026). [20]",
  "European Commission (2024) *A transition pathway for a more resilient, digital and green retail ecosystem*. Brussels: European Commission. Available at: https://single-market-economy.ec.europa.eu/document/download/a7ebd214-2262-4d7e-856c-563382a61ff8_en (Accessed: 25 September 2026). [35]",
  "European Commission (2025) *Revision of the Tobacco Taxation Directive (proposal)*, COM(2025) 580 final. Brussels: European Commission. Available at: https://taxation-customs.ec.europa.eu/taxation/excise-duties/excise-duties-tobacco/revision-tobacco-taxation-directive-proposal_en (Accessed: 25 September 2026). [33]",
  "European Commission (2026) *Weekly Oil Bulletin: prices history* [dataset]. Brussels: European Commission. Available at: https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en (Accessed: 25 September 2026). [4]",
  "European Parliament and Council of the EU (2025) 'Regulation (EU) 2025/925 of 7 May 2025 on a Border Regions' instrument for development and growth (BRIDGEforEU)', *Official Journal of the European Union*. Available at: https://eur-lex.europa.eu/EN/legal-content/summary/improving-cooperation-in-eu-border-regions-bridgeforeu.html (Accessed: 25 September 2026). [32]",
  "Eurostat (2023) *GISCO population grid, 1 km, census 2021* [dataset]. Luxembourg: Eurostat. Available at: https://gisco-services.ec.europa.eu/grid/ (Accessed: 24 September 2026). [8]",
  "Eurostat (2025a) *Final consumption aggregates (nama_10_fcs)* [dataset]. Luxembourg: Eurostat. Available at: https://ec.europa.eu/eurostat/databrowser/view/nama_10_fcs/default/table (Accessed: 25 September 2026). [18]",
  "Eurostat (2025b) *Purchasing power parities, price level indices and real expenditures (prc_ppp_ind)* [dataset]. Luxembourg: Eurostat. Available at: https://ec.europa.eu/eurostat/databrowser/view/prc_ppp_ind/default/table (Accessed: 24 September 2026). [7]",
  "Grand Genève (2024) *Enquête consommation du Grand Genève 2024*. Geneva: Grand Genève. Available at: https://www.grand-geneve.org/les-resultats-de-lenquete-consommation-du-grand-geneve-devoiles/ (Accessed: 25 September 2026). [5]",
  "Hillion, M. and Monchâtre, V. (2024) 'Les approvisionnements à l'étranger représentent au moins 9,5 % des ventes de tabac en France', *Insee Analyses*, 94. Montrouge: INSEE. Available at: https://www.insee.fr/fr/statistiques/7764897 (Accessed: 25 September 2026). [3]",
  "IEA (2020) *Luxembourg 2020: Energy Policy Review*. Paris: International Energy Agency. Available at: https://www.iea.org/reports/luxembourg-2020 (Accessed: 25 September 2026). [16]",
  "Interact (2026) *keep.eu: Interreg VI-A programmes 2021-2027* [database]. Available at: https://keep.eu/programmes/370/2021-2027-France-Belgium-Germany-Lux/ (Accessed: 25 September 2026). [34]",
  "Irish Times (2009) '25% jump in cross-Border shopping – survey', *The Irish Times*. Available at: https://www.irishtimes.com/news/25-jump-in-cross-border-shopping-survey-1.761877 (Accessed: 25 September 2026). [29]",
  "IRM-HSG (2025) *Einkaufstourismus Schweiz 2025*. St. Gallen: Forschungszentrum für Handelsmanagement, Universität St. Gallen. Available at: https://irm.unisg.ch/de/newsuebersicht/detail/news/einkaufstourismus-uebersteigt-das-niveau-vor-corona-krise/ (Accessed: 25 September 2026). [19]",
  "Kennedy, S., Lyons, S., Morgenroth, E. and Walsh, K. (2017) *Assessing the level of cross-border fuel tourism*. MPRA Paper No. 76961. Dublin: ESRI and Revenue Commissioners. Available at: https://www.revenue.ie/en/corporate/documents/research/cross-border-fuel-tourism.pdf (Accessed: 25 September 2026). [22]",
  "KPMG (2025) *Illicit cigarette consumption in Europe: results for the calendar year 2024*. London: KPMG LLP (commissioned by Philip Morris International). Available at: https://www.pmi.com/resources/docs/default-source/itp/illicit-cigarette-consumption-in-europe-2024-results.pdf (Accessed: 25 September 2026). [14]",
  "L'essentiel (2025) 'Commission France-Luxembourg : santé et télétravail au programme, la rétrocession fiscale écartée', *L'essentiel*. Available at: https://www.lessentiel.lu/fr/story/reunion-au-sommet-la-france-pas-encore-prete-a-froisser-le-luxembourg-103466963 (Accessed: 25 September 2026). [47]",
  "Lexology (2013) *Denmark repeals beverage tax*. Available at: https://www.lexology.com/library/detail.aspx?g=b0751944-4b34-4407-9cf2-5ad331066774 (Accessed: 25 September 2026). [23]",
  "Lovenheim, M.F. (2008) 'How far to the border? The extent and impact of cross-border casual cigarette smuggling', *National Tax Journal*, 61(1), pp. 7–33. [30]",
  "Mäkelä, P. and Österberg, E. (2009) 'Weakening of one more alcohol control pillar: a review of the effects of the alcohol tax cuts in Finland in 2004', *Addiction*, 104(4), pp. 554–563. [25]",
  "Ministère de l'Économie (2023a) *Signature du protocole d'accord sur la transformation du réseau des buralistes*. Paris: Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique. Available at: https://www.economie.gouv.fr/signature-protocole-accord-transformation-reseau-buralistes (Accessed: 25 September 2026). [42]",
  "Ministère de l'Économie (2023b) *Plan de transformation des zones commerciales*. Paris: Ministère de l'Économie. Available at: https://presse.economie.gouv.fr/plan-de-transformation-des-zones-commerciales/ (Accessed: 25 September 2026). [38]",
  "MOT (2022) *Le transfrontalier dans la loi 3DS*. Paris: Mission Opérationnelle Transfrontalière. Available at: https://www.espaces-transfrontaliers.org/niveaux/france-loi-3ds/ (Accessed: 25 September 2026). [41]",
  "MOT (n.d.) *Traité d'Aix-la-Chapelle – Comité de coopération transfrontalière franco-allemand*. Paris: Mission Opérationnelle Transfrontalière. Available at: https://www.espaces-transfrontaliers.org/territoires/france-allemagne-territoire-traite-aix-la-chapelle/ (Accessed: 25 September 2026). [45]",
  "News in English (2022) 'Bittersweet comeback for sugar taxes', *News in English*, 25 April. Available at: https://www.newsinenglish.no/2022/04/25/bittersweet-comeback-for-sugar-taxes/ (Accessed: 25 September 2026). [24]",
  "OECD (2025) *OECD Economic Surveys: Luxembourg 2025*. Paris: OECD Publishing. Available at: https://www.oecd.org/en/publications/oecd-economic-surveys-luxembourg-2025_803b3ea1-en.html (Accessed: 25 September 2026). [27]",
  "OECD (2026) *Local Retail, Global Trends: How Digital, Green and Skills Shifts in the EU are Reshaping SMEs in Towns and Cities*. OECD Studies on SMEs and Entrepreneurship. Paris: OECD Publishing. Available at: https://www.oecd.org/en/publications/local-retail-global-trends_55e2edec-en.html (Accessed: 25 September 2026). [1]",
  "OpenStreetMap contributors (2026) *OpenStreetMap data extracted via the Overpass API* [dataset], licensed under the Open Database License. Available at: https://www.openstreetmap.org (Accessed: 24 September 2026). [6]",
  "République française (2019) *Loi n° 2019-816 du 2 août 2019 relative aux compétences de la Collectivité européenne d'Alsace*. Journal officiel. Available at: https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038872957 (Accessed: 25 September 2026). [46]",
  "République française (2021) *Loi n° 2021-1104 du 22 août 2021 portant lutte contre le dérèglement climatique et renforcement de la résilience face à ses effets*. Journal officiel. Available at: https://www.entreprises.gouv.fr/espace-entreprises/s-informer-sur-la-reglementation/amenagement-commercial-textes-legislatifs-et (Accessed: 25 September 2026). [39]",
  "République française (2022) *Décret n° 2022-1312 du 13 octobre 2022 relatif aux modalités d'octroi de l'autorisation d'exploitation commerciale pour les projets qui engendrent une artificialisation des sols*. Journal officiel. Available at: https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046421780 (Accessed: 25 September 2026). [40]",
  "Sénat (2020) *Question écrite n° 15024 : conséquences du confinement sur les ventes de tabac par les buralistes installés à proximité des frontières allemandes et luxembourgeoises*. Paris: Sénat. Available at: https://www.senat.fr/questions/base/2020/qSEQ200415024.html (Accessed: 25 September 2026). [11]",
  "Sénat (2023) *Proposition de résolution n° 711 : création d'une dotation de compensation frontalière (exposé des motifs)*. Paris: Sénat. Available at: https://www.senat.fr/leg/exposes-des-motifs/ppr22-711-expose.html (Accessed: 25 September 2026). [49]",
  "SDES (2024) *Données annuelles de consommation de produits pétroliers par département (France métropolitaine)* [dataset]. Paris: Service des données et études statistiques. Available at: https://www.statistiques.developpement-durable.gouv.fr/donnees-annuelles-de-consommation-de-produits-petroliers-par-departement-france-metropolitaine-0 (Accessed: 25 September 2026). [17]",
  "SSB (2025) *Grensehandelen økte med 18 prosent i 2024*. Oslo: Statistics Norway. Available at: https://www.ssb.no/varehandel-og-tjenesteyting/varehandel/statistikk/grensehandel/artikler/grensehandelen-okte-med-18-prosent-i-2024 (Accessed: 25 September 2026). [21]",
  "Statista (2025) *Anteil der nicht in Deutschland versteuerten Zigaretten nach Bundesländern 2024* (based on the Ipsos empty-pack survey). Hamburg: Statista. Available at: https://de.statista.com/statistik/daten/studie/218514/umfrage/anteil-der-nichtversteuerten-zigaretten-in-deutschland (Accessed: 25 September 2026). [26]",
];
// Harvard lists are alphabetical without numbers; drop the internal [n] tags
const key = (r) => r.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toLowerCase();
refs.sort((a, b) => key(a).localeCompare(key(b)));
refs.forEach((r) => children.push(new Paragraph({
  spacing: { after: 110, line: 252 }, indent: { left: 360, hanging: 360 },
  children: runs(r.replace(/ \[\d+\]$/, ""), { size: 18 }),
})));

// ---------- document ----------
const doc = new Document({
  creator: "Author", title: "Retail SMEs in France's border regions",
  description: "Draft chapter: cross-border competition, policy gaps and options for France",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: BLUE }, paragraph: { spacing: { before: 120, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: FONT, color: BLUE }, paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, italics: true, font: FONT, color: "333333" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: { config: [{ reference: "bullets", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } },
    { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 260 } } } },
  ] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1300, left: 1440, right: 1440 } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("Retail SMEs in France's border regions · Draft for internal review", { size: 15, color: GREY })] })] }) },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 17, font: FONT, color: GREY })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
    },
    children,
  }],
});
Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "Retail_SMEs_France_border_regions.docx");
  fs.writeFileSync(out, buf);
  console.log(out);
});
