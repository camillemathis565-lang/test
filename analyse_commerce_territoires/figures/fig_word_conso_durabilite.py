"""Structure de la consommation finale effective des ménages par durabilité, 1960-2025 (Insee, comptes nationaux
annuels base 2020, tableau 2.203, prix courants). Graphique Word natif modifiable (colonnes empilées à 100 %).
Parts calculées sur la somme des quatre catégories (hors correction territoriale)."""
import io, os, re, zipfile
from openpyxl import Workbook
from docx import Document
from docx.shared import Pt, Cm, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "figure_consommation_par_durabilite.docx")
# % du total (biens durables, semi-durables, non durables, services) - calculs OCDE sur Insee T_2203 (mai 2026)
DATA = {1960: [7.4, 14.7, 39.3, 38.6], 1970: [7.8, 13.5, 32.6, 46.2], 1980: [9.5, 10.9, 28.6, 51.0], 1990: [9.0, 9.9, 25.8, 55.4],
        2000: [7.9, 8.3, 24.6, 59.2], 2010: [6.8, 7.1, 23.6, 62.4], 2019: [6.2, 6.6, 23.2, 64.1], 2022: [5.7, 6.1, 23.4, 64.9],
        2025: [5.2, 5.6, 22.5, 66.7]}
YEARS = list(DATA)
S = [("Durable goods", "F47230", "FFFFFF"), ("Semi-durable goods", "B4B4AC", "1A1A1A"),
     ("Non-durable goods (incl. energy)", "9CC3F0", "1A1A1A"), ("Services", "1F5FB4", "FFFFFF")]
n = len(YEARS)

wb = Workbook(); ws = wb.active; ws.title = "Sheet1"
ws.append(["Year"] + [s[0] for s in S])
for y in YEARS: ws.append([str(y)] + DATA[y])
ws["G1"] = ("% of households' actual final consumption at current prices, excluding the territorial correction. "
            "OECD calculations based on Insee, annual national accounts (base 2020), table 2.203, released May 2026.")
buf = io.BytesIO(); wb.save(buf); XLSX = buf.getvalue()

def txpr(sz, color, bold=False):
    return (f'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}" b="{1 if bold else 0}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB"/></a:p></c:txPr>')
CAT = ('<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$%d</c:f><c:strCache><c:ptCount val="%d"/>' % (n + 1, n) +
       "".join(f'<c:pt idx="{i}"><c:v>{y}</c:v></c:pt>' for i, y in enumerate(YEARS)) + '</c:strCache></c:strRef></c:cat>')
sers = ""
for j, (name, fill, ink) in enumerate(S):
    col = "BCDE"[j]
    pts = "".join(f'<c:pt idx="{i}"><c:v>{DATA[y][j]}</c:v></c:pt>' for i, y in enumerate(YEARS))
    sers += (f'<c:ser><c:idx val="{j}"/><c:order val="{j}"/><c:tx><c:strRef><c:f>Sheet1!${col}$1</c:f><c:strCache><c:ptCount val="1"/>'
             f'<c:pt idx="0"><c:v>{name}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
             f'<c:spPr><a:solidFill><a:srgbClr val="{fill}"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr>'
             f'<c:invertIfNegative val="0"/><c:dLbls><c:numFmt formatCode="0.0" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(800, ink)}'
             '<c:dLblPos val="ctr"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
             f'{CAT}<c:val><c:numRef><c:f>Sheet1!${col}$2:${col}${n + 1}</c:f><c:numCache><c:formatCode>0.0</c:formatCode><c:ptCount val="{n}"/>{pts}</c:numCache></c:numRef></c:val></c:ser>')
NOFILL = '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
CHART = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" '
         'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
         '<c:date1904 val="0"/><c:lang val="en-GB"/><c:roundedCorners val="0"/><c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout/>'
         f'<c:barChart><c:barDir val="col"/><c:grouping val="percentStacked"/><c:varyColors val="0"/>{sers}<c:gapWidth val="45"/><c:overlap val="100"/>'
         '<c:axId val="63010001"/><c:axId val="63010002"/></c:barChart>'
         '<c:catAx><c:axId val="63010001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/>'
         f'<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="8C8C8C"/></a:solidFill></a:ln></c:spPr>{txpr(900, "1A1A1A", True)}'
         '<c:crossAx val="63010002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
         '<c:valAx><c:axId val="63010002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="1"/><c:axPos val="l"/><c:numFmt formatCode="0%" sourceLinked="0"/>'
         '<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="63010001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>'
         f'{NOFILL}</c:plotArea><c:legend><c:legendPos val="t"/><c:overlay val="0"/>{txpr(850, "1A1A1A")}</c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>'
         f'<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>{txpr(850, "1A1A1A")}'
         '<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>')

doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2))
def para(text, size=10, bold=False, color="1A1A1A", after=6, keep=True):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after); p.paragraph_format.keep_with_next = keep
    r = p.add_run(text); r.font.size = Pt(size); r.bold = bold; r.font.color.rgb = RGBColor.from_string(color)
para("Figure 5.x. Services now account for two-thirds of household consumption, up from 39% in 1960", 11, True, after=2)
para("Structure of households' actual final consumption by durability, % of total at current prices, 1960-2025", 9.5, color="595959")
para("[[CHART]]")
para("Note: Durable goods include vehicles, furniture and household and leisure equipment; semi-durable goods include textiles and "
     "clothing; non-durable goods include food and energy. Actual final consumption includes goods and services consumed by households, "
     "whether paid for directly or financed by general government or non-profit institutions. Shares are calculated on the sum of the four "
     "categories, excluding the territorial correction. Data are from the base 2020 national accounts and differ slightly from earlier "
     "versions of this chart based on older bases. 2025 data are provisional; data for 2026 will be published in spring 2027.",
     8, color="595959", after=2, keep=False)
para("Source: OECD calculations based on Insee (2026), Comptes nationaux annuels (base 2020), table 2.203 \"Consommation finale effective "
     "des ménages par durabilité\", https://www.insee.fr/fr/statistiques/8988813.", 8, color="595959", keep=False)
tmp = io.BytesIO(); doc.save(tmp)

DRAW = (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
        f'<wp:extent cx="{int(17 * 360000)}" cy="{int(10 * 360000)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="130" name="Chart 1" descr="100% stacked column chart: structure of household consumption by durability, France, 1960-2025"/><wp:cNvGraphicFramePr/>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
        '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart1"/>'
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')
zin = zipfile.ZipFile(tmp); zout = zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == "word/document.xml":
        s, k = re.subn(r"<w:r>(?:(?!</w:r>).)*\[\[CHART\]\](?:(?!</w:r>).)*</w:r>", DRAW, data.decode("utf-8"), flags=re.S); assert k == 1
        data = s.encode("utf-8")
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
