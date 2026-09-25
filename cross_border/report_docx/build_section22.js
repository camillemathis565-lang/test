// Section 2.2 "A structural profile of retail in border areas" (.docx)
// Run from cross_border/: NODE_PATH=$(npm root -g) node report_docx/build_section22.js
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, Footer, PageNumber } = require("docx");

const FIG = path.join(__dirname, "figures");
const BLUE = "1F4E79", GREY = "595959", LIGHT = "DCE9F5", FONT = "Arial";
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, ...o });
function runs(text, base = {}) {
  const out = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g; let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(run(text.slice(last, m.index), base));
    const s = m[0];
    out.push(s.startsWith("**") ? run(s.slice(2, -2), { ...base, bold: true }) : run(s.slice(1, -1), { ...base, italics: true }));
    last = m.index + s.length;
  }
  if (last < text.length) out.push(run(text.slice(last), base));
  return out;
}
const P = (t) => new Paragraph({ children: runs(t, { size: 21 }), spacing: { after: 140, line: 276 }, alignment: AlignmentType.JUSTIFIED });
const sub = (t) => new Paragraph({ keepNext: true, spacing: { before: 220, after: 100 }, children: [run(t, { bold: true, size: 21, color: BLUE })] });
const caption = (label, title) => new Paragraph({ keepNext: true, spacing: { before: 200, after: 80 },
  children: [run(label + " ", { bold: true, size: 20 }), run(title, { bold: true, size: 20 })] });
function png(f) { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
const figure = (file, wpx = 590) => { const f = path.join(FIG, file); const { w, h } = png(f);
  return new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(f), transformation: { width: wpx, height: Math.round(wpx * h / w) },
      altText: { title: file, description: file, name: file } })] }); };
const note = (n, s) => [
  ...(n ? [new Paragraph({ spacing: { before: 40, after: 20 }, children: [run("Note: ", { size: 16, italics: true, color: GREY }), ...runs(n, { size: 16, color: GREY })] })] : []),
  new Paragraph({ spacing: { after: 220 }, children: [run("Source: ", { size: 16, italics: true, color: GREY }), ...runs(s, { size: 16, color: GREY })] }),
];
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
function table(headers, rows, widths) {
  const mk = (t, i, head) => new TableCell({ width: { size: widths[i], type: WidthType.DXA },
    borders: { top: border, bottom: border, left: none, right: none },
    shading: head ? { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    children: [new Paragraph({ alignment: i > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT, children: runs(t, { size: 17, bold: head, color: head ? BLUE : undefined }) })] });
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => mk(h, i, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false)) }))] });
}

const c = [];
c.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run("2.2 A structural profile of retail in border areas")] }));
[
  "If cross-border shopping draws spending away from French border areas, it should leave a mark on the local retail fabric: fewer shops per resident, a different mix of formats, weaker employment growth. This section tests that idea on official data for all 34 456 municipalities of mainland France. It uses the same approach as section 2.1, grouping municipalities by nearest neighbouring country and by straight-line distance to the land border, and comparing the border zone (within 20 km) with its hinterland (50 to 100 km) and with the national average. Retail outlets come from Insee's Permanent Database of Facilities (Insee, 2026), salaried employment from URSSAF (URSSAF, 2026) and tobacconists from the customs directory (DGDDI, 2018).",
  "The border zone is home to 6.8 million people in 2 909 municipalities. Its retail profile is close to the national one on most measures. The differences lie in a few products where price gaps with neighbours are large, above all tobacco and fuel, and along two borders, Luxembourg and Belgium.",
].forEach((t) => c.push(P(t)));

c.push(sub("Retail density"));
[
  "Taken as a whole, border areas are neither over- nor under-equipped in shops. The border zone counts 51.4 retail outlets per 10 000 inhabitants, against 52.8 in the hinterland and 52.3 for mainland France (Figure 7). The averages, however, mask very different situations. Along the Italian and Spanish borders, density is well above the national level (87 and 75 outlets per 10 000 inhabitants in the border zone), reflecting the coastal and tourist economies of the Côte d'Azur and Roussillon, where shops serve visitors as much as residents. Along the Luxembourg border, density falls to 35 per 10 000, a third below the national average, and along the Belgian border to 43 per 10 000. These are the two borders where the neighbouring country offers the densest supply within easy reach (see below) and, in the case of Luxembourg, where a large share of residents work and earn across the border (section 2.1).",
].forEach((t) => c.push(P(t)));
c.push(caption("Figure 7.", "Retail outlets by distance to the border and neighbouring country, 2025 (per 10 000 inhabitants)"));
c.push(figure("fig7_outlets_by_distance.png"));
c.push(...note("Retail outlets: food shops, super- and hypermarkets and non-food specialist shops recorded in the BPE (excluding fuel stations and electric charging points). Municipalities grouped by nearest neighbouring country (Monaco with Italy, Andorra with Spain) and by straight-line distance to the land border. Distance bands with fewer than 50 000 residents are not shown. Mainland France excluding Corsica.",
  "Authors' calculations based on Insee, BPE 2025 and populations de référence 2023; Eurostat GISCO, LAU 2024."));

c.push(sub("Store formats, fuel stations and tobacconists"));
[
  "The mix of formats in the border zone is close to the national one. Super- and hypermarkets are, if anything, slightly more common (2.4 per 10 000 inhabitants against 2.3 nationally), and their share of retail employment is similar (33% against 35%). Luxembourg is again the exception: large food stores are 23% more frequent than the national average and account for 42% of retail jobs, while specialist shops are scarce. The local offer is concentrated in a few large stores, and specialist purchases are made elsewhere.",
  "The clearest differences concern the two products most affected by excise gaps (Figure 8). Fuel stations are 17% less frequent in the border zone than nationally, 33% less along the Belgian border and 57% less along the Luxembourg border, where French residents fill up across the border. Tobacconists are 25% less frequent in the border zone than in mainland France, 31% less along the Belgian border, 37% less along the German border and 64% less along the Luxembourg border. These are structural traces of the cross-border purchases measured in section 3: where it pays to buy abroad, the local network has adjusted to a smaller market.",
].forEach((t) => c.push(P(t)));
c.push(caption("Figure 8.", "Retail equipment in the border zone relative to mainland France, 2025 (%)"));
c.push(figure("fig8_border_zone_vs_mainland.png"));
c.push(...note("Difference between the number of outlets per 10 000 inhabitants in the border zone (municipalities within 20 km of the land border) and the mainland France average. Tobacconists: 2018 directory.",
  "Authors' calculations based on Insee, BPE 2025; DGDDI, directory of tobacconists 2018; Insee, populations de référence 2023."));
[
  "The tobacconist network follows a clear gradient with distance (Figure 9). Across all borders, there are 2.4 tobacconists per 10 000 inhabitants within 10 km of the border, rising to 3.8 at 30 to 75 km, slightly above the national average of 3.6. Along the Belgian border, density more than doubles between the first 10 km (2.0) and the 30 to 50 km band (4.5). Along the Luxembourg border, it remains below 2.2 as far as 50 km from the border. The Swiss border shows only a small dip in the first 10 km, which is consistent with prices in Switzerland being close to French levels, and the Italian and Spanish borders show higher densities close to the border, where tourist towns support a larger network.",
].forEach((t) => c.push(P(t)));
c.push(caption("Figure 9.", "Tobacconists by distance to the border and neighbouring country (per 10 000 inhabitants)"));
c.push(figure("fig9_tobacconists_by_distance.png"));
c.push(...note("Tobacconists from the 2018 directory, located by their coordinates; population 2023. Distance bands with fewer than 50 000 residents are not shown.",
  "Authors' calculations based on DGDDI, directory of tobacconists 2018; Insee, populations de référence 2023; Eurostat GISCO, LAU 2024."));

c.push(sub("Retail employment"));
[
  "Retail employment tells a more reassuring story. The border zone counts 30.7 salaried retail jobs per 1 000 inhabitants, above the hinterland (25.8) and the national average (25.6), largely because it includes several regional centres (Lille, Strasbourg, Mulhouse, Nice) and the fast-growing suburbs of Geneva. Retail employers are also slightly larger on average (8.5 employees per establishment, against 7.9 nationally).",
  "Between 2012 and 2024, salaried retail employment grew by 9.5% in the border zone, in line with the national trend (9.6%) and with the hinterland (8.9%) (Figure 10). The border zone grew faster than its hinterland along every border for which the comparison is meaningful, most strongly along the Spanish border (+33% against +14%) and the Italian border (+17% against +8%). Along the Swiss border, where cross-border commuting has grown most (section 2.1), retail employment rose by 12%, against 9% in the hinterland: the incomes of cross-border workers support local retail even as part of their spending goes abroad. The number of employer establishments, by contrast, fell slightly almost everywhere (−2.4% in the border zone, −2.0% nationally), with the sharpest declines along the Luxembourg (−8%) and Belgian (−5%) borders. Retail is concentrating in fewer, larger establishments, a trend that is somewhat more pronounced where cross-border competition is strongest.",
].forEach((t) => c.push(P(t)));
c.push(caption("Figure 10.", "Change in salaried retail employment, border zone and hinterland, 2012-2024 (%)"));
c.push(figure("fig10_retail_jobs_growth.png"));
c.push(...note("Private-sector salaried employment in retail trade (NAF division 47) at 31 December. Border zone: municipalities within 20 km of the land border; hinterland: 50 to 100 km. Luxembourg is not shown because its hinterland has only 36 000 residents (+5% in the border zone).",
  "Authors' calculations based on URSSAF, établissements et effectifs salariés par commune x APE."));

c.push(sub("The other side of the border"));
[
  "Comparing both sides of each border helps explain these patterns (Figure 11). Using the same source on both sides (OpenStreetMap), the neighbouring side offers more shops per resident within 20 km of the border along four of the six borders. The gap is largest with Luxembourg, where the Luxembourg side has twice as many shops per resident as the French side (3.6 against 1.7 per 1 000 residents), with a larger share of comparison goods (62% against 55%). The Belgian and German sides also offer 25% to 30% more shops per resident. The French side is better equipped along the Swiss border (4.4 against 3.9) and the Spanish border (6.8 against 5.8), which is consistent with the net inflows of Swiss shoppers into France and with the tourist economy of Roussillon.",
  "Overall, the structural profile confirms the picture that emerges from spending flows. Border areas do not suffer from a general retail deficit. The pressure is selective: it shows in the thinner networks of tobacconists and fuel stations near cheaper neighbours, and in the weaker retail fabric along the Luxembourg border, where lower French density sits alongside a denser, more diverse offer on the other side and a large population of cross-border workers.",
].forEach((t) => c.push(P(t)));
c.push(caption("Figure 11.", "Shops on each side of the border, within 20 km (per 1 000 residents)"));
c.push(figure("fig11_both_sides.png"));
c.push(...note("Retail shops recorded in OpenStreetMap (food, personal, household and leisure goods, department stores and malls), within 20 km of each land border; residents from the 2021 census grid. OpenStreetMap coverage is more complete in France, Germany and Switzerland than in Italy and Spain, and absolute levels are lower than in the BPE; only the comparison between the two sides is meaningful.",
  "Authors' calculations based on OpenStreetMap contributors (2026) and Eurostat, GISCO census grid 2021."));

c.push(caption("Table 1.", "Retail structure: border zone, hinterland and mainland France"));
c.push(table(["Indicator", "Border zone (0-20 km)", "Hinterland (50-100 km)", "Mainland France"],
  [["Residents (million)", "6.8", "9.1", "65.8"],
   ["Retail outlets per 10 000 inhabitants", "51.4", "52.8", "52.3"],
   ["Super- and hypermarkets per 10 000", "2.4", "2.3", "2.3"],
   ["Fuel stations per 10 000", "1.2", "1.7", "1.5"],
   ["Tobacconists per 10 000 (2018)", "2.7", "3.5", "3.6"],
   ["Salaried retail jobs per 1 000 inhabitants (2024)", "30.7", "25.8", "25.6"],
   ["Employees per retail establishment (2024)", "8.5", "7.7", "7.9"],
   ["Share of retail jobs in super- and hypermarkets", "33%", "34%", "35%"],
   ["Change in retail jobs, 2012-2024", "+9.5%", "+8.9%", "+9.6%"],
   ["Change in retail establishments, 2012-2024", "-2.4%", "-2.8%", "-2.0%"]],
  [4026, 1700, 1700, 1600]));
c.push(...note("Border zone and hinterland cover all land borders of mainland France. Super- and hypermarkets include multi-commerce stores (NAF 47.11D, 47.11E and 47.11F) for employment.",
  "Authors' calculations based on Insee, BPE 2025 and populations de référence 2023; URSSAF; DGDDI."));

c.push(new Paragraph({ spacing: { before: 360, after: 120 }, children: [run("References for section 2.2", { bold: true, size: 22, color: BLUE })] }));
[
  "DGDDI (2018) *Annuaire des buralistes de France métropolitaine 2018* [dataset]. Paris: Direction générale des douanes et droits indirects. Available at: https://data.economie.gouv.fr/explore/dataset/annuaire-des-buralistes-de-france-metropolitaine-2018/ (Accessed: 25 September 2026).",
  "Eurostat (2023) *GISCO population grid, 1 km, census 2021* [dataset]. Luxembourg: Eurostat. Available at: https://gisco-services.ec.europa.eu/grid/ (Accessed: 25 September 2026).",
  "Eurostat (2024) *Local Administrative Units (LAU) 2024* [dataset]. Luxembourg: Eurostat GISCO. Available at: https://gisco-services.ec.europa.eu/distribution/v2/lau/ (Accessed: 25 September 2026).",
  "Insee (2025) *Populations de référence 2023* [dataset]. Montrouge: Institut national de la statistique et des études économiques. Available at: https://api.insee.fr/melodi/catalog/DS_POPULATIONS_REFERENCE (Accessed: 25 September 2026).",
  "Insee (2026) *Base permanente des équipements 2025* [dataset]. Montrouge: Institut national de la statistique et des études économiques. Available at: https://www.insee.fr/fr/statistiques/8217525 (Accessed: 25 September 2026).",
  "OpenStreetMap contributors (2026) *OpenStreetMap data extracted via the Overpass API* [dataset], licensed under the Open Database License. Available at: https://www.openstreetmap.org (Accessed: 24 September 2026).",
  "URSSAF (2026) *Nombre d'établissements employeurs et effectifs salariés du secteur privé, par commune x APE* [dataset]. Montreuil: URSSAF Caisse nationale. Available at: https://open.urssaf.fr/explore/dataset/etablissements-et-effectifs-salaries-au-niveau-commune-x-ape-last/ (Accessed: 25 September 2026).",
].forEach((r) => c.push(new Paragraph({ spacing: { after: 100, line: 252 }, indent: { left: 360, hanging: 360 }, children: runs(r, { size: 18 }) })));

const doc = new Document({
  creator: "Author", title: "2.2 A structural profile of retail in border areas",
  styles: { default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, font: FONT, color: BLUE }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 1 } }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1300, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 17, font: FONT, color: GREY })] })] }) },
    children: c }],
});
Packer.toBuffer(doc).then((b) => { const o = path.join(__dirname, "Section_2.2_retail_structural_profile.docx"); fs.writeFileSync(o, b); console.log(o); });
