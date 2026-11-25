"""Builds parts.json: for each asset, its IFC elements (tag code, name, IFC class) grouped into parts of works.
The element tag (e.g. OA-01-PT2) is the shared key between the document management and the 3D model."""
import glob, json, os, re, sys

RULES = [  # (part, name prefixes) — first match wins
    ('fond', ['Semelle', 'Parafouille']),
    ('appui', ['Culée', 'Pile', 'Piédroit', 'Mur en aile', 'Tête']),
    ('struct', ['Poutres', 'Hourdis', 'Dalle', 'Buse métallique', 'Buse de traversée', 'Radier']),
    ('equip', ['Appareils', 'Joints', 'Garde-corps', 'Trottoir', 'Glissière', 'Panneaux', 'Bornes', 'Balises']),
    ('hydro', ['Enrochements', 'Perré', 'Buse de décharge', 'Buses de décharge', 'Fossé', 'Divergents', 'Cassis']),
    ('chaus', ['Chaussée', 'Couche', 'Plateforme', 'Accotement', 'Remblai', 'Point critique', 'Rampe']),
]
HYDRO_RADIER = ('Radier d', 'Radier de')  # inlet / outlet aprons of culverts are hydraulic protections


def dec(s):
    s = s.replace("''", "'")
    return re.sub(r"\\X2\\([0-9A-F]+)\\X0\\", lambda m: ''.join(chr(int(m.group(1)[i:i + 4], 16)) for i in range(0, len(m.group(1)), 4)), s)


def part_of(name):
    if name.startswith(HYDRO_RADIER): return 'hydro'
    for part, prefixes in RULES:
        if any(name.startswith(p) for p in prefixes): return part
    return 'autre'


STR = r"'((?:[^']|'')*)'"
EL = re.compile(r"=IFC([A-Z]+)\(" + STR + r",(?:\$|#\d+)," + STR + r",(?:" + STR + r"|\$),(?:" + STR + r"|\$),(?:#\d+|\$),(?:#\d+|\$)," + STR)

def main(models_dir, out):
    res = {}
    for f in sorted(glob.glob(os.path.join(models_dir, '*.ifc'))):
        code = os.path.basename(f)[:-4]
        els = []
        for m in EL.finditer(open(f, encoding='latin1').read()):
            cls, name, tag = m.group(1), dec(m.group(3)), dec(m.group(6))
            if not tag.startswith(code + '-') or any(e['c'] == tag for e in els): continue
            els.append({'c': tag, 'n': name, 'p': part_of(name)})
        res[code] = els
    json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return res


if __name__ == '__main__':
    r = main(sys.argv[1], sys.argv[2])
    for k in ('OA-01', 'OA-02', 'OA-04', 'RN-03', 'PR-07'):
        print(k, [(e['c'].split('-')[-1], e['p']) for e in r[k]])
    print('autre:', sorted({e['n'] for v in r.values() for e in v if e['p'] == 'autre'}))
    print(sum(len(v) for v in r.values()), 'elements')
