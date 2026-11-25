// GIN²CO — GIS decision-support demo (Leaflet + OpenStreetMap basemap, fictitious asset data)
import L from 'leaflet';
import { createAssistant } from './assistant.js';
import { createStore, MEMBERS, ACCESS } from './store.js';
import { impactGN, throughFrom } from './impact_gn.js';

/* ------------------------------------------------------------------ i18n */
const T = {
  fr: {
    colorBy: 'Ouvrages colorés par', base: 'Couche de fond', none: 'Aucune', traffic: 'Trafic', facilities: 'Équipements',
    weights: 'Pondération des critères', reset: 'Réinitialiser', budget: 'Enveloppe budgétaire',
    funded: 'Ouvrages financés', committed: 'Montant engagé', avoided: 'Coût de l’inaction évité / an',
    legend: 'Légende', rank: 'Rang', code: 'Code', asset: 'Ouvrage', family: 'Famille', condition: 'État', score: 'Score',
    cost: 'Coût ({CUR})', cum: 'Cumul ({CUR})', fin: 'Financé', source: 'Financement envisagé',
    open3d: 'Voir en 3D', loading: 'Chargement de la carte…', back: '← Retour à la carte', loading3d: 'Chargement de la maquette…',
    popDens: 'Densité de population (maille)', noLayer: 'Aucune couche de contexte n’était active sur la carte.',
    impact: 'Impact', eff: 'Efficacité', effNow: 'Efficacité actuelle', effRehab: 'Après réhabilitation', verdict: 'Verdict',
    complement: 'Complément proposé', rule: 'Règle de calcul', basins: 'Bassins agricoles', zoneServed: 'Zone desservie ou protégée',
    zoneResid: 'Zone inondable non protégée', flowsLeg: 'Flux de produits agricoles (t/an)', queryChip: 'Requête', clear: 'Effacer',
    results: (n) => `${n} résultat${n > 1 ? 's' : ''}`, effLeg: ['≥ 85 %', '60 – 85 %', '< 60 %'], estCost: 'coût estimé',
    depth: 'Lame d’eau de référence', within: 'à moins de 500 m', none500: 'aucun à moins de 500 m', ctxNote: 'Couches reprises de la carte',
    disclaimer: 'Fond de carte réel utilisé à titre d’illustration. Ouvrages, états, couches et montants sont fictifs et ne décrivent pas le patrimoine de cette ville.',
    tmja: 'Trafic (TMJA, véh./j)', pop: 'Population à proximité (600 m)', flood: 'Aléa inondation', sol: 'Sol', equip: 'Équipements à moins de 500 m',
    inaction: 'Coût de l’inaction ({CUR}/an)', year: 'Mise en service', insp: 'Dernière inspection', type: 'Type',
    breakdown: 'Contribution au score', yes: 'Oui', no: 'Non', perKm: 'hab./km²',
    fundedLeg: 'Financé dans l’enveloppe', notFundedLeg: 'Hors enveloppe', sizeLeg: 'Taille du cercle : coût',
    floodCls: ['Faible', 'Modéré', 'Élevé', 'Très élevé'], fac: { 'École': 'École', 'Centre de santé': 'Centre de santé', 'Marché': 'Marché' },
    vpj: 'véh./j', hint: 'Cliquez sur un ouvrage ou sur une ligne du tableau.', noTraffic: 'non applicable',
    budgetNote: 'Les ouvrages sont retenus par ordre de score ; un ouvrage qui dépasse le reliquat est sauté au profit des suivants.',
    navHome: 'Mon espace', navMap: 'Carte', navDash: 'Scénarios', navProf: 'Tableaux de bord', navAssets: 'Patrimoine', navProj: 'Projets', navCollab: 'Collaboration', spaces: 'Espaces accessibles', views: 'Vues de tableau de bord', noView: 'aucune', search: 'Rechercher un ouvrage', demoBadge: 'Démonstration · données fictives', switchProfile: 'Changer de profil', rights: 'Vos droits', readOnly: 'consultation et commentaires', ranking: 'Classement détaillé', site: 'Site DigitInfra', otherZone: 'Démonstrateur Bénin', menu: 'Menu', tabMap: 'Carte et classement', tabDash: 'Tableau de bord des scénarios', tabProf: 'Vues par profil', tabAssets: 'Patrimoine et mises à jour', tabProj: 'Projets et qualité', tabCollab: 'Espace collaboratif', talk: 'Échanges', pickMsg: 'Cliquez sur la carte pour placer le nouvel ouvrage (Échap pour annuler).', modNote: 'Données mises à jour après la production de la maquette : les coûts des éléments peuvent différer.', addNote: 'Ouvrage ajouté : sa maquette IFC reste à produire.', navGed: 'Documents (GED)', projLayer: 'Projets en cours', projOf: 'Projet en cours', stepL: 'Étape', progress: 'Avancement des étapes', docsL: 'Documents du projet', noDocs: 'Aucun document.', ver3d: 'Maquette 3D', verPick: 'Version de la maquette', openProj: 'Espace projet', openGed: 'Tous les documents', moreDocs: (n) => `+ ${n} autre(s)`, open3dV: 'Ouvrir la version en 3D',
  },
  en: {
    colorBy: 'Colour assets by', base: 'Base layer', none: 'None', traffic: 'Traffic', facilities: 'Facilities',
    weights: 'Criteria weights', reset: 'Reset', budget: 'Budget envelope',
    funded: 'Assets funded', committed: 'Amount committed', avoided: 'Avoided cost of inaction / yr',
    legend: 'Legend', rank: 'Rank', code: 'Code', asset: 'Asset', family: 'Family', condition: 'Condition', score: 'Score',
    cost: 'Cost ({CUR})', cum: 'Cumulative ({CUR})', fin: 'Funded', source: 'Intended funding',
    open3d: 'View in 3D', loading: 'Loading the map…', back: '← Back to the map', loading3d: 'Loading the model…',
    popDens: 'Population density (grid cell)', noLayer: 'No context layer was active on the map.',
    impact: 'Impact', eff: 'Efficiency', effNow: 'Current efficiency', effRehab: 'After rehabilitation', verdict: 'Verdict',
    complement: 'Proposed complement', rule: 'Calculation rule', basins: 'Farm basins', zoneServed: 'Area served or protected',
    zoneResid: 'Flood-prone area not protected', flowsLeg: 'Farm produce flows (t/yr)', queryChip: 'Query', clear: 'Clear',
    results: (n) => `${n} result${n > 1 ? 's' : ''}`, effLeg: ['≥ 85%', '60 – 85%', '< 60%'], estCost: 'estimated cost',
    depth: 'Reference water depth', within: 'within 500 m', none500: 'none within 500 m', ctxNote: 'Layers carried over from the map',
    disclaimer: 'Real basemap used for illustration only. Assets, conditions, layers and amounts are fictitious and do not describe this city’s assets.',
    tmja: 'Traffic (AADT, veh./day)', pop: 'Population nearby (600 m)', flood: 'Flood hazard', sol: 'Soil', equip: 'Facilities within 500 m',
    inaction: 'Cost of inaction ({CUR}/yr)', year: 'In service since', insp: 'Last inspection', type: 'Type',
    breakdown: 'Score contribution', yes: 'Yes', no: 'No', perKm: 'pop./km²',
    fundedLeg: 'Funded within envelope', notFundedLeg: 'Outside envelope', sizeLeg: 'Circle size: cost',
    floodCls: ['Low', 'Moderate', 'High', 'Very high'], fac: { 'École': 'School', 'Centre de santé': 'Health centre', 'Marché': 'Market' },
    vpj: 'veh./day', hint: 'Click an asset or a table row.', noTraffic: 'not applicable',
    budgetNote: 'Assets are selected by score; an asset exceeding the remaining amount is skipped in favour of the next ones.',
    navHome: 'My space', navMap: 'Map', navDash: 'Scenarios', navProf: 'Dashboards', navAssets: 'Assets', navProj: 'Projects', navCollab: 'Collaboration', spaces: 'Available spaces', views: 'Dashboard views', noView: 'none', search: 'Search an asset', demoBadge: 'Demonstration · fictitious data', switchProfile: 'Switch profile', rights: 'Your rights', readOnly: 'view and comment', ranking: 'Detailed ranking', site: 'DigitInfra website', otherZone: 'Benin demonstrator', menu: 'Menu', tabMap: 'Map and ranking', tabDash: 'Scenario dashboard', tabProf: 'Profile views', tabAssets: 'Assets and updates', tabProj: 'Projects and quality', tabCollab: 'Collaborative space', talk: 'Discussions', pickMsg: 'Click on the map to place the new asset (Esc to cancel).', modNote: 'Data updated after the model was produced: element costs may differ.', addNote: 'Added asset: its IFC model is still to be produced.', navGed: 'Documents (EDMS)', projLayer: 'Ongoing projects', projOf: 'Ongoing project', stepL: 'Step', progress: 'Step progress', docsL: 'Project documents', noDocs: 'No document.', ver3d: '3D model', verPick: 'Model version', openProj: 'Project space', openGed: 'All documents', moreDocs: (n) => `+ ${n} more`, open3dV: 'Open this version in 3D',
  },
};
const CRIT = [
  ['etat', ['État de l’ouvrage', 'Asset condition'], 5],
  ['pop', ['Population desservie', 'Population served'], 3],
  ['trafic', ['Trafic', 'Traffic'], 3],
  ['flood', ['Aléa inondation', 'Flood hazard'], 3],
  ['sol', ['Sensibilité du sol', 'Soil sensitivity'], 1],
  ['equip', ['Équipements sensibles', 'Sensitive facilities'], 2],
  ['fin', ['Rentabilité (inaction / coût)', 'Return (inaction / cost)'], 3],
];
const EN = {
  'Voirie & ouvrages d’art': 'Roads & structures', 'Drainage & assainissement': 'Drainage & sanitation', 'Bâtiments publics': 'Public buildings',
  Bon: 'Good', Moyen: 'Fair', 'Dégradé': 'Poor', Critique: 'Critical',
  'Sables littoraux': 'Coastal sands', 'Argiles et vases compressibles': 'Compressible clays and silts', 'Terre de barre (sols latéritiques)': 'Lateritic soils',
  'Fonds d’entretien routier': 'Road maintenance fund', 'Budget communal': 'Municipal budget', 'Bailleur (programme)': 'Lender (programme)',
  'Dalot double cellule': 'Double box culvert', 'Dalot simple': 'Box culvert', 'Dalot triple cellule': 'Triple box culvert', Ponceau: 'Small culvert',
  'Collecteur principal': 'Main storm sewer', 'Collecteur secondaire': 'Secondary storm sewer', 'Caniveau maçonné': 'Masonry drain', Exutoire: 'Outfall',
  'Bassin de rétention': 'Retention basin', 'Station de relevage': 'Pumping station', 'École primaire': 'Primary school', 'Centre de santé': 'Health centre',
  'Mairie d’arrondissement': 'District town hall', 'Marché couvert': 'Covered market', 'Collège': 'Secondary school',
  'Voie express': 'Expressway', 'Voie principale': 'Main road', 'Voie secondaire': 'Secondary road',
  Suffisant: 'Sufficient', 'À renforcer': 'To be reinforced', 'À compléter': 'To be complemented',
  'Ouvrages d’art': 'Bridges & culverts', 'Routes revêtues': 'Paved roads', 'Pistes rurales': 'Rural tracks',
  'Pont à poutres en béton armé': 'Reinforced concrete girder bridge', 'Buse métallique': 'Corrugated steel culvert', 'Radier submersible': 'Submersible drift',
  'Section de route bitumée': 'Paved road section', 'Section en remblai sur zone basse': 'Embankment section over low ground',
  'Piste en latérite': 'Laterite track', 'Piste en terre': 'Earth track', 'Vases de mangrove': 'Mangrove muds',
  'Alluvions argilo-sableuses': 'Clay-sand alluvium', 'Sols ferrallitiques (latérite)': 'Ferralitic soils (laterite)',
  'Budget national d’investissement': 'National investment budget', 'Collectivité locale': 'Local authority',
  'Route nationale': 'National road', 'Route secondaire': 'Secondary road', 'Piste rurale': 'Rural track',
};
const ETAT_C = { Bon: '#2E9E6B', Moyen: '#E0A100', 'Dégradé': '#E07A3F', Critique: '#D64545' };
/* zone profiles: what differs between demonstrators (currency, families, soils, facilities, funding sources) */
const ZONES = {
  bj: {
    cur: 'FCFA', div: 1e6, sfx: ['M', 'M'], step: 1e6, minZoom: 12,
    fam: { 'Voirie & ouvrages d’art': '#0D2B5C', 'Drainage & assainissement': '#00A3AD', 'Bâtiments publics': '#7A5CC2' },
    fin: { 'Fonds d’entretien routier': '#0D2B5C', 'Budget communal': '#4CA64C', 'Bailleur (programme)': '#E07A3F' },
    sol: { 'Sables littoraux': '#E9D38C', 'Argiles et vases compressibles': '#9C8AC9', 'Terre de barre (sols latéritiques)': '#C9784A' },
    solv: { 'Argiles et vases compressibles': 1, 'Sables littoraux': 0.6, 'Terre de barre (sols latéritiques)': 0.2 },
    fac: { 'École': ['#00C2CB', 'École', 'School'], 'Centre de santé': ['#C24C7A', 'Centre de santé', 'Health centre'], 'Marché': ['#7A5CC2', 'Marché', 'Market'] },
    basins: ['Bassins agricoles', 'Farm basins'],
  },
  gn: {
    cur: 'GNF', div: 1e9, sfx: ['Md', 'bn'], step: 1e8, minZoom: 11, platform: ['prof', 'assets', 'proj', 'collab'],
    fam: { 'Ouvrages d’art': '#3B5FC0', 'Routes revêtues': '#0E9AA5', 'Pistes rurales': '#A8762E' },
    fin: { 'Fonds d’entretien routier': '#3B5FC0', 'Budget national d’investissement': '#C4622D', 'Collectivité locale': '#0E9AA5', 'Bailleur (programme)': '#9C5BB5' },
    sol: { 'Vases de mangrove': '#9C8AC9', 'Alluvions argilo-sableuses': '#E9D38C', 'Sols ferrallitiques (latérite)': '#C9784A' },
    solv: { 'Vases de mangrove': 1, 'Alluvions argilo-sableuses': 0.6, 'Sols ferrallitiques (latérite)': 0.2 },
    fac: { 'Marché': ['#7A5CC2', 'Marché', 'Market'], 'Point de collecte': ['#2E7D32', 'Point de collecte', 'Collection point'], 'Centre de santé': ['#C24C7A', 'Centre de santé', 'Health centre'] },
    basins: ['Bassins de production et flux', 'Production basins and flows'],
  },
};
let Z = ZONES.bj;
let FAM_C = Z.fam, FIN_C = Z.fin, SOL_C = Z.sol, SOL_V = Z.solv, FAC_C = {};
const VERDICT_C = { Suffisant: '#2E9E6B', 'À renforcer': '#E0A100', 'À compléter': '#D64545' };
const EFF_BREAKS = [[0.85, '#2E9E6B'], [0.6, '#E0A100'], [0, '#D64545']];

const SCORE_BREAKS = [[70, '#D64545'], [55, '#E07A3F'], [40, '#E0A100'], [25, '#A6B83A'], [0, '#2E9E6B']];
const POP_BREAKS = [[22000, '#0D2B5C'], [16000, '#234A7A'], [10000, '#5C83B5'], [5000, '#A9C3E0'], [0, '#E3ECF6']];
const FLOOD_BREAKS = [[0.75, '#08519C'], [0.5, '#3182BD'], [0.25, '#9ECAE1'], [0, '#E6F2F8']];

const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr');
const t = (k) => { const v = T[lang()][k]; return typeof v === 'string' ? v.replace('{CUR}', Z.cur) : v; };
const facName = (k) => (Z.fac[k] ? Z.fac[k][lang() === 'en' ? 2 : 1] : k);
const tv = (v) => (v == null ? '—' : lang() === 'en' ? (EN[v] || v) : v);
const fmt = (n) => (n == null ? '—' : new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR').format(n));
const fmt2 = (n) => new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const pct = (x) => (lang() === 'en' ? `${Math.round(x * 100)}%` : `${Math.round(x * 100)} %`);
const fmtM = (n) => (lang() === 'en' ? `${(n / Z.div).toFixed(1)} ${Z.sfx[1]}` : `${(n / Z.div).toFixed(1).replace('.', ',')} ${Z.sfx[0]}`);
const money = (n) => `${fmtM(n)} ${Z.cur}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const brk = (v, b) => b.find(([x]) => v >= x)[1];
const floodCls = (f) => t('floodCls')[f >= 0.75 ? 3 : f >= 0.5 ? 2 : f >= 0.25 ? 1 : 0];

export async function mount(root, { dataUrl, viewerUrl, wasmPath, modelsBase, app = null }) {
  root.innerHTML = `<p class="bv-status mono">${esc(t('loading'))}</p>`;
  const data = await (await fetch(dataUrl)).json();
  Z = ZONES[data.meta?.zone] || ZONES.bj;
  FAM_C = Z.fam; FIN_C = Z.fin; SOL_C = Z.sol; SOL_V = Z.solv;
  FAC_C = Object.fromEntries(Object.entries(Z.fac).map(([k, v]) => [k, v[0]]));
  const FP = Object.fromEntries((data.flowpaths || []).map((f) => [f.id, f]));
  const flowGeom = (f, a) => (f.id != null && FP[f.id] ? FP[f.id] : { ...f, path: [f.from, [a.lat, a.lon], f.to] });
  root.classList.add('bv-ready');
  root.innerHTML = '';
  const ui = buildUI(root, Z.platform || [], app);

  const A = [];
  const ORIG = data.assets.map((a) => JSON.parse(JSON.stringify(a)));
  const NOTE_ETAT = { 1: 'Bon', 2: 'Moyen', 3: 'Dégradé', 4: 'Critique' };
  const GN = data.meta?.zone === 'gn';
  const store = (Z.platform || []).length ? createStore(data.meta?.zone || 'bj') : null;
  if (store && app && app.user) store.state.user = app.user;
  const R_E = 6371000;
  const dist = (p, q) => { const dl = (q.lat - p.lat) * Math.PI / 180, dn = (q.lon - p.lon) * Math.PI / 180 * Math.cos(p.lat * Math.PI / 180); return R_E * Math.hypot(dl, dn); };
  const cellOf = (p) => data.cells.reduce((b, c) => { const d = dist(p, { lat: (c.b[0] + c.b[2]) / 2, lon: (c.b[1] + c.b[3]) / 2 }); return !b || d < b.d ? { c, d } : b; }, null).c;
  const segDist = (p, a, b) => { // metres, local planar approximation
    const k = Math.cos(p.lat * Math.PI / 180) * Math.PI / 180 * R_E, kl = Math.PI / 180 * R_E;
    const ax = (a[1] - p.lon) * k, ay = (a[0] - p.lat) * kl, bx = (b[1] - p.lon) * k, by = (b[0] - p.lat) * kl;
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    const u = L2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)) : 0;
    return Math.hypot(ax + u * dx, ay + u * dy);
  };
  // context of a point: same proxies as the generator (cell values, nearest count point, facilities within 500 m, flows passing)
  function contextAt(p) {
    const c = cellOf(p);
    const area = (data.meta?.cell_m || 600) ** 2 / 1e6;
    const pop = Math.round(data.cells.reduce((acc, x) => { const d = dist(p, { lat: (x.b[0] + x.b[2]) / 2, lon: (x.b[1] + x.b[3]) / 2 }); return d < 600 ? acc + x.pop * area * (1 - d / 600) : acc; }, 0) / 100) * 100;
    const tp = data.traffic.map((q) => ({ q, d: dist(p, q) })).sort((x, y) => x.d - y.d)[0];
    const equip = data.facilities.filter((f) => dist(p, f) <= 500).length;
    const flows = (data.flowpaths || []).filter((f) => f.path.some((pt, i) => i && segDist(p, f.path[i - 1], pt) < 120));
    return { flood: c.flood, sol: c.sol, pop, tmjaHint: tp && tp.d <= 900 ? tp.q.tmja : null, equip, flows };
  }
  function makeAdded(def) {
    const cx = contextAt(def);
    const through = cx.flows.reduce((acc, f) => acc + f.t, 0);
    const names = (k) => [...new Set(cx.flows.map((f) => f[k]))].sort().join(', ');
    const a = {
      code: def.code, name: `${def.type} ${def.code}`, famille: def.famille, type: def.type, lat: def.lat, lon: def.lon,
      note: def.note, etat: NOTE_ETAT[def.note], annee: def.annee || '—', cout: def.cout, financement: def.financement,
      tmja: def.tmja, pop: cx.pop, flood: cx.flood, sol: cx.sol, equip: cx.equip, inspection: def.inspection, obs: def.obs || '',
      _added: true, _through: through, _hh: through / 3.2, _flows: cx.flows.map((f) => ({ id: f.id, t: f.t })),
      _origin: cx.flows.length ? { fr: names('bname'), en: names('bname_en') } : null,
    };
    if (GN) Object.assign(a, impactGN(a));
    return a;
  }
  function prepGN(a) {
    const o = (a.impact.kpis || []).find((k) => /^Origines/.test(k.fr));
    Object.assign(a, { _through: throughFrom(a), _hh: a.impact.hh, _hhKpi: (a.impact.kpis[3] || {}).v, _flows: a.impact.flows, _origin: o ? { fr: o.txt, en: o.txt_en } : null });
  }
  function applyFields(a, f) {
    for (const k of ['note', 'cout', 'tmja', 'inspection', 'financement', 'obs']) if (f[k] !== undefined) a[k] = f[k];
    a.etat = NOTE_ETAT[a.note];
    if (GN) Object.assign(a, impactGN(a));
  }
  function previewAsset(code, fields, def) {
    if (def) return makeAdded(def);
    const a = JSON.parse(JSON.stringify(A.find((x) => x.code === code)));
    applyFields(a, fields);
    return a;
  }
  let totalCost = 0, maxCost = 1;
  function rebuild() {
    A.length = 0;
    for (const o of ORIG) {
      const a = JSON.parse(JSON.stringify(o));
      if (GN) prepGN(a);
      const ed = store && store.state.edits[a.code];
      if (ed) { applyFields(a, ed); a._mod = true; }
      A.push(a);
    }
    if (store) for (const d of store.state.added) A.push(makeAdded(d));
    const max = {
      pop: Math.max(1, ...A.map((a) => a.pop)), tmja: Math.max(1, ...A.map((a) => a.tmja || 0)),
      equip: Math.max(1, ...A.map((a) => a.equip)), fin: Math.max(1e-9, ...A.map((a) => Math.log1p(a.inaction / a.cout))),
    };
    for (const a of A) {
      a.crit = {
        etat: (a.note - 1) / 3, pop: a.pop / max.pop, trafic: (a.tmja || 0) / max.tmja, flood: a.flood,
        sol: SOL_V[a.sol], equip: a.equip / max.equip, fin: Math.log1p(a.inaction / a.cout) / max.fin,
      };
    }
    totalCost = A.reduce((s_, a) => s_ + a.cout, 0);
    maxCost = Math.max(...A.map((a) => a.cout));
  }
  rebuild();
  const state = {
    w: Object.fromEntries(CRIT.map(([k, , d]) => [k, d])), color: 'score', base: 'none',
    traffic: false, facilities: false, basins: false, query: null, queryLabel: '', budget: Math.round(totalCost * 0.3 / Z.step) * Z.step, selected: null,
  };

  /* --- map */
  const [[s, w], [n, e]] = data.bounds;
  const bounds = L.latLngBounds([s, w], [n, e]);
  const map = L.map(ui.map, { minZoom: Z.minZoom || 12, maxZoom: 16, maxBounds: bounds.pad(0.25), zoomSnap: 0.5, attributionControl: true });
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · GIN²CO (données fictives)',
  }).addTo(map);
  map.fitBounds(L.latLngBounds(A.map((a) => [a.lat, a.lon])).pad(0.08));

  const baseLayer = L.layerGroup().addTo(map);
  const trafficLayer = L.layerGroup();
  const facLayer = L.layerGroup();
  const basinLayer = L.layerGroup();
  const impactLayer = L.layerGroup().addTo(map);
  const assetLayer = L.layerGroup().addTo(map);
  const markers = new Map();

  const cellColor = (c) => (state.base === 'pop' ? brk(c.pop, POP_BREAKS) : state.base === 'flood' ? brk(c.flood, FLOOD_BREAKS) : SOL_C[c.sol]);
  function fillBase(group) {
    if (state.base === 'none') return;
    for (const c of data.cells) {
      const col = cellColor(c);
      const r = L.rectangle([[c.b[0], c.b[1]], [c.b[2], c.b[3]]], { stroke: false, fillColor: col, fillOpacity: 0.5, interactive: true });
      const label = state.base === 'pop' ? `${fmt(c.pop)} ${t('perKm')}` : state.base === 'flood' ? `${floodCls(c.flood)} (${fmt2(c.flood)})` : tv(c.sol);
      r.bindTooltip(label, { sticky: true, direction: 'top', className: 'sg-tip' });
      group.addLayer(r);
    }
  }
  function drawBase() { baseLayer.clearLayers(); fillBase(baseLayer); }
  function fillTraffic(group) {
    for (const p of data.traffic) {
      L.circleMarker([p.lat, p.lon], { radius: 3 + Math.sqrt(p.tmja) / 26, color: '#234A7A', weight: 1, fillColor: '#5C83B5', fillOpacity: 0.45 })
        .bindTooltip(`${esc(tv(p.cls))} — ${fmt(p.tmja)} ${t('vpj')}`, { className: 'sg-tip' }).addTo(group);
    }
  }
  function fillFac(group) {
    for (const f of data.facilities) {
      L.circleMarker([f.lat, f.lon], { radius: 4.5, color: '#fff', weight: 1.5, fillColor: FAC_C[f.type], fillOpacity: 1 })
        .bindTooltip(esc(facName(f.type)), { className: 'sg-tip' }).addTo(group);
    }
  }
  const EN_NAMES = Object.fromEntries([...(data.basins || []), ...(data.flowpaths || []).flatMap((f) => [{ name: f.bname, name_en: f.bname_en }, { name: f.dname, name_en: f.dname_en }])]
    .filter((b) => b.name_en).map((b) => [b.name, b.name_en]));
  const basinName = (n) => (lang() === 'en' ? EN_NAMES[n] || n.replace('Bassin maraîcher', 'Market-garden basin').replace('Arrière-pays nord-ouest', 'North-western hinterland').replace('Arrière-pays ouest', 'Western hinterland').replace('Zone portuaire', 'Port area').replace('Marché couvert', 'Covered market').replace('Marché (fictif)', 'Market (fictitious)') : n);
  function fillBasins(group) {
    const fmax = Math.max(1, ...(data.flowpaths || []).map((f) => f.t));
    for (const f of data.flowpaths || []) {
      L.polyline(f.path, { color: '#2E7D32', weight: 1.5 + 5 * Math.sqrt(f.t / fmax), opacity: 0.45, lineCap: 'round' })
        .bindTooltip(`${esc(basinName(f.bname))} → ${esc(basinName(f.dname))} : ${fmt(f.t)} t/${lang() === 'en' ? 'yr' : 'an'}`, { className: 'sg-tip', sticky: true })
        .addTo(group);
    }
    for (const b of data.basins) {
      if (b.kind === 'marche') {
        L.circleMarker([b.lat, b.lon], { radius: 7, color: '#fff', weight: 2, fillColor: '#7A5CC2', fillOpacity: 1 })
          .bindTooltip(esc(basinName(b.name)), { className: 'sg-tip' }).addTo(group);
        continue;
      }
      L.circleMarker([b.lat, b.lon], { radius: 6 + Math.sqrt(b.t) / 14, color: '#2E7D32', weight: 1.5, fillColor: '#7BC47F', fillOpacity: 0.55 })
        .bindTooltip(`${esc(basinName(b.name))} — ${fmt(b.t)} t/${lang() === 'en' ? 'yr' : 'an'}`, { className: 'sg-tip' })
        .addTo(group);
    }
  }
  function drawContext() {
    trafficLayer.clearLayers(); facLayer.clearLayers(); basinLayer.clearLayers();
    fillTraffic(trafficLayer); fillFac(facLayer); fillBasins(basinLayer);
    state.basins ? basinLayer.addTo(map) : basinLayer.remove();
    state.traffic ? trafficLayer.addTo(map) : trafficLayer.remove();
    state.facilities ? facLayer.addTo(map) : facLayer.remove();
  }

  /* --- scoring & budget */
  function compute() {
    const sw = Object.values(state.w).reduce((x, y) => x + y, 0) || 1;
    for (const a of A) {
      a.parts = {};
      let s = 0;
      for (const [k] of CRIT) { a.parts[k] = (state.w[k] * a.crit[k]) / sw * 100; s += a.parts[k]; }
      a.score = Math.round(s);
    }
    const ranked = [...A].sort((x, y) => y.score - x.score || y.inaction - x.inaction);
    let left = state.budget, cum = 0;
    ranked.forEach((a, i) => {
      a.rank = i + 1;
      a.funded = a.cout <= left;
      if (a.funded) { left -= a.cout; cum += a.cout; }
      a.cum = a.funded ? cum : null;
    });
    return ranked;
  }

  function colorOf(a) {
    if (state.color === 'score') return brk(a.score, SCORE_BREAKS);
    if (state.color === 'etat') return ETAT_C[a.etat];
    if (state.color === 'famille') return FAM_C[a.famille];
    if (state.color === 'eff') return brk(a.impact.eff, EFF_BREAKS);
    if (state.color === 'verdict') return VERDICT_C[a.impact.verdict];
    return FIN_C[a.financement];
  }

  function drawAssets() {
    for (const a of A) {
      const dim = state.query && !state.query.has(a.code);
      const style = {
        radius: 6 + 10 * Math.sqrt(a.cout / maxCost), fillColor: colorOf(a), fillOpacity: dim ? 0.12 : 0.92,
        color: a.funded ? '#0D2B5C' : '#ffffff', weight: a.funded ? 3 : 1.5, dashArray: null, opacity: dim ? 0.2 : 1,
      };
      let m = markers.get(a.code);
      if (!m) {
        m = L.circleMarker([a.lat, a.lon], style).addTo(assetLayer);
        m.on('click', () => select(a.code, false));
        m.bindTooltip(() => { const x = A.find((y) => y.code === a.code) || a; return `<strong>${esc(x.code)}</strong> — ${esc(tv(x.type))}<br>${esc(t('score'))} ${x.score}/100`; }, { className: 'sg-tip', direction: 'top' });
        markers.set(a.code, m);
      } else m.setStyle(style);
      if (state.selected === a.code) m.setStyle({ color: '#00C2CB', weight: 4 });
    }
  }

  const kv = (k) => {
    const L_ = lang() === 'en';
    if (k.txt) return `<tr><th>${esc(L_ ? k.en : k.fr)}</th><td>${esc(L_ ? k.txt_en : k.txt)}</td></tr>`;
    const v = k.d ? new Intl.NumberFormat(L_ ? 'en-GB' : 'fr-FR', { minimumFractionDigits: k.d, maximumFractionDigits: k.d }).format(k.v) : fmt(k.v);
    return `<tr><th>${esc(L_ ? k.en : k.fr)}</th><td class="mono">${v} ${esc(L_ ? k.uen : k.ufr)}</td></tr>`;
  };
  function impactHtml(a) {
    const im = a.impact;
    const bar = (lab, x) => `<div class="sg-eff"><span>${esc(lab)}</span><i><b style="width:${Math.round(x * 100)}%;background:${brk(x, EFF_BREAKS)}"></b><u></u></i><em class="mono">${pct(x)}</em></div>`;
    return `<div class="sg-imp">
      <p class="sg-pop-h">${esc(t('impact'))} — ${esc(lang() === 'en' ? im.label.en : im.label.fr)}</p>
      <table class="bv-kv">${im.kpis.map(kv).join('')}</table>
      ${bar(t('effNow'), im.eff)}${bar(t('effRehab'), im.eff_rehab)}
      <p><span class="bv-badge" style="--c:${VERDICT_C[im.verdict]}">${esc(t('verdict'))} : ${esc(tv(im.verdict))}</span></p>
      ${im.complement ? `<p class="sg-comp"><strong>${esc(t('complement'))} :</strong> ${esc(lang() === 'en' ? im.complement.en : im.complement.fr)} — ${esc(t('estCost'))} ${money(im.complement.cost)}</p>` : ''}
      <details class="sg-rule"><summary>${esc(t('rule'))}</summary><p>${esc(lang() === 'en' ? im.rule.en : im.rule.fr)}</p></details>
    </div>`;
  }
  function popupHtml(a) {
    const bar = (k, lab) => `<div class="sg-bar"><span>${esc(lab)}</span><i style="width:${Math.max(a.parts[k], 0.5) * 2.2}px"></i><b class="mono">${a.parts[k].toFixed(1)}</b></div>`;
    return `<div class="sg-pop">
      <p class="sg-pop-t">${esc(a.code)} — ${esc(tv(a.type))}</p>
      <p class="sg-pop-s">${esc(tv(a.famille))}</p>
      <p><span class="bv-badge" style="--c:${ETAT_C[a.etat]}">${esc(tv(a.etat))}</span>
         <span class="bv-badge" style="--c:${brk(a.score, SCORE_BREAKS)}">${esc(t('score'))} ${a.score}/100 · #${a.rank}</span></p>
      <table class="bv-kv">
        <tr><th>${esc(t('cost'))}</th><td class="mono">${fmt(a.cout)}</td></tr>
        <tr><th>${esc(t('inaction'))}</th><td class="mono">${fmt(a.inaction)}</td></tr>
        <tr><th>${esc(t('source'))}</th><td>${esc(tv(a.financement))}</td></tr>
        <tr><th>${esc(t('fin'))}</th><td>${a.funded ? esc(t('yes')) : esc(t('no'))}</td></tr>
        <tr><th>${esc(t('tmja'))}</th><td class="mono">${a.tmja == null ? esc(t('noTraffic')) : fmt(a.tmja)}</td></tr>
        <tr><th>${esc(t('pop'))}</th><td class="mono">${fmt(a.pop)}</td></tr>
        <tr><th>${esc(t('flood'))}</th><td>${esc(floodCls(a.flood))}</td></tr>
        <tr><th>${esc(t('sol'))}</th><td>${esc(tv(a.sol))}</td></tr>
        <tr><th>${esc(t('equip'))}</th><td class="mono">${a.equip}</td></tr>
        <tr><th>${esc(t('year'))} · ${esc(t('insp'))}</th><td class="mono">${a.annee} · ${a.inspection}</td></tr>
      </table>
      ${impactHtml(a)}
      <p class="sg-pop-h">${esc(t('breakdown'))}</p>
      ${CRIT.map(([k, lab]) => bar(k, lab[lang() === 'en' ? 1 : 0])).join('')}
      ${a.obs ? `<p class="sg-pop-s">${esc(a.obs)}</p>` : ''}
      ${app && projOfAsset(a.code) ? `<p class="sg-pop-cta"><button type="button" class="sg-link sg-proj" data-pid="${esc(projOfAsset(a.code).id)}">${esc(t('projOf'))} ${esc(projOfAsset(a.code).id)} →</button></p>` : ''}
      ${(Z.platform || []).includes('collab') ? `<p class="sg-pop-cta"><button type="button" class="sg-link sg-talk" data-code="${esc(a.code)}">${esc(t('talk'))}${collabRef ? ` (${collabRef.count(a.code)})` : ''} →</button></p>` : ''}
      ${a._added ? `<p class="sg-pop-s">${esc(t('addNote'))}</p>` : `<p class="sg-pop-cta"><button type="button" class="btn btn-primary sg-3d" data-code="${esc(a.code)}">${esc(t('open3d'))} →</button></p>${a._mod ? `<p class="sg-pop-s">${esc(t('modNote'))}</p>` : ''}`}
    </div>`;
  }

  function drawImpact() {
    impactLayer.clearLayers();
    if (!state.selected) return;
    const a = A.find((x) => x.code === state.selected);
    const im = a.impact;
    const rect = (i, col, dash) => {
      const c = data.cells[i];
      L.rectangle([[c.b[0], c.b[1]], [c.b[2], c.b[3]]], { color: col, weight: 1, dashArray: dash, fillColor: col, fillOpacity: 0.28, interactive: false }).addTo(impactLayer);
    };
    im.zone.forEach((i) => rect(i, '#00C2CB', null));
    im.residual.forEach((i) => rect(i, '#D64545', '4 3'));
    const tmax = Math.max(1, ...im.flows.map((f) => f.t));
    for (const f0 of im.flows) {
      const f = { ...flowGeom(f0, a), t: f0.t };
      const w = 2 + 8 * (f.t / tmax);
      L.polyline(f.path, { color: '#2E7D32', weight: w, opacity: 0.75, lineCap: 'round' })
        .bindTooltip(`${esc(basinName(f.bname))} → ${esc(basinName(f.dname))} : ${fmt(f.t)} t/${lang() === 'en' ? 'yr' : 'an'}`, { className: 'sg-tip', sticky: true })
        .addTo(impactLayer);
      L.circleMarker(f.path[0], { radius: 6, color: '#2E7D32', weight: 2, fillColor: '#7BC47F', fillOpacity: 1 }).addTo(impactLayer);
      L.circleMarker(f.path[f.path.length - 1], { radius: 5, color: '#2E7D32', weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(impactLayer);
    }
  }

  function select(code, fly) {
    state.selected = code;
    const a = A.find((x) => x.code === code);
    const m = markers.get(code);
    m.unbindPopup();
    m.bindPopup(popupHtml(a), { maxWidth: 320, maxHeight: 420, autoPanPadding: [20, 20] });
    if (fly) {
      map.once('moveend', () => m.openPopup());
      map.flyTo([a.lat, a.lon], Math.max(map.getZoom(), 14), { duration: 0.6 });
    } else m.openPopup();
    drawAssets();
    drawImpact();
    renderLegend();
    renderTable();
  }
  let collabRef = null;
  map.on('popupopen', (e) => {
    const tb = e.popup.getElement().querySelector('.sg-talk');
    if (tb) tb.addEventListener('click', () => { const c = tb.getAttribute('data-code'); showTab('collab').then((b) => b && b.filterLink(c)); });
    const pb = e.popup.getElement().querySelector('.sg-proj');
    if (pb) pb.addEventListener('click', () => { const id = pb.getAttribute('data-pid'); map.closePopup(); openProjectSpace(id); });
    const btn = e.popup.getElement().querySelector('.sg-3d');
    if (btn) btn.addEventListener('click', () => open3d(A.find((x) => x.code === btn.getAttribute('data-code'))));
  });

  /* --- ongoing projects on the map: step, documents (GED) and versioned 3D model */
  const projLayer = L.layerGroup();
  const PJ_C = { done: '#2E9E6B', cur: '#3B5FC0', todo: '#C9D2DE' };
  const projOfAsset = (code) => (store && store.state.projects ? store.state.projects.find((p) => p.codes.includes(code) && !p.steps.every((x) => x.v)) : null);
  let projSeq = 0;
  async function drawProjects() {
    const my = ++projSeq;
    if (!app || !ui.projCb) return;
    if (!ui.projCb.checked) { projLayer.clearLayers(); projLayer.remove(); return; }
    const [pb, { STEPS }] = await Promise.all([getBoard('proj'), import('./projects.js'), getBoard('ged')]);
    if (my !== projSeq || !pb) return;
    projLayer.clearLayers();
    projLayer.addTo(map);
    for (const p of pb.ensure()) {
      if (p.steps.every((x) => x.v)) continue;
      const pts = p.codes.map((c) => A.find((a) => a.code === c)).filter(Boolean);
      if (!pts.length) continue;
      const lat = pts.reduce((x, a) => x + a.lat, 0) / pts.length, lon = pts.reduce((x, a) => x + a.lon, 0) / pts.length;
      if (pts.length > 1) for (const a of pts) L.polyline([[lat, lon], [a.lat, a.lon]], { color: '#9C5BB5', weight: 2, dashArray: '4 4', interactive: false }).addTo(projLayer);
      const st = STEPS[Math.min(p.step, STEPS.length - 1)];
      const icon = L.divIcon({ className: 'pj-pin', html: `<span><b>${esc(p.id)}</b><i>${Math.min(p.step + 1, STEPS.length)}/${STEPS.length}</i></span>`, iconSize: [52, 26], iconAnchor: [26, 40] });
      const m = L.marker([lat, lon], { icon, zIndexOffset: 800, keyboard: true, title: `${p.id} — ${p.name[lang()]} · ${st.n[lang()]}` }).addTo(projLayer);
      m.bindPopup(() => projPopup(p.id, STEPS), { maxWidth: 330, maxHeight: 440, autoPanPadding: [20, 20], className: 'pj-popup' });
      m._pid = p.id;
    }
  }
  function projPopup(id, STEPS) {
    const p = boards.proj.ensure().find((x) => x.id === id);
    const nm = (o) => o[lang()];
    const cur = Math.min(p.step, STEPS.length - 1);
    const ged = boards.ged;
    const docs = ged ? ged.docsFor(id) : [];
    const models = ged ? ged.models(id) : [];
    const seg = STEPS.map((st, i) => `<i style="background:${p.steps[i].v ? PJ_C.done : i === cur ? PJ_C.cur : PJ_C.todo}" title="${esc(nm(st.n))}"></i>`).join('');
    const issues = p.steps.reduce((a, x) => a + x.c.filter((c) => c.s === 'nc' || c.s === 'res').length, 0);
    return `<div class="sg-pop pj-pop">
      <p class="sg-pop-t">${esc(p.id)} — ${esc(nm(p.name))}</p>
      <p class="sg-pop-s">${esc(t('projOf'))} · ${p.codes.map((c) => `<span class="mono">${esc(c)}</span>`).join(', ')}</p>
      <p class="sg-pop-h">${esc(t('stepL'))} ${cur + 1}/${STEPS.length} — ${esc(nm(STEPS[cur].n))}${STEPS[cur].k === 'travaux' && p.pct ? ` · <span class="mono">${p.pct} %</span>` : ''}</p>
      <div class="pj-seg" role="img" aria-label="${esc(t('progress'))}">${seg}</div>
      ${issues ? `<p class="sg-pop-s pj-warn">${issues} ${lang() === 'en' ? 'open non-conformity(ies) or snag(s)' : 'non-conformité(s) ou réserve(s) ouverte(s)'}</p>` : ''}
      ${models.length ? `<p class="sg-pop-h">${esc(t('ver3d'))}</p>
        <div class="pj-3d"><select data-pver aria-label="${esc(t('verPick'))}">${models.map((m, i) => `<option value="${i}"${i === models.length - 1 ? ' selected' : ''}>${esc(`${m.v.ver} · ${m.v.date}`)}</option>`).join('')}</select>
        <button type="button" class="btn btn-primary pj-open3d" data-pid="${esc(id)}">${esc(t('open3dV'))} →</button></div>
        <p class="sg-pop-s" data-pvnote>${esc(models.at(-1).v.note || '')}</p>` : ''}
      <p class="sg-pop-h">${esc(t('docsL'))} (${docs.length})</p>
      ${docs.length ? `<ul class="pj-docs">${docs.slice(0, 4).map((d) => `<li><button type="button" class="sg-link" data-pdoc="${esc(d.id)}">${esc(nm(d.title))}</button><small class="mono">${esc(d.code)} · ${esc(d.versions.at(-1).ver)} · ${esc(ged.label(d.status))}</small></li>`).join('')}</ul>${docs.length > 4 ? `<p class="sg-pop-s">${esc(t('moreDocs')(docs.length - 4))}</p>` : ''}` : `<p class="sg-pop-s">${esc(t('noDocs'))}</p>`}
      <p class="sg-pop-cta pj-cta">${allowed('proj') ? `<button type="button" class="sg-link" data-pproj="${esc(id)}">${esc(t('openProj'))} →</button>` : ''}<button type="button" class="sg-link" data-pged="${esc(id)}">${esc(t('openGed'))} →</button></p>
    </div>`;
  }
  map.on('popupopen', async (e) => {
    const el = e.popup.getElement();
    const pp = el.querySelector('[data-pproj]');
    if (pp) pp.addEventListener('click', () => { const id = pp.dataset.pproj; map.closePopup(); openProjectSpace(id); });
    const pg = el.querySelector('[data-pged]');
    if (pg) pg.addEventListener('click', () => { const id = pg.dataset.pged; map.closePopup(); showTab('ged').then((b) => b && b.openFolder(id)); });
    el.querySelectorAll('[data-pdoc]').forEach((b_) => b_.addEventListener('click', () => { map.closePopup(); showTab('ged').then((b) => b && b.openDoc(b_.dataset.pdoc)); }));
    const sel = el.querySelector('[data-pver]');
    const o3 = el.querySelector('.pj-open3d');
    if (sel && o3) {
      const id = o3.dataset.pid;
      sel.addEventListener('change', () => { const m = boards.ged.models(id)[Number(sel.value)]; el.querySelector('[data-pvnote]').textContent = m.v.note || ''; });
      o3.addEventListener('click', async () => {
        const p = boards.proj.ensure().find((x) => x.id === id);
        const m = boards.ged.models(id)[Number(sel.value)];
        const url = await boards.ged.urlOf(m.d, m.v);
        open3dVersions(A.find((x) => x.code === p.codes[0]), id, m.v.ver, url);
      });
    }
  });
  async function open3dVersions(a, link, ver, url) {
    if (!a) return;
    const ged = await getBoard('ged');
    const models = ged ? ged.models(link) : [];
    const versions = await Promise.all(models.map(async (m) => ({ label: `${m.v.ver} · ${m.v.date}`, note: m.v.note || '', ver: m.v.ver, url: m.v.ver === ver && url ? url : await ged.urlOf(m.d, m.v) })));
    const idx = Math.max(0, versions.findIndex((v) => v.ver === ver));
    if (overlay) overlay.close();
    open3d(a, versions.length ? { versions, idx } : {});
  }
  function openProjectSpace(id, t, ver) {
    if (allowed('proj')) return showTab('proj').then((b) => b && b.open(id, t, ver));
    return focusProject(id);
  }
  function focusProject(id) {
    if (!ui.projCb) { const p = (store.state.projects || []).find((x) => x.id === id); if (p) focusMap(p.codes[0]); return; }
    showTab('map').then(async () => {
      if (!ui.projCb.checked) { ui.projCb.checked = true; }
      await drawProjects();
      let mk = null; projLayer.eachLayer((l) => { if (l._pid === id) mk = l; });
      if (!mk) return;
      setTimeout(() => { map.invalidateSize(); map.once('moveend', () => mk.openPopup()); map.flyTo(mk.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 }); }, 80);
    });
  }

  /* --- map → 3D overlay (carries the active layers) */
  const R_EARTH = 6371000;
  const geo = (a, b) => {
    const p1 = (a.lat * Math.PI) / 180, p2 = (b.lat * Math.PI) / 180, dl = ((b.lon - a.lon) * Math.PI) / 180;
    const d = 2 * R_EARTH * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2));
    const y = Math.sin(dl) * Math.cos(p2), x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return { d, bearing: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 };
  };
  const cellAt = (a) => data.cells.find((c) => a.lat >= c.b[0] && a.lat <= c.b[2] && a.lon >= c.b[1] && a.lon <= c.b[3])
    || data.cells.reduce((best, c) => {
      const d = Math.hypot((c.b[0] + c.b[2]) / 2 - a.lat, (c.b[1] + c.b[3]) / 2 - a.lon);
      return !best || d < best.d ? { c, d } : best;
    }, null).c;

  function contextFor(a, snap) {
    return () => {
      const items = [
        { label: t('score'), value: `${a.score}/100 · #${a.rank}`, color: brk(a.score, SCORE_BREAKS) },
        { label: t('condition'), value: tv(a.etat), color: ETAT_C[a.etat] },
        { label: t('cost'), value: fmt(a.cout) },
        { label: t('inaction'), value: fmt(a.inaction) },
        { label: t('impact'), value: lang() === 'en' ? a.impact.label.en : a.impact.label.fr },
        { label: t('effNow'), value: pct(a.impact.eff), color: brk(a.impact.eff, EFF_BREAKS) },
        { label: t('effRehab'), value: pct(a.impact.eff_rehab), color: brk(a.impact.eff_rehab, EFF_BREAKS) },
        { label: t('verdict'), value: tv(a.impact.verdict), color: VERDICT_C[a.impact.verdict] },
      ];
      if (a.impact.complement) items.push({ label: t('complement'), value: `${lang() === 'en' ? a.impact.complement.en : a.impact.complement.fr} (${money(a.impact.complement.cost)})` });
      const sc = { facilities: [], impact: { label: `${lang() === 'en' ? a.impact.label.en : a.impact.label.fr} · ${t('eff')} ${pct(a.impact.eff)}`, color: VERDICT_C[a.impact.verdict] } };
      const cell = cellAt(a);
      if (snap.base === 'pop') {
        items.push({ label: t('popDens'), value: `${fmt(cell.pop)} ${t('perKm')}`, color: brk(cell.pop, POP_BREAKS) });
        sc.ground = { color: brk(cell.pop, POP_BREAKS), label: `${fmt(cell.pop)} ${t('perKm')}` };
      }
      if (snap.base === 'flood') {
        const depth = Math.round((0.2 + a.flood * 1.2) * 10) / 10;
        items.push({ label: t('flood'), value: `${floodCls(a.flood)} (${fmt2(a.flood)})`, color: brk(a.flood, FLOOD_BREAKS) });
        items.push({ label: t('depth'), value: `≈ ${String(depth).replace('.', lang() === 'en' ? '.' : ',')} m` });
        sc.ground = { color: brk(a.flood, FLOOD_BREAKS), label: `${t('flood')} : ${floodCls(a.flood)}` };
        sc.flood = { depth, label: `${t('depth')} ≈ ${String(depth).replace('.', lang() === 'en' ? '.' : ',')} m` };
      }
      if (snap.base === 'sol') {
        items.push({ label: t('sol'), value: tv(a.sol), color: SOL_C[a.sol] });
        sc.soil = { color: SOL_C[a.sol], label: tv(a.sol) };
        sc.ground = { color: SOL_C[a.sol], label: `${t('sol')} : ${tv(a.sol)}` };
      }
      if (snap.traffic) {
        items.push({ label: t('tmja'), value: a.tmja == null ? t('noTraffic') : fmt(a.tmja) });
        if (a.tmja != null) sc.traffic = { label: `TMJA ${fmt(a.tmja)} ${t('vpj')}` };
      }
      if (snap.facilities) {
        const near = data.facilities.map((f) => ({ f, ...geo(a, f) })).filter((x) => x.d <= 500).sort((x, y) => x.d - y.d);
        items.push({ label: t('facilities'), value: near.length ? near.map((x) => `${facName(x.f.type)} ${Math.round(x.d)} m`).join(' · ') : t('none500') });
        sc.facilities = near.map((x) => ({ label: `${facName(x.f.type)} · ${Math.round(x.d)} m`, dist: x.d, bearing: x.bearing, color: FAC_C[x.f.type] }));
      }
      if (snap.base === 'none' && !snap.traffic && !snap.facilities) items.push({ label: t('ctxNote'), value: t('noLayer') });
      return {
        items, scene: sc,
        mini: (el) => {
          const mm = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, minZoom: 13, maxZoom: 16 })
            .setView([a.lat, a.lon], 15);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 16 }).addTo(mm);
          const g = L.layerGroup().addTo(mm);
          const saved = state.base; state.base = snap.base; fillBase(g); state.base = saved;
          if (snap.traffic) fillTraffic(g);
          if (snap.facilities) fillFac(g);
          a.impact.zone.forEach((i) => { const c = data.cells[i]; L.rectangle([[c.b[0], c.b[1]], [c.b[2], c.b[3]]], { color: '#00C2CB', weight: 1, fillOpacity: 0.25, interactive: false }).addTo(g); });
          a.impact.residual.forEach((i) => { const c = data.cells[i]; L.rectangle([[c.b[0], c.b[1]], [c.b[2], c.b[3]]], { color: '#D64545', weight: 1, dashArray: '4 3', fillOpacity: 0.25, interactive: false }).addTo(g); });
          a.impact.flows.forEach((f) => L.polyline(flowGeom(f, a).path, { color: '#2E7D32', weight: 3, opacity: 0.7 }).addTo(g));
          L.circle([a.lat, a.lon], { radius: 500, color: '#0D2B5C', weight: 1, dashArray: '4 4', fill: false, interactive: false }).addTo(mm);
          L.circleMarker([a.lat, a.lon], { radius: 8, fillColor: colorOf(a), fillOpacity: 1, color: '#00C2CB', weight: 3 }).addTo(mm);
          setTimeout(() => mm.invalidateSize(), 50);
        },
      };
    };
  }

  let overlay = null;
  async function open3d(a, opt = {}) {
    if (overlay) return;
    const snap = { base: state.base, traffic: state.traffic, facilities: state.facilities };
    map.closePopup();
    await new Promise((res) => { map.once('moveend', res); map.flyTo([a.lat, a.lon], 16, { duration: 0.9 }); });
    const ov = document.createElement('div');
    ov.className = 'sg-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="sg-ov-bar">
        <button type="button" class="bv-btn sg-ov-back"></button>
        <p class="sg-ov-title"><span class="mono">${esc(a.code)}</span> — <span data-o="type"></span></p>
        <p class="sg-ov-badges"><span class="bv-badge" style="--c:${ETAT_C[a.etat]}" data-o="etat"></span>
          <span class="bv-badge" style="--c:${brk(a.score, SCORE_BREAKS)}">${a.score}/100</span></p>
        ${opt.versions ? `<label class="sg-ov-ver"><span data-o="vlab"></span><select data-o="ver">${opt.versions.map((v, i) => `<option value="${i}"${i === opt.idx ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>` : ''}
      </div>
      ${opt.versions ? '<p class="sg-ov-vnote" data-o="vnote"></p>' : ''}
      <div class="sg-ov-body"><div class="sg-ov-viewer"><p class="bv-status mono" data-o="load"></p></div></div>`;
    document.body.append(ov);
    document.documentElement.classList.add('sg-ov-open');
    const labels = () => {
      ov.querySelector('.sg-ov-back').textContent = t('back');
      ov.querySelector('[data-o=type]').textContent = tv(a.type);
      ov.querySelector('[data-o=etat]').textContent = tv(a.etat);
      const l = ov.querySelector('[data-o=load]'); if (l) l.textContent = t('loading3d');
      const vl = ov.querySelector('[data-o=vlab]'); if (vl) vl.textContent = t('verPick');
    };
    labels();
    const lmo = new MutationObserver(labels);
    lmo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
    requestAnimationFrame(() => ov.classList.add('is-in'));
    const back = ov.querySelector('.sg-ov-back');
    back.focus();
    let viewer = null;
    const close = () => {
      lmo.disconnect();
      document.removeEventListener('keydown', onKey);
      viewer?.destroy();
      ov.remove();
      document.documentElement.classList.remove('sg-ov-open');
      overlay = null;
      select(a.code, false);
      assistant.refresh();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', close);
    overlay = { close };
    const loadModel = async (ifcUrl) => {
      try {
        const { mount: mountViewer } = await import(/* @vite-ignore */ viewerUrl);
        viewer = await mountViewer(ov.querySelector('.sg-ov-viewer'), { ifcUrl, wasmPath, context: contextFor(a, snap) });
        if (overlay) overlay.viewer = viewer;
        assistant.refresh();
      } catch (err) {
        console.error(err);
        ov.querySelector('.sg-ov-viewer').innerHTML = `<p class="bv-status">${lang() === 'en' ? 'The 3D model could not be loaded.' : 'La maquette 3D n’a pas pu être chargée.'}</p>`;
      }
    };
    const vsel = ov.querySelector('[data-o=ver]');
    const vnote = () => { const n = ov.querySelector('[data-o=vnote]'); if (n) { const v = opt.versions[Number(vsel.value)]; n.textContent = `${v.label}${v.note ? ` — ${v.note}` : ''}`; } };
    if (vsel) {
      vnote();
      vsel.addEventListener('change', async () => {
        vnote();
        viewer?.destroy(); viewer = null;
        ov.querySelector('.sg-ov-viewer').innerHTML = `<p class="bv-status mono">${esc(t('loading3d'))}</p>`;
        await loadModel(opt.versions[Number(vsel.value)].url);
      });
    }
    await loadModel(opt.versions ? opt.versions[opt.idx].url : `${modelsBase}${a.code}.ifc`);
  }
  map.on('popupclose', () => { if (overlay) return; state.selected = null; drawAssets(); drawImpact(); renderLegend(); renderTable(); });

  /* --- panels */
  function renderControls() {
    const L_ = lang() === 'en' ? 1 : 0;
    ui.colorLabel.textContent = t('colorBy');
    ui.baseLabel.textContent = t('base');
    ui.trafficLabel.textContent = t('traffic');
    ui.facLabel.textContent = t('facilities');
    const opts = [['score', t('score')], ['etat', t('condition')], ['eff', t('eff')], ['verdict', t('verdict')], ['famille', t('family')], ['fin', t('source')]];
    ui.color.innerHTML = opts.map(([v, l]) => `<option value="${v}"${v === state.color ? ' selected' : ''}>${esc(l)}</option>`).join('');
    const bopts = [['none', t('none')], ['pop', lang() === 'en' ? 'Population density' : 'Densité de population'], ['flood', t('flood')], ['sol', lang() === 'en' ? 'Geotechnics' : 'Géotechnique']];
    ui.base.innerHTML = bopts.map(([v, l]) => `<option value="${v}"${v === state.base ? ' selected' : ''}>${esc(l)}</option>`).join('');
    ui.trafficCb.checked = state.traffic; ui.facCb.checked = state.facilities; ui.basinCb.checked = state.basins;
    ui.basinLabel.textContent = Z.basins[lang() === 'en' ? 1 : 0];
    if (ui.projLabel) ui.projLabel.textContent = t('projLayer');
    ui.weightsH.textContent = t('weights');
    ui.resetBtn.textContent = t('reset');
    ui.weights.innerHTML = CRIT.map(([k, lab]) => `<label class="sg-w"><span>${esc(lab[L_])}</span>
      <input type="range" min="0" max="5" step="1" value="${state.w[k]}" data-w="${k}" aria-label="${esc(lab[L_])}"><b class="mono">${state.w[k]}</b></label>`).join('');
    ui.budgetH.textContent = t('budget');
    ui.budget.max = String(Math.ceil(totalCost / Z.step) * Z.step);
    ui.budget.step = String(Z.step);
    ui.budget.value = String(state.budget);
    ui.budgetNote.textContent = t('budgetNote');
    if (!app) for (const b of ui.tabBtns) b.textContent = t(b.dataset.lab);
    for (const d of ui.discl) d.textContent = t('disclaimer');
  }

  function renderStats(ranked) {
    const f = ranked.filter((a) => a.funded);
    ui.budgetVal.textContent = `${fmt(state.budget)} ${Z.cur}`;
    ui.stats.innerHTML = `
      <div><span>${esc(t('funded'))}</span><b class="mono">${f.length} / ${A.length}</b></div>
      <div><span>${esc(t('committed'))}</span><b class="mono">${money(f.reduce((s, a) => s + a.cout, 0))}</b></div>
      <div><span>${esc(t('avoided'))}</span><b class="mono">${money(f.reduce((s, a) => s + a.inaction, 0))}</b></div>`;
  }

  function renderLegend() {
    const item = (c, l, extra = '') => `<li><span class="bv-sw" style="background:${c}${extra}"></span>${esc(l)}</li>`;
    let html = `<h4 class="bv-h">${esc(t('legend'))}</h4><ul class="bv-legend-list sg-leg">`;
    if (state.color === 'score') html += ['70–100', '55–69', '40–54', '25–39', '0–24'].map((l, i) => item(SCORE_BREAKS[i][1], `${t('score')} ${l}`)).join('');
    if (state.color === 'etat') html += Object.entries(ETAT_C).map(([k, c]) => item(c, tv(k))).join('');
    if (state.color === 'famille') html += Object.entries(FAM_C).map(([k, c]) => item(c, tv(k))).join('');
    if (state.color === 'fin') html += Object.entries(FIN_C).map(([k, c]) => item(c, tv(k))).join('');
    if (state.color === 'eff') html += EFF_BREAKS.map(([, c], i) => item(c, `${t('eff')} ${t('effLeg')[i]}`)).join('');
    if (state.color === 'verdict') html += Object.entries(VERDICT_C).map(([k, c]) => item(c, tv(k))).join('');
    html += `<li><span class="sg-ring sg-ring-f"></span>${esc(t('fundedLeg'))}</li><li><span class="sg-ring"></span>${esc(t('notFundedLeg'))}</li>`;
    html += `<li class="bv-muted">${esc(t('sizeLeg'))}</li></ul>`;
    if (state.base !== 'none') {
      html += '<ul class="bv-legend-list sg-leg">';
      if (state.base === 'pop') html += ['≥ 22 000', '16 000 – 22 000', '10 000 – 16 000', '5 000 – 10 000', '< 5 000'].map((l, i) => item(POP_BREAKS[i][1], `${l} ${t('perKm')}`)).join('');
      if (state.base === 'flood') html += [3, 2, 1, 0].map((i, j) => item(FLOOD_BREAKS[j][1], t('floodCls')[i])).join('');
      if (state.base === 'sol') html += Object.entries(SOL_C).map(([k, c]) => item(c, tv(k))).join('');
      html += '</ul>';
    }
    if (state.selected) {
      const im = A.find((x) => x.code === state.selected).impact;
      html += '<ul class="bv-legend-list sg-leg">';
      if (im.zone.length) html += item('#00C2CB', t('zoneServed'));
      if (im.residual.length) html += item('#D64545', t('zoneResid'));
      if (im.flows.length) html += item('#2E7D32', t('flowsLeg'));
      html += '</ul>';
    }
    if (state.basins) html += `<ul class="bv-legend-list sg-leg">${item('#7BC47F', Z.basins[lang() === 'en' ? 1 : 0], ';border-radius:50%')}${data.flowpaths ? item('#2E7D32', t('flowsLeg')) + item('#7A5CC2', lang() === 'en' ? 'Markets and exits' : 'Marchés et sorties', ';border-radius:50%') : ''}</ul>`;
    if (state.traffic || state.facilities) {
      html += '<ul class="bv-legend-list sg-leg">';
      if (state.traffic) html += item('#5C83B5', `${t('traffic')} (TMJA)`, ';border-radius:50%');
      if (state.facilities) html += Object.entries(FAC_C).map(([k, c]) => item(c, facName(k), ';border-radius:50%')).join('');
      html += '</ul>';
    }
    ui.legend.innerHTML = html;
  }

  let ranked = [];
  function renderTable() {
    const head = [t('rank'), t('code'), t('asset'), t('family'), t('condition'), t('score'), t('eff'), t('verdict'), t('cost'), t('cum'), t('fin')];
    const rows = state.query ? ranked.filter((a) => state.query.has(a.code)) : ranked;
    ui.qchip.hidden = !state.query;
    if (state.query) ui.qchip.innerHTML = `<span class="mono">${esc(t('queryChip'))}</span> « ${esc(state.queryLabel)} » — ${esc(t('results')(rows.length))} <button type="button" class="sg-link" data-act="clearq">${esc(t('clear'))}</button>`;
    ui.table.innerHTML = `<thead><tr>${head.map((h, i) => `<th${[0, 5, 6, 8, 9].includes(i) ? ' class="num"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${
      rows.map((a) => `<tr data-code="${a.code}" tabindex="0" class="${a.code === state.selected ? 'is-sel' : ''}${a.funded ? '' : ' sg-out'}">
        <td class="num mono">${a.rank}</td><td class="mono">${esc(a.code)}</td><td>${esc(tv(a.type))}</td><td>${esc(tv(a.famille))}</td>
        <td><span class="bv-badge" style="--c:${ETAT_C[a.etat]}">${esc(tv(a.etat))}</span></td>
        <td class="num"><span class="bv-badge" style="--c:${brk(a.score, SCORE_BREAKS)}">${a.score}</span></td>
        <td class="num mono">${pct(a.impact.eff)}</td>
        <td><span class="bv-badge" style="--c:${VERDICT_C[a.impact.verdict]}">${esc(tv(a.impact.verdict))}</span></td>
        <td class="num mono">${fmt(a.cout)}</td><td class="num mono">${a.cum == null ? '—' : fmt(a.cum)}</td>
        <td>${a.funded ? '✓' : '—'}</td></tr>`).join('')}</tbody>`;
  }

  function update() {
    ranked = compute();
    drawAssets();
    renderStats(ranked);
    renderLegend();
    renderTable();
    if (tab !== 'map' && tab !== 'dash' && boards[tab]) boards[tab].render();
  }

  let pending = 0; // coalesce slider events: one recalculation per frame
  function updateSoon() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; update(); }); }

  /* --- events */
  ui.color.addEventListener('change', () => { state.color = ui.color.value; update(); });
  ui.base.addEventListener('change', () => { state.base = ui.base.value; drawBase(); renderLegend(); });
  ui.trafficCb.addEventListener('change', () => { state.traffic = ui.trafficCb.checked; drawContext(); renderLegend(); });
  ui.facCb.addEventListener('change', () => { state.facilities = ui.facCb.checked; drawContext(); renderLegend(); });
  ui.basinCb.addEventListener('change', () => { state.basins = ui.basinCb.checked; drawContext(); renderLegend(); });
  if (ui.projCb) ui.projCb.addEventListener('change', () => drawProjects());
  ui.weights.addEventListener('input', (e) => {
    const k = e.target.getAttribute('data-w');
    if (!k) return;
    state.w[k] = Number(e.target.value);
    e.target.nextElementSibling.textContent = e.target.value;
    updateSoon();
  });
  ui.resetBtn.addEventListener('click', () => {
    state.w = Object.fromEntries(CRIT.map(([k, , d]) => [k, d]));
    renderControls(); update();
  });
  ui.budget.addEventListener('input', () => { state.budget = Number(ui.budget.value); updateSoon(); });
  ui.qchip.addEventListener('click', (e) => { if (e.target.closest('[data-act=clearq]')) setQuery(null); });
  function setQuery(codes, label = '') {
    state.query = codes ? new Set(codes) : null;
    state.queryLabel = label;
    drawAssets(); renderTable();
    if (codes && codes.length) map.flyToBounds(L.latLngBounds(A.filter((a) => state.query.has(a.code)).map((a) => [a.lat, a.lon])).pad(0.3), { maxZoom: 15, duration: 0.6 });
  }
  ui.table.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-code]'); if (tr) select(tr.getAttribute('data-code'), true); });
  ui.table.addEventListener('keydown', (e) => {
    const tr = e.target.closest('tr[data-code]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(tr.getAttribute('data-code'), true); }
  });
  /* --- boards: each module is downloaded the first time its space is opened */
  const boards = {};
  const loading = {};
  const focusMap = (code) => { showTab('map').then(() => setTimeout(() => { map.invalidateSize(); select(code, true); }, 80)); };
  const FACT = {
    dash: async () => (await import('./scenarios.js')).createScenarioBoard(ui.dash, {
      A, CRIT, Z, lang, tv, money, fmt, pct, esc, FAM_C, ETAT_C, totalCost, defaultBudget: state.budget,
      getMap: () => ({ w: { ...state.w }, budget: state.budget }),
      apply: (w, budget) => { state.w = w; state.budget = budget; renderControls(); update(); showTab('map'); },
    }),
    prof: async () => (await import('./profiles.js')).createProfileBoard(ui.body_prof, {
      lang, tv, money, fmt, pct, esc, Z, ETAT_C, VERDICT_C, FAM_C: () => FAM_C, FIN_C: () => FIN_C, bounds: data.bounds,
      views: () => (access() ? access().views : ['ministre', 'mo', 'tech', 'bailleur', 'audit']),
      ranked: () => ranked, budget: () => state.budget, getLog: () => (store ? store.state.log.filter((l) => l.kind === 'asset') : []),
      focus: focusMap,
    }),
    assets: async () => {
      const typesOf = (fam) => [...new Set(ORIG.filter((a) => a.famille === fam).map((a) => a.type))];
      return (await import('./assets.js')).createAssetBoard(ui.body_assets, {
        lang, tv, fmt, money, esc, Z, ETAT_C, VERDICT_C, store, FAM_C: () => FAM_C, FIN_C: () => FIN_C,
        assets: () => A, typesOf, preview: previewAsset, contextAt, focus: focusMap,
        saveEdit: (code, fields, what) => {
          const d = store.state.added.find((x) => x.code === code);
          if (d) Object.assign(d, fields); else store.state.edits[code] = { ...(store.state.edits[code] || {}), ...fields };
          store.log(code, what); store.commit('asset');
        },
        addAsset: (def, what) => { store.state.added.push(def); store.log(def.code, what); store.commit('asset'); },
        removeAdded: (code, what) => { store.state.added = store.state.added.filter((x) => x.code !== code); store.log(code, what); store.commit('asset'); },
        pickOnMap: (cb) => {
          showTab('map');
          ui.pickmsg.textContent = t('pickMsg'); ui.pickmsg.hidden = false;
          map.getContainer().classList.add('pl-picking');
          const done = () => { ui.pickmsg.hidden = true; map.getContainer().classList.remove('pl-picking'); map.off('click', onClick); document.removeEventListener('keydown', onKey); };
          const onClick = (e) => { done(); cb(e.latlng); showTab('assets'); };
          const onKey = (e) => { if (e.key === 'Escape') { done(); showTab('assets'); } };
          setTimeout(() => { map.on('click', onClick); document.addEventListener('keydown', onKey); }, 50);
          if (!app) ui.map.scrollIntoView({ block: 'center' });
        },
      });
    },
    proj: async () => { await getBoard('ged'); return (await import('./projects.js')).createProjectBoard(ui.body_proj, {
      lang, esc, fmt, money, store, tv, pct, assets: () => A, ranked: () => ranked, focus: focusMap, modelsBase,
      ged: () => boards.ged || null, focusProject: (id) => focusProject(id),
      openDoc: (id) => showTab('ged').then((b) => b && b.openDoc(id)),
      mount3d: async (host, a, url) => {
        const { mount: mountViewer } = await import(/* @vite-ignore */ viewerUrl);
        return mountViewer(host, { ifcUrl: url, wasmPath, context: contextFor(a, { base: state.base, traffic: state.traffic, facilities: state.facilities }) });
      },
      fullscreen3d: (p, cv, url) => (cv.d ? open3dVersions(cv.asset, p.id, cv.v.ver, url) : open3d(cv.asset)),
      resetCondition: (code, what) => {
        const d = store.state.added.find((x) => x.code === code);
        const a = A.find((x) => x.code === code);
        if (!a || a.note === 1) return;
        const cout = Math.round(a.cout * 0.65 / (0.35 + 0.3 * a.note) / 1e7) * 1e7; // same note→cost factor as the generator
        if (d) Object.assign(d, { note: 1, cout }); else store.state.edits[code] = { ...(store.state.edits[code] || {}), note: 1, cout };
        store.log(code, `${what} (${tv(a.etat)} → ${tv('Bon')} ; ${money(a.cout)} → ${money(cout)})`);
      },
    }); },
    collab: async () => {
      const proj = await getBoard('proj');
      const b = (await import('./collab.js')).createCollabBoard(ui.body_collab, {
        lang, esc, store, tv, assets: () => A, projects: () => (proj ? proj.ensure() : []), focus: focusMap,
        openProject: (id) => openProjectSpace(id),
      });
      collabRef = b;
      return b;
    },
    ged: async () => {
      const projList = () => (boards.proj ? boards.proj.ensure() : (store.state.projects || []));
      return (await import('./ged.js')).createGedBoard(ui.body_ged, {
        lang, esc, store, tv, modelsBase, assets: () => A, projects: projList,
        openProject: (id) => openProjectSpace(id),
        open3d: (d, vv, url) => {
          const p = projList().find((x) => x.id === d.link);
          const a = A.find((x) => x.code === (p ? p.codes[0] : d.link));
          if (a) open3dVersions(a, d.link, vv.ver, url);
        },
      });
    },
    home: async () => {
      const [proj, collab, ged] = await Promise.all([getBoard('proj'), getBoard('collab'), getBoard('ged')]);
      if (collab) collab.count('');
      return (await import('./home.js')).createHomeBoard(ui.body_home, {
        lang, esc, store, tv, money, pct, ranked: () => ranked, allowed,
        projects: () => (proj ? proj.ensure() : []), docs: () => (ged ? ged.ensure() : []),
        go: (k) => showTab(k), focus: focusMap,
        openProject: (id) => openProjectSpace(id),
        openDoc: (id) => showTab('ged').then((b) => b && b.openDoc(id)),
      });
    },
  };
  function getBoard(k) {
    if (boards[k]) return Promise.resolve(boards[k]);
    if (!FACT[k] || !ui.panes.some((p_) => p_.dataset.pane === k)) return Promise.resolve(null);
    if (!loading[k]) loading[k] = FACT[k]().then((b) => { boards[k] = b; return b; });
    return loading[k];
  }
  if (store) {
    store.subscribe((what) => {
      if (what !== 'user') {
        map.closePopup(); // before rebuild: the close handler redraws markers from the current ranking
        rebuild();
        for (const [code, m] of markers) if (!A.some((a) => a.code === code)) { m.remove(); markers.delete(code); }
        if (state.selected && !A.some((a) => a.code === state.selected)) state.selected = null;
        map.closePopup(); impactLayer.clearLayers();
        state.budget = Math.min(state.budget, Math.ceil(totalCost / Z.step) * Z.step);
        renderControls(); update();
        drawProjects();
      }
      if (boards[tab] && tab !== 'map') boards[tab].render();
    });
  }
  let tab = 'map';
  async function showTab(k) {
    if (!allowed(k)) return null;
    if (tab === 'proj' && k !== 'proj') boards.proj?.leave();
    tab = k;
    for (const p_ of ui.panes) p_.hidden = p_.dataset.pane !== k;
    for (const b of ui.tabBtns) {
      const on = b.dataset.tab === k;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      if (app) b.classList.toggle('is-on', on);
    }
    if (app) ui.home?.classList.toggle('is-on', k === 'home');
    if (k === 'map') { setTimeout(() => map.invalidateSize(), 30); return null; }
    const pane = ui.panes.find((p_) => p_.dataset.pane === k);
    if (!boards[k] && pane) pane.setAttribute('aria-busy', 'true');
    const b = await getBoard(k);
    pane?.removeAttribute('aria-busy');
    if (b && tab === k) b.render();
    return b;
  }
  ui.tabBtns.forEach((b, i) => {
    b.addEventListener('click', () => showTab(b.dataset.tab));
    b.addEventListener('keydown', (e) => {
      const fwd = app ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight'], back = app ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft'];
      if (!fwd.includes(e.key) && !back.includes(e.key)) return;
      e.preventDefault();
      const o = ui.tabBtns[(i + (fwd.includes(e.key) ? 1 : ui.tabBtns.length - 1)) % ui.tabBtns.length];
      o.focus(); showTab(o.dataset.tab);
    });
  });
  /* --- application shell (full-screen platform) */
  const access = () => (app && store ? ACCESS[store.me().role] || ACCESS.admin : null);
  const allowed = (k) => { const a = access(); return !a || a.spaces.includes(k); };
  function applyAccess() {
    if (!app) return;
    for (const b of ui.tabBtns) b.hidden = !allowed(b.dataset.tab);
    if (!allowed(tab)) land();
  }
  async function land() {
    const k = allowed('home') && ui.panes.some((p_) => p_.dataset.pane === 'home') ? 'home' : 'map';
    return showTab(k);
  }
  function renderShell() {
    if (!app) return;
    ui.home.querySelector('span').textContent = t('navHome');
    for (const b of ui.tabBtns) { b.querySelector('span').textContent = t(b.dataset.nav); b.title = t(b.dataset.nav); }
    ui.search.placeholder = t('search'); ui.search.setAttribute('aria-label', t('search'));
    ui.searchList.innerHTML = A.map((a) => `<option value="${esc(a.code)}">${esc(tv(a.type))}</option>`).join('');
    ui.demo.textContent = t('demoBadge'); ui.demo.title = t('disclaimer');
    ui.rankSum.textContent = t('ranking');
    ui.siteLink.textContent = t('site'); ui.zoneLink.textContent = t('otherZone');
    if (store) {
      const me = store.me();
      const ini = initials(me.name);
      ui.who.innerHTML = `<span class="ga-av">${esc(ini)}</span><span class="ga-who-t"><b>${esc(me.name)}</b><small>${esc(me[lang()])}</small></span>`;
      const names = { editAsset: ['modifier les ouvrages', 'update assets'], addAsset: ['ajouter des ouvrages', 'add assets'], manageProject: ['piloter les projets', 'run projects'], validateStep: ['valider les étapes', 'validate steps'], checkQuality: ['contrôles qualité', 'quality checks'], assignTask: ['attribuer des tâches', 'assign tasks'] };
      const r = Object.keys(names).filter((k) => store.can(k)).map((k) => names[k][lang() === 'en' ? 1 : 0]);
      const ac = access();
      const vn = { ministre: ['Ministre', 'Minister'], mo: ['Maître d’ouvrage', 'Asset owner'], tech: ['Technicien', 'Technician'], bailleur: ['Bailleur', 'Funder'], audit: ['Auditeur', 'Auditor'] };
      const L_ = lang() === 'en' ? 1 : 0;
      ui.whoMenu.innerHTML = `<p class="ga-menu-h">${esc(t('spaces'))}</p><p class="ga-menu-r">${esc(ac.spaces.map((k) => t(NAV_LAB[k])).join(' · '))}</p>
        <p class="ga-menu-h">${esc(t('views'))}</p><p class="ga-menu-r">${esc(ac.views.length ? ac.views.map((v) => vn[v][L_]).join(' · ') : t('noView'))}</p>
        <p class="ga-menu-h">${esc(t('rights'))}</p><p class="ga-menu-r">${esc(r.length ? r.join(' · ') : t('readOnly'))}</p>
        <button type="button" class="ga-menu-b" data-act="switch">${esc(t('switchProfile'))}</button>`;
    }
  }
  if (app) {
    ui.home.addEventListener('click', () => showTab('home'));
    const go = () => {
      const q = ui.search.value.trim().toUpperCase();
      const a = A.find((x) => x.code.toUpperCase() === q) || A.find((x) => x.code.toUpperCase().startsWith(q) || tv(x.type).toUpperCase().includes(q));
      if (a) { ui.search.value = ''; focusMap(a.code); }
    };
    // language toggle of the app bar (the site script only wires the first toggle of the page)
    const syncLang = () => document.querySelectorAll('[data-lang-btn]').forEach((b) => b.classList.toggle('active', b.dataset.langBtn === lang()));
    root.querySelectorAll('.ga-lang [data-lang-btn]').forEach((b) => b.addEventListener('click', () => {
      const l = b.dataset.langBtn;
      document.documentElement.setAttribute('data-lang', l); document.documentElement.setAttribute('lang', l);
      try { const u = new URL(location.href); u.searchParams.set('lang', l); history.replaceState({}, '', u); } catch { /* ignore */ }
      syncLang();
    }));
    syncLang();
    new MutationObserver(syncLang).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
    ui.search.addEventListener('change', go);
    ui.search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    ui.who.addEventListener('click', () => { const open = ui.whoMenu.hidden; ui.whoMenu.hidden = !open; ui.who.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.ga-prof')) { ui.whoMenu.hidden = true; ui.who.setAttribute('aria-expanded', 'false'); } });
    ui.whoMenu.addEventListener('click', (e) => { if (e.target.closest('[data-act=switch]')) { ui.whoMenu.hidden = true; app.onSwitch && app.onSwitch(); } });
    if (store) store.subscribe((w) => { renderShell(); if (w === 'user') applyAccess(); });
  }
  new MutationObserver(() => {
    renderShell();
    renderControls(); drawBase(); drawContext(); update();
    if (boards[tab]) boards[tab].render();
    drawProjects();
    map.closePopup();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  new ResizeObserver(() => map.invalidateSize()).observe(ui.map);

  /* --- request assistant */
  const nearCache = new Map();
  const nearest = (a, ftype) => {
    const key = `${a.code}|${ftype}`;
    if (!nearCache.has(key)) nearCache.set(key, Math.min(Infinity, ...data.facilities.filter((f) => f.type === ftype).map((f) => geo(a, f).d)));
    return nearCache.get(key);
  };
  const budgetSummary = () => {
    const f = ranked.filter((a) => a.funded);
    return lang() === 'en'
      ? `${f.length} assets funded, ${money(f.reduce((s_, a) => s_ + a.cout, 0))} committed, ${money(f.reduce((s_, a) => s_ + a.inaction, 0))}/yr of inaction avoided.`
      : `${f.length} ouvrages financés, ${money(f.reduce((s_, a) => s_ + a.cout, 0))} engagés, ${money(f.reduce((s_, a) => s_ + a.inaction, 0))}/an d’inaction évités.`;
  };
  const assistant = createAssistant({
    lang, tv, zone: data.meta?.zone || 'bj', cur: Z.cur, fmtM, money, unit: Z.div, basinsLabel: Z.basins,
    assets: () => ranked,
    viewer: () => (overlay && overlay.viewer) || null,
    close3d: () => overlay && overlay.close(),
    open3d: async (code) => {
      if (overlay) overlay.close();
      await open3d(A.find((x) => x.code === code));
      return (overlay && overlay.viewer) || null;
    },
    focus: (code) => { if (overlay) overlay.close(); select(code, true); },
    setQuery: (codes, label) => setQuery(codes, label),
    setBudget: (v) => {
      state.budget = Math.max(0, Math.min(Math.ceil(totalCost / Z.step) * Z.step, Math.round(v / Z.step) * Z.step));
      ui.budget.value = String(state.budget); update(); return state.budget;
    },
    budgetSummary,
    setWeight: (k, v) => { state.w[k] = Math.max(0, Math.min(5, v)); renderControls(); update(); },
    resetWeights: () => { state.w = Object.fromEntries(CRIT.map(([k, , d]) => [k, d])); renderControls(); update(); },
    topSummary: (n) => `${lang() === 'en' ? 'New top' : 'Nouveau top'} ${n} : ${ranked.slice(0, n).map((a) => a.code).join(', ')}`,
    setColor: (c) => { state.color = c; renderControls(); update(); },
    setLayer: (key, val) => {
      if (key === 'base') { state.base = val; drawBase(); } else { state[key] = val; drawContext(); }
      renderControls(); renderLegend();
    },
    nearest,
  });
  new IntersectionObserver((entries) => {
    const vis = entries.some((e) => e.isIntersecting);
    assistant.show(vis || !!overlay);
  }, { threshold: 0.05 }).observe(root);

  renderControls();
  drawBase();
  drawContext();
  update();
  renderShell();
  if (app) { applyAccess(); land(); drawProjects(); }
  return {
    map, state, assets: A, assistant, showTab, land,
    setUser: (id) => { if (store) { store.setUser(id); land(); } }, open3d: (code) => open3d(A.find((x) => x.code === code)), get overlay() { return overlay; } };
}

const initials = (n) => { const w = n.replace(/[()]/g, ' ').split(/\s+/).filter((x) => x.length > 2 && !/^(fictif|fictive)$/i.test(x)); return (w.length > 1 ? w[0][0] + w[1][0] : n.slice(0, 2)).toUpperCase(); };
const TAB_LAB = { map: 'tabMap', dash: 'tabDash', prof: 'tabProf', assets: 'tabAssets', proj: 'tabProj', collab: 'tabCollab' };
const NAV_LAB = { home: 'navHome', ged: 'navGed', map: 'navMap', dash: 'navDash', prof: 'navProf', assets: 'navAssets', proj: 'navProj', collab: 'navCollab' };
const ico = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  home: ico('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  map: ico('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  dash: ico('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  prof: ico('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
  assets: ico('<path d="M3 20h18"/><path d="M4 20v-6a8 8 0 0 1 16 0v6"/><path d="M9 20v-5a3 3 0 0 1 6 0v5"/>'),
  proj: ico('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 12l2 2 4-4"/><path d="M9 17h6"/>'),
  collab: ico('<path d="M4 5h11v8H8l-4 3z"/><path d="M15 9h5v8l-3-2h-6v-2"/>'),
  ged: ico('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 13h8M8 16h5"/>'),
};
function buildAppUI(root, keys) {
  const wrap = document.createElement('div');
  wrap.className = 'ga bv sg';
  const mapPane = `
    <div class="ga-mapwrap" role="tabpanel" id="sg-pane-map" aria-labelledby="sg-tab-map" data-pane="map">
      <div class="ga-mapcol">
        <div class="bv-toolbar ga-tools">
          <label class="bv-field"><span class="bv-l" data-r="colorLabel"></span><select data-r="color"></select></label>
          <label class="bv-field"><span class="bv-l" data-r="baseLabel"></span><select data-r="base"></select></label>
          <label class="bv-field sg-cb"><input type="checkbox" data-r="trafficCb"><span data-r="trafficLabel"></span></label>
          <label class="bv-field sg-cb"><input type="checkbox" data-r="facCb"><span data-r="facLabel"></span></label>
          <label class="bv-field sg-cb"><input type="checkbox" data-r="basinCb"><span data-r="basinLabel"></span></label>
          <label class="bv-field sg-cb ga-projcb"><input type="checkbox" data-r="projCb" checked><span data-r="projLabel"></span></label>
        </div>
        <p class="pl-pickmsg" data-r="pickmsg" role="status" hidden></p>
        <div class="sg-map ga-map" data-r="map"></div>
        <details class="ga-drawer"><summary data-r="rankSum"></summary>
          <p class="sg-qchip" data-r="qchip" hidden></p>
          <div class="bv-table-wrap"><table class="bv-table sg-table" data-r="table"></table></div>
        </details>
      </div>
      <aside class="bv-side ga-side">
        <div class="sg-block">
          <h4 class="bv-h" data-r="budgetH"></h4>
          <input type="range" min="0" data-r="budget" class="sg-range" aria-label="budget">
          <p class="sg-budget mono" data-r="budgetVal"></p>
          <div class="sg-stats" data-r="stats"></div>
          <p class="bv-muted sg-small" data-r="budgetNote"></p>
        </div>
        <div class="sg-block" data-r="legend"></div>
        <div class="sg-block">
          <div class="sg-row"><h4 class="bv-h" data-r="weightsH"></h4><button type="button" class="sg-link" data-r="resetBtn"></button></div>
          <div data-r="weights"></div>
        </div>
      </aside>
    </div>`;
  wrap.innerHTML = `
    <nav class="ga-nav" aria-label="GIN²CO">
      <a class="ga-brand" href="index.html"><span class="b1">Digit</span><span class="b2">Infra</span><small>GIN²CO</small></a>
      <button type="button" class="ga-item ga-home" id="ga-home-l" data-r="home">${ICONS.home}<span></span></button>
      <div class="ga-items" role="tablist" aria-orientation="vertical">${keys.map((k, i) => `
        <button type="button" class="ga-item${i ? '' : ' is-on'}" role="tab" id="sg-tab-${k}" aria-controls="sg-pane-${k}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-tab="${k}" data-nav="${NAV_LAB[k]}">${ICONS[k]}<span></span></button>`).join('')}
      </div>
      <div class="ga-foot"><a href="ginco-benin.html" data-r="zoneLink"></a><a href="ginco.html" data-r="siteLink"></a></div>
    </nav>
    <header class="ga-top">
      <div class="ga-title"><b>GIN²CO</b><span data-fr-only>Guinée — routes et flux agricoles</span><span data-en-only>Guinea — roads and farm flows</span></div>
      <div class="ga-search"><input type="search" list="ga-codes" data-r="search" autocomplete="off"><datalist id="ga-codes" data-r="searchList"></datalist></div>
      <span class="ga-demo" data-r="demo" tabindex="0"></span>
      <div class="lang-toggle ga-lang"><button data-lang-btn="fr" class="active">FR</button><button data-lang-btn="en">EN</button></div>
      <div class="ga-prof"><button type="button" class="ga-who" data-r="who" aria-haspopup="true" aria-expanded="false"></button><div class="ga-menu" data-r="whoMenu" hidden></div></div>
    </header>
    <main class="ga-main">${mapPane}
      <section class="sd ga-pane hm" data-pane="home" hidden aria-labelledby="ga-home-l"><div class="sd-body" data-r="body_home"></div></section>
      ${keys.slice(1).map((k) => `<section role="tabpanel" id="sg-pane-${k}" aria-labelledby="sg-tab-${k}" class="sd ga-pane" data-pane="${k}" hidden>
        <div class="sd-body" data-r="${k === 'dash' ? 'dash' : `body_${k}`}"></div></section>`).join('')}
    </main>`;
  root.append(wrap);
  const ui = {};
  wrap.querySelectorAll('[data-r]').forEach((el) => { ui[el.getAttribute('data-r')] = el; });
  ui.tabBtns = [...wrap.querySelectorAll('[data-tab]')];
  ui.panes = [...wrap.querySelectorAll('[data-pane]')];
  ui.discl = [];
  return ui;
}
function buildUI(root, extras, app) {
  if (app) return buildAppUI(root, ['map', 'dash', ...extras, 'ged']);
  const wrap = document.createElement('div');
  wrap.className = 'bv sg';
  const keys = ['map', 'dash', ...extras];
  wrap.innerHTML = `
    <div class="sg-tabs" role="tablist">${keys.map((k, i) => `
      <button type="button" role="tab" id="sg-tab-${k}" aria-controls="sg-pane-${k}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-tab="${k}" data-lab="${TAB_LAB[k]}"></button>`).join('')}
    </div>
    <div role="tabpanel" id="sg-pane-map" aria-labelledby="sg-tab-map" data-pane="map">
    <div class="bv-toolbar">
      <label class="bv-field"><span class="bv-l" data-r="colorLabel"></span><select data-r="color"></select></label>
      <label class="bv-field"><span class="bv-l" data-r="baseLabel"></span><select data-r="base"></select></label>
      <label class="bv-field sg-cb"><input type="checkbox" data-r="trafficCb"><span data-r="trafficLabel"></span></label>
      <label class="bv-field sg-cb"><input type="checkbox" data-r="facCb"><span data-r="facLabel"></span></label>
      <label class="bv-field sg-cb"><input type="checkbox" data-r="basinCb"><span data-r="basinLabel"></span></label>
    </div>
    <p class="sg-disclaimer mono" data-discl></p>
    <p class="pl-pickmsg" data-r="pickmsg" role="status" hidden></p>
    <div class="bv-main">
      <div class="sg-map" data-r="map"></div>
      <aside class="bv-side">
        <div class="sg-block">
          <h4 class="bv-h" data-r="budgetH"></h4>
          <input type="range" min="0" data-r="budget" class="sg-range" aria-label="budget">
          <p class="sg-budget mono" data-r="budgetVal"></p>
          <div class="sg-stats" data-r="stats"></div>
          <p class="bv-muted sg-small" data-r="budgetNote"></p>
        </div>
        <div class="sg-block" data-r="legend"></div>
        <div class="sg-block">
          <div class="sg-row"><h4 class="bv-h" data-r="weightsH"></h4><button type="button" class="sg-link" data-r="resetBtn"></button></div>
          <div data-r="weights"></div>
        </div>
      </aside>
    </div>
    <p class="sg-qchip" data-r="qchip" hidden></p>
    <div class="bv-table-wrap"><table class="bv-table sg-table" data-r="table"></table></div>
    </div>
    ${keys.slice(1).map((k) => `<div role="tabpanel" id="sg-pane-${k}" aria-labelledby="sg-tab-${k}" class="sd" data-pane="${k}" hidden>
      <p class="sg-disclaimer mono" data-discl></p>
      <div class="sd-body" data-r="${k === 'dash' ? 'dash' : `body_${k}`}"></div>
    </div>`).join('')}`;
  root.append(wrap);
  const ui = {};
  wrap.querySelectorAll('[data-r]').forEach((el) => { ui[el.getAttribute('data-r')] = el; });
  ui.tabBtns = [...wrap.querySelectorAll('[data-tab]')];
  ui.panes = [...wrap.querySelectorAll('[data-pane]')];
  ui.discl = [...wrap.querySelectorAll('[data-discl]')];
  return ui;
}
