# Impact model for the Guinea profile (roads & agricultural flows) — executed inside gen_sig_gn.py (shares its globals).
# All figures are fictitious; the rules are deliberately simple and shown to the user.
import math as _m

PRICE = 3.5e6                     # GNF per tonne of produce (farm-gate to market, fictitious)
SUFF = 0.85
RESTRICT = {'Ouvrages d’art': {1: 0.0, 2: 0.05, 3: 0.3, 4: 0.55},
            'Routes revêtues': {1: 0.0, 2: 0.04, 3: 0.18, 4: 0.4},
            'Pistes rurales': {1: 0.03, 2: 0.12, 3: 0.32, 4: 0.55}}
EXTRA_CUT = {'Ouvrages d’art': {1: 0, 2: 2, 3: 8, 4: 20}, 'Routes revêtues': {1: 0, 2: 0, 3: 3, 4: 10},
             'Pistes rurales': {1: 0, 2: 6, 3: 22, 4: 45}}
LOSS = {1: 0.04, 2: 0.07, 3: 0.12, 4: 0.2}            # post-harvest losses on the leg served by the asset
VOC = {1: 0, 2: 0.05, 3: 0.15, 4: 0.3}                # vehicle operating cost increase


def fmt_fr(n, d=0):
    return f"{n:,.{d}f}".replace(',', ' ').replace('.', ',')


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


RULE = ("Efficacité = produits agricoles réellement acheminés ÷ flux potentiel si l'ouvrage était en bon état et praticable toute l'année. "
        "Le flux réel déduit les restrictions liées à l'état (limitations de charge, ralentissements) et les jours de coupure "
        "(submersion, bourbiers). Suffisant si ≥ 85 %. À renforcer : la remise en état suffit à dépasser 85 %. "
        "À compléter : même remis en état, l'ouvrage reste coupé une partie de l'année ; un aménagement complémentaire est nécessaire.",
        "Efficiency = farm produce actually carried ÷ potential flow if the asset were in good condition and passable all year round. "
        "The actual flow deducts condition-related restrictions (load limits, slowdowns) and closure days (submersion, mud). "
        "Sufficient if ≥ 85%. To be reinforced: rehabilitation is enough to exceed 85%. "
        "To be complemented: even rehabilitated, the asset stays cut part of the year; an additional improvement is needed.")

path_sets = [set(map(tuple, f['path'])) for f in flowpaths]


def passes(f_idx, p, tol=3):
    s = path_sets[f_idx]
    x, y = p
    return any((x + dx, y + dy) in s for dx in range(-tol, tol + 1) for dy in range(-tol, tol + 1))


for a in assets:
    N, fam, typ, fl = a['note'], a['famille'], a['type'], a['flood']
    through = [i for i in range(len(flowpaths)) if passes(i, a['_px'])]
    t_through = sum(flowpaths[i]['t'] for i in through)
    hh = sum(flowpaths[i]['hh'] for i in through)
    local = (a['tmja'] or 300) * (0.004 if fam != 'Pistes rurales' else 0.03) * 1.2 * 365
    potential = t_through + local
    # structural closure days (remain after rehabilitation)
    struct, comp = 0.0, None
    if typ == 'Radier submersible':
        struct = 25 + 60 * fl
        comp = ("Remplacer le radier par un dalot multicellulaire pour supprimer la submersion",
                "Replace the drift with a multi-cell box culvert to stop submersion", 4.2e9)
    elif typ in ('Buse métallique', 'Dalot simple') and fl >= 0.5:
        struct = 30 + 50 * fl
        comp = ("Remplacer par un dalot de section supérieure", "Replace with a larger box culvert", 3.1e9 if typ == 'Buse métallique' else 3.8e9)
    elif typ == 'Section en remblai sur zone basse' and fl >= 0.55:
        struct = 20 + 50 * fl
        comp = ("Rehausser le remblai et ajouter des buses de décharge", "Raise the embankment and add relief culverts", 6.5e9)
    elif typ == 'Piste en terre':
        struct = 40 + 50 * fl
        km = round(1.5 + 3 * fl, 1)
        comp = (f"Revêtir en latérite les points critiques sur ≈ {fmt_fr(km, 1)} km et créer les fossés",
                f"Gravel the critical points with laterite over ≈ {fmt_en(km, 1)} km and build side drains", km * 0.95e9)
    elif typ == 'Piste en latérite':
        struct = 4 + 10 * fl
    elif typ == 'Pont à poutres en béton armé':
        struct = 0.0
    else:
        struct = 2 * fl
    cut_now = min(330, struct + EXTRA_CUT[fam][N])
    actual = potential * (1 - RESTRICT[fam][N]) * (1 - cut_now / 365)
    rehab = potential * (1 - struct / 365)
    losses = t_through * LOSS[N]
    eff_now = actual / potential if potential else 1.0
    eff_rehab = rehab / potential if potential else 1.0
    v = verdict(eff_now, eff_rehab)
    inaction = (rehab - actual) * PRICE * 0.3 + losses * PRICE * 0.5 + (a['tmja'] or 0) * 365 * VOC[N] * 1500
    a['inaction'] = int(round(inaction, -7))
    kp = [kpi('Produits agricoles acheminés', 'Farm produce carried', actual, 't/an', 't/yr'),
          kpi('Valeur des produits acheminés', 'Value of produce carried', actual * PRICE / 1e9, 'Md GNF/an', 'bn GNF/yr', 1),
          kpi('Flux potentiel (ouvrage en bon état, praticable toute l’année)', 'Potential flow (good condition, passable all year)', potential, 't/an', 't/yr'),
          kpi('Ménages agricoles reliés aux marchés', 'Farm households linked to markets', hh, 'ménages', 'households'),
          kpi('Jours de coupure par an', 'Closure days per year', cut_now, 'j', 'days'),
          kpi('Pertes après récolte sur ce tronçon', 'Post-harvest losses on this leg', losses, 't/an', 't/yr')]
    srcs = sorted({flowpaths[i]['src']['name'] for i in through})
    srcs_en = sorted({flowpaths[i]['src']['name_en'] for i in through})
    kp.append({'fr': 'Origines des flux', 'en': 'Flow origins', 'txt': ', '.join(srcs) if srcs else 'Desserte locale uniquement',
               'txt_en': ', '.join(srcs_en) if srcs_en else 'Local traffic only'})
    imp = {'zone': [], 'residual': [], 'flows': [{'id': i, 't': int(round(flowpaths[i]['t'], -1))} for i in through],
           'kpis': kp, 'eff': round(min(eff_now, 1), 3), 'eff_rehab': round(min(eff_rehab, 1), 3), 'verdict': v,
           'complement': ({'fr': comp[0], 'en': comp[1], 'cost': int(round(comp[2], -7))} if v == 'À compléter' and comp else None),
           'rule': {'fr': RULE[0], 'en': RULE[1]},
           'label': {'fr': f"{fmt_fr(actual)} t/an de produits agricoles", 'en': f"{fmt_en(actual)} t/yr of farm produce"},
           'benef': actual, 'hh': int(round(hh, -1))}
    if v == 'À compléter' and not comp:      # safety net (should not happen)
        imp['complement'] = {'fr': 'Aménagement complémentaire à étudier', 'en': 'Additional improvement to be studied', 'cost': int(a['cout'])}
    a['impact'] = imp


def simplify(path, step=5):
    pts = path[::step] + [path[-1]]
    return [list(px2ll(*p)) for p in pts]


flowpaths_out = [{'id': f['id'], 'bname': f['src']['name'], 'bname_en': f['src']['name_en'], 'dname': f['dest']['name'],
                  'dname_en': f['dest']['name_en'], 't': int(round(f['t'], -1)), 'path': simplify(f['path'])} for f in flowpaths]
basins_out = [{'name': s['name'], 'name_en': s['name_en'], 'kind': s['kind'], 't': s['t'], 'hh': s['hh'],
               'lat': px2ll(*s['px'])[0], 'lon': px2ll(*s['px'])[1]} for s in sources + basins]
basins_out += [{'name': m_['name'], 'name_en': m_['name_en'], 'kind': 'marche', 't': 0, 'lat': px2ll(*m_['px'])[0], 'lon': px2ll(*m_['px'])[1]}
               for m_ in markets + [exit_sw]]
for a in assets:
    i = a['impact']
    print(f"{a['code']:6s} {a['type'][:24]:24s} n={a['note']} fl={a['flood']:.2f} flows={len(i['flows'])} eff={i['eff']:.2f} reh={i['eff_rehab']:.2f} {i['verdict']:12s} {i['label']['fr']}")
