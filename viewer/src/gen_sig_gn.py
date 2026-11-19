#!/usr/bin/env python3
"""GIN²CO demo — Guinea profile (roads & agricultural flows).
Synthetic GIS data anchored on an OSM raster mosaic (z13, tiles x 3785-3791, y 3872-3877).
Only the land / water / road / wetland pattern comes from the OSM render; every asset and value is fictitious."""
import json, math, random, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.graph import MCP_Geometric

random.seed(23); np.random.seed(23)
Z, X0, Y0 = 13, 3785, 3872
img = np.array(Image.open('mosaic.png').convert('RGB')).astype(int)
H, W, _ = img.shape
PX_M = 156543.03 * math.cos(math.radians(9.66)) / 2 ** Z      # ≈ 18.8 m per pixel


def px2ll(px, py):
    n = 2 ** Z
    x = X0 + px / 256.0; y = Y0 + py / 256.0
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return round(lat, 5), round(lon, 5)


def near(c, tol=14):
    return np.abs(img - np.array(c)).sum(axis=2) <= tol


water = ndi.binary_opening(near((170, 211, 223), 18), iterations=1)
wet = near((200, 215, 171), 16) | near((99, 175, 235), 40) | near((74, 165, 250), 40) | near((142, 176, 132), 24) | near((186, 206, 162), 12)
trunk = near((249, 178, 156), 32) | near((232, 146, 162), 30)
primary = near((252, 214, 164), 26)
secondary = near((247, 250, 191), 22)
white = (img.min(axis=2) >= 250)
r, g, b = img[..., 0], img[..., 1], img[..., 2]
grey = (np.abs(r - g) <= 4) & (np.abs(g - b) <= 6) & (r >= 196) & (r <= 232)          # residential landuse + buildings
land = ~water
d_water = ndi.distance_transform_edt(~water) * PX_M
wet_s = ndi.uniform_filter(wet.astype(float), 21)
urb_s = ndi.uniform_filter((grey | white).astype(float), 41)
road_major = trunk | primary | secondary

# ---------------------------------------------------------------- grid (≈ 600 m cells)
CELL = 32
CELL_KM2 = (CELL * PX_M / 1000) ** 2
cells = []
for j in range(H // CELL):
    for i in range(W // CELL):
        sl = (slice(j * CELL, (j + 1) * CELL), slice(i * CELL, (i + 1) * CELL))
        lf = land[sl].mean()
        if lf < 0.5:
            continue
        cx, cy = i * CELL + CELL // 2, j * CELL + CELL // 2
        u = max(0.0, float(urb_s[sl].mean()))
        pop = int(round((150 + 30000 * min(u / 0.55, 1.0) ** 1.6 * (0.75 + 0.5 * random.random())) * lf, -2))
        flood = min(1.0, 1.25 * wet_s[sl].mean() + 0.35 * math.exp(-d_water[cy, cx] / 500) + 0.08 * random.random())
        if wet[sl].mean() > 0.35:
            sol = 'Vases de mangrove'
        elif d_water[cy, cx] < 700 or wet_s[sl].mean() > 0.15:
            sol = 'Alluvions argilo-sableuses'
        else:
            sol = 'Sols ferrallitiques (latérite)'
        (la1, lo1), (la2, lo2) = px2ll(i * CELL, j * CELL), px2ll((i + 1) * CELL, (j + 1) * CELL)
        cells.append({'b': [la2, lo1, la1, lo2], 'pop': max(pop, 100), 'flood': round(flood, 2), 'sol': sol, 'px': [cx, cy]})


def cell_at(px, py):
    return min(cells, key=lambda c: (c['px'][0] - px) ** 2 + (c['px'][1] - py) ** 2)


def dpx(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1]) * PX_M


# ---------------------------------------------------------------- routing raster
cost = np.full((H, W), 30.0)
cost[wet] = 120.0
cost[water] = 1500.0
cost[white] = 2.6
cost[secondary] = 1.6
cost[primary] = 1.25
cost[trunk] = 1.0


def trace(src, dst):
    m = MCP_Geometric(cost)
    m.find_costs([(src[1], src[0])], [(dst[1], dst[0])])
    p = m.traceback((dst[1], dst[0]))
    return [(x, y) for y, x in p]


def snap(px, py, mask, rad=40):
    ys, xs = np.nonzero(mask[max(0, py - rad):py + rad, max(0, px - rad):px + rad])
    if not len(xs):
        return px, py
    k = np.argmin((xs + max(0, px - rad) - px) ** 2 + (ys + max(0, py - rad) - py) ** 2)
    return int(xs[k] + max(0, px - rad)), int(ys[k] + max(0, py - rad))


# ---------------------------------------------------------------- sources: hinterland axes + farm basins (fictitious)
def border_point(side, around):
    if side == 'top':
        xs = np.nonzero(trunk[2])[0]; x = int(xs[np.argmin(np.abs(xs - around))]); return (x, 2)
    if side == 'right':
        ys = np.nonzero(trunk[:, W - 3])[0]; y = int(ys[np.argmin(np.abs(ys - around))]); return (W - 3, y)
    if side == 'left':
        ys = np.nonzero(trunk[:, 2])[0]; y = int(ys[np.argmin(np.abs(ys - around))]); return (2, y)


sources = [
    {'px': border_point('right', 260), 'name': 'Axe est (arrière-pays)', 'name_en': 'Eastern corridor (hinterland)', 'kind': 'axe', 't': 62000, 'hh': 15500},
    {'px': border_point('right', 800), 'name': 'Axe sud-est (arrière-pays)', 'name_en': 'South-eastern corridor (hinterland)', 'kind': 'axe', 't': 41000, 'hh': 10200},
    {'px': border_point('top', 1060), 'name': 'Axe nord (arrière-pays)', 'name_en': 'Northern corridor (hinterland)', 'kind': 'axe', 't': 27000, 'hh': 6700},
]
rural_road = white & (urb_s < 0.10) & land & (wet_s < 0.4)
ys, xs = np.nonzero(rural_road)
order = np.random.permutation(len(xs))
labels = [('Zone fruitière A', 'Fruit-growing area A'), ('Bassin maraîcher B', 'Market-garden basin B'), ('Plaine rizicole C', 'Rice plain C'),
          ('Bassin maraîcher D', 'Market-garden basin D'), ('Zone fruitière E', 'Fruit-growing area E'), ('Bassin vivrier F', 'Food-crop basin F')]
basins = []
for k in order:
    p = (int(xs[k]), int(ys[k]))
    if p[0] < 700 or p[0] > W - 40 or p[1] < 40 or p[1] > H - 40:
        continue
    if all(dpx(p, q['px']) > 3800 for q in basins + sources):
        fr, en = labels[len(basins)]
        t_ = int(round(random.uniform(2500, 9000), -2))
        basins.append({'px': p, 'name': fr, 'name_en': en, 'kind': 'bassin', 't': t_, 'hh': int(round(t_ / 3.2, -1))})
    if len(basins) == len(labels):
        break

# ---------------------------------------------------------------- destinations: wholesale markets + south-west exit
exit_sw = {'px': border_point('left', 1460), 'name': 'Sortie sud-ouest (centre-ville et port)', 'name_en': 'South-west exit (city centre and port)'}
markets = []
ys, xs = np.nonzero((trunk | primary | secondary) & (urb_s > 0.3))
order = np.random.permutation(len(xs))
for k in order:
    p = (int(xs[k]), int(ys[k]))
    if p[0] > 1100:
        continue
    if all(dpx(p, m_['px']) > 2600 for m_ in markets) and dpx(p, exit_sw['px']) > 2500:
        markets.append({'px': p, 'name': f'Marché de gros (fictif) {len(markets) + 1}', 'name_en': f'Wholesale market (fictitious) {len(markets) + 1}'})
    if len(markets) == 4:
        break

flowpaths = []
for s in sources + basins:
    nm = sorted(markets, key=lambda m_: dpx(s['px'], m_['px']))
    legs = [(exit_sw, 0.45), (nm[0], 0.32), (nm[1], 0.23)] if s['kind'] == 'axe' else [(nm[0], 0.5), (nm[1], 0.3), (exit_sw, 0.2)]
    for dest, share in legs:
        path = trace(s['px'], dest['px'])
        flowpaths.append({'id': len(flowpaths), 'src': s, 'dest': dest, 't': s['t'] * share, 'hh': s['hh'] * share, 'path': path})
print('basins', [(b['name'], b['t'], b['px']) for b in basins], 'markets', [m_['px'] for m_ in markets])
print('flows', len(flowpaths), [len(f['path']) for f in flowpaths])

load = np.zeros((H, W))
for f in flowpaths:
    pts = np.array(f['path'])
    load[pts[:, 1], pts[:, 0]] += f['t']
load_d = ndi.maximum_filter(load, size=3)

# ---------------------------------------------------------------- traffic counts
traffic = []
taken = []
for mask, cls, lo, hi, n in ((trunk, 'Route nationale', 14000, 38000, 22), (primary | secondary, 'Route secondaire', 4000, 11000, 26),
                             (rural_road, 'Piste rurale', 150, 1200, 22)):
    ys, xs = np.nonzero(ndi.binary_erosion(mask, iterations=0 if cls == 'Piste rurale' else 1) & land)
    order = np.random.permutation(len(xs))
    cnt = 0
    for k in order:
        p = (int(xs[k]), int(ys[k]))
        if all(dpx(p, q) > 1500 for q in taken):
            taken.append(p)
            u = urb_s[p[1], p[0]]
            tm = int(round(random.uniform(lo, hi) * (0.6 + 0.8 * min(u / 0.5, 1)), -1 if cls == 'Piste rurale' else -2))
            la, lo_ = px2ll(*p)
            traffic.append({'lat': la, 'lon': lo_, 'cls': cls, 'tmja': tm, 'px': list(p)})
            cnt += 1
        if cnt >= n:
            break

# ---------------------------------------------------------------- facilities (fictitious)
fac = []
used = [m_['px'] for m_ in markets]
for m_ in markets:
    la, lo_ = px2ll(*m_['px']); fac.append({'lat': la, 'lon': lo_, 'type': 'Marché', 'px': list(m_['px'])})


def rand_spot(cond, mind):
    for _ in range(40000):
        p = (random.randrange(20, W - 20), random.randrange(20, H - 20))
        if land[p[1], p[0]] and cond(p) and all(dpx(p, q) > mind for q in used):
            return p
    raise RuntimeError('no spot')


for kind, n, cond in (('Marché', 3, lambda p: urb_s[p[1], p[0]] > 0.15 and p[0] > 900),
                      ('Point de collecte', 9, lambda p: urb_s[p[1], p[0]] < 0.15 and white[p[1], p[0]]),
                      ('Centre de santé', 10, lambda p: urb_s[p[1], p[0]] > 0.08)):
    for _ in range(n):
        p = rand_spot(cond, 900)
        used.append(p)
        la, lo_ = px2ll(*p); fac.append({'lat': la, 'lon': lo_, 'type': kind, 'px': list(p)})

# ---------------------------------------------------------------- assets on the network
asset_px = []


def pick(cond, n, mind=1000, prefer_load=True):
    ys, xs = np.nonzero(cond)
    idx = np.arange(len(xs))
    if prefer_load:
        w = load_d[ys, xs] + 300.0
        idx = np.random.choice(idx, size=min(len(idx), 4000), replace=False, p=w / w.sum())
    else:
        np.random.shuffle(idx)
    out = []
    for k in idx:
        p = (int(xs[k]), int(ys[k]))
        if p[0] < 15 or p[0] > W - 15 or p[1] < 15 or p[1] > H - 15:
            continue
        if all(dpx(p, q) > mind for q in asset_px + out):
            out.append(p)
        if len(out) == n:
            break
    asset_px.extend(out)
    return out


on_road = trunk | primary | secondary | white
wat_s = ndi.uniform_filter(water.astype(float), 9)
crossing = on_road & ((wat_s > 0.12) | (ndi.uniform_filter(wet.astype(float), 7) > 0.45))
specs = []
oa = pick(crossing & (load_d > 0), 8)
oa += pick(crossing & (urb_s < 0.12), 10 - len(oa), prefer_load=False, mind=900)
oa += pick(crossing, 10 - len(oa), prefer_load=False, mind=800)
for p in oa:
    x, y = p
    rural = urb_s[y, x] < 0.12
    if wat_s[y, x] > 0.3 and not rural:
        typ = 'Pont à poutres en béton armé'
    elif rural and wat_s[y, x] > 0.15:
        typ = 'Radier submersible'
    elif rural:
        typ = 'Buse métallique' if len([s for s in specs if s[1] == 'Buse métallique']) < 3 else 'Dalot simple'
    elif wet_s[y, x] > 0.3:
        typ = 'Dalot double cellule'
    else:
        typ = ['Dalot simple', 'Dalot double cellule', 'Buse métallique'][len(specs) % 3]
    specs.append(('Ouvrages d’art', typ, x, y))
rn = pick((trunk | primary) & (load_d > 0), 7, mind=1400)
for x, y in rn:
    specs.append(('Routes revêtues', 'Section en remblai sur zone basse' if wet_s[y, x] > 0.18 or d_water[y, x] < 400 else 'Section de route bitumée', x, y))
pr = pick(rural_road & (load_d > 0), 6, mind=1400)
pr += pick(rural_road, 8 - len(pr), prefer_load=False, mind=1200)
for x, y in pr:
    specs.append(('Pistes rurales', 'Piste en terre' if (cell_at(x, y)['flood'] > 0.45 or random.random() < 0.35) else 'Piste en latérite', x, y))
# guarantee type variety
tset = {s[1] for s in specs}
if 'Pont à poutres en béton armé' not in tset:
    i = max(range(len(specs)), key=lambda i: wat_s[specs[i][3], specs[i][2]] if specs[i][0] == 'Ouvrages d’art' else -1)
    specs[i] = (specs[i][0], 'Pont à poutres en béton armé', specs[i][2], specs[i][3])
if 'Dalot double cellule' not in tset:
    i = max((i for i, s in enumerate(specs) if s[0] == 'Ouvrages d’art' and s[1] in ('Buse métallique', 'Dalot simple') and urb_s[s[3], s[2]] >= 0.12),
            key=lambda i: load_d[specs[i][3], specs[i][2]], default=None)
    if i is not None:
        specs[i] = (specs[i][0], 'Dalot double cellule', specs[i][2], specs[i][3])
if 'Section de route bitumée' not in tset:
    i = next(i for i, s in enumerate(specs) if s[0] == 'Routes revêtues')
    specs[i] = (specs[i][0], 'Section de route bitumée', specs[i][2], specs[i][3])
print('types', sorted({s[1] for s in specs}))

PREFIX = {'Ouvrages d’art': 'OA', 'Routes revêtues': 'RN', 'Pistes rurales': 'PR'}
COST = {'Pont à poutres en béton armé': 9.5e9, 'Dalot double cellule': 2.4e9, 'Dalot simple': 1.3e9, 'Buse métallique': 0.7e9,
        'Radier submersible': 1.7e9, 'Section de route bitumée': 6.5e9, 'Section en remblai sur zone basse': 8.5e9,
        'Piste en latérite': 2.8e9, 'Piste en terre': 1.9e9}
ETAT = {1: 'Bon', 2: 'Moyen', 3: 'Dégradé', 4: 'Critique'}
notes = [4, 3, 2, 3, 1, 4, 2, 3, 2, 3, 1, 2, 4, 2, 3, 1, 3, 4, 2, 3, 1, 3, 2, 4, 2]
assets = []
counters = {}
for idx, (fam, typ, px, py) in enumerate(specs):
    p = PREFIX[fam]; counters[p] = counters.get(p, 0) + 1
    code = f'{p}-{counters[p]:02d}'
    note = notes[idx]
    c = cell_at(px, py)
    la, lo_ = px2ll(px, py)
    near_tr = min(traffic, key=lambda t_: dpx(t_['px'], (px, py)))
    if dpx(near_tr['px'], (px, py)) < 900 and (near_tr['cls'] != 'Piste rurale') == (fam != 'Pistes rurales'):
        tmja = near_tr['tmja']
    else:
        tmja = int(round(random.uniform(250, 1100), -1)) if fam == 'Pistes rurales' else int(round(random.uniform(6000, 22000), -2))
    pop = 0
    for cc in cells:
        d = dpx(cc['px'], (px, py))
        if d < 600:
            pop += cc['pop'] * CELL_KM2 * (1 - d / 600) * 0.35
    eq = sum(1 for f in fac if dpx(f['px'], (px, py)) < 500)
    cost_ = int(round(COST[typ] * (0.35 + 0.3 * note) * random.uniform(0.85, 1.15), -7))
    if cost_ >= 7e9:
        fin = 'Bailleur (programme)'
    elif fam == 'Pistes rurales':
        fin = random.choice(['Collectivité locale', 'Budget national d’investissement'])
    else:
        fin = 'Fonds d’entretien routier'
    assets.append({'code': code, 'name': f'{typ} {code}', 'famille': fam, 'type': typ, 'lat': la, 'lon': lo_, 'note': note,
                   'etat': ETAT[note], 'annee': random.choice([1992, 1998, 2004, 2008, 2011, 2014, 2017, 2020]), 'cout': cost_,
                   'financement': fin, 'tmja': tmja, 'pop': int(round(pop, -2)), 'flood': c['flood'], 'sol': c['sol'], 'equip': eq,
                   'inspection': random.choice(['2026-02', '2026-04', '2026-06', '2026-09', '2026-10']), '_px': (px, py)})

exec(open('impact_gn.py', encoding='utf-8').read())

for c in cells: c.pop('px')
for t_ in traffic: t_.pop('px')
for f in fac: f.pop('px')
for a in assets: a.pop('_px')
out = {'meta': {'zone': 'gn', 'cell_m': round(CELL * PX_M), 'note': 'Données entièrement fictives — démonstration GIN²CO'},
       'assets': assets, 'cells': cells, 'traffic': traffic, 'facilities': fac, 'basins': basins_out, 'flowpaths': flowpaths_out,
       'bounds': [px2ll(0, H), px2ll(W, 0)]}
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(assets), 'assets', len(cells), 'cells', len(traffic), 'traffic', len(fac), 'facilities', len(flowpaths), 'flows')
for a in assets:
    print(a['code'], f"{a['type'][:22]:22s}", a['etat'][:4], a['tmja'], a['pop'], a['flood'], a['sol'][:10], f"{a['cout'] / 1e9:5.2f} Md", f"{a['inaction'] / 1e9:6.2f} Md", a['financement'][:10])
