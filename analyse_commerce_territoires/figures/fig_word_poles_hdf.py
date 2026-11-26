"""Pôles commerciaux des Hauts-de-France (Insee Analyses Hauts-de-France n° 214, 2026) : remplace le tableau 5.A
par une figure Word native modifiable en deux panneaux.
A. Répartition centre-ville / périphérie des pôles, établissements, emplois et surfaces de vente (2022).
B. Évolution de l'emploi 2016-2022 et ses sources (effets démographie des pôles, périmètre, conjoncturel), HdF vs France de province."""
import io, os, re, zipfile
from openpyxl import Workbook
from docx import Document
from docx.shared import Pt, Cm, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "figure_poles_commerciaux_hauts_de_france.docx")
ORANGE, BLUE, DBLUE, LBLUE, GREY = "F47230", "257DE0", "1F5FB4", "9CC3F0", "B4B4AC"

def txpr(sz, color, bold=False):
    return (f'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}" b="{1 if bold else 0}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB"/></a:p></c:txPr>')
def ctitle(t):
    return (f'<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr algn="l"><a:defRPr sz="950" b="1"/></a:pPr><a:r><a:rPr lang="en-GB" sz="950" b="1">'
            f'<a:solidFill><a:srgbClr val="1A1A1A"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>{t}</a:t></a:r></a:p></c:rich></c:tx>'
            '<c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.01"/><c:y val="0.01"/></c:manualLayout></c:layout><c:overlay val="0"/></c:title>')
def sertx(col, name):
    return f'<c:tx><c:strRef><c:f>Sheet1!${col}$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>{name}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
def numref(col, vals, fmt="0.0"):
    pts = "".join(f'<c:pt idx="{i}"><c:v>{v}</c:v></c:pt>' for i, v in enumerate(vals))
    return f'<c:val><c:numRef><c:f>Sheet1!${col}$2:${col}${len(vals) + 1}</c:f><c:numCache><c:formatCode>{fmt}</c:formatCode><c:ptCount val="{len(vals)}"/>{pts}</c:numCache></c:numRef></c:val>'
def lbls(fmt, color="FFFFFF", pos="ctr", bold=True, sz=850):
    return (f'<c:dLbls><c:numFmt formatCode="{fmt}" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(sz, color, bold)}'
            f'<c:dLblPos val="{pos}"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>')
NOLBL = '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
NOFILL = '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
HEAD = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<c:date1904 val="0"/><c:lang val="en-GB"/><c:roundedCorners val="0"/>')
TAIL = (f'<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>{txpr(850, "1A1A1A")}'
        '<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>')
def xlsx(rows, note):
    wb = Workbook(); ws = wb.active; ws.title = "Sheet1"
    for r in rows: ws.append(list(r))
    ws.cell(row=1, column=len(rows[0]) + 2, value=note)
    b = io.BytesIO(); wb.save(b); return b.getvalue()

# ------------------------------------------------------------ panneau A : répartition (2022)
SA_C, SA_P = round(20940 * 106.5), round(6900 * 688.1)   # surface de vente = établissements x m² moyens
A = [("Poles", 239, 329), ("Establishments", 20940, 6900), ("Jobs", 78000, 94700), ("Sales area (m²)", SA_C, SA_P)]
shares = [(lab, round(100 * c / (c + p), 1), round(100 * p / (c + p), 1)) for lab, c, p in A]
rowsA = [("Indicator", "Town-centre poles", "Peripheral poles", "Town-centre poles (number)", "Peripheral poles (number)")]
rowsA += [(s[0], s[1], s[2], a[1], a[2]) for s, a in zip(shares, A)]
XA = xlsx(rowsA, "Shares in % of all commercial poles of Hauts-de-France, 2022. Sales area = establishments x average m² per establishment "
              "(OECD calculation). Source: Insee Analyses Hauts-de-France No. 214 (2026), Figure 1.")
catA = ('<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$5</c:f><c:strCache><c:ptCount val="4"/>' +
        "".join(f'<c:pt idx="{i}"><c:v>{s[0]}</c:v></c:pt>' for i, s in enumerate(shares)) + '</c:strCache></c:strRef></c:cat>')
serA = ""
for j, (col, name, color) in enumerate([("B", "Town-centre poles", ORANGE), ("C", "Peripheral poles", BLUE)]):
    serA += (f'<c:ser><c:idx val="{j}"/><c:order val="{j}"/>{sertx(col, name)}<c:spPr><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
             f'<a:ln w="12700"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr><c:invertIfNegative val="0"/>'
             f'{lbls("0&quot;%&quot;")}{catA}{numref(col, [s[1 + j] for s in shares])}</c:ser>')
CHA = (HEAD + f'<c:chart>{ctitle("A. Share of commercial poles in Hauts-de-France, 2022 (%)")}<c:autoTitleDeleted val="0"/><c:plotArea>'
       '<c:layout><c:manualLayout><c:layoutTarget val="inner"/><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.2"/><c:y val="0.27"/><c:w val="0.78"/><c:h val="0.7"/></c:manualLayout></c:layout>'
       f'<c:barChart><c:barDir val="bar"/><c:grouping val="percentStacked"/><c:varyColors val="0"/>{serA}<c:gapWidth val="45"/><c:overlap val="100"/>'
       '<c:axId val="62010001"/><c:axId val="62010002"/></c:barChart>'
       '<c:catAx><c:axId val="62010001"/><c:scaling><c:orientation val="maxMin"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="General" sourceLinked="1"/>'
       f'<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>{NOFILL}{txpr(900, "1A1A1A")}'
       '<c:crossAx val="62010002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
       '<c:valAx><c:axId val="62010002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="1"/><c:axPos val="t"/><c:numFmt formatCode="0%" sourceLinked="0"/>'
       '<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="62010001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>'
       f'{NOFILL}</c:plotArea><c:legend><c:legendPos val="t"/><c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.2"/><c:y val="0.11"/><c:w val="0.6"/><c:h val="0.12"/></c:manualLayout></c:layout>'
       f'<c:overlay val="0"/>{txpr(850, "1A1A1A")}</c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>' + TAIL)

# ------------------------------------------------------------ panneau B : évolution de l'emploi 2016-2022 et ses sources
B = [("Town-centre poles", "Hauts-de-France", 0.2, 0.0, 2.9, 3.1), ("", "Provincial France", -0.1, 0.0, 2.1, 1.9),
     ("Peripheral poles", "Hauts-de-France", 7.0, 3.9, -2.2, 8.7), ("", "Provincial France", 5.3, 3.2, 2.4, 10.8),
     ("All poles", "Hauts-de-France", 3.8, 2.1, 0.2, 6.1), ("", "Provincial France", 2.6, 1.6, 2.2, 6.4)]
SB = ["New and closed poles", "Change in pole perimeters", "Change within unchanged poles", "Total change (%)"]
XB = xlsx([("Type of pole", "Area") + tuple(SB)] + B,
          "Employment change 2016-2022 (salaried and non-salaried jobs), % and contributions in percentage points. "
          "Source: Insee Analyses Hauts-de-France No. 214 (2026), Figure 3.")
n = len(B)
LVa = "".join('<c:pt idx="%d"><c:v>%s</c:v></c:pt>' % (i, r[1]) for i, r in enumerate(B))
LVb = "".join('<c:pt idx="%d"><c:v>%s</c:v></c:pt>' % (i, r[0]) for i, r in enumerate(B) if r[0])
catB = (f'<c:cat><c:multiLvlStrRef><c:f>Sheet1!$A$2:$B${n + 1}</c:f><c:multiLvlStrCache><c:ptCount val="{n}"/>'
        f'<c:lvl>{LVa}</c:lvl><c:lvl>{LVb}</c:lvl></c:multiLvlStrCache></c:multiLvlStrRef></c:cat>')
serB = ""
for j, (col, color) in enumerate([("C", DBLUE), ("D", LBLUE), ("E", GREY)]):
    serB += (f'<c:ser><c:idx val="{j}"/><c:order val="{j}"/>{sertx(col, SB[j])}<c:spPr><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
             f'<a:ln w="9525"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr><c:invertIfNegative val="0"/>{NOLBL}{catB}{numref(col, [r[2 + j] for r in B])}</c:ser>')
tot = (f'<c:ser><c:idx val="3"/><c:order val="3"/>{sertx("F", SB[3])}<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>'
       '<c:marker><c:symbol val="diamond"/><c:size val="8"/><c:spPr><a:solidFill><a:srgbClr val="1A1A1A"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:marker>'
       f'{lbls("+0.0;-0.0;0.0", "1A1A1A", "r", True, 800)}{catB}{numref("F", [r[5] for r in B])}<c:smooth val="0"/></c:ser>')
CHB = (HEAD + f'<c:chart>{ctitle("B. Employment change 2016-2022 and its sources (% and percentage points)")}<c:autoTitleDeleted val="0"/><c:plotArea>'
       '<c:layout><c:manualLayout><c:layoutTarget val="inner"/><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.06"/><c:y val="0.2"/><c:w val="0.92"/><c:h val="0.62"/></c:manualLayout></c:layout>'
       f'<c:barChart><c:barDir val="col"/><c:grouping val="stacked"/><c:varyColors val="0"/>{serB}<c:gapWidth val="70"/><c:overlap val="100"/>'
       '<c:axId val="62020001"/><c:axId val="62020002"/></c:barChart>'
       f'<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>{tot}<c:marker val="1"/><c:axId val="62020001"/><c:axId val="62020002"/></c:lineChart>'
       '<c:catAx><c:axId val="62020001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/>'
       f'<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="8C8C8C"/></a:solidFill></a:ln></c:spPr>{txpr(800, "1A1A1A")}'
       '<c:crossAx val="62020002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
       '<c:valAx><c:axId val="62020002"/><c:scaling><c:orientation val="minMax"/><c:max val="12"/><c:min val="-4"/></c:scaling><c:delete val="0"/><c:axPos val="l"/>'
       '<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E6E6E6"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>'
       f'<c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>{NOFILL}{txpr(800, "666666")}'
       '<c:crossAx val="62020001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/><c:majorUnit val="2"/></c:valAx>'
       f'{NOFILL}</c:plotArea><c:legend><c:legendPos val="t"/><c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.05"/><c:y val="0.08"/><c:w val="0.92"/><c:h val="0.09"/></c:manualLayout></c:layout>'
       f'<c:overlay val="0"/>{txpr(800, "1A1A1A")}</c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>' + TAIL)

# ------------------------------------------------------------ document
doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2))
def para(text, size=10, bold=False, color="1A1A1A", after=6, keep=True):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after); p.paragraph_format.keep_with_next = keep
    r = p.add_run(text); r.font.size = Pt(size); r.bold = bold; r.font.color.rgb = RGBColor.from_string(color)
para("Figure 5.A. In Hauts-de-France, peripheral poles have a quarter of establishments but most jobs and sales area", 11, True, after=2)
para("Commercial poles in Hauts-de-France, 2022, and employment change 2016-2022", 9.5, color="595959")
para("[[CHART1]]", after=8)
para("[[CHART2]]")
para("Note: Insee defines town-centre poles as clusters of at least 20 points of sale within 200 m of each other that meet at least two of "
     "three criteria (close to the town hall, more than 100 residents, fewer than 8 employees per establishment on average), and peripheral "
     "poles as clusters of at least 4 000 m² of sales area within 250 m, outside town-centre poles. These definitions differ from the Cerema "
     "perimeters used in Figure 5.2, and the figures are therefore not directly comparable. Jobs include salaried and non-salaried workers. "
     "Sales area is calculated as the number of establishments multiplied by the average sales area per establishment. On average, a "
     "peripheral establishment employs 13.7 people on 688 m², against 3.7 people on 107 m² in town-centre poles. In Panel B, \"new and closed "
     "poles\" is the net effect of poles created or disappearing between 2016 and 2022, \"change in pole perimeters\" the effect of "
     "establishments entering or leaving existing poles, and \"change within unchanged poles\" the change in employment in the parts of poles "
     "that existed in both years. Provincial France: France excluding Île-de-France.", 8, color="595959", after=2, keep=False)
para("Source: OECD calculations based on Insee (2026), Insee Analyses Hauts-de-France, No. 214, Figures 1 and 3, based on the Points de vente, "
     "Sirene and Flores files.", 8, color="595959", keep=False)
tmp = io.BytesIO(); doc.save(tmp)

SIZES = {1: (17.0, 5.6), 2: (17.0, 8.6)}
DESC = {1: "Stacked bar chart: share of town-centre and peripheral poles in poles, establishments, jobs and sales area, Hauts-de-France 2022",
        2: "Stacked column chart: sources of employment change 2016-2022 by type of pole, Hauts-de-France and provincial France"}
def drawing(i):
    w, h = SIZES[i]
    return (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
            f'<wp:extent cx="{int(w * 360000)}" cy="{int(h * 360000)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
            f'<wp:docPr id="{120 + i}" name="Chart {i}" descr="{DESC[i]}"/><wp:cNvGraphicFramePr/>'
            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
            f'<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart{i}"/>'
            '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')
zin = zipfile.ZipFile(tmp); zout = zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == "word/document.xml":
        s = data.decode("utf-8")
        for i in (1, 2):
            s, k = re.subn(r"<w:r>(?:(?!</w:r>).)*\[\[CHART%d\]\](?:(?!</w:r>).)*</w:r>" % i, drawing(i), s, flags=re.S); assert k == 1
        data = s.encode("utf-8")
    elif it.filename == "word/settings.xml":
        data = re.sub(rb"<w:zoom (?![^>]*w:percent)", b'<w:zoom w:percent="100" ', data)
    elif it.filename == "word/_rels/document.xml.rels":
        data = data.replace(b"</Relationships>", "".join(
            f'<Relationship Id="rIdChart{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart{i}.xml"/>' for i in (1, 2)).encode() + b"</Relationships>")
    elif it.filename == "[Content_Types].xml":
        s = data.decode("utf-8")
        if 'Extension="xlsx"' not in s:
            s = s.replace("<Default ", '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/><Default ', 1)
        data = s.replace("</Types>", "".join(f'<Override PartName="/word/charts/chart{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>' for i in (1, 2)) + "</Types>").encode("utf-8")
    zout.writestr(it, data)
for i, (xml, xl) in enumerate([(CHA, XA), (CHB, XB)], start=1):
    zout.writestr(f"word/charts/chart{i}.xml", xml)
    zout.writestr(f"word/charts/_rels/chart{i}.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                  f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet{i}.xlsx"/></Relationships>')
    zout.writestr(f"word/embeddings/Microsoft_Excel_Worksheet{i}.xlsx", xl)
zout.close(); print("ok", OUT); print(shares, SA_C, SA_P)
