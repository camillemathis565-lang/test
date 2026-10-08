import json, numpy as np, pandas as pd
from pyproj import Transformer
from scipy.spatial import cKDTree
from scipy import ndimage as ndi
from PIL import Image
acv=pd.read_csv('../acv/cdc.csv',sep=';',dtype=str)
acv[['lat','lon']]=acv.centroid.str.split(',',expand=True).astype(float)
acv=acv[acv['Code Officiel Département'].str.len()==2].copy()
acv=acv[~acv['Code Officiel Département'].isin(['2A','2B'])]
t=Transformer.from_crs(4326,2154,always_xy=True)
acv['X'],acv['Y']=t.transform(acv.lon.values,acv.lat.values)
acv['idf']=acv['Code Officiel Région']=='11'
def feats(S,deg):
    return np.c_[np.ones(len(S)),S] if deg==1 else np.c_[np.ones(len(S)),S,S**2,S[:,:1]*S[:,1:]]
def fit(S,Dp,deg): c,*_=np.linalg.lstsq(feats(S,deg),Dp,rcond=None); return c
def blobs(img, mask, minw=10, maxw=140):
    lab,n=ndi.label(mask); out=[]
    for i,sl in enumerate(ndi.find_objects(lab),1):
        h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
        if minw<=h<=maxw and minw<=w<=maxw and abs(h-w)<=max(4,0.25*max(h,w)):
            area=(lab[sl]==i).sum()
            if area/(h*w)>0.55: out.append(((sl[1].start+sl[1].stop)/2,(sl[0].start+sl[0].stop)/2,(h+w)/2))
    return np.array(out)
def register(D, ctrl, sub, label, tol=25):
    S=sub[['X','Y']].values/1000; names=list(sub.lib_com)
    cs=np.array([S[names.index(n)] for n,_ in ctrl]); cd=np.array([p for _,p in ctrl])
    coef=fit(cs,cd,1); deg=1; tree=cKDTree(D[:,:2])
    for it in range(6):
        P=feats(S,deg)@coef; dist,j=tree.query(P,k=2)
        ok=(dist[:,0]<tol)&(dist[:,1]>1.4*dist[:,0])
        deg=2 if ok.sum()>30 else 1
        coef=fit(S[ok],D[j[ok,0],:2],deg)
    P=feats(S,deg)@coef; dist,j=tree.query(P,k=2)
    print(label,'matches',int(((dist[:,0]<tol)).sum()),'/',len(S),'median',np.median(dist[:,0]).round(1))
    return P,dist,j
