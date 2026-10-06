// Note de politique publique : zones commerciales périphériques, centres-villes et QPV (format document de travail)
const fs = require("fs"), path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, ImageRun,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, Header, PageNumber, PageBreak, VerticalAlign,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, LineRuleType,
} = require("docx");

const FIG = path.join(__dirname, "figures");
const OUT = path.join(__dirname, "zones_commerciales_centres_villes_QPV_note_de_politique.docx");
const NAVY = "003087", BAND = "0070C0", TINT = "EBF4FB", GREY = "595959", PINK = "C2255C", LIGHT = "F2F2F2";
const FONT = "Arial", W = 9638; // largeur utile A4, marges 2 cm

const fr = (s) => s
  .replace(/ ([:;!?%»])/g, " $1").replace(/« /g, "« ")
  .replace(/(\d) (\d{3})/g, "$1 $2").replace(/(\d) (\d{3})/g, "$1 $2")
  .replace(/n° /g, "n° ").replace(/ (pts?|km|m²|ha|€)\b/g, " $1");

function runs(text, base = {}) {
  const out = [], re = /(\*\*[^*]+\*\*|(?<![\w])_[^_]+_(?![\w]))/g, t = fr(text);
  let last = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    const s = m[0];
    out.push(new TextRun({ text: s.startsWith("**") ? s.slice(2, -2) : s.slice(1, -1), ...(s.startsWith("**") ? { bold: true } : { italics: true }), ...base }));
    last = m.index + s.length;
  }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}

const P = (text, o = {}) => new Paragraph({ children: runs(text, o.run || {}), spacing: { after: 140, line: 288 }, alignment: AlignmentType.JUSTIFIED, ...o.p });
const B = (text, ref = "bul") => new Paragraph({ children: runs(text), numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 } });
const H1 = (text, brk = true) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk, children: [new TextRun(fr(text))] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(fr(text))] });

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none };
const line = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });

// Encadré à une cellule (messages clés, encadrés)
function box(title, items, { fill = TINT, accent = NAVY, kicker } = {}) {
  const kids = [];
  if (kicker) kids.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: kicker.toUpperCase(), bold: true, size: 16, color: accent, characterSpacing: 20 })] }));
  kids.push(new Paragraph({ spacing: { after: 120 }, keepNext: true, children: [new TextRun({ text: fr(title), bold: true, size: 21, color: NAVY })] }));
  items.forEach((it) => kids.push(typeof it === "string"
    ? new Paragraph({ children: runs(it, { size: 19 }), spacing: { after: 100, line: 276 } })
    : new Paragraph({ children: runs(it.b, { size: 19 }), numbering: { reference: "bulbox", level: 0 }, spacing: { after: 80, line: 270 } })));
  return [new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ cantSplit: items.length < 9, children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill },
      borders: { top: line(accent, 18), bottom: none, left: none, right: none },
      margins: { top: 160, bottom: 120, left: 220, right: 220 }, children: kids })] })],
  }), new Paragraph({ spacing: { after: 120 }, children: [] })];
}

// Tableau de données
function table(num, title, cols, widths, rows, { note, source } = {}) {
  const mk = (txt, i, head, last) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    borders: { top: head ? line(NAVY, 8) : none, bottom: head ? line(NAVY, 4) : last ? line(NAVY, 8) : line("D9D9D9"), left: none, right: none },
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    children: [new Paragraph({ children: runs(txt, { size: 17, bold: head || undefined, color: head ? NAVY : undefined }) })],
  });
  return [
    caption("Tableau", num, title),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
      rows: [new TableRow({ tableHeader: true, children: cols.map((c, i) => mk(c, i, true)) }),
        ...rows.map((r, k) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false, k === rows.length - 1)) }))] }),
    ...notes(note, source),
  ];
}

function caption(kind, num, title, sub) {
  const out = [new Paragraph({ keepNext: true, spacing: { before: 200, after: sub ? 20 : 100 }, children: [
    new TextRun({ text: `${kind} ${num}. `, bold: true, color: NAVY, size: 19 }), new TextRun({ text: fr(title), bold: true, color: NAVY, size: 19 })] })];
  if (sub) out.push(new Paragraph({ keepNext: true, spacing: { after: 100 }, children: [new TextRun({ text: fr(sub), italics: true, color: GREY, size: 17 })] }));
  return out.length === 1 ? out[0] : out;
}
function notes(note, source) {
  const o = [];
  if (note) o.push(new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: "Note : ", italics: true, size: 15, color: GREY }), ...runs(note, { size: 15, color: GREY })] }));
  if (source) o.push(new Paragraph({ spacing: { before: note ? 0 : 60, after: 220 }, children: [new TextRun({ text: "Source : ", italics: true, size: 15, color: GREY }), ...runs(source, { size: 15, color: GREY })] }));
  return o;
}
function pngSize(f) { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }
function figure(num, title, sub, file, { note, source, width = 630 } = {}) {
  const f = path.join(FIG, file), [w, h] = pngSize(f);
  return [caption("Graphique", num, title, sub).flat ? caption("Graphique", num, title, sub) : caption("Graphique", num, title, sub),
    new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: fs.readFileSync(f), transformation: { width, height: Math.round(width * h / w) } })] }),
    ...notes(note, source)].flat();
}

// Bandeau de chiffres clés
function kpis(items) {
  const w = Math.floor(W / items.length), widths = items.map((_, i) => i < items.length - 1 ? w : W - w * (items.length - 1));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [new TableRow({ children: items.map(([v, l], i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders: { top: line(PINK, 18), bottom: none, left: none, right: i ? none : none },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: fr(v), size: 40, color: NAVY })] }),
      new Paragraph({ children: [new TextRun({ text: fr(l), size: 16, color: GREY })] })] })) })] });
}

const C = []; const add = (...xs) => C.push(...xs.flat());

// =================== RÉSUMÉ ===================
add(H1("Résumé", false));
add(P("Les zones commerciales de périphérie se sont imposées en un demi-siècle comme un lieu d'achat central pour les ménages français. Cette note fait le point sur ce que l'on sait de leurs effets sur les centres-villes et sur les quartiers prioritaires de la politique de la ville (QPV). Elle rassemble les études publiques disponibles et les complète par une analyse originale du répertoire Sirene, qui suit les commerces de détail en magasin de 2012 à 2025 dans 1 372 zones commerciales, les centres de 2 128 villes et les 1 362 QPV de l'Hexagone."));
add(kpis([["+24,5 %", "commerces employeurs en zones périphériques, 2012-2025"], ["−9,0 %", "dans les centres-villes des communes de 5 000 habitants et plus"], ["−16,5 pts", "d'écart entre les QPV et le reste de leur commune"]]));
add(new Paragraph({ spacing: { after: 60 }, children: [] }));
add(H2("Principaux constats"));
[
  "**La périphérie concentre l'essentiel de l'appareil commercial.** Le Cerema recense environ 1 500 zones commerciales de périphérie, couvrant quelque 500 millions de m². En 2015, les pôles de périphérie regroupaient 65 % de la surface commerciale des pôles de commerce, pour 23 % des établissements.",
  "**Depuis 2012, le commerce employeur s'est déplacé hors des centres et des QPV.** Les zones périphériques gagnent environ 7 000 commerces employeurs (+24,5 %), les centres-villes en perdent 5 550 (−9,0 %) et les QPV 800 (−6,1 %), alors que le total national est presque stable (+3,4 %).",
  "**Le transfert porte sur le non-alimentaire.** Habillement, chaussures, équipement du foyer et culture-loisirs reculent de 19 % à 42 % dans les centres et les QPV. L'alimentaire de proximité résiste : les centres se recentrent sur le quotidien.",
  "**Les QPV décrochent davantage.** Dans les 510 quartiers les plus commerçants, le nombre de commerces employeurs baisse de 8,2 %, quand il progresse de 8,3 % dans le reste de leur commune.",
  "**L'effet de la périphérie joue à l'échelle du bassin, pas du voisinage.** Neuf centres sur dix sont à moins de 10 km d'une grande zone. À taille, démographie et département comparables, être plus proche d'une zone, ou voir sa périphérie s'étendre, n'aggrave pas le recul de façon mesurable.",
  "**La périphérie atteint à son tour ses limites.** Les surfaces autorisées en commission départementale d'aménagement commercial (CDAC) baissent de 21 % entre 2022 et 2024, la croissance des commerces en zone tombe à +0,3 % par an et la vacance des zones commerciales progresse.",
  "**Les centres n'en profitent pas.** Leur recul s'accélère sur 2022-2025 (−1,15 % par an), et la vacance des rues marchandes atteint 10,85 % en 2024.",
].forEach((t) => add(B(t)));
add(H2("Principales orientations"));
[
  "**Maintenir la régulation des extensions**, tout en reconnaissant qu'elle ne fait pas revenir les commerces en centre.",
  "**Agir directement sur l'offre en centre-ville** : foncières de redynamisation, opérations de revitalisation de territoire (ORT), remise sur le marché des locaux vacants.",
  "**Ramener des habitants dans les centres**, la démographie étant le premier déterminant mesuré du commerce de centre.",
  "**Traiter les QPV comme un enjeu propre**, dont le décrochage ne dépend pas de la distance aux zones.",
  "**Transformer les entrées de ville** vieillissantes en quartiers mixtes, sur un foncier déjà artificialisé.",
  "**Combler les lacunes statistiques** : surfaces, vacance et dépenses à l'échelle locale, décisions CDAC consolidées.",
].forEach((t) => add(B(t)));

// =================== 1 ===================
add(H1("1. Un modèle commercial tourné vers la périphérie"));
add(box("Messages clés", [
  { b: "Environ 1 500 zones commerciales de périphérie couvrent quelque 500 millions de m² ; plus de huit déplacements sur dix pour s'y rendre se font en voiture." },
  { b: "En 2015, les pôles de périphérie regroupaient 65 % de la surface commerciale des pôles, pour 23 % des établissements." },
  { b: "De 2009 à 2015, l'emploi salarié du commerce de proximité a progressé de 2,3 % par an en périphérie, contre 0,2 % en centre-ville. L'écart se réduit sur 2016-2022." },
]));
add(P("Le modèle des zones commerciales d'entrée de ville s'est développé à partir des années 1960, autour de l'hypermarché, de l'automobile et d'un foncier bon marché. Le Cerema dénombre aujourd'hui environ 1 500 zones commerciales de périphérie, qui couvrent quelque 500 millions de m². L'accès y est très majoritairement automobile : 84 % des déplacements vers ces zones se font en voiture en métropole, 88 % dans les villes moyennes."));
add(P("La statistique publique mesure le poids de ces pôles. Selon l'Insee, les pôles de périphérie concentraient en 2015 près des deux tiers de la surface commerciale des pôles de commerce, mais moins d'un quart de leurs établissements : la périphérie est le lieu des grandes surfaces (graphique 1.1)."));
add(figure("1.1", "La périphérie concentre les surfaces, les centres concentrent les établissements", "Part des pôles de périphérie dans l'ensemble des pôles de commerce, 2015", "g1_1_poids_peripherie.png", {
  note: "Le complément à 100 % correspond aux pôles de centre-ville. Champ : commerce de proximité, France métropolitaine et La Réunion.",
  source: "Bédué M. et Cohen C. (2021), « Le commerce de proximité : des pôles plus florissants en périphérie qu'en centre-ville », _Insee Première_, n° 1858." }));
add(P("La dynamique de l'emploi confirme ce basculement. De 2009 à 2015, l'emploi salarié du commerce de proximité a progressé de 2,3 % par an dans les pôles de périphérie, contre 0,2 % dans les pôles de centre-ville (graphique 1.2). Dans les villes de taille intermédiaire, les centres ont perdu environ 3 500 emplois de commerce par an sur la période. Sur 2016-2022, l'écart se resserre : +1,6 % par an en périphérie contre +1,1 % en centre-ville pour les points de vente aux ménages, selon une étude dont le champ diffère de la précédente."));
add(figure("1.2", "L'emploi du commerce a d'abord crû en périphérie ; l'écart se réduit ensuite", "Croissance annuelle moyenne de l'emploi salarié, selon le type de pôle, en %", "g1_2_emploi_poles.png", {
  note: "Les deux études n'ont pas le même champ ni la même définition des pôles : 2009-2015, commerce de proximité ; 2016-2022, points de vente aux ménages. Les niveaux ne sont pas directement comparables.",
  source: "Insee Première n° 1858 (2021) et n° 2091 (2026)." }));
add(P("La régulation a accompagné plus qu'elle n'a freiné cette expansion. La loi Royer de 1973 a soumis à autorisation les grandes surfaces, au-delà de 1 000 m² (1 500 m² dans les villes de plus de 40 000 habitants). La loi de modernisation de l'économie de 2008 a fixé le seuil à 1 000 m². Depuis le 15 octobre 2022, les commissions doivent examiner un critère d'artificialisation des sols issu de la loi Climat et Résilience. Le tableau 1.1 reprend les principaux indicateurs publics."));
add(table("1.1", "Principaux indicateurs publics sur le commerce de périphérie, des centres et des QPV", ["Indicateur", "Valeur", "Année", "Source"], [3500, 2338, 1100, 2700], [
  ["Zones commerciales de périphérie", "≈ 1 500 zones, ≈ 500 millions de m²", "2022-2023", "Cerema"],
  ["Part de la surface des pôles de commerce en périphérie", "65 % (23 % des établissements)", "2015", "Insee Première n° 1858"],
  ["Emploi de commerce en centre des villes de taille intermédiaire", "−3 500 emplois par an", "2009-2015", "Insee Première n° 1782"],
  ["Vacance commerciale moyenne en centre-ville", "7 % (2012), 12,3 % (2020)", "2012-2020", "Cour des comptes (2023)"],
  ["Vacance des rues marchandes", "9,73 % (2023), 10,85 % (2024)", "2023-2024", "Procos, d'après Codata"],
  ["Part de marché du commerce alimentaire de proximité", "22 % (1993), 17 % (2017)", "1993-2017", "Cour des comptes (2023)"],
  ["Communes sans aucun commerce de détail", "53 % (2010), 62 % (2021)", "2010-2021", "Cour des comptes (2023), d'après l'Insee"],
  ["Chômage en QPV", "18,3 % (7,5 % dans les unités urbaines englobantes)", "2022", "ONPV, via l'Observatoire des inégalités"],
], { note: "Les taux de vacance proviennent de panels aux périmètres différents et ne doivent pas être comparés entre eux.", source: "Compilation de l'auteur ; voir les références." }));

// =================== 2 ===================
add(H1("2. Centres-villes : une érosion continue du commerce non alimentaire"));
add(box("Messages clés", [
  { b: "De 2012 à 2025, les commerces employeurs progressent de 24,5 % en zones périphériques et reculent de 9,0 % dans les centres-villes." },
  { b: "La part des centres dans les commerces employeurs passe de 25,1 % à 22,1 % ; celle des zones périphériques de 11,7 % à 14,1 %." },
  { b: "Les rayons qui progressent en périphérie sont ceux qui reculent en centre : c'est la signature d'un transfert. L'alimentaire de proximité résiste." },
]));
add(P("Pour suivre les territoires à une échelle fine, nous avons reconstitué à partir du répertoire Sirene le nombre de commerces de détail en magasin actifs en 2012, 2016, 2019, 2022 et 2025, dans trois types d'espaces : les 1 372 grandes zones commerciales recensées par le Cerema, les centres de 2 128 villes de 5 000 habitants ou plus, et les 1 362 QPV de l'Hexagone (annexe A)."));
add(P("La divergence est nette et continue (graphique 2.1). Les zones périphériques gagnent environ 7 000 commerces employeurs (+24,5 %), quand les centres-villes en perdent 5 550 (−9,0 %) et les QPV 800 (−6,1 %). Le nombre total de commerces employeurs est pourtant presque stable (+3,4 %) : il s'agit d'un déplacement plus que d'une contraction."));
add(figure("2.1", "Le commerce employeur progresse en périphérie et recule dans les centres et les QPV", "Nombre de commerces de détail employeurs en magasin, indice 100 en 2012", "g2_1_indices.png", {
  note: "Établissements actifs et employeurs au 1er janvier, NAF rév. 2, groupes 47.1 à 47.7. Centres-villes des communes de 5 000 habitants ou plus. France métropolitaine.",
  source: "Insee, Sirene (historique des établissements et géolocalisation, septembre 2026) ; Cerema, EmpCom ; ANCT, QPV 2024. Calculs de l'auteur." }));
add(box("Mesurer le commerce : établissements employeurs ou ensemble des établissements ?", [
  "Le choix de la mesure compte. En comptant tous les établissements, le recul des centres est plus faible (−2,6 %) et les QPV progressent (+4,6 %). L'écart vient surtout des micro-entrepreneurs, qui déclarent souvent une activité de commerce à leur domicile, en particulier dans les quartiers d'habitat dense.",
  "Les établissements employeurs reflètent mieux les boutiques physiques. C'est la mesure retenue dans cette note. Elle reste imparfaite : une grande surface y pèse autant qu'une boutique, faute de données ouvertes sur les surfaces de vente (section 6).",
], { fill: LIGHT, kicker: "Encadré 2.1" }));
add(P("Le transfert est ciblé (graphique 2.2). Les rayons qui ont le plus progressé en périphérie (équipement du foyer, habillement, culture et loisirs) sont ceux qui ont le plus reculé en centre-ville et en QPV. Le commerce en ligne amplifie ce mouvement. À l'inverse, supérettes et alimentaire spécialisé progressent partout : les centres se recentrent sur la proximité, ce qui rejoint le constat de l'Insee pour les villes moyennes."));
add(figure("2.2", "Le non-alimentaire quitte les centres et les QPV, l'alimentaire résiste", "Évolution du nombre de commerces employeurs par activité, 2012-2025, en %", "g2_2_activites.png", {
  note: "Activités regroupées selon la NAF rév. 2. Les évolutions en QPV portent sur de petits effectifs pour certains rayons (informatique, chaussures).",
  source: "Insee, Sirene ; Cerema, EmpCom ; ANCT, QPV 2024. Calculs de l'auteur." }));
add(P("La vacance commerciale, que Sirene ne mesure pas, suit la même pente. Selon la Cour des comptes, la vacance moyenne en centre-ville est passée de 7 % en 2012 à 12,3 % en 2020. Les relevés de Codata, publiés par Procos, situent la vacance des rues marchandes à 10,85 % en 2024, contre 7,24 % dans les zones commerciales (graphique 2.3). La fréquentation recule aussi davantage en centre-ville (−1,8 % en 2024) qu'en périphérie (−1,2 %)."));
add(figure("2.3", "La vacance est plus élevée en centre qu'en zone commerciale, et progresse partout", "Taux de vacance commerciale selon le type de site, en %", "g2_3_vacance_sites.png", {
  note: "Panel Codata ; le périmètre diffère de celui des autres sources de vacance citées.",
  source: "Procos, dossier de presse (février 2025), d'après Codata Digest France (janvier 2025)." }));

// =================== 3 ===================
add(H1("3. Quartiers prioritaires : un décrochage plus marqué"));
add(box("Messages clés", [
  { b: "Dans les 510 QPV les plus commerçants, les commerces employeurs reculent de 8,2 % entre 2012 et 2025, contre +8,3 % dans le reste de leur commune." },
  { b: "Le décrochage touche les mêmes rayons qu'en centre-ville, plus fortement : habillement −32,8 %, chaussures −42,4 %." },
  { b: "Il ne dépend pas de la distance à la zone commerciale la plus proche : il relève d'une fragilité propre aux quartiers." },
]));
add(box("Les quartiers prioritaires en quelques chiffres", [
  { b: "1 362 QPV en France métropolitaine au 1er janvier 2025 (ANCT)." },
  { b: "Taux de chômage de 18,3 % en 2022, contre 7,5 % dans les unités urbaines qui les englobent (ONPV)." },
  { b: "Taux de pauvreté proche de 45 % et niveau de vie médian de 1 213 € par mois en 2021, contre environ 1 900 € dans le reste de l'agglomération (Insee)." },
], { fill: LIGHT, kicker: "Encadré 3.1" }));
add(P("Les QPV cumulent des handicaps qui pèsent sur leur appareil commercial. La Cour des comptes relève que le développement commercial s'est opéré en périphérie des quartiers plutôt qu'en leur sein, et y voit deux causes : un pouvoir d'achat trop faible pour rentabiliser les boutiques, et une image dégradée qui décourage les enseignes."));
add(P("Les données Sirene chiffrent ce décrochage. Dans les 510 QPV qui comptaient au moins 5 commerces employeurs en 2012, leur nombre baisse de 8,2 % en 2025. Dans le reste de leur commune, hors QPV et hors zones périphériques, il augmente de 8,3 %. L'écart atteint 16,5 points. Il touche les mêmes rayons qu'en centre-ville : habillement −32,8 %, chaussures −42,4 %, équipement du foyer −34,4 %. Seuls les supérettes et supermarchés progressent (+39,2 %)."));
add(P("Ce décrochage ne dépend pas de la distance à la zone commerciale la plus proche : l'écart avec le reste de la commune est de 12 à 19 points dans toutes les classes de distance, y compris pour les 64 QPV contigus à une zone (graphique 3.1). La concurrence de la périphérie aggrave une fragilité propre aux quartiers, sans en être la seule cause."));
add(figure("3.1", "Les QPV reculent quelle que soit leur distance aux zones commerciales", "Évolution du nombre de commerces employeurs 2012-2025, QPV et reste de leur commune, en %", "g3_1_qpv_distance.png", {
  note: "QPV comptant au moins 5 commerces employeurs en 2012 (510). Reste de la commune : hors QPV et hors zones périphériques. Distance au contour de la zone commerciale la plus proche.",
  source: "Insee, Sirene ; Cerema, EmpCom ; ANCT, QPV 2024. Calculs de l'auteur." }));
add(P("La mission gouvernementale sur l'avenir du commerce de proximité, dont le rapport a été remis en novembre 2025, formule 30 recommandations et propose de faire des QPV un terrain d'expérimentation d'un nouveau modèle de centralité commerciale."));

// =================== 4 ===================
add(H1("4. Un effet de bassin plutôt que de voisinage"));
add(box("Messages clés", [
  { b: "Presque toutes les villes sont exposées : la moitié des centres sont à moins de 2,5 km d'une grande zone, 89 % à moins de 10 km." },
  { b: "À taille, démographie et département comparables, la proximité d'une zone ou son extension n'aggrave pas le recul du centre de façon mesurable." },
  { b: "La concurrence de la périphérie se lit dans les agrégats nationaux et dans la composition de l'offre, pas dans la distance." },
]));
add(P("Si les zones périphériques affaiblissaient directement les centres voisins, les villes les plus proches d'une grande zone, ou celles dont la périphérie s'est le plus étendue, devraient reculer davantage. Les écarts bruts ne le montrent pas clairement (graphique 4.1). Les centres situés à moins de 3 km d'une zone perdent 13 % de leurs commerces employeurs, contre 9 % au-delà de 10 km, mais ceux situés entre 3 et 10 km s'en sortent mieux que les deux groupes."));
add(figure("4.1", "Le recul des centres ne croît pas régulièrement avec la proximité d'une zone", "Évolution du nombre de commerces employeurs des centres-villes 2012-2025, selon la distance à la zone la plus proche, en %", "g4_1_centres_distance.png", {
  note: "Centres comptant au moins 10 commerces employeurs en 2012 (1 076).", source: "Insee, Sirene ; Cerema, EmpCom. Calculs de l'auteur." }));
add(P("Ces écarts bruts mélangent des villes très différentes. Deux modèles permettent de comparer des villes semblables (encadré 4.1). En coupe, la surface commerciale périphérique à moins de 10 km n'a pas d'effet mesurable sur l'évolution du centre ; la démographie domine : 10 % d'habitants en plus vont de pair avec environ 6 points de commerces en plus dans le centre. En panel, l'ouverture nette d'une grande surface à moins de 10 km ne s'accompagne d'aucune baisse supplémentaire du centre, ni sur la même période ni sur la suivante (graphique 4.2)."));
add(box("Méthode d'estimation", [
  "**Modèle en coupe.** Évolution 2012-2025 des commerces employeurs du centre, expliquée par la surface commerciale périphérique à moins de 10 km, avec la taille de la ville, son département et l'évolution de sa population (2014-2020) comme contrôles.",
  "**Modèle en panel.** Chaque centre (ou QPV) est suivi d'une période à l'autre, avec des effets fixes par ville et par département × période. Moindres carrés pondérés par le nombre initial de commerces ; erreurs regroupées par ville ou par QPV.",
  "**Lecture.** Les intervalles de confiance excluent un effet négatif de plus de 0,7 point par période pour l'ouverture d'une grande surface, et de plus de 1,7 point dans toutes les variantes. Ces résultats sont des corrélations conditionnelles, pas un effet causal établi.",
], { fill: LIGHT, kicker: "Encadré 4.1" }));
add(figure("4.2", "Aucun effet négatif mesurable du développement périphérique proche", "Effet estimé sur l'évolution des commerces employeurs, en points de % par période", "g4_2_effets.png", {
  note: "Point : estimation ; trait : intervalle de confiance à 95 %. Un effet de concurrence locale apparaîtrait à gauche de zéro. « Essor de la périphérie » : un commerce employeur supplémentaire en périphérie proche pour un commerce employeur du centre en début de période.",
  source: "Insee, Sirene ; Cerema, EmpCom ; ANCT, QPV 2024 ; Insee, recensements. Calculs de l'auteur." }));
add(P("Ces résultats ne signifient pas que la périphérie est sans effet. Ils indiquent que son effet ne se lit pas dans la distance : la concurrence joue à l'échelle du bassin de consommation, et il n'existe pas de groupe de villes « à l'abri » auquel se comparer. Ils rejoignent la littérature internationale : au Royaume-Uni, restreindre l'implantation des grandes surfaces en périphérie n'a pas protégé les commerçants indépendants de centre-ville (Sadun, 2015) ; en France, la loi Royer a surtout freiné l'emploi du secteur (Bertrand et Kramarz, 2002)."));

// =================== 5 ===================
add(H1("5. La périphérie atteint à son tour ses limites"));
add(box("Messages clés", [
  { b: "Les surfaces autorisées en CDAC reculent de 21 % entre 2022 et 2024, après l'entrée en vigueur du critère d'artificialisation." },
  { b: "La croissance des commerces employeurs en zone passe de +3,1 % par an (2012-2016) à +0,3 % (2022-2025), et leur vacance augmente." },
  { b: "Ce coup de frein ne profite pas aux centres : leur recul s'accélère. L'enjeu devient une surcapacité commerciale d'ensemble." },
]));
add(P("Depuis quelques années, la dynamique des zones commerciales s'essouffle. Les surfaces de vente autorisées en CDAC culminent à 765 384 m² en 2022, puis reculent à 605 844 m² en 2024, après l'entrée en vigueur du critère d'artificialisation en octobre 2022 (graphique 5.1). La vacance des zones commerciales progresse : de 6,9 % en 2021 à 8,1 % en 2024 selon la série publiée par le baromètre Icade × SCET, qui attribue à la Fédération des acteurs du commerce dans les territoires (FACT) une valeur de 8,5 % en 2026."));
add(figure("5.1", "Moins de surfaces nouvelles, plus de vacance en zone", "Surfaces de vente autorisées par les CDAC et taux de vacance des zones commerciales", "g5_1_cdac_vacance.png", {
  note: "Surfaces : autorisations et avis favorables des CDAC. Vacance : série reproduite par le baromètre (p. 61), dont la source n'est pas détaillée pour 2021-2025 ; la valeur 2026 est attribuée à la FACT.",
  source: "CNAC, _Rapport d'activité 2024_ (DGE, 2025), tableau 1 ; Icade et SCET (2026), _Baromètre des entrées de ville_, 2e édition." }));
add(P("Le rayon moteur des zones recule aussi. L'équipement de la personne, longtemps locomotive des parcs d'activités commerciales, plafonne en périphérie en 2019 puis y recule de 6 % jusqu'en 2025 (graphique 5.2). Le recul est bien plus ancien et plus fort dans les centres (−28 % depuis 2012) et les QPV (−35 %). La périphérie a d'abord pris ce rayon aux centres ; il se contracte désormais partout, sous l'effet du commerce en ligne et de la seconde main."));
add(figure("5.2", "L'habillement, d'abord capté par la périphérie, recule désormais partout", "Commerces employeurs d'habillement et de chaussures, indice 100 en 2012", "g5_2_habillement.png", {
  note: "NAF rév. 2, classes 47.71 et 47.72. Établissements actifs et employeurs au 1er janvier.", source: "Insee, Sirene ; Cerema, EmpCom ; ANCT, QPV 2024. Calculs de l'auteur." }));
add(P("Ce ralentissement n'a pas profité aux centres. Sur 2022-2025, ils reculent davantage que sur 2019-2022 (−1,15 % par an contre −0,36 %), et les QPV repassent dans le négatif (graphique 5.3). Les centres n'ont pas récupéré ce que la périphérie a cessé de gagner : le face-à-face entre centre et périphérie cède la place à une surcapacité commerciale d'ensemble, face à une consommation en magasin qui ne croît plus."));
add(figure("5.3", "Le ralentissement en périphérie s'accompagne d'un recul accru des centres", "Croissance annuelle moyenne du nombre de commerces employeurs, par période, en %", "g5_3_croissance_periodes.png", {
  source: "Insee, Sirene ; Cerema, EmpCom ; ANCT, QPV 2024. Calculs de l'auteur." }));
add(P("Les collectivités engagent la transformation des entrées de ville. Le baromètre Icade × SCET recense 437 projets de transformation, dont 56 % en sont au stade de l'intention ; 65 % sont initiés par des acteurs privés (propriétaires et opérateurs). Dans le sondage associé, 93 % des élus interrogés jugent ces espaces stratégiques. Le baromètre est publié par des acteurs de l'immobilier et son recensement n'est pas exhaustif : ses chiffres indiquent une tendance plus qu'un inventaire."));

// =================== 6 ===================
add(H1("6. Orientations pour l'action publique"));
add(P("L'ensemble des éléments converge vers un même diagnostic : la périphérie a déplacé le commerce non alimentaire hors des centres et des QPV, mais l'enjeu est désormais une surcapacité commerciale globale. Freiner l'extension des zones reste utile, notamment pour la sobriété foncière, mais ne suffit pas à revitaliser les centres. Le tableau 6.1 propose six orientations."));
add(table("6.1", "Orientations proposées", ["Orientation", "Leviers", "Acteurs concernés"], [2400, 4838, 2400], [
  ["1. Maintenir la régulation des extensions", "Examen du critère d'artificialisation en CDAC ; trajectoire de zéro artificialisation nette ; schémas de cohérence territoriale", "État (DGE, préfectures), intercommunalités"],
  ["2. Agir sur l'offre en centre-ville", "Foncières de redynamisation ; ORT ; requalification et remise sur le marché des locaux vacants ; Action Cœur de Ville, Petites villes de demain", "Communes, Banque des Territoires, ANCT"],
  ["3. Ramener des habitants dans les centres", "Rénovation et production de logements en centre ; lien entre programmes d'habitat et de commerce", "Communes, intercommunalités, Anah"],
  ["4. Traiter les QPV comme un enjeu propre", "Restructuration des centres commerciaux de quartier ; soutien à l'implantation ; sécurité et image ; suites de la mission de 2025", "ANCT, ANRU, bailleurs, communes"],
  ["5. Transformer les entrées de ville", "Reconversion des zones vieillissantes en quartiers mixtes ; montage financier des projets", "Intercommunalités, propriétaires, opérateurs"],
  ["6. Mieux mesurer", "Ouverture des données de surfaces, de vacance et de dépenses ; base consolidée des décisions CDAC (tableau 6.2)", "DGFiP, DGE, Cerema, Insee"],
], { source: "Proposition de l'auteur, à partir des constats des sections 1 à 5." }));
add(H2("Combler les lacunes statistiques"));
add(P("Aucune donnée publique ouverte ne suit aujourd'hui la vacance, les surfaces ou la fréquentation à l'échelle d'un centre-ville ou d'un QPV. Une évaluation causale de l'effet des zones commerciales demanderait en particulier les décisions CDAC projet par projet, afin de comparer les territoires où un projet a été autorisé à ceux où il a été refusé. Le tableau 6.2 recense les données prioritaires."));
add(table("6.2", "Données prioritaires pour une évaluation complète", ["Besoin", "Donnée", "Détenteur et accès"], [2600, 4038, 3000], [
  ["Mesurer l'offre en surfaces", "Surfaces de vente par établissement (fichier de la taxe sur les surfaces commerciales, TASCOM)", "DGFiP, DGE ; non ouvert"],
  ["Identifier les ouvertures projet par projet", "Base consolidée des décisions CDAC et CNAC (date, adresse, surface, autorisation ou refus)", "DGE, préfectures ; décisions publiées une à une"],
  ["Mesurer la vacance locale", "Locaux d'activité vacants (fichiers fonciers) ; relevés de terrain", "Cerema (convention) ; Codata (payant)"],
  ["Mesurer l'activité réelle", "Dépenses par carte bancaire localisées (lieu d'achat et de résidence)", "Groupements bancaires ; partenariat de recherche"],
  ["Dater les zones et leurs extensions", "Historique des contours ; dates de construction des locaux", "Cerema ; fichiers fonciers sous convention"],
  ["Isoler l'effet des politiques publiques", "Listes et dates des communes en ORT, Action Cœur de Ville, Petites villes de demain ; périmètres d'ORT", "ANCT, DGE ; en partie ouvert"],
  ["Suivre la vacance en QPV", "Indicateur consolidé de vacance commerciale en QPV", "ONPV, ANCT, ANRU ; inexistant"],
], { source: "Registre des données manquantes de l'étude." }));

// =================== Annexe ===================
add(H1("Annexe A. Méthode"));
[
  ["Commerces", "Établissements Sirene dont l'activité principale relève de la NAF rév. 2, groupes 47.1 à 47.7 (commerce de détail en magasin, hors marchés et vente à distance). Statut actif, activité et caractère employeur reconstitués au 1er janvier de chaque année à partir de l'historique des établissements. 908 694 établissements géolocalisés par l'Insee en métropole ; les 10 342 placés au hasard dans leur commune sont écartés."],
  ["Zones périphériques", "Polygones « commerce » de la base EmpCom du Cerema : 1 372 sites, 34 098 ha, contours photo-interprétés sur l'état 2021. Un commerce y est rattaché s'il se situe à moins de 50 m du contour. La base retient les principales zones : elle n'est pas exhaustive."],
  ["Centres-villes", "Cercle autour du chef-lieu (mairie, IGN Admin Express 2024) des 2 128 communes de 5 000 habitants ou plus, hors Paris, Lyon et Marseille. Rayon de 300 m (moins de 10 000 habitants), 500 m (10 000 à 50 000) ou 700 m (au-delà). Les commerces situés dans une zone périphérique sont exclus. Un rayon unique de 500 m donne les mêmes conclusions."],
  ["QPV", "Code QPV 2024 attribué par l'Insee à chaque établissement géolocalisé. Témoin : le reste de la ou des communes du quartier, hors QPV et hors zones périphériques."],
  ["Exposition", "Distance au contour commercial le plus proche ; surface et nombre de commerces de périphérie dans un rayon de 10 km autour du centre (5 km autour du QPV) ; ouverture nette d'une grande surface (super- et hypermarchés, grands magasins, bricolage) dans ce rayon."],
].forEach(([h, t]) => add(new Paragraph({ keepNext: true, spacing: { before: 120, after: 40 }, children: [new TextRun({ text: fr(h), bold: true, color: NAVY })] }), P(t)));
add(H2("Limites"));
[
  "Sirene compte des établissements juridiques : une grande surface pèse autant qu'une boutique, et certaines fermetures sont enregistrées avec retard, ce qui atténue les baisses.",
  "Le contour des centres par un cercle est une approximation ; les centralités commerciales réelles peuvent être décalées par rapport à la mairie.",
  "Les zones EmpCom sont figées à leur état 2021 : les petites zones et les extensions récentes ne sont pas observées.",
  "Les taux de vacance cités proviennent de panels privés (Codata, FACT) aux périmètres différents : les tendances sont plus robustes que les niveaux.",
  "Le baromètre Icade × SCET est publié par des acteurs de l'immobilier ; son recensement de projets n'est pas exhaustif.",
].forEach((t) => add(B(t)));

// =================== Références ===================
add(H1("Références"));
[
  "Allain M.-L. et Epaulard A. (2023), « Petits commerces : déclin ou mutation ? », _Les notes du Conseil d'analyse économique_, n° 77.",
  "ANCT (2025), _Quartiers prioritaires de la politique de la ville_.",
  "Bédué M. et Cohen C. (2021), « Le commerce de proximité : des pôles plus florissants en périphérie qu'en centre-ville », _Insee Première_, n° 1858.",
  "Bertrand M. et Kramarz F. (2002), « Does Entry Regulation Hinder Job Creation? Evidence from the French Retail Industry », _Quarterly Journal of Economics_, vol. 117, n° 4.",
  "Bloch K. et Pichavant A.-S. (2026), « Entre 2016 et 2022, l'emploi salarié des points de vente progresse davantage en dehors des centres-villes », _Insee Première_, n° 2091.",
  "Cazaubiel A. et Guymarc G. (2019), « Commerce de proximité dans les villes de taille intermédiaire », _Insee Première_, n° 1782.",
  "Cerema (2023), _Base EmpCom des principales emprises d'activités commerciales_.",
  "Cerema (2025), _Accompagner la mutation des zones commerciales de périphérie_.",
  "CNAC (2025), _Rapport d'activité 2024_, Direction générale des Entreprises.",
  "Cour des comptes (2023), _La politique de l'État en faveur du commerce de proximité_, rapport public thématique.",
  "Icade et SCET (2026), _Baromètre des entrées de ville, 2e édition : cap sur les projets_.",
  "Insee (2026), _Base Sirene des entreprises et de leurs établissements_ et _géolocalisation des établissements_, septembre.",
  "Mission sur l'avenir du commerce de proximité (2025), _Rapport sur l'avenir du commerce de proximité dans les centres-villes et les QPV_, rapport remis au Gouvernement.",
  "Observatoire des inégalités, _Le chômage dans les quartiers prioritaires_ (données ONPV 2022) ; _Les revenus et la pauvreté dans les quartiers les plus en difficulté_ (données Insee 2021).",
  "Procos (2025), _Dossier de presse, conférence annuelle_, février.",
  "Sadun R. (2015), « Does Planning Regulation Protect Independent Retailers? », _Review of Economics and Statistics_, vol. 97, n° 5.",
].forEach((t) => add(new Paragraph({ children: runs(t, { size: 18 }), spacing: { after: 90 }, indent: { left: 360, hanging: 360 } })));

// =================== Couverture et sommaire ===================
const cover = [
  new Paragraph({ children: [new ImageRun({ type: "jpg", data: fs.readFileSync(path.join(FIG, "couverture.jpg")), transformation: { width: 794, height: 1123 },
    floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 }, verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 }, behindDocument: true, allowOverlap: true } })] }),
  new Paragraph({ spacing: { before: 1300, after: 360 }, children: [new TextRun({ text: "OCDE · CENTRE POUR L'ENTREPRENEURIAT, LES PME, LES RÉGIONS ET LES VILLES", color: "FF9CC2", bold: true, size: 17, characterSpacing: 20 })] }),
  new Paragraph({ spacing: { after: 300, line: 250, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: fr("Zones commerciales périphériques, centres-villes et quartiers prioritaires"), color: "FFFFFF", size: 58 })] }),
  new Paragraph({ spacing: { after: 500, line: 300 }, children: [new TextRun({ text: fr("Ce que la périphérie a pris aux centres et aux QPV, et ce qui change aujourd'hui"), color: "C9D6EA", size: 28 })] }),
  new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 12, color: "FF9CC2", space: 8 } }, indent: { right: 6000 }, spacing: { after: 60 }, children: [] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Note de politique publique · Étude de cas France", color: "FFFFFF", bold: true, size: 20 })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Document de travail · Octobre 2026", color: "C9D6EA", size: 20 })] }),
  new Paragraph({ children: [new TextRun({ text: "Version provisoire, ne pas citer", color: "C9D6EA", italics: true, size: 18 })] }),
];
const toc = [
  new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Table des matières", size: 32, bold: true, color: NAVY })] }),
  ...[["Résumé"], ["1. Un modèle commercial tourné vers la périphérie"], ["2. Centres-villes : une érosion continue du commerce non alimentaire"], ["3. Quartiers prioritaires : un décrochage plus marqué"],
    ["4. Un effet de bassin plutôt que de voisinage"], ["5. La périphérie atteint à son tour ses limites"], ["6. Orientations pour l'action publique"], ["Annexe A. Méthode"], ["Références"]]
    .map(([t]) => new Paragraph({ spacing: { after: 140 }, border: { bottom: line("D9D9D9") }, children: [new TextRun({ text: fr(t), size: 21, color: t.match(/^\d/) ? undefined : NAVY, bold: !t.match(/^\d/) })] })),
  new Paragraph({ spacing: { before: 600, after: 120 }, children: [new TextRun({ text: "À propos de cette note", bold: true, size: 21, color: NAVY })] }),
  P("Cette note s'inscrit dans une étude de cas sur la France consacrée aux effets des zones commerciales de périphérie sur les centres-villes et les quartiers prioritaires de la politique de la ville. Elle s'appuie sur l'état de l'art des sources publiques, sur un registre de 164 chiffres sourcés et vérifiés, et sur une analyse originale du répertoire Sirene de 2012 à 2025.", { run: { size: 19 } }),
  P("Les chiffres issus des sources publiques ont été relus dans leur document d'origine. Ceux qui n'ont pu l'être sont signalés comme repris d'une source secondaire. Les calculs propres à l'auteur sont indiqués comme tels sous chaque graphique.", { run: { size: 19 } }),
  new Paragraph({ children: [new PageBreak()] }),
];

const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Zones commerciales périphériques, centres-villes et quartiers prioritaires",
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, color: NAVY, font: FONT }, paragraph: { spacing: { before: 0, after: 300 }, outlineLevel: 0, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PINK, space: 6 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: BAND, font: FONT }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "■", alignment: AlignmentType.LEFT, style: { run: { color: PINK, size: 14 }, paragraph: { indent: { left: 360, hanging: 300 } } } }] },
    { reference: "bulbox", levels: [{ level: 0, format: LevelFormat.BULLET, text: "■", alignment: AlignmentType.LEFT, style: { run: { color: NAVY, size: 14 }, paragraph: { indent: { left: 300, hanging: 260 } } } }] },
  ] },
  sections: [
    { properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: cover },
    { properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, pageNumbers: { start: 1 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Zones commerciales périphériques, centres-villes et QPV · Document de travail"), size: 15, color: GREY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: NAVY, bold: true })] })] }) },
      children: [...toc, ...C] },
  ],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
