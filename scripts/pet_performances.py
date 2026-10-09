"""Click-performance effects for the rest of the cast (60 fps, root-local coords).

Each effect is a separate Rive shape layered in front of the character. A spec
is pure data; `perform()` in pet_motion keys it:
  kind 'pop'  appears at t0 with a scale pop, travels by (dx, dy) and turns by
              `rot` until t1, then fades.
  kind 'drop' falls from `fall` px above, lands with a bounce at `land`, rests
              until t1, then fades.
"""
import math

# Root-local geometry for the code-drawn vector characters (feet at y=0).
VECTOR_GEOMETRY = {'pajama': (150, 200, -111), 'anoko': (200, 200, -124), 'ode': (150, 200, -141)}


def fx(shape, x, y, t0, t1, **kw):
    return dict(kind=kw.pop('kind', 'pop'), shape=shape, x=x, y=y, t0=t0, t1=t1, **kw)


def specs(pet, w, h, eye_y):
    """Effects for one pet; w/h are the drawn size, eye_y the eye line."""
    pid = pet['id']
    side = w / 2
    if pid == 'usagi':
        return ([fx('speed', x, -6, 46, 64, dy=8, color='#efd480') for x in (-22, 0, 22)]
                + [fx('star', x, y, 56 + i * 3, 92, dx=dx, dy=-10, rot=1.4, size=12 - i * 2, color='#f6d55c')
                   for i, (x, y, dx) in enumerate([(-side - 4, eye_y - 50, -8), (side + 2, eye_y - 62, 8), (0, -h - 6, 0)])]
                + [fx('burst', 0, -2, 72, 94, s0=.4, s1=1.5, color='#efd480'),
                   fx('burst', 0, -2, 104, 124, s0=.4, s1=1.2, color='#f7e6a8')])
    if pid == 'momonga':
        hearts = [(-side + 8, eye_y - 22, -10), (side - 2, eye_y - 34, 10), (-14, -h + 6, -4), (24, -h - 4, 6)]
        return ([fx('heart', x, y, 30 + i * 9, 92 + i * 6, dx=dx, dy=-26, rot=.3 if dx > 0 else -.3, size=16 - i, color=['#f39ab3', '#f6b4c6', '#e97f9f', '#f9c6d4'][i])
                 for i, (x, y, dx) in enumerate(hearts)]
                + [fx('sparkle', side - 18, eye_y - 4, 52, 84, s1=1.3, color='#bfe3f7'),
                   fx('sparkle', -side + 22, eye_y + 22, 60, 92, s1=1.1, color='#ffffff')])
    if pid == 'kurimanju':
        # Steam rises from the cup already drawn in Kurimanju's illustration;
        # the contented sigh drifts away from the face.
        return ([fx('steam', -side * .62 + i * 6 - 6, -h * .5, 12 + i * 10, 64 + i * 10, dy=-30, dx=-3 + i * 3, color='#ffffff') for i in range(3)]
                + [fx('puff', side * .62 + i * 8, eye_y + 22 - i * 12, 78 + i * 7, 124 + i * 4, dx=12 + i * 6, dy=-24 - i * 6, s0=.4, s1=.9 + i * .2, color='#fffaf0') for i in range(3)])
    if pid == 'shisa':
        x = side + 4
        return ([fx('box', x, -9 - i * 18, 10 + i * 26, 128, kind='drop', land=26 + i * 26, fall=120, color=['#eca87d', '#f3c99a', '#e9b98f'][i]) for i in range(3)]
                + [fx('sparkle', x, -64, 96, 128, s1=1.4, color='#fff2b8'),
                   fx('sparkle', x - 16, -48, 102, 132, s1=.9, color='#ffffff')])
    if pid == 'furuhonya':
        return [fx('page', 0, -h * .32, 30 + i * 12, 86 + i * 12, dx=(-1) ** i * (54 + i * 10), dy=-34 - i * 8, rot=(-1) ** i * 1.6, color='#fff9e4') for i in range(4)] + \
               [fx('sparkle', side - 6, eye_y - 18, 50, 90, s1=1.2, color='#f4b8cb')]
    if pid == 'pochette':
        items = [('candy', -30, '#f39ab3'), ('star', 4, '#f6d55c'), ('heart', 30, '#e97f9f')]
        return [fx(shape, 0, -h * .3, 34 + i * 12, 100 + i * 8, dx=dx * 1.5, dy=-95, rot=(-1) ** i * .8, size=17, color=color, arc=True) for i, (shape, dx, color) in enumerate(items)]
    if pid == 'labor':
        return ([fx('check', 22, -h * .36 + i * 12, 30 + i * 18, 118, s0=.3, s1=1, color='#5f9f6e') for i in range(3)]
                + [fx('sparkle', 30, -h * .62, 92, 124, s1=1.3, color='#fff2b8'),
                   fx('sparkle', -28, -h * .7, 98, 128, s1=1, color='#cfe8c4')])
    if pid == 'ramen':
        return ([fx('steam', -14 + i * 14, -h * .42, 20 + i * 8, 92 + i * 8, dy=-46, dx=(-1) ** i * 6, color='#ffffff') for i in range(3)]
                + [fx('sparkle', 36, -h * .55, 70, 108, s1=1.3, color='#fff2b8'),
                   fx('sparkle', -34, -h * .48, 80, 118, s1=1, color='#f2c7a0')])
    if pid == 'pajama-green':
        return [fx('leaf', (-1) ** i * (64 + i * 6), eye_y - 30 - i * 8, 14 + i * 22, 58 + i * 22, dx=(-1) ** i * 16, dy=-30, rot=(-1) ** i * 1.2, color=['#8fbf7a', '#b7d99a'][i % 2]) for i in range(5)]
    if pid == 'pajama-pink':
        return [fx('heart', (-1) ** i * (66 + i * 5), eye_y - 10 - i * 12, 18 + i * 18, 70 + i * 16, dx=(-1) ** i * 10, dy=-34, rot=(-1) ** i * .4, size=14, color=['#f39ab3', '#f6b4c6'][i % 2]) for i in range(5)]
    if pid == 'pajama-white':
        return [fx('zee', 62 + i * 10, eye_y - 30 - i * 12, 40 + i * 16, 104 + i * 10, dx=12, dy=-30, rot=.3, size=10 + i * 3, color='#9fb3c8') for i in range(3)] + \
               [fx('puff', 60, eye_y + 6, 36, 76, dx=10, dy=-14, s0=.3, s1=.9, color='#ffffff')]
    if pid == 'pajama-purple':
        return [fx(['star', 'note'][i % 2], (-1) ** i * (66 + i * 4), eye_y - 18 - i * 10, 8 + i * 22, 56 + i * 22, dx=(-1) ** i * 12, dy=-30, rot=(-1) ** i * .6, size=13, color=['#b9a3e3', '#f6d55c'][i % 2]) for i in range(5)]
    if pid == 'anoko':
        return ([fx('question', 52, eye_y - 52, 8, 50, s0=.3, s1=1.1, rot=.25, color='#8f7bb8'),
                 fx('exclaim', 52, eye_y - 52, 54, 84, s0=.3, s1=1.2, color='#e5718d')]
                + [fx('feather', (-1) ** i * (40 + i * 8), eye_y - 30, 70 + i * 8, 128, dx=(-1) ** i * 14, dy=70, rot=(-1) ** i * 1.5, color='#fff9e9') for i in range(4)])
    if pid == 'ode':
        return ([fx('ring', 0, -4, 66, 92, s0=.4, s1=2.2, color='#e8c27a'),
                 fx('ring', 0, -4, 96, 120, s0=.4, s1=1.8, color='#f3dcae')]
                + [fx('star', x, y, 64 + i * 5, 104, dx=dx, dy=-16, rot=1.2, size=13, color='#f6d55c')
                   for i, (x, y, dx) in enumerate([(-64, -170, -10), (64, -172, 10), (0, -214, 0)])])
    return []


def draw(kit, parent, spec):
    """Draw one effect shape centred on its node origin."""
    el, path, paint = kit['el'], kit['draw_path'], kit['paint']
    shape, color, size = spec['shape'], spec['color'], spec.get('size', 12)
    if shape in ('star', 'sparkle'):
        star = el('Shape', parent, name=f'{shape} effect')
        el('Star', star, width=size, height=size, points=4 if shape == 'sparkle' else 5,
           innerRadius=.25 if shape == 'sparkle' else .45, cornerRadius=.6 if shape == 'sparkle' else .3)
        paint(star, color, None if shape == 'sparkle' else '#8a6b2c', 1.2)
    elif shape == 'heart':
        k = size / 16
        path(parent, 'Heart', f'M 0 {6*k:.1f} C {-10*k:.1f} {-2*k:.1f} {-8*k:.1f} {-10*k:.1f} 0 {-5*k:.1f} C {8*k:.1f} {-10*k:.1f} {10*k:.1f} {-2*k:.1f} 0 {6*k:.1f} Z', color, '#b5536f', 1.2)
    elif shape == 'note':
        path(parent, 'Note stem', 'M 4 2 L 4 -14 Q 10 -11 11 -6', None, color, 2.2)
        head = el('Shape', parent, name='Note head', x=0, y=3, rotation=-.45); el('Ellipse', head, width=9, height=7); paint(head, color, None)
    elif shape == 'speed':
        path(parent, 'Speed line', 'M 0 0 L 0 14', None, color, 2.4)
    elif shape == 'burst':
        path(parent, 'Burst', ' '.join(f'M {math.cos(a)*24:.1f} {math.sin(a)*8-2:.1f} L {math.cos(a)*36:.1f} {math.sin(a)*12-4:.1f}' for a in [math.pi + i * math.pi / 6 for i in range(7)]), None, color, 2.4)
    elif shape == 'cup':
        path(parent, 'Cup', 'M -8 -7 L 8 -7 L 6 7 Q 0 10 -6 7 Z', color, '#6c4a3a', 1.6)
        path(parent, 'Drink', 'M -7 -4 L 7 -4', None, '#c58a5a', 2)
    elif shape == 'steam':
        path(parent, 'Steam', 'M 0 0 Q -5 -6 0 -12 Q 5 -18 0 -24', None, '#e9e4dc', 2.6)
        path(parent, 'Steam core', 'M 0 0 Q -5 -6 0 -12 Q 5 -18 0 -24', None, color, 1.2)
    elif shape == 'puff':
        for px, py, s in [(-7, 1, 11), (2, -3, 13), (9, 2, 10)]:
            c = el('Shape', parent, name='Puff', x=px, y=py); el('Ellipse', c, width=s, height=s * .8); paint(c, color, '#d8cfc0', 1.2)
    elif shape == 'box':
        path(parent, 'Block', 'M -9 -9 L 9 -9 L 9 9 L -9 9 Z', color, '#6d4b37', 1.8)
        path(parent, 'Block line', 'M -9 -2 L 9 -2', None, '#ffffff', 1.2)
    elif shape == 'page':
        path(parent, 'Page', 'M -7 -9 L 7 -9 Q 9 0 7 9 L -7 9 Q -5 0 -7 -9 Z', color, '#8e7564', 1.3)
        path(parent, 'Page text', 'M -4 -4 L 4 -4 M -4 0 L 4 0 M -4 4 L 2 4', None, '#c5b495', 1)
    elif shape == 'candy':
        path(parent, 'Wrapper', 'M -6 0 L -12 -5 L -12 5 Z M 6 0 L 12 -5 L 12 5 Z', '#fff2f6', '#b5536f', 1.1)
        c = el('Shape', parent, name='Candy'); el('Ellipse', c, width=12, height=10); paint(c, color, '#b5536f', 1.2)
    elif shape == 'check':
        path(parent, 'Check', 'M -7 0 L -2 5 L 8 -6', None, color, 3.4)
    elif shape == 'leaf':
        path(parent, 'Leaf', 'M 0 -12 Q 12 -3 0 12 Q -12 -3 0 -12 Z', color, '#56784a', 1.4)
        path(parent, 'Leaf vein', 'M 0 -9 L 0 9', None, '#56784a', 1.1)
    elif shape == 'zee':
        s = spec.get('size', 12) / 2
        path(parent, 'Z', f'M {-s} {-s} L {s} {-s} L {-s} {s} L {s} {s}', None, color, 2.4)
    elif shape == 'question':
        path(parent, 'Question', 'M -5 -8 Q -5 -14 1 -14 Q 7 -14 7 -8 Q 7 -3 1 -1 L 1 3', None, color, 3)
        d = el('Shape', parent, name='Question dot', y=8); el('Ellipse', d, width=4.5, height=4.5); paint(d, color, None)
    elif shape == 'exclaim':
        path(parent, 'Exclaim', 'M 0 -14 L 0 2', None, color, 4.5)
        d = el('Shape', parent, name='Exclaim dot', y=8); el('Ellipse', d, width=5, height=5); paint(d, color, None)
    elif shape == 'feather':
        path(parent, 'Feather', 'M 0 -10 Q 7 -2 1 10 Q -6 0 0 -10 Z', color, '#b3a68a', 1.1)
    elif shape == 'ring':
        r = el('Shape', parent, name='Ground ring'); el('Ellipse', r, width=60, height=13); paint(r, None, color, 2.6)


def build(kit, root, pet, w, h, eye_y):
    """Create every effect node for `pet` in front of the character."""
    result = []
    for spec in specs(pet, w, h, eye_y):
        node = kit['el']('Node', name=f"Performance {spec['shape']}", x=round(spec['x'], 2), y=round(spec['y'], 2), opacity=0)
        draw(kit, node, spec)
        node[:] = reversed(list(node)); root.insert(0, node)
        result.append({**{k: v for k, v in spec.items() if k not in ('shape', 'color')}, 'id': node.get('id'), 'kind': 'scripted-' + spec['kind']})
    return result
