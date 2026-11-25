"""Taux de rotation des emplacements commerciaux par type de changement et type de site, 2021-2025
(Codata, Digest France 2026, p. 13) : graphique Word natif modifiable (colonnes empilées + total).
Totaux : valeurs publiées. Composantes « local vacant -> commerce » et « commerce -> local vacant » : calculs OCDE
à partir des données vectorielles des graphiques Codata (précision < 0,1 point) ; « changement d'occupant » = total - les deux."""
import io, os, re, zipfile
from openpyxl import Workbook
from docx import Document
from docx.shared import Pt, Cm, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "figure_rotation_commerciale_par_type_de_site.docx")
Y = [2021, 2022, 2023, 2024, 2025]
SITES = [  # type, total publié, local vacant redevenu commerce, commerce devenu local vacant
    ("All sites", [9.6, 9.7, 11.1, 11.2, 12.4], [2.9, 3.0, 2.8, 2.7, 3.2], [2.7, 2.6, 3.3, 3.6, 4.1]),
    ("Street-level shops", [10.6, 10.7, 12.6, 12.5, 13.6], [3.1, 3.1, 3.0, 2.9, 3.4], [2.9, 2.7, 3.5, 3.9, 4.2]),
    ("Shopping centres", [9.6, 9.7, 11.8, 12.1, 13.4], [2.9, 3.3, 3.4, 3.5, 3.9], [3.5, 3.3, 4.4, 4.6, 4.8]),
    ("Commercial zones", [7.4, 7.5, 7.6, 8.0, 9.3], [2.3, 2.5, 1.9, 1.9, 2.2], [2.0, 1.7, 2.1, 2.5, 3.2]),
]
S = ["Vacant unit re-let", "Shop closed, unit left vacant", "Change of occupant without vacancy", "Turnover rate"]
rows = []
for name, tot, v2c, c2v in SITES:
    for i, y in enumerate(Y):
        rows.append((name if i == 0 else "", str(y), v2c[i], c2v[i], round(tot[i] - v2c[i] - c2v[i], 1), tot[i]))
n = len(rows)

wb = Workbook(); ws = wb.active; ws.title = "Sheet1"
ws.append(["Type of site", "Year"] + S)
for r in rows: ws.append(list(r))
ws["H1"] = ("% of commercial units recorded at the previous survey. Turnover rate as published by Codata (2026, p. 13). Re-let and "
            "closure components: OECD calculations from the vector data of the Codata charts (precision better than 0.1 point); "
            "change of occupant = turnover rate minus the two other components.")
buf = io.BytesIO(); wb.save(buf); XLSX = buf.getvalue()

def txpr(sz, color, bold=False):
    return (f'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}" b="{1 if bold else 0}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB"/></a:p></c:txPr>')
def title(text, rot):
    return (f'<c:title><c:tx><c:rich><a:bodyPr rot="{rot}" vert="horz"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="850" b="0"><a:solidFill><a:srgbClr val="666666"/></a:solidFill>'
            f'<a:latin typeface="Arial"/></a:defRPr></a:pPr><a:r><a:rPr lang="en-GB" sz="850" b="0"><a:solidFill><a:srgbClr val="666666"/></a:solidFill>'
            f'<a:latin typeface="Arial"/></a:rPr><a:t>{text}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>')
LV_Y = "".join('<c:pt idx="%d"><c:v>%s</c:v></c:pt>' % (i, r[1]) for i, r in enumerate(rows))
LV_T = "".join('<c:pt idx="%d"><c:v>%s</c:v></c:pt>' % (i, r[0]) for i, r in enumerate(rows) if r[0])
CAT = (f'<c:cat><c:multiLvlStrRef><c:f>Sheet1!$A$2:$B${n + 1}</c:f><c:multiLvlStrCache><c:ptCount val="{n}"/>'
       f'<c:lvl>{LV_Y}</c:lvl><c:lvl>{LV_T}</c:lvl></c:multiLvlStrCache></c:multiLvlStrRef></c:cat>')
def vals(col, k):
    pts = "".join(f'<c:pt idx="{i}"><c:v>{r[k]}</c:v></c:pt>' for i, r in enumerate(rows))
    return f'<c:val><c:numRef><c:f>Sheet1!${col}$2:${col}${n + 1}</c:f><c:numCache><c:formatCode>0.0</c:formatCode><c:ptCount val="{n}"/>{pts}</c:numCache></c:numRef></c:val>'
def sertx(col, name):
    return f'<c:tx><c:strRef><c:f>Sheet1!${col}$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>{name}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
NOLBL = '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
bars = ""
for j, (col, color) in enumerate([("C", "257DE0"), ("D", "F47230"), ("E", "C9CCD1")]):
    bars += (f'<c:ser><c:idx val="{j}"/><c:order val="{j}"/>{sertx(col, S[j])}'
             f'<c:spPr><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr>'
             f'<c:invertIfNegative val="0"/>{NOLBL}{CAT}{vals(col, 2 + j)}</c:ser>')
total = (f'<c:ser><c:idx val="3"/><c:order val="3"/>{sertx("F", S[3])}<c:spPr><a:ln><a:noFill/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>'
         f'<c:dLbls><c:numFmt formatCode="0.0" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(750, "1A1A1A", True)}'
         f'<c:dLblPos val="t"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
         f'{CAT}{vals("F", 5)}<c:smooth val="0"/></c:ser>')
noline = '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
CHART = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="en-GB"/><c:roundedCorners val="0"/>
<c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout/>
<c:barChart><c:barDir val="col"/><c:grouping val="stacked"/><c:varyColors val="0"/>{bars}<c:gapWidth val="35"/><c:overlap val="100"/><c:axId val="60030001"/><c:axId val="60030002"/></c:barChart>
<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>{total}<c:marker val="1"/><c:axId val="60030001"/><c:axId val="60030002"/></c:lineChart>
<c:catAx><c:axId val="60030001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/>
<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="C8C8C8"/></a:solidFill></a:ln></c:spPr>{txpr(750, "666666")}
<c:crossAx val="60030002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="60030002"/><c:scaling><c:orientation val="minMax"/><c:max val="16"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/>
<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E6E6E6"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>{title("% of commercial units", -5400000)}
<c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>{noline}{txpr(850, "666666")}
<c:crossAx val="60030001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/><c:majorUnit val="2"/></c:valAx>{noline}</c:plotArea>
<c:legend><c:legendPos val="t"/><c:legendEntry><c:idx val="3"/><c:delete val="1"/></c:legendEntry><c:overlay val="0"/>{txpr(850, "1A1A1A")}</c:legend>
<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>{txpr(850, "666666")}
<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>'''

doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2))
def para(text, size=10, bold=False, color="1A1A1A", after=6):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after); p.paragraph_format.keep_with_next = True
    r = p.add_run(text); r.font.size = Pt(size); r.bold = bold; r.font.color.rgb = RGBColor.from_string(color)
para("Figure 3.z. Commercial turnover: from 9.6% to 12.4% of units a year, rising on all types of site (2021-2025)", 11, True, after=2)
para("Turnover rate of commercial units by type of change and type of site, % of units, 2021-2025", 9.5, color="595959")
para("[[CHART]]")
para("Note: The turnover rate is the number of commercial units whose occupancy changed between two annual surveys, as a share of units "
     "recorded at the previous survey; shop renovations are not counted. \"Vacant unit re-let\": vacant at the previous survey, occupied by a shop "
     "at the current survey. \"Shop closed, unit left vacant\": occupied by a shop at the previous survey, vacant at the current survey. "
     "\"Change of occupant without vacancy\": a new business replaced the previous one between the two surveys. The total (figure above each bar) "
     "is as published by Codata. The first two components are derived from the charts published by Codata (OECD calculations); the third is the "
     "total minus the first two. Codata covers around 4 000 sites in mainland France, mostly in urban areas of more than 20 000 inhabitants.",
     8, color="595959", after=2)
para("Source: OECD calculations based on Codata (2026), Digest France 2026.", 8, color="595959")
tmp = io.BytesIO(); doc.save(tmp)

CX, CY = int(17 * 360000), int(9.5 * 360000)
DRAW = (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
        f'<wp:extent cx="{CX}" cy="{CY}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="104" name="Chart 4" descr="Stacked column chart: turnover of commercial units by type of change and type of site, 2021-2025"/><wp:cNvGraphicFramePr/>'
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
zout.close(); print("ok", OUT)
for r in rows: print(r)
