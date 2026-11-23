// GIN²CO — Guinea impact chain, JavaScript port of gn/impact_gn.py (same constants, same rules).
// Used to recalculate an asset after an update in the browser, or to evaluate a new asset.

export const PRICE = 3.5e6;
export const SUFF = 0.85;
export const RESTRICT = {
  'Ouvrages d’art': { 1: 0, 2: 0.05, 3: 0.3, 4: 0.55 },
  'Routes revêtues': { 1: 0, 2: 0.04, 3: 0.18, 4: 0.4 },
  'Pistes rurales': { 1: 0.03, 2: 0.12, 3: 0.32, 4: 0.55 },
};
export const EXTRA_CUT = {
  'Ouvrages d’art': { 1: 0, 2: 2, 3: 8, 4: 20 },
  'Routes revêtues': { 1: 0, 2: 0, 3: 3, 4: 10 },
  'Pistes rurales': { 1: 0, 2: 6, 3: 22, 4: 45 },
};
export const LOSS = { 1: 0.04, 2: 0.07, 3: 0.12, 4: 0.2 };
export const VOC = { 1: 0, 2: 0.05, 3: 0.15, 4: 0.3 };
const RULE = {
  fr: 'Efficacité = produits agricoles réellement acheminés ÷ flux potentiel si l\'ouvrage était en bon état et praticable toute l\'année. Le flux réel déduit les restrictions liées à l\'état (limitations de charge, ralentissements) et les jours de coupure (submersion, bourbiers). Suffisant si ≥ 85 %. À renforcer : la remise en état suffit à dépasser 85 %. À compléter : même remis en état, l\'ouvrage reste coupé une partie de l\'année ; un aménagement complémentaire est nécessaire.',
  en: 'Efficiency = farm produce actually carried ÷ potential flow if the asset were in good condition and passable all year round. The actual flow deducts condition-related restrictions (load limits, slowdowns) and closure days (submersion, mud). Sufficient if ≥ 85%. To be reinforced: rehabilitation is enough to exceed 85%. To be complemented: even rehabilitated, the asset stays cut part of the year; an additional improvement is needed.',
};
const r10 = (x, n) => Math.round(x / 10 ** n) * 10 ** n;
const ffr = (n, d = 0) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n).replace(/ /g, ' ');
const fen = (n, d = 0) => new Intl.NumberFormat('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const rnd = (x) => { const f = Math.floor(x); const r = x - f; return Math.abs(r - 0.5) < 1e-9 ? (f % 2 === 0 ? f : f + 1) : Math.round(x); }; // same as Python round()
const kpi = (fr, en, v, ufr = '', uen = '', d = 0) => ({ fr, en, v: d ? rnd(v * 10 ** d) / 10 ** d : rnd(v), ufr, uen, d });

export const localFlow = (tmja, fam) => (tmja || 300) * (fam !== 'Pistes rurales' ? 0.004 : 0.03) * 1.2 * 365;

export function structural(typ, fl) {
  if (typ === 'Radier submersible') return [25 + 60 * fl, ['Remplacer le radier par un dalot multicellulaire pour supprimer la submersion', 'Replace the drift with a multi-cell box culvert to stop submersion', 4.2e9]];
  if ((typ === 'Buse métallique' || typ === 'Dalot simple') && fl >= 0.5) return [30 + 50 * fl, ['Remplacer par un dalot de section supérieure', 'Replace with a larger box culvert', typ === 'Buse métallique' ? 3.1e9 : 3.8e9]];
  if (typ === 'Section en remblai sur zone basse' && fl >= 0.55) return [20 + 50 * fl, ['Rehausser le remblai et ajouter des buses de décharge', 'Raise the embankment and add relief culverts', 6.5e9]];
  if (typ === 'Piste en terre') {
    const km = parseFloat((1.5 + 3 * fl).toFixed(1));
    return [40 + 50 * fl, [`Revêtir en latérite les points critiques sur ≈ ${ffr(km, 1)} km et créer les fossés`, `Gravel the critical points with laterite over ≈ ${fen(km, 1)} km and build side drains`, km * 0.95e9]];
  }
  if (typ === 'Piste en latérite') return [4 + 10 * fl, null];
  if (typ === 'Pont à poutres en béton armé') return [0, null];
  return [2 * fl, null];
}

// Flow through the asset, recovered from the published potential flow (existing assets).
export function throughFrom(a) {
  const pot = (a.impact.kpis || []).find((k) => /^Flux potentiel/.test(k.fr));
  return pot ? Math.max(0, pot.v - localFlow(a.tmja, a.famille)) : 0;
}

// a: {note, famille, type, flood, tmja, _through, _hh, _flows, _origin:{fr,en}}
export function impactGN(a) {
  const N = a.note, fam = a.famille, fl = a.flood;
  const tThrough = a._through || 0;
  const potential = tThrough + localFlow(a.tmja, fam);
  const [struct, comp] = structural(a.type, fl);
  const cutNow = Math.min(330, struct + EXTRA_CUT[fam][N]);
  const actual = potential * (1 - RESTRICT[fam][N]) * (1 - cutNow / 365);
  const rehab = potential * (1 - struct / 365);
  const losses = tThrough * LOSS[N];
  const effNow = potential ? actual / potential : 1;
  const effRehab = potential ? rehab / potential : 1;
  const v = effNow >= SUFF ? 'Suffisant' : effRehab >= SUFF ? 'À renforcer' : 'À compléter';
  const inaction = (rehab - actual) * PRICE * 0.3 + losses * PRICE * 0.5 + (a.tmja || 0) * 365 * VOC[N] * 1500;
  const hh = a._hh || 0;
  const kpis = [
    kpi('Produits agricoles acheminés', 'Farm produce carried', actual, 't/an', 't/yr'),
    kpi('Valeur des produits acheminés', 'Value of produce carried', actual * PRICE / 1e9, 'Md GNF/an', 'bn GNF/yr', 1),
    kpi('Flux potentiel (ouvrage en bon état, praticable toute l’année)', 'Potential flow (good condition, passable all year)', potential, 't/an', 't/yr'),
    kpi('Ménages agricoles reliés aux marchés', 'Farm households linked to markets', a._hhKpi ?? hh, 'ménages', 'households'),
    kpi('Jours de coupure par an', 'Closure days per year', cutNow, 'j', 'days'),
    kpi('Pertes après récolte sur ce tronçon', 'Post-harvest losses on this leg', losses, 't/an', 't/yr'),
    { fr: 'Origines des flux', en: 'Flow origins', txt: a._origin ? a._origin.fr : 'Desserte locale uniquement', txt_en: a._origin ? a._origin.en : 'Local traffic only' },
  ];
  let complement = v === 'À compléter' && comp ? { fr: comp[0], en: comp[1], cost: r10(comp[2], 7) } : null;
  if (v === 'À compléter' && !comp) complement = { fr: 'Aménagement complémentaire à étudier', en: 'Additional improvement to be studied', cost: Math.round(a.cout || 0) };
  return {
    inaction: r10(inaction, 7),
    impact: {
      zone: [], residual: [], flows: a._flows || [], kpis,
      eff: Math.round(Math.min(effNow, 1) * 1000) / 1000, eff_rehab: Math.round(Math.min(effRehab, 1) * 1000) / 1000, verdict: v,
      complement, rule: RULE,
      label: { fr: `${ffr(actual)} t/an de produits agricoles`, en: `${fen(actual)} t/yr of farm produce` },
      benef: actual, hh: r10(hh, 1),
    },
  };
}
