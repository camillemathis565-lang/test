// Proposed structure (revised) of the France country case study, in the outline format of the initial "Proposed structure"
// (I. / a. / i. / 1.): seven chapters (peripheral zones and town centres merged), cross-border chapter, page budget ~96 pages.
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, LevelFormat,
  Footer, PageNumber, HeadingLevel, ShadingType } = require("docx");

const OUT = path.join(__dirname, "proposed_structure_France_country_study_revised.docx");
const INK = "1A1A1A", NAVY = "1F3864", GREY = "595959", SOFT = "BFBFBF", BAND = "EEF2F7";
const W = 9638;
function runs(text, base = {}) {
  const out = [], re = /(\*\*[^*]+\*\*|_[^_]+_)/g; let last = 0, m;
  while ((m = re.exec(text))) { if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const s = m[0]; out.push(new TextRun({ text: s.startsWith("**") ? s.slice(2, -2) : s.slice(1, -1), ...(s.startsWith("**") ? { bold: true } : { italics: true }), ...base }));
    last = m.index + s.length; }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const P = (t, o = {}) => new Paragraph({ spacing: { after: 100, line: 276 }, ...o.p, children: runs(t, o.r || {}) });
const H1 = (t, brk = true) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk, spacing: { before: brk ? 0 : 320, after: 160 }, children: [new TextRun(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, keepNext: true, children: [new TextRun(t)] });
const sp = () => new Paragraph({ spacing: { after: 60 }, children: [] });
const B = items => items.map(it => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 50, line: 264 }, children: runs(it) }));
function table(head, rows, widths) {
  const m = { top: 60, bottom: 60, left: 90, right: 90 };
  const cell = (t, w, h) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: m,
    shading: h ? { type: ShadingType.CLEAR, fill: BAND, color: "auto" } : undefined,
    borders: { top: h ? line(NAVY, 8) : none, bottom: line(h ? NAVY : SOFT, 4), left: none, right: none },
    children: String(t).split("|").map(x => new Paragraph({ spacing: { after: 20 }, children: runs(x, { size: 17, bold: h || undefined, color: h ? NAVY : INK }) })) });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: head.map((h, j) => cell(h, widths[j], true)) }),
      ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((c, j) => cell(c, widths[j], false)) }))] });
}
// outline: node = "text" or ["text", [children]]; level 0 = I., 1 = a., 2 = i., 3 = 1., 4 = bullet
function outline(ref, nodes, lvl = 0, brk = false) {
  const out = [];
  nodes.forEach(n => {
    const [t, kids = []] = Array.isArray(n) ? n : [n, []];
    const top = lvl === 0;
    out.push(new Paragraph({ numbering: { reference: ref, level: lvl }, keepNext: top || kids.length > 0,
      pageBreakBefore: top && brk && /^Chapter|^Annexes/.test(t),
      spacing: top ? { before: 240, after: 100 } : { after: 40, line: 264 },
      children: runs(t, top ? { bold: true, size: 24, color: NAVY } : lvl === 1 ? { bold: true } : {}) }));
    out.push(...outline(ref, kids, lvl + 1, brk));
  });
  return out;
}

// ------------------------------------------------------------------ shared chapter skeleton
const DATAVIZ = (figs) => ["Data visualisations and corresponding analyses", [
  ["Latest-year snapshot, time series, benchmark (EU-27, OECD, selected peers), cross-sector comparison, disaggregation by firm size, subsector, region, city and rural-urban, spatial analysis"],
  ...figs.map(f => "Planned: " + f)]];

// ------------------------------------------------------------------ synthesised version
const SYN = [
  ["Foreword"],
  ["Executive summary", ["Brief description of French context for retail SMEs", "Key insights by theme (in bullet points)"]],
  ["Chapter 1: Assessment and Recommendations (synthesis chapter)", ["Introduction", ["Sections by chapter (following roughly this structure):", ["General description of the issue tackled in chapter", "Application to French case: main insights found in chapter (e.g. trends, barriers)", "What is being done: brief recap of existing initiatives and policies", "Concise policy recommendations"]], "Box of main policy recommendations", "References", "Endnotes"]],
  ["Chapter 2: Retail SME Economic and Entrepreneurial Dynamics", ["Cover page: chapter scope and structure", ["Introduction", ["Key definitions", "Context: macroeconomic and consumption trends", ["Methodology: describe approach (indicators, data)", ["Optional: box with methodological specifications"]], "Box: key takeaways from chapter"]],
    ["Subsections: production and performance trends; structure by firm size; entry/exit dynamics; birth, death and churn rates; scale-up and transmission; share of turnover; share of employment; labour productivity; access to finance; exports and import values; territorial distribution of retail; regulatory environment", ["Data visualisations and corresponding analyses"]], "Conclusions and recommendations", "References", "Endnotes"]],
  ["Chapter 3: Digitalisation of Retail SMEs in France", ["Cover page: chapter scope and structure", ["Introduction", ["Key definitions", "Context of digital adoption in France", ["Methodology: describe approach (indicators, data)", ["Optional: box with methodological specifications"]], "Box: key takeaways from chapter"]],
    ["Subsections: digital adoption rates; trends in digital adoption (e-commerce, omni-channel retailing, EDI systems, CRM tools); micro-firms and very small businesses; competition dynamics in digitalisation (marketplaces, platforms); artificial intelligence; cybersecurity landscape; digital skills; territorial dimension", ["Data visualisations and corresponding analyses", "Boxes: case studies of digitalisation by SMEs – good practices"]], "Conclusions and recommendations", "References", "Endnotes"]],
  ["Chapter 4: The Greening of Retail SMEs in France", ["Cover page: chapter scope and structure", ["Introduction", ["Key definitions", "Sustainability in France: general observations, country-level and applicable EU-level priorities", ["Methodology: describe approach (indicators, data)", ["Optional: box with methodological specifications"]], "Box: key takeaways from chapter"]],
    ["Subsections: share of emissions; production and demand-based emissions; emissions tracking; energy and buildings; land use; waste management; circular and social-economy models; SME practices and barriers; twin-transition interactions", ["Data visualisations and corresponding analyses", "Boxes: case studies of greening by SMEs – good practices"]], "Conclusions and recommendations", "References", "Endnotes"]],
  ["Chapter 5: Revitalising Retail SMEs – Rural and Territorial Policies", ["Cover page: chapter scope and structure", ["Introduction", ["Key definitions", "Context: the French retail geography", ["Methodology: describe approach (indicators, data)", ["Optional: box with methodological specifications"]], "Box: key takeaways from chapter"]],
    ["Subsections: territorial dynamics of retail SMEs; peri-urban areas and peripheral retail zones (effects on town centres and QPV, regulation, transformation); town centres and small towns; rural areas; priority neighbourhoods; cross-border regions (tax and price gaps, retail models, governance); assessing territorial policies", ["Data visualisations and corresponding analyses", "Boxes: policy boxes, case studies (cities, transformation projects, cross-border cooperation) – good practices"]], "Conclusions and recommendations", "References", "Endnotes"]],
  ["Chapter 6: SME Digitalisation and Sustainability Programmes and Policies in France (programme portfolio chapter)", ["Cover page: chapter scope and structure", "Introduction", "Programme typologies (technical, non-technical; digital, green, digital & green)", "Key applicable legislation (national and EU-level)", "Box: typology specifications",
    ["Subsections (split according to programme category)", ["Description of programme/policy type", "Main examples", "Description", "Evaluation", "Optional: boxes with examples"]], "Data visualisations and corresponding analyses", "Related programmes", "Boxes: international examples of good practices", "Conclusions and recommendations", "References", "Endnotes"]],
  ["Annexes", ["A. Methodology and online observatory", "B. Case-study cities", "C. Interviews", "D. Data gaps and statistical recommendations", "E. Glossary and acronyms"]],
];

// ------------------------------------------------------------------ detailed version
const DET = [
  ["Foreword (1 page)", [
    ["Aim of paper", [
      ["Specify the policy challenge it addresses: how retail SMEs in France adapt to the green and digital transitions, in town centres, peripheral zones, rural areas and border regions"],
      ["Describe its purpose within the broader retail project: how the OECD aims to support the Retail Transition Pathway; partnership with the DGE and DG GROW"]]],
    ["Define paper scope", [
      ["List the report's main sections: sector and transitions (Chapters 2-4), territories (Chapter 5), policies (Chapter 6)"],
      ["Explain their relevance to France's retail SME competitiveness"],
      ["Evidence base: Eurostat and OECD statistics, Insee Sirene, Cerema, online observatory, 11 interviews, 4 case-study cities"]]],
    "Optional: provide details on when paper was approved (discussion at the CSMEE, April 2027)"]],
  ["Executive summary (2 pages)", [
    ["Brief description of French context for retail SMEs", [
      "A 'thin middle': 95.2% micro-firms, large retailers capture 58% of value added (EU 40%)",
      "Micro-retailers lost 24% of real value added over 2008-2024 while large retailers gained 37%",
      "Two thirds of retail sales in peripheral zones; town-centre vacancy at 14% (6% in 2010)",
      "Up to 14% of in-store spending made abroad in border departments"]],
    ["Key insights by theme (in bullet points): one insight and one figure per chapter"],
    ["Three to five headline recommendations"]]],
  ["Chapter 1: Assessment and Recommendations (synthesis chapter) (10 pages)", [
    ["Introduction", [["Purpose: synthesising the report and presenting actionable recommendations; reading guide"]]],
    ["Sections by chapter (Chapters 2 to 6, about 1.7 pages each), following roughly this structure:", [
      ["General description of the issue tackled in chapter"],
      ["Application to French case: main insights found in chapter (e.g. trends, barriers)"],
      ["What is being done: brief recap of existing initiatives and policies"],
      ["Concise policy recommendations"]]],
    ["Box 1.1 Main policy recommendations: by chapter, responsible actor (State, local authorities, operators, EU) and horizon (short, medium term)"],
    "References", "Endnotes"]],

  ["Chapter 2: Retail SME Economic and Entrepreneurial Dynamics (13 pages)", [
    "Cover page: chapter scope and structure",
    ["Introduction", [
      ["**Key definitions**: SME size classes (micro 0-9, small 10-49, medium 50-249 persons employed); retail trade (NACE G47); enterprise vs establishment (point of sale); churn; high-growth enterprise and gazelle; business transmission"],
      ["**Context: macroeconomic and consumption trends**", [
        "Growth of 0.8% in 2025 and 2026; unemployment from 7.9% (Q4 2025) to 8.7% (2027); household saving rate near 19%; energy-price shock in 2026 (inflation peaking at 2.9% in Q3); deficit 5.1% of GDP, debt around 120% (European Commission; OECD Economic Outlook 2025/2)",
        "Goods consumption down three years running (−2.3%, −1.7%, −0.4%); polarisation between constrained and pleasure consumption; 'consommation subie'; '15-minute' proximity shopping (Macarez et al., 2025)",
        "E-commerce at 10% of retail (+80% since 2019); marketplaces above half of online purchases"]],
      ["**Methodology**: Eurostat structural business statistics as published in the SME Performance Review 2025 (2008-2025, 2024 nowcast, 2025 forecast); OECD Financing SMEs and Entrepreneurs 2026 scoreboard; Insee Sirene shop-stock reconstruction 2012-2025 (online observatory)", [
        "Optional: Box 2.1 Methodological specifications (size-band effect, nowcasts, Sirene geolocation and assignment to town centres, peripheral zones and QPV)"]],
      ["**Box 2.2 Key takeaways from chapter**"],
      ["**Research questions addressed**: baseline for Q3 and Q5"]]],
    ["Subsections", [
      ["**Production and performance trends, 2008-2024**", ["Real value added in retail (G47): SMEs −6%, micro-firms −24%, large firms +37%", "Micro-firms are the only size class with growing employment and falling real value added (2024)"]],
      ["**Structure by firm size: the 'thin middle'**", ["SMEs hold 54.4% of retail employment (EU 65%) and 42% of value added (EU 53%); about 21 000 medium-sized firms; weak midcap presence and few scale-ups"]],
      ["**Entry/exit dynamics; birth, death and churn rates**", ["Rising churn in French retail while wholesale churn fell (EU retail 20% → 19%, 2011-2021)", "Bankruptcies 66 262 (2024) and 68 000 (2025)", "Shops (Sirene, observatory): 460 048 on 1 January 2025 (+2.2% since 2019), entries and exits by period"]],
      ["**Scale-up and transmission**", ["High-growth enterprises in trade (G): 10.1% (2019) → 4.9% (2022); gazelles 177 → 45", "500 000 firms (3 million jobs) could change hands within ten years; retail and hospitality are 57% of 2024 transfers"]],
      ["**Share of turnover and share of employment**", ["By size class and subsector: food and food service (+75% turnover in 16 years) vs fashion (−14 000 establishments)", "Physical retail created 800 000 jobs (2006-2022) vs about 50 000 for e-commerce"]],
      ["**Labour productivity**", ["Micro-firms −23% (2008-2024); SMEs grew by hiring rather than by efficiency gains; EU retail SME productivity +14.6% (2018-2025)"]],
      ["**Access to finance**", ["SME loan rates 1.00% (2020) → 4.26% (2024); rejection rate 4.1%; application rate 37.9% (2015) → 33.0% (2024): discouraged borrowers; collateral 6.4%; state-guaranteed loans 26.4% left to repay (March 2025)"]],
      ["**Exports and import values**", ["Exceptional increase in exporting retailers; France among the largest gains in importing retailers (Local Retail, Global Trends)"]],
      ["**Territorial distribution of retail**", ["Shop density by municipality type; centre / periphery / QPV / elsewhere, 2012-2025 (observatory); 62% of municipalities without a shop (2021)"]],
      ["**Regulatory environment**", ["'Silence means consent', one-stop shop, remaining barriers in retail distribution (OECD Economic Survey 2024); 2026 simplification law (monthly rents, deposit capped at three months)"]],
      DATAVIZ(["enterprises, employment and value added by size, France vs EU-27", "real value added and productivity by size, 2008-2024 (index)", "high-growth enterprises and gazelles, 2012-2022", "SME loan conditions, 2012-2024", "shops by location type, 2012-2025, and density map by department"]),
      ["Boxes", ["Box 2.3 France 2030 and SMEs (EUR 54 billion; SMEs are 55% of beneficiaries) – to draft"]],
      ["Interviews: Guy Gras (CdCF), Nicolas Bonnet (CCI France)"]]],
    ["Conclusions and recommendations", [["Directions: close the 'thin middle' (scale-up, transmission including employee buy-outs); SME access to finance for transition investment; retail statistics by firm size and territory"]]],
    ["References", [["SME Performance Review 2025; Financing SMEs and Entrepreneurs 2026; OECD Economic Survey of France 2024; Local Retail, Global Trends; Insee; Banque de France"]]],
    "Endnotes"]],

  ["Chapter 3: Digitalisation of Retail SMEs in France (11 pages)", [
    "Cover page: chapter scope and structure",
    ["Introduction", [
      ["**Key definitions**: e-commerce, omnichannel, EDI, CRM, AI adoption, marketplace, cybersecurity incident"],
      ["**Context of digital adoption in France**", ["Weak diffusion of digital technologies among SMEs (OECD Economic Survey 2024); fibre roll-out but 41% of firms without fibre hesitate to switch", "Foreign low-cost platforms and fast fashion; consumer protection and customs debates"]],
      ["**Methodology**: OECD ICT Access and Usage by Businesses (firms with 10+ employees, 2009-2025); France Num barometer 2026 (9 000+ very small businesses and SMEs); observatory (e-commerce intensity by territory)", [
        "Optional: Box 3.1 Methodological specifications: the ICT survey excludes micro-firms, about 95% of French retailers"]],
      ["**Box 3.2 Key takeaways from chapter**"],
      ["**Research questions addressed**: Q5 (which retailers are most advanced in the digital transition)"]]],
    ["Subsections", [
      ["**Digital adoption rates**", ["Retailers whose website allows ordering: 41.5% (EU 41.6%), up from 16.7% in 2009", "Balanced e-commerce adoption between wholesale (B2B) and retail"]],
      ["**Trends in digital adoption (e-commerce, omni-channel retailing, EDI systems, CRM tools)**", ["Uses that work for proximity retail: visibility, click-and-collect, local delivery, loyalty and CRM", "Collective digital platforms at town-centre level ('open-air shopping centre') rather than isolated websites"]],
      ["**Micro-firms and very small businesses**", ["France Num 2026: 40% use AI, 83% have an online visibility tool, 46% get 5%+ of customers online, 76% use data to steer their business", "SME Twin Transition Monitor: France in the middle tier"]],
      ["**Competition dynamics in digitalisation**", ["Marketplaces above half of online purchases; ultra-fast commerce (30% of the French have used it, CRÉDOC)", "Responses: parcel tax of EUR 2 per product category (2026), DGCCRF controls tripled, EU customs reform, anti fast fashion bill; proposals of Macarez et al. (warehouse taxation, commercial authorisation for e-commerce warehouses)"]],
      ["**Artificial intelligence**", ["AI adoption (10+ employees): 18.2% vs 19.9% in the EU, 91% of the EU rate (80% in 2020)", "Osez l'IA, CCI France and France Num campaign (20 000 firms), DGE call (33 AI solution providers for retail), CNC use-case guide"]],
      ["**Cybersecurity landscape**", ["39% of very small businesses hit by an incident in a year; 84% have a protection measure"]],
      ["**Digital skills**", ["Merchant training fell from 100 000 to 15 000 per year after the pre-creation obligation ended"]],
      ["**Territorial dimension**", ["E-commerce intensity by municipality density and type (observatory)"]],
      DATAVIZ(["website ordering, France vs EU-27, 2009-2025", "AI adoption, France vs EU-27, 2020 and 2025", "France Num indicators by firm size", "e-commerce intensity by municipality type"]),
      ["Boxes: case studies of digitalisation by SMEs – good practices", ["Box 3.3 France Num – drafted (Policy boxes v2)", "Box 3.4 Osez l'IA and Diag Data IA – to draft", "Box 3.5 Good practice: collective digital platform of a town centre – to identify in interviews (Paris, Mulhouse)"]],
      ["Interviews: Aurélien Palix and Bénédicte Roullier (DGE), Vincent Criquebec (Bpifrance), Nicolas Bonnet (CCI France)"]]],
    ["Conclusions and recommendations", [["Directions: extend digital statistics to micro-firms; shift support from individual websites to collective, place-based tools; merchant training on digital and AI"]]],
    ["References", [["OECD ICT database; France Num barometer (DGE, CRÉDOC); CRÉDOC; Macarez et al. (2025); DGE (nine measures)"]]],
    "Endnotes"]],

  ["Chapter 4: The Greening of Retail SMEs in France (11 pages)", [
    "Cover page: chapter scope and structure",
    ["Introduction", [
      ["**Key definitions**: greenhouse gas emissions (production and demand based), energy intensity, land take (artificialisation), circular economy, social and solidarity economy"],
      ["**Sustainability in France: general observations, country-level and applicable EU-level priorities**", ["National low-carbon strategy; Climate and Resilience Act (ZAN); décret tertiaire; anti-waste law (AGEC); roadmap for exiting fossil fuels (2026)", "EU Green Deal and Fit for 55"]],
      ["**Methodology**: OECD Air Emissions Accounts (G47, 2008-2024); Flash Eurobarometer and SME Performance Review (SME practices); Cerema land-consumption files (2011-2024)", ["Optional: Box 4.1 Methodological specifications (residence principle, biomass CO₂ excluded, EU estimates)"]],
      ["**Box 4.2 Key takeaways from chapter**"],
      ["**Research questions addressed**: Q6 (which territories are most advanced in the green transition)"]]],
    ["Subsections", [
      ["**Share of emissions**", ["Retail GHG emissions −56% over 2008-2024, first in the EU-27 (EU −39%)", "France among the largest energy consumers in retail"]],
      ["**Production and demand-based emissions**", ["Role of the electricity mix: 95% renewables and nuclear in 2024; what is left for SMEs to act on"]],
      ["**Emissions tracking**", ["21% of EU SMEs have a carbon strategy; reporting obligations and their reach to small retailers"]],
      ["**Energy and buildings**", ["Décret tertiaire: −40% energy use by 2030, −50% by 2040, −60% by 2050 for buildings above 1 000 m²; peripheral 'thermal sieves'; refrigeration and lighting"]],
      ["**Land use**", ["Trade uses the most land of any sector over a decade, but its share fell from about 30% to under 20% (Banque de France); 15 119 ha consumed in 2024; link to Chapter 5"]],
      ["**Waste management and circular models**", ["CNC report on circular retail (second hand, repair, rental, deposit, bulk, unsold goods); social and solidarity economy (2.59 million employees), Les Canaux, repair cafés, PTCE clusters"]],
      ["**SME practices and barriers**", ["66% save energy or minimise waste; barriers: administrative complexity (35%), cost (28%); green skills in 1-2% of job ads"]],
      ["**Twin-transition interactions**", ["Synergies (energy monitoring, inventory optimisation) and trade-offs (delivery, ultra-fast commerce)"]],
      DATAVIZ(["retail GHG emissions, France vs EU-27, 2008-2024 (index)", "land consumption for economic activity, 2011-2024", "resource-efficiency actions of SMEs"]),
      ["Boxes: case studies of greening by SMEs – good practices", ["Box 4.3 Prêt Vert – drafted", "Box 4.4 Diag Éco-Flux – drafted", "Box 4.5 Communauté du Coq Vert – drafted", "Box 4.6 Good practice: circular retail SME – to identify"]],
      ["Interviews: Marie Adeline-Peix (Bpifrance), Nicolas Bonnet (CCI France), Guy Gras (CdCF)"]]],
    ["Conclusions and recommendations", [["Directions: simpler access to green finance and diagnostics for very small retailers; energy retrofits of premises ahead of 2030; circular models through local networks"]]],
    ["References", [["OECD Air Emissions Accounts; SME Performance Review 2025; Banque de France; Cerema; CNC (2026); OECD Social Economy in Europe: France"]]],
    "Endnotes"]],

  ["Chapter 5: Revitalising Retail SMEs – Rural and Territorial Policies (26 pages)", [
    "Cover page: chapter scope and structure. Analysis of geographic and structural revitalisation policies, with particular attention to the dynamics of rural, peri-urban and cross-border areas",
    ["Introduction", [
      ["**Key definitions**: territory types (town centres, peri-urban peripheral retail zones, rural municipalities on the Insee density grid, priority neighbourhoods (QPV), border areas); three retail formats (street-level shops, peripheral zones, enclosed shopping centres); commercial vacancy; revitalisation; cross-border shopping and commercial leakage"],
      ["**Context: the French retail geography**", ["More than 1 500 peripheral zones covering about 500 million m², five times the built area of Paris; 67% of retail sales and 72% of in-store spending in the periphery, 11% in town centres", "Two European models: 'liberal' (France, Belgium, Madrid region) vs 'planning-led' (Germany, Italy, Catalonia, England, Netherlands)", "62% of municipalities without a shop; 1 609 QPV with 6 million residents; 36% of the population in a border department"]],
      ["**Methodology**: Insee Sirene geolocated shops assigned to town centres (municipalities with 5 000+ inhabitants), peripheral zones (Cerema inventory) and QPV, 2012-2025 (online observatory); Insee Première 2091 and 2075; Procos and Codata vacancy; ANCT Action Cœur de Ville atlas; OFDT; four case-study cities and seven interviews", [
        "Optional: Box 5.1 Methodological specifications (town-centre perimeter, exposure to peripheral floor space within 10 km, bank-card data on spending abroad)"]],
      ["**Box 5.2 Key takeaways from chapter**"],
      ["**Research questions addressed**: Q1 (peripheral zones and town centres), Q2 (peripheral zones and QPV), Q3 (retail models in border regions), Q4 (tax and price gaps), Q7 for territorial policies, Q8 (reconciling competitiveness, revitalisation and environmental goals)"]]],
    ["Subsections", [
      ["**A. Territorial dynamics of retail SMEs**", [
        ["Dynamics, 2012-2025", ["2016-2022: employment +1.3% a year in peripheral poles vs +0.2% in town centres; establishments +9.1% vs −5.9%; average store 730 m² vs 115 m² (Insee)", "Observatory: shops in peripheral zones +35.4% since 2012, town centres −2.6%"]],
        ["Vacancy and signs of erosion", ["Town centres: 14% in 2024 vs 6% in 2010; above 20% in 14% of centres; large cities lowest but accelerating", "Periphery: vacancy roughly doubled since 2007 to 8.4% and rising faster than in town centres"]]]],
      ["**B. Peri-urban areas: peripheral retail zones**", [
        ["Effects on town centres (Q1) and QPV (Q2)", ["Observatory: town-centre shops by quartile of peripheral floor space within 10 km; QPV shops by distance to the nearest zone; descriptive, not causal"]],
        ["Regulation: from protecting competitors to protecting land", ["Royer (1973), Raffarin (1996), LME (2008), ALUR/Pinel (2014), ELAN (2018), Climate and Resilience (2021), ZAN law (2023), simplification law (2026)", "Authorised retail floor space −67% (2019-2024); average project 5 000 m² in 2023 vs 14 000 m² in 2014"]],
        ["Transforming peripheral zones", ["Plan for the transformation of commercial zones: 90 projects, EUR 31.4 million; ANCT environmental fund", "437 transformation projects on 8 606 ha (Icade × SCET), 56% at intention stage, 1% completed", "Local tools: SCoT and DAAC, PLU(i), ORT, CDAC, Tascom"]]]],
      ["**C. Town centres and small towns**", [
        ["A changing mix", ["From destination shopping to 'strolling' and services; narrowing commercial strip; restaurant paradox (−13% turnover per outlet in ACV towns); opaque rents and financialisation; fewer residents"]],
        ["Local levers and national programmes", ["Retail managers (515 posts, EUR 20 million), redevelopment property companies (100 foncières, EUR 300 million; FRLA), commercial wasteland tax, 'Ville commerçante' charter, vacancy diagnosis tool, 'Made in Local', test shops, place identity and branding", "Action Cœur de Ville (244 towns, EUR 12 billion, average vacancy 14.5%), Petites villes de demain (1 646 municipalities), retail strand after 2026"]]]],
      ["**D. Rural areas**", [
        ["Rural retail deserts and responses", ["62% of municipalities without a shop; 40% of rural residents say most local shops have closed", "Villages d'avenir (3 000+ municipalities); Rural Recovery Programme (EUR 36 million, 2023-2026; 371 projects by July 2024); multiservice and mobile shops"]]]],
      ["**E. Priority neighbourhoods (QPV)**", [
        ["Specific barriers and levers", ["Viable offer by neighbourhood size (below 3 000, 3 000-10 000, above 10 000 inhabitants); obsolete 1950s-1980s premises; underground economy", "Business creation 1.7 per 100 inhabitants vs 2.2 elsewhere; Entrepreneuriat Quartiers 2030; QPV property vehicle; social economy"]]]],
      ["**F. Cross-border regions**", [
        ["Scale and patterns", ["505 700 cross-border workers in 2023 (+41% since 2012), 71.5% in Switzerland or Luxembourg", "Up to 14% of in-store spending abroad (Moselle 13.9%, Pyrénées-Orientales 12%); regular (Switzerland, Luxembourg) vs seasonal (Spain, Italy, Andorra) patterns; inbound Swiss shoppers"]],
        ["Tax and price gaps (Q4)", ["Fuel and tobacco: 31% of spending abroad (59% in Luxembourg); diesel excise 59.4 vs 33.5 cents per litre; tobacconist sales −33.2% (Moselle −46.2%); at least 9.5% of tobacco bought abroad"]],
        ["Retail models and distribution of gains (Q3)", ["Large formats along commuter corridors (Mont-Saint-Martin); Zweibrücken outlet dispute; vacancy in Nord border towns (Maubeuge 15.9%) vs Thionville (−4.8 points)"]],
        ["Cross-border governance and options", ["Interreg 2014-2020: EUR 3.02 billion, SME competitiveness about 7%; BRIDGEforEU (ANCT national coordination point); MOT; ESPON CROSSSHOP", "Options: fiscal cooperation (Belgium-Luxembourg excise sharing), joint assessment of large retail projects (MORO), cross-border retail observatory"]]]],
      ["**G. Assessing territorial policies**", [
        ["Coherence across territories", ["Periphery and centre governed by different instruments; retail absent from cross-border cooperation; from the Macarez report to the nine government measures"]],
        ["Evaluation", ["Scarcity of impact evaluations (Court of Auditors); case-city evidence; observatory before/after comparisons"]]]],
      DATAVIZ(["share of retail sales by location, France vs Germany", "authorised retail floor space, 1974-2024", "town-centre vacancy by city size, 2014-2024", "town-centre shops by peripheral exposure; QPV shops by distance to zones (observatory)", "share of in-store spending abroad by department; tobacconist sales, border vs non-border", "map of territorial programmes (ACV, PVD, QPV, border areas)"]),
      ["Boxes: policy boxes and good practices", ["Box 5.3 Montigny-lès-Cormeilles – drafted", "Box 5.4 Fifty years of commercial planning law – to draft", "Box 5.5 Redevelopment property companies and retail managers – to draft", "Box 5.6 Rural Recovery Programme – drafted", "Box 5.7 Business Twin and Interreg COMMERCE! – to draft", "Box 5.8 International practice: German planning-led model; MORO SaarMoselle – to draft"]],
      ["Case studies: Paris (large metropolis, BDCom data), Sète (land sobriety, 3.7% vacancy), Bressuire (small rural town, vacancy 17.9% → 8.6%), Mulhouse (cross-border, vacancy from about 14% to under 9%)"],
      ["Interviews: Pascal Madry, Julien Aubignat (Procos), Frédéric Gibert (Banque des Territoires), Diane Gallais and Suzie Chevée (ANCT), Frédéric Marquet (Mulhouse), Jean Peyrony (MOT), Danièle Schmitt (CCI Alsace Eurométropole)"]]],
    ["Conclusions and recommendations", [["Directions: commercial master plan per catchment area covering centre and periphery; scale transformation funding beyond pilots; stable funding for retail managers and foncières; rent observatories; retail strand in the next ACV and PVD programmes; retail as an explicit theme of cross-border cooperation"]]],
    ["References", [["Cerema; Insee Première 2091, 2075 and 2027; Procos; Codata; ANCT; Icade × SCET (2026); Macarez et al. (2025); DGE (nine measures); OFDT; ESPON; MOT; OECD Local Identity, Pride and Branding"]]],
    "Endnotes"]],

  ["Chapter 6: SME Digitalisation and Sustainability Programmes and Policies in France (programme portfolio chapter) (12 pages)", [
    "Cover page: chapter scope and structure",
    ["Introduction", [["Purpose: map the twin-transition policy mix for retail SMEs, assess its coherence and effectiveness, draw international lessons"], ["Research questions addressed: Q7 (most effective policies), Q8 (reconciling competitiveness, revitalisation and environmental goals)"]]],
    ["Programme typologies (technical, non-technical; digital, green, digital & green)", [["OECD mapping of French instruments: 22 green only, 5 digital only, 4 green and digital, 2 territorial; 18 technical, 9 financial, 5 mixed; 6 targeted at retail"], ["Territorial programmes are analysed in Chapter 5; this chapter covers them only where they finance the twin transition"]]],
    ["Key applicable legislation (national and EU-level)", [["National: Climate and Resilience Act, ELAN, AGEC, décret tertiaire, commercial planning law, simplification law (2026)"], ["EU: SME strategy, Recovery and Resilience Facility, cohesion policy and Interreg, BRIDGEforEU, customs reform for small parcels, Digital Services Act"]]],
    "Box 6.1 Typology specifications",
    ["Subsections (split according to programme category: digital; green; digital & green; financing)", [
      ["Description of programme/policy type"],
      ["Main examples (fiche for each)", ["Name", "Target", "Scope (e.g. national, regional, local, urban, rural)", "If applicable, budget & source of funding", "Benefits", "Period (timeline)", "Key stakeholders", "Evaluation"]],
      ["Examples by category", ["Digital: France Num, Osez l'IA, Prêt Boost", "Green: Prêt Vert, Diag Éco-Flux, Coq Vert, décret tertiaire", "Cross-cutting: PNRR (EUR 40.3 billion; France received 85% of its allocation and met 82% of milestones), France 2030"]],
      ["Optional: boxes with examples", ["Box 6.2 PNRR – drafted"]]]],
    ["Data visualisations and corresponding analyses", [["Policy mapping by orientation and type; PNRR allocation by pillar; take-up of programmes by firm size and region where data allow"]]],
    ["Related programmes", [["Multi-level governance: State (DGE, ANCT), regions, intermunicipalities, CCI and CMA, Banque des Territoires, Bpifrance, Conseil national du commerce"], ["Evaluation gaps: scarcity of impact evaluations (Court of Auditors); missing data on vacancy, rents, micro-firm digital use, energy of premises"]]],
    ["Boxes: international examples of good practices", [["Twin-transition support for retail SMEs in peer countries (e.g. digital vouchers, green diagnostics, collective programmes); selection with DG GROW"]]],
    ["Conclusions and recommendations", [["Directions: evaluate flagship programmes with control groups; one-stop access for very small retailers; align digital, green and territorial instruments"]]],
    "References", "Endnotes"]],

  ["Annexes (5 pages)", [
    ["A. Methodology and online observatory: Sirene shop-stock reconstruction, geolocation, composite indices, indicator definitions and sources"],
    ["B. Case-study cities: one page per city (profile, key figures, policies, interview findings)"],
    ["C. Interviews: organisations and dates (no personal contact details)"],
    ["D. Data gaps and statistical recommendations"],
    ["E. Glossary and acronyms"]]],
];

// ------------------------------------------------------------------ document
const kids = [];
kids.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Proposed structure: Country case study – France (revised)", bold: true, size: 36, color: NAVY })] }),
  new Paragraph({ spacing: { after: 240 }, border: { bottom: line(NAVY, 12) }, children: [new TextRun({ text: "The twin transition and the future of retail SMEs in urban, peripheral, rural and cross-border areas", size: 24, color: GREY })] }),
  P("This revision keeps the format and chapter template of the initial proposed structure and adds what the French case requires: a single chapter on territorial dynamics and revitalisation policies (peripheral and peri-urban zones, town centres, rural areas, priority neighbourhoods and cross-border regions), in line with the preliminary theme presented to the DGE, the macroeconomic and financing context, a spatial lens drawn from the online observatory, the eight research questions, the interviews and the four case-study cities. Target length: **about 91 pages** including annexes."),
  table(["Section", "Pages", "Change from initial structure"], [
    ["Foreword and executive summary", "3", "Executive summary adds territorial insights"],
    ["Chapter 1: Assessment and Recommendations", "10", "One section per chapter (five)"],
    ["Chapter 2: Retail SME Economic and Entrepreneurial Dynamics", "13", "Adds macro context, finance, scale-up and transmission, territorial distribution"],
    ["Chapter 3: Digitalisation of Retail SMEs in France", "11", "Adds micro-firms, platforms, AI, skills"],
    ["Chapter 4: The Greening of Retail SMEs in France", "11", "Adds buildings, land use, circular and social economy"],
    ["**Chapter 5: Revitalising Retail SMEs – Rural and Territorial Policies**", "26", "**New**: peri-urban and peripheral zones, town centres, rural areas, QPV, cross-border regions"],
    ["Chapter 6: SME Digitalisation and Sustainability Programmes and Policies (portfolio chapter)", "12", "Adds financing, PNRR and EU dimension"],
    ["Annexes", "5", "New"], ["**Total**", "**91**", ""]], [4600, 900, 4138]),
  H1("Synthesised version", false), ...outline("syn", SYN),
  H1("Detailed version"), ...outline("det", DET, 0, true));

kids.push(H1("Supporting tables"),
  H2("Research questions by chapter"),
  table(["Research question", "Main chapter", "Also in"], [
    ["Q1. Impact of peripheral retail zones on town-centre vitality", "5", "1"], ["Q2. Impact of peripheral zones on priority neighbourhoods (QPV)", "5", "1"],
    ["Q3. Specific retail models in border regions", "5", "2"], ["Q4. Effect of tax and price gaps on shopping behaviour", "5", "6"],
    ["Q5. Which retailers are most advanced in the digital transition", "3", "2"], ["Q6. Which territories are most advanced in the green transition", "4", "5"],
    ["Q7. Which public policies seem most effective", "6 (twin transition), 5 (territorial)", "1"], ["Q8. Reconciling competitiveness, urban revitalisation and environmental goals", "5", "1, 6"]], [6000, 1500, 2138]),
  H2("Case-study cities"),
  table(["City", "Why", "Chapter", "Envisaged interlocutors"], [
    ["**Paris** (Île-de-France)|Large metropolis", "Most extensive local public action for independent retail; BDCom (Apur, City of Paris, CCI Paris Île-de-France) records every ground-floor commercial unit, address by address, every three years.", "5 (also 3)", "City of Paris (deputy mayor for commerce), SEM Paris Commerces, Apur, CCI Paris Île-de-France, Chamber of trades, merchant associations"],
    ["**Mulhouse** (Grand Est)|Cross-border town", "Since a retail manager was appointed in 2011, 600+ shops opened and vacancy fell from about 14% to under 9%; the former manager became mayor in 2026; trinational Basel area.", "5", "City of Mulhouse, retail manager, Mulhouse Alsace Agglomération, CCI Alsace Eurométropole, Les Vitrines de Mulhouse"],
    ["**Sète** (Occitanie)|Coastal medium-sized town", "Town-centre vacancy among the lowest in France (3.7% in 2022); national land-sobriety pilot since 2020; tourist demand; Frontignan as a possible comparison.", "5", "City of Sète (commerce, Action Cœur de Ville), Sète Agglopôle Méditerranée, CCI Hérault, merchant associations"],
    ["**Bressuire** (Nouvelle-Aquitaine)|Small rural town", "Vacancy halved between 2019 and 2025 (17.9% to 8.6%): housing renovation, planning rules, town-centre manager, collective organisation of merchants.", "5", "City of Bressuire, Agglo2B (Bocage Bressuirais), town-centre manager, CCI Deux-Sèvres, merchant association (to confirm)"]],
    [1500, 3800, 1100, 3238]),
  H2("Interviews by chapter"),
  table(["#", "Person(s) and organisation", "Contribution", "Chapters"], [
    ["1", "Marie Adeline-Peix and Vincent Criquebec, Bpifrance", "Green and AI financing for SMEs, regional deployment", "3, 4, 6"],
    ["2", "Nicolas Bonnet, CCI France", "121 CCIs supporting the digital and green transition of retailers", "2, 3, 4"],
    ["3", "Aurélien Palix and Bénédicte Roullier, DGE", "France Num barometer, Activateurs, AI adoption by very small businesses", "3, 6"],
    ["4", "Guy Gras, Conseil du Commerce de France", "Overview of the sector, all sizes and formats", "2, 4, 6"],
    ["5", "Julien Aubignat, Procos", "Vacancy and rents by location, centre vs periphery", "5"],
    ["6", "Frédéric Gibert, Banque des Territoires", "Retail plan, foncières, commercial city entrances", "5, 6"],
    ["7", "Diane Gallais and Suzie Chevée, ANCT", "Action Cœur de Ville 2 review, next wave, commercial zones", "5, 6"],
    ["8", "Pascal Madry, Institut pour la ville et le commerce", "Commercial overcapacity", "5"],
    ["9", "Frédéric Marquet, City of Mulhouse", "Revival of Mulhouse town centre near Basel and Germany", "5"],
    ["10", "Jean Peyrony, MOT", "Overview of all French borders", "5, 6"],
    ["11", "Danièle Schmitt, CCI Alsace Eurométropole", "Business Twins; cross-border shopping Alsace / Baden-Württemberg", "5"]], [500, 3200, 4438, 1500]),
  H2("Figures to harmonise before drafting"),
  table(["Indicator", "Values found", "Proposal"], [
    ["Action Cœur de Ville towns", "222 (phase 1), 234 (DGE presentation), 244 (phase 2)", "244 for phase 2, 222 for 2018"],
    ["Priority neighbourhoods", "1 609 (incl. overseas), 1 362 (mainland, observatory)", "State the coverage"],
    ["PNRR green pillar", "EUR 22.2 bn (policy box), EUR 20 bn (presentation)", "Use the European Commission figure"],
    ["Peripheral share of retail", "67% of sales, 72% of in-store spending, 75%", "Keep with definitions"],
    ["Town-centre vacancy", "14% in 2024 (DGE), 11.7% in 2025 (Procos panel)", "State source and scope"],
    ["Average store size", "730 / 115 m² (Insee 2022), 586 / 92 m²", "Use Insee Première 2091"],
    ["Cross-border workers", "465 000 (2021), 505 700 (2023)", "Use 2023"],
    ["Rural Recovery Programme ceilings", "Policy box vs DGE (2024)", "Check current rules with the DGE"]], [2600, 4300, 2738]),
  H2("Timeline"),
  table(["Date", "Milestone"], [["Q2 2026", "Start of the study"], ["12 June 2026", "Strategic Foresight Workshop"], ["Q3-Q4 2026", "Interviews and city missions"],
    ["November 2026", "Validation of this structure with the DGE and DG GROW (proposal)"], ["Q1 2027", "Preliminary draft"], ["April 2027", "Discussion at the CSMEE"], ["June 2027", "Report launch"]], [2600, 7038]));

const lv = (fmts) => fmts.map(([fmt, text], l) => ({ level: l, format: fmt, text, alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 400 + l * 400, hanging: 400 } } } }));
const OL = lv([[LevelFormat.UPPER_ROMAN, "%1."], [LevelFormat.LOWER_LETTER, "%2."], [LevelFormat.LOWER_ROMAN, "%3."], [LevelFormat.DECIMAL, "%4."], [LevelFormat.BULLET, "–"], [LevelFormat.BULLET, "·"]]);
const doc = new Document({
  creator: "OECD CFE", title: "Proposed structure (revised) – Country case study France",
  styles: { default: { document: { run: { font: "Arial", size: 20, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, color: NAVY }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: NAVY }, paragraph: { outlineLevel: 1 } }] },
  numbering: { config: [{ reference: "syn", levels: OL }, { reference: "det", levels: OL },
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Proposed structure (revised) – France country study  ·  ", size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] }) },
    children: kids }] });
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log("ok", OUT); });
