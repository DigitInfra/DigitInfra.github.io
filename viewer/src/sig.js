// GIN²CO — GIS decision-support demo (Leaflet + OpenStreetMap basemap, fictitious asset data)
import L from 'leaflet';

/* ------------------------------------------------------------------ i18n */
const T = {
  fr: {
    colorBy: 'Ouvrages colorés par', base: 'Couche de fond', none: 'Aucune', traffic: 'Trafic', facilities: 'Équipements',
    weights: 'Pondération des critères', reset: 'Réinitialiser', budget: 'Enveloppe budgétaire',
    funded: 'Ouvrages financés', committed: 'Montant engagé', avoided: 'Coût de l’inaction évité / an',
    legend: 'Légende', rank: 'Rang', code: 'Code', asset: 'Ouvrage', family: 'Famille', condition: 'État', score: 'Score',
    cost: 'Coût (FCFA)', cum: 'Cumul (FCFA)', fin: 'Financé', source: 'Financement envisagé',
    open3d: 'Voir en 3D', loading: 'Chargement de la carte…', back: '← Retour à la carte', loading3d: 'Chargement de la maquette…',
    popDens: 'Densité de population (maille)', noLayer: 'Aucune couche de contexte n’était active sur la carte.',
    depth: 'Lame d’eau de référence', within: 'à moins de 500 m', none500: 'aucun à moins de 500 m', ctxNote: 'Couches reprises de la carte',
    disclaimer: 'Fond de carte réel utilisé à titre d’illustration. Ouvrages, états, couches et montants sont fictifs et ne décrivent pas le patrimoine de cette ville.',
    tmja: 'Trafic (TMJA, véh./j)', pop: 'Population desservie', flood: 'Aléa inondation', sol: 'Sol', equip: 'Équipements à moins de 500 m',
    inaction: 'Coût de l’inaction (FCFA/an)', year: 'Mise en service', insp: 'Dernière inspection', type: 'Type',
    breakdown: 'Contribution au score', yes: 'Oui', no: 'Non', perKm: 'hab./km²',
    fundedLeg: 'Financé dans l’enveloppe', notFundedLeg: 'Hors enveloppe', sizeLeg: 'Taille du cercle : coût',
    floodCls: ['Faible', 'Modéré', 'Élevé', 'Très élevé'], fac: { 'École': 'École', 'Centre de santé': 'Centre de santé', 'Marché': 'Marché' },
    vpj: 'véh./j', hint: 'Cliquez sur un ouvrage ou sur une ligne du tableau.', noTraffic: 'non applicable',
    budgetNote: 'Les ouvrages sont retenus par ordre de score ; un ouvrage qui dépasse le reliquat est sauté au profit des suivants.',
  },
  en: {
    colorBy: 'Colour assets by', base: 'Base layer', none: 'None', traffic: 'Traffic', facilities: 'Facilities',
    weights: 'Criteria weights', reset: 'Reset', budget: 'Budget envelope',
    funded: 'Assets funded', committed: 'Amount committed', avoided: 'Avoided cost of inaction / yr',
    legend: 'Legend', rank: 'Rank', code: 'Code', asset: 'Asset', family: 'Family', condition: 'Condition', score: 'Score',
    cost: 'Cost (FCFA)', cum: 'Cumulative (FCFA)', fin: 'Funded', source: 'Intended funding',
    open3d: 'View in 3D', loading: 'Loading the map…', back: '← Back to the map', loading3d: 'Loading the model…',
    popDens: 'Population density (grid cell)', noLayer: 'No context layer was active on the map.',
    depth: 'Reference water depth', within: 'within 500 m', none500: 'none within 500 m', ctxNote: 'Layers carried over from the map',
    disclaimer: 'Real basemap used for illustration only. Assets, conditions, layers and amounts are fictitious and do not describe this city’s assets.',
    tmja: 'Traffic (AADT, veh./day)', pop: 'Population served', flood: 'Flood hazard', sol: 'Soil', equip: 'Facilities within 500 m',
    inaction: 'Cost of inaction (FCFA/yr)', year: 'In service since', insp: 'Last inspection', type: 'Type',
    breakdown: 'Score contribution', yes: 'Yes', no: 'No', perKm: 'pop./km²',
    fundedLeg: 'Funded within envelope', notFundedLeg: 'Outside envelope', sizeLeg: 'Circle size: cost',
    floodCls: ['Low', 'Moderate', 'High', 'Very high'], fac: { 'École': 'School', 'Centre de santé': 'Health centre', 'Marché': 'Market' },
    vpj: 'veh./day', hint: 'Click an asset or a table row.', noTraffic: 'not applicable',
    budgetNote: 'Assets are selected by score; an asset exceeding the remaining amount is skipped in favour of the next ones.',
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
};
const ETAT_C = { Bon: '#2E9E6B', Moyen: '#E0A100', 'Dégradé': '#E07A3F', Critique: '#D64545' };
const FAM_C = { 'Voirie & ouvrages d’art': '#0D2B5C', 'Drainage & assainissement': '#00A3AD', 'Bâtiments publics': '#7A5CC2' };
const FIN_C = { 'Fonds d’entretien routier': '#0D2B5C', 'Budget communal': '#4CA64C', 'Bailleur (programme)': '#E07A3F' };
const SOL_C = { 'Sables littoraux': '#E9D38C', 'Argiles et vases compressibles': '#9C8AC9', 'Terre de barre (sols latéritiques)': '#C9784A' };
const SOL_V = { 'Argiles et vases compressibles': 1, 'Sables littoraux': 0.6, 'Terre de barre (sols latéritiques)': 0.2 };
const FAC_C = { 'École': '#00C2CB', 'Centre de santé': '#C24C7A', 'Marché': '#7A5CC2' };
const SCORE_BREAKS = [[70, '#D64545'], [55, '#E07A3F'], [40, '#E0A100'], [25, '#A6B83A'], [0, '#2E9E6B']];
const POP_BREAKS = [[22000, '#0D2B5C'], [16000, '#234A7A'], [10000, '#5C83B5'], [5000, '#A9C3E0'], [0, '#E3ECF6']];
const FLOOD_BREAKS = [[0.75, '#08519C'], [0.5, '#3182BD'], [0.25, '#9ECAE1'], [0, '#E6F2F8']];

const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr');
const t = (k) => T[lang()][k];
const tv = (v) => (v == null ? '—' : lang() === 'en' ? (EN[v] || v) : v);
const fmt = (n) => (n == null ? '—' : new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR').format(n));
const fmt2 = (n) => new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtM = (n) => (lang() === 'en' ? `${(n / 1e6).toFixed(1)} M` : `${(n / 1e6).toFixed(1).replace('.', ',')} M`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const brk = (v, b) => b.find(([x]) => v >= x)[1];
const floodCls = (f) => t('floodCls')[f >= 0.75 ? 3 : f >= 0.5 ? 2 : f >= 0.25 ? 1 : 0];

export async function mount(root, { dataUrl, viewerUrl, wasmPath, modelsBase }) {
  root.innerHTML = `<p class="bv-status mono">${esc(t('loading'))}</p>`;
  const data = await (await fetch(dataUrl)).json();
  root.classList.add('bv-ready');
  root.innerHTML = '';
  const ui = buildUI(root);

  const A = data.assets;
  const max = {
    pop: Math.max(...A.map((a) => a.pop)), tmja: Math.max(...A.map((a) => a.tmja || 0)),
    equip: Math.max(1, ...A.map((a) => a.equip)), fin: Math.max(...A.map((a) => Math.log1p(a.inaction / a.cout))),
  };
  for (const a of A) {
    a.crit = {
      etat: (a.note - 1) / 3, pop: a.pop / max.pop, trafic: (a.tmja || 0) / max.tmja, flood: a.flood,
      sol: SOL_V[a.sol], equip: a.equip / max.equip, fin: Math.log1p(a.inaction / a.cout) / max.fin,
    };
  }
  const totalCost = A.reduce((s, a) => s + a.cout, 0);
  const state = {
    w: Object.fromEntries(CRIT.map(([k, , d]) => [k, d])), color: 'score', base: 'none',
    traffic: false, facilities: false, budget: Math.round(totalCost * 0.3 / 1e6) * 1e6, selected: null,
  };

  /* --- map */
  const [[s, w], [n, e]] = data.bounds;
  const bounds = L.latLngBounds([s, w], [n, e]);
  const map = L.map(ui.map, { minZoom: 12, maxZoom: 16, maxBounds: bounds.pad(0.25), zoomSnap: 0.5, attributionControl: true });
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · GIN²CO (données fictives)',
  }).addTo(map);
  map.fitBounds(L.latLngBounds(A.map((a) => [a.lat, a.lon])).pad(0.08));

  const baseLayer = L.layerGroup().addTo(map);
  const trafficLayer = L.layerGroup();
  const facLayer = L.layerGroup();
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
        .bindTooltip(esc(t('fac')[f.type]), { className: 'sg-tip' }).addTo(group);
    }
  }
  function drawContext() {
    trafficLayer.clearLayers(); facLayer.clearLayers();
    fillTraffic(trafficLayer); fillFac(facLayer);
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
    return FIN_C[a.financement];
  }

  function drawAssets() {
    for (const a of A) {
      const style = {
        radius: 6 + Math.sqrt(a.cout / 1e6) * 1.3, fillColor: colorOf(a), fillOpacity: 0.92,
        color: a.funded ? '#0D2B5C' : '#ffffff', weight: a.funded ? 3 : 1.5, dashArray: null,
      };
      let m = markers.get(a.code);
      if (!m) {
        m = L.circleMarker([a.lat, a.lon], style).addTo(assetLayer);
        m.on('click', () => select(a.code, false));
        m.bindTooltip(() => `<strong>${esc(a.code)}</strong> — ${esc(tv(a.type))}<br>${esc(t('score'))} ${a.score}/100`, { className: 'sg-tip', direction: 'top' });
        markers.set(a.code, m);
      } else m.setStyle(style);
      if (state.selected === a.code) m.setStyle({ color: '#00C2CB', weight: 4 });
    }
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
      <p class="sg-pop-h">${esc(t('breakdown'))}</p>
      ${CRIT.map(([k, lab]) => bar(k, lab[lang() === 'en' ? 1 : 0])).join('')}
      <p class="sg-pop-cta"><button type="button" class="btn btn-primary sg-3d" data-code="${esc(a.code)}">${esc(t('open3d'))} →</button></p>
    </div>`;
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
    renderTable();
  }
  map.on('popupopen', (e) => {
    const btn = e.popup.getElement().querySelector('.sg-3d');
    if (btn) btn.addEventListener('click', () => open3d(A.find((x) => x.code === btn.getAttribute('data-code'))));
  });

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
      ];
      const sc = { facilities: [] };
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
        items.push({ label: t('facilities'), value: near.length ? near.map((x) => `${t('fac')[x.f.type]} ${Math.round(x.d)} m`).join(' · ') : t('none500') });
        sc.facilities = near.map((x) => ({ label: `${t('fac')[x.f.type]} · ${Math.round(x.d)} m`, dist: x.d, bearing: x.bearing, color: FAC_C[x.f.type] }));
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
          L.circle([a.lat, a.lon], { radius: 500, color: '#0D2B5C', weight: 1, dashArray: '4 4', fill: false, interactive: false }).addTo(mm);
          L.circleMarker([a.lat, a.lon], { radius: 8, fillColor: colorOf(a), fillOpacity: 1, color: '#00C2CB', weight: 3 }).addTo(mm);
          setTimeout(() => mm.invalidateSize(), 50);
        },
      };
    };
  }

  let overlay = null;
  async function open3d(a) {
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
      </div>
      <div class="sg-ov-body"><div class="sg-ov-viewer"><p class="bv-status mono" data-o="load"></p></div></div>`;
    document.body.append(ov);
    document.documentElement.classList.add('sg-ov-open');
    const labels = () => {
      ov.querySelector('.sg-ov-back').textContent = t('back');
      ov.querySelector('[data-o=type]').textContent = tv(a.type);
      ov.querySelector('[data-o=etat]').textContent = tv(a.etat);
      const l = ov.querySelector('[data-o=load]'); if (l) l.textContent = t('loading3d');
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
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', close);
    overlay = { close };
    try {
      const { mount: mountViewer } = await import(/* @vite-ignore */ viewerUrl);
      viewer = await mountViewer(ov.querySelector('.sg-ov-viewer'), {
        ifcUrl: `${modelsBase}${a.code}.ifc`, wasmPath, context: contextFor(a, snap),
      });
      overlay.viewer = viewer;
    } catch (err) {
      console.error(err);
      ov.querySelector('.sg-ov-viewer').innerHTML = `<p class="bv-status">${lang() === 'en' ? 'The 3D model could not be loaded.' : 'La maquette 3D n’a pas pu être chargée.'}</p>`;
    }
  }
  map.on('popupclose', () => { state.selected = null; drawAssets(); renderTable(); });

  /* --- panels */
  function renderControls() {
    const L_ = lang() === 'en' ? 1 : 0;
    ui.colorLabel.textContent = t('colorBy');
    ui.baseLabel.textContent = t('base');
    ui.trafficLabel.textContent = t('traffic');
    ui.facLabel.textContent = t('facilities');
    const opts = [['score', t('score')], ['etat', t('condition')], ['famille', t('family')], ['fin', t('source')]];
    ui.color.innerHTML = opts.map(([v, l]) => `<option value="${v}"${v === state.color ? ' selected' : ''}>${esc(l)}</option>`).join('');
    const bopts = [['none', t('none')], ['pop', lang() === 'en' ? 'Population density' : 'Densité de population'], ['flood', t('flood')], ['sol', lang() === 'en' ? 'Geotechnics' : 'Géotechnique']];
    ui.base.innerHTML = bopts.map(([v, l]) => `<option value="${v}"${v === state.base ? ' selected' : ''}>${esc(l)}</option>`).join('');
    ui.trafficCb.checked = state.traffic; ui.facCb.checked = state.facilities;
    ui.weightsH.textContent = t('weights');
    ui.resetBtn.textContent = t('reset');
    ui.weights.innerHTML = CRIT.map(([k, lab]) => `<label class="sg-w"><span>${esc(lab[L_])}</span>
      <input type="range" min="0" max="5" step="1" value="${state.w[k]}" data-w="${k}" aria-label="${esc(lab[L_])}"><b class="mono">${state.w[k]}</b></label>`).join('');
    ui.budgetH.textContent = t('budget');
    ui.budget.max = String(Math.ceil(totalCost / 1e6) * 1e6);
    ui.budget.step = '1000000';
    ui.budget.value = String(state.budget);
    ui.budgetNote.textContent = t('budgetNote');
    ui.disclaimer.textContent = t('disclaimer');
  }

  function renderStats(ranked) {
    const f = ranked.filter((a) => a.funded);
    ui.budgetVal.textContent = `${fmt(state.budget)} FCFA`;
    ui.stats.innerHTML = `
      <div><span>${esc(t('funded'))}</span><b class="mono">${f.length} / ${A.length}</b></div>
      <div><span>${esc(t('committed'))}</span><b class="mono">${fmtM(f.reduce((s, a) => s + a.cout, 0))} FCFA</b></div>
      <div><span>${esc(t('avoided'))}</span><b class="mono">${fmtM(f.reduce((s, a) => s + a.inaction, 0))} FCFA</b></div>`;
  }

  function renderLegend() {
    const item = (c, l, extra = '') => `<li><span class="bv-sw" style="background:${c}${extra}"></span>${esc(l)}</li>`;
    let html = `<h4 class="bv-h">${esc(t('legend'))}</h4><ul class="bv-legend-list sg-leg">`;
    if (state.color === 'score') html += ['70–100', '55–69', '40–54', '25–39', '0–24'].map((l, i) => item(SCORE_BREAKS[i][1], `${t('score')} ${l}`)).join('');
    if (state.color === 'etat') html += Object.entries(ETAT_C).map(([k, c]) => item(c, tv(k))).join('');
    if (state.color === 'famille') html += Object.entries(FAM_C).map(([k, c]) => item(c, tv(k))).join('');
    if (state.color === 'fin') html += Object.entries(FIN_C).map(([k, c]) => item(c, tv(k))).join('');
    html += `<li><span class="sg-ring sg-ring-f"></span>${esc(t('fundedLeg'))}</li><li><span class="sg-ring"></span>${esc(t('notFundedLeg'))}</li>`;
    html += `<li class="bv-muted">${esc(t('sizeLeg'))}</li></ul>`;
    if (state.base !== 'none') {
      html += '<ul class="bv-legend-list sg-leg">';
      if (state.base === 'pop') html += ['≥ 22 000', '16 000 – 22 000', '10 000 – 16 000', '5 000 – 10 000', '< 5 000'].map((l, i) => item(POP_BREAKS[i][1], `${l} ${t('perKm')}`)).join('');
      if (state.base === 'flood') html += [3, 2, 1, 0].map((i, j) => item(FLOOD_BREAKS[j][1], t('floodCls')[i])).join('');
      if (state.base === 'sol') html += Object.entries(SOL_C).map(([k, c]) => item(c, tv(k))).join('');
      html += '</ul>';
    }
    if (state.traffic || state.facilities) {
      html += '<ul class="bv-legend-list sg-leg">';
      if (state.traffic) html += item('#5C83B5', `${t('traffic')} (TMJA)`, ';border-radius:50%');
      if (state.facilities) html += Object.entries(FAC_C).map(([k, c]) => item(c, t('fac')[k], ';border-radius:50%')).join('');
      html += '</ul>';
    }
    ui.legend.innerHTML = html;
  }

  let ranked = [];
  function renderTable() {
    const head = [t('rank'), t('code'), t('asset'), t('family'), t('condition'), t('score'), t('cost'), t('cum'), t('fin')];
    ui.table.innerHTML = `<thead><tr>${head.map((h, i) => `<th${[0, 5, 6, 7].includes(i) ? ' class="num"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${
      ranked.map((a) => `<tr data-code="${a.code}" tabindex="0" class="${a.code === state.selected ? 'is-sel' : ''}${a.funded ? '' : ' sg-out'}">
        <td class="num mono">${a.rank}</td><td class="mono">${esc(a.code)}</td><td>${esc(tv(a.type))}</td><td>${esc(tv(a.famille))}</td>
        <td><span class="bv-badge" style="--c:${ETAT_C[a.etat]}">${esc(tv(a.etat))}</span></td>
        <td class="num"><span class="bv-badge" style="--c:${brk(a.score, SCORE_BREAKS)}">${a.score}</span></td>
        <td class="num mono">${fmt(a.cout)}</td><td class="num mono">${a.cum == null ? '—' : fmt(a.cum)}</td>
        <td>${a.funded ? '✓' : '—'}</td></tr>`).join('')}</tbody>`;
  }

  function update() {
    ranked = compute();
    drawAssets();
    renderStats(ranked);
    renderLegend();
    renderTable();
  }

  /* --- events */
  ui.color.addEventListener('change', () => { state.color = ui.color.value; update(); });
  ui.base.addEventListener('change', () => { state.base = ui.base.value; drawBase(); renderLegend(); });
  ui.trafficCb.addEventListener('change', () => { state.traffic = ui.trafficCb.checked; drawContext(); renderLegend(); });
  ui.facCb.addEventListener('change', () => { state.facilities = ui.facCb.checked; drawContext(); renderLegend(); });
  ui.weights.addEventListener('input', (e) => {
    const k = e.target.getAttribute('data-w');
    if (!k) return;
    state.w[k] = Number(e.target.value);
    e.target.nextElementSibling.textContent = e.target.value;
    update();
  });
  ui.resetBtn.addEventListener('click', () => {
    state.w = Object.fromEntries(CRIT.map(([k, , d]) => [k, d]));
    renderControls(); update();
  });
  ui.budget.addEventListener('input', () => { state.budget = Number(ui.budget.value); update(); });
  ui.table.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-code]'); if (tr) select(tr.getAttribute('data-code'), true); });
  ui.table.addEventListener('keydown', (e) => {
    const tr = e.target.closest('tr[data-code]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(tr.getAttribute('data-code'), true); }
  });
  new MutationObserver(() => {
    renderControls(); drawBase(); drawContext(); update();
    map.closePopup();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  new ResizeObserver(() => map.invalidateSize()).observe(ui.map);

  renderControls();
  drawBase();
  drawContext();
  update();
  return { map, state, assets: A, open3d: (code) => open3d(A.find((x) => x.code === code)), get overlay() { return overlay; } };
}

function buildUI(root) {
  const wrap = document.createElement('div');
  wrap.className = 'bv sg';
  wrap.innerHTML = `
    <div class="bv-toolbar">
      <label class="bv-field"><span class="bv-l" data-r="colorLabel"></span><select data-r="color"></select></label>
      <label class="bv-field"><span class="bv-l" data-r="baseLabel"></span><select data-r="base"></select></label>
      <label class="bv-field sg-cb"><input type="checkbox" data-r="trafficCb"><span data-r="trafficLabel"></span></label>
      <label class="bv-field sg-cb"><input type="checkbox" data-r="facCb"><span data-r="facLabel"></span></label>
    </div>
    <p class="sg-disclaimer mono" data-r="disclaimer"></p>
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
    <div class="bv-table-wrap"><table class="bv-table sg-table" data-r="table"></table></div>`;
  root.append(wrap);
  const ui = {};
  wrap.querySelectorAll('[data-r]').forEach((el) => { ui[el.getAttribute('data-r')] = el; });
  return ui;
}
