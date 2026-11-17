#!/usr/bin/env python3
"""Synthetic GIS demo data for GIN²CO, anchored on an OSM raster mosaic (z14, tiles x 8299-8304, y 7900-7902).
Only the land/water/road/wetland pattern comes from the OSM render; every asset and every value is fictitious."""
import json, math, random, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

random.seed(7); np.random.seed(7)
Z, X0, Y0 = 14, 8299, 7900
img = np.array(Image.open('mosaic.png').convert('RGB')).astype(int)
H, W, _ = img.shape

def px2ll(px, py):
    n = 2 ** Z
    x = X0 + px / 256.0; y = Y0 + py / 256.0
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return round(lat, 5), round(lon, 5)

def near(c, tol=14):
    return (np.abs(img - np.array(c)).sum(axis=2) <= tol)

water = near((170, 211, 223), 18)
water = ndi.binary_opening(water, iterations=1)
wet = near((205, 235, 176), 20) | near((200, 212, 168), 18)          # wetland / grass (marsh areas)
trunk = near((249, 178, 156), 30) | near((232, 146, 162), 30)
primary = near((252, 214, 164), 26)
secondary = near((247, 250, 191), 22) | near((244, 248, 188), 14)
white = near((254, 254, 254), 6)
pink = near((235, 219, 232), 10)                                       # port / industrial
land = ~water

# ocean = water component touching bottom edge; lagoon/channel = other water
lab, nlab = ndi.label(water)
ocean_ids = set(np.unique(lab[-1, :])) - {0}
ocean = np.isin(lab, list(ocean_ids))
lagoon = water & ~ocean
d_ocean = ndi.distance_transform_edt(~ocean) * 9.5        # metres (≈9.5 m/px at z14, 6.4°N)
d_lagoon = ndi.distance_transform_edt(~lagoon) * 9.5
wet_smooth = ndi.uniform_filter(wet.astype(float), 25)
street_dens = ndi.uniform_filter((white | secondary | primary | trunk).astype(float), 31)

# ---------------- grid
CELL = 40                       # px ≈ 380 m
cells = []
gx, gy = W // CELL, H // CELL
for j in range(gy):
    for i in range(gx):
        sl = (slice(j * CELL, (j + 1) * CELL), slice(i * CELL, (i + 1) * CELL))
        landfrac = land[sl].mean()
        if landfrac < 0.55 or pink[sl].mean() > 0.35:
            continue
        cx, cy = i * CELL + CELL // 2, j * CELL + CELL // 2
        sd = street_dens[sl].mean()
        pop = int(round((2500 + 26000 * min(sd / 0.38, 1.0) * (0.75 + 0.5 * random.random())) * landfrac, -2))  # hab/km²
        flood = min(1.0, 0.85 * wet_smooth[sl].mean() * 3.2 + 0.45 * math.exp(-d_lagoon[cy, cx] / 700)
                    + 0.25 * math.exp(-d_ocean[cy, cx] / 400) + 0.08 * random.random())
        if d_ocean[cy, cx] < 1300:
            sol = 'Sables littoraux'
        elif d_lagoon[cy, cx] < 900 or wet[sl].mean() > 0.25:
            sol = 'Argiles et vases compressibles'
        else:
            sol = 'Terre de barre (sols latéritiques)'
        (lat1, lon1), (lat2, lon2) = px2ll(i * CELL, j * CELL), px2ll((i + 1) * CELL, (j + 1) * CELL)
        cells.append({'b': [lat2, lon1, lat1, lon2], 'pop': pop, 'flood': round(flood, 2), 'sol': sol,
                      'px': [cx, cy]})

def cell_at(px, py):
    best = min(cells, key=lambda c: (c['px'][0] - px) ** 2 + (c['px'][1] - py) ** 2)
    return best

# ---------------- traffic count points on major roads (spaced)
major = [(trunk, 'Voie express', (32000, 46000)), (primary, 'Voie principale', (15000, 26000)),
         (secondary, 'Voie secondaire', (6000, 12000))]
traffic = []
taken = []
def far(px, py, mind):
    return all((px - a) ** 2 + (py - b) ** 2 > mind ** 2 for a, b in taken)
for mask, cls, (lo, hi) in major:
    ys, xs = np.nonzero(ndi.binary_erosion(mask, iterations=1) & land)
    order = np.random.permutation(len(xs))
    for k in order:
        px, py = int(xs[k]), int(ys[k])
        if far(px, py, 55) and d_lagoon[py, px] > 150:
            taken.append((px, py))
            lat, lon = px2ll(px, py)
            traffic.append({'lat': lat, 'lon': lon, 'cls': cls, 'tmja': int(round(random.uniform(lo, hi), -2)), 'px': [px, py]})
        if sum(1 for t in traffic if t['cls'] == cls) >= {'Voie express': 14, 'Voie principale': 30, 'Voie secondaire': 40}[cls]:
            break

# ---------------- fictitious public facilities
fac = []
def rand_land_px(cond, mind=40, tries=20000):
    for _ in range(tries):
        px, py = random.randrange(20, W - 20), random.randrange(20, H - 20)
        if land[py, px] and not pink[py, px] and cond(px, py) and all((px - f[0]) ** 2 + (py - f[1]) ** 2 > mind ** 2 for f in used):
            return px, py
    raise RuntimeError('no spot')
used = []
for kind, n in (('École', 26), ('Centre de santé', 10), ('Marché', 6)):
    for _ in range(n):
        px, py = rand_land_px(lambda x, y: street_dens[y, x] > 0.18 and d_lagoon[y, x] > 120 and d_ocean[y, x] > 150)
        used.append((px, py))
        lat, lon = px2ll(px, py)
        fac.append({'lat': lat, 'lon': lon, 'type': kind, 'px': [px, py]})

# ---------------- assets
EXCL_R = 450 / 9.5   # keep away from lagoon/channel crossings (real bridges)
def road_spot(mask, cond, mind=70):
    ys, xs = np.nonzero(mask & land)
    order = np.random.permutation(len(xs))
    for k in order:
        px, py = int(xs[k]), int(ys[k])
        if cond(px, py) and all((px - a) ** 2 + (py - b) ** 2 > mind ** 2 for a, b in asset_px):
            return px, py
    raise RuntimeError('no road spot')
asset_px = []
roads_any = white | secondary | primary
specs = []
# Voirie & ouvrages d'art (9) — culverts where roads meet wetland
vo_types = ['Dalot double cellule', 'Dalot simple', 'Dalot simple', 'Ponceau', 'Ponceau', 'Dalot double cellule',
            'Dalot simple', 'Ponceau', 'Dalot triple cellule']
for k, typ in enumerate(vo_types):
    mask = (secondary | primary) if k % 2 == 0 else roads_any
    px, py = road_spot(mask, lambda x, y: wet_smooth[y, x] > 0.08 and d_lagoon[y, x] > EXCL_R and d_ocean[y, x] > 200)
    asset_px.append((px, py)); specs.append(('Voirie & ouvrages d’art', typ, px, py))
# Drainage & assainissement (9)
dr_types = ['Collecteur principal', 'Caniveau maçonné', 'Caniveau maçonné', 'Exutoire', 'Bassin de rétention',
            'Collecteur secondaire', 'Caniveau maçonné', 'Station de relevage', 'Collecteur secondaire']
for typ in dr_types:
    px, py = road_spot(roads_any, lambda x, y: street_dens[y, x] > 0.2 and d_lagoon[y, x] > 160 and d_ocean[y, x] > 250)
    asset_px.append((px, py)); specs.append(('Drainage & assainissement', typ, px, py))
# Bâtiments publics (7)
bp_types = ['École primaire', 'Centre de santé', 'École primaire', 'Mairie d’arrondissement', 'Marché couvert',
            'Collège', 'Centre de santé']
for typ in bp_types:
    px, py = road_spot(white, lambda x, y: street_dens[y, x] > 0.22 and d_lagoon[y, x] > 160 and d_ocean[y, x] > 250)
    asset_px.append((px, py)); specs.append(('Bâtiments publics', typ, px, py))

PREFIX = {'Voirie & ouvrages d’art': 'VO', 'Drainage & assainissement': 'DR', 'Bâtiments publics': 'BP'}
COST = {  # FCFA, maintenance/rehabilitation base by type
    'Dalot double cellule': 9e6, 'Dalot simple': 5e6, 'Ponceau': 3.5e6, 'Dalot triple cellule': 14e6,
    'Collecteur principal': 28e6, 'Caniveau maçonné': 7e6, 'Exutoire': 12e6, 'Bassin de rétention': 35e6,
    'Collecteur secondaire': 15e6, 'Station de relevage': 22e6, 'École primaire': 18e6, 'Centre de santé': 24e6,
    'Mairie d’arrondissement': 16e6, 'Marché couvert': 40e6, 'Collège': 30e6}
ETAT = {1: 'Bon', 2: 'Moyen', 3: 'Dégradé', 4: 'Critique'}
DAYS = {1: 1, 2: 6, 3: 20, 4: 45}
notes = [3, 3, 2, 3, 1, 4, 2, 2, 3, 3, 1, 2, 4, 2, 3, 1, 2, 3, 2, 4, 1, 3, 2, 1, 3]

def dist_m(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1]) * 9.5

assets = []
counters = {}
for idx, (fam, typ, px, py) in enumerate(specs):
    p = PREFIX[fam]; counters[p] = counters.get(p, 0) + 1
    code = f"{p}-{counters[p]:02d}"
    note = notes[idx]
    c = cell_at(px, py)
    lat, lon = px2ll(px, py)
    near_tr = min(traffic, key=lambda t: dist_m(t['px'], (px, py)))
    tmja = near_tr['tmja'] if dist_m(near_tr['px'], (px, py)) < 450 else int(round(random.uniform(1500, 5000), -2))
    if fam == 'Bâtiments publics':
        tmja = None
    pop_served = 0
    for cc in cells:
        d = dist_m(cc['px'], (px, py))
        if d < 600:
            pop_served += cc['pop'] * 0.145 * (1 - d / 600)   # cell ≈ 0.145 km²
    pop_served = int(round(pop_served * (1.0 if fam != 'Bâtiments publics' else 0.6), -2))
    eq = sum(1 for f in fac if dist_m(f['px'], (px, py)) < 500)
    cost = int(round(COST[typ] * (0.35 + 0.3 * note) * random.uniform(0.85, 1.15), -5))
    days = DAYS[note]
    if fam.startswith('Voirie'):
        detour = random.uniform(1.5, 5.0)
        inaction = tmja * detour * 110 * days
    elif fam.startswith('Drainage'):
        inaction = pop_served * 0.25 * 900 * days
    else:
        inaction = pop_served * 0.3 * 2500 * days
    inaction = int(round(inaction, -5))
    if cost >= 25e6 or (fam.startswith('Drainage') and cost >= 15e6):
        fin = 'Bailleur (programme)'
    elif fam.startswith('Voirie'):
        fin = 'Fonds d’entretien routier'
    else:
        fin = 'Budget communal'
    name = f"{typ} {code}"
    if code == 'VO-01':
        code, name, typ = 'DLT01', 'Dalot double cellule DLT01 (maquette 3D)', 'Dalot double cellule'
    assets.append({
        'code': code, 'name': name, 'famille': fam, 'type': typ, 'lat': lat, 'lon': lon,
        'note': note, 'etat': ETAT[note], 'annee': random.choice([1998, 2003, 2007, 2009, 2012, 2015, 2018]),
        'cout': cost, 'inaction': inaction, 'financement': fin, 'tmja': tmja, 'pop': pop_served,
        'flood': c['flood'], 'sol': c['sol'], 'equip': eq,
        'inspection': random.choice(['2026-03', '2026-05', '2026-06', '2026-09', '2026-10']),
    })

for c in cells: c.pop('px')
for t in traffic: t.pop('px')
for f in fac: f.pop('px')
out = {'meta': {'cell_m': 380, 'note': 'Données entièrement fictives — démonstration GIN²CO'},
       'assets': assets, 'cells': cells, 'traffic': traffic, 'facilities': fac,
       'bounds': [px2ll(0, H), px2ll(W, 0)]}
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(assets), 'assets', len(cells), 'cells', len(traffic), 'traffic', len(fac), 'facilities')
for a in assets: print(a['code'], a['type'], a['etat'], a['lat'], a['lon'], a['tmja'], a['pop'], a['flood'], a['sol'][:12], a['equip'], f"{a['cout']:,}", f"{a['inaction']:,}", a['financement'])
