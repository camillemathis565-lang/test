import json, numpy as np, pandas as pd
from pyproj import Transformer
from scipy.spatial import cKDTree
dots=[d for d in json.load(open('dots.json'))]
D=np.array([[d['x'],d['y']] for d in dots]); C=np.array([d['cls'] for d in dots])
# zones: carte principale (x>1300) et encart IDF (x<1250, y>1600)
main=(D[:,0]>1300); idf=(D[:,0]<1250)&(D[:,1]>1600)
acv=pd.read_csv('../acv/cdc.csv',sep=';',dtype=str)
acv[['lat','lon']]=acv.centroid.str.split(',',expand=True).astype(float)
acv=acv[acv['Code Officiel Département'].str.len()==2].copy()   # hors DROM
t=Transformer.from_crs(4326,2154,always_xy=True)
acv['X'],acv['Y']=t.transform(acv.lon.values,acv.lat.values)
isidf=acv['Code Officiel Région']=='11'
def fit(src,dst,deg=1):
    A=np.c_[np.ones(len(src)),src] if deg==1 else np.c_[np.ones(len(src)),src,src**2,src[:,:1]*src[:,1:]]
    coef,*_=np.linalg.lstsq(A,dst,rcond=None); return coef
def apply(coef,src,deg=1):
    A=np.c_[np.ones(len(src)),src] if deg==1 else np.c_[np.ones(len(src)),src,src**2,src[:,:1]*src[:,1:]]
    return A@coef
def run(sub, dmask, ctrl, label):
    S=sub[['X','Y']].values/1000; Dz=D[dmask]; Cz=C[dmask]; idx=np.where(dmask)[0]
    names=list(sub.lib_com)
    cs=np.array([S[names.index(n)] for n,_ in ctrl]); cd=np.array([p for _,p in ctrl])
    coef=fit(cs,cd); deg=1
    tree=cKDTree(Dz)
    for it in range(6):
        P=apply(coef,S,deg); dist,j=tree.query(P,k=2)
        ok=(dist[:,0]<25)&(dist[:,1]>1.6*dist[:,0])
        # unicité : un point ne sert qu'une fois
        uj,cnt=np.unique(j[ok,0],return_counts=True); dup=set(uj[cnt>1])
        ok&=~np.isin(j[:,0],list(dup))
        deg=2 if ok.sum()>30 else 1
        coef=fit(S[ok],Dz[j[ok,0]],deg)
        print(label,'iter',it,'matches',ok.sum(),'/',len(S),'median err',np.median(dist[ok,0]).round(1))
    P=apply(coef,S,deg); dist,j=tree.query(P,k=2)
    out=sub[['insee_com','lib_com']].copy()
    out['cls']=Cz[j[:,0]]; out['d1']=dist[:,0].round(1); out['d2']=dist[:,1].round(1)
    out['dot_id']=idx[j[:,0]]
    return out
ctrl_main=[('Calais',(2424,270)),('Perpignan',(2568,2136)),('Quimper',(1514,894)),('Haguenau',(3304,726)),('Bayonne',(1852,1936)),('Gap',(3094,1696))]
ctrl_idf=[('Mantes-la-Jolie',(406,1818)),('Nemours',(784,2240)),('Meaux',(856,1844)),('Étampes',(570,2146))]
r1=run(acv[~isidf],main,ctrl_main,'main')
r2=run(acv[isidf],idf,ctrl_idf,'idf')
res=pd.concat([r1,r2])
# conflits : deux villes sur le même point
dup=res.dot_id.duplicated(keep=False)
res['fiable']=(res.d1<14)&(res.d2>1.5*res.d1)&~dup
LAB={0:'< 5 %',1:'5-10 %',2:'10-15 %',3:'15-20 %',4:'> 20 %'}
res['vacance_2025']=res.cls.map(LAB)
res.to_csv('atlas_vacance_2025.csv',index=False)
print(res.fiable.value_counts()); print(res[~res.fiable].to_string())
