// Proposition à la DGE de missions d'entretiens dans les villes Action Cœur de Ville (Word, A4 paysage)
const fs = require("fs"), path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, LevelFormat, Footer, Header, PageNumber, PageOrientation, VerticalAlign, ExternalHyperlink, HeadingLevel,
} = require("docx");

const OUT = path.join(__dirname, "propositions_missions_entretiens_ACV_DGE.docx");
const NAVY = "003087", BAND = "0070C0", GREY = "595959", PINK = "C2255C", PINK_SOFT = "FDEEF4", BLUE_SOFT = "EBF4FB", LIGHT = "F2F2F2";
const W = 15137; // A4 paysage, marges 1,5 cm

const fr = (s) => s.replace(/ ([:;!?%»])/g, " $1").replace(/« /g, "« ")
  .replace(/(\d) (\d{3})/g, "$1 $2").replace(/ (pts?|km|m|hab\.)\b/g, " $1");
function runs(text, base = {}) {
  const out = [], re = /(\*\*[^*]+\*\*)/g, t = fr(text); let last = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    out.push(new TextRun({ text: m[0].slice(2, -2), bold: true, ...base })); last = m.index + m[0].length;
  }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: 120, line: 276 }, ...o.p });
const L = (t, ref) => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, spacing: { after: 70, line: 264 } });
const H = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(fr(t))] });

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
function table(cols, widths, rows, style = {}) {
  const cell = (txt, i, head, last) => {
    const prio = !head && style.prioCol === i;
    const fill = head ? undefined : prio ? (txt === "Haute" ? PINK_SOFT : BLUE_SOFT) : style.decisionCol === i ? LIGHT : undefined;
    return new TableCell({
      width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
      shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
      borders: { top: head ? line(NAVY, 10) : none, bottom: head ? line(NAVY, 6) : last ? line(NAVY, 10) : line("D9D9D9"), left: none, right: none },
      margins: { top: 80, bottom: 80, left: 90, right: 90 },
      children: [new Paragraph({ children: runs(txt, { size: 17, bold: head || prio || i === style.nameCol || undefined, color: head ? NAVY : prio ? (txt === "Haute" ? PINK : NAVY) : undefined }) })],
    });
  };
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: cols.map((c, i) => cell(c, i, true)) }),
      ...rows.map((r, k) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false, k === rows.length - 1)) }))] });
}
const link = (label, url, tail = "") => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 70 },
  children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: fr(label), style: "Hyperlink" })] }), ...runs(tail)] });

const C = [];
// En-tête du document
C.push(
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "OCDE · ÉTUDE DE CAS FRANCE · ZONES COMMERCIALES, CENTRES-VILLES ET QPV", bold: true, size: 16, color: PINK, characterSpacing: 20 })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fr("Proposition de missions d'entretiens dans les villes Action Cœur de Ville"), size: 40, color: NAVY })] }),
  new Paragraph({ spacing: { after: 280 }, border: { bottom: line(PINK, 8) }, children: [new TextRun({ text: fr("Note à l'attention de la Direction générale des Entreprises (DGE) · 8 octobre 2026 · Document de travail"), size: 19, color: GREY })] }),
);

C.push(H("Objet et méthode de sélection"));
C.push(P("Nous proposons à la DGE **six missions d'entretiens** dans des villes Action Cœur de Ville (ACV) qui ont inversé ou nettement freiné le déclin de leur commerce de centre-ville, plus **deux cas de comparaison**. L'objectif est de documenter ce qui a fonctionné, pour l'étude de cas France de l'OCDE sur les zones commerciales périphériques."));
C.push(P("Les villes sont retenues sur trois indicateurs croisés, pour les 228 villes ACV de métropole :"));
[
  "**Nombre de commerces employeurs du centre-ville** (Insee, Sirene) : évolution 2012-2019, avant le programme, comparée à 2019-2025. Centre-ville = cercle de 300 à 700 m autour de la mairie selon la taille de la ville.",
  "**Baisse de la vacance commerciale 2018-2022** (étude FACT et Codata) et palmarès Codata 2023 et 2024-2025.",
  "**Niveau de vacance en 2025** (atlas national ACV de l'ANCT, données Codata, par tranche de 5 points).",
].forEach((t) => C.push(L(t, "num1")));
C.push(P("Une ville est proposée quand au moins deux indicateurs concordent. Repères : les centres des villes ACV perdent 11,6 % de leurs commerces employeurs en 2012-2019 puis 9,1 % en 2019-2025 ; la vacance moyenne des villes ACV atteint 14,5 % en 2025.", { p: { spacing: { before: 80, after: 200, line: 276 } } }));

C.push(H("Missions proposées"));
C.push(P("Quatre villes montrent une inversion confirmée par une vacance basse en 2025 ; deux autres ont fortement freiné leur déclin. Les commerces sont les commerces employeurs du centre-ville en 2012, 2019 et 2025."));
C.push(table(["Priorité", "Ville", "Profil", "Commerces 2012 → 2019 → 2025", "Vacance commerciale", "Ce que la mission doit éclairer", "Interlocuteurs", "Décision DGE"],
  [1000, 1700, 1700, 2000, 2000, 2600, 2837, 1300], [
  ["Haute", "Sète (Hérault, 44 700 hab.)", "Inversion confirmée", "180 → 153 → 174 (−15 % puis +14 %)", "−4,4 pts en 2018-2022 ; 5 à 10 % en 2025", "Quels leviers ont ramené des commerces, et quelle part revient au programme ?", "Élu au commerce, manager de commerce, chef de projet ACV, CCI Hérault, union commerciale", "À valider"],
  ["Haute", "Creil (Oise, 36 100 hab.)", "Inversion, sans vacance publiée avant 2025", "59 → 40 → 55 (−32 % puis +38 %)", "5 à 10 % en 2025", "Rebond réel sur le terrain ? Articulation entre centre-ville et quartiers prioritaires", "Chef de projet ACV, manager de commerce, agglomération, CCI de l'Oise", "À valider"],
  ["Haute", "Vitry-le-François (Marne, 11 500 hab.)", "Inversion malgré une population en baisse (−12,8 % en 2014-2020)", "56 → 41 → 50 (−27 % puis +22 %)", "5 à 10 % en 2025", "Comment le commerce repart-il quand les habitants partent ?", "Maire ou élu au commerce, chef de projet ACV, CCI Marne, commerçants installés depuis 2019", "À valider"],
  ["Moyenne", "Lunéville (Meurthe-et-Moselle, 17 800 hab.)", "Inversion partielle", "54 → 46 → 52 (−15 % puis +13 %) ; ensemble des établissements −5 %", "5 à 10 % en 2025", "Quels commerces arrivent, lesquels partent ? Effet sur la vacance", "Chef de projet ACV, manager de commerce, union commerciale", "À valider"],
  ["Haute", "Vierzon (Cher, 25 300 hab.)", "Déclin fortement freiné", "57 → 33 → 30 (−42 % puis −9 %)", "−6,7 pts en 2018-2022 ; plus de 20 % en 2025", "Rôle de la foncière de redynamisation (SEMVIE) ; pourquoi la vacance reste élevée", "Foncière SEMVIE, chef de projet ACV, élu au commerce, Banque des Territoires", "À valider"],
  ["Moyenne", "Denain (Nord, 20 600 hab.)", "Inversion, vacance moyenne", "50 → 36 → 43 (−28 % puis +19 %)", "10 à 15 % en 2025", "Quelles actions depuis 2019 ? Poids des zones commerciales voisines", "Chef de projet ACV, manager de commerce, CCI Grand Hainaut", "À valider"],
], { prioCol: 0, nameCol: 1, decisionCol: 7 }));
C.push(P("Les interlocuteurs sont des fonctions : les noms seront à identifier avec les préfectures et l'ANCT.", { run: { size: 17, italics: true, color: GREY }, p: { spacing: { before: 80, after: 200 } } }));

C.push(H("Cas de comparaison"));
C.push(P("Deux missions courtes serviraient de points de comparaison : elles montrent ce qui distingue une réussite durable d'une réussite fragile ou d'un déclin simplement ralenti."));
C.push(table(["Ville", "Profil", "Commerces 2012 → 2019 → 2025", "Vacance commerciale", "Intérêt pour l'étude"], [2200, 2000, 2400, 3800, 4737], [
  ["Calais (Pas-de-Calais)", "Rechute", "91 → 74 → 81 (−19 % puis +10 %)", "14 % en 2022 après −7,7 pts, la plus forte baisse des villes ACV ; plus de 20 % en 2025", "Ce qui a marché en 2018-2022 et pourquoi la vacance est remontée"],
  ["Quimper (Finistère)", "Déclin ralenti, dans la moyenne", "268 → 213 → 194 (−20,5 % puis −8,9 %)", "10 à 15 % en 2025", "Témoin d'une préfecture où la périphérie continue de croître (+22 % de commerces employeurs à moins de 10 km depuis 2012)"],
], { nameCol: 0 }));
C.push(P("**Villes écartées comme exemples de réussite** : Saint-Dizier, Mont-de-Marsan et Marmande ont fortement réduit leur vacance, mais leurs commerces continuent de diminuer (Mont-de-Marsan : −32 % depuis 2019). La baisse de vacance y vient sans doute de locaux reconvertis plutôt que d'un regain d'activité.", { p: { spacing: { before: 160, after: 120, line: 276 } } }));
C.push(P("**Option alternative** : une ville accompagnée par l'ANCT dans « Mon centre-ville 2030 » (Angoulême, Cosne-Cours-sur-Loire, Douai, Mâcon, Redon), qui dispose déjà d'un diagnostic de sa politique de commerce.", { p: { spacing: { after: 200, line: 276 } } }));

C.push(H("Format des missions et grille d'entretien"));
C.push(P("Chaque mission dure une à deux journées sur place, avec quatre à six entretiens d'une heure et une visite du périmètre ORT avec le manager de commerce. La même grille est utilisée partout pour comparer les villes."));
[
  "**Diagnostic de départ** : situation du commerce de centre-ville vers 2018, causes perçues du déclin, place des zones commerciales périphériques.",
  "**Actions menées depuis 2018** : foncière, préemption, taxe sur les friches commerciales, aides au loyer, manager de commerce, aménagement, stationnement, logement en centre.",
  "**Moyens** : montants engagés par la ville et par ses partenaires (État, Banque des Territoires, Anah, Région), ingénierie mobilisée.",
  "**Périphérie** : projets refusés ou limités en CDAC, dialogue avec l'intercommunalité, reconversion de zones d'entrée de ville.",
  "**Résultats mesurés** : relevés locaux de vacance, ouvertures et fermetures, fréquentation ; demande des données brutes.",
  "**Facteurs extérieurs** : démographie, tourisme, grands employeurs, crise sanitaire.",
  "**Ce qui reste fragile** et ce que la ville attend de la phase 3 du programme (2027).",
].forEach((t) => C.push(L(t, "num2")));

C.push(H("Précautions et données à demander"));
C.push(P("Les indicateurs décrivent des évolutions, pas l'effet du programme : la FACT conclut en 2025 que les villes ACV ont évolué au même rythme que les autres sur 2019-2024. Les missions servent justement à identifier les leviers locaux."));
[
  "Les effectifs Sirene sont petits dans certaines villes (40 à 60 commerces) : une hausse de dix commerces pèse lourd.",
  "Le centre-ville est approché par un cercle autour de la mairie, pas par le périmètre ORT.",
  "La vacance 2025 n'est connue que par tranche de 5 points sur la carte de l'atlas.",
].forEach((t) => C.push(L(t, "bul")));
C.push(P("**À demander à la DGE et à l'ANCT avant les missions :**", { p: { spacing: { before: 140, after: 80 } } }));
[
  "Taux de vacance Codata par ville, 2018 à 2025, derrière la carte de l'atlas",
  "Montants engagés par ville au titre de l'axe 2 (développement économique et commercial)",
  "Décisions CDAC depuis 2018 dans les intercommunalités retenues",
  "Contacts des chefs de projet ACV et des managers de commerce",
].forEach((t) => C.push(L(t, "box")));

C.push(H("Sources"));
C.push(new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 70 }, children: [...runs("Insee, base Sirene et géolocalisation des établissements (2012-2025), calculs de l'auteur ; liste des villes ACV : "),
  new ExternalHyperlink({ link: "https://opendata.caissedesdepots.fr/explore/dataset/villes_action_coeurdeville/", children: [new TextRun({ text: "Caisse des Dépôts, open data", style: "Hyperlink" })] })] }));
C.push(link("ANCT, Atlas national Action cœur de ville, T4 2025", "https://media.anct.gouv.fr/ressources/2026-10/atlas-national-acv-t4-2025_0.pdf", " (vacance 2025, foncières, Mon centre-ville 2030)"));
C.push(link("Banque des Territoires, « Action cœur de ville : des résultats sur la vacance commerciale », 21 septembre 2023", "https://www.banquedesterritoires.fr/action-coeur-de-ville-des-resultats-sur-la-vacance-commerciale", " (étude FACT et Codata 2018-2022)"));
C.push(link("Banque des Territoires, « La progression de la vacance commerciale ralentit, surtout dans les villes moyennes »", "https://www.banquedesterritoires.fr/la-progression-de-la-vacance-commerciale-ralentit-surtout-dans-les-villes-moyennes", " (étude FACT, décembre 2025)"));

const bullet = (ref, text, color) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.BULLET, text, alignment: AlignmentType.LEFT,
  style: { run: { color, size: text === "■" ? 14 : 20 }, paragraph: { indent: { left: 360, hanging: 300 } } } }] });
const numbered = (ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
  style: { run: { color: NAVY, bold: true }, paragraph: { indent: { left: 400, hanging: 340 } } } }] });

const doc = new Document({
  creator: "OCDE – étude de cas France", title: "Proposition de missions d'entretiens dans les villes Action Cœur de Ville",
  styles: {
    default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, color: BAND, font: "Arial" }, paragraph: { spacing: { before: 280, after: 140 }, keepNext: true, outlineLevel: 0 } }],
  },
  numbering: { config: [bullet("bul", "■", PINK), bullet("box", "☐", NAVY), numbered("num1"), numbered("num2")] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fr("Missions d'entretiens ACV · Proposition à la DGE · Document de travail"), size: 15, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, bold: true, color: NAVY })] })] }) },
    children: C,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("écrit", OUT); });
