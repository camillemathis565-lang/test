import sys, json, numpy as np, pandas as pd
from PIL import Image
from scipy import ndimage as ndi
from scipy.spatial import cKDTree
exec(open('geo.py').read())
# transformation de référence p23 (points fiables)
a23=pd.read_csv('atlas_vacance_2025.csv',dtype={'insee_com':str}); d23=json.load(open('dots.json'))
def ref(sub):
    m=sub.merge(a23[a23.fiable],left_on='insee_com',right_on='insee_com')
    S=m[['X','Y']].values/1000; Dp=np.array([[d23[i]['x'],d23[i]['y']] for i in m.dot_id])
    return fit(S,Dp,2)
def detect(im, pal, tol=36, minw=12, maxw=60, ring_white=None):
    pts=[]
    for c,col in pal.items():
        dist=np.abs(im-np.array(col)).sum(2)
        for x,y,d in blobs(im, dist<tol, minw, maxw): pts.append((x,y,d,c))
    return np.array(pts)
def locate(pts, sub, coef0, tol=30, region=None):
    S=sub[['X','Y']].values/1000
    D=pts if region is None else pts[region(pts)]
    tree=cKDTree(D[:,:2]); coef=coef0; deg=2
    for it in range(6):
        P=feats(S,deg)@coef; dist,j=tree.query(P,k=2)
        ok=(dist[:,0]<tol)&(dist[:,1]>1.4*dist[:,0])
        if ok.sum()<12: break
        coef=fit(S[ok],D[j[ok,0],:2],2)
    P=feats(S,deg)@coef; dist,j=tree.query(P,k=2)
    out=sub[['insee_com','lib_com']].copy(); out['cls']=D[j[:,0],3]; out['d1']=dist[:,0].round(1); out['d2']=dist[:,1].round(1); out['px']=P[:,0].round(); out['py']=P[:,1].round()
    print('  matches<6px',int((dist[:,0]<6).sum()),'/',len(S),'median',np.median(dist[:,0]).round(1))
    return out, coef
