"""Author editable Rive meshes/timelines and SVG fallback art. Build with Rive CLI 1.1.1.
No scripts, network lookups, or account publishing are embedded in the assets.
"""
from pathlib import Path
import base64, json, math, re, shutil, xml.etree.ElementTree as ET
from pet_motion import animate, MODES

ROOT = Path(__file__).resolve().parent.parent
PROJECT = ROOT / 'assets/pets'
CATALOG = json.loads((ROOT/'src/entities/pet/model/catalog.json').read_text())
serial = 100

def uid():
    global serial
    serial += 1
    return f'0:{serial}'

def el(tag, parent=None, **attrs):
    node = ET.Element(tag, {k: str(v) for k,v in attrs.items()})
    if 'id' not in attrs: node.set('id',uid())
    if parent is not None: parent.append(node)
    return node

def varint(value):
    data=[]
    while value>127: data.append((value&127)|128); value >>= 7
    return bytes(data+[value])

def keyed(anim, obj, prop, points):
    node=el('KeyedObject',anim,objectId=obj)
    channel=el('KeyedProperty',node,propertyKey=prop)
    for frame,value in points:
        key=el('KeyFrameDouble',channel,frame=frame,value=round(value,5),interpolationType='cubic')
        el('CubicEaseInterpolator',key,x1=.42,y1=0,x2=.58,y2=1)

def paint(shape,fill,stroke='#503e38',width=3.3):
    if stroke:
        st=el('Stroke',shape,thickness=width,cap='round',join='round')
        el('SolidColor',st,colorValue='FF'+stroke.lstrip('#'))
    if fill:
        el('SolidColor',el('Fill',shape),colorValue='FF'+fill.lstrip('#'))

def vector_art(kind,color):
    # Painter's order, back to front. Limb groups have separate animation pivots.
    shapes=[]
    def oval(name,x,y,w,h,fill,stroke='#503e38',group='body',width=3.3):
        shapes.append(dict(name=name,tag='ellipse',x=x,y=y,w=w,h=h,fill=fill,stroke=stroke,group=group,width=width))
    def path(name,d,fill,stroke='#503e38',group='body',width=3.3):
        shapes.append(dict(name=name,tag='path',d=d,fill=fill,stroke=stroke,group=group,width=width))
    if kind=='pajama':
        oval('Left foot',-24,-3,26,16,color,group='footL');oval('Right foot',24,-3,26,16,color,group='footR')
        oval('Left sleeve',-65,-65,28,39,color,group='handL');oval('Right sleeve',65,-65,28,39,color,group='handR')
        oval('Pajamas',0,-62,122,113,color)
        path('Nightcap','M -54 -127 Q -72 -179 -34 -190 Q -12 -202 10 -188 Q 26 -176 44 -163 L 52 -146 Z',color,group='head')
        oval('Pompom',43,-164,23,23,'#fbf6e9',group='head')
        oval('Hood',0,-112,145,142,color,group='head')
        oval('Hood lining',0,-112,123,119,'#eae7cc',group='head',width=2.4)
        oval('Soft face',0,-111,113,107,'#7b968a',group='head',width=2)
        for x in [-25,-17,17,25]:path('Face stitch',f'M {x} -111 L {x-2} -104',None,group='head',width=2)
        path('Collar stitch','M -11 -47 Q 0 -35 11 -47',None,width=2.5)
        oval('Button one',0,-31,5,5,'#7b968a',stroke=None)
        oval('Button two',0,-17,5,5,'#7b968a',stroke=None)
    elif kind=='ode':
        oval('Left leg',-34,-12,42,35,'#e8d0a0',group='footL');oval('Right leg',34,-12,42,35,'#e8d0a0',group='footR')
        oval('Left arm',-68,-66,40,68,'#eddaad',group='handL');oval('Right arm',68,-66,40,68,'#eddaad',group='handR')
        oval('Broad body',0,-69,143,139,'#efddb1')
        oval('Head',0,-133,143,109,'#f4e2b7',group='head')
        path('Tuft','M -13 -187 L -16 -198 M 0 -186 L 0 -200 M 13 -187 L 16 -198',None,group='head',width=3.5)
        oval('Single eye',0,-141,57,48,'#fffdf4',group='eye')
        oval('Single pupil',0,-139,13,26,'#493831',stroke=None,group='eye')
        oval('Eye sparkle',-3,-146,4,6,'#ffffff',stroke=None,group='eye')
        oval('Left cheek',-49,-113,18,9,'#eeb9a9',stroke=None,group='head');oval('Right cheek',49,-113,18,9,'#eeb9a9',stroke=None,group='head')
        path('Lips','M -31 -102 Q -10 -113 0 -108 Q 11 -113 31 -102 Q 20 -79 0 -84 Q -19 -79 -31 -102 Z','#c8a77f',group='head')
        path('Smile','M -23 -101 Q 0 -93 23 -101',None,group='head',width=2.6)
        path('Belly','M -14 -50 Q 0 -43 14 -50',None,stroke='#c7aa83',width=2)
    else:
        path('Striped tail','M 52 -49 Q 90 -63 93 -103 Q 118 -70 95 -39 Q 77 -21 52 -26 Z','#b8cbb0')
        for y in [-55,-69,-82]:path('Tail stripe',f'M 89 {y} L 106 {y+8}',None,stroke='#72806a',width=4)
        path('Left wing','M -55 -103 Q -97 -134 -101 -111 Q -105 -94 -72 -80 Q -95 -93 -99 -82 Q -93 -64 -61 -62 Z','#fff9e9')
        path('Right wing','M 55 -103 Q 97 -134 101 -111 Q 105 -94 72 -80 Q 95 -93 99 -82 Q 93 -64 61 -62 Z','#fff9e9')
        oval('Left paw',-37,-6,41,27,'#604b41',group='footL');oval('Right paw',37,-6,41,27,'#604b41',group='footR')
        path('Fluffy body','M -73 -82 Q -86 -105 -72 -119 L -82 -124 L -68 -132 Q -84 -152 -64 -164 L -48 -178 L -37 -174 Q -19 -194 -5 -181 Q 12 -195 25 -180 Q 44 -193 53 -174 L 67 -174 L 66 -159 Q 87 -152 77 -132 L 87 -120 L 76 -111 Q 86 -89 73 -75 L 78 -61 L 65 -54 Q 65 -15 42 -10 L 22 -14 L 10 -6 L -6 -13 L -25 -7 L -39 -15 Q -71 -20 -64 -54 L -78 -61 Z','#fff8e5')
        path('Horn','M -8 -172 Q -7 -203 11 -213 Q 17 -186 10 -170 Z','#e8af79',group='head')
        oval('Left eye',-31,-124,18,26,'#614b3f',stroke=None,group='eye');oval('Right eye',31,-124,18,26,'#614b3f',stroke=None,group='eye')
        oval('Left glint',-34,-130,6,7,'#ffffff',stroke=None,group='eye');oval('Right glint',28,-130,6,7,'#ffffff',stroke=None,group='eye')
        oval('Left blush',-50,-105,21,12,'#f1b7b7',stroke=None,group='head');oval('Right blush',50,-105,21,12,'#f1b7b7',stroke=None,group='head')
        path('Mouth','M -17 -103 Q -13 -94 0 -100 Q 14 -94 18 -104 L 12 -80 Q 0 -67 -10 -83 Z','#71504a',group='head')
        path('Tongue','M -7 -84 Q 1 -94 11 -84 Q 13 -72 2 -70 Q -8 -74 -7 -84 Z','#e4a0a0',width=2,group='head')
        oval('Left arm',-59,-53,26,36,'#fff8e5',group='handL');oval('Right arm',59,-53,26,36,'#fff8e5',group='handR')
        for x in [-66,-58,-50,50,58,66]:path('Claw',f'M {x} -42 L {x+1} -35',None,width=2)
    return shapes

def path_vertices(d):
    tokens=re.findall(r'[MLQCZ]|-?\d+(?:\.\d+)?',d); i=0; verts=[]; closed=False
    while i<len(tokens):
        cmd=tokens[i];i+=1
        if cmd=='Z':closed=True;continue
        n={'M':2,'L':2,'Q':4,'C':6}[cmd]; args=list(map(float,tokens[i:i+n]));i+=n
        if cmd=='M':
            # Separate contour handled by caller; own shapes use one contour except decorative strokes.
            verts.append({'p':args,'in':args,'out':args});continue
        end=args[-2:];v={'p':end,'in':end,'out':end}
        if cmd=='Q':
            start=verts[-1]['p'];control=args[:2]
            verts[-1]['out']=[start[j]+(control[j]-start[j])*2/3 for j in [0,1]]
            v['in']=[end[j]+(control[j]-end[j])*2/3 for j in [0,1]]
        elif cmd=='C':verts[-1]['out']=args[:2];v['in']=args[2:4]
        verts.append(v)
    return verts,closed

def add_vector(root,pet):
    shapes=vector_art(pet['vector'],pet.get('color','#fff8e5'))
    # Each group is an explicit rig channel; native vector drawings also supply SVG fallbacks.
    group_ids={}; groups={}; restores={}
    kind=pet['vector']
    pivots={'body':(0,0),'head':(0,-80),'eye':(0,-139 if kind=='ode' else -124),
        'handL':(-60,-96) if kind=='ode' else (-54,-83) if kind=='pajama' else (-56,-68),
        'handR':(60,-96) if kind=='ode' else (54,-83) if kind=='pajama' else (56,-68),
        'footL':(-24,-12),'footR':(24,-12)}
    for name in ['body','head','eye','handL','handR','footL','footR']:
        x,y=pivots[name];groups[name]=el('Node',name=name,x=x,y=y);group_ids[name]=groups[name].get('id')
        restores[name]=el('Node',groups[name],name=f'{name} bind pose',x=-x,y=-y)
    for s in shapes:
        node=el('Shape',restores[s['group']],name=s['name'])
        if s['tag']=='ellipse':
            node.set('x',str(s['x']));node.set('y',str(s['y']));el('Ellipse',node,width=s['w'],height=s['h'])
        else:
            for contour in re.findall(r'M[^M]+',s['d']):
                verts,closed=path_vertices(contour);p=el('PointsPath',node,isClosed=str(closed).lower())
                for v in verts:
                    x,y=v['p'];ix,iy=v['in'];ox,oy=v['out']
                    el('CubicDetachedVertex',p,x=x,y=y,inRotation=math.atan2(iy-y,ix-x),inDistance=math.hypot(ix-x,iy-y),outRotation=math.atan2(oy-y,ox-x),outDistance=math.hypot(ox-x,oy-y))
        paint(node,s['fill'],s['stroke'],s['width'])
    # Shape order front first, then independent groups in front-to-back visual order.
    for group in restores.values():group[:]=reversed(list(group))
    restores['head'].insert(0,groups['eye'])
    if kind!='pajama':
        lid=el('Node',name='Closed expression',opacity=0);group_ids['eyelid']=lid.get('id')
        restores['head'].insert(0,lid)
        if kind=='ode':draw_path(lid,'Single closed eye','M -26 -139 Q 0 -147 26 -139',stroke='#493831',width=3.1)
        else:
            draw_path(lid,'Left closed eye','M -40 -124 Q -31 -130 -22 -124',stroke='#614b3f',width=2.8)
            draw_path(lid,'Right closed eye','M 22 -124 Q 31 -130 40 -124',stroke='#614b3f',width=2.8)
    for name in ['head','handL','handR','body','footL','footR']:root.append(groups[name])
    svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g transform="translate(128 228)">']
    # Match the native front-to-back group order in ordinary SVG painter order.
    for group in ['footR','footL','body','handR','handL','head','eye']:
        for s in shapes:
            if s['group']!=group:continue
            a=f'fill="{s["fill"] or "none"}" stroke="{s["stroke"] or "none"}" stroke-width="{s["width"]}" stroke-linecap="round" stroke-linejoin="round"'
            svg.append(f'<ellipse cx="{s["x"]}" cy="{s["y"]}" rx="{s["w"]/2}" ry="{s["h"]/2}" {a}/>' if s['tag']=='ellipse' else f'<path d="{s["d"]}" {a}/>')
    svg.append('</g></svg>');(ROOT/f'public/pets/{pet["id"]}.svg').write_text(''.join(svg))
    return group_ids,pivots

def add_mesh(root,pet):
    cx,cy,cw,ch=pet['crop'];scale=min(194/cw,202/ch);w,h=cw*scale,ch*scale
    bones={};pivots={};bone_list=[]
    def bone(name,x,y,parent=None):
        owner=parent if parent is not None else root
        node=el('RootBone',owner,name=name,x=x,y=y,length=1)
        bones[name]=node.get('id');pivots[name]=(x,y);bone_list.append(name)
        return node
    bone('body',0,0)
    # The atlas has connected silhouettes, not isolated limb artwork. Keep the
    # body rigid; only ears/tail have controlled influences away from the torso.
    ear_limit=.36 if pet['id']=='usagi' else .22
    if pet['id'] in ['chiikawa','hachiware','usagi','momonga','shisa','furuhonya']:
        for side,ex in enumerate([.39,.61] if pet['id']=='usagi' else [.22,.78]):
            bone('earL' if side==0 else 'earR',(ex-.5)*w,(ear_limit-1)*h)
    if pet.get('tail'):
        _,_,jx,jy=pet['tail'];bone('tail',(jx-.5)*w,(jy-1)*h)
    image=el('Image',root,assetId='0:1',name='Original illustration')
    xs=[i/18 for i in range(19)];ys=[i/20 for i in range(21)]
    points=[(x,y) for y in ys for x in xs]
    boundary=[(x,0) for x in xs]+[(1,y) for y in ys[1:]]+[(x,1) for x in reversed(xs[:-1])]+[(0,y) for y in reversed(ys[1:-1])]
    ordered=boundary+[p for p in points if p not in boundary];lookup={p:i for i,p in enumerate(ordered)};indices=[]
    for iy in range(len(ys)-1):
        for ix in range(len(xs)-1):
            a,b,c,d=[lookup[p] for p in [(xs[ix],ys[iy]),(xs[ix+1],ys[iy]),(xs[ix+1],ys[iy+1]),(xs[ix],ys[iy+1])]];indices.extend([a,b,c,a,c,d])
    mesh=el('Mesh',image,name='Articulated illustration mesh',triangleIndexBytes=base64.b64encode(b''.join(varint(i) for i in indices)).decode())
    from pet_motion import smooth
    for i,(x,y) in enumerate(ordered):
        node=el('ContourMeshVertex' if i<len(boundary) else 'MeshVertex',mesh,x=round((x-.5)*w,4),y=round((y-1)*h,4),u=(cx+x*cw)/3766,v=(cy+y*ch)/463,name=f'v{i}')
        weights={'body':1.0}
        def mix(name,influence):
            influence=max(0,min(1,influence))
            for key in list(weights):weights[key]*=1-influence
            weights[name]=weights.get(name,0)+influence
        if pet['id'] in ['chiikawa','hachiware','usagi','momonga','shisa','furuhonya']:
            for side,ex in enumerate([.39,.61] if pet['id']=='usagi' else [.22,.78]):
                mix('earL' if side==0 else 'earR',(1-smooth(ear_limit-.06,ear_limit,y))*math.exp(-((x-ex)/.21)**4))
        if 'tail' in pet:mix('tail',smooth(.68,.84,x)*(1-smooth(.7,.85,y)))
        weights=sorted(weights.items(),key=lambda item:item[1],reverse=True)[:4];total=sum(v for k,v in weights)
        quantized=[round(v/total*255) for k,v in weights];quantized[0]+=255-sum(quantized)
        packed_indices=sum((bone_list.index(name)+1)<<(8*j) for j,(name,_) in enumerate(weights))
        packed_values=sum(value<<(8*j) for j,value in enumerate(quantized))
        el('Weight',node,indices=packed_indices,values=packed_values)
    skin=el('Skin',mesh,name='Character skeleton',tx=0,ty=0)
    for name in bone_list:
        x,y=pivots[name];el('Tendon',skin,name=name,boneId=bones[name],tx=x,ty=y)
    return bones,pivots,w,h

def draw_path(parent,name,d,fill=None,stroke='#503e38',width=2):
    shape=el('Shape',parent,name=name)
    for contour in re.findall(r'M[^M]+',d):
        verts,closed=path_vertices(contour);path=el('PointsPath',shape,isClosed=str(closed).lower())
        for v in verts:
            x,y=v['p'];ix,iy=v['in'];ox,oy=v['out']
            el('CubicDetachedVertex',path,x=x,y=y,inRotation=math.atan2(iy-y,ix-x),inDistance=math.hypot(ix-x,iy-y),outRotation=math.atan2(oy-y,ox-x),outDistance=math.hypot(ox-x,oy-y))
    paint(shape,fill,stroke,width);return shape

def add_eyes(root,pet,w,h):
    if not pet.get('eyeRects'):return None,[],[]
    cx,cy,cw,ch=pet['crop'];scale=w/cw
    head=el('Node',name='Rigid face pivot',x=0,y=-h*.2)
    restore=el('Node',head,name='Face bind pose',y=h*.2)
    root.insert(0,head);eye_ids=[];closed_ids=[]
    for i,(ex,ey,ew,eh) in enumerate(pet['eyeRects']):
        group=el('Node',restore,name=f'Eye {i+1}',x=(ex+ew/2-cw/2)*scale,y=(ey+eh/2-ch)*scale)
        eyelid=el('Node',group,name='Closed eyelid',opacity=0)
        half=ew*scale*.41
        draw_path(eyelid,'Relaxed eyelid',f'M {-half} 0 Q 0 {-eh*scale*.11} {half} 0',stroke='#412521',width=1.7)
        closed_ids.append(eyelid.get('id'))
        image=el('Image',group,assetId='0:1',name='Original eye, independent blink and gaze')
        mesh=el('Mesh',image,name='Eye texture quad',triangleIndexBytes='AAECAAID')
        for x,y,u,v in [(-ew/2,-eh/2,ex,ey),(ew/2,-eh/2,ex+ew,ey),(ew/2,eh/2,ex+ew,ey+eh),(-ew/2,eh/2,ex,ey+eh)]:
            el('ContourMeshVertex',mesh,x=x*scale,y=y*scale,u=(cx+u)/3766,v=(cy+v)/463)
        eye_ids.append(image.get('id'))
        patch=el('Shape',group,name='Face underneath eye')
        el('Ellipse',patch,width=(ew+5)*scale,height=(eh+5)*scale)
        paint(patch,pet['faceColor'],None)
    return head.get('id'),eye_ids,closed_ids

def add_prop(root,pet):
    kind=pet['prop'];y=-48
    group=el('Node',name=kind+' hand prop',x=61 if kind=='sword' else 0,y=y,opacity=0)
    root.insert(0,group)
    if kind=='sword':
        draw_path(group,'Blade','M -4 -7 L -7 -88 L 0 -106 L 7 -88 L 4 -7 Z','#dce9eb','#465863',2)
        draw_path(group,'Blade facet','M 0 -103 L 0 -10 L 4 -10 L 6 -87 Z','#b9d1d9',None)
        draw_path(group,'Blade edge','M -2 -85 L -2 -20',None,'#ffffff',1.4)
        draw_path(group,'Guard','M -15 -8 Q -17 -3 -13 -1 L 13 -1 Q 17 -3 15 -8 Z','#d4b769','#594d36',2)
        draw_path(group,'Handle','M -4 -1 L -4 15 Q 0 20 4 15 L 4 -1 Z','#746051','#4a3831',2)
        draw_path(group,'Paw','M -7 7 Q -13 4 -13 11 Q -13 19 -4 18 L 6 18 Q 10 14 6 10 Z','#51443b','#412e27',2)
    elif kind in ['book','clipboard']:
        if kind=='book':
            draw_path(group,'Book cover','M -37 -27 L -4 -24 L 0 -20 L 4 -24 L 37 -27 L 37 14 L 2 17 L 0 14 L -2 17 L -37 14 Z','#d59aa8','#6f4b56',2)
            draw_path(group,'Pages','M -32 -30 Q -13 -29 0 -24 Q 13 -29 32 -30 L 32 9 Q 13 9 0 14 Q -13 9 -32 9 Z','#fff9e4','#795951',1.4)
            draw_path(group,'Book spine','M 0 -24 L 0 14',None,'#ad9482',1.3)
            for yy in [-19,-12,-5,2]:
                draw_path(group,'Page lines',f'M -26 {yy} L -7 {yy+3} M 7 {yy+3} L 26 {yy}',None,'#c5b495',1.1)
        else:
            draw_path(group,'Board','M -26 -37 L 26 -37 L 26 13 L -26 13 Z','#c0a77c','#63503a',2)
            draw_path(group,'Paper','M -21 -31 L 21 -31 L 21 8 L -21 8 Z','#fff8df',None)
            draw_path(group,'Clip','M -10 -41 L 10 -41 L 10 -31 L -10 -31 Z','#9ea7a6','#5e6363',2)
            for yy in [-20,-8,4]:
                draw_path(group,'Checklist',f'M -14 {yy} L -11 {yy+3} L -7 {yy-3} M -1 {yy} L 14 {yy}',None,'#7b8c77',1.8)
    elif kind=='pouch':
        draw_path(group,'Bag','M -26 -21 Q 0 -31 26 -21 L 29 13 Q 0 29 -29 13 Z','#e7acba','#705151',2)
        draw_path(group,'Strap','M -18 -21 Q -19 -46 0 -46 Q 19 -46 18 -21',None,'#705151',3)
        draw_path(group,'Stitch','M -19 -3 Q 0 7 19 -3',None,'#bb7b91',1.2)
        draw_path(group,'Tiny face','M -7 -8 L -7 -6 M 7 -8 L 7 -6 M -3 0 Q 0 4 3 0',None,'#705151',2)
    else:
        draw_path(group,'Bowl','M -36 -10 Q -31 25 0 26 Q 31 25 36 -10 Z','#e7b59d','#6c463c',2)
        draw_path(group,'Broth','M -36 -10 Q -36 -24 0 -24 Q 36 -24 36 -10 Q 36 2 0 2 Q -36 2 -36 -10 Z','#eadbaa','#6c463c',2)
        draw_path(group,'Noodles','M -21 -10 Q -10 -20 0 -8 Q 10 3 20 -10 M -20 -4 Q -8 -14 3 -4 Q 15 5 23 -4',None,'#c29e61',2)
        draw_path(group,'Chopsticks','M 9 -19 L 34 -47 M 15 -16 L 41 -43',None,'#bc9465',2.5)
    group[:]=reversed(list(group))
    return {'root':group.get('id'),'y':y}

def make_pet(doc,pet,index):
    artid,styleid,rootid,smid,vmid,instid,propid=[uid() for _ in range(7)]
    art=el('Artboard',doc,id=artid,name=pet['id'],width=256,height=256,x=index*288,y=0,styleId=styleid,defaultStateMachineId=smid,viewModelId=vmid,viewModelInstanceId=instid)
    el('LayoutComponentStyle',art,id=styleid,name='Pet canvas')
    root=el('Node',art,id=rootid,name='Body root',x=128,y=228)
    vectors={};bones={};bonepivots={};height=200;width=170;pivots={};eyes=[];closed=[];eyehead=None
    if 'crop' in pet:
        bones,bonepivots,width,height=add_mesh(root,pet)
        eyehead,eyes,closed=add_eyes(root,pet,width,height)
    else:vectors,pivots=add_vector(root,pet)
    prop=add_prop(root,pet) if pet.get('prop') else None
    effects=el('Node',name='Celebration accents',opacity=0);art.insert(1,effects)
    spark_ids=[]
    for sx,sy,sz in [(46,105,12),(210,79,16),(196,182,9)]:
        spark=el('Shape',effects,name='Soft sparkle',x=sx,y=sy)
        el('Star',spark,width=sz,height=sz,points=4,innerRadius=.26,cornerRadius=1)
        paint(spark,pet['accent'],None);spark_ids.append(spark.get('id'))
    stateids=[uid() for _ in MODES]
    rig={'root':rootid,'width':width,'height':height,'bones':bones,'bonePivots':bonepivots,'groups':vectors,'pivots':pivots,
         'eyes':eyes,'closedEyes':closed,'eyeHead':eyehead,'prop':prop,'effects':effects.get('id'),'sparks':spark_ids}
    animids=animate(art,pet,index,rig,el,keyed)
    vm=el('ViewModel',doc,id=vmid,name='PetState',defaultInstanceId=instid)
    el('ViewModelPropertyNumber',vm,id=propid,name='mood')
    instance=el('ViewModelInstance',vm,id=instid,name='Default',exports='true');el('ViewModelInstanceNumber',instance,viewModelPropertyId=propid,propertyValue=0)
    sm=el('StateMachine',art,id=smid,name='Pet');layer=el('StateMachineLayer',sm,name='Motion')
    any_state=el('AnyState',layer,x=0,y=-160);el('ExitState',layer,x=250,y=-160)
    entry=el('EntryState',layer,x=0,y=0);el('StateTransition',entry,stateToId=stateids[0])
    for i in range(len(MODES)):
        state=el('AnimationState',layer,id=stateids[i],x=200+i*200,y=0,animationId=animids[i],reset='true')
        # Outgoing conditional transitions avoid perpetual self-transition resets.
        for j in range(len(MODES)):
            if i==j:continue
            tr=el('StateTransition',state,stateToId=stateids[j],duration=110 if j>=3 else 220)
            condition=el('TransitionViewModelCondition',tr,opValue='equal')
            bind=el('BindablePropertyNumber',el('TransitionPropertyViewModelComparator',condition))
            el('DataBindContext',bind,sourcePathIds=f'{vmid}-{propid}',propertyKey=636)
            el('TransitionValueNumberComparator',condition,value=j)

if __name__=='__main__':
    doc=ET.Element('Rive',version='1',kind='fragment')
    el('ImageAsset',doc,id='0:1',file='reference/characters.png',name='Official character reference atlas')
    for index,pet in enumerate(CATALOG):make_pet(doc,pet,index)
    ET.indent(doc,space='  ')
    (PROJECT/'scene.rml').write_text(ET.tostring(doc,encoding='unicode')+'\n')
    shutil.copy(PROJECT/'reference/characters.png',ROOT/'public/pets/characters.png')
    print(f'Authored {len(CATALOG)} pet artboards, each with five animation states.')
