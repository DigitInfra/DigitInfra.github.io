// GIN²CO — parts of works and document targets.
// A document targets any number of nodes of the tree  asset → part → element:
//   'OA-01' (whole asset) · 'OA-01#struct' (part) · 'OA-01-PT2' (IFC element, its tag in the model).
// A document of a project with no target is a general project document.
export const PARTS = [
  ['fond', 'Fondations', 'Foundations'],
  ['appui', 'Appuis et têtes', 'Supports and headwalls'],
  ['struct', 'Structure porteuse', 'Load-bearing structure'],
  ['equip', 'Équipements', 'Equipment'],
  ['hydro', 'Hydraulique et protections', 'Drainage and protection'],
  ['chaus', 'Chaussée et terrassements', 'Pavement and earthworks'],
  ['autre', 'Autres éléments', 'Other elements'],
];

export function createCatalog(data) {
  const cat = data || {};
  const elIndex = new Map();
  for (const [asset, els] of Object.entries(cat)) for (const e of els) elIndex.set(e.c, { ...e, a: asset });
  const partName = (k, lang) => { const p = PARTS.find((x) => x[0] === k); return p ? p[lang === 'en' ? 2 : 1] : k; };
  const partsOf = (asset) => PARTS.map(([k]) => ({ k, key: `${asset}#${k}`, els: (cat[asset] || []).filter((e) => e.p === k) })).filter((p) => p.els.length);
  // kind of a target key
  const kind = (t) => (t.includes('#') ? 'part' : elIndex.has(t) ? 'el' : 'asset');
  const assetOf = (t) => (kind(t) === 'el' ? elIndex.get(t).a : t.split('#')[0]);
  const parentOf = (t) => { const k = kind(t); if (k === 'el') { const e = elIndex.get(t); return `${e.a}#${e.p}`; } if (k === 'part') return t.split('#')[0]; return null; };
  const ancestors = (t) => { const out = []; let x = parentOf(t); while (x) { out.push(x); x = parentOf(x); } return out; };
  const inside = (t, node) => t === node || ancestors(t).includes(node); // t is node or below it
  const label = (t, lang) => {
    const k = kind(t);
    if (k === 'el') { const e = elIndex.get(t); return `${e.c.slice(e.a.length + 1)} — ${e.n}`; }
    if (k === 'part') { const [a, p] = t.split('#'); return `${a} · ${partName(p, lang)}`; }
    return t;
  };
  // element codes covered by a target (for 3D highlight)
  const expand = (t) => { const k = kind(t); if (k === 'el') return [t]; if (k === 'part') { const [a, p] = t.split('#'); return (cat[a] || []).filter((e) => e.p === p).map((e) => e.c); } return (cat[t] || []).map((e) => e.c); };
  return { cat, elIndex, partName, partsOf, kind, assetOf, parentOf, ancestors, inside, label, expand, has: (a) => !!cat[a] };
}

// targets of a document: explicit ones, else the asset it is attached to, else none (general)
export const targetsOf = (d, isAsset) => (d.targets && d.targets.length ? d.targets : isAsset(d.link) ? [d.link] : []);

// checkbox tree to choose document targets among the given assets
export function targetPicker(C, assets, selected, { lang, esc, name, tv }) {
  const sel = new Set(selected || []);
  const ck = (v, lab, extra = '') => `<label class="tp-ck${extra}"><input type="checkbox" value="${esc(v)}"${sel.has(v) ? ' checked' : ''}> <span>${lab}</span></label>`;
  const L_ = lang === 'en';
  return `<div class="tp" data-tp="${esc(name)}">${assets.map((a) => {
    const parts = C.partsOf(a.code);
    return `<div class="tp-asset">${ck(a.code, `<b class="mono">${esc(a.code)}</b> ${esc(tv ? tv(a.type) : '')} — ${L_ ? 'whole asset' : 'ouvrage entier'}`)}
      ${parts.length ? `<div class="tp-parts">${parts.map((p) => {
        const open = p.els.some((e) => sel.has(e.c));
        return `<div class="tp-part">${ck(p.key, `${esc(C.partName(p.k, lang))} <small>(${p.els.length})</small>`)}
          <details${open ? ' open' : ''}><summary>${L_ ? 'Elements' : 'Éléments'}</summary><div class="tp-els">${p.els.map((e) => ck(e.c, `<span class="mono">${esc(e.c.slice(a.code.length + 1))}</span> ${esc(e.n)}`)).join('')}</div></details></div>`;
      }).join('')}</div>` : `<p class="bv-muted tp-none">${L_ ? 'No IFC model: the asset can only be targeted as a whole.' : 'Pas de maquette IFC : l’ouvrage ne peut être ciblé qu’en entier.'}</p>`}</div>`;
  }).join('')}</div>`;
}
export const readPicker = (root, name) => [...root.querySelectorAll(`[data-tp="${name}"] input:checked`)].map((i) => i.value);
