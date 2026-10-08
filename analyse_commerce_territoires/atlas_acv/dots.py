import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
im=np.array(Image.open('hi-23.png').convert('RGB')).astype(int)
H,W,_=im.shape
pal={1:(220,219,236),2:(163,159,203),3:(106,81,163),4:(63,0,125)}
dots=[]
def comps(mask,cls):
    lab,n=ndi.label(mask)
    for i,sl in enumerate(ndi.find_objects(lab),1):
        h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
        area=(lab[sl]==i).sum()
        if 14<=h<=40 and 14<=w<=40 and abs(h-w)<=4 and area/(h*w)>0.6:
            dots.append(dict(x=(sl[1].start+sl[1].stop)/2,y=(sl[0].start+sl[0].stop)/2,d=(h+w)/2,cls=cls))
for c,col in pal.items():
    dist=np.abs(im-np.array(col)).sum(2)
    comps(dist<36,c)
# class 0: white interior circles (fill ~251,250,252) — require ring of purple around
white=(im.min(2)>=247)&(im[:,:,2]>=im[:,:,0])
lab,n=ndi.label(white)
for i,sl in enumerate(ndi.find_objects(lab),1):
    h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
    if 10<=h<=36 and 10<=w<=36 and abs(h-w)<=4:
        area=(lab[sl]==i).sum()
        if area/(h*w)>0.6:
            y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
            ring=im[max(0,y0-4):y1+4,max(0,x0-4):x1+4]
            pur=((ring[:,:,2]-ring[:,:,1])>40).sum()
            if pur>30: dots.append(dict(x=(x0+x1)/2,y=(y0+y1)/2,d=(h+w)/2,cls=0))
json.dump(dots,open('dots.json','w'))
from collections import Counter
print(len(dots), Counter(d['cls'] for d in dots))
