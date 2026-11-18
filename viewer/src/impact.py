# Impact model for GIN²CO demo assets — executed inside gen_sig.py (shares its globals).
# All figures are fictitious; the rules are deliberately simple and are shown to the user.
import math as _m

CELL_KM2 = 0.1444            # 380 m x 380 m
CELL_HA = CELL_KM2 * 100
PX_M = 9.5
AVAIL = {1: 1.0, 2: 0.92, 3: 0.75, 4: 0.5}          # service availability by condition (buildings)
DRAIN_AV = {1: 1.0, 2: 0.85, 3: 0.6, 4: 0.3}        # hydraulic efficiency by condition (obstruction)
RESTRICT = {1: 0.0, 2: 0.05, 3: 0.35, 4: 0.6}       # share of heavy traffic lost (load limits / closures)
SUFF = 0.85


def dpx(a, b):
    return _m.hypot(a[0] - b[0], a[1] - b[1]) * PX_M


def seg_dist(p, a, b):
    ax, ay = a; bx, by = b; px_, py_ = p
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy or 1
    t_ = max(0, min(1, ((px_ - ax) * vx + (py_ - ay) * vy) / L2))
    return _m.hypot(ax + t_ * vx - px_, ay + t_ * vy - py_) * PX_M


def cell_pop(c):
    return c['pop'] * CELL_KM2


def fmt_fr(n, d=0):
    s = f"{n:,.{d}f}".replace(',', ' ').replace('.', ',')
    return s


def fmt_en(n, d=0):
    return f"{n:,.{d}f}"


def kpi(fr, en, v, ufr='', uen='', d=0):
    return {'fr': fr, 'en': en, 'v': round(v, d) if d else int(round(v)), 'ufr': ufr, 'uen': uen, 'd': d}


def verdict(eff_now, eff_rehab):
    if eff_now >= SUFF:
        return 'Suffisant'
    if eff_rehab >= SUFF:
        return 'À renforcer'
    return 'À compléter'


RULE_COMMON = ("Efficacité = service rendu ÷ besoin de la zone. Suffisant si ≥ 85 %. "
               "À renforcer : la réhabilitation de l'ouvrage suffit à dépasser 85 %. "
               "À compléter : même réhabilité, l'ouvrage reste sous 85 % ; un complément est nécessaire.",
               "Efficiency = service delivered ÷ need of the area. Sufficient if ≥ 85%. "
               "To be reinforced: rehabilitating the asset is enough to exceed 85%. "
               "To be complemented: even rehabilitated, the asset stays below 85%; additional capacity is needed.")

# ------------------------------------------------------------------ agricultural production basins (fictitious)
basins = []
ys, xs = np.nonzero((wet_smooth > 0.32) & land & ~pink)
order = np.random.RandomState(11).permutation(len(xs))
for k in order:
    p = (int(xs[k]), int(ys[k]))
    if all(dpx(p, b['px']) > 1800 for b in basins) and d_lagoon[p[1], p[0]] > 200:
        basins.append({'px': p, 'name': f"Bassin maraîcher {'ABCDE'[len(basins)]}", 'kind': 'maraicher',
                       't': int(round(random.uniform(1800, 6500), -2))})
    if len(basins) == 5:
        break
# hinterland entries: land pixels on trunk/primary roads near the west and north-west edges
for nm, x_range, y_range, tons in (("Arrière-pays ouest", (0, 30), (H * 0.35, H * 0.8), 34000),
                                   ("Arrière-pays nord-ouest", (0, 60), (0, H * 0.35), 22000)):
    ys2, xs2 = np.nonzero((trunk | primary) & land)
    cand = [(int(x), int(y)) for x, y in zip(xs2, ys2) if x_range[0] <= x <= x_range[1] and y_range[0] <= y <= y_range[1]]
    if cand:
        p = cand[len(cand) // 2]
        basins.append({'px': p, 'name': nm, 'kind': 'arriere', 't': tons})

markets = [{'px': tuple(f['px']), 'name': f"Marché (fictif) {i + 1}"} for i, f in enumerate([f for f in fac if f['type'] == 'Marché'])]
for a in assets:
    if a['type'] == 'Marché couvert':
        markets.append({'px': a['_px'], 'name': f"{a['code']} — Marché couvert"})
pys, pxs = np.nonzero(pink)
port = {'px': (int(pxs.mean()), int(pys.mean())), 'name': 'Zone portuaire'}

flows = []   # basin -> destination legs
for b in basins:
    near = sorted(markets, key=lambda m_: dpx(b['px'], m_['px']))
    if b['kind'] == 'maraicher':
        legs = [(near[0], 0.6), (near[1], 0.4)]
    else:
        legs = [(port, 0.4), (near[0], 0.35), (near[1], 0.25)]
    for dest, share in legs:
        flows.append({'b': b, 'dest': dest, 't': b['t'] * share})

# ------------------------------------------------------------------ facilities by type (for catchments)
def same_type_points(kind):
    pts = []
    if kind == 'sante':
        pts += [tuple(f['px']) for f in fac if f['type'] == 'Centre de santé']
        pts += [a['_px'] for a in assets if a['type'] == 'Centre de santé']
    elif kind == 'ecole':
        pts += [tuple(f['px']) for f in fac if f['type'] == 'École']
        pts += [a['_px'] for a in assets if a['type'] == 'École primaire']
    return pts


def catchment(a, kind, rmax):
    """cells whose nearest same-type facility is this asset (Voronoi), within rmax metres."""
    pts = same_type_points(kind)
    out = []
    for i, c in enumerate(cells):
        d_self = dpx(c['px'], a['_px'])
        if d_self > rmax:
            continue
        ds = sorted(dpx(c['px'], p) for p in pts)
        if not pts or abs(ds[0] - d_self) < 1e-6:
            second = ds[1] if len(ds) > 1 else d_self + 3000
            out.append((i, d_self, second))
    return out


def complement(fr, en, cost):
    return {'fr': fr, 'en': en, 'cost': int(round(cost, -5))}


for a in assets:
    N = a['note']
    t_ = a['type']
    imp = {'zone': [], 'residual': [], 'flows': []}
    if t_ in ('Centre de santé', 'École primaire'):
        kind = 'sante' if t_ == 'Centre de santé' else 'ecole'
        cat = catchment(a, kind, 3000 if kind == 'sante' else 1500)
        pop = sum(cell_pop(cells[i]) for i, _, _ in cat)
        extra = (sum(cell_pop(cells[i]) * (s - d) for i, d, s in cat) / pop / 1000) if pop else 0
        if kind == 'sante':
            need = pop * 0.55; cap = 45000
            unit_fr, unit_en = 'consultations/an', 'consultations/yr'
            kp = [kpi("Population de l'aire de desserte", 'Population of the catchment', pop, 'hab.', 'people'),
                  kpi('Consultations nécessaires', 'Consultations needed', need, unit_fr, unit_en),
                  kpi('Capacité de l’ouvrage', 'Asset capacity', cap, unit_fr, unit_en),
                  kpi('Distance supplémentaire si l’ouvrage fermait', 'Extra distance if the asset closed', extra, 'km', 'km', 1)]
            miss = max(0, need - cap)
            comp = complement(f"Extension ou second centre de santé : capacité manquante ≈ {fmt_fr(miss, 0)} consultations/an",
                              f"Extension or second health centre: missing capacity ≈ {fmt_en(miss, 0)} consultations/yr",
                              miss / 45000 * 160e6)
        else:
            need = pop * 0.17 * 0.25; cap = 720
            unit_fr, unit_en = 'élèves', 'pupils'
            kp = [kpi("Population de l'aire de desserte", 'Population of the catchment', pop, 'hab.', 'people'),
                  kpi('Enfants à scolariser dans le public', 'Children to enrol in public school', need, unit_fr, unit_en),
                  kpi('Places disponibles (6 salles, double flux)', 'Places available (6 rooms, double shift)', cap, unit_fr, unit_en),
                  kpi('Distance supplémentaire si l’ouvrage fermait', 'Extra distance if the asset closed', extra, 'km', 'km', 1)]
            miss = max(0, need - cap)
            rooms = _m.ceil(miss / 120)
            comp = complement(f"Construire {rooms} salle(s) de classe supplémentaire(s) (≈ {fmt_fr(miss)} élèves sans place)",
                              f"Build {rooms} additional classroom(s) (≈ {fmt_en(miss)} pupils without a place)",
                              rooms * 9e6)
        served_now = min(need, cap * AVAIL[N]); served_rehab = min(need, cap)
        imp['zone'] = [i for i, _, _ in cat]
        imp['label'] = {'fr': f"{fmt_fr(pop)} hab. desservis", 'en': f"{fmt_en(pop)} people served"}
        imp['benef'] = pop
    elif t_ in ('Collège', 'Mairie d’arrondissement', 'Marché couvert'):
        r = {'Collège': 1200, 'Mairie d’arrondissement': 1500, 'Marché couvert': 1500}[t_]
        cat = [(i, dpx(c['px'], a['_px'])) for i, c in enumerate(cells) if dpx(c['px'], a['_px']) <= r]
        pop = sum(cell_pop(cells[i]) for i, _ in cat)
        if t_ == 'Collège':
            need = pop * 0.13 * 0.25; cap = 1600
            kp = [kpi("Population de l'aire de desserte", 'Population of the catchment', pop, 'hab.', 'people'),
                  kpi('Élèves à accueillir', 'Pupils to accommodate', need, 'élèves', 'pupils'),
                  kpi('Places disponibles', 'Places available', cap, 'élèves', 'pupils')]
            miss = max(0, need - cap); rooms = _m.ceil(miss / 120)
            comp = complement(f"Ajouter un module de {rooms} salle(s) (≈ {fmt_fr(miss)} élèves sans place)",
                              f"Add a {rooms}-room block (≈ {fmt_en(miss)} pupils without a place)", rooms * 11e6)
        elif t_ == 'Marché couvert':
            need = pop / 180; cap = 600
            tons = cap * 0.25 * 300
            kp = [kpi('Population de la zone de chalandise', 'Population of the trade area', pop, 'hab.', 'people'),
                  kpi('Places de vente nécessaires', 'Stalls needed', need, 'places', 'stalls'),
                  kpi('Places de vente disponibles', 'Stalls available', cap, 'places', 'stalls'),
                  kpi('Produits agricoles commercialisés', 'Farm produce traded', tons * AVAIL[N], 't/an', 't/yr')]
            miss = max(0, need - cap)
            comp = complement(f"Extension du marché : ≈ {fmt_fr(miss)} places de vente supplémentaires",
                              f"Market extension: ≈ {fmt_en(miss)} additional stalls", miss * 0.35e6)
        else:
            need = pop * 0.15; cap = 20000
            kp = [kpi('Population de l’arrondissement desservi', 'Population of the district served', pop, 'hab.', 'people'),
                  kpi('Démarches administratives par an', 'Administrative procedures per year', need, 'démarches', 'procedures'),
                  kpi('Capacité de traitement', 'Processing capacity', cap, 'démarches', 'procedures')]
            miss = max(0, need - cap)
            comp = complement(f"Ouvrir une antenne administrative (≈ {fmt_fr(miss)} démarches/an non traitées)",
                              f"Open an administrative branch office (≈ {fmt_en(miss)} procedures/yr unprocessed)", 45e6)
        served_now = min(need, cap * AVAIL[N]); served_rehab = min(need, cap)
        imp['zone'] = [i for i, _ in cat]
        imp['label'] = {'fr': f"{fmt_fr(pop)} hab. desservis", 'en': f"{fmt_en(pop)} people served"}
        imp['benef'] = pop
    elif a['famille'].startswith('Voirie'):
        through = []
        for f in flows:
            if seg_dist(a['_px'], f['b']['px'], f['dest']['px']) < (650 if f['b']['kind'] == 'arriere' else 900):
                through.append(f)
        local = (a['tmja'] or 2000) * 0.004 * 1.2 * 365
        potential = sum(f['t'] for f in through) + local
        undersized = a['type'] in ('Ponceau', 'Dalot simple') and a['flood'] >= 0.5
        sub_days = int(round(25 + 40 * a['flood'])) if undersized else int(round(4 * a['flood']))
        actual = potential * (1 - RESTRICT[N]) * (1 - sub_days / 365)
        rehab = potential * (1 - sub_days / 365)
        value = actual * 175000
        need, served_now, served_rehab = potential, actual, rehab
        kp = [kpi('Produits agricoles évacués', 'Farm produce carried', actual, 't/an', 't/yr'),
              kpi('Valeur des produits évacués', 'Value of produce carried', value / 1e6, 'M FCFA/an', 'M FCFA/yr', 1),
              kpi('Flux potentiel (ouvrage en bon état)', 'Potential flow (asset in good condition)', potential, 't/an', 't/yr'),
              kpi('Jours de submersion par an', 'Days submerged per year', sub_days, 'j', 'days')]
        names = sorted({f['b']['name'] for f in through})
        dests = sorted({f['dest']['name'] for f in through})
        kp.append({'fr': 'Bassins reliés', 'en': 'Linked basins', 'txt': ', '.join(names) if names else 'Desserte locale uniquement',
                   'txt_en': ', '.join(n.replace('Bassin maraîcher', 'Market-garden basin').replace('Arrière-pays ouest', 'Western hinterland').replace('Arrière-pays nord-ouest', 'North-western hinterland') for n in names) if names else 'Local traffic only'})
        comp = complement("Remplacer par un dalot de section supérieure pour supprimer la submersion"
                          if undersized else "Doubler l'ouvrage pour absorber le flux poids lourds",
                          "Replace with a larger box culvert to stop submersion" if undersized else "Duplicate the structure to carry heavy traffic",
                          {'Ponceau': 28e6, 'Dalot simple': 35e6}.get(a['type'], 60e6))
        imp['flows'] = [{'from': list(px2ll(*f['b']['px'])), 'bname': f['b']['name'], 'to': list(px2ll(*f['dest']['px'])),
                         'dname': f['dest']['name'], 't': int(round(f['t'], -1))} for f in through]
        imp['label'] = {'fr': f"{fmt_fr(actual, 0)} t/an de produits agricoles", 'en': f"{fmt_en(actual, 0)} t/yr of farm produce"}
        imp['benef'] = actual
    else:   # drainage
        r = {'Caniveau maçonné': 650, 'Collecteur secondaire': 750, 'Collecteur principal': 1100, 'Exutoire': 1300,
             'Bassin de rétention': 950, 'Station de relevage': 850}[t_]
        capha = {'Caniveau maçonné': 12, 'Collecteur secondaire': 45, 'Collecteur principal': 110, 'Exutoire': 150,
                 'Bassin de rétention': 90, 'Station de relevage': 60}[t_]
        cat = sorted([(i, dpx(c['px'], a['_px'])) for i, c in enumerate(cells) if dpx(c['px'], a['_px']) <= r and c['flood'] >= 0.15],
                     key=lambda x: x[1])
        need_ha = sum(CELL_HA * cells[i]['flood'] for i, _ in cat)
        cov_rehab = min(need_ha, capha)
        cov_now = cov_rehab * DRAIN_AV[N]
        acc, prot, resid = 0.0, [], []
        for i, _ in cat:
            w = CELL_HA * cells[i]['flood']
            (prot if acc + w / 2 <= cov_rehab else resid).append(i)
            acc += w
        pop_prot = sum(cell_pop(cells[i]) for i in prot) * (cov_now / cov_rehab if cov_rehab else 0)
        hh = pop_prot / 5.5
        base_days = 8 + 30 * (sum(cells[i]['flood'] for i, _ in cat) / len(cat) if cat else 0)
        days_av = base_days * (cov_now / need_ha if need_ha else 0)
        dmg = hh * days_av * 3500
        need, served_now, served_rehab = need_ha, cov_now, cov_rehab
        kp = [kpi('Ménages protégés des inondations', 'Households protected from flooding', hh, 'ménages', 'households'),
              kpi('Surface protégée', 'Area protected', cov_now, 'ha', 'ha', 1),
              kpi('Surface inondable de la zone', 'Flood-prone area of the zone', need_ha, 'ha', 'ha', 1),
              kpi('Jours d’inondation évités par an', 'Flood days avoided per year', days_av, 'j/an', 'days/yr', 1),
              kpi('Dommages évités', 'Damage avoided', dmg / 1e6, 'M FCFA/an', 'M FCFA/yr', 1)]
        resid_ha = max(0, need_ha - cov_rehab)
        L_ = int(round(resid_ha * 9, -1))
        comp = complement(f"Étendre le réseau : ≈ {fmt_fr(L_)} m de collecteur pour protéger {fmt_fr(resid_ha, 1)} ha restants",
                          f"Extend the network: ≈ {fmt_en(L_)} m of storm sewer to protect the remaining {fmt_en(resid_ha, 1)} ha",
                          L_ * 210000)
        imp['zone'] = prot; imp['residual'] = resid
        imp['label'] = {'fr': f"{fmt_fr(hh)} ménages protégés", 'en': f"{fmt_en(hh)} households protected"}
        if need_ha < 3:
            imp['label'] = {'fr': 'Zone peu exposée aux inondations', 'en': 'Area with low flood exposure'}
            imp['lowexp'] = True
        imp['benef'] = hh
    eff_now = served_now / need if need else 1.0
    eff_rehab = served_rehab / need if need else 1.0
    v = verdict(eff_now, eff_rehab)
    imp.update({'kpis': kp, 'eff': round(min(eff_now, 1), 3), 'eff_rehab': round(min(eff_rehab, 1), 3), 'verdict': v,
                'complement': comp if v == 'À compléter' else None, 'rule': {'fr': RULE_COMMON[0], 'en': RULE_COMMON[1]}})
    a['impact'] = imp

basins_out = [{'name': b['name'], 'kind': b['kind'], 't': b['t'], 'lat': px2ll(*b['px'])[0], 'lon': px2ll(*b['px'])[1]} for b in basins]
print('basins', [(b['name'], b['t']) for b in basins])
for a in assets:
    i = a['impact']
    print(f"{a['code']:6s} {a['type'][:20]:20s} note={a['note']} eff={i['eff']:.2f} rehab={i['eff_rehab']:.2f} {i['verdict']:12s} {i['label']['fr']}", (i['complement'] or {}).get('fr', ''))
