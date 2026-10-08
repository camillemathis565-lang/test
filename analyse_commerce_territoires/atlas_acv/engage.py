import sys
exec(open('page.py').read())
def register_generic(page, pal, xmin=1250, sat_thr=50, minw=8, maxw=70):
    im=np.array(Image.open(f'hi-{page}.png').convert('RGB')).astype(int)
    sat=(im.max(2)-im.min(2))>sat_thr; sat[:,:xmin]=False
    lab,n=ndi.label(sat); pts=[]
    for i,sl in enumerate(ndi.find_objects(lab),1):
        h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
        if minw<=h<=maxw and minw<=w<=maxw and abs(h-w)<=0.35*max(h,w):
            cy,cx=ndi.center_of_mass(lab[sl]==i); y,x=int(sl[0].start+cy),int(sl[1].start+cx)
            col=im[sl][lab[sl]==i].mean(0)
            cls=min(pal,key=lambda k:np.abs(col-np.array(pal[k])).sum()) if pal else 0
            pts.append((sl[1].start+cx, sl[0].start+cy, (h+w)/2, cls))
    R=np.array(pts)
    P23=feats(acv[['X','Y']].values/1000,2)@ref(acv[~acv.idf])
    best=None
    for k in np.arange(0.6,1.5,0.01):
        V=(R[None,:,:2]-k*P23[:,None,:]).reshape(-1,2)
        H,xe,ye=np.histogram2d(V[:,0],V[:,1],bins=[np.arange(-3000,3000,10),np.arange(-3000,3000,10)])
        i=np.unravel_index(H.argmax(),H.shape)
        if best is None or H[i]>best[0]: best=(H[i],k,xe[i[0]]+5,ye[i[1]]+5)
    _,k,tx,ty=best; P=k*P23+np.array([tx,ty]); S=acv[['X','Y']].values/1000
    tree=cKDTree(R[:,:2])
    for it in range(5):
        dist,j=tree.query(P,k=1); ok=dist<10
        if ok.sum()>=20: P=feats(S,2)@fit(S[ok],R[j[ok],:2],2)
    dist,j=tree.query(P,k=1)
    out=acv[['insee_com','lib_com']].copy(); out['present']=dist<9; out['cls']=np.where(dist<9,R[j,3],np.nan); out['d']=dist.round(1)
    print(page,'blobs',len(R),'votes',best[0],'k',round(best[1],2),'cities with symbol',int(out.present.sum()),'median d (present)',np.median(dist[dist<9]).round(1))
    return out
