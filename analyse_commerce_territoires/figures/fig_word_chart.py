"""Figure Word modifiable : graphique natif Word (données Excel intégrées) des commerces employeurs
par lieu d'implantation, indice 2012 = 100. Lit resultats/01_stocks_par_territoire.csv."""
import csv, io, os, zipfile, re
from openpyxl import Workbook
from docx import Document
from docx.shared import Pt, Cm, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "figure_commerces_employeurs_par_zone.docx")
rows = {r["zone"]: r for r in csv.DictReader(open(os.path.join(HERE, "..", "resultats", "01_stocks_par_territoire.csv")))}
Y = [2012, 2016, 2019, 2022, 2025]
cnt = {z: [int(rows[z][f"e{y}"]) for y in Y] for z in rows}
cnt["Total"] = [sum(v[i] for v in cnt.values()) for i in range(len(Y))]
idx = {z: [round(x / v[0] * 100, 1) for x in v] for z, v in cnt.items()}
pct = lambda z: f"{idx[z][-1] - 100:+.1f}%".replace("-", "−")
# (clé, libellé, couleur, épaisseur EMU, pointillé, gras, décalage vertical du libellé)
S = [("Zones commerciales périphériques", "Peripheral zones", "257DE0", 34925, False, True, 0),
     ("Reste du territoire", "Rest of territory", "B4B4AC", 25400, False, False, -0.022),
     ("Total", "All shops", "B4B4AC", 25400, True, False, 0.022),
     ("Quartiers prioritaires (QPV)", "Priority neighbourhoods (QPV)", "B4B4AC", 25400, False, False, -0.012),
     ("Centres-villes (communes ≥ 5 000 hab.)", "Town centres", "F47230", 34925, False, True, 0.012)]
names = [f"{lab} {pct(k)}" for k, lab, *_ in S]

# ---------------------------------------------------------------- classeur Excel intégré
wb = Workbook(); ws = wb.active; ws.title = "Sheet1"
ws.append(["Year"] + names)
for i, y in enumerate(Y):
    ws.append([str(y)] + [idx[k][i] for k, *_ in S])
cs = wb.create_sheet("Counts")
cs.append(["Year"] + [lab for _, lab, *_ in S])
for i, y in enumerate(Y):
    cs.append([y] + [cnt[k][i] for k, *_ in S])
buf = io.BytesIO(); wb.save(buf); XLSX = buf.getvalue()

# ---------------------------------------------------------------- XML du graphique
col = lambda j: "BCDEF"[j]
def txpr(sz, color, bold=False, rot=None):
    r = f' rot="{rot}" vert="horz"' if rot else ""
    return (f'<c:txPr><a:bodyPr{r}/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}" b="{1 if bold else 0}">'
            f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr>'
            f'<a:endParaRPr lang="en-GB"/></a:p></c:txPr>')
def title(text, rot=None):
    r = f' rot="{rot}" vert="horz"' if rot else ""
    return (f'<c:title><c:tx><c:rich><a:bodyPr{r}/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="850" b="0"><a:solidFill><a:srgbClr val="666666"/></a:solidFill>'
            f'<a:latin typeface="Arial"/></a:defRPr></a:pPr><a:r><a:rPr lang="en-GB" sz="850" b="0"><a:solidFill><a:srgbClr val="666666"/></a:solidFill>'
            f'<a:latin typeface="Arial"/></a:rPr><a:t>{text}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>')
DASH = '<a:prstDash val="dash"/>'
cats = "".join(f'<c:pt idx="{i}"><c:v>{y}</c:v></c:pt>' for i, y in enumerate(Y))
sers = ""
for j, (k, lab, color, w, dash, bold, dy) in enumerate(S):
    vals = "".join(f'<c:pt idx="{i}"><c:v>{v}</c:v></c:pt>' for i, v in enumerate(idx[k]))
    lay = f'<c:layout><c:manualLayout><c:x val="0.005"/><c:y val="{dy}"/></c:manualLayout></c:layout>' if dy else ""
    lbl_color = color if color != "B4B4AC" else "666666"
    sers += (f'<c:ser><c:idx val="{j}"/><c:order val="{j}"/>'
             f'<c:tx><c:strRef><c:f>Sheet1!${col(j)}$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>{names[j]}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
             f'<c:spPr><a:ln w="{w}" cap="rnd"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
             + (DASH if dash else "") + '<a:round/></a:ln></c:spPr>'
             f'<c:marker><c:symbol val="circle"/><c:size val="5"/><c:spPr><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
             f'<a:ln w="9525"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:marker>'
             f'<c:dLbls><c:dLbl><c:idx val="{len(Y) - 1}"/>{lay}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>{txpr(850, lbl_color, bold)}'
             f'<c:dLblPos val="r"/><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="1"/>'
             f'<c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbl>'
             f'<c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
             f'<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$6</c:f><c:strCache><c:ptCount val="5"/>{cats}</c:strCache></c:strRef></c:cat>'
             f'<c:val><c:numRef><c:f>Sheet1!${col(j)}$2:${col(j)}$6</c:f><c:numCache><c:formatCode>0.0</c:formatCode><c:ptCount val="5"/>{vals}</c:numCache></c:numRef></c:val>'
             f'<c:smooth val="0"/></c:ser>')
DASH = '<a:prstDash val="dash"/>'
noline = '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
CHART = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="en-GB"/><c:roundedCorners val="0"/>
<c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout><c:manualLayout><c:layoutTarget val="inner"/><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.08"/><c:y val="0.04"/><c:w val="0.6"/><c:h val="0.8"/></c:manualLayout></c:layout>
<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>{sers}<c:marker val="1"/><c:axId val="50010001"/><c:axId val="50010002"/></c:lineChart>
<c:catAx><c:axId val="50010001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>{title("Stock on 1 January")}<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/>
<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="C8C8C8"/></a:solidFill></a:ln></c:spPr>{txpr(900, "666666")}<c:crossAx val="50010002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="50010002"/><c:scaling><c:orientation val="minMax"/><c:max val="130"/><c:min val="85"/></c:scaling><c:delete val="0"/><c:axPos val="l"/>
<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E6E6E6"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>{title("Index, 2012 = 100", -5400000)}
<c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>{noline}{txpr(900, "666666")}<c:crossAx val="50010001"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/><c:majorUnit val="5"/></c:valAx>
{noline}</c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>{txpr(900, "666666")}
<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>'''

# ---------------------------------------------------------------- document Word
doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2))
def para(text, size=10, bold=False, color="1A1A1A", after=4):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text); r.font.size = Pt(size); r.bold = bold; r.font.color.rgb = RGBColor.from_string(color)
    return p
para("Figure 3.2. Employer shops: +25% in peripheral zones, −9% in town centres (2012-2025)", 11, True)
para("Employer retail shops (NAF 47.1-47.7, excl. online and market sales) by location, index 2012 = 100", 9.5, color="595959", after=6)
para("[[CHART]]")
n = cnt
para("Note: Metropolitan France. Stock of active establishments on 1 January. Each shop is counted where it is located, whatever the location "
     "of the firm's head office. Employer = at least one employee. Retail only (NAF 47.1-47.7): restaurants, personal services, motor trade, "
     "online sales (47.91) and market stalls (47.8) are excluded, as are artisan bakeries (10.71C) and delicatessens (10.13B). Town centres: "
     "circle of 300-700 m around the town hall, municipalities with 5,000+ inhabitants (excluding Paris, Lyon, Marseille). Locations are "
     "mutually exclusive (peripheral zone > QPV > town centre > rest of territory). Number of employer shops in 2012 and 2025: peripheral zones "
     f"{n['Zones commerciales périphériques'][0]:,} and {n['Zones commerciales périphériques'][-1]:,}; town centres "
     f"{n['Centres-villes (communes ≥ 5 000 hab.)'][0]:,} and {n['Centres-villes (communes ≥ 5 000 hab.)'][-1]:,}; QPV "
     f"{n['Quartiers prioritaires (QPV)'][0]:,} and {n['Quartiers prioritaires (QPV)'][-1]:,}; all shops {n['Total'][0]:,} and {n['Total'][-1]:,}. "
     "All establishments including non-employers: peripheral zones +35.4%, QPV +4.6%, town centres −2.6%, all shops +11.1%.", 8, color="595959")
para("Source: OECD calculations based on Insee (Sirene stock and geolocation), Cerema (commercial zones), ANCT (QPV 2024) and IGN (Admin Express).", 8, color="595959")
tmp = io.BytesIO(); doc.save(tmp)

# ---------------------------------------------------------------- insertion du graphique natif
CX, CY = int(17 * 360000), int(10.5 * 360000)
DRAW = (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
        f'<wp:extent cx="{CX}" cy="{CY}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="101" name="Chart 1" descr="Line chart: employer retail shops by location, index 2012 = 100, 2012-2025"/><wp:cNvGraphicFramePr/>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
        '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart1"/>'
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')
zin = zipfile.ZipFile(tmp); zout = zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == "word/document.xml":
        s = data.decode("utf-8")
        s, nsub = re.subn(r"<w:r>(?:(?!</w:r>).)*\[\[CHART\]\](?:(?!</w:r>).)*</w:r>", DRAW, s, flags=re.S)
        assert nsub == 1
        data = s.encode("utf-8")
    elif it.filename == "word/settings.xml":
        data = re.sub(rb"<w:zoom (?![^>]*w:percent)", b'<w:zoom w:percent="100" ', data)
    elif it.filename == "word/_rels/document.xml.rels":
        data = data.replace(b"</Relationships>", b'<Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart1.xml"/></Relationships>')
    elif it.filename == "[Content_Types].xml":
        s = data.decode("utf-8")
        if 'Extension="xlsx"' not in s:
            s = s.replace("<Default ", '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/><Default ', 1)
        s = s.replace("</Types>", '<Override PartName="/word/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>')
        data = s.encode("utf-8")
    zout.writestr(it, data)
zout.writestr("word/charts/chart1.xml", CHART)
zout.writestr("word/charts/_rels/chart1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
              '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet.xlsx"/></Relationships>')
zout.writestr("word/embeddings/Microsoft_Excel_Worksheet.xlsx", XLSX)
zout.close()
print("ok", OUT)
