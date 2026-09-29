// 7-slide deck for DGE / DG GROW: state of play, sustainability, digitalisation, border areas, peripheral zones.
// Observed data, studies and policies only (no model estimates). Style follows the OECD CFE deck of the last DGE meeting.
// Run: NODE_PATH=$(npm root -g) node report_docx/build_deck_dge.js
const pptxgen = require("pptxgenjs");
const path = require("path");

const BLUE = "0070C0", NAVY = "003087", GREEN = "1D774A", GREENBG = "E8F5E9", LBG = "EBF4FB", INK = "404040",
  MUTED = "727272", WHITE = "FFFFFF", LIGHT = "8DB9E2", GREY = "B4BCC6", ORANGE = "D9822B";
const F = "Aptos";
const MAP_AR = 1236 / 1075;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "Commerce de détail en France : rappel, double transition et deux focus territoriaux";

// ---------- helpers ----------
function base(title) {
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.96, fill: { color: BLUE }, line: { color: BLUE } });
  s.addText(title, { x: 0.3, y: 0, w: 12.75, h: 0.96, fontFace: F, fontSize: 22, bold: true, color: WHITE, valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.27, w: 13.33, h: 0.23, fill: { color: BLUE }, line: { color: BLUE } });
  s.addText("© OECD | Centre for Entrepreneurship, SMEs, Regions and Cities", { x: 0.27, y: 7.26, w: 12.8, h: 0.24, fontFace: F, fontSize: 10, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
  return s;
}
const source = (s, t, y = 6.62) => s.addText(t, { x: 0.4, y, w: 12.55, h: 0.6, fontFace: F, fontSize: 9, italic: true, color: MUTED, valign: "bottom", margin: 0, isTextBox: true });
function card(s, x, y, w, h, big, label, opt = {}) {
  const fill = opt.fill || LBG, col = opt.color || NAVY;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill } });
  s.addText(big, { x: x + 0.12, y: y + 0.08, w: w - 0.24, h: 0.62, fontFace: F, fontSize: opt.bigSize || 28, bold: true, color: col, margin: 0, valign: "middle", isTextBox: true });
  s.addText(label, { x: x + 0.12, y: y + 0.72, w: w - 0.24, h: h - 0.8, fontFace: F, fontSize: 11, color: INK, margin: 0, valign: "top", isTextBox: true });
}
function bullets(s, items, x, y, w, h, fs = 12) {
  const runs = [];
  items.forEach((it, i) => {
    const last = i === items.length - 1;
    const parts = Array.isArray(it) ? it : [["", it]];
    parts.forEach(([b, t], j) => {
      const end = j === parts.length - 1;
      if (b) runs.push({ text: b, options: { bold: true, color: NAVY, bullet: j === 0 ? { indent: 14 } : undefined, breakLine: false } });
      runs.push({ text: t, options: { bullet: !b && j === 0 ? { indent: 14 } : undefined, breakLine: end && !last } });
    });
  });
  s.addText(runs, { x, y, w, h, fontFace: F, fontSize: fs, color: INK, valign: "top", margin: 0, paraSpaceAfter: 5, isTextBox: true });
}
const chartTitle = (s, t, x, y, w) => s.addText(t, { x, y, w, h: 0.4, fontFace: F, fontSize: 12, bold: true, color: INK, margin: 0, valign: "bottom", isTextBox: true });
const lineOpts = (colors) => ({
  chartColors: colors, lineSize: 2, lineDataSymbol: "none", showLegend: true, legendPos: "b", legendFontSize: 10, legendFontFace: F,
  catAxisLabelFontSize: 9, valAxisLabelFontSize: 9, catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontFace: F, valAxisLabelFontFace: F,
  valGridLine: { color: "E3E7EC", size: 0.5 }, catGridLine: { style: "none" }, catAxisLineColor: GREY,
});
const years = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

// ---------- 1. State of play ----------
let s = base("Rappel : un commerce dominé en nombre par les micro-entreprises, mais dont la valeur ajoutée se concentre dans les grandes");
chartTitle(s, "Valeur ajoutée réelle du commerce de détail par taille d'entreprise (indice 2008 = 100)", 0.4, 1.15, 7.6);
s.addChart(pres.charts.LINE, [
  { name: "Micro (0–9)", labels: years(2008, 2024), values: [100, 93.1, 99.1, 101.3, 96.8, 92.7, 87.7, 87.0, 89.0, 83.5, 81.4, 76.1, 76.1, 85.5, 80.7, 77.1, 75.6] },
  { name: "Petites (10–49)", labels: years(2008, 2024), values: [100, 90.4, 96.6, 92.7, 92.3, 92.7, 93.8, 94.9, 98.7, 94.5, 94.6, 98.9, 103.4, 125.9, 127.4, 116.4, 116.8] },
  { name: "Moyennes (50–249)", labels: years(2008, 2024), values: [100, 101.5, 106.2, 110.6, 109.6, 110.3, 112.9, 117.0, 114.3, 125.4, 125.0, 126.7, 130.7, 141.8, 140.6, 130.3, 129.2] },
  { name: "Grandes (250+)", labels: years(2008, 2024), values: [100, 106.4, 105.9, 105.2, 105.4, 107.8, 109.7, 105.7, 110.4, 142.7, 136.3, 147.6, 140.8, 153.6, 150.4, 135.4, 137.2] },
], { x: 0.3, y: 1.55, w: 7.8, h: 4.95, ...lineOpts([ORANGE, LIGHT, BLUE, NAVY]), valAxisMinVal: 60, valAxisMaxVal: 160, valAxisMajorUnit: 20 });
card(s, 8.4, 1.2, 2.2, 1.55, "95 %", "des détaillants sont des micro-entreprises (UE : 94 %)");
card(s, 10.75, 1.2, 2.2, 1.55, "58 %", "de la valeur ajoutée captée par les grandes entreprises (UE : 40 %)");
card(s, 8.4, 2.9, 2.2, 1.55, "+37 %", "valeur ajoutée réelle des grandes entreprises, 2008–2024");
card(s, 10.75, 2.9, 2.2, 1.55, "−24 %", "valeur ajoutée réelle des micro-entreprises, 2008–2024", { color: ORANGE });
bullets(s, [
  [["Productivité : ", "la valeur ajoutée par salarié des micro-détaillants recule de 23 % depuis 2008 ; les gains se concentrent dans les moyennes et grandes entreprises."]],
  [["Un milieu de gamme étroit : ", "les PME emploient 54 % des salariés du secteur (UE : 64 %) et produisent 42 % de sa valeur ajoutée (UE : 60 %)."]],
], 8.4, 4.65, 4.55, 1.9, 11.5);
source(s, "Note : NACE G47 ; valeur ajoutée en euros constants ; 2024 = estimations de prévision immédiate du CCR.\nSource : Commission européenne (2025), SME Performance Review 2025, données CCR/Eurostat (statistiques structurelles sur les entreprises).");
s.addNotes(`Rappel rapide, la DGE connaît ces chiffres. Trois messages : la France compte autant de micro-détaillants que l'UE (95 %), mais ses grandes entreprises captent 58 % de la valeur ajoutée contre 40 % dans l'UE. Depuis 2008, l'écart s'est creusé : +37 % de valeur ajoutée réelle pour les grandes, −24 % pour les micro. La productivité des micro recule de 23 %, ce qui suggère une baisse d'activité sans ajustement des effectifs.

Source : Commission européenne (2025), SME Performance Review 2025, https://single-market-economy.ec.europa.eu/smes/sme-strategy-and-sme-friendly-business-conditions/sme-performance-review_en`);

// ---------- 2. Sustainability ----------
s = base("Durabilité : des émissions du commerce de détail en forte baisse ; l'effort porte désormais sur le bâti commercial");
chartTitle(s, "Émissions de GES du commerce de détail (NACE G47), indice 2008 = 100", 0.4, 1.15, 7.6);
s.addChart(pres.charts.LINE, [
  { name: "France", labels: years(2008, 2024), values: [100, 107.7, 112.4, 104.3, 107.1, 106.9, 102.1, 99.6, 93.9, 90.6, 83.4, 75.4, 65.1, 60.4, 52.8, 45.8, 44.0] },
  { name: "UE-27", labels: years(2008, 2024), values: [100, 101.0, 104.4, 99.7, 97.0, 97.8, 92.5, 90.6, 88.1, 90.1, 86.1, 79.3, 69.7, 71.2, 67.2, 61.5, 60.8] },
], { x: 0.3, y: 1.55, w: 7.8, h: 4.95, ...lineOpts([GREEN, GREY]), valAxisMinVal: 40, valAxisMaxVal: 120, valAxisMajorUnit: 20 });
card(s, 8.4, 1.2, 2.2, 1.55, "−56 %", "émissions de GES du commerce de détail français, 2008–2024 (UE-27 : −39 %)", { fill: GREENBG, color: GREEN });
card(s, 10.75, 1.2, 2.2, 1.55, "1er", "rang de la France dans l'UE-27 pour la réduction sur la période", { fill: GREENBG, color: GREEN });
bullets(s, [
  [["Décret tertiaire : ", "les bâtiments tertiaires de plus de 1 000 m², dont les grandes surfaces, doivent réduire leur consommation d'énergie de 40 % en 2030, 50 % en 2040 et 60 % en 2050."]],
  [["Prêt Vert (Bpifrance, Banque des Territoires) : ", "5 000 à 50 000 € sur 2 à 10 ans, adossé à un prêt bancaire équivalent."]],
  [["Foncier : ", "le commerce a été le premier contributeur à l'artificialisation par le bâti économique entre 2008 et 2021, même si sa part diminue."]],
  [["Un écosystème orienté vert : ", "22 mesures uniquement « vertes » recensées, contre 5 uniquement numériques et 4 mixtes ; la plupart prennent la forme d'expertise plutôt que de financement."]],
], 8.4, 2.95, 4.55, 3.6, 11.5);
source(s, "Sources : OCDE (2026), Air Emissions Accounts (GES hors CO₂ de la biomasse, principe de résidence ; UE-27 estimée) ; décret n° 2019-771 du 23 juillet 2019 ; Bpifrance, Prêt Vert ; de l'Estoile et Salin (2024), Banque de France, document de travail n° 941 ; OCDE, inventaire des politiques (réunion DGE, 2026).");
s.addNotes(`La baisse des émissions du commerce de détail français (−56 %) est la plus forte de l'UE-27. Elle reflète en partie la décarbonation de l'électricité : en 2024, 95 % de l'électricité française provenait de sources renouvelables et nucléaires (ministères de l'Aménagement du territoire et de la Transition écologique, 2026), le remplacement des fluides frigorigènes imposé par la réglementation européenne et le durcissement des cadres depuis le Plan Climat de 2017.

L'enjeu suivant est le bâti : le décret tertiaire (décret n° 2019-771) impose des réductions de consommation aux bâtiments de plus de 1 000 m², ce qui concerne directement les grandes surfaces de périphérie (voir slide 7).

Sources : OCDE, Air Emissions Accounts, https://www.oecd.org/en/data/datasets/air-emissions-accounts.html ; Légifrance, décret n° 2019-771 ; Bpifrance, Prêt Vert ; de l'Estoile, E. et Salin, M. (2024), « Quantifier l'utilisation du foncier bâti par les secteurs économiques français pour évaluer leur vulnérabilité au Zéro Artificialisation Nette », Banque de France, document de travail n° 941, https://www.banque-france.fr/fr/publications-et-statistiques/publications/quantifier-lutilisation-du-foncier-bati-par-les-secteurs-economiques-francais-pour-evaluer-leur`);

// ---------- 3. Digitalisation ----------
s = base("Numérique : les détaillants de 10 salariés et plus ont rejoint la moyenne européenne ; les micro-entreprises échappent à la mesure");
chartTitle(s, "Détaillants disposant d'un site web permettant de passer commande (% des entreprises de 10 salariés et plus)", 0.4, 1.15, 7.8);
const wy = ["2009", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2025"];
s.addChart(pres.charts.LINE, [
  { name: "France", labels: wy, values: [16.7, 19.0, 20.7, 30.1, 30.9, 33.5, 34.1, 33.9, 38.1, 49.0, 43.7, 44.7, 41.5] },
  { name: "UE-27", labels: wy, values: [15.7, 19.9, 17.8, 24.7, 23.1, 25.5, 26.6, 28.8, 28.4, 31.6, 35.6, 38.6, 41.6] },
], { x: 0.3, y: 1.55, w: 7.8, h: 4.95, ...lineOpts([BLUE, GREY]), valAxisMinVal: 0, valAxisMaxVal: 60, valAxisMajorUnit: 10 });
card(s, 8.4, 1.2, 2.2, 1.55, "41,5 %", "des détaillants français vendent via leur site en 2025 (UE-27 : 41,6 %)");
card(s, 10.75, 1.2, 2.2, 1.55, "18,2 %", "des entreprises françaises utilisent l'IA en 2025 (UE-27 : 19,9 %), toutes activités");
bullets(s, [
  [["Angle mort : ", "ces indicateurs excluent les micro-entreprises, soit environ 95 % des détaillants, et les ventes via places de marché."]],
  [["France Num (DGE, 2018) : ", "plus de 70 partenaires, plus de 4 000 « Activateurs » (premier rendez-vous gratuit), Prêt Boost de 5 000 à 75 000 € sans garantie."]],
  [["PNRR : ", "21,6 % de l'enveloppe consacrée à la transition numérique ; les bénéfices pour le commerce de détail restent surtout indirects."]],
], 8.4, 2.95, 4.55, 3.6, 12.5);
source(s, "Note : séries hors ruptures ; la France progresse plus vite que l'UE pour l'IA (×3,8 contre ×3,3 depuis 2020).\nSources : OCDE (2026), base de données sur l'accès et l'utilisation des TIC par les entreprises (NACE G47 ; IA : toutes activités) ; DGE, France Num ; Gouvernement, PNRR (2021).");
s.addNotes(`Parmi les détaillants de 10 salariés et plus, la France a atteint la moyenne européenne : environ 41 % disposent d'un site de commande, contre moins de 20 % en 2009. Pour l'IA, la France (18,2 %) se rapproche de l'UE (19,9 %) ; en 2020 elle était à 80 % du niveau européen, en 2025 à 91 %.

Point d'attention : les enquêtes TIC excluent les entreprises de moins de 10 salariés, qui représentent 95 % des détaillants. La numérisation des micro-commerçants, cible première de France Num, n'est pas mesurée dans les statistiques européennes harmonisées.

Sources : OCDE, ICT Access and Usage by Businesses ; OECD Going Digital Toolkit, https://goingdigital.oecd.org ; DGE, France Num, https://www.francenum.gouv.fr`);

// ---------- 4. Border areas (1) ----------
s = base("Zones frontalières : les achats à l'étranger pèsent jusqu'à 14 % des dépenses en magasin des ménages frontaliers");
chartTitle(s, "Part des achats physiques par carte réalisés dans un pays voisin, par département, 2024 (%)", 0.4, 1.1, 7.8);
{ const W = 4.6 * MAP_AR; s.addImage({ path: path.join(__dirname, "fig_map_spending_abroad.png"), x: 0.4 + (7.7 - W) / 2, y: 1.5, w: W, h: 4.6, altText: "Carte de France par département : part des achats par carte réalisés dans un pays voisin en 2024, de moins de 3 % à l'intérieur jusqu'à 13,9 % en Moselle et 12 % dans les Pyrénées-Orientales" }); }
[["8B0F14", "9 % ou plus"], ["D7301F", "6 à moins de 9 %"], ["F39C8B", "3 à moins de 6 %"], ["FBE3DC", "Moins de 3 %"], ["C8C8C8", "Non disponible"]].forEach(([c, t], i) => {
  const x = 0.45 + i * 1.55;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 6.22, w: 0.22, h: 0.18, fill: { color: c }, line: { color: "B4BCC6", width: 0.5 } });
  s.addText(t, { x: x + 0.28, y: 6.18, w: 1.25, h: 0.26, fontFace: F, fontSize: 10, color: INK, margin: 0, valign: "middle", isTextBox: true });
});
card(s, 8.4, 1.2, 2.2, 1.7, "> 1 sur 2", "des ménages des départements frontaliers ont acheté en magasin à l'étranger en 2024", { bigSize: 24 });
card(s, 10.75, 1.2, 2.2, 1.7, "31 %", "de leurs dépenses à l'étranger vont au carburant et au tabac, contre 10 % en France (59 % au Luxembourg)");
bullets(s, [
  [["Frontaliers : ", "505 700 résidents travaillent à l'étranger en 2023 (+41 % depuis 2012), dont 71,5 % en Suisse et au Luxembourg ; près de ces deux pays, moins de 15 % des ménages, très réguliers, font environ la moitié des dépenses."]],
  [["Sensibilité aux taxes : ", "après la taxe carbone allemande de janvier 2021, la part du carburant acheté en Allemagne par les ménages de Moselle et d'Alsace passe de plus de 15 % à environ 8 %."]],
  [["Tabac : ", "ventes des buralistes −33 % entre 2017 et 2022 dans les départements frontaliers, contre −25 % ailleurs (−46 % en Moselle) ; au moins 9,5 % des ventes nationales sont des achats à l'étranger (fermeture de 2020)."]],
], 8.4, 3.1, 4.55, 3.45, 11);
source(s, "Note : paiements par carte en magasin des clients du Crédit Mutuel Alliance Fédérale (hors espèces et internet) ; moyenne des 21 départements frontaliers ≈ 7 %, moins de 3 % dans la plupart des autres.\nSources : Ast et Bichler (2025), Insee Première n° 2075 ; Insee, recensements de la population ; Insee Analyses n° 97 (2024) ; OFDT (2024) ; Hillion et Monchâtre (2024), Insee Analyses n° 94.");
s.addNotes(`Source principale : Insee Première n° 2075 (octobre 2025), fondé sur les paiements par carte anonymisés de 370 000 à 380 000 ménages clients du Crédit Mutuel Alliance Fédérale. Ce sont des données observées, pas des estimations de modèle.

En 2024, plus d'un ménage sur deux des départements frontaliers a fait au moins un achat en magasin dans un pays voisin (huit sur dix dans les Pyrénées-Orientales). Les achats à l'étranger représentent 13,9 % des dépenses par carte en magasin en Moselle et 12 % dans les Pyrénées-Orientales ; la moyenne des 21 départements frontaliers est d'environ 7 %, contre moins de 3 % dans la plupart des autres départements. L'Allemagne, la Belgique et l'Espagne reçoivent chacune environ un cinquième des dépenses, la Suisse 16 % et le Luxembourg 15 %.

Le panier acheté à l'étranger est très différent : carburant et tabac pèsent 31 % des dépenses à l'étranger contre 10 % en France, et 59 % au Luxembourg. Les flux réagissent vite aux taxes : la taxe carbone allemande de 2021 a divisé par deux la part du carburant acheté en Allemagne (Insee Analyses n° 97), et en 2024 les dépenses dans les bureaux de tabac italiens ont augmenté de 26 % (Insee Première n° 2075).

Limites : une seule banque, clientèle un peu plus aisée que la moyenne, pas de montants en euros, pas de mesure des achats des étrangers en France. Tourisme compris, la France reste bénéficiaire nette au niveau national : les non-résidents y dépensent l'équivalent de 4,4 % de la consommation des ménages, les résidents 3,5 % à l'étranger (Eurostat, 2023).

Références :
- Ast, D. et Bichler, G. (2025), « En 2024, les achats de l'autre côté de la frontière représentent jusqu'à 14 % des dépenses physiques des résidents frontaliers », Insee Première n° 2075, https://www.insee.fr/fr/statistiques/8647092
- Insee (2024), « Les résidents frontaliers ajustent fortement leurs achats de carburant en Allemagne à l'écart de prix avec la France », Insee Analyses n° 97, https://www.insee.fr/fr/statistiques/8236361
- OFDT (2024), Approvisionnement en tabac 2022, https://www.ofdt.fr/sites/ofdt/files/2024-05/approvisionnement_tabac_2022.pdf
- Hillion, M. et Monchâtre, V. (2024), Insee Analyses n° 94, https://www.insee.fr/fr/statistiques/7764897
- Insee, recensements de la population 2012 et 2023 (actifs travaillant à l'étranger).
- Eurostat (2025), nama_10_fcs.`);

// ---------- 5. Border areas (2) ----------
s = base("Zones frontalières : trois profils de frontière, un tissu aminci sur les produits taxés, des politiques qui ne visent pas le commerce");
const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE } } });
const lvl = (t) => ({ text: t, options: { bold: true, color: NAVY } });
const tbl = { fontFace: F, fontSize: 9.5, color: INK, valign: "middle", border: { type: "solid", pt: 0.5, color: "D5DCE4" }, margin: [3, 5, 3, 5] };
chartTitle(s, "Trois profils de frontière (achats des ménages frontaliers, 2024)", 0.4, 1.1, 5.9);
s.addTable([
  [H("Profil"), H("Ce que montrent les données")],
  [{ text: [{ text: "Bassins de travail frontalier", options: { bold: true, color: NAVY, breakLine: true } }, { text: "Suisse, Luxembourg, Monaco" }] }, "380 000 frontaliers ; achats intégrés aux trajets quotidiens ; carburant et tabac : 59 % des dépenses au Luxembourg"],
  [{ text: [{ text: "Achats de proximité réguliers", options: { bold: true, color: NAVY, breakLine: true } }, { text: "Allemagne, Belgique" }] }, "Agglomérations à cheval sur la frontière ; prix et assortiment (droguerie, équipement) ; carburant et tabac : 27 à 36 %"],
  [{ text: [{ text: "Achats saisonniers et fiscaux", options: { bold: true, color: NAVY, breakLine: true } }, { text: "Espagne, Italie, Andorre" }] }, "Jusqu'à 23 % des dépenses en juillet-août ; gros paniers de tabac (91 € par achat en Espagne) ; tabac en Italie +26 % en 2024"],
], { ...tbl, x: 0.4, y: 1.55, w: 5.9, colW: [2.1, 3.8], rowH: [0.35, 0.78, 0.78, 0.78] });
s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.45, w: 5.9, h: 2.05, fill: { color: LBG }, line: { color: LBG } });
s.addText("Traces dans le tissu commercial local", { x: 0.55, y: 4.52, w: 5.6, h: 0.3, fontFace: F, fontSize: 11.5, bold: true, color: NAVY, margin: 0, isTextBox: true });
bullets(s, [
  "À moins de 20 km de la frontière : 25 % de buralistes et 17 % de stations-service en moins par habitant (64 % et 57 % en moins face au Luxembourg).",
  "6,7 créations d'entreprises du commerce, des transports et de l'hébergement par commune frontalière en 2024, contre 9,2 ailleurs.",
  "La politique locale compte : à Thionville (Action Cœur de Ville), vacance commerciale −60 % en quatre ans.",
], 0.55, 4.85, 5.6, 1.6, 10.5);
chartTitle(s, "Politiques en place : une coopération dense, rarement tournée vers le commerce", 6.55, 1.1, 6.4);
s.addTable([
  [H("Niveau"), H("Instrument"), H("Place du commerce")],
  [lvl("UE"), "Interreg 2014–2020 (23 programmes, 3,02 Md€ de FEDER)", "Indirecte : environ 7 % pour la compétitivité des PME ; le commerce n'est pas une priorité nommée"],
  [lvl("UE"), "ESPON CROSSSHOP (déc. 2025–janv. 2027)", "Première étude européenne dédiée aux achats transfrontaliers, sur la frontière franco-allemande"],
  [lvl("UE"), "Règlement BRIDGEforEU (2025)", "Points de coordination pour lever les obstacles juridiques ; l'ANCT est le point national"],
  [lvl("UE"), "Révision de la directive tabac (proposition 2025)", "Minima d'accises relevés à partir de 2028 ; ni Andorre ni la Suisse"],
  [lvl("National"), "Protocole buralistes 2023–2027", "Prime de diversification portée à 2 500 € dans les départements frontaliers"],
  [lvl("National"), "Action Cœur de Ville, Petites villes de demain", { text: "Aucun critère frontalier ; volet commerce renforcé prévu après 2026", options: { bold: true, color: ORANGE } }],
  [lvl("Local"), "COMMERCE! (Interreg France-Wallonie-Vlaanderen), Business Twin (Rhin supérieur)", "Projets ciblés sur les commerçants ; l'Eurodistrict SaarMoselle s'oppose en 2025 à l'extension du FOC de Zweibrücken"],
], { ...tbl, x: 6.55, y: 1.55, w: 6.4, colW: [0.85, 2.35, 3.2], rowH: [0.33, 0.62, 0.62, 0.62, 0.58, 0.58, 0.58, 0.72] });
source(s, "Sources : Ast et Bichler (2025), Insee Première n° 2075 ; Insee, recensement 2022 ; calculs des auteurs d'après Insee, BPE 2025, et DGDDI (2018) ; Insee, SIDE 2024 ; ANCT (2025), bilan Interreg 2014–2020 ; Euro-Institut (2025) ; règlement (UE) 2025/925 ; COM(2025) 580 ; ministère de l'Économie (2023) ; CCI Alsace Eurométropole ; Eurodistrict SaarMoselle (2025).");
s.addNotes(`Les frontières françaises ne se ressemblent pas. Trois profils ressortent des données Insee : des bassins de travail frontalier (Suisse, Luxembourg, Monaco), où les achats font partie des trajets quotidiens ; des achats de proximité réguliers (Allemagne, Belgique), guidés par les prix et l'assortiment ; des achats saisonniers et fiscaux (Espagne, Italie, Andorre), concentrés sur le tabac. Cette typologie est une lecture DGE des données de l'Insee Première n° 2075 et du recensement.

Le tissu commercial frontalier n'est pas en déficit général (densité de commerces proche de la moyenne, emploi du commerce +9,5 % entre 2012 et 2024 comme au niveau national), mais il est aminci sur les produits taxés : buralistes et stations-service. Les créations d'entreprises du commerce, des transports et de l'hébergement sont 25 à 30 % moins nombreuses par commune frontalière. Thionville montre qu'une politique locale active peut inverser la tendance ; à l'inverse, la vacance reste élevée à Maubeuge (15,9 %), Cambrai (14,9 %) et Valenciennes (12,7 %).

La coopération transfrontalière est dense (plus de 40 structures, ANCT, MOT), mais le commerce n'y est presque jamais une compétence explicite. Deux nouveautés : l'étude ESPON CROSSSHOP, première étude européenne sur les achats transfrontaliers (résultats en 2027), et le règlement BRIDGEforEU, dont l'ANCT est le point de coordination national. Un volet commerce renforcé est prévu dans le renouvellement d'Action Cœur de Ville et de Petites villes de demain après 2026 (mission Papin sur le commerce de proximité).

Références :
- Ast, D. et Bichler, G. (2025), Insee Première n° 2075, https://www.insee.fr/fr/statistiques/8647092
- Insee, Base permanente des équipements 2025 ; DGDDI (2018), annuaire des buralistes (calculs des auteurs).
- Insee, SIDE / Sirene 2024 (créations d'entreprises), note interne DGE.
- ANCT (2025), Bilan Interreg 2014–2020 en France, https://media.anct.gouv.fr/ressources/2025-12/bilan-interreg-2024-2020-en-france.pdf
- Euro-Institut (2025), étude CROSSSHOP, https://www.euroinstitut.org/fr/actualites-1-1/artikel/etude-crossshop-sur-les-flux-de-commerce-transfrontalier
- Règlement (UE) 2025/925 (BRIDGEforEU) ; MOT, https://www.espaces-transfrontaliers.org/niveaux/europe-bridgeforeu/
- Commission européenne (2025), COM(2025) 580 ; ministère de l'Économie (2023), protocole buralistes 2023–2027.
- Interreg France-Wallonie-Vlaanderen, projet COMMERCE!, https://www.bge-hautsdefrance.fr/interreg-commerce/ ; CCI Alsace Eurométropole, Business Twin, https://www.alsace-eurometropole.cci.fr/business-twin-jumelages-dentreprises
- Eurodistrict SaarMoselle (2025), résolution contre l'extension du FOC de Zweibrücken, https://www.saarmoselle.org/fr/actualites/resolution-de-l-eurodistrict-saarmoselle-contre-l-extension-du-foc-zweibrucken_-n.html`);

// ---------- 6. Peripheral zones (1) ----------
s = base("Zones commerciales périphériques : deux tiers des ventes et une dynamique d'emploi supérieure à celle des centres-villes");
chartTitle(s, "Répartition des ventes du commerce de détail par lieu de vente, 2024 (%)", 0.4, 1.15, 5.9);
s.addChart(pres.charts.DOUGHNUT, [{ name: "2024", labels: ["Périphérie", "Centre-ville", "Proximité", "Internet"], values: [67, 11, 11, 11] }], {
  x: 0.3, y: 1.55, w: 5.9, h: 4.6, holeSize: 55, chartColors: [NAVY, BLUE, LIGHT, GREY], showPercent: false, showValue: true, showLabel: false,
  dataLabelColor: WHITE, dataLabelFontSize: 13, dataLabelFontBold: true, showLegend: true, legendPos: "r", legendFontSize: 12, legendFontFace: F,
});
card(s, 6.55, 1.2, 2.0, 1.75, "1 500", "zones commerciales périphériques, 500 M m² au total");
card(s, 8.7, 1.2, 2.0, 1.75, "72 %", "des dépenses en magasin (centres-villes : 15 %)");
card(s, 10.85, 1.2, 2.1, 1.75, "8,4 %", "de vacance en périphérie en 2025 (6,9 % en 2022)", { color: ORANGE });
bullets(s, [
  [["Emploi : ", "entre 2016 et 2022, l'emploi salarié des points de vente progresse de 1,6 % par an dans les pôles périphériques, contre 1,1 % dans les pôles de centre-ville ; la périphérie porte 40 % des créations d'emplois, les centres-villes 28 %."]],
  [["Formats : ", "un point de vente compte en moyenne 12 salariés et 586 m² en périphérie, contre 3 salariés et 92 m² en centre-ville."]],
  [["Vacance : ", "la périphérie reste la mieux placée (8,4 %) face aux centres-villes (11,7 %) et aux centres commerciaux (16,8 %), mais l'écart se réduit."]],
  [["Préférence déclarée : ", "62 % des Français disent privilégier les zones commerciales pour leurs achats, loisirs et services ; les centres-villes progressent entre 2023 et 2025."]],
], 6.55, 3.15, 6.4, 3.3, 12);
source(s, "Note : 67 % de l'ensemble des ventes, internet compris ; 72 % des seules dépenses en magasin (autre source, autre périmètre).\nSources : Rexecode, d'après Insee, Procos et Fevad (2024) ; Cerema (2023), géolocalisation des zones commerciales ; Gouvernement (2023), dossier de presse « Un nouvel horizon pour les zones commerciales » ; Bloch et Pichavant (2026), Insee Première n° 2091 ; Codata (2026) ; CNC (2026), d'après Ifop pour l'ANCT et la Banque des Territoires.");
s.addNotes(`La France est l'un des marchés européens les plus polarisés sur la périphérie. Deux chiffres coexistent et ne se contredisent pas : 67 % de l'ensemble des ventes du commerce de détail, internet compris (Rexecode, 2024), et 72 % des dépenses réalisées en magasin (dossier de presse du Gouvernement, septembre 2023). Hors internet, les 67 % de Rexecode correspondent à environ trois quarts des ventes en magasin.

L'Insee (Insee Première n° 2091, janvier 2026) confirme la dynamique : entre 2016 et 2022, l'emploi salarié des points de vente croît de 1,6 % par an en périphérie contre 1,1 % en centre-ville. Les formats sont sans commune mesure (586 m² contre 92 m² en moyenne).

La vacance reste la plus faible en périphérie, mais elle progresse : 6,9 % en 2022, 8,4 % en 2025 (Codata).

Références :
- Rexecode (2024), répartition des ventes du commerce de détail par lieu de vente, d'après Insee, Procos et Fevad.
- Cerema (2023), Les données de géolocalisation des 1 500 zones commerciales de périphérie en open data, https://www.cerema.fr/fr/actualites/donnees-geolocalisation-1500-zones-commerciales-peripherie
- Gouvernement (2023), Un nouvel horizon pour les zones commerciales, dossier de presse, septembre 2023, https://www.info.gouv.fr/upload/media/content/0001/07/2dc90efc2c1a0e97572bf027240fac63e4dc9d75.pdf
- Bloch, K. et Pichavant, A.-S. (2026), « Entre 2016 et 2022, l'emploi salarié des points de vente progresse davantage en dehors des centres-villes », Insee Première n° 2091, https://www.insee.fr/fr/statistiques/8730497
- Codata (2026), Digest 2026 ; relayé par L'Échommerces, https://lechommerces.fr/la-vacance-commerciale-progresse-de-nouveau-en-france/
- Conseil national du commerce (2026), La vacance commerciale en centre-ville, juin 2026, p. 71 (sondage Ifop pour l'ANCT et la Banque des Territoires), https://www.entreprises.gouv.fr/files/files/Entites/CNC/cnc_rapport_gt_vacance_commerciale.pdf`);

// ---------- 7. Peripheral zones (2) ----------
s = base("Zones périphériques : la régulation est passée de la protection du petit commerce à la sobriété foncière ; la transformation démarre");
const tl = [["1973", "Loi Royer", "CDUC ; seuils de 1 000 à 1 500 m²"], ["1996", "Loi Raffarin", "Seuil abaissé à 300 m²"], ["2008", "LME", "Seuil à 1 000 m² ; critères d'aménagement"],
  ["2014", "ALUR / Pinel", "DAAC dans les SCoT"], ["2018", "ELAN", "ORT, exemption d'autorisation"], ["2021", "Climat et résilience", "Objectif ZAN"], ["2023", "Plan zones commerciales", "Lancé le 11 septembre"]];
const x0 = 1.15, x1 = 12.15, ly = 1.75, st = (x1 - x0) / (tl.length - 1);
s.addShape(pres.shapes.LINE, { x: x0, y: ly, w: x1 - x0, h: 0, line: { color: GREY, width: 2 } });
tl.forEach(([y, n, d], i) => {
  const x = x0 + i * st, c = i < 3 ? LIGHT : (i < 5 ? BLUE : GREEN);
  s.addShape(pres.shapes.OVAL, { x: x - 0.1, y: ly - 0.1, w: 0.2, h: 0.2, fill: { color: c }, line: { color: WHITE, width: 1.5 } });
  s.addText(y, { x: x - 0.8, y: ly - 0.45, w: 1.6, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: NAVY, align: "center", margin: 0, isTextBox: true });
  s.addText([{ text: n, options: { bold: true, breakLine: true } }, { text: d, options: { color: MUTED } }], { x: x - 0.85, y: ly + 0.17, w: 1.7, h: 0.72, fontFace: F, fontSize: 9.5, color: INK, align: "center", valign: "top", margin: 0, isTextBox: true });
});
s.addText("Protéger le petit commerce  →  encadrer la localisation  →  protéger les sols", { x: 0.4, y: 2.72, w: 12.55, h: 0.3, fontFace: F, fontSize: 11, italic: true, color: GREEN, align: "center", margin: 0, isTextBox: true });

const top = 3.2;
card(s, 0.4, top, 2.35, 1.6, "−67 %", "de surfaces autorisées en CDAC entre 2019 (1,3 M m²) et 2024 (0,47 M m²)");
card(s, 0.4, top + 1.75, 2.35, 1.6, "−40 %", "de consommation d'énergie exigée en 2030 pour les bâtiments de plus de 1 000 m²", { fill: GREENBG, color: GREEN });
// plan card
s.addShape(pres.shapes.RECTANGLE, { x: 2.95, y: top, w: 4.9, h: 3.35, fill: { color: NAVY }, line: { color: NAVY } });
s.addText("Plan de transformation des zones commerciales", { x: 3.15, y: top + 0.12, w: 4.5, h: 0.6, fontFace: F, fontSize: 13, bold: true, color: WHITE, valign: "top", margin: 0, isTextBox: true });
s.addText([
  { text: "90 projets, 31,4 M€", options: { fontSize: 24, bold: true, color: WHITE, breakLine: true } },
  { text: "74 lauréats en mars 2024 (26 M€, dont 20,3 M€ de travaux) et 16 en mai 2024 (5,4 M€), de la ville de 5 000 habitants à la métropole de 800 000.", options: { breakLine: true } },
  { text: " ", options: { fontSize: 5, breakLine: true } },
  { text: "Potentiel annoncé : 25 000 logements pour les 74 premiers projets. Pilotage DGE, ANCT, DGALN ; fonds de transformation environnementale de l'ANCT en complément.", options: { color: LIGHT } },
], { x: 3.15, y: top + 0.8, w: 4.5, h: 2.5, fontFace: F, fontSize: 12, color: WHITE, valign: "top", margin: 0, isTextBox: true });
// case card
s.addShape(pres.shapes.RECTANGLE, { x: 8.05, y: top, w: 4.9, h: 3.35, fill: { color: LBG }, line: { color: LBG } });
s.addText("Exemple : Montigny-lès-Cormeilles (Val-d'Oise)", { x: 8.25, y: top + 0.12, w: 4.5, h: 0.6, fontFace: F, fontSize: 13, bold: true, color: NAVY, valign: "top", margin: 0, isTextBox: true });
bullets(s, [
  "Un linéaire commercial de 1,5 km et 250 000 m² de surfaces de vente le long de la RD14 (13 ha), transformé en nouveau centre-ville.",
  "Programme : 900 logements à l'horizon 2030, 24 000 m² de commerces en rez-de-chaussée, un bois de 3 ha ouvert au public, un groupe scolaire.",
  "Démarche lancée en 2010 ; portage foncier par l'EPF d'Île-de-France (2018) et la foncière « Repenser la ville » (Banque des Territoires, Frey, CDC Habitat).",
], 8.25, top + 0.8, 4.55, 2.5, 11.5);
source(s, "Sources : Procos, cité par LSA (2025) et Banque des Territoires ; décret n° 2019-771 du 23 juillet 2019 ; loi n° 2021-1104 du 22 août 2021 ; ministère de l'Économie (2024), communiqués des 29 mars et 24 mai 2024 ; Cerema, Urbanisme commercial, fiche n° 3 « Transformer les périphéries commerciales » ; lois n° 73-1193, 96-603, 2008-776, 2014-366, 2014-626, 2018-1021.");
s.addNotes(`Cinquante ans de droit de l'urbanisme commercial sont passés d'une logique de protection des petits commerçants (lois Royer et Raffarin) à une logique de protection des sols (objectif ZAN, loi Climat et résilience de 2021). Les autorisations en CDAC ont chuté de 67 % entre 2019 et 2024 (Procos). L'extension n'est plus la voie principale ; la transformation de l'existant devient l'enjeu, avec en plus l'obligation de rénovation énergétique du décret tertiaire pour les grandes surfaces.

Le plan de transformation des zones commerciales, lancé le 11 septembre 2023, soutient 90 projets pour 31,4 M€. C'est significatif pour chaque projet, mais modeste au regard des 1 500 zones. Montigny-lès-Cormeilles illustre ce qu'une transformation complète demande : du temps (démarche engagée en 2010), du portage foncier et un projet urbain.

Point de comparaison européenne (à mentionner à l'oral) : l'Allemagne, la Flandre, la Wallonie, le Luxembourg et l'Autriche ont fixé des objectifs quantitatifs de réduction de l'artificialisation, mais non contraignants ; la France est la seule à avoir inscrit le sien dans une loi contraignante (loi Climat et résilience) (Town Planning Review, 2024, https://doi.org/10.3828/tpr.2024.44). La loi du 20 juillet 2023 a ensuite assoupli la gouvernance du ZAN (garantie rurale d'un hectare).

Références :
- LSA (2025), « La fédération Procos pointe un reflux historique des autorisations de surface commerciales », https://www.lsa-conso.fr/la-federation-procos-pointe-un-reflux-historique-des-autorisations-de-surface-commerciales,137327
- Ministère de l'Économie (2024), Plan de transformation des zones commerciales, https://presse.economie.gouv.fr/plan-de-transformation-des-zones-commerciales/ ; DGE (2024), Annonce des 74 lauréats, https://www.entreprises.gouv.fr/la-direction-generale-des-entreprises/actualites/annonce-74-laureats-plan-transformation-zones-commerciales
- ANCT, Fonds de transformation environnementale des zones commerciales périurbaines, https://anct.gouv.fr/programmes-dispositifs/reconquete-commerciale/le-fonds-de-transformation-environnementale-des-zones
- Cerema, Urbanisme commercial, fiche n° 3, Transformer les périphéries commerciales : des facteurs clés du succès.
- Légifrance : décret n° 2019-771 (décret tertiaire) ; loi n° 2021-1104 (Climat et résilience).`);

pres.writeFile({ fileName: path.join(__dirname, "Commerce_detail_France_DGE_DGGROW_7slides.pptx") }).then((f) => console.log(f));
