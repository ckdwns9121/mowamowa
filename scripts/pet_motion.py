"""Hand-timed acting curves for the Rive pet rigs (60 fps).
The torso never rubber-scales; eyes, head, ears, limbs, props and follow-through
are independent channels. Long held poses separate gestures instead of looping
one sine-wave across every body part.
"""
import math
import json
from pathlib import Path
RAKKO_TIMING=json.loads((Path(__file__).resolve().parent.parent/"src/entities/pet/model/rakko-action.json").read_text())

MODES=['Idle','Focus','Break','Celebrate','React']
DURATIONS=[420,360,480,144,132]

def sample(keys,frame):
    if frame<=keys[0][0]:return keys[0][1]
    for (a,x),(b,y) in zip(keys,keys[1:]):
        if frame<=b:
            t=(frame-a)/(b-a) if b!=a else 1
            t=t*t*(3-2*t)
            return x+(y-x)*t
    return keys[-1][1]

def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)))
    return t*t*(3-2*t)

def rotate(x,y,cx,cy,angle):
    dx,dy=x-cx,y-cy;c,s=math.cos(angle),math.sin(angle)
    return cx+c*dx-s*dy,cy+s*dx+c*dy

def profile(pet,m):
    d=RAKKO_TIMING['frames'] if pet['id']=='rakko' and m==4 else DURATIONS[m];kind=pet['motion'];name=pet['id']
    c={k:[(0,0),(d,0)] for k in ['x','y','head','left','right','lift','earL','earR','tail','gaze','sword','propY','propAngle','fx','stepL','stepR']}
    c['prop']=[(0,0),(d,0)]
    c['y']=[(0,0),(100,-.8),(220,0),(330,-.7),(d,0)] if m==0 else [(0,0),(d,0)]
    if m==0:
        c['head']=[(0,0),(52,0),(77,-.035),(101,-.035),(129,0),(d,0)]
        c['gaze']=[(0,0),(49,0),(64,-2.1),(113,-2.1),(132,0),(d,0)]
        c['earL']=[(0,0),(174,0),(181,-.13),(194,.055),(208,0),(d,0)]
        c['earR']=[(0,0),(184,0),(191,.1),(207,-.035),(219,0),(d,0)]
        if kind=='shy':c['right']=[(0,0),(240,0),(258,-.4),(277,-.2),(291,-.43),(312,0),(d,0)]
        elif kind in ['sway','dance']:c['left']=[(0,0),(250,0),(271,.4),(289,.21),(310,0),(d,0)]
        elif kind=='flutter':c['tail']=[(0,0),(110,.1),(180,-.065),(247,.09),(305,0),(d,0)]
        elif kind=='nod':c['head']=[(0,0),(100,0),(122,.025),(150,0),(d,0)]
    elif m==1:
        c['head']=[(0,0),(18,.035),(90,.035),(112,.045),(128,.02),(180,.035),(d,.035)]
        c['gaze']=[(0,0),(20,.8),(210,.8),(236,-.8),(275,.8),(d,.8)]
        c['left']=[(0,0),(20,.12),(180,.12),(197,.2),(216,.12),(d,.12)]
        c['right']=[(0,0),(20,-.12),(180,-.12),(197,-.2),(216,-.12),(d,-.12)]
        if name=='rakko':c['prop']=[(0,0),(10,1),(d,1)];c['sword']=[(0,-.65),(24,-.22),(d,-.22)]
        elif pet.get('prop'):c['prop']=[(0,0),(18,1),(d,1)]
    elif m==2:
        c['head']=[(0,0),(48,.04),(95,.04),(126,-.06),(184,-.06),(228,0),(d,0)]
        c['left']=[(0,0),(56,.08),(108,.65),(166,.65),(210,0),(d,0)]
        c['right']=[(0,0),(63,-.08),(116,-.62),(168,-.62),(222,0),(d,0)]
        c['earL']=[(0,0),(106,-.1),(170,-.1),(230,0),(d,0)]
        c['earR']=[(0,0),(112,.11),(177,.11),(235,0),(d,0)]
        if name=='kurimanju':
            c['left']=[(0,0),(55,0),(82,-.22),(153,-.22),(192,0),(d,0)]
            c['lift']=[(0,0),(55,0),(87,-18),(154,-18),(192,0),(d,0)]
            c['head']=[(0,0),(70,0),(91,-.045),(149,-.045),(185,.035),(225,0),(d,0)]
        elif pet.get('prop') in ['book','bowl']:
            c['prop']=[(0,0),(42,1),(240,1),(274,0),(d,0)]
            c['left']=[(0,0),(50,.1),(250,.1),(285,0),(d,0)];c['right']=[(0,0),(50,-.1),(250,-.1),(285,0),(d,0)]
            c['propY']=[(0,0),(75,-6),(180,-6),(250,0),(d,0)]
    elif m==3:
        c['fx']=[(0,0),(20,0),(31,1),(84,.8),(108,0),(d,0)]
        c['head']=[(0,0),(12,.045),(30,-.025),(76,-.025),(102,0),(d,0)]
        c['left']=[(0,0),(12,-.1),(29,.75),(42,.48),(56,.78),(73,.45),(91,0),(d,0)]
        c['right']=[(0,0),(14,.1),(33,-.7),(46,-.48),(59,-.75),(77,-.4),(96,0),(d,0)]
        if kind=='hop':
            c['y']=[(0,0),(13,3),(25,-19),(37,1),(46,-13),(59,1),(73,0),(d,0)]
            c['earL']=[(0,0),(14,-.1),(26,.1),(39,-.2),(48,.1),(62,-.12),(80,0),(d,0)]
            c['earR']=[(0,0),(17,.13),(29,-.09),(42,.18),(51,-.12),(65,.09),(85,0),(d,0)]
            c['head']=[(0,0),(16,.02),(34,-.025),(55,.025),(83,0),(d,0)]
        elif kind=='flutter':
            c['y']=[(0,0),(15,2),(36,-14),(61,-14),(92,-3),(114,0),(d,0)]
            c['x']=[(0,0),(26,-3),(54,7),(87,-3),(113,0),(d,0)]
            c['tail']=[(0,0),(20,-.14),(39,.18),(55,-.12),(75,.14),(100,0),(d,0)]
        elif kind=='hero':
            c['x']=[(0,0),(15,-3),(31,5),(49,5),(71,0),(d,0)]
            c['head']=[(0,0),(16,-.035),(29,.065),(44,.065),(71,0),(d,0)]
            if name=='rakko':
                c['prop']=[(0,0),(8,1),(92,1),(118,0),(d,0)]
                c['sword']=[(0,-.3),(17,-.85),(32,.4),(48,.36),(68,-.22),(99,-.22),(121,-.3),(d,-.3)]
                c['left']=[(0,0),(14,.1),(32,.35),(49,.35),(79,0),(d,0)]
                c['right']=[(0,0),(14,-.1),(32,-.35),(49,-.35),(79,0),(d,0)]
        elif kind=='bow':
            c['head']=[(0,0),(12,-.025),(37,.13),(62,.13),(88,-.025),(108,0),(d,0)]
            c['left']=[(0,0),(22,.16),(74,.16),(102,0),(d,0)];c['right']=[(0,0),(22,-.16),(74,-.16),(102,0),(d,0)]
        elif kind=='dance':
            c['x']=[(0,0),(18,-5),(36,5),(55,-5),(74,5),(96,0),(d,0)]
            c['stepL']=[(0,0),(18,-4),(36,0),(55,-4),(74,0),(d,0)]
            c['stepR']=[(0,0),(18,0),(36,-4),(55,0),(74,-4),(96,0),(d,0)]
            c['head']=[(0,0),(18,-.045),(36,.045),(55,-.045),(74,.045),(96,0),(d,0)]
        elif kind=='shy':
            c['left']=[(0,0),(30,0),(52,.15),(83,0),(d,0)]
            c['right']=[(0,0),(18,0),(38,-.62),(49,-.32),(62,-.62),(78,-.32),(98,0),(d,0)]
            c['head']=[(0,0),(20,-.04),(79,-.04),(103,0),(d,0)]
        elif kind=='nod':
            c['left']=[(0,0),(18,0),(36,-.22),(63,-.22),(87,0),(d,0)]
            c['lift']=[(0,0),(18,0),(36,-16),(63,-16),(87,0),(d,0)]
            c['head']=[(0,0),(36,0),(51,.07),(70,0),(d,0)]
    else:
        c['head']=[(0,0),(9,-.025),(23,-.025),(43,.08),(74,.08),(100,0),(d,0)]
        c['gaze']=[(0,0),(21,0),(31,2.6),(77,2.6),(99,0),(d,0)]
        c['earL']=[(0,0),(10,-.2),(29,.04),(44,0),(d,0)]
        c['earR']=[(0,0),(13,.18),(32,-.04),(48,0),(d,0)]
        c['right']=[(0,0),(32,0),(48,-.48),(66,-.22),(82,-.45),(104,0),(d,0)]
        if kind=='flutter':c['tail']=[(0,0),(20,-.1),(41,.16),(67,-.08),(101,0),(d,0)]
        if name=='rakko':c['head']=[(0,0),(15,-.04),(37,.075),(62,.075),(90,0),(d,0)];c['right']=[(0,0),(d,0)]
    if pet.get('prop') in ['pouch','clipboard','bowl','book'] and m==3:
        c['prop']=[(0,0),(17,1),(95,1),(117,0),(d,0)]
        c['propY']=[(0,0),(30,-8),(72,-8),(104,0),(d,0)]
    if 'crop' in pet:
        # The bitmap hands are welded to the body in the source illustration.
        # Do not pretend these are independently drawn arm/head/foot parts.
        for channel in ['head','left','right','lift','stepL','stepR']:
            c[channel]=[(0,0),(d,0)]
    return c

def blinks(pet,index,m):
    d=RAKKO_TIMING['frames'] if pet['id']=='rakko' and m==4 else DURATIONS[m]
    if m==0:times=[87+(index%5)*7,271+(index%4)*9]
    elif m==1:times=[217+(index%5)*6]
    elif m==2:times=[75,264,359]
    elif m==3:times=[]
    else:times=[11,101]
    points=[(0,1)]
    for t in [t for t in times if t+9<d]:points.extend([(t-3,1),(t,.06),(t+2,.06),(t+9,1)])
    if m==2:points.extend([(120,1),(144,.38),(204,.38),(228,1)])
    if m==3:points.extend([(15,1),(27,.06),(79,.06),(94,1)])
    points.append((d,1));return sorted(dict(points).items())

def animate(art,pet,index,rig,el,keyed):
    ids=[];w,h=rig['width'],rig['height'];root=rig['root'];groups=rig['groups']
    for m,mode in enumerate(MODES):
        duration=RAKKO_TIMING['frames'] if pet['id']=='rakko' and m==4 else DURATIONS[m];c=profile(pet,m)
        anim=el('LinearAnimation',art,name=mode,duration=duration,loopValue='loop' if m<3 else 'oneShot');ids.append(anim.get('id'))
        origin_x,origin_y=(0,100) if rig.get('spin') else (128,228)
        if pet['id']=='rakko' and m==4:
            c['x']=[(0,0),(duration,0)];c['y']=[(0,0),(duration,0)];c['gaze']=[(0,0),(duration,0)]
        keyed(anim,root,13,[(f,origin_x+v) for f,v in c['x']]);keyed(anim,root,14,[(f,origin_y+v) for f,v in c['y']])
        if rig.get('spin'):
            spin=rig['spin']
            # Keep every direction at its drawn proportions; never flatten or mirror.
            keyed(anim,spin,15,[(0,0),(duration,0)])
            keyed(anim,rig['facing'],16,[(0,1),(duration,1)])
            if m==4:
                keyed(anim,spin,14,[(0,128),(8,131),(14,114),(22,106),(40,106),(54,116),(62,128),(68,125),(77,128),(duration,128)])
                zoom=[(0,1),(8,.98),(16,.93),(22,.90),(48,.93),(62,1),(duration,1)]
                start=RAKKO_TIMING['spinStart'];span=RAKKO_TIMING['spinFrames'];turns=RAKKO_TIMING['turns']
                for direction,obj in enumerate(rig['angleFrames']):
                    visible=int(direction==0)
                    points=[(0,visible)]
                    for step in range(span+1):
                        active=round(turns*step/span*8)%8
                        points.append((start+step,int(active==direction)))
                    points.append((duration,visible))
                    keyed(anim,obj,18,points,hold=True)
            else:
                keyed(anim,spin,14,[(0,128),(duration,128)])
                zoom=[(0,1),(duration,1)]
                for direction,obj in enumerate(rig['angleFrames']):
                    visible=int(direction==0)
                    keyed(anim,obj,18,[(0,visible),(duration,visible)],hold=True)
            keyed(anim,spin,16,zoom);keyed(anim,spin,17,zoom)
            for effect in rig['actionFx']:
                kind=effect['kind'];obj=effect['id']
                if m!=4:
                    keyed(anim,obj,18,[(0,0),(duration,0)])
                    continue
                if kind=='wind':
                    keyed(anim,obj,18,[(0,0),(14,0),(19,.85),(51,.85),(61,0),(duration,0)])
                    keyed(anim,obj,15,[(0,-.16),(16,-.16),(34,.16),(55,-.12),(duration,-.12)])
                    keyed(anim,obj,16,[(0,.6),(14,.6),(30,1),(54,1.05),(duration,1.05)])
                    keyed(anim,obj,17,[(0,.6),(14,.6),(30,1),(54,1.05),(duration,1.05)])
                elif kind=='trail':
                    index=effect['index'];delay=index*3
                    keyed(anim,obj,18,[(0,0),(13+delay,0),(20+delay,.65-index*.12),(48,.7-index*.12),(59,0),(duration,0)])
                    keyed(anim,obj,15,[(0,-.3+index*.25),(14,-.3+index*.25),(54,.5+index*.25),(duration,.5+index*.25)],linear=True)
                    keyed(anim,obj,14,[(0,157-index*17),(14,157-index*17),(52,135-index*17),(duration,135-index*17)])
                elif kind=='glint':
                    index=effect['index'];start=15+index*4
                    angle=index*math.tau/8
                    keyed(anim,obj,18,[(0,0),(start,0),(start+4,1),(start+12,.8),(start+19,0),(duration,0)])
                    keyed(anim,obj,13,[(0,128+math.cos(angle)*83),(start,128+math.cos(angle)*83),(start+19,128+math.cos(angle)*113),(duration,128+math.cos(angle)*113)])
                    keyed(anim,obj,14,[(0,120+math.sin(angle)*77),(start,120+math.sin(angle)*77),(start+19,108+math.sin(angle)*88),(duration,108+math.sin(angle)*88)])
                    keyed(anim,obj,15,[(0,0),(start,0),(start+19,1.6),(duration,1.6)])
                    for axis in [16,17]:keyed(anim,obj,axis,[(0,.2),(start,.2),(start+6,1.2),(start+19,.3),(duration,.3)])
                elif kind=='shockwave':
                    keyed(anim,obj,18,[(0,0),(64,0),(68,.8),(87,0),(duration,0)])
                    for axis in [16,17]:keyed(anim,obj,axis,[(0,.45),(64,.45),(87,2.15),(duration,2.15)])
                elif kind=='ripple':
                    keyed(anim,obj,18,[(0,0),(58,0),(63,.85),(80,0),(duration,0)])
                    for axis in [16,17]:keyed(anim,obj,axis,[(0,.35),(58,.35),(80,1.35),(duration,1.35)])
                else:
                    angle=effect['angle'];radius=effect['radius']
                    keyed(anim,obj,18,[(0,0),(58,0),(64,1),(78,.8),(duration,0)])
                    keyed(anim,obj,13,[(0,128),(58,128),(84,128+math.cos(angle)*radius),(duration,128+math.cos(angle)*radius)])
                    keyed(anim,obj,14,[(0,220),(58,220),(79,220-math.sin(angle)*radius),(duration,224-math.sin(angle)*radius)])
                    keyed(anim,obj,15,[(0,0),(60,0),(duration,angle*2)])
        # Stable volume: no whole-character stretch/squash and no idle pendulum rotation.
        keyed(anim,root,15,[(0,0),(duration,0)]);keyed(anim,root,16,[(0,1),(duration,1)]);keyed(anim,root,17,[(0,1),(duration,1)])
        keyed(anim,rig['effects'],18,c['fx'])
        for spark in rig['sparks']:
            keyed(anim,spark,15,[(0,0),(duration,.55 if m==3 else 0)])
            keyed(anim,spark,16,[(0,.7),(duration*.35,1.15 if m==3 else .7),(duration,.7)])
            keyed(anim,spark,17,[(0,.7),(duration*.35,1.15 if m==3 else .7),(duration,.7)])
        if rig.get('prop'):
            prop=rig['prop'];keyed(anim,prop['root'],18,c['prop'])
            keyed(anim,prop['root'],14,[(f,prop['y']+v) for f,v in c['propY']])
            keyed(anim,prop['root'],15,c['sword'] if pet.get('prop')=='sword' else c['propAngle'])
        eye_keys=[(0,1),(duration,1)] if pet['id']=='rakko' and m==4 else blinks(pet,index,m)
        if rig.get('eyeHead'):
            keyed(anim,rig['eyeHead'],15,c['head'])
        for lid in rig.get('closedEyes',[]):
            keyed(anim,lid,18,[(f,1 if value<.12 else 0) for f,value in eye_keys])
        for eye in rig.get('eyes',[]):
            keyed(anim,eye,17,eye_keys)
            keyed(anim,eye,13,c['gaze'])
        if groups:
            for limb,key in [('handL','left'),('handR','right'),('head','head')]:keyed(anim,groups[limb],15,c[key])
            for foot,key in [('footL','stepL'),('footR','stepR')]:
                keyed(anim,groups[foot],14,[(f,rig['pivots'][foot][1]+v) for f,v in c[key]])
            if pet['vector']!='pajama':
                keyed(anim,groups['eye'],17,eye_keys)
                keyed(anim,groups['eye'],18,[(f,0 if value<.12 else 1) for f,value in eye_keys])
                keyed(anim,groups['eyelid'],18,[(f,1 if value<.12 else 0) for f,value in eye_keys])
        # A genuine bone rig: key joints, not thousands of per-frame mesh coordinates.
        for name,bone in rig.get('bones',{}).items():
            if name=='body':continue
            if name in ['stepL','stepR']:
                keyed(anim,bone,14,[(f,rig['bonePivots'][name][1]+v) for f,v in c[name]])
            else:keyed(anim,bone,15,c[name])
            if name=='left':keyed(anim,bone,14,[(f,rig['bonePivots'][name][1]+v) for f,v in c['lift']])
    return ids
