"""Recover published line vertices, not new model outputs, from PDF figures.

Requires PyMuPDF. Inputs are unchanged source figures saved with this site.
Axis mappings are calibrated from vector tick marks, not image pixels.
"""
from pathlib import Path
import hashlib,json,math
import fitz
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'dist/assets/source-figures'

def vertices(d):
    points=[]
    for item in d['items']:
        assert item[0]=='l',item[0]
        if not points: points.append([item[1].x,item[1].y])
        assert abs(points[-1][0]-item[1].x)<1e-3 and abs(points[-1][1]-item[1].y)<1e-3
        points.append([item[2].x,item[2].y])
    return points

def model(color):
    if max(color)<.05:return 'PartMC'
    return 'AeroMELD' if color[0]>.8 else 'Sectional'

def source(name):
    p=SOURCE/name
    return {'file':'assets/source-figures/'+name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}

rollout=fitz.open(SOURCE/'rollout.pdf')[0]
paths=rollout.get_drawings()
# Number panel: x ticks 0 and 48 h. y ticks 1750 and 2750 cm^-3.
x0,x1=384.9119873046875,622.511962890625
y1750,y2750=172.71990966796875,51.54620361328125
number={}
for d in paths:
    r=d['rect']
    if d['type']=='s' and len(d['items'])==48 and 380<r.x0<390 and r.x1>620:
        xy=vertices(d)
        number[model(d['color'])]=[[round((x-x0)/(x1-x0)*48,6),round(1750+(y1750-y)/(y1750-y2750)*1000,6)] for x,y in xy]
assert set(number)=={'PartMC','AeroMELD','Sectional'}
for curve in number.values():
    assert len(curve)==49
    assert all(abs(t-i)<1e-4 for i,(t,n) in enumerate(curve))
# Latent panel: x 0..48; zero tick 136.653564 and unit tick 108.830750.
latent=[]
for d in paths:
    r=d['rect']
    if d['type']=='s' and len(d['items'])==48 and 70<r.x0<72 and r.x1<310 and r.y1<190:
        if d['dashes']=='[] 0':
            latent.append({'color':'#'+''.join(f'{round(c*255):02x}' for c in d['color']),'PartMC':vertices(d)})
        else:
            assert latent
            latent[-1]['AeroMELD']=vertices(d)
for i,item in enumerate(latent):
    item['coordinate']='z'+str(i+1)
    for name in ['PartMC','AeroMELD']:
        item[name]=[[round((x-71.28)/237.6*48,6),round((136.653564453125-y)/(136.653564453125-108.83074951171875),6)] for x,y in item[name]]
assert len(latent)==9

spectra={}
for kind,filename in [('ccn','ccn.pdf'),('freezing','freezing.pdf')]:
    page=fitz.open(SOURCE/filename)[0]
    spectra[kind]={}
    for case in ['complex','simple']:
        spectra[kind][case]={}
        for d in page.get_drawings():
            r=d['rect']
            if d['type']!='s' or len(d['items'])!=99 or not (66<r.x0<67 and 305<r.x1<307):continue
            if (case=='complex')!=(r.y0<250):continue
            xy=vertices(d);out=[]
            for x,y in xy:
                u=(x-66.52799987792969)/(306.2584228515625-66.52799987792969)
                if kind=='ccn':
                    zero=221.59634399414062 if case=='complex' else 479.5199890136719
                    one=46.946014404296875 if case=='complex' else 304.86962890625
                    xx=10**(-3+2*u);yy=(zero-y)/(zero-one)
                else:
                    top=39.959991455078125 if case=='complex' else 297.88360595703125
                    bottom=221.59634399414062 if case=='complex' else 479.5199890136719
                    xx=-40+40*u;yy=10**((top-y)/(bottom-top)*10)
                out.append([float(f'{xx:.10g}'),float(f'{yy:.10g}')])
            spectra[kind][case][model(d['color'])]=out
        assert set(spectra[kind][case])=={'PartMC','AeroMELD','Sectional'}
result={'provenance':{
    'method':'Original PDF vector line vertices mapped to the original axes. Display playback interpolates these vertices; no simulation is rerun.',
    'rollout':{**source('rollout.pdf'),'repository':'tangwhiap/paper_AeroMELD-coag','git_blob':'349b3da0a8cf744a8f28a5a99877e74c0f6664f1','manuscript_git_blob':'02cf283d961f72d49c995c285f98a0ab54bdcf5d','note':'Figure asset read from 3_outline/figures/figure02_rollout_example.pdf; manuscript context is recorded separately.'},
    'ccn':{**source('ccn.pdf'),'url':'https://arxiv.org/src/2609.31271','member':'figures/spec-mix-CCN.pdf','panels':['a','d']},
    'freezing':{**source('freezing.pdf'),'url':'https://arxiv.org/src/2609.31271','member':'figures/spec-mix-INP.pdf','panels':['a','d']},
    'supersaturation':'Dimensionless supersaturation, plotted on the source axis from 0.001 to 0.1. The browser does not relabel these values as percentages.',
    'freeze_domain':'Source curves are retained outside the plot floor; the displayed log axis is 1e-10 to 1, matching the source ticks.'
},'number':number,'latent':latent,'spectra':spectra}
(ROOT/'dist/assets/paper-traces.json').write_text(json.dumps(result,separators=(',',':')))
print('Extracted 3 number trajectories, 18 latent curves, and 12 diagnostic spectra.')
print('Initial number:',number['PartMC'][0][1],'; final number:',number['PartMC'][-1][1])
