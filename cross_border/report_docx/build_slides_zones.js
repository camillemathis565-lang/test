// 3-slide briefing on peripheral commercial zones (FR + EN). Run: NODE_PATH=$(npm root -g) node report_docx/build_slides_zones.js
const pptxgen = require("pptxgenjs");
const path = require("path");

const NAVY = "1B2A4A", INK = "22303F", MUTED = "5F6B7A", SOFT = "EEF2F7", BLUE = "2E6DB4",
  LIGHTBLUE = "A9CBE8", RED = "C0504D", WHITE = "FFFFFF", GREY = "B8C2CC";
const HF = "Cambria", BF = "Calibri";

const T = {
  fr: {
    file: "Zones_commerciales_note_DGE_DGGROW_FR.pptx", title: "Zones commerciales périphériques",
    s1k: "1 · Poids de la périphérie",
    s1t: "La France a fait de la périphérie le cœur de son commerce",
    s1a: ["67 %", "des ventes du commerce de détail réalisées en périphérie (2024)"],
    s1b: ["1 500+", "zones commerciales périphériques, soit 500 M m² : 5 fois le bâti de Paris intra-muros"],
    s1body: [
      ["Un modèle européen à part.", "Avec la Belgique et la région de Madrid, la France a privilégié la liberté d'implantation. L'Allemagne, l'Italie, la Catalogne, l'Angleterre et les Pays-Bas ont choisi une planification contraignante : le commerce allemand se répartit à parts à peu près égales entre périphérie, centres-villes et proximité."],
      ["La périphérie crée les emplois.", "Entre 2016 et 2022, l'emploi salarié du commerce progresse de 8 % en périphérie contre 1,2 % en centre-ville. Les établissements augmentent de 9 % en périphérie et reculent de 6 % en centre-ville."],
      ["Des formats sans commune mesure.", "Un magasin moyen occupe 730 m² en périphérie contre 115 m² en centre-ville."],
    ],
    c1title: "Répartition des ventes du commerce de détail en France, 2024 (%)",
    c1labels: ["Périphérie", "Centres-villes", "Proximité", "En ligne"],
    s1src: "Sources : note de travail DGE, d'après Cerema et ANCT (zones et surfaces), Procos (répartition des ventes), Insee (emploi, établissements, surfaces de vente).",
    s1notes: "Message : la France est l'un des pays européens où le commerce est le plus polarisé en périphérie, par choix historique de liberté d'implantation. La périphérie concentre les deux tiers des ventes et l'essentiel de la croissance de l'emploi et des surfaces. C'est un modèle qui se distingue nettement de l'Allemagne ou des Pays-Bas, où la planification encadre la localisation du commerce.",
    s2k: "2 · Un modèle qui s'érode",
    s2t: "La périphérie gagne encore en volume, mais le modèle s'essouffle et la régulation a changé de cap",
    s2a: ["×2", "la vacance en périphérie depuis 2007 (de moins de 4 % à plus de 8 %), en hausse plus rapide qu'en centre-ville"],
    s2b: ["−67 %", "de surfaces commerciales autorisées entre 2019 et 2024 (1,31 à 0,47 M m²)"],
    s2body: [
      ["Encore en tête.", "En mars 2026, la fréquentation progresse de 1,6 % sur un an en périphérie contre −0,1 % en centre-ville, et 62 % des Français déclarent préférer les zones périphériques."],
      ["Un parc vieillissant.", "Des bâtiments des années 1960 à 1990, souvent de véritables « passoires thermiques », devront réduire leur consommation d'énergie de 40 % d'ici 2030 (décret tertiaire)."],
      ["De la protection des concurrents à la protection des sols.", "Après Royer (1973) et Raffarin (1996), la loi Climat et résilience (2021) fixe l'objectif ZAN. La France est le seul pays européen à l'avoir inscrit dans une loi contraignante ; l'Allemagne et la Flandre s'en tiennent à des cibles indicatives."],
    ],
    c2title: "Taux de vacance commerciale, 2025 (%)",
    c2labels: ["Centres commerciaux", "Centres-villes", "Zones périphériques"],
    s2src: "Sources : note de travail DGE, d'après Procos/Kyris (autorisations), enquête Ifop pour l'ANCT et la Banque des Territoires, décret tertiaire, comparaisons européennes (mémoire EMSFI).",
    s2notes: "La périphérie reste le format qui fonctionne le mieux, en fréquentation comme en vacance. Mais sa vacance a doublé depuis 2007 et progresse désormais plus vite qu'en centre-ville : suroffre, dépendance à la voiture et bâti vieillissant. La régulation a basculé : l'objectif ZAN a fait chuter les autorisations de deux tiers. L'extension n'est plus une stratégie ; seule la transformation de l'existant reste possible.",
    s3k: "3 · Transformer l'existant",
    s3t: "Les outils existent, mais les moyens restent sans commune mesure avec l'enjeu",
    tl: [["1973", "Loi Royer"], ["1996", "Loi Raffarin"], ["2008", "LME"], ["2014", "ALUR / Pinel : DAAC"], ["2018", "ELAN : ORT"], ["2021", "Climat & résilience : ZAN"], ["2023", "Plan zones commerciales"], ["2026", "Loi de simplification"]],
    tlA: "Protéger le petit commerce", tlB: "Protéger les sols",
    s3a: ["31,4 M€", "pour 90 projets lauréats du plan de transformation (2024), face à plus de 1 500 zones"],
    caseH: "Montigny-lès-Cormeilles (Val-d'Oise)",
    caseB: "1,5 km de linéaire commercial et 250 000 m² de surfaces de vente transformés en centre-ville : 900 logements, 24 000 m² de commerces, un parc de 3 ha. Portage foncier par l'EPF Île-de-France et la foncière de la Banque des Territoires.",
    pisH: "Pistes de discussion",
    pis: [["DGE", "Changer d'échelle : financer la transformation à la mesure des 1 500 zones"],
      ["DGE", "Accompagner la rénovation énergétique du parc imposée par le décret tertiaire"],
      ["DG GROW", "Partager les approches européennes de planification commerciale et de sobriété foncière"],
      ["DG GROW", "Ouvrir les fonds européens (FEDER) à la reconversion des friches commerciales"]],
    s3src: "Sources : note de travail DGE ; Cerema, fiche n° 3 « Transformer les périphéries commerciales » ; ANCT ; Banque des Territoires.",
    s3notes: "Cinquante ans de droit de l'urbanisme commercial sont passés d'une logique de protection des concurrents à une logique de protection des sols. Les outils juridiques sont en place (SCoT/DAAC, ORT, grande opération d'urbanisme), mais la transformation avance projet par projet et dépend de la volonté politique locale. Les 31,4 M€ du plan comptent au niveau de chaque projet, mais restent marginaux face à plus de 1 500 zones. Montigny-lès-Cormeilles montre ce qu'une transformation complète demande : du temps (depuis 2010), du portage foncier et un projet urbain. Les pistes proposées sont des points de discussion, pas des recommandations arrêtées.",
  },
  en: {
    file: "Peripheral_retail_zones_briefing_DGE_DGGROW.pptx", title: "Peripheral retail zones in France",
    s1k: "1 · The weight of the periphery",
    s1t: "France has made the urban edge the core of its retail system",
    s1a: ["67%", "of retail sales made in peripheral zones (2024)"],
    s1b: ["1,500+", "peripheral commercial zones covering 500 million m², five times the built area of Paris"],
    s1body: [
      ["A distinct European model.", "Like Belgium and the Madrid region, France favoured freedom of location. Germany, Italy, Catalonia, England and the Netherlands chose binding planning: German retail is split roughly evenly between the periphery, city centres and neighbourhoods."],
      ["The periphery creates the jobs.", "Between 2016 and 2022, retail employment grew by 8% in peripheral zones against 1.2% in city centres. The number of establishments rose by 9% in the periphery and fell by 6% in city centres."],
      ["Very different formats.", "An average store occupies 730 m² in the periphery against 115 m² in city centres."],
    ],
    c1title: "Retail sales in France by location, 2024 (%)",
    c1labels: ["Periphery", "City centres", "Neighbourhood", "Online"],
    s1src: "Sources: DGE working note, based on Cerema and ANCT (zones and land), Procos (sales split), Insee (employment, establishments, floor space).",
    s1notes: "Main message: France is one of Europe's most polarised retail landscapes, the result of a historical choice for freedom of location. Peripheral zones account for two-thirds of sales and most of the growth in jobs and floor space. The contrast with Germany or the Netherlands, where planning governs retail location, is stark.",
    s2k: "2 · A model under strain",
    s2t: "The periphery still wins on volume, but the model is eroding and regulation has changed course",
    s2a: ["×2", "peripheral vacancy since 2007 (from under 4% to over 8%), now rising faster than in city centres"],
    s2b: ["−67%", "new retail floor space authorised between 2019 and 2024 (1.31 to 0.47 million m²)"],
    s2body: [
      ["Still ahead.", "In March 2026, footfall grew by 1.6% year-on-year in peripheral zones against −0.1% in city centres, and 62% of French people say they prefer peripheral zones."],
      ["An ageing stock.", "Buildings from the 1960s–1990s, often poorly insulated, must cut energy use by 40% by 2030 under the tertiary-sector decree."],
      ["From protecting competitors to protecting land.", "After the Royer (1973) and Raffarin (1996) laws, the 2021 Climate and Resilience Act set a no-net-land-take (ZAN) objective. France is the only European country to make it legally binding; Germany and Flanders rely on non-binding targets."],
    ],
    c2title: "Retail vacancy rate by location, 2025 (%)",
    c2labels: ["Shopping centres", "City centres", "Peripheral zones"],
    s2src: "Sources: DGE working note, based on Procos/Kyris (authorisations), Ifop survey for ANCT and Banque des Territoires, tertiary-sector decree, European comparisons (EMSFI dissertation).",
    s2notes: "Peripheral zones remain the best-performing format on footfall and vacancy. But their vacancy has doubled since 2007 and is now rising faster than in city centres: oversupply, car dependence and ageing buildings. Regulation has shifted: the ZAN objective cut authorisations by two-thirds. Expansion is no longer a strategy; only transformation of the existing stock remains.",
    s3k: "3 · Transforming the existing stock",
    s3t: "The tools exist, but funding is far below the scale of the challenge",
    tl: [["1973", "Royer law"], ["1996", "Raffarin law"], ["2008", "LME"], ["2014", "ALUR / Pinel: DAAC"], ["2018", "ELAN: ORT"], ["2021", "Climate Act: ZAN"], ["2023", "Zone transformation plan"], ["2026", "Simplification law"]],
    tlA: "Protecting small retailers", tlB: "Protecting land",
    s3a: ["€31.4 m", "for 90 winning projects of the transformation plan (2024), against more than 1,500 zones"],
    caseH: "Montigny-lès-Cormeilles (Val-d'Oise)",
    caseB: "A 1.5 km retail strip with 250,000 m² of floor space turned into a new town centre: 900 homes, 24,000 m² of shops and a 3-hectare park. Land assembly by the Île-de-France land agency and the Banque des Territoires property fund.",
    pisH: "Points for discussion",
    pis: [["DGE", "Scale up: fund transformation in line with the 1,500 zones"],
      ["DGE", "Support the energy retrofit of the stock required by the tertiary-sector decree"],
      ["DG GROW", "Share European approaches to retail planning and land sobriety"],
      ["DG GROW", "Open EU funds (ERDF) to the conversion of retail brownfields"]],
    s3src: "Sources: DGE working note; Cerema, sheet no. 3 \"Transformer les périphéries commerciales\"; ANCT; Banque des Territoires.",
    s3notes: "Fifty years of retail planning law moved from protecting competitors to protecting land. The legal tools are in place (SCoT/DAAC, ORT, large-scale urban operations), but transformation proceeds project by project and depends on local political will. The €31.4m of the plan matters for each project but is marginal against more than 1,500 zones. Montigny-lès-Cormeilles shows what a full transformation takes: time (since 2010), land assembly and an urban project. The points listed are for discussion, not settled recommendations.",
  },
};

function build(L) {
  const t = T[L];
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; pres.title = t.title;
  const title = (s, k, x) => {
    s.addText(k.toUpperCase(), { x: 0.6, y: 0.35, w: 12, h: 0.3, fontFace: BF, fontSize: 11, bold: true, color: BLUE, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText(x, { x: 0.6, y: 0.68, w: 12.1, h: 0.95, fontFace: HF, fontSize: 28, bold: true, color: NAVY, margin: 0, valign: "top", isTextBox: true });
  };
  const source = (s, x) => s.addText(x, { x: 0.6, y: 7.02, w: 12.1, h: 0.35, fontFace: BF, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
  const stat = (s, x, y, w, [big, label], color = NAVY) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 1.55, fill: { color: SOFT }, line: { color: SOFT } });
    s.addText(big, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.62, fontFace: HF, fontSize: 30, bold: true, color, margin: 0, isTextBox: true });
    s.addText(label, { x: x + 0.2, y: y + 0.74, w: w - 0.4, h: 0.72, fontFace: BF, fontSize: 11, color: INK, margin: 0, valign: "top", isTextBox: true });
  };
  const body = (s, items, y = 3.62, h = 3.2) => {
    const runs = [];
    items.forEach(([b, d], i) => {
      runs.push({ text: b, options: { bold: true, breakLine: true } });
      runs.push({ text: d, options: { breakLine: i < items.length - 1 } });
      if (i < items.length - 1) runs.push({ text: " ", options: { fontSize: 6, breakLine: true } });
    });
    s.addText(runs, { x: 0.6, y, w: 5.85, h, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 2 });
  };
  const chartTitle = (s, x) => s.addText(x, { x: 6.9, y: 1.85, w: 5.8, h: 0.4, fontFace: BF, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });

  // Slide 1
  let s = pres.addSlide(); s.background = { color: WHITE };
  title(s, t.s1k, t.s1t);
  stat(s, 0.6, 1.85, 2.85, t.s1a); stat(s, 3.6, 1.85, 2.85, t.s1b, BLUE);
  body(s, t.s1body);
  chartTitle(s, t.c1title);
  s.addChart(pres.charts.BAR, [{ name: "%", labels: t.c1labels, values: [67, 11, 11, 11] }], {
    x: 6.8, y: 2.35, w: 5.95, h: 4.4, barDir: "col", chartColors: [NAVY, LIGHTBLUE, LIGHTBLUE, GREY], varyColors: true,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 14, dataLabelColor: INK, dataLabelFontBold: true,
    catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: BF, valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 45, valAxisMaxVal: 80, valAxisMinVal: 0,
  });
  source(s, t.s1src); s.addNotes(t.s1notes);

  // Slide 2
  s = pres.addSlide(); s.background = { color: WHITE };
  title(s, t.s2k, t.s2t);
  stat(s, 0.6, 1.85, 2.85, t.s2a, RED); stat(s, 3.6, 1.85, 2.85, t.s2b, NAVY);
  body(s, t.s2body);
  chartTitle(s, t.c2title);
  s.addChart(pres.charts.BAR, [{ name: "%", labels: t.c2labels, values: [16.8, 11.7, 8.4] }], {
    x: 6.8, y: 2.35, w: 5.95, h: 4.4, barDir: "col", chartColors: [GREY, LIGHTBLUE, NAVY], varyColors: true,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 14, dataLabelColor: INK, dataLabelFontBold: true,
    dataLabelFormatCode: "0.0",
    catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: BF, valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 55, valAxisMaxVal: 20, valAxisMinVal: 0,
  });
  source(s, t.s2src); s.addNotes(t.s2notes);

  // Slide 3: timeline + funding + case + discussion points
  s = pres.addSlide(); s.background = { color: WHITE };
  title(s, t.s3k, t.s3t);
  const x0 = 0.9, x1 = 12.4, ly = 2.55, n = t.tl.length, step = (x1 - x0) / (n - 1);
  s.addShape(pres.shapes.LINE, { x: x0, y: ly, w: x1 - x0, h: 0, line: { color: GREY, width: 2 } });
  t.tl.forEach(([yr, lab], i) => {
    const x = x0 + i * step, col = i < 3 ? LIGHTBLUE : BLUE;
    s.addShape(pres.shapes.OVAL, { x: x - 0.11, y: ly - 0.11, w: 0.22, h: 0.22, fill: { color: col }, line: { color: WHITE, width: 1.5 } });
    s.addText(yr, { x: x - 0.7, y: ly - 0.5, w: 1.4, h: 0.3, fontFace: BF, fontSize: 12, bold: true, color: NAVY, align: "center", margin: 0, isTextBox: true });
    s.addText(lab, { x: x - 0.78, y: ly + 0.18, w: 1.56, h: 0.5, fontFace: BF, fontSize: 10, color: INK, align: "center", valign: "top", margin: 0, isTextBox: true });
  });
  s.addText(t.tlA, { x: x0 - 0.3, y: 1.78, w: 3.6, h: 0.28, fontFace: BF, fontSize: 10.5, italic: true, color: MUTED, margin: 0, isTextBox: true });
  s.addText(t.tlB, { x: x0 + 5 * step - 0.3, y: 1.78, w: 3.6, h: 0.28, fontFace: BF, fontSize: 10.5, italic: true, color: BLUE, margin: 0, isTextBox: true });

  const top = 3.45, hh = 3.4;
  // funding + case (left)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: top, w: 3.2, h: hh, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText(t.s3a[0], { x: 0.85, y: top + 0.2, w: 2.8, h: 0.7, fontFace: HF, fontSize: 32, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText(t.s3a[1], { x: 0.85, y: top + 0.95, w: 2.75, h: 1.2, fontFace: BF, fontSize: 13, color: WHITE, valign: "top", margin: 0, isTextBox: true });
  s.addText(L === "fr" ? "≈ 21 000 € par zone" : "≈ €21,000 per zone", { x: 0.85, y: top + 2.5, w: 2.8, h: 0.6, fontFace: HF, fontSize: 16, bold: true, color: LIGHTBLUE, margin: 0, isTextBox: true });

  s.addShape(pres.shapes.RECTANGLE, { x: 4.0, y: top, w: 4.1, h: hh, fill: { color: SOFT }, line: { color: SOFT } });
  s.addText(t.caseH, { x: 4.25, y: top + 0.2, w: 3.65, h: 0.45, fontFace: HF, fontSize: 16, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addText(t.caseB, { x: 4.25, y: top + 0.75, w: 3.65, h: 2.6, fontFace: BF, fontSize: 12.5, color: INK, valign: "top", margin: 0, isTextBox: true });

  s.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: top, w: 4.45, h: hh, fill: { color: SOFT }, line: { color: SOFT } });
  s.addText(t.pisH, { x: 8.55, y: top + 0.2, w: 4.0, h: 0.45, fontFace: HF, fontSize: 16, bold: true, color: NAVY, margin: 0, isTextBox: true });
  t.pis.forEach(([who, txt], i) => {
    const y = top + 0.78 + i * 0.66;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.55, y: y + 0.02, w: 0.95, h: 0.3, fill: { color: who === "DGE" ? BLUE : NAVY }, line: { color: WHITE }, rectRadius: 0.08 });
    s.addText(who, { x: 8.55, y: y + 0.02, w: 0.95, h: 0.3, fontFace: BF, fontSize: 9.5, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(txt, { x: 9.62, y: y - 0.03, w: 3.0, h: 0.66, fontFace: BF, fontSize: 10.5, color: INK, valign: "top", margin: 0, isTextBox: true });
  });
  source(s, t.s3src); s.addNotes(t.s3notes);

  return pres.writeFile({ fileName: path.join(__dirname, t.file) });
}
Promise.all([build("fr"), build("en")]).then((f) => console.log(f.join("\n")));
