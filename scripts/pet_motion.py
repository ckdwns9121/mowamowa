"""Hand-timed acting curves for the Rive pet rigs (60 fps).
The torso never rubber-scales; eyes, head, ears, limbs, props and follow-through
are independent channels. Long held poses separate gestures instead of looping
one sine-wave across every body part.
"""
import math
import json
from pathlib import Path
ACTIONS=json.loads((Path(__file__).resolve().parent.parent/"src/entities/pet/model/pet-action.json").read_text())
RAKKO_TIMING={**ACTIONS['rakkoSpin'],'frames':ACTIONS['actions']['rakko']['frames']}
# Pets whose avatar click plays a dedicated React performance instead of toggling the timer.
PERFORMERS=set(ACTIONS['actions'])

MODES=['Idle','Focus','Break','Celebrate','React']
DURATIONS=[420,360,480,144,132]

def duration_of(pet,m):
    return ACTIONS['actions'][pet['id']]['frames'] if m==4 and pet['id'] in PERFORMERS else DURATIONS[m]

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
    d=duration_of(pet,m);kind=pet['motion'];name=pet['id']
    c={k:[(0,0),(d,0)] for k in ['x','y','tilt','head','left','right','lift','earL','earR','tail','gaze','sword','propY','propAngle','fx','stepL','stepR']}
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
        # Subjugation kata (weapon keys live in kata()); only rigid body moves here.
        if name=='chiikawa':
            c['x']=[(0,0),(240,0),(243,-1),(246,1),(249,-1),(252,0),(256,-2),(266,3),(284,3),(296,0),(304,3),(322,3),(340,0),(d,0)]
            c['tilt']=[(0,0),(256,-.03),(266,.035),(284,.035),(296,0),(304,.035),(322,.035),(340,0),(d,0)]
            c['earL']=c['earL'][:-1]+[(262,0),(267,-.2),(278,0),(300,0),(305,-.2),(316,0),(d,0)]
            c['earR']=c['earR'][:-1]+[(262,0),(267,.2),(278,0),(300,0),(305,.2),(316,0),(d,0)]
        elif name=='hachiware':
            c['x']=[(0,0),(246,0),(256,-3),(266,-3),(276,5),(292,5),(312,0),(d,0)]
            c['tilt']=[(0,0),(246,0),(256,-.05),(266,-.05),(276,.05),(292,.05),(312,0),(d,0)]
            c['y']=[(0,0),(100,-.8),(220,0),(302,0),(312,-7),(324,0),(d,0)]
            c['earL']=c['earL'][:-1]+[(306,0),(314,-.15),(350,-.15),(364,0),(d,0)]
            c['earR']=c['earR'][:-1]+[(306,0),(314,.15),(350,.15),(364,0),(d,0)]
        elif name=='usagi':
            c['y']=[(0,0),(100,-.8),(220,0),(250,0),(260,-10),(271,0),(282,-10),(290,-18),(298,2),(304,0),(d,0)]
            c['earL']=c['earL'][:-1]+[(246,0),(256,.15),(266,-.15),(276,.15),(286,-.15),(298,.25),(312,0),(d,0)]
            c['earR']=c['earR'][:-1]+[(246,0),(256,-.15),(266,.15),(276,-.15),(286,.15),(298,-.25),(312,0),(d,0)]
        if name=='rakko':
            # Idle kata: draw, raise, two quick cuts with a small lunge, sheathe.
            c['prop']=[(0,0),(150,0),(158,1),(285,1),(296,0),(d,0)]
            c['sword']=[(0,-.65),(150,-.65),(170,-.22),(186,-.95),(194,.55),(214,.45),(226,-.8),(234,.6),(256,.4),(280,-.22),(296,-.65),(d,-.65)]
            c['x']=[(0,0),(184,0),(188,-2),(196,4),(214,4),(228,-2),(236,4),(258,0),(d,0)]
            c['fx']=[(0,0),(d,0)]
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
        if name=='chiikawa':
            # Startle: crouch, jump with flicked ears, shaky landing, squeezed-shut
            # crying, then a shy recovery. The bitmap body only moves rigidly.
            c['y']=[(0,0),(7,3),(19,-18),(27,-17),(36,2),(41,0),(d,0)]
            shake=[(0,0),(41,0)]+[(41+i*3,(1.7 if i%2 else -1.7)*(1-i/14)) for i in range(1,14)]+[(84,0),(d,0)]
            c['x']=shake
            c['tilt']=[(0,0),(7,.03),(19,-.04),(36,0),(84,0),(94,-.06),(110,-.06),(d,0)]
            c['earL']=[(0,0),(9,0),(17,-.28),(31,.08),(42,0),(d,0)]
            c['earR']=[(0,0),(9,0),(17,.28),(31,-.08),(42,0),(d,0)]
            c['gaze']=[(0,0),(d,0)]
        elif name in REACTIONS:
            REACTIONS[name](c,d)
        elif name=='hachiware':
            # Singing on the beat: lean-and-step left/right with a hop per beat.
            beats=[0,22,44,66,88,110]
            c['x']=[(beats[0],0)]+[(b,6 if i%2==0 else -6) for i,b in enumerate(beats[1:-1])]+[(beats[-1],0),(d,0)]
            c['tilt']=[(beats[0],0)]+[(b,.07 if i%2==0 else -.07) for i,b in enumerate(beats[1:-1])]+[(beats[-1],0),(d,0)]
            c['y']=[(0,0)]+[p for a,b in zip(beats,beats[1:]) for p in [((a+b)//2,-7),(b,0)]]+[(d,0)]
            c['earL']=[(0,0)]+[(b,-.12 if i%2 else .1) for i,b in enumerate(beats[1:-1])]+[(beats[-1],0),(d,0)]
            c['earR']=[(0,0)]+[(b,.1 if i%2 else -.12) for i,b in enumerate(beats[1:-1])]+[(beats[-1],0),(d,0)]
            c['gaze']=[(0,0),(d,0)]
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
    d=duration_of(pet,m)
    if m==4 and pet['id'] in REACTION_BLINKS:return REACTION_BLINKS[pet['id']]+[(d,1)]
    if m==4 and pet['id']=='chiikawa':return [(0,1),(40,1),(44,.06),(96,.06),(102,1),(d,1)]
    if m==4 and pet['id']=='hachiware':return [(0,1),(8,1),(12,.06),(100,.06),(106,1),(d,1)]
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
        duration=duration_of(pet,m);c=profile(pet,m)
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
        if rig.get('slash'):
            keyed(anim,rig['slash'],18,[(0,0),(191,0),(194,.9),(206,0),(231,0),(234,.9),(246,0),(duration,0)] if m==0 else [(0,0),(duration,0)])
        perform(anim,pet,m,duration,rig,keyed)
        kata(anim,pet,m,duration,rig,keyed)
        # Stable volume: no whole-character stretch/squash; only React performances lean rigidly.
        keyed(anim,root,15,c['tilt']);keyed(anim,root,16,[(0,1),(duration,1)]);keyed(anim,root,17,[(0,1),(duration,1)])
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

def perform(anim,pet,m,d,rig,keyed):
    """Chiikawa/Hachiware click effects; hidden in every other state."""
    for fx in rig.get('performFx',[]):
        obj=fx['id'];kind=fx['kind'];i=fx.get('index',0)
        if m!=4:
            keyed(anim,obj,18,[(0,0),(d,0)]);continue
        if kind=='alert':
            keyed(anim,obj,18,[(0,0),(9,0),(13,1),(36,1),(44,0),(d,0)])
            for axis in [16,17]:keyed(anim,obj,axis,[(0,.3),(9,.3),(14,1.25),(19,1),(d,1)])
            keyed(anim,obj,15,[(0,0),(14,0),(18,.18),(22,-.12),(27,0),(d,0)])
        elif kind=='lines':
            keyed(anim,obj,18,[(0,0),(10,0),(14,1),(30,1),(38,0),(d,0)])
            for axis in [16,17]:keyed(anim,obj,axis,[(0,.6),(10,.6),(18,1.15),(d,1.15)])
        elif kind=='tear':
            start=44+i*16;x,y=fx['x'],fx['y']
            keyed(anim,obj,18,[(0,0),(start,0),(start+4,1),(start+22,.9),(start+30,0),(d,0)])
            keyed(anim,obj,14,[(0,y),(start,y),(start+30,y+24),(d,y+24)])
            keyed(anim,obj,13,[(0,x),(start,x),(start+30,x+fx['drift']),(d,x+fx['drift'])])
            for axis in [16,17]:keyed(anim,obj,axis,[(0,.4),(start,.4),(start+8,1),(start+30,.8),(d,.8)])
        elif kind=='scripted-pop':
            a,b=fx['t0'],fx['t1'];x,y=fx['x'],fx['y'];dx,dy=fx.get('dx',0),fx.get('dy',0)
            keyed(anim,obj,18,[(0,0),(a,0),(a+4,1),(b-8,.95),(b,0),(d,0)])
            if fx.get('arc'):
                # Thrown upward out of a held prop: rise then fall a little.
                keyed(anim,obj,14,[(0,y),(a,y),((a+b)//2,y+dy),(b,y+dy*.7),(d,y+dy*.7)])
                keyed(anim,obj,13,[(0,x),(a,x),(b,x+dx),(d,x+dx)],linear=True)
            else:
                keyed(anim,obj,14,[(0,y),(a,y),(b,y+dy),(d,y+dy)])
                keyed(anim,obj,13,[(0,x),(a,x),(b,x+dx),(d,x+dx)])
            keyed(anim,obj,15,[(0,0),(a,0),(b,fx.get('rot',0)),(d,fx.get('rot',0))])
            s0,s1=fx.get('s0',.4),fx.get('s1',1)
            for axis in [16,17]:keyed(anim,obj,axis,[(0,s0),(a,s0),(a+6,s1*1.15),(a+11,s1),(d,s1)])
        elif kind=='scripted-drop':
            a,land,b=fx['t0'],fx['land'],fx['t1'];x,y=fx['x'],fx['y'];top=y-fx['fall']
            keyed(anim,obj,18,[(0,0),(a,0),(a+3,1),(b-8,1),(b,0),(d,0)])
            keyed(anim,obj,14,[(0,top),(a,top),(land,y),(land+4,y-5),(land+8,y),(d,y)])
            keyed(anim,obj,13,[(0,x),(d,x)])
            for axis in [16,17]:keyed(anim,obj,axis,[(0,1),(d,1)])
        elif kind=='note':
            start=6+i*22;x,y=fx['x'],fx['y'];side=-1 if i%2 else 1
            keyed(anim,obj,18,[(0,0),(start,0),(start+5,1),(start+30,.9),(start+40,0),(d,0)])
            keyed(anim,obj,14,[(0,y),(start,y),(start+40,y-46),(d,y-46)])
            keyed(anim,obj,13,[(0,x),(start,x),(start+20,x+side*10),(start+40,x+side*4),(d,x+side*4)])
            keyed(anim,obj,15,[(0,0),(start,0),(start+10,side*.25),(start+22,-side*.18),(start+34,side*.12),(d,0)])
            for axis in [16,17]:keyed(anim,obj,axis,[(0,.4),(start,.4),(start+7,1.1),(start+14,1),(d,1)])

def kata(anim,pet,m,d,rig,keyed):
    """Idle subjugation kata: the weapon appears suddenly, acts, then vanishes."""
    weapon=rig.get('weapon')
    if not weapon:return
    obj=weapon['id'];gx,gy=weapon['x'],weapon['y'];name=pet['id']
    if m!=0:
        keyed(anim,obj,18,[(0,0),(d,0)])
        for fx in weapon['fx']:keyed(anim,fx['id'],18,[(0,0),(d,0)])
        return
    def pop(start,end):
        keyed(anim,obj,18,[(0,0),(start,0),(start+3,1),(end,1),(end+8,0),(d,0)])
        for axis in [16,17]:keyed(anim,obj,axis,[(0,1),(start,.45),(start+5,1.15),(start+11,1),(end,1),(end+8,.6),(d,1)])
    def flash(fx,a,b,c,e,scale=(.5,1.2)):
        keyed(anim,fx['id'],18,[(0,0),(a,0),(b,1),(c,.9),(e,0),(d,0)])
        for axis in [16,17]:keyed(anim,fx['id'],axis,[(0,scale[0]),(a,scale[0]),(b+4,scale[1]),(d,scale[1])])
    if name=='chiikawa':
        pop(236,372)
        keyed(anim,obj,15,[(0,.15),(236,.15),(256,-.15),(266,.38),(284,.38),(296,-.1),(304,.38),(322,.38),(340,.1),(d,.15)])
        keyed(anim,obj,13,[(0,gx),(256,gx-4),(266,gx+6),(284,gx+6),(296,gx),(304,gx+6),(322,gx+6),(340,gx),(d,gx)])
        for fx in weapon['fx']:
            if fx['kind']=='poke':
                a=264 if fx.get('index',0)==0 else 302;flash(fx,a,a+4,a+14,a+20)
            else:
                flash(fx,242,248,296,306,(.6,1))
                keyed(anim,fx['id'],14,[(0,fx['y']),(242,fx['y']),(306,fx['y']+10),(d,fx['y']+10)])
    elif name=='hachiware':
        pop(236,372)
        keyed(anim,obj,15,[(0,-.2),(236,-.2),(256,-.25),(266,-.25),(276,.55),(292,.55),(312,0),(360,0),(d,-.2)])
        keyed(anim,obj,14,[(0,gy),(302,gy),(312,gy-8),(360,gy-8),(372,gy),(d,gy)])
        for fx in weapon['fx']:
            if fx['kind']=='sweep':flash(fx,268,272,284,294,(1,1))
            else:
                a=314+fx.get('index',0)*8;flash(fx,a,a+5,a+26,a+34)
                keyed(anim,fx['id'],15,[(0,0),(a,0),(a+34,1.2),(d,1.2)])
    else:
        pop(230,350)
        spin=6*math.pi
        # Twirl above the head (clear of the face), then slam beside the body.
        ox,oy=gx-40,-weapon['height']*.8
        keyed(anim,obj,13,[(0,gx),(230,gx),(244,ox),(288,ox),(298,gx),(d,gx)])
        keyed(anim,obj,14,[(0,gy),(230,gy),(244,oy),(288,oy),(298,gy),(d,gy)])
        keyed(anim,obj,15,[(0,0),(244,0),(288,spin),(298,spin+2.3),(358,spin+2.3),(d,0)],linear=True)
        for fx in weapon['fx']:
            kind=fx['kind']
            if kind=='whirl':
                flash(fx,248,254,282,290,(.7,1))
                keyed(anim,fx['id'],13,[(0,ox),(d,ox)]);keyed(anim,fx['id'],14,[(0,oy),(d,oy)])
            elif kind=='slam':flash(fx,297,300,306,322,(.4,1.5))
            else:
                i=fx.get('index',0);dx=[-1,1,-.5,.6][i]*(14+i*4)
                keyed(anim,fx['id'],18,[(0,0),(297,0),(300,1),(316,.8),(328,0),(d,0)])
                keyed(anim,fx['id'],13,[(0,fx['x']),(297,fx['x']),(328,fx['x']+dx),(d,fx['x']+dx)])
                keyed(anim,fx['id'],14,[(0,fx['y']),(297,fx['y']),(312,fx['y']-14-i*3),(328,fx['y']-6),(d,fx['y']-6)])


def _beats(start,step,count,a,b):
    """Alternate between a and b on each beat, returning to 0 one beat later."""
    keys=[(0,0),(start,0)]+[(start+step*(i+1),a if i%2==0 else b) for i in range(count)]
    return keys+[(keys[-1][0]+step,0)]

def _hops(start,step,count,height):
    keys=[(0,0),(start,0)]
    for i in range(count):keys+=[(start+step*i+step//2,-height),(start+step*(i+1),0)]
    return keys

def _usagi(c,d):
    c['y']=[(0,0),(6,3),(16,-12),(26,0),(30,3),(40,-16),(48,0),(52,4),(66,-24),(74,-24),(86,2),(92,0),(d,0)]
    c['tilt']=[(0,0),(16,-.05),(26,0),(40,.05),(48,0),(66,-.04),(80,.04),(92,0),(100,.03),(108,-.03),(116,0),(d,0)]
    c['x']=[(0,0),(16,-4),(26,-4),(40,4),(48,4),(66,0),(d,0)]
    c['earL']=[(0,0),(10,.2),(18,-.25),(30,.2),(42,-.3),(54,.25),(68,-.35),(86,.3),(100,-.1),(112,0),(d,0)]
    c['earR']=[(0,0),(10,-.2),(18,.25),(30,-.2),(42,.3),(54,-.25),(68,.35),(86,-.3),(100,.1),(112,0),(d,0)]
    c['gaze']=[(0,0),(d,0)]

def _momonga(c,d):
    c['y']=[(0,0),(10,2),(34,-16),(70,-14),(92,-16),(108,2),(116,0),(d,0)]
    c['x']=[(0,0),(30,-4),(52,5),(74,-4),(96,3),(112,0),(d,0)]
    c['tilt']=[(0,0),(30,-.06),(52,.06),(74,-.05),(96,.04),(112,0),(d,0)]
    c['tail']=[(0,0),(16,-.18),(32,.2),(48,-.16),(64,.2),(80,-.14),(96,.16),(114,0),(d,0)]
    c['gaze']=[(0,0),(d,0)]

def _kurimanju(c,d):
    c['tilt']=[(0,0),(14,.03),(30,-.07),(110,-.07),(128,0),(d,0)]
    c['y']=[(0,0),(78,0),(86,2),(100,-2),(116,0),(d,0)]
    c['gaze']=[(0,0),(10,1.4),(22,1.4),(30,0),(d,0)]

def _shisa(c,d):
    nods=[]
    for land in [26,52,78]:nods+=[(land-2,0),(land+3,.07),(land+12,0)]
    c['tilt']=[(0,0)]+nods+[(104,0),(112,-.05),(128,-.05),(138,0),(d,0)]
    c['y']=[(0,0),(104,0),(112,-6),(122,0),(d,0)]
    c['gaze']=[(0,0),(8,1.8),(90,1.8),(104,0),(d,0)]
    c['earL']=[(0,0),(26,0),(30,-.12),(40,0),(52,0),(56,-.12),(66,0),(78,0),(82,-.12),(92,0),(d,0)]
    c['earR']=[(f,-v) for f,v in c['earL']]

def _furuhonya(c,d):
    c['prop']=[(0,0),(10,0),(18,1),(110,1),(122,0),(d,0)]
    c['propY']=[(0,0),(18,-4),(110,-4),(122,0),(d,0)]
    c['propAngle']=[(0,0),(30,0),(36,.08),(42,-.06),(48,.08),(54,-.06),(60,.05),(66,0),(d,0)]
    c['tilt']=[(0,0),(20,-.04),(70,-.04),(84,.05),(108,.05),(124,0),(d,0)]
    c['gaze']=[(0,0),(18,0),(26,1.5),(66,1.5),(76,-1.5),(104,-1.5),(116,0),(d,0)]

def _pochette(c,d):
    c['prop']=[(0,0),(8,0),(14,1),(112,1),(124,0),(d,0)]
    c['propY']=[(0,0),(14,0),(28,-12),(34,-6),(46,-14),(52,-6),(58,-14),(64,-6),(96,-6),(112,0),(d,0)]
    c['propAngle']=[(0,0),(28,-.12),(40,.12),(52,-.12),(64,.1),(80,0),(d,0)]
    c['y']=[(0,0),(26,0),(32,-4),(38,0),(50,-4),(56,0),(62,-4),(68,0),(d,0)]

def _labor(c,d):
    c['prop']=[(0,0),(8,0),(14,1),(116,1),(126,0),(d,0)]
    c['propY']=[(0,0),(14,-6),(116,-6),(126,0),(d,0)]
    nods=[]
    for t in [30,48,66]:nods+=[(t,0),(t+5,.05),(t+12,0)]
    c['tilt']=[(0,0)]+nods+[(92,0),(98,-.04),(110,-.04),(120,0),(d,0)]
    c['y']=[(0,0),(92,0),(98,-8),(108,0),(d,0)]

def _ramen(c,d):
    c['prop']=[(0,0),(6,0),(12,1),(128,1),(138,0),(d,0)]
    c['propY']=[(0,0),(12,0),(24,-16),(118,-16),(132,0),(d,0)]
    c['propAngle']=[(0,0),(24,0),(28,.05),(32,-.05),(36,.04),(40,0),(d,0)]
    c['tilt']=[(0,0),(20,.06),(60,.06),(80,0),(d,0)]
    c['y']=[(0,0),(84,0),(92,-5),(102,0),(d,0)]

def _pajama_green(c,d):
    claps=[]
    for i in range(5):t=12+i*20;claps+=[(t,.15),(t+6,1.0),(t+10,1.0),(t+16,.3)]
    c['left']=[(0,0)]+claps+[(118,0),(d,0)]
    c['right']=[(f,-v) for f,v in c['left']]
    c['stepL']=_hops(12,40,2,5)+[(d,0)];c['stepR']=_hops(32,40,2,5)+[(d,0)]
    c['head']=_beats(12,20,5,.06,-.06)+[(d,0)]
    c['x']=_beats(12,20,5,-3,3)+[(d,0)]
    c['y']=_hops(12,20,5,4)+[(d,0)]

def _pajama_pink(c,d):
    c['left']=[(0,0),(12,.9),(24,.6),(36,.9),(48,.6),(60,.9),(76,.3),(92,.9),(108,.4),(122,0),(d,0)]
    c['right']=[(0,0),(20,-.4),(36,-.9),(48,-.6),(60,-.9),(76,-.3),(92,-.9),(108,-.4),(122,0),(d,0)]
    c['x']=[(0,0),(20,-6),(40,6),(60,-6),(80,6),(100,-4),(120,0),(d,0)]
    c['tilt']=[(0,0),(20,-.07),(40,.07),(60,-.07),(80,.07),(100,-.04),(120,0),(d,0)]
    c['head']=[(0,0),(20,.08),(40,-.08),(60,.08),(80,-.08),(100,.05),(120,0),(d,0)]
    c['stepL']=_hops(10,40,3,4)+[(d,0)];c['stepR']=_hops(30,40,2,4)+[(d,0)]

def _pajama_white(c,d):
    c['left']=[(0,0),(8,-.1),(30,1.05),(70,1.1),(84,.6),(100,.2),(118,0),(d,0)]
    c['right']=[(0,0),(8,.1),(30,-1.05),(70,-1.1),(84,-.6),(100,-.2),(118,0),(d,0)]
    c['head']=[(0,0),(28,-.1),(70,-.12),(90,.12),(110,.12),(124,0),(d,0)]
    c['y']=[(0,0),(10,2),(30,-8),(70,-8),(86,2),(96,0),(d,0)]
    c['tilt']=[(0,0),(86,0),(100,.05),(114,.05),(126,0),(d,0)]

def _pajama_purple(c,d):
    c['left']=[(0,0)]+[(10+i*20+k,v) for i in range(5) for k,v in ([(0,.1),(10,.95)] if i%2==0 else [(0,.1),(10,.2)])]+[(118,0),(d,0)]
    c['right']=[(0,0)]+[(10+i*20+k,v) for i in range(5) for k,v in ([(0,-.1),(10,-.2)] if i%2==0 else [(0,-.1),(10,-.95)])]+[(118,0),(d,0)]
    c['stepL']=_hops(8,40,3,6)+[(d,0)];c['stepR']=_hops(28,40,2,6)+[(d,0)]
    c['head']=_beats(8,10,10,.05,-.02)+[(d,0)]
    c['y']=_hops(8,20,5,6)+[(d,0)]

def _anoko(c,d):
    c['head']=[(0,0),(8,-.16),(46,-.16),(54,.05),(62,0),(d,0)]
    c['tilt']=[(0,0),(8,-.04),(46,-.04),(54,0),(d,0)]
    c['y']=[(0,0),(54,0)]+[(p,v) for p,v in _hops(60,22,3,12)[2:]]+[(d,0)]
    c['left']=[(0,0),(56,0),(62,.7),(70,.2),(78,.75),(86,.2),(94,.7),(102,.2),(116,0),(d,0)]
    c['right']=[(f,-v) for f,v in c['left']]

def _ode(c,d):
    c['y']=[(0,0),(10,4),(26,4),(40,-14),(52,-14),(64,2),(70,0),(d,0)]
    c['left']=[(0,0),(10,-.15),(26,-.15),(40,.85),(56,.85),(62,.55),(70,.9),(78,.55),(86,.9),(108,.9),(122,0),(d,0)]
    c['right']=[(f,-v) for f,v in c['left']]
    c['head']=[(0,0),(10,.06),(26,.06),(40,-.05),(70,-.05),(78,.05),(86,-.05),(108,0),(d,0)]
    c['stepL']=[(0,0),(62,0),(66,-3),(70,0),(d,0)];c['stepR']=[(0,0),(64,0),(68,-3),(72,0),(d,0)]

REACTIONS={'usagi':_usagi,'momonga':_momonga,'kurimanju':_kurimanju,'shisa':_shisa,'furuhonya':_furuhonya,
    'pochette':_pochette,'labor':_labor,'ramen':_ramen,'pajama-green':_pajama_green,'pajama-pink':_pajama_pink,
    'pajama-white':_pajama_white,'pajama-purple':_pajama_purple,'anoko':_anoko,'ode':_ode}
REACTION_BLINKS={
    'usagi':[(0,1),(84,1),(88,.06),(110,.06),(114,1)],
    'momonga':[(0,1),(40,1),(44,.06),(90,.06),(96,1)],
    'kurimanju':[(0,1),(30,1),(34,.06),(112,.06),(118,1)],
    'shisa':[(0,1),(108,1),(112,.06),(130,.06),(134,1)],
    'furuhonya':[(0,1),(84,1),(88,.06),(106,.06),(110,1)],
    'pajama-white':[(0,1),(30,1),(34,.06),(96,.06),(100,1)],
    'ode':[(0,1),(40,1),(44,.06),(104,.06),(108,1)],
    'anoko':[(0,1),(56,1),(60,.06),(104,.06),(108,1)],
}
