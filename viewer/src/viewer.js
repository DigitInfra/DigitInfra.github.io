// GIN²CO — openBIM demo viewer (IFC 4 read in the browser with web-ifc, rendered with three.js)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IfcAPI } from 'web-ifc';

/* ------------------------------------------------------------------ i18n */
const T = {
  fr: {
    colorBy: 'Colorer par', filter: 'Filtrer', all: 'Tous', isolate: 'Isoler la sélection', showAll: 'Tout afficher',
    fit: 'Recentrer', legend: 'Légende', selected: 'Élément sélectionné',
    noSel: 'Cliquez sur un élément de la maquette ou sur une ligne du tableau.',
    hint: 'Glisser : tourner · Clic droit : déplacer · Molette : zoomer · Clic : sélectionner',
    shown: (n, t) => `${n} élément${n > 1 ? 's' : ''} affiché${n > 1 ? 's' : ''} sur ${t}`,
    total: 'Coût estimé des éléments affichés', loading: 'Lecture du fichier IFC…', error: 'Impossible de charger la maquette.',
    original: 'Couleurs d’origine (IFC)', ifcClass: 'Classe IFC', code: 'Code', element: 'Élément',
    quantities: 'Quantités', identity: 'Identification', none: '—', score: 'Note (1–4)', colon: ' : ',
  },
  en: {
    colorBy: 'Colour by', filter: 'Filter', all: 'All', isolate: 'Isolate selection', showAll: 'Show all',
    fit: 'Reset view', legend: 'Legend', selected: 'Selected element',
    noSel: 'Click an element in the model or a row in the table.',
    hint: 'Drag: rotate · Right-click: pan · Wheel: zoom · Click: select',
    shown: (n, t) => `${n} of ${t} element${t > 1 ? 's' : ''} shown`,
    total: 'Estimated cost of displayed elements', loading: 'Reading the IFC file…', error: 'The model could not be loaded.',
    original: 'Original colours (IFC)', ifcClass: 'IFC class', code: 'Code', element: 'Element',
    quantities: 'Quantities', identity: 'Identification', none: '—', score: 'Score (1–4)', colon: ': ',
  },
};
const PROP_LABEL = {
  Famille: ['Famille', 'Asset family'], Materiau: ['Matériau', 'Material'],
  AnneeMiseEnService: ['Mise en service', 'In service since'], DateDerniereInspection: ['Dernière inspection', 'Last inspection'],
  Etat: ['État', 'Condition'], NoteEtat: ['Note d’état (1 bon → 4 critique)', 'Condition score (1 good → 4 critical)'],
  Desordre: ['Désordre constaté', 'Observed defect'], PrioriteEntretien: ['Priorité d’entretien', 'Maintenance priority'],
  CoutEstimeFCFA: ['Coût estimé (FCFA)', 'Estimated cost (FCFA)'], ActionRecommandee: ['Action recommandée', 'Recommended action'],
  Volume: ['Volume (m³)', 'Volume (m³)'], Longueur: ['Longueur (m)', 'Length (m)'],
};
const VALUE_EN = {
  Bon: 'Good', Moyen: 'Fair', Critique: 'Critical', Structure: 'Structure', 'Protection hydraulique': 'Scour protection',
  'Chaussée': 'Pavement', 'Équipement de sécurité': 'Safety equipment', 'Béton armé': 'Reinforced concrete',
  Enrochement: 'Riprap', 'Enrobé bitumineux': 'Asphalt', 'Acier galvanisé': 'Galvanised steel', 'Grave latéritique': 'Lateritic gravel',
  P1: 'P1 — urgent', P2: 'P2 — planned', P3: 'P3 — routine',
};
const VALUE_FR = { P1: 'P1 — urgent', P2: 'P2 — programmé', P3: 'P3 — courant' };

/* ------------------------------------------------------------------ colour schemes */
const PALETTE = ['#00C2CB', '#0D2B5C', '#E07A3F', '#7A5CC2', '#4CA64C', '#C24C7A', '#8A9BB0'];
const FIXED = {
  Etat: { Bon: '#2E9E6B', Moyen: '#E0A100', Critique: '#D64545' },
  PrioriteEntretien: { P1: '#D64545', P2: '#E0A100', P3: '#2E9E6B' },
  NoteEtat: { 1: '#2E9E6B', 2: '#A6B83A', 3: '#E0A100', 4: '#D64545' },
};
const ORDER = {
  Etat: ['Critique', 'Moyen', 'Bon'], PrioriteEntretien: ['P1', 'P2', 'P3'], NoteEtat: [4, 3, 2, 1],
};
const COLOR_PARAMS = ['Etat', 'PrioriteEntretien', 'NoteEtat', 'Famille', 'Materiau', 'AnneeMiseEnService', 'ifcClass', 'original'];
const FILTER_PARAMS = ['Famille', 'Etat', 'PrioriteEntretien', 'Materiau', 'AnneeMiseEnService', 'ifcClass'];
const TABLE_COLS = [
  ['code', 'Code'], ['name', 'element'], ['Etat', 'Etat'], ['NoteEtat', 'NoteEtat'],
  ['PrioriteEntretien', 'PrioriteEntretien'], ['CoutEstimeFCFA', 'CoutEstimeFCFA'],
];

/* ------------------------------------------------------------------ helpers */
const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr');
const t = (k) => T[lang()][k];
const pl = (k) => (PROP_LABEL[k] ? PROP_LABEL[k][lang() === 'en' ? 1 : 0] : k === 'ifcClass' ? t('ifcClass') : k === 'original' ? t('original') : k);
const tv = (v) => {
  if (v === undefined || v === null || v === '') return T[lang()].none;
  const s = String(v);
  return lang() === 'en' ? (VALUE_EN[s] || s) : (VALUE_FR[s] || s);
};
const fmt = (n) => new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR').format(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (tag, attrs = {}, html = '') => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (html) el.innerHTML = html;
  return el;
};

/* ------------------------------------------------------------------ mount */
export async function mount(root, { ifcUrl, wasmPath }) {
  root.innerHTML = '';
  root.classList.add('bv-ready');
  const status = h('p', { class: 'bv-status mono' }, esc(t('loading')));
  root.append(status);

  /* --- read IFC */
  const api = new IfcAPI();
  api.SetWasmPath(wasmPath, true);
  await api.Init();
  const data = new Uint8Array(await (await fetch(ifcUrl)).arrayBuffer());
  const modelID = api.OpenModel(data, { COORDINATE_TO_ORIGIN: false });

  const elements = new Map(); // expressID -> { id, meshes:[], props:{}, ... }
  const meshesRoot = new THREE.Group();
  const mats = new Map();

  api.StreamAllMeshes(modelID, (flat) => {
    const id = flat.expressID;
    const rec = { id, meshes: [], props: {}, original: null };
    const geoms = flat.geometries;
    for (let i = 0; i < geoms.size(); i++) {
      const pg = geoms.get(i);
      const g = api.GetGeometry(modelID, pg.geometryExpressID);
      const v = api.GetVertexArray(g.GetVertexData(), g.GetVertexDataSize());
      const idx = api.GetIndexArray(g.GetIndexData(), g.GetIndexDataSize());
      const pos = new Float32Array(v.length / 2), nor = new Float32Array(v.length / 2);
      for (let j = 0, k = 0; j < v.length; j += 6, k += 3) {
        pos[k] = v[j]; pos[k + 1] = v[j + 1]; pos[k + 2] = v[j + 2];
        nor[k] = v[j + 3]; nor[k + 1] = v[j + 4]; nor[k + 2] = v[j + 5];
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      bg.setIndex(new THREE.BufferAttribute(idx, 1));
      bg.applyMatrix4(new THREE.Matrix4().fromArray(pg.flatTransformation));
      const c = pg.color;
      rec.original = new THREE.Color(c.x, c.y, c.z);
      const mat = new THREE.MeshStandardMaterial({ color: rec.original.clone(), roughness: 0.85, metalness: 0.05,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const mesh = new THREE.Mesh(bg, mat);
      mesh.userData.id = id;
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bg, 25),
        new THREE.LineBasicMaterial({ color: 0x1e2430, transparent: true, opacity: 0.35 }));
      mesh.add(edges);
      rec.meshes.push(mesh);
      meshesRoot.add(mesh);
      g.delete();
    }
    elements.set(id, rec);
  });

  for (const rec of elements.values()) {
    const line = api.GetLine(modelID, rec.id, false);
    rec.name = line.Name?.value ?? '';
    rec.code = line.Tag?.value ?? '';
    rec.objectType = line.ObjectType?.value ?? '';
    const psets = await api.properties.getPropertySets(modelID, rec.id, true, false);
    for (const ps of psets) {
      for (const p of ps.HasProperties || []) rec.props[p.Name.value] = p.NominalValue?.value;
      for (const q of ps.Quantities || []) {
        const val = q.VolumeValue ?? q.LengthValue ?? q.AreaValue ?? q.CountValue;
        rec.props[q.Name.value] = val?.value ?? val;
      }
    }
    rec.props.ifcClass = prettyClass(api.GetNameFromTypeCode(api.GetLineType(modelID, rec.id)));
  }
  api.CloseModel(modelID);

  /* --- scene */
  status.remove();
  const ui = buildUI(root);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f9fc);
  scene.add(meshesRoot);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d2, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(30, 50, 20);
  scene.add(sun);

  const box = new THREE.Box3().setFromObject(meshesRoot);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const grid = new THREE.GridHelper(Math.ceil(Math.max(size.x, size.z) * 1.6), 30, 0xc9d6e3, 0xe3eaf2);
  grid.position.set(center.x, box.min.y - 0.01, center.z);
  scene.add(grid);

  const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const fitView = () => {
    const vis = meshesRoot.children.filter((m) => m.visible);
    const b = new THREE.Box3();
    (vis.length ? vis : meshesRoot.children).forEach((m) => b.expandByObject(m));
    const c = b.getCenter(new THREE.Vector3());
    const r = Math.max(b.getSize(new THREE.Vector3()).length(), 4) * 0.68;
    const rr = r * (camera.aspect < 1.5 ? Math.min(1.8, 1.35 / camera.aspect) : 1);
    camera.position.set(c.x + rr * 0.9, c.y + rr * 0.5, c.z + rr * 1.1);
    controls.target.copy(c);
    controls.update();
  };
  const resize = () => {
    const w = ui.canvasWrap.clientWidth, hgt = ui.canvasWrap.clientHeight;
    renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(ui.canvasWrap);
  resize();
  fitView();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  /* --- state */
  const state = { color: 'Etat', fparam: '', fval: '', hiddenCats: new Set(), isolate: null, selected: null,
    sortKey: 'PrioriteEntretien', sortDir: 1 };
  const all = [...elements.values()];
  const valOf = (rec, k) => (k === 'name' ? rec.name : k === 'code' ? rec.code : rec.props[k]);
  const catsOf = (k) => {
    const vals = [...new Set(all.map((r) => valOf(r, k)))];
    const ord = ORDER[k];
    return ord ? vals.sort((a, b) => ord.indexOf(a) - ord.indexOf(b)) : vals.sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
  };
  const colorFor = (k, v) => {
    if (FIXED[k] && FIXED[k][v]) return FIXED[k][v];
    const cats = catsOf(k);
    return PALETTE[cats.indexOf(v) % PALETTE.length];
  };
  const isVisible = (rec) => {
    if (state.isolate !== null) return rec.id === state.isolate;
    if (state.fparam && state.fval !== '' && String(valOf(rec, state.fparam)) !== state.fval) return false;
    if (state.color !== 'original' && state.hiddenCats.has(String(valOf(rec, state.color)))) return false;
    return true;
  };

  /* --- rendering of state */
  function apply() {
    for (const rec of all) {
      const vis = isVisible(rec);
      const col = state.color === 'original' ? rec.original : new THREE.Color(colorFor(state.color, valOf(rec, state.color)));
      const sel = rec.id === state.selected;
      const dim = state.selected !== null && !sel;
      const ghost = rec.objectType === 'Remblai' && !sel;
      const op = dim ? 0.18 : ghost ? 0.3 : 1;
      for (const m of rec.meshes) {
        m.visible = vis;
        m.material.color.copy(col);
        m.material.transparent = op < 1;
        m.material.opacity = op;
        m.material.depthWrite = op === 1;
        m.material.needsUpdate = true;
        m.renderOrder = op < 1 ? 1 : 0;
        m.children[0].material.color.set(sel ? 0x00c2cb : 0x1e2430);
        m.children[0].material.opacity = sel ? 1 : dim || ghost ? 0.12 : 0.35;
      }
    }
    renderLegend();
    renderTable();
    renderProps();
    ui.isolateBtn.disabled = state.selected === null;
  }

  function renderToolbar() {
    ui.colorLabel.textContent = t('colorBy');
    ui.filterLabel.textContent = t('filter');
    ui.isolateBtn.textContent = t('isolate');
    ui.showAllBtn.textContent = t('showAll');
    ui.fitBtn.textContent = t('fit');
    ui.hint.textContent = t('hint');
    ui.color.innerHTML = COLOR_PARAMS.map((k) => `<option value="${k}"${k === state.color ? ' selected' : ''}>${esc(pl(k))}</option>`).join('');
    ui.fparam.innerHTML = `<option value="">${esc(t('all'))}</option>` +
      FILTER_PARAMS.map((k) => `<option value="${k}"${k === state.fparam ? ' selected' : ''}>${esc(pl(k))}</option>`).join('');
    ui.fval.innerHTML = state.fparam
      ? `<option value="">${esc(t('all'))}</option>` + catsOf(state.fparam).map((v) => `<option value="${esc(v)}"${String(v) === state.fval ? ' selected' : ''}>${esc(tv(v))}</option>`).join('')
      : '';
    ui.fval.hidden = !state.fparam;
  }

  function renderLegend() {
    ui.legend.innerHTML = `<h4 class="bv-h">${esc(t('legend'))} — ${esc(pl(state.color))}</h4>`;
    if (state.color === 'original') {
      ui.legend.innerHTML += `<p class="bv-muted">${esc(t('original'))}</p>`;
      return;
    }
    const list = h('ul', { class: 'bv-legend-list' });
    for (const v of catsOf(state.color)) {
      const n = all.filter((r) => String(valOf(r, state.color)) === String(v)).length;
      const on = !state.hiddenCats.has(String(v));
      const li = h('li');
      li.innerHTML = `<label><input type="checkbox" ${on ? 'checked' : ''} data-cat="${esc(v)}">` +
        `<span class="bv-sw" style="background:${colorFor(state.color, v)}"></span>` +
        `<span>${esc(tv(v))}</span><span class="bv-count mono">${n}</span></label>`;
      list.append(li);
    }
    ui.legend.append(list);
  }

  function renderProps() {
    const rec = elements.get(state.selected);
    if (!rec) {
      ui.props.innerHTML = `<h4 class="bv-h">${esc(t('selected'))}</h4><p class="bv-muted">${esc(t('noSel'))}</p>`;
      return;
    }
    const row = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
    const p = rec.props;
    const badge = (k, v) => `<span class="bv-badge" style="--c:${colorFor(k, v)}">${esc(tv(v))}</span>`;
    ui.props.innerHTML = `<h4 class="bv-h">${esc(t('selected'))}</h4>
      <p class="bv-title">${esc(rec.name)}</p>
      <table class="bv-kv">
        ${row(t('code'), `<span class="mono">${esc(rec.code)}</span>`)}
        ${row(t('ifcClass'), `<span class="mono">${esc(p.ifcClass)}</span>`)}
        ${row(pl('Famille'), esc(tv(p.Famille)))}
        ${row(pl('Materiau'), esc(tv(p.Materiau)))}
        ${row(pl('AnneeMiseEnService'), esc(tv(p.AnneeMiseEnService)))}
        ${row(pl('DateDerniereInspection'), esc(tv(p.DateDerniereInspection)))}
        ${row(pl('Etat'), badge('Etat', p.Etat))}
        ${row(pl('NoteEtat'), esc(tv(p.NoteEtat)))}
        ${row(pl('Desordre'), esc(tv(p.Desordre)))}
        ${row(pl('PrioriteEntretien'), badge('PrioriteEntretien', p.PrioriteEntretien))}
        ${row(pl('ActionRecommandee'), esc(tv(p.ActionRecommandee)))}
        ${row(pl('CoutEstimeFCFA'), p.CoutEstimeFCFA ? fmt(p.CoutEstimeFCFA) : esc(T[lang()].none))}
        ${row(pl('Volume'), esc(tv(p.Volume)))}
        ${row(pl('Longueur'), esc(tv(p.Longueur)))}
      </table>
      <p class="bv-muted bv-src mono">Pset_GIN2CO_Patrimoine · Qto_GIN2CO_Quantites</p>`;
  }

  function renderTable() {
    const vis = all.filter(isVisible);
    const key = state.sortKey;
    const rank = (r) => {
      const v = valOf(r, key);
      if (ORDER[key]) return ORDER[key].indexOf(v);
      return v;
    };
    vis.sort((a, b) => {
      const x = rank(a), y = rank(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fr', { numeric: true });
      return (c || (b.props.CoutEstimeFCFA || 0) - (a.props.CoutEstimeFCFA || 0)) * state.sortDir;
    });
    const head = TABLE_COLS.map(([k, lab]) => {
      const label = lab === 'Code' ? t('code') : lab === 'element' ? t('element') : lab === 'NoteEtat' ? t('score') : pl(lab);
      const arrow = state.sortKey === k ? (state.sortDir === 1 ? ' ▲' : ' ▼') : '';
      return `<th${k === 'CoutEstimeFCFA' || k === 'NoteEtat' ? ' class="num"' : ''}><button type="button" data-sort="${k}">${esc(label)}${arrow}</button></th>`;
    }).join('');
    const body = vis.map((r) => {
      const p = r.props;
      return `<tr data-id="${r.id}" tabindex="0" class="${r.id === state.selected ? 'is-sel' : ''}">
        <td class="mono">${esc(r.code)}</td><td>${esc(r.name)}</td>
        <td><span class="bv-badge" style="--c:${colorFor('Etat', p.Etat)}">${esc(tv(p.Etat))}</span></td>
        <td class="num">${esc(tv(p.NoteEtat))}</td>
        <td><span class="bv-badge" style="--c:${colorFor('PrioriteEntretien', p.PrioriteEntretien)}">${esc(p.PrioriteEntretien)}</span></td>
        <td class="num">${p.CoutEstimeFCFA ? fmt(p.CoutEstimeFCFA) : '—'}</td></tr>`;
    }).join('');
    const total = vis.reduce((s, r) => s + (r.props.CoutEstimeFCFA || 0), 0);
    ui.table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
    ui.total.innerHTML = `<span>${esc(t('shown')(vis.length, all.length))}</span>` +
      `<span>${esc(t('total'))}${t('colon')}<strong class="mono">${fmt(total)} FCFA</strong></span>`;
  }

  /* --- events */
  ui.color.addEventListener('change', () => { state.color = ui.color.value; state.hiddenCats.clear(); apply(); });
  ui.fparam.addEventListener('change', () => { state.fparam = ui.fparam.value; state.fval = ''; renderToolbar(); apply(); });
  ui.fval.addEventListener('change', () => { state.fval = ui.fval.value; apply(); });
  ui.legend.addEventListener('change', (e) => {
    const c = e.target.getAttribute('data-cat');
    if (c === null) return;
    e.target.checked ? state.hiddenCats.delete(c) : state.hiddenCats.add(c);
    apply();
  });
  ui.isolateBtn.addEventListener('click', () => { if (state.selected !== null) { state.isolate = state.selected; apply(); fitView(); } });
  ui.showAllBtn.addEventListener('click', () => {
    state.isolate = null; state.hiddenCats.clear(); state.fparam = ''; state.fval = '';
    renderToolbar(); apply(); fitView();
  });
  ui.fitBtn.addEventListener('click', fitView);
  ui.table.addEventListener('click', (e) => {
    const s = e.target.closest('[data-sort]');
    if (s) {
      const k = s.getAttribute('data-sort');
      state.sortDir = state.sortKey === k ? -state.sortDir : (k === 'CoutEstimeFCFA' || k === 'NoteEtat' ? -1 : 1);
      state.sortKey = k;
      renderTable();
      return;
    }
    const tr = e.target.closest('tr[data-id]');
    if (tr) select(Number(tr.getAttribute('data-id')));
  });
  ui.table.addEventListener('keydown', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(Number(tr.getAttribute('data-id'))); }
  });
  function select(id) {
    state.selected = state.selected === id ? null : id;
    apply();
  }

  const ray = new THREE.Raycaster();
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || e.button !== 0) return;
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const pickable = meshesRoot.children.filter((m) => m.visible && elements.get(m.userData.id).objectType !== 'Remblai');
    const hit = ray.intersectObjects(pickable, false)[0]
      || ray.intersectObjects(meshesRoot.children.filter((m) => m.visible), false)[0];
    state.selected = hit ? hit.object.userData.id : null;
    apply();
  });

  new MutationObserver(() => { renderToolbar(); apply(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

  renderToolbar();
  apply();
  return { elements, state };
}

function prettyClass(name) {
  const map = { IFCWALL: 'IfcWall', IFCSLAB: 'IfcSlab', IFCRAILING: 'IfcRailing', IFCBUILDINGELEMENTPROXY: 'IfcBuildingElementProxy' };
  return map[name] || name;
}

function buildUI(root) {
  const wrap = h('div', { class: 'bv' });
  wrap.innerHTML = `
    <div class="bv-toolbar">
      <label class="bv-field"><span class="bv-l" data-r="colorLabel"></span><select data-r="color"></select></label>
      <label class="bv-field"><span class="bv-l" data-r="filterLabel"></span><select data-r="fparam"></select><select data-r="fval"></select></label>
      <div class="bv-actions">
        <button type="button" class="bv-btn" data-r="isolateBtn"></button>
        <button type="button" class="bv-btn" data-r="showAllBtn"></button>
        <button type="button" class="bv-btn" data-r="fitBtn"></button>
      </div>
    </div>
    <div class="bv-main">
      <div class="bv-canvas" data-r="canvasWrap"><canvas data-r="canvas"></canvas><p class="bv-hint mono" data-r="hint"></p></div>
      <aside class="bv-side"><div data-r="legend" class="bv-legend"></div><div data-r="props" class="bv-props"></div></aside>
    </div>
    <div class="bv-table-wrap"><table class="bv-table" data-r="table"></table></div>
    <p class="bv-total" data-r="total"></p>`;
  root.append(wrap);
  const ui = {};
  wrap.querySelectorAll('[data-r]').forEach((el) => { ui[el.getAttribute('data-r')] = el; });
  return ui;
}
