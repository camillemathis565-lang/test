// Proposed structure (revised) of the France country case study: adds peripheral zones, town centres/QPV/rural, cross-border regions,
// macro and finance context, spatial lens, research questions, case cities and interviews; page budget for a 90-100 page report.
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, LevelFormat,
  Footer, PageNumber, HeadingLevel, ShadingType, PageBreak } = require("docx");

const OUT = path.join(__dirname, "proposed_structure_France_country_study_revised.docx");
const INK = "1A1A1A", NAVY = "1F3864", GREY = "595959", SOFT = "BFBFBF", BAND = "EEF2F7", BOXC = "F4F4F4";
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
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 0, after: 160 }, children: [new TextRun(t)] });
const H1n = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 160 }, children: [new TextRun(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, keepNext: true, children: [new TextRun(t)] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 }, keepNext: true, children: [new TextRun(t)] });
const B = (items, lvl = 0) => items.flatMap(it => Array.isArray(it) ? B(it, lvl + 1) : [new Paragraph({ numbering: { reference: "bul", level: lvl }, spacing: { after: 50, line: 264 }, children: runs(it) })]);
const meta = (label, text) => new Paragraph({ spacing: { after: 70 }, children: [new TextRun({ text: label + " ", bold: true, color: NAVY }), ...runs(text)] });
function table(head, rows, widths, o = {}) {
  const m = { top: 60, bottom: 60, left: 90, right: 90 }, sz = o.sz || 17;
  const cell = (t, w, h, i) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: m,
    shading: h ? { type: ShadingType.CLEAR, fill: BAND, color: "auto" } : (o.zebra && i % 2 ? { type: ShadingType.CLEAR, fill: "FAFAFA", color: "auto" } : undefined),
    borders: { top: h ? line(NAVY, 8) : none, bottom: line(h ? NAVY : SOFT, 4), left: none, right: none },
    children: String(t).split("|").map(x => new Paragraph({ spacing: { after: 20 }, children: runs(x, { size: sz, bold: h || undefined, color: h ? NAVY : INK }) })) });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: head.map((h, j) => cell(h, widths[j], true)) }),
      ...rows.map((r, i) => new TableRow({ cantSplit: true, children: r.map((c, j) => cell(c, widths[j], false, i)) }))] });
}
function box(title, lines) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ width: { size: W, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: BOXC, color: "auto" }, margins: { top: 120, bottom: 120, left: 180, right: 180 },
    borders: { top: none, bottom: none, right: none, left: line(NAVY, 18) },
    children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, bold: true, color: NAVY, size: 20 })] }),
      ...lines.map(l => Array.isArray(l) ? B(l) : [new Paragraph({ spacing: { after: 60 }, children: runs(l, { size: 19 }) })]).flat()] })] })] });
}
const sp = () => new Paragraph({ spacing: { after: 60 }, children: [] });

// ------------------------------------------------------------------ chapter data
// [id, title, pages, purpose, questions, sections: [title, pages, bullets], figures, boxes:[name,status], cases, interviews, data, recs]
const CH = [
 ["2", "Retail SME economic and entrepreneurial dynamics", 13,
  "Establish the structural diagnosis: who retail SMEs are, how they perform, how they are born, grow, are transmitted and close, how they are financed, and where they are located. The chapter sets the baseline for every following chapter.",
  ["Why do French retail SMEs capture a smaller share of value added than their EU peers?", "Is the fall in micro-retailers' real value added a productivity, demand or composition problem?", "How do entry, exit, scale-up and transmission dynamics differ across territories?"],
  [["2.1 Macroeconomic and consumption context", 2, ["Growth of 0.8% in 2025 and 2026, unemployment rising from 7.9% (Q4 2025) to 8.7% (2027), household saving rate near 19%, new energy-price shock in 2026 (inflation peaking at 2.9% in Q3), fiscal deficit of 5.1% of GDP and debt around 120% (European Commission; OECD Economic Outlook 2025/2).",
     "Consumption shifts: goods consumption down three years running (−2.3%, −1.7%, −0.4%), polarisation between constrained and pleasure consumption, _consommation subie_, '15-minute' proximity shopping (Macarez et al., 2025).",
     "E-commerce at 10% of retail (+80% since 2019), marketplaces above half of online purchases (Local Retail, Global Trends)."]],
   ["2.2 Structure by firm size: the 'thin middle'", 2, ["95.2% micro-firms; SMEs hold 54.4% of retail employment (EU 65%) and 42% of value added (EU 53%); large retailers 58% of value added (EU 40%) (SME Performance Review 2025).",
     "Only about 21 000 medium-sized firms economy-wide and weak midcap presence: few firms scale up ('passage à l'échelle').", "Table: enterprises, employment and value added by size class, France vs EU-27, retail (G47)."]],
   ["2.3 Performance trends 2008-2024", 2.5, ["Real value added in retail (G47): SMEs −6%, micro-firms −24%, large firms +37%; labour productivity of micro-firms −23%; SMEs grew by hiring rather than by efficiency gains.",
     "Retail SMEs add workers but create less value: 2024 nowcast, micro-firms are the only size class with growing employment and contracting real value added.", "Cross-sector comparison: retail vs wholesale vs total business economy; EU benchmark (retail SME productivity +14.6% in the EU, 2018-2025)."]],
   ["2.4 Entry, exit, churn, scale-up and transmission", 2, ["Rising churn in French retail while wholesale churn fell (EU retail churn 20% → 19%, 2011-2021).",
     "High-growth enterprises in trade (G): 10.1% (2019) → 4.9% (2022); gazelles 177 → 45. Bankruptcies 66 262 (2024) and 68 000 (2025).",
     "Shop stock from Sirene (observatory): 460 048 shops on 1 January 2025 (+2.2% since 2019), entries and exits by period, employer share, chain stores.",
     "Transmission: 500 000 firms (3 million jobs) could change hands within ten years; retail and hospitality are 57% of 2024 transfers."]],
   ["2.5 Access to finance", 1.5, ["SME loan rates 1.00% (2020) → 4.26% (2024); rejection rate 4.1% (highest since 2016); application rate 37.9% (2015) → 33.0% (2024), a discouraged-borrower signal; collateral requirements 6.4%.",
     "Outstanding SME loans −2.2% in 2024; state-guaranteed loans: 26.4% left to repay (March 2025); non-bank finance (business angels, crowdfunding, factoring) (Financing SMEs and Entrepreneurs 2026)."]],
   ["2.6 Internationalisation", 0.5, ["Exceptional increase in exporting retailers; France among the largest gains in importing retailers (Local Retail, Global Trends)."]],
   ["2.7 Territorial distribution of retail", 1.5, ["Shop density by municipality type (urban, intermediate, rural), centre / periphery / priority neighbourhoods / elsewhere, 2012-2025 (observatory).",
     "Rural retail deserts: 62% of municipalities without a shop (2021). Maps by department."]],
   ["2.8 Regulatory environment and conclusions", 1, ["'Silence means consent', one-stop shop, remaining barriers in retail distribution (OECD Economic Survey 2024); 2026 simplification law (monthly commercial rents, deposit capped at three months).", "Conclusions and recommendation directions."]]],
  ["Enterprises, employment and value added by size, France vs EU-27 (stacked bars)", "Real value added and labour productivity by size, 2008-2024 (index)", "High-growth enterprises and gazelles, 2012-2022", "SME loan rates, rejection and application rates, 2012-2024", "Shops by location type, 2012-2025, and density map by department"],
  [["Box 2.1 Methodology: Eurostat structural business statistics and Sirene shop stock reconstruction", "To draft"], ["Box 2.2 Key takeaways", "To draft"], ["Box 2.3 France 2030 and SMEs (EUR 54 billion; 55% of beneficiaries are SMEs)", "To draft"]],
  "National level; spatial disaggregation from the observatory.", "Guy Gras (CdCF), Nicolas Bonnet (CCI France).",
  "Eurostat SBS and SME Performance Review 2025; Financing SMEs and Entrepreneurs 2026; Insee Sirene and Ésane; Banque de France; Insee (business demography, failures).",
  ["Close the 'thin middle': scale-up support and transmission (employee buy-outs).", "Improve SME access to finance for transition investment.", "Statistical recommendation: retail data by firm size and territory."]],
 ["3", "Digitalisation of retail SMEs in France", 11,
  "Measure how far French retail SMEs have adopted digital tools and AI, compared with the EU, and identify the barriers, especially for micro-firms that EU statistics do not cover.",
  ["Have French retailers closed the digital gap with the EU, and who is left behind?", "How do marketplaces and foreign platforms reshape competition for physical SMEs?", "Which digital uses actually help proximity retail (visibility, click-and-collect, local delivery, CRM)?"],
  [["3.1 Context, definitions and methodology", 1, ["Definitions: e-commerce, omnichannel, EDI, CRM, AI adoption. Data limits: OECD/Eurostat ICT survey covers firms with 10+ employees only, about 5% of French retailers."]],
   ["3.2 Adoption rates: catching up with the EU", 2, ["Retailers whose website allows ordering: 41.5% (EU 41.6%), up from 16.7% in 2009; AI adoption (all sectors, 10+ employees): 18.2% vs 19.9% in the EU, 91% of the EU rate (80% in 2020) (OECD ICT database).",
     "Balanced e-commerce adoption between wholesale (B2B) and retail."]],
   ["3.3 Micro-firms and very small businesses", 1.5, ["France Num barometer 2026 (9 000+ firms): 40% use AI, 83% have an online visibility tool, 46% get 5%+ of customers online, 76% use data to steer their business.",
     "SME Twin Transition Monitor: France in the middle tier."]],
   ["3.4 Competition dynamics: marketplaces, platforms and fast fashion", 2, ["Marketplaces above half of online purchases; foreign low-cost platforms; ultra-fast commerce (30% of the French have used one, CRÉDOC).",
     "Policy response: parcel tax of EUR 2 per product category (2026), DGCCRF controls tripled, '360°' control doctrine, EU customs reform, anti fast fashion bill; Macarez et al. proposals (warehouse taxation, commercial authorisation for e-commerce warehouses)."]],
   ["3.5 Uses that work for proximity retail", 1.5, ["Visibility, click-and-collect, local delivery, loyalty and CRM; collective digital platforms at town-centre level ('open-air shopping centre').", "Digital traceability tools against the underground economy."]],
   ["3.6 Artificial intelligence", 1, ["Osez l'IA (academy, ambassadors), CCI France and France Num campaign (20 000 firms), DGE call for AI solution providers for retail (33 selected), CNC use-case guide."]],
   ["3.7 Cybersecurity and skills", 1, ["39% of very small businesses hit by a cyber incident in a year; 84% have a protection measure.", "Merchant training fell from 100 000 to 15 000 per year after the pre-creation training obligation ended."]],
   ["3.8 Territorial dimension and conclusions", 1, ["E-commerce intensity by municipality density (observatory); fibre take-up barriers (41% of firms without fibre hesitate)."]]],
  ["Website ordering, France vs EU-27, 2009-2025", "AI adoption, France vs EU-27, 2020 and 2025", "France Num indicators by firm size", "E-commerce intensity by municipality type"],
  [["Box 3.1 France Num", "Drafted (Policy boxes v2)"], ["Box 3.2 Osez l'IA and Diag Data IA", "To draft"], ["Box 3.3 Methodology: ICT survey coverage", "To draft"], ["Box 3.4 Good practice: collective digital platform of a town centre", "To identify in interviews"]],
  "Paris (data and SEM Paris Commerces), Mulhouse (merchant network).", "Aurélien Palix and Bénédicte Roullier (DGE), Vincent Criquebec (Bpifrance), Nicolas Bonnet (CCI France).",
  "OECD ICT Access and Usage; Eurostat ICT survey; France Num barometer (DGE, CRÉDOC); CRÉDOC; Fevad.",
  ["Extend digital statistics to micro-firms.", "Shift support from individual websites to collective, place-based digital tools.", "Merchant training on digital and AI."]],
 ["4", "The greening of retail SMEs in France", 11,
  "Document the environmental performance of French retail, separate what SMEs control (energy, waste, circular models) from what they do not (electricity mix, land policy), and identify barriers to action.",
  ["Is the strong fall in retail emissions driven by SMEs or by the energy mix?", "What do the décret tertiaire and ZAN mean for retail SMEs and their premises?", "Which circular business models can scale among small retailers?"],
  [["4.1 Context: national and EU priorities", 1.5, ["National low-carbon strategy, Climate and Resilience Act (ZAN), décret tertiaire, anti-waste law (AGEC); EU Green Deal and Fit for 55; roadmap for exiting fossil fuels (2026)."]],
   ["4.2 Emissions of retail", 2, ["Greenhouse gas emissions of retail (G47): −56% over 2008-2024, first in the EU-27 (EU −39%); 95% of electricity from renewables and nuclear (2024) (OECD Air Emissions Accounts; ministry).",
     "France among the largest energy consumers in retail; production- and demand-based emissions where data allow."]],
   ["4.3 Energy and buildings", 1.5, ["Décret tertiaire: −40% energy use by 2030, −50% by 2040, −60% by 2050 for buildings above 1 000 m²; peripheral 'thermal sieves'; refrigeration and lighting costs."]],
   ["4.4 Land use", 1, ["Trade uses the most land of any sector over a decade, though its share fell from about 30% to under 20% (Banque de France); 15 119 ha of land consumed in 2024; link to Chapter 5."]],
   ["4.5 Waste, circular and social-economy models", 2, ["CNC report on circular retail (second hand, repair, rental, deposit, bulk, unsold goods); social and solidarity economy (2.59 million employees; Les Canaux; repair cafés; PTCE clusters); local sourcing initiatives and dependence risks."]],
   ["4.6 SME practices and barriers", 1, ["EU: 66% save energy or minimise waste, 21% have a carbon strategy; barriers: administrative complexity (35%), cost (28%); green skills in 1-2% of job ads."]],
   ["4.7 Twin transition interactions and conclusions", 2, ["Synergies (energy monitoring, inventory optimisation) and trade-offs (delivery, ultra-fast commerce)."]]],
  ["Retail GHG emissions, France vs EU-27, 2008-2024 (index)", "Energy use of retail premises by format", "Land consumption for economic activity, 2011-2024", "Resource-efficiency actions of SMEs"],
  [["Box 4.1 Prêt Vert", "Drafted"], ["Box 4.2 Diag Éco-Flux", "Drafted"], ["Box 4.3 Communauté du Coq Vert", "Drafted"], ["Box 4.4 Good practice: circular retail SME", "To identify"]],
  "Sète (land sobriety pilot).", "Marie Adeline-Peix (Bpifrance), Nicolas Bonnet (CCI France), Guy Gras (CdCF).",
  "OECD Air Emissions Accounts; ADEME (OPERAT, if aggregated); Cerema land-consumption files; Flash Eurobarometer; CNC.",
  ["Simplify access to green finance and diagnostics for very small retailers.", "Support energy retrofits of retail premises ahead of 2030.", "Scale circular models through local networks."]],
 ["5", "Peripheral retail zones: from expansion to transformation", 11,
  "New chapter. Analyse the weight of out-of-town retail in France, its economic and environmental costs, the change in regulation from protecting competitors to protecting land, and the conditions for transforming existing zones.",
  ["How dominant is the peripheral model, and is it starting to erode?", "What are the effects of peripheral zones on town centres (research question 1)?", "What makes transformation projects succeed, and how can they be scaled?"],
  [["5.1 Definitions and data", 1, ["Three formats: street-level shops, peripheral zones, enclosed shopping centres. Cerema inventory of 1 500+ zones; Sirene geolocation (observatory)."]],
   ["5.2 Scale and economic weight", 1.5, ["About 500 million m², five times the built area of Paris; 67% of retail sales and 72% of in-store spending; specialised retailers make about 70% of their sales there.",
     "Two European models: 'liberal' (France, Belgium, Madrid region) vs 'planning-led' (Germany, Italy, Catalonia, England, Netherlands)."]],
   ["5.3 Dynamics", 2, ["2016-2022: employment +1.3% a year in peripheral poles vs +0.2% in town centres; establishments +9.1% vs −5.9%; average store 730 m² vs 115 m² (Insee Première 2091).",
     "Observatory, 2012-2025: shops in peripheral zones +35.4% vs −2.6% in town centres of municipalities with 5 000+ inhabitants."]],
   ["5.4 Signs of erosion", 1, ["Vacancy roughly doubled since 2007 to 8.4% (2025) and rising faster than in town centres; footfall concentrated in zones mixing retail and leisure."]],
   ["5.5 Regulatory trajectory", 1.5, ["Royer (1973), Raffarin (1996), LME (2008), ALUR/Pinel (2014), ELAN (2018), Climate and Resilience (2021), ZAN law (2023), simplification law (2026).",
     "Authorised retail floor space −67% (2019-2024); average authorised project 5 000 m² in 2023 vs 14 000 m² in 2014; France the only country with a binding land-take target."]],
   ["5.6 Transforming existing zones", 2, ["Plan for the transformation of commercial zones: 90 projects, EUR 31.4 million; ANCT environmental fund; 437 transformation projects on 8 606 ha (Icade × SCET), 56% at intention stage, 1% completed; 64% of the French see housing at commercial city entrances as a priority.",
     "Local tools: SCoT and DAAC, PLU(i), ORT, CDAC, Tascom."]],
   ["5.7 Effects on town centres (Q1) and conclusions", 2, ["Observatory analysis: change in town-centre shops by quartile of peripheral floor space within 10 km; descriptive, not causal; complemented by interviews."]]],
  ["Share of retail sales by location, France vs Germany", "Authorised retail floor space, 1974-2024", "Employment and establishments, centre vs periphery, 2016-2022", "Town-centre shops by peripheral exposure (observatory)"],
  [["Box 5.1 Montigny-lès-Cormeilles: turning a 1.5 km retail strip into a town centre", "Drafted"], ["Box 5.2 Fifty years of commercial planning law (timeline)", "To draft"], ["Box 5.3 Urban planning tools for peripheral zones", "To draft"], ["Box 5.4 International practice: German planning-led model", "To draft"]],
  "Sète (control of peripheral development and town-centre vitality).", "Pascal Madry (Institut pour la ville et le commerce), Julien Aubignat (Procos), Frédéric Gibert (Banque des Territoires), Diane Gallais (ANCT).",
  "Cerema inventory; Insee Première 2091; Procos; CNAC/CDAC statistics; Icade × SCET barometer; observatory.",
  ["Plan transformation at the scale of the catchment area.", "Scale funding beyond pilot projects.", "Monitor vacancy and footfall in peripheral zones."]],
 ["6", "Town centres, small towns, rural areas and priority neighbourhoods", 12,
  "New chapter. Explain why town centres are transforming rather than simply declining, assess the local and national levers, and cover the specific situations of rural areas and priority neighbourhoods (QPV).",
  ["What drives commercial vacancy in town centres, and which local strategies reverse it?", "What is the impact of peripheral zones on QPV (research question 2)?", "Which national programmes work, and what should their next generation include?"],
  [["6.1 Diagnosis", 1.5, ["Town-centre vacancy 14% in 2024 vs 6% in 2010 (DGE); above 20% in 14% of centres; large cities still lowest but accelerating; one in two French people sees their centre losing momentum (Elabe)."]],
   ["6.2 A changing mix: winners and losers", 1.5, ["From destination shopping to 'strolling' and services; food and food service +75% turnover in 16 years; fashion −14 000 establishments; physical retail created 800 000 jobs (2006-2022) vs 50 000 for e-commerce; the restaurant paradox (−13% turnover per outlet in ACV towns)."]],
   ["6.3 Drivers of vacancy", 1.5, ["Overcapacity and the narrowing commercial strip, opaque rents and financialisation of commercial property, fewer residents (short-term rentals), access and parking, security (thefts +15.5%)."]],
   ["6.4 Local levers", 2, ["Retail managers (515 posts, EUR 20 million), redevelopment property companies (100 foncières programme, EUR 300 million; FRLA), commercial wasteland tax (480 municipalities and 68 intermunicipalities only), 'Ville commerçante' charter, vacancy diagnosis tool, 'Made in Local', pop-up and test shops, place identity and branding (OECD, 2026)."]],
   ["6.5 National programmes", 1.5, ["Action Cœur de Ville (244 towns, EUR 12 billion, average vacancy 14.5%), Petites villes de demain (1 646 municipalities), Villages d'avenir (3 000+), reinforced retail strand after 2026."]],
   ["6.6 Rural areas", 1, ["Rural retail deserts; Rural Recovery Programme (EUR 36 million, 2023-2026; 371 projects, EUR 10 million by July 2024); multiservice and mobile shops."]],
   ["6.7 Priority neighbourhoods (Q2)", 2, ["1 609 QPV, 6 million residents; viable offer by neighbourhood size; obsolete 1950s-1980s premises; underground economy; business creation 1.7 per 100 inhabitants vs 2.2 elsewhere; Entrepreneuriat Quartiers 2030; QPV property vehicle.",
     "Observatory: change in QPV shops by distance to the nearest peripheral zone."]],
   ["6.8 From the Macarez report to the nine government measures, and conclusions", 1, ["What is under way, what remains open."]]],
  ["Town-centre vacancy by city size, 2014-2024", "Change in establishments by sector", "Vacancy trajectories of ACV towns (atlas ANCT)", "QPV shops by distance to peripheral zones"],
  [["Box 6.1 Rural Recovery Programme", "Drafted"], ["Box 6.2 Redevelopment property companies (foncières)", "To draft"], ["Box 6.3 Retail managers", "To draft"], ["Box 6.4 Case study: Paris", "Mission"], ["Box 6.5 Case study: Bressuire", "Mission"], ["Box 6.6 Case study: Sète", "Mission"]],
  "Paris, Bressuire, Sète.", "Diane Gallais and Suzie Chevée (ANCT), Frédéric Gibert (Banque des Territoires), Pascal Madry, Julien Aubignat.",
  "Codata; Procos; ANCT atlas ACV; Apur BDCom; Insee; Macarez et al. (2025); DGE.",
  ["Commercial master plan per catchment area.", "Stable funding for retail managers and foncières.", "Rent observatories and transparency.", "A retail strand in the next ACV and PVD programmes."]],
 ["7", "Cross-border regions: leakage, opportunity and cooperation", 11,
  "New chapter. Characterise cross-border shopping along France's borders, its effects on local retail SMEs, and the governance gap: retail is almost never an explicit competence of cross-border cooperation.",
  ["Do border regions show specific retail models (research question 3)?", "How do tax and price gaps shape shopping behaviour (research question 4)?", "Who gains and who loses, and what cooperation could help retail SMEs?"],
  [["7.1 A large-scale phenomenon", 1, ["36% of the population lives in a border department; 505 700 cross-border workers in 2023 (+41% since 2012), 71.5% working in Switzerland or Luxembourg; 40+ cooperation structures."]],
   ["7.2 Opposite situations by border", 2, ["Leakage: up to 14% of in-store spending abroad (Moselle 13.9%, Pyrénées-Orientales 12%); half of border households buy abroad (Insee Première 2075).",
     "Inbound shopping: Swiss households near France divert 11.3% of grocery spending abroad (Kluser, 2025).",
     "Regular (Switzerland, Luxembourg: EUR 1 600 a year) vs seasonal (Spain, Italy, Andorra) patterns."]],
   ["7.3 Tax and price gaps (Q4)", 2, ["Fuel and tobacco: 31% of spending abroad (59% in Luxembourg); diesel excise 59.4 vs 33.5 cents per litre (Luxembourg); VAT 20% vs 17%; tobacconist sales −33.2% (Moselle −46.2%); COVID border closure shows at least 9.5% of tobacco bought abroad.",
     "Distance effects (Belkacem et al., 2022; Mathä et al., 2017)."]],
   ["7.4 Retail models and distribution of gains (Q3)", 2, ["Large formats along commuter corridors (European Development Pole, Mont-Saint-Martin); opposition of the SaarMoselle Eurodistrict to the Zweibrücken outlet extension; vacancy in Nord border towns (Maubeuge 15.9%) vs Thionville (−4.8 points).",
     "Observatory: density and sector mix in border vs non-border areas."]],
   ["7.5 Governance", 2, ["Interreg 2014-2020: EUR 3.02 billion, SME competitiveness about 7%; BRIDGEforEU (ANCT national coordination point); MOT; ESPON CROSSSHOP (results 2027); tobacconist support (8% rebate, EUR 2 000 bonus)."]],
   ["7.6 Options and conclusions", 2, ["Fiscal cooperation (Belgium-Luxembourg excise revenue sharing), cross-border consultation on large retail projects (MORO), cross-border retail observatory."]]],
  ["Share of in-store spending abroad by department", "Cross-border workers by country, 2012-2023", "Tobacconist sales, border vs non-border departments, 2017-2022", "VAT and excise rates, France and neighbours"],
  [["Box 7.1 Business Twin (Upper Rhine)", "To draft"], ["Box 7.2 Interreg COMMERCE! (France-Wallonia-Flanders)", "To draft"], ["Box 7.3 MORO and the SaarMoselle retail working group", "To draft"], ["Box 7.4 Case study: Mulhouse", "Mission"]],
  "Mulhouse (trinational Basel area).", "Frédéric Marquet (Mulhouse), Jean Peyrony (MOT), Danièle Schmitt (CCI Alsace Eurométropole).",
  "Insee Première 2075 and 2027; Insee Analyses 97; OFDT; ESPON; CCI observatories (Moselle, Alsace, Pyrénées-Orientales).",
  ["Make retail an explicit theme of cross-border cooperation.", "Joint assessment of large cross-border retail projects.", "Explore fiscal cooperation on excise goods."]],
 ["8", "SME digitalisation, sustainability and territorial programmes and policies", 12,
  "Portfolio chapter, extended to territorial programmes. Map the policy mix, assess coherence and effectiveness, and draw international lessons.",
  ["Which policies seem most effective for retail SMEs (research question 7)?", "How can competitiveness, urban revitalisation and environmental goals be reconciled (research question 8)?", "How does the EU framework support or constrain national action?"],
  [["8.1 Typology", 1.5, ["Technical / financial / mixed; digital / green / twin / territorial. OECD mapping of French instruments: 22 green only, 5 digital only, 4 green and digital, 2 territorial; 18 technical, 9 financial, 5 mixed; 6 targeted at retail."]],
   ["8.2 Applicable legislation", 1.5, ["National: Climate and Resilience, ELAN, AGEC, décret tertiaire, simplification law 2026, commercial planning law. EU: SME strategy, RRF, cohesion policy and Interreg, BRIDGEforEU, customs reform for small parcels, DSA."]],
   ["8.3 Programme fiches by category", 4, ["Digital, green, twin, territorial and financing programmes, each with: name, target, scope, budget and funding source, benefits, period, stakeholders, evaluation."]],
   ["8.4 Multi-level governance", 1.5, ["State (DGE, ANCT), regions, intermunicipalities, CCI and CMA, Banque des Territoires, Bpifrance, Conseil national du commerce."]],
   ["8.5 The EU dimension", 1, ["PNRR (EUR 40.3 billion; France received 85% of its allocation and met 82% of milestones); Retail Transition Pathway."]],
   ["8.6 Evaluation and data gaps", 1, ["Scarcity of impact evaluations (Court of Auditors); missing data (vacancy, rents, micro-firm digital use, energy of premises)."]],
   ["8.7 International good practices and conclusions (Q7, Q8)", 1.5, ["Germany (planning-led retail), Flanders and Wallonia (land take), Belgium-Luxembourg (excise sharing), Paisley and Nantes (place-based regeneration)."]]],
  ["Policy mapping by orientation and type", "PNRR allocation by pillar", "Programme coverage by territory type"],
  [["Box 8.1 PNRR", "Drafted"], ["Box 8.2 Typology specifications", "To draft"], ["Boxes 8.3-8.5 International good practices", "To draft"]],
  "All four cities (local policy mix).", "All interviews; DGE and DG GROW.",
  "OECD policy mapping; programme reports; Court of Auditors; European Commission.",
  ["Evaluate flagship programmes with control groups.", "Simplify access through one-stop shops.", "Align digital, green and territorial instruments."]],
];

// ------------------------------------------------------------------ document
const kids = [];
// cover
kids.push(new Paragraph({ spacing: { before: 2400, after: 120 }, children: [new TextRun({ text: "Country case study – France", size: 26, color: GREY })] }),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Proposed structure (revised)", bold: true, size: 48, color: NAVY })] }),
  new Paragraph({ spacing: { after: 600 }, border: { bottom: line(NAVY, 12) }, children: [new TextRun({ text: "The twin transition and the future of retail SMEs in urban, peripheral, rural and cross-border areas", size: 28, color: INK })] }),
  P("Working document for discussion with the DGE and DG GROW. Target length of the report: **90 to 100 pages** including annexes.", { r: { size: 22 } }),
  P("Prepared October 2026. Builds on the initial proposed structure, the preliminary themes presented to the DGE, research notes (Local Retail, Global Trends; OECD Economic Survey 2024; Financing SMEs and Entrepreneurs 2026; SME Performance Review 2025; Macarez et al., 2025), notes on peripheral zones and cross-border regions, policy boxes, the online observatory, the interview programme and the case-study cities.", { r: { size: 20, color: GREY } }));

kids.push(H1("1. Why revise the structure"),
  P("The initial structure follows the standard OECD country-study format: an assessment chapter, three analytical chapters (economic dynamics, digitalisation, greening) and a programme portfolio chapter. It remains a sound backbone, but it leaves out several issues that are central to the French case and to the questions raised by the DGE:"),
  ...B(["**Peripheral retail zones**, where two thirds of French retail sales take place and which now face land-take regulation, rising vacancy and transformation projects.",
    "**Cross-border regions**, where up to 14% of in-store spending leaves the country and where retail is almost absent from cooperation frameworks.",
    "**Town centres, small towns, rural areas and priority neighbourhoods (QPV)**, the core of current French policy (Action Cœur de Ville, Petites villes de demain, the Macarez report and the nine government measures).",
    "**The macroeconomic, consumption and financing context**, which conditions SMEs' capacity to invest in the twin transition.",
    "**A spatial lens**: the initial structure asks for disaggregation by region, city and rural-urban areas; the observatory now makes this possible for every chapter.",
    "**The eight research questions**, the **interviews** and the **four case-study cities**, which should be explicitly placed in the report.",
    "**The EU dimension** relevant to DG GROW: Retail Transition Pathway, Recovery and Resilience Facility, cohesion policy, single market and customs."]),
  H2("Summary of changes"),
  table(["Initial structure", "Revised structure", "Change"], [
    ["Foreword, executive summary", "Foreword, executive summary", "Unchanged; executive summary adds territorial insights"],
    ["Ch. 1 Assessment and recommendations", "Ch. 1 Assessment and recommendations", "One section per chapter (seven instead of four)"],
    ["Ch. 2 Economic and entrepreneurial dynamics", "Ch. 2 Economic and entrepreneurial dynamics", "Adds macro and consumption context, access to finance, transmission, territorial distribution"],
    ["Ch. 3 Digitalisation", "Ch. 3 Digitalisation", "Adds micro-firms, platforms and fast fashion, uses for proximity retail"],
    ["Ch. 4 Greening", "Ch. 4 Greening", "Adds buildings (décret tertiaire), land use, social and circular economy"],
    ["–", "**Ch. 5 Peripheral retail zones**", "New chapter"],
    ["–", "**Ch. 6 Town centres, small towns, rural areas and QPV**", "New chapter"],
    ["–", "**Ch. 7 Cross-border regions**", "New chapter"],
    ["Ch. 5 Programmes and policies", "Ch. 8 Programmes and policies", "Extended to territorial programmes, EU dimension and evaluation"],
    ["–", "Annexes", "Methodology and observatory, case cities, interviews, data gaps, glossary"]], [3000, 3300, 3338]));

kids.push(H1("2. Overview and page budget"),
  P("The report is organised in three parts: the sector and its transitions (Chapters 2 to 4), the places where retail SMEs operate (Chapters 5 to 7) and the policies that support them (Chapter 8). Chapter 1 synthesises the whole. The page budget below gives a total of 99 pages."),
  table(["Part", "Chapter", "Pages"], [
    ["", "Foreword", "1"], ["", "Executive summary", "2"], ["", "1. Assessment and recommendations", "10"],
    ["I. The sector and its transitions", "2. Retail SME economic and entrepreneurial dynamics", "13"], ["", "3. Digitalisation of retail SMEs", "11"], ["", "4. The greening of retail SMEs", "11"],
    ["II. Places", "5. Peripheral retail zones", "11"], ["", "6. Town centres, small towns, rural areas and QPV", "12"], ["", "7. Cross-border regions", "11"],
    ["III. Policies", "8. Programmes and policies", "12"], ["", "Annexes A to E", "5"], ["", "**Total**", "**99**"]], [2900, 5638, 1100]),
  sp(), P("If the report must stay closer to 90 pages, the first options are to merge Box 2.3 and Section 2.6 into Section 2.4, shorten Chapter 4 to 9 pages and move the programme fiches of Section 8.3 to an annex.", { r: { color: GREY } }),
  H2("Research questions by chapter"),
  table(["Research question", "Main chapter", "Also in"], [
    ["Q1. Impact of peripheral retail zones on town-centre vitality", "5", "6, 1"], ["Q2. Impact of peripheral zones on priority neighbourhoods (QPV)", "6", "5"],
    ["Q3. Specific retail models in border regions", "7", "2"], ["Q4. Effect of tax and price gaps on shopping behaviour", "7", "8"],
    ["Q5. Which retailers are most advanced in the digital transition", "3", "2"], ["Q6. Which territories are most advanced in the green transition", "4", "5"],
    ["Q7. Which public policies seem most effective", "8", "5, 6, 7"], ["Q8. Reconciling competitiveness, urban revitalisation and environmental goals", "8", "1, 5"]], [5800, 1600, 2238]),
  H2("Synthesised structure"),
  ...B(["**Foreword**", "**Executive summary**: French context for retail SMEs; key insights by theme.",
    "**Chapter 1. Assessment and recommendations**", ["Introduction", "One section per chapter 2 to 8: issue, French evidence, what is being done, recommendations", "Box 1.1 Main policy recommendations by actor and horizon"],
    "**Chapter 2. Retail SME economic and entrepreneurial dynamics**", ["Context; structure by size; performance 2008-2024; entry, exit, scale-up and transmission; finance; internationalisation; territorial distribution; regulation"],
    "**Chapter 3. Digitalisation of retail SMEs**", ["Adoption and benchmark; micro-firms; platforms and fast fashion; uses for proximity retail; AI; cybersecurity and skills; territorial dimension"],
    "**Chapter 4. The greening of retail SMEs**", ["Priorities; emissions; energy and buildings; land use; waste, circular and social economy; practices and barriers; twin transition"],
    "**Chapter 5. Peripheral retail zones**", ["Scale; dynamics; erosion; regulation; transformation; effects on town centres (Q1)"],
    "**Chapter 6. Town centres, small towns, rural areas and QPV**", ["Diagnosis; changing mix; drivers of vacancy; local levers; national programmes; rural areas; QPV (Q2)"],
    "**Chapter 7. Cross-border regions**", ["Scale; leakage and inbound flows; tax and price gaps (Q4); retail models (Q3); governance; options"],
    "**Chapter 8. Programmes and policies**", ["Typology; legislation; programme fiches; governance; EU dimension; evaluation; international practices (Q7, Q8)"],
    "**Annexes**: A. Methodology and observatory; B. Case-study cities; C. Interviews; D. Data gaps; E. Glossary."]));

kids.push(H1("3. Common chapter template"),
  P("Each analytical chapter (2 to 8) keeps the template of the initial structure, with three additions marked in bold."),
  ...B(["Cover page: chapter scope and structure", "Introduction and key definitions", "Methodology: indicators and data; optional box with methodological specifications", "Box: key takeaways",
    "**Research questions addressed by the chapter**", "Analytical sections with data visualisations:", ["Latest-year snapshot", "Time series", "Benchmark (EU-27, OECD, selected peers: Germany, Belgium, Italy, Spain)", "Cross-sector comparison", "Disaggregation by firm size, subsector, region, city, rural-urban", "**Spatial analysis from the observatory (municipality, intermunicipality, department, peripheral zone, QPV, border area)**"],
    "Boxes: policy boxes and good practices", "**Case-study city boxes and evidence from interviews**", "Conclusions and recommendations", "References and endnotes"]),
  H2("Policy box format"),
  P("All policy boxes follow the format of the drafted boxes (Policy boxes v2), about half a page each:"),
  ...B(["**Context**: launch date, owner, budget, place in the wider policy framework.", "**Main objectives or methodology**: eligibility, instruments, amounts, delivery channels.", "**Implications for retail SMEs**: what the instrument changes for a small retailer.", "**Sources**: official links."]));

kids.push(H1("4. Front matter and Chapter 1"),
  H2("Foreword (1 page)"),
  ...B(["Policy challenge: how retail SMEs adapt to the green and digital transitions in France, across town centres, peripheral zones, rural areas and border regions.", "Purpose within the broader OECD retail project and support to the Retail Transition Pathway; partnership with the DGE and DG GROW.", "Scope, main sections, data and interviews; approval (CSMEE, April 2027)."]),
  H2("Executive summary (2 pages)"),
  ...B(["French context in one paragraph: a 'thin middle', micro-firms losing value, two thirds of sales in peripheral zones, rising town-centre vacancy, cross-border leakage in the north-east.", "Five to six key insights, one per theme, each with one figure.", "Three to five headline recommendations."]),
  H2("Chapter 1. Assessment and recommendations (10 pages)"),
  ...B(["Introduction: purpose and reading guide (0.5 page).", "Seven sections, one per chapter 2 to 8, about 1.2 pages each: general description of the issue; French evidence (trends, barriers); what is being done; concise recommendations.", "Box 1.1 Main policy recommendations: table by chapter, with responsible actor (State, local authorities, operators, EU) and horizon (short, medium term) (1 page)."]));

CH.forEach(c => {
  const [id, title, pages, purpose, qs, secs, figs, boxes, cases, inter, data, recs] = c;
  kids.push(H1(`Chapter ${id}. ${title} (${pages} pages)`), meta("Purpose.", purpose), H3("Key questions"), ...B(qs), H3("Sections"));
  secs.forEach(([t, p, items]) => { kids.push(new Paragraph({ spacing: { before: 100, after: 50 }, keepNext: true, children: [new TextRun({ text: t, bold: true }), new TextRun({ text: `  (${p} p.)`, color: GREY, size: 18 })] }), ...B(items)); });
  kids.push(H3("Planned figures and tables"), ...B(figs), H3("Boxes"),
    table(["Box", "Status"], boxes, [7400, 2238]), sp(),
    meta("Case-study cities.", cases), meta("Interviews.", inter), meta("Main data sources.", data), H3("Recommendation directions (to be confirmed)"), ...B(recs));
});

kids.push(H1("Annexes (5 pages)"),
  ...B(["**Annex A. Methodology and online observatory**: Sirene shop-stock reconstruction, geolocation and assignment to town centres, peripheral zones and QPV, composite indices, list of indicators with definitions and sources.",
    "**Annex B. Case-study cities**: one page per city (profile, key figures, policies, interview findings).", "**Annex C. Interviews**: list of organisations and dates (no personal contact details).",
    "**Annex D. Data gaps and statistical recommendations**: vacancy, rents, micro-firm digital use, energy of premises, cross-border flows, programme beneficiaries.", "**Annex E. Glossary and acronyms**."]));

kids.push(H1("5. Case-study cities"),
  P("The four cities cover the main territorial situations of the report: a large metropolis, a cross-border town, a coastal medium-sized town and a small rural town. Each provides a box in its main chapter and a profile in Annex B."),
  table(["City", "Why", "Main chapter", "Envisaged interlocutors"], [
    ["**Paris** (Île-de-France)|Large metropolis", "Most extensive local public action for independent retail in France; BDCom (Apur, City of Paris, CCI Paris Île-de-France) records every ground-floor commercial unit, address by address, every three years, allowing a quantitative analysis over time.", "6 (also 3)", "City of Paris (deputy mayor for commerce), SEM Paris Commerces, Apur, CCI Paris Île-de-France, Chamber of trades, merchant associations, national actors"],
    ["**Mulhouse** (Grand Est)|Cross-border town", "Lasting town-centre revival: since a retail manager was appointed in 2011, 600+ shops opened and vacancy fell from about 14% to under 9%; the former manager became mayor in 2026; part of the trinational Basel area.", "7 (also 6)", "City of Mulhouse, retail manager, Mulhouse Alsace Agglomération, CCI Alsace Eurométropole, Les Vitrines de Mulhouse"],
    ["**Sète** (Occitanie)|Coastal medium-sized town", "Among the lowest town-centre vacancy rates in France (3.7% in 2022); national land-sobriety pilot since 2020; tests how controlling peripheral development affects town-centre vitality, with tourist demand; Frontignan as a possible comparison.", "5 (also 6)", "City of Sète (commerce, Action Cœur de Ville), Sète Agglopôle Méditerranée, CCI Hérault, merchant associations"],
    ["**Bressuire** (Nouvelle-Aquitaine)|Small rural town", "Vacancy halved between 2019 and 2025 (17.9% to 8.6%) through housing renovation, planning rules, a town-centre manager and better collective organisation of merchants; easily transferable to small towns.", "6", "City of Bressuire, Agglo2B (Communauté d'agglomération du Bocage Bressuirais), town-centre manager, CCI Deux-Sèvres, merchant association"]],
    [1500, 3700, 1200, 3238]),
  sp(), P("Note: the preliminary list repeated the Sète interlocutors for Bressuire; the Bressuire line above proposes the corresponding local actors, to be confirmed.", { r: { color: GREY, size: 19 } }));

kids.push(H1("6. Interview programme by chapter"),
  table(["#", "Person(s) and organisation", "Contribution", "Chapters"], [
    ["1", "Marie Adeline-Peix and Vincent Criquebec, Bpifrance", "Green and AI financing for SMEs, regional deployment (Prêt Action Climat, Climate Plan 2026, Osez l'IA)", "3, 4, 8"],
    ["2", "Nicolas Bonnet, CCI France", "Network of 121 CCIs supporting the digital and green transition of retailers", "2, 3, 4"],
    ["3", "Aurélien Palix and Bénédicte Roullier, DGE", "France Num barometer 2026, Activateurs network, AI adoption by very small businesses", "3, 8"],
    ["4", "Guy Gras, Conseil du Commerce de France", "Overview of the sector, all sizes and formats", "2, 4, 8"],
    ["5", "Julien Aubignat, Procos", "Vacancy and rents by location; only source comparing centre and periphery", "5, 6"],
    ["6", "Frédéric Gibert, Banque des Territoires", "Retail plan, foncières, priority to commercial city entrances", "5, 6, 8"],
    ["7", "Diane Gallais and Suzie Chevée, ANCT", "Action Cœur de Ville 2 review, next wave, link with the transformation of commercial zones", "5, 6, 8"],
    ["8", "Pascal Madry, Institut pour la ville et le commerce", "Commercial overcapacity", "5, 6"],
    ["9", "Frédéric Marquet, City of Mulhouse", "Revival of Mulhouse town centre near Basel and Germany", "6, 7"],
    ["10", "Jean Peyrony, MOT", "Overview of all French borders", "7, 8"],
    ["11", "Danièle Schmitt, CCI Alsace Eurométropole", "Business Twins; cross-border shopping between Alsace and Baden-Württemberg", "7"]], [500, 3100, 4538, 1500]));

kids.push(H1("7. Points to harmonise before drafting"),
  P("The source documents give different figures for some indicators. One reference value, year and source should be fixed for each before drafting:"),
  table(["Indicator", "Values found", "Proposal"], [
    ["Action Cœur de Ville towns", "222 (phase 1), 234 (DGE presentation), 244 (phase 2, Macarez)", "244 for phase 2, 222 when describing 2018"],
    ["Priority neighbourhoods (QPV)", "1 609 (incl. overseas, 2024), 1 362 (mainland, observatory)", "State the coverage each time"],
    ["PNRR green pillar", "EUR 22.2 bn (policy box), EUR 20 bn (presentation)", "Use the European Commission figure"],
    ["Peripheral share of retail", "67% of sales, 72% of in-store spending, 75% (European comparison)", "Keep the three, with their definitions"],
    ["Town-centre vacancy", "14% in 2024 (DGE), 11.7% in 2025 (Procos panel)", "State the source and scope"],
    ["Average store size", "730 / 115 m² (Insee 2022), 586 / 92 m²", "Use Insee Première 2091"],
    ["Cross-border workers", "465 000 (2021), 505 700 (2023)", "Use 2023, mention 2021 by country"],
    ["Rural Recovery Programme ceilings", "Policy box (EUR 50 000 + 20 000, mobile EUR 20 000) vs DGE 2024 (EUR 80 000, mobile EUR 25 000)", "Check the current rules with the DGE"]], [2600, 4300, 2738]),
  sp(), P("Personal contact details found in the working notes (telephone numbers, e-mail addresses) should not appear in any document shared outside the team.", { r: { color: GREY } }));

kids.push(H1n("8. Timeline"),
  table(["Date", "Milestone"], [["Q2 2026", "Start of the study"], ["12 June 2026", "Strategic Foresight Workshop"], ["Q3-Q4 2026", "Interviews and city missions"],
    ["November 2026", "Validation of this structure with the DGE and DG GROW (proposal)"], ["Q1 2027", "Preliminary draft"], ["April 2027", "Discussion at the CSMEE"], ["June 2027", "Report launch"]], [2600, 7038]));

const doc = new Document({
  creator: "OECD CFE", title: "Proposed structure (revised) – Country case study France",
  styles: { default: { document: { run: { font: "Arial", size: 20, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, color: NAVY }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: NAVY }, paragraph: { outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 20, bold: true, color: GREY }, paragraph: { outlineLevel: 2 } }] },
  numbering: { config: [{ reference: "bul", levels: [0, 1, 2].map(l => ({ level: l, format: LevelFormat.BULLET, text: ["•", "–", "·"][l], alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360 + l * 360, hanging: 260 } } } })) }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Proposed structure (revised) – France country study  ·  ", size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] }) },
    children: kids }] });
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log("ok", OUT); });
