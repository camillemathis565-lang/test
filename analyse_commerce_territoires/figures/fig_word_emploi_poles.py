"""Évolution annuelle moyenne 2016-2022 de l'emploi salarié, du nombre d'établissements et de la surface de vente
des points de vente aux ménages, par type de pôle commercial (Insee Première n° 2091, figure 1).
Trois graphiques Word natifs modifiables côte à côte (petits multiples), échelle commune."""
import io, os, re, zipfile
from openpyxl import Workbook
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "figure_emploi_etablissements_surface_par_pole.docx")
CATS = ["Town-centre hubs", "Peripheral hubs", "Outside hubs", "All points of sale"]
PANELS = [("Salaried employment", [1.1, 1.6, 1.9, 1.5]),
          ("Establishments", [0.0, 1.7, 0.2, 0.3]),
          ("Sales floor space", [-0.2, 1.3, 0.3, 0.6])]
BLUE, GREY = "257DE0", "C4C4BC"
VMIN, VMAX = -0.6, 2.4

def txpr(sz, color, bold=False):
    return (f'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}" b="{1 if bold else 0}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB"/></a:p></c:txPr>')

def make(name, vals, show_cats, k):
    W = [7.6, 4.8, 4.8][k]; x = (W - INNER - 0.2) / W; w = INNER / W
    wb = Workbook(); ws = wb.active; ws.title = "Sheet1"
    ws.append(["Type of retail hub", name])
    for c, v in zip(CATS, vals): ws.append([c, v])
    ws["D1"] = "Average annual change 2016-2022, % per year. Source: Insee (2026), Insee Première No. 2091, Figure 1."
    b = io.BytesIO(); wb.save(b)
    cat = ('<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$5</c:f><c:strCache><c:ptCount val="4"/>' +
           "".join(f'<c:pt idx="{i}"><c:v>{c}</c:v></c:pt>' for i, c in enumerate(CATS)) + '</c:strCache></c:strRef></c:cat>')
    val = ('<c:val><c:numRef><c:f>Sheet1!$B$2:$B$5</c:f><c:numCache><c:formatCode>0.0</c:formatCode><c:ptCount val="4"/>' +
           "".join(f'<c:pt idx="{i}"><c:v>{v}</c:v></c:pt>' for i, v in enumerate(vals)) + '</c:numCache></c:numRef></c:val>')
    dpt = (f'<c:dPt><c:idx val="1"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/>'
           f'<c:spPr><a:solidFill><a:srgbClr val="{BLUE}"/></a:solidFill></c:spPr></c:dPt>')
    lbl = (f'<c:dLbls><c:numFmt formatCode="+0.0;-0.0;0.0" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(850, "1A1A1A")}'
           '<c:dLblPos val="outEnd"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/>'
           '<c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>')
    ser = (f'<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>Sheet1!$B$1</c:f><c:strCache><c:ptCount val="1"/>'
           f'<c:pt idx="0"><c:v>{name}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
           f'<c:spPr><a:solidFill><a:srgbClr val="{GREY}"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>{dpt}{lbl}{cat}{val}</c:ser>')
    ttl = (f'<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="950" b="1"/></a:pPr><a:r><a:rPr lang="en-GB" sz="950" b="1">'
           f'<a:solidFill><a:srgbClr val="1A1A1A"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>{name}</a:t></a:r></a:p></c:rich></c:tx>'
           '<c:overlay val="0"/></c:title>')
    a1, a2 = 61000000 + 2 * k, 61000001 + 2 * k
    lblpos = "low" if show_cats else "none"
    xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="en-GB"/><c:roundedCorners val="0"/>
<c:chart>{ttl}<c:autoTitleDeleted val="0"/><c:plotArea><c:layout><c:manualLayout><c:layoutTarget val="inner"/><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="{x:.4f}"/><c:y val="0.17"/><c:w val="{w:.4f}"/><c:h val="0.80"/></c:manualLayout></c:layout>
<c:barChart><c:barDir val="bar"/><c:grouping val="clustered"/><c:varyColors val="0"/>{ser}<c:gapWidth val="55"/><c:axId val="{a1}"/><c:axId val="{a2}"/></c:barChart>
<c:catAx><c:axId val="{a1}"/><c:scaling><c:orientation val="maxMin"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="General" sourceLinked="1"/>
<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="{lblpos}"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>{txpr(900, "1A1A1A")}
<c:crossAx val="{a2}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="{a2}"/><c:scaling><c:orientation val="minMax"/><c:max val="{VMAX}"/><c:min val="{VMIN}"/></c:scaling><c:delete val="1"/><c:axPos val="t"/>
<c:numFmt formatCode="0.0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>
<c:crossAx val="{a1}"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>
<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(900, "1A1A1A")}
<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>'''
    return xml, b.getvalue()

INNER = 4.4  # largeur commune de la zone de tracé (cm) -> même échelle dans les trois panneaux
charts = [make(n, v, i == 0, i) for i, (n, v) in enumerate(PANELS)]

# ---------------------------------------------------------------- document
doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(1.8))
def para(text, size=10, bold=False, color="1A1A1A", after=6, keep=True):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after); p.paragraph_format.keep_with_next = keep
    r = p.add_run(text); r.font.size = Pt(size); r.bold = bold; r.font.color.rgb = RGBColor.from_string(color)
    return p
para("Figure 3.w. Peripheral hubs grew in establishments and floor space, town centres only in employment (2016-2022)", 11, True, after=2)
para("Average annual change, 2016-2022, % per year. Points of sale to households, by type of retail hub", 9.5, color="595959")
WIDTHS = [7.6, 4.8, 4.8]
tbl = doc.add_table(rows=1, cols=3); tbl.autofit = False
tblPr = tbl._tbl.tblPr; bd = OxmlElement("w:tblBorders")
for s in ("top", "left", "bottom", "right", "insideH", "insideV"):
    e = OxmlElement(f"w:{s}"); e.set(qn("w:val"), "nil"); bd.append(e)
tblPr.append(bd)
for gc, w in zip(tbl._tbl.tblGrid.findall(qn("w:gridCol")), WIDTHS):
    gc.set(qn("w:w"), str(int(w * 567)))
lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
for i, w in enumerate(WIDTHS):
    c = tbl.cell(0, i); c.width = Cm(w)
    mar = OxmlElement("w:tcMar")
    for s in ("left", "right"):
        e = OxmlElement(f"w:{s}"); e.set(qn("w:w"), "0"); e.set(qn("w:type"), "dxa"); mar.append(e)
    c._tc.get_or_add_tcPr().append(mar)
    c.paragraphs[0].add_run(f"[[CHART{i + 1}]]")
para("Note: Points of sale to households include retail shops, restaurants, bars, hairdressers and beauty salons, bank and estate agencies "
     "and other consumer services. Retail hubs are groups of points of sale defined by Insee; town-centre hubs are generally made up of small "
     "establishments in shopping streets, peripheral hubs mostly of larger outlets in non-residential areas. Coverage: mainland France, "
     "La Réunion, Martinique and Guadeloupe.", 8, color="595959", after=2, keep=False)
para("Source: Insee (2026), \"Entre 2016 et 2022, l'emploi salarié des points de vente progresse davantage en dehors des centres-villes\", "
     "Insee Première, No. 2091, Figure 1.", 8, color="595959", keep=False)
tmp = io.BytesIO(); doc.save(tmp)

def drawing(i, wcm, hcm=5.6):
    return (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
            f'<wp:extent cx="{int(wcm * 360000)}" cy="{int(hcm * 360000)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
            f'<wp:docPr id="{110 + i}" name="Chart {i}" descr="Bar chart: {PANELS[i - 1][0]}, average annual change 2016-2022 by type of retail hub"/><wp:cNvGraphicFramePr/>'
            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
            f'<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart{i}"/>'
            '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')
zin = zipfile.ZipFile(tmp); zout = zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == "word/document.xml":
        s = data.decode("utf-8")
        for i in (1, 2, 3):
            s, k = re.subn(r"<w:r>(?:(?!</w:r>).)*\[\[CHART%d\]\](?:(?!</w:r>).)*</w:r>" % i, drawing(i, WIDTHS[i - 1]), s, flags=re.S)
            assert k == 1
        data = s.encode("utf-8")
    elif it.filename == "word/settings.xml":
        data = re.sub(rb"<w:zoom (?![^>]*w:percent)", b'<w:zoom w:percent="100" ', data)
    elif it.filename == "word/_rels/document.xml.rels":
        rels = "".join(f'<Relationship Id="rIdChart{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart{i}.xml"/>' for i in (1, 2, 3))
        data = data.replace(b"</Relationships>", rels.encode() + b"</Relationships>")
    elif it.filename == "[Content_Types].xml":
        s = data.decode("utf-8")
        if 'Extension="xlsx"' not in s:
            s = s.replace("<Default ", '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/><Default ', 1)
        ov = "".join(f'<Override PartName="/word/charts/chart{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>' for i in (1, 2, 3))
        data = s.replace("</Types>", ov + "</Types>").encode("utf-8")
    zout.writestr(it, data)
for i, (xml, xl) in enumerate(charts, start=1):
    zout.writestr(f"word/charts/chart{i}.xml", xml)
    zout.writestr(f"word/charts/_rels/chart{i}.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                  f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet{i}.xlsx"/></Relationships>')
    zout.writestr(f"word/embeddings/Microsoft_Excel_Worksheet{i}.xlsx", xl)
zout.close(); print("ok", OUT)
