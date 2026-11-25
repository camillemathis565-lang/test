"""Encadré OCDE : Paris, réguler l'usage et maîtriser les locaux (Paris Commerces). Génère box_paris_commerces.docx."""
import os, re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "box_paris_commerces.docx")
FILL, RULE, INK, GREY = "E8EFF7", "1F5FB4", "1A1A1A", "595959"

doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(9.5)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2.2))
for m in ("top_margin", "bottom_margin"): setattr(sec, m, Cm(2))

# ---- tableau à une cellule = encadré
tbl = doc.add_table(rows=1, cols=1); cell = tbl.cell(0, 0)
tcPr = cell._tc.get_or_add_tcPr()
sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), FILL); tcPr.append(sh)
bd = OxmlElement("w:tcBorders")
for side in ("top", "bottom", "left", "right"):
    e = OxmlElement(f"w:{side}")
    if side in ("top", "bottom"):
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "12"); e.set(qn("w:color"), RULE)
    else:
        e.set(qn("w:val"), "nil")
    bd.append(e)
tcPr.append(bd)
mar = OxmlElement("w:tcMar")
for side, w in (("top", 160), ("bottom", 160), ("left", 220), ("right", 220)):
    e = OxmlElement(f"w:{side}"); e.set(qn("w:w"), str(w)); e.set(qn("w:type"), "dxa"); mar.append(e)
tcPr.append(mar)
first = [True]

def runs(p, text, size, color, bold=False, italic=False):
    # **gras**, *italique*
    for part in re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*)", text):
        if not part: continue
        b = part.startswith("**"); i = (not b) and part.startswith("*")
        r = p.add_run(part.strip("*"))
        r.font.size = Pt(size); r.font.color.rgb = RGBColor.from_string(color)
        r.bold = bold or b; r.italic = italic or i

def P(text, size=9.5, color=INK, bold=False, italic=False, before=0, after=4, style=None, keep=False):
    if first[0]:
        p = cell.paragraphs[0]; first[0] = False
        if style: p.style = doc.styles[style]
    else:
        p = cell.add_paragraph(style=style)
    pf = p.paragraph_format; pf.space_before = Pt(before); pf.space_after = Pt(after); pf.line_spacing = 1.08
    if keep: pf.keep_with_next = True
    runs(p, text, size, color, bold, italic)
    return p

def H(text):  # intertitre de l'encadré
    P(text, 9.5, RULE, bold=True, before=6, after=3, keep=True)

def B(text):  # puce
    p = P(text, style="List Bullet", after=2)
    p.paragraph_format.left_indent = Cm(0.55); p.paragraph_format.first_line_indent = Cm(-0.4)
    return p

P("Box 5.x. Paris: regulating use and controlling premises to contain vacancy", 10.5, INK, bold=True, after=6)

H("A dense but changing retail fabric")
P("Paris counted 60 517 shops, commercial services, cafés and restaurants in 2026, about 28 per 1 000 inhabitants. On a comparable basis "
  "(Insee BPE 2025), density is 26.9 per 1 000 inhabitants in Paris, against 17.9 in Lyon, 17.2 in Marseille and 16.1 in Lille. The total "
  "number of outlets changed little: it fell by 0.8% over 2023-2026 and by 4.6% since 2000. Their composition changed far more:")
B("**Growing:** cafés and restaurants gained 555 outlets (+3.6%), gyms 70 (+14%) and medical practices 53 (+2.4%).")
B("**Declining:** clothing lost 310 shops and footwear 100. Home equipment fell by 5.3%, bank, insurance and estate agencies by 12.1%, and "
  "car-related businesses by 17.9%.")
P("These are the same sectoral forces seen in national data: growth in food and beverage, and decline in clothing and bank branches "
  "(Insee, 2026).", before=2)
P("Vacancy is rising, as in other large cities. It reached 11.7% in 2026, against 10.9% in 2023 and 9.1% in 2014. It is highest in the 2nd "
  "arrondissement (15.6%), where wholesalers have left the Sentier district, and in the 18th (15.1%), and lowest in the 16th (7.3%) (Apur, 2026).")

H("Regulating use: protected retail frontages")
P("Since 2006, the local land-use plan (*plan local d'urbanisme*, PLU) has prohibited changes of use along designated retail frontages. The "
  "bioclimatic PLU adopted in November 2024 extended these frontages by 35 km. About 61% of Paris shops are located on them, and vacancy there "
  "is lower (9.8%). Protected streets are also the strongest shopping streets, however, so this gap does not measure the effect of the rule.")

H("Controlling premises: Paris Commerces")
P("Paris Commerces, the City's operator for local retail and crafts, rests on one principle: there is no policy to preserve local retail "
  "without control of the premises.")
P("*Origins.*", after=2, keep=True)
B("**2004, Vital'Quartier:** to address the concentration of textile wholesalers in the 11th arrondissement, the City delegated its commercial "
  "pre-emption right, for a limited period, to its development company, the Semaest. The Semaest bought ground-floor premises and re-let them to local shops.")
B("**2008 and 2017:** the operation was extended in 2008 (Vital'Quartier 2), then continued from 2017 under the Contrat Paris'Commerces, a "
  "commercial and craft revitalisation contract.")
B("**2013:** the Semaest and the Caisse des dépôts created the Foncière Paris Commerces, presented as the first public property company "
  "dedicated to local retail in France.")
B("**2023:** the Semaest merged with the GIE Paris Commerces, which lets the vacant premises of the City's social landlords. The merger created Paris Commerces.")
P("*Model.* The operator combines three complementary tools:", before=4, after=2, keep=True)
B("a semi-public company (*société d'économie mixte*) that pre-empts or buys premises in private buildings, renovates them and lets them;")
B("a property company, with no staff of its own, that buys back these premises to keep them over the long term and protect fragile "
  "activities, such as a bookshop threatened by the sale of its premises;")
B("the GIE, which lets the premises of social landlords. Social landlords own about 7 400 ground-floor premises, and the GIE re-let 1 648 "
  "of them between 2017 and 2025.")
P("Paris Commerces manages the whole chain: analysing the mix of activities in each neighbourhood, then acquisition, works, letting, property "
  "management and promotion. Premises are delivered fully fitted: facade, accessibility, compliance with the City's climate plan, and technical "
  "equipment anticipated, such as extraction ducts for a bakery. Tenants pay no entry fee or key money, which sharply reduces their start-up "
  "costs. Premises are let only to independent retailers and craft businesses, never to chains or franchises. The pariscommerces.fr website "
  "acts as a one-stop shop, with 200 to 250 listings at any time and about 500 000 visitors a year. The operator also prospects actively and "
  "works with business support networks such as chambers of commerce and crafts and incubators. Paris Commerces has EUR 200 million over five "
  "years to acquire 250 to 300 premises, with a focus on 12 revitalisation areas, 8 of them on the edge of the city.", before=2)
P("*Results.*", after=2, keep=True)
B("**Shops installed or kept:** the Vital'Quartier operations installed or kept about 650 local shops and reduced single-activity "
  "concentration in the target areas.")
B("**Leverage effect:** once a few premises are under public control, private investors tend to follow, as in rue du Château-d'Eau "
  "(10th arrondissement). The objective has therefore shifted from fighting single-activity concentration to preserving retail diversity.")
B("**Limits in priority neighbourhoods:** action there remains limited. The company can only pre-empt units in co-owned buildings, whereas "
  "ground floors in these neighbourhoods often belong to social landlords.")
B("**Measuring wider benefits:** with Datactivist, Paris Commerces carried out the EXCOM study. It identified 18 positive externalities of "
  "local retail, covering social ties, solidarity, neighbourhood life, health and safety, the environment and public space. In 2025, it "
  "launched an open simulator that estimates their monetary value.")
P("*Digital and green transition.* Since 2015, the CoSto (Connected Stores) programme has helped retailers use digital tools. It began by "
  "testing solutions offered by start-ups. It now offers free three-month in-store coaching by students trained in digital marketing (social "
  "media, customer loyalty, emailing, showcase or e-commerce websites), with the aim of making retailers autonomous. Retailers installed by "
  "Paris Commerces have priority, but any local shop can apply. The green transition is addressed through the works carried out in premises "
  "and the choice of activities installed (short supply chains, bulk, organic), but there is no dedicated training offer.", before=4)
P("*Transferability.* A consulting team supports other local authorities in planning their retail mix and setting up property companies or "
  "public development agreements. Several dozen French cities of all sizes, including Lyon recently, have shown interest in the model, as have "
  "Barcelona, Berlin, Korea and Japan. Its replication is constrained by local budgets, and local retail is rarely a political priority for "
  "local authorities.")

H("Lessons")
P("Planning rules protect the use of ground floors but cannot fill vacant premises. Paris Commerces acts directly on two barriers identified "
  "in Section 5.4: rent levels and the ownership of premises. It shows how public control of ground-floor space can complement planning rules, "
  "especially when combined with the large stock of premises owned by social landlords.")
ph = P("[To complete after the interviews with CCI Paris Île-de-France, the CMA, FACAP and Alliance du Commerce: how retailers and craft "
       "businesses read these trends; the role of rents, tourism and e-commerce; and the lessons of Paris Commerces for other large cities.]",
       italic=True, color=GREY, before=2)
for r in ph.runs: r.font.highlight_color = 7  # jaune
P("Source: Apur (2026), *Les commerces à Paris : tendances de l'enquête 2026*, Note No. 296; Insee, Base permanente des équipements 2025; "
  "Insee (2026), *Insee Première*, No. 2091; interview with Paris Commerces.", 8, GREY, before=6, after=0)

# ---- notes de rédaction (hors encadré)
doc.add_paragraph()
def N(text, bold=False, size=8.5):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(3)
    runs(p, text, size, GREY, bold=bold)
N("Drafting notes (delete before submission)", bold=True, size=9)
for t in ["Budget: EUR 200 million to acquire 250-300 premises (Apur) or to install 200-300 shops (interview)? Confirm with Paris Commerces.",
          "Vacancy 2014: check the note \"10.0% excluding premises under works\" in Apur (2026) and which year it refers to.",
          "Social landlords' 7 400 ground-floor premises: check the base of the \"about 9%\" share before adding it back.",
          "Contrat Paris'Commerces: confirm the legal basis (contrat de revitalisation artisanale et commerciale) before citing the law.",
          "Length: about 1 000 words. The \"Digital and green transition\" paragraph could move to the twin-transition chapter with a cross-reference.",
          "Apur source: the detailed report is expected in December 2026; check the exact title. "
          "https://www.apur.org/sites/default/files/2026-10/12p296_Commerces_Paris_tendances_enquete_2026.pdf"]:
    N("• " + t)
doc.save(OUT); print("ok", OUT)
