"""Read atlas alpha to write crop/anchor metadata. Does not edit the image.
Run: uv run --with pillow python scripts/inspect-rakko-turnaround.py
"""
from pathlib import Path
from PIL import Image
import json, statistics, hashlib

ROOT=Path(__file__).resolve().parent.parent
path=ROOT/'assets/pets/turnaround/rakko-eight-views.png'
im=Image.open(path).convert('RGBA')

def analyze(image,box):
    ox,oy,ex,ey=box
    pixels={(x,y) for y in range(oy,ey) for x in range(ox,ex) if image.getpixel((x,y))[3]>=96}
    largest=[]
    while pixels:
        pending=[pixels.pop()];component=[]
        while pending:
            x,y=pending.pop();component.append((x,y))
            for point in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if point in pixels:pixels.remove(point);pending.append(point)
        if len(component)>len(largest):largest=component
    assert largest,'No character in cell'
    left=min(x for x,y in largest);right=max(x for x,y in largest)+1
    top=min(y for x,y in largest);bottom=max(y for x,y in largest)+1
    rows={}
    for x,y in largest:
        if top+(bottom-top)*.12<=y<=top+(bottom-top)*.32:rows.setdefault(y,[]).append(x)
    head=statistics.median((min(xs)+max(xs))/2 for xs in rows.values())
    crop=[max(ox,left-3),max(oy,top-3),min(ex,right+3),min(ey,bottom+3)]
    return {'bounds':[left,top,right,bottom],'crop':crop,'headCenterX':head,'footY':bottom}

reference=Image.open(ROOT/'assets/pets/reference/characters.png').convert('RGBA')
ref=analyze(reference,(2289,0,2629,362));reference_scale=202/362
base={'headX':(ref['headCenterX']-2289-170)*reference_scale,'footY':(ref['footY']-362)*reference_scale,
      'visibleHeight':(ref['bounds'][3]-ref['bounds'][1])*reference_scale}
frames=[]
for i in range(8):
    col,row=i%4,i//4
    box=(col*im.width//4,row*im.height//2,(col+1)*im.width//4,(row+1)*im.height//2)
    data=analyze(im,box);left,top,right,bottom=data['crop']
    scale=base['visibleHeight']/(data['bounds'][3]-data['bounds'][1])
    vertices=[(left-data['headCenterX'])*scale+base['headX'],(top-data['footY'])*scale+base['footY'],
              (right-data['headCenterX'])*scale+base['headX'],(bottom-data['footY'])*scale+base['footY']]
    frames.append({'angle':i*45,'crop':[left,top,right-left,bottom-top], 'vertices':[round(n,5) for n in vertices]})
result={'width':im.width,'height':im.height,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'originalFront':True,'frames':frames}
(ROOT/'assets/pets/turnaround/rakko-views.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'atlas':[im.width,im.height],'base':base,'frames':frames},ensure_ascii=False))
