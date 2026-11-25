"""Vacance commerciale par type de site, 2021-2025 (Codata, Digest France 2026) : graphique Word natif
(colonnes empilées vacance structurelle / frictionnelle, total en étiquette), définition et texte.
Totaux : valeurs publiées par Codata. Répartition structurelle / frictionnelle : calculée à partir des données vectorielles
des graphiques du PDF Codata (p. 10), précision < 0,1 point."""
import io, os, re, zipfile
from openpyxl import Workbook
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "figure_vacance_commerciale_par_type_de_site.docx")
Y = [2021, 2022, 2023, 2024, 2025]
SITES = [  # type, total publié, structurelle (plus d'un an, extraite du graphique vectoriel)
    ("All sites", [10.1, 9.3, 9.8, 10.7, 11.6], [6.9, 6.1, 6.0, 6.6, 7.0]),
    ("Street-level shops", [9.7, 9.1, 9.7, 10.8, 11.7], [6.4, 5.5, 5.6, 6.4, 6.8]),
    ("Shopping centres", [14.4, 13.9, 14.8, 16.0, 16.8], [10.4, 10.1, 10.0, 11.1, 11.7]),
    ("Commercial zones", [8.1, 6.9, 6.9, 7.4, 8.4], [5.5, 4.7, 4.2, 4.4, 4.6]),
]
rows = []
for name, tot, st in SITES:
    for i, y in enumerate(Y):
        rows.append((name if i == 0 else "", str(y), st[i], round(tot[i] - st[i], 1), tot[i]))
n = len(rows)

# ---------------------------------------------------------------- classeur intégré
wb = Workbook(); ws = wb.active; ws.title = "Sheet1"
ws.append(["Type of site", "Year", "Vacant for more than one year (structural)", "Vacant for one year or less (frictional)", "Total vacancy rate"])
for r in rows: ws.append(list(r))
ws["G1"] = "Totals as published by Codata (2026). Structural/frictional split: OECD calculations from the vector data of the Codata charts (p. 10), precision better than 0.1 point."
buf = io.BytesIO(); wb.save(buf); XLSX = buf.getvalue()

# ---------------------------------------------------------------- XML du graphique
def txpr(sz, color, bold=False):
    return (f'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}" b="{1 if bold else 0}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB"/></a:p></c:txPr>')
def title(text, rot=None):
    r = f' rot="{rot}" vert="horz"' if rot else ""
    return (f'<c:title><c:tx><c:rich><a:bodyPr{r}/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="850" b="0"><a:solidFill><a:srgbClr val="666666"/></a:solidFill>'
            f'<a:latin typeface="Arial"/></a:defRPr></a:pPr><a:r><a:rPr lang="en-GB" sz="850" b="0"><a:solidFill><a:srgbClr val="666666"/></a:solidFill>'
            f'<a:latin typeface="Arial"/></a:rPr><a:t>{text}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>')
lvl_years = "".join(f'<c:pt idx="{i}"><c:v>{r[1]}</c:v></c:pt>' for i, r in enumerate(rows))
lvl_types = "".join(f'<c:pt idx="{i}"><c:v>{r[0]}</c:v></c:pt>' for i, r in enumerate(rows) if r[0])
CAT = (f'<c:cat><c:multiLvlStrRef><c:f>Sheet1!$A$2:$B${n + 1}</c:f><c:multiLvlStrCache><c:ptCount val="{n}"/>'
       f'<c:lvl>{lvl_years}</c:lvl><c:lvl>{lvl_types}</c:lvl></c:multiLvlStrCache></c:multiLvlStrRef></c:cat>')
def vals(col, k):
    pts = "".join(f'<c:pt idx="{i}"><c:v>{r[k]}</c:v></c:pt>' for i, r in enumerate(rows))
    return f'<c:val><c:numRef><c:f>Sheet1!${col}$2:${col}${n + 1}</c:f><c:numCache><c:formatCode>0.0</c:formatCode><c:ptCount val="{n}"/>{pts}</c:numCache></c:numRef></c:val>'
def sertx(col, name):
    return f'<c:tx><c:strRef><c:f>Sheet1!${col}$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>{name}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
NOLBL = '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
bars = ""
for j, (col, name, color) in enumerate([("C", "Vacant for more than one year (structural)", "1F5FB4"), ("D", "Vacant for one year or less (frictional)", "9CC3F0")]):
    bars += (f'<c:ser><c:idx val="{j}"/><c:order val="{j}"/>{sertx(col, name)}'
             f'<c:spPr><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr>'
             f'<c:invertIfNegative val="0"/>{NOLBL}{CAT}{vals(col, 2 + j)}</c:ser>')
total = (f'<c:ser><c:idx val="2"/><c:order val="2"/>{sertx("E", "Total vacancy rate")}<c:spPr><a:ln><a:noFill/></a:ln></c:spPr>'
         f'<c:marker><c:symbol val="none"/></c:marker>'
         f'<c:dLbls><c:numFmt formatCode="0.0" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(750, "1A1A1A", True)}'
         f'<c:dLblPos val="t"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
         f'{CAT}{vals("E", 4)}<c:smooth val="0"/></c:ser>')
noline = '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
CHART = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="en-GB"/><c:roundedCorners val="0"/>
<c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout/>
<c:barChart><c:barDir val="col"/><c:grouping val="stacked"/><c:varyColors val="0"/>{bars}<c:gapWidth val="35"/><c:overlap val="100"/><c:axId val="60010001"/><c:axId val="60010002"/></c:barChart>
<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>{total}<c:marker val="1"/><c:axId val="60010001"/><c:axId val="60010002"/></c:lineChart>
<c:catAx><c:axId val="60010001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/>
<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="C8C8C8"/></a:solidFill></a:ln></c:spPr>{txpr(750, "666666")}
<c:crossAx val="60010002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="60010002"/><c:scaling><c:orientation val="minMax"/><c:max val="18"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/>
<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E6E6E6"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>{title("% of commercial units", -5400000)}
<c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>{noline}{txpr(850, "666666")}
<c:crossAx val="60010001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/><c:majorUnit val="2"/></c:valAx>{noline}</c:plotArea>
<c:legend><c:legendPos val="t"/><c:legendEntry><c:idx val="2"/><c:delete val="1"/></c:legendEntry><c:overlay val="0"/>{txpr(850, "1A1A1A")}</c:legend>
<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>{txpr(850, "666666")}
<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>'''

# ---------------------------------------------------------------- document
doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2))
def para(text, size=10, bold=False, color="1A1A1A", after=6, shade=None):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after)
    for part in re.split(r"(\*\*[^*]+\*\*)", text):
        if not part: continue
        b = part.startswith("**"); r = p.add_run(part.strip("*") if b else part)
        r.font.size = Pt(size); r.bold = bold or b; r.font.color.rgb = RGBColor.from_string(color)
    if shade:
        pPr = p._p.get_or_add_pPr(); sh = OxmlElement("w:shd")
        sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), shade); pPr.append(sh)
    return p
B = "EEF2F7"
para("Box 3.x. Measuring commercial vacancy", 10.5, True, shade=B, after=2)
para("The **commercial vacancy rate** is the share of commercial units that are unoccupied at the time of observation. Codata distinguishes three "
     "types of site: street-level shops (ground-floor units in town centres and neighbourhoods), shopping centres and commercial zones "
     "(retail parks, mostly on the urban periphery).", 9.5, shade=B, after=2)
para("Vacancy has two components. **Frictional vacancy** covers units that have been empty for one year or less. It mostly reflects the normal "
     "turnover of tenants and is a feature of any functioning property market. **Structural vacancy** covers units that have been empty for more than "
     "one year. It signals a lasting mismatch between premises and demand: poor location, obsolete or oversized units, rents above what tenants can "
     "afford, or owners who prefer to keep units empty. Structural vacancy is the better indicator of retail decline.", 9.5, shade=B, after=2)
para("The **turnover rate** is the number of units whose occupancy changed since the previous survey (a new occupant, a shop closing and leaving "
     "the unit empty, or a vacant unit being re-let), as a share of all units.", 9.5, shade=B, after=2)
para("**Coverage.** Codata surveys around 4 000 sites in mainland France every year (500 street-level sites, 1 500 shopping centres and 2 000 "
     "commercial zones, around 315 000 units). Sites are mostly located in urban areas of more than 20 000 inhabitants and have at least "
     "10 000 m² of sales area. Small towns and rural areas are therefore largely outside its scope.", 9.5, shade=B, after=2)
para("Source: Codata (2026), Digest France 2026.", 8, color="595959", shade=B, after=12)

para("Vacancy is rising on all types of site, and most vacant units have been empty for more than a year", 11, True)
para("Commercial vacancy has increased for the third consecutive year. In 2025, 11.6% of commercial units in France were vacant, against 9.3% in "
     "2022 (Figure 3.x). Shopping centres are the most affected (16.8%), followed by street-level shops (11.7%), which are mostly located in town "
     "centres and neighbourhoods. Commercial zones on the periphery have the lowest rate (8.4%). Town centres are therefore not the worst performers, "
     "but the periphery still does best. In absolute terms, street-level sites hold most of the vacant units: 19 100 of the 34 400 vacant units "
     "recorded in 2025 (56%), against 8 100 in shopping centres and 7 200 in commercial zones.")
para("Most vacant units have been empty for more than a year. In 2025, 7.0% of all commercial units had been vacant for more than one year and "
     "4.6% for one year or less, so structural vacancy accounts for 60% of all vacancy. Structural vacancy is highest in shopping centres (11.7% of "
     "units, or seven in ten vacant units), against 6.8% in street-level shops and 4.6% in commercial zones. Since 2022, the increase has been driven "
     "mainly by recent vacancies (+1.4 points), which may still be re-let, so the structural share of vacancy has fallen from 66% to 60%. Structural "
     "vacancy has nonetheless also been rising since 2023 (+1.0 point).")
para("The composition of recent increases differs by type of site. Between 2022 and 2025, vacancy in street-level shops rose by 2.6 percentage points "
     "(from 9.1% to 11.7%), with long-term and short-term vacancy contributing equally (+1.3 points each). In shopping centres, vacancy rose by "
     "2.9 points, more than half of it structural (+1.6 points). In commercial zones, vacancy rose by 1.5 points (from 6.9% to 8.4%), and in 2025 "
     "it increased slightly faster than in street-level shops (+1.0 point against +0.9). However, the whole of the increase in commercial zones is "
     "frictional (+1.6 points): structural vacancy there has remained broadly stable, at 4.2-4.7% of units since 2022.")
para("Turnover data show where this short-term vacancy comes from. The share of commercial units changing occupancy each year rose from 9.6% in "
     "2021 to 12.4% in 2025, and from 7.4% to 9.3% in commercial zones. In commercial zones, the share of shops that closed and left their unit "
     "empty almost doubled, from 1.7% of units in 2022 to 3.2% in 2025, while the share of vacant units being re-let remained at around 2%. "
     "Closures now outpace re-lettings in the periphery, by around 1 point of the stock in 2025, a gap similar to that in street-level shops "
     "(0.8 point). This points to more frequent closures in retail parks rather than to an accumulation of long-term empty units, but it is "
     "an early sign that the trend warrants monitoring.")
para("Closures are concentrated in personal goods. In 2025, street-level sites recorded 924 more closures than openings in clothing, 527 in "
     "services, 221 in footwear and 196 in home equipment, against net gains in cafés, hotels and restaurants (+233) and in beauty (+135). Over "
     "2015-2025, the share of clothing in street-level shops fell from 20.6% to 14.2% and that of footwear from 4.9% to 2.7%, while the share of "
     "cafés, hotels and restaurants rose from 18.1% to 21.6%. In commercial zones, net losses are concentrated in home equipment (-395) and "
     "clothing (-150). Independent shops remain the majority: the share of units occupied by retail chains fell slightly, from 48.2% in 2020 to "
     "46.5% in 2025, and chains occupy only 30% of street-level shops, against 63% in commercial zones and 70% in shopping centres.")
para("Vacancy rose in all 13 regions in 2025. It is highest in Occitanie (13.4%), Bourgogne-Franche-Comté (13.1%) and Centre-Val de Loire "
     "(12.8%), and lowest in Bretagne (9.8%). Among the cross-border regions, vacancy is above the national average in Occitanie, "
     "Hauts-de-France (12.3%) and Grand Est (12.0%), and below it in Auvergne-Rhône-Alpes (10.9%). In street-level shops, Occitanie has the "
     "highest rate of all regions (16.4%). In commercial zones, Grand Est (9.4%) is also well above the national average (8.4%).")
para("Over a longer period, the advantage of peripheral zones appears to be narrowing. Vacancy in peripheral zones is estimated to have roughly "
     "doubled, from under 4% in 2007 to over 8% in 2020 (Cerema). The two series are not strictly comparable, however, and the Codata rate for "
     "commercial zones fell temporarily after the COVID-19 period (from 8.1% in 2021 to 6.9% in 2022-2023) before rising again.")

para("Figure 3.x. Commercial vacancy is highest in shopping centres and mostly long-lasting", 11, True, after=2)
para("Vacancy rate by type of site and duration of vacancy, % of commercial units, 2021-2025", 9.5, color="595959")
para("[[CHART]]")
para("Note: Structural vacancy: units vacant for more than one year; frictional vacancy: units vacant for one year or less. The total vacancy rate "
     "(figure above each bar) is as published by Codata. The split between structural and frictional vacancy is derived from the charts "
     "published by Codata (OECD calculations). Codata covers around 4 000 sites in mainland France, mostly in urban areas of more than 20 000 "
     "inhabitants.", 8, color="595959", after=2)
para("Source: OECD calculations based on Codata (2026), Digest France 2026.", 8, color="595959")
tmp = io.BytesIO(); doc.save(tmp)

# ---------------------------------------------------------------- insertion du graphique natif
CX, CY = int(17 * 360000), int(9.5 * 360000)
DRAW = (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
        f'<wp:extent cx="{CX}" cy="{CY}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="102" name="Chart 2" descr="Stacked column chart: commercial vacancy by type of site and duration, 2021-2025"/><wp:cNvGraphicFramePr/>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
        '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart1"/>'
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')
zin = zipfile.ZipFile(tmp); zout = zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == "word/document.xml":
        s, k = re.subn(r"<w:r>(?:(?!</w:r>).)*\[\[CHART\]\](?:(?!</w:r>).)*</w:r>", DRAW, data.decode("utf-8"), flags=re.S)
        assert k == 1; data = s.encode("utf-8")
    elif it.filename == "word/settings.xml":
        data = re.sub(rb"<w:zoom (?![^>]*w:percent)", b'<w:zoom w:percent="100" ', data)
    elif it.filename == "word/_rels/document.xml.rels":
        data = data.replace(b"</Relationships>", b'<Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart1.xml"/></Relationships>')
    elif it.filename == "[Content_Types].xml":
        s = data.decode("utf-8")
        if 'Extension="xlsx"' not in s:
            s = s.replace("<Default ", '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/><Default ', 1)
        data = s.replace("</Types>", '<Override PartName="/word/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>').encode("utf-8")
    zout.writestr(it, data)
zout.writestr("word/charts/chart1.xml", CHART)
zout.writestr("word/charts/_rels/chart1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
              '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet.xlsx"/></Relationships>')
zout.writestr("word/embeddings/Microsoft_Excel_Worksheet.xlsx", XLSX)
zout.close()
print("ok", OUT)
