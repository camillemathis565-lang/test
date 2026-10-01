import sys; sys.path.insert(0,".")
from data import *
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment

NAVY="003087"; BAND="0070C0"; TINT="EBF4FB"; GREY="F2F2F2"
FONT="Arial"
f_body=Font(name=FONT,size=10); f_head=Font(name=FONT,size=10,bold=True,color="FFFFFF")
f_title=Font(name=FONT,size=14,bold=True,color=NAVY); f_bold=Font(name=FONT,size=10,bold=True)
f_note=Font(name=FONT,size=9,italic=True,color="595959"); f_link=Font(name=FONT,size=10,color="0563C1",underline="single")
fill_head=PatternFill("solid",fgColor=NAVY); fill_tint=PatternFill("solid",fgColor=TINT)
thin=Side(style="thin",color="D9D9D9"); border=Border(bottom=thin)
wrap=Alignment(wrap_text=True,vertical="top"); center=Alignment(horizontal="center",vertical="top",wrap_text=True)
src={s[0]:s for s in SOURCES}

wb=Workbook()

def header(ws,row,cols,widths):
    for j,(c,w) in enumerate(zip(cols,widths),1):
        cell=ws.cell(row=row,column=j,value=c); cell.font=f_head; cell.fill=fill_head
        cell.alignment=Alignment(wrap_text=True,vertical="center")
        ws.column_dimensions[get_column_letter(j)].width=w
    ws.row_dimensions[row].height=32

def title(ws,t,sub):
    ws["A1"]=t; ws["A1"].font=f_title
    ws["A2"]=sub; ws["A2"].font=f_note

# --- Lisez-moi
ws=wb.active; ws.title="Lisez-moi"
ws.sheet_view.showGridLines=False
ws.column_dimensions["A"].width=30; ws.column_dimensions["B"].width=110
rows=[
 ("Zones commerciales périphériques, centres-villes et QPV : base de chiffres pour l'état de l'art",None),
 ("Étude de cas France, OCDE (division PME). Version du 1er octobre 2026.",None),
 ("",None),
 ("Objet","Rassembler les chiffres publiés sur le développement des zones commerciales périphériques et sur la situation des centres-villes et des QPV. Les chiffres ne sont pas comparés ni combinés entre eux : chacun est rattaché à sa source, à son année et à ce qu'il mesure."),
 ("Onglet « Chiffres »","Un chiffre par ligne. Filtrer par thème, par source ou par niveau de vérification avec les flèches de l'en-tête."),
 ("Onglet « Sources »","Liste des documents, avec le nombre de chiffres repris dans l'onglet « Chiffres » (calculé automatiquement)."),
 ("Onglet « Données manquantes »","Données et documents qui manquent pour évaluer pleinement l'influence des zones périphériques sur les centres-villes et les QPV, avec le détenteur, l'accès et une démarche suggérée."),
 ("Onglet « Calculs propres (Sirene) »","Nos propres calculs sur le répertoire Sirene (2012-2025). Ce ne sont pas des chiffres publiés : à présenter séparément de l'état de l'art."),
 ("Onglet « Synthèse »","Décompte des chiffres par thème et par niveau de vérification (formules)."),
 ("",None),
 ("Colonnes de l'onglet « Chiffres »",None),
 ("Indicateur","Ce qui est mesuré, formulé de façon à être compris hors contexte."),
 ("Valeur / Unité","Valeur telle que publiée. Les pourcentages sont saisis en points (65 = 65 %). Une valeur textuelle signale une fourchette ou un ratio."),
 ("Année(s) de référence","Année ou période à laquelle se rapporte le chiffre (et non l'année de publication)."),
 ("Territoire","Champ géographique couvert."),
 ("Ce que le chiffre prend en compte","Définition, champ statistique, panel : c'est la colonne à lire avant de rapprocher deux chiffres."),
 ("Vérification","Niveau de confiance dans la reprise du chiffre (voir légende ci-dessous)."),
 ("",None),
 ("Légende : vérification",None),
 (V_A,"Chiffre relu le 1er octobre 2026 dans le document d'origine."),
 (V_B,"Chiffre relevé sur la page ou le document d'origine pendant la recherche documentaire, sans nouvelle relecture."),
 (V_C,"Chiffre lu dans un document qui cite la source d'origine (article de presse, synthèse, autre rapport)."),
 (V_D,"Origine du chiffre non identifiée ou chiffre issu d'une synthèse automatique : à vérifier avant toute citation."),
 (V_E,"Chiffre repris de la présentation OCDE (diapositives), avec les sources indiquées sur la diapositive, non revérifié ici."),
 ("",None),
 ("Ajouter un chiffre","Insérer une ligne dans l'onglet « Chiffres », renseigner toutes les colonnes et utiliser une référence de l'onglet « Sources » (ajouter la source si elle est nouvelle). Les listes déroulantes « Thème », « Type de source » et « Vérification » garantissent des catégories homogènes."),
 ("Précautions","Plusieurs indicateurs proches ont des champs différents (ex. vacance « tous sites », « rues marchandes », « centres-villes ACV » ; surfaces CDAC selon la CNAC ou selon Kyris / Procos). Comparer uniquement des chiffres de même champ et de même source."),
]
for i,(a,b) in enumerate(rows,1):
    ca=ws.cell(row=i,column=1,value=a); ca.font=f_body; ca.alignment=wrap
    if b is not None:
        cb=ws.cell(row=i,column=2,value=b); cb.font=f_body; cb.alignment=wrap
        ca.font=f_bold
ws["A1"].font=f_title; ws["A2"].font=f_note
for r in (11,19): ws.cell(row=r,column=1).font=Font(name=FONT,size=11,bold=True,color=NAVY)
for r in range(20,25): ws.cell(row=r,column=1).font=f_body

# --- Chiffres
ws=wb.create_sheet("Chiffres")
title(ws,"Chiffres publiés","Un chiffre par ligne. Pourcentages saisis en points (65 = 65 %).")
cols=["N°","Thème","Indicateur","Valeur","Unité","Année(s) de référence","Territoire","Ce que le chiffre prend en compte (champ, définition)","Réf. source","Source","Date de publication","Type de source","Vérification","Lien","Remarques"]
widths=[6,26,42,11,14,15,20,52,8,34,13,24,30,30,40]
HR=4; header(ws,HR,cols,widths)
r=HR
themes=[]
for i,(th,ind,val,unit,yrs,terr,per,ref,ver,rem) in enumerate(F,1):
    r+=1
    s=src[ref]
    if th not in themes: themes.append(th)
    vals=[i,th,ind,val,unit,yrs,terr,per,ref,f"{s[1]}, {s[2]}",s[3],s[4],ver,s[5],rem]
    for j,v in enumerate(vals,1):
        c=ws.cell(row=r,column=j,value=v); c.font=f_body; c.alignment=wrap; c.border=border
        if j==14 and v: c.hyperlink=v; c.font=f_link
    ws.cell(row=r,column=4).alignment=Alignment(horizontal="right",vertical="top")
    if isinstance(val,float): ws.cell(row=r,column=4).number_format="0.0##"
    elif isinstance(val,int): ws.cell(row=r,column=4).number_format="#,##0"
    ws.cell(row=r,column=6).number_format="@"
last=r
ws.freeze_panes=ws.cell(row=HR+1,column=4)
ws.auto_filter.ref=f"A{HR}:{get_column_letter(len(cols))}{last}"
# listes déroulantes (plages nommées sur un onglet caché)
lists=wb.create_sheet("Listes")
for k,(name,items) in enumerate([("Themes",themes),("Types",[T_STAT,T_INST,T_ADM,T_PRIV,T_PRESSE,T_ACAD,T_LOI]),("Verif",[V_A,V_B,V_C,V_D,V_E])],1):
    for n,it in enumerate(items,1): lists.cell(row=n,column=k,value=it)
lists.sheet_state="hidden"
nth=len(themes)
for col,ref in (("B",f"Listes!$A$1:$A${nth}"),("L","Listes!$B$1:$B$7"),("M","Listes!$C$1:$C$5")):
    dv=DataValidation(type="list",formula1=ref,allow_blank=True); dv.error="Choisir une valeur de la liste"; dv.showErrorMessage=False
    ws.add_data_validation(dv); dv.add(f"{col}{HR+1}:{col}{last+300}")

# --- Sources
ws2=wb.create_sheet("Sources")
title(ws2,"Sources","Le nombre de chiffres est calculé à partir de l'onglet « Chiffres » (0 = source utilisée seulement pour l'analyse qualitative).")
cols2=["Réf.","Auteur / organisme","Titre","Date de publication","Type de source","Lien","Nb de chiffres dans l'onglet « Chiffres »"]
header(ws2,HR,cols2,[7,34,60,16,26,40,14])
for i,s in enumerate(SOURCES):
    rr=HR+1+i
    for j,v in enumerate(s,1):
        c=ws2.cell(row=rr,column=j,value=v); c.font=f_body; c.alignment=wrap; c.border=border
        if j==6 and v: c.hyperlink=v; c.font=f_link
    c=ws2.cell(row=rr,column=7,value=f'=COUNTIF(Chiffres!$I${HR+1}:$I${last+300},A{rr})'); c.font=f_body; c.alignment=center; c.border=border
ws2.freeze_panes="B5"; ws2.auto_filter.ref=f"A{HR}:G{HR+len(SOURCES)}"
dv=DataValidation(type="list",formula1="Listes!$B$1:$B$7",allow_blank=True,showErrorMessage=False); ws2.add_data_validation(dv); dv.add(f"E{HR+1}:E{HR+len(SOURCES)+100}")

# --- Données manquantes
ws3=wb.create_sheet("Données manquantes")
title(ws3,"Données et sources manquantes pour une évaluation complète","Ce qu'il faudrait pour mesurer l'influence propre des zones périphériques sur les centres-villes et les QPV, et non une simple corrélation.")
cols3=["N°","Catégorie","Besoin d'évaluation","Donnée ou document manquant","Producteur / détenteur","Ce que cela permettrait de mesurer","Conditions d'accès","Statut dans nos travaux","Priorité","Démarche suggérée"]
header(ws3,HR,cols3,[5,20,32,44,26,44,30,22,10,40])
prio_fill={"Haute":PatternFill("solid",fgColor="FCE4D6"),"Moyenne":PatternFill("solid",fgColor="FFF2CC"),"Basse":PatternFill("solid",fgColor=GREY)}
for i,g in enumerate(GAPS,1):
    rr=HR+i
    for j,v in enumerate((i,)+g,1):
        c=ws3.cell(row=rr,column=j,value=v); c.font=f_body; c.alignment=wrap; c.border=border
    ws3.cell(row=rr,column=9).fill=prio_fill[g[7]]; ws3.cell(row=rr,column=9).alignment=center
ws3.freeze_panes="D5"; ws3.auto_filter.ref=f"A{HR}:J{HR+len(GAPS)}"
dv=DataValidation(type="list",formula1='"Haute,Moyenne,Basse"',allow_blank=True); ws3.add_data_validation(dv); dv.add(f"I{HR+1}:I{HR+len(GAPS)+100}")

# --- Calculs propres
ws4=wb.create_sheet("Calculs propres (Sirene)")
title(ws4,"Calculs propres sur le répertoire Sirene (non publiés)","Ne pas mélanger avec l'état de l'art. Méthode et limites : analyse_commerce_territoires/rapport.html (dépôt du projet).")
cols4=["N°","Indicateur","Valeur","Unité","Année(s)","Champ","Source des données"]
header(ws4,HR,cols4,[5,60,12,18,12,60,40])
for i,o in enumerate(OWN,1):
    rr=HR+i
    for j,v in enumerate((i,)+o+("Insee, Sirene (sept. 2026) ; Cerema, EmpCom ; ANCT, QPV 2024. Calculs propres.",),1):
        c=ws4.cell(row=rr,column=j,value=v); c.font=f_body; c.alignment=wrap; c.border=border
    c=ws4.cell(row=rr,column=3); c.alignment=Alignment(horizontal="right",vertical="top")
    c.number_format="#,##0" if isinstance(o[1],int) else "0.0#"
ws4.freeze_panes="C5"

# --- Synthèse (formules)
ws5=wb.create_sheet("Synthèse")
title(ws5,"Synthèse","Nombre de chiffres par thème et par niveau de vérification (calculé à partir de l'onglet « Chiffres »).")
verifs=[V_A,V_B,V_C,V_D,V_E]
short=["A - Relu","B - Consulté","C - Relais","D - À vérifier","E - Présentation"]
header(ws5,HR,["Thème"]+short+["Total"],[44,12,12,12,12,14,10])
rng=f"Chiffres!$B${HR+1}:$B${last+300}"; vrng=f"Chiffres!$M${HR+1}:$M${last+300}"
for i,th in enumerate(themes):
    rr=HR+1+i
    ws5.cell(row=rr,column=1,value=th).font=f_body
    for k,v in enumerate(verifs):
        col=get_column_letter(2+k)
        c=ws5.cell(row=rr,column=2+k,value=f'=COUNTIFS({rng},$A{rr},{vrng},"{v}")'); c.font=f_body; c.alignment=center
    c=ws5.cell(row=rr,column=7,value=f"=SUM(B{rr}:F{rr})"); c.font=f_bold; c.alignment=center
tr=HR+1+len(themes)
ws5.cell(row=tr,column=1,value="Total").font=f_bold
for k in range(2,8):
    col=get_column_letter(k); c=ws5.cell(row=tr,column=k,value=f"=SUM({col}{HR+1}:{col}{tr-1})"); c.font=f_bold; c.alignment=center; c.fill=fill_tint
ws5.cell(row=tr,column=1).fill=fill_tint
ws5.cell(row=tr+2,column=1,value="Légende complète des niveaux : onglet « Lisez-moi ».").font=f_note

for w in wb.worksheets:
    w.sheet_properties.pageSetUpPr.fitToPage=True
    w.page_setup.orientation="landscape"; w.page_setup.fitToWidth=1; w.page_setup.fitToHeight=0
wb.move_sheet("Listes",offset=10)
out="/home/user/test/etat_de_l_art/chiffres_zones_commerciales_centres_villes_QPV.xlsx"
wb.save(out); print(out,last)
