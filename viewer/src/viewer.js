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
    quantities: 'Quantités', identity: 'Identification', none: '—', score: 'Note (1–4)', colon: ' : ', ctx: 'Contexte SIG — couches actives', north: 'N',
  },
  en: {
    colorBy: 'Colour by', filter: 'Filter', all: 'All', isolate: 'Isolate selection', showAll: 'Show all',
    fit: 'Reset view', legend: 'Legend', selected: 'Selected element',
    noSel: 'Click an element in the model or a row in the table.',
    hint: 'Drag: rotate · Right-click: pan · Wheel: zoom · Click: select',
    shown: (n, t) => `${n} of ${t} element${t > 1 ? 's' : ''} shown`,
    total: 'Estimated cost of displayed elements', loading: 'Reading the IFC file…', error: 'The model could not be loaded.',
    original: 'Original colours (IFC)', ifcClass: 'IFC class', code: 'Code', element: 'Element',
    quantities: 'Quantities', identity: 'Identification', none: '—', score: 'Score (1–4)', colon: ': ', ctx: 'GIS context — active layers', north: 'N',
  },
};
const PROP_LABEL = {
  Famille: ['Famille', 'Asset family'], Materiau: ['Matériau', 'Material'],
  AnneeMiseEnService: ['Mise en service', 'In service since'], DateDerniereInspection: ['Dernière inspection', 'Last inspection'],
  Etat: ['État', 'Condition'], NoteEtat: ['Note d’état (1 bon → 4 critique)', 'Condition score (1 good → 4 critical)'],
  Desordre: ['Désordre constaté', 'Observed defect'], PrioriteEntretien: ['Priorité d’entretien', 'Maintenance priority'],
  CoutEstime: ['Coût estimé', 'Estimated cost'], ActionRecommandee: ['Action recommandée', 'Recommended action'],
  Volume: ['Volume (m³)', 'Volume (m³)'], Longueur: ['Longueur (m)', 'Length (m)'],
};
const VALUE_EN = {
  Bon: 'Good', Moyen: 'Fair', 'Dégradé': 'Poor', Critique: 'Critical', Hydraulique: 'Hydraulics', Enveloppe: 'Building envelope',
  Couverture: 'Roofing', 'Équipement': 'Equipment', 'Maçonnerie de parpaings': 'Concrete block masonry', 'Tôle bac acier': 'Steel roofing sheet',
  'Équipement électromécanique': 'Electromechanical equipment', Structure: 'Structure', 'Protection hydraulique': 'Scour protection',
  'Chaussée': 'Pavement', 'Équipement de sécurité': 'Safety equipment', 'Béton armé': 'Reinforced concrete',
  Enrochement: 'Riprap', 'Enrobé bitumineux': 'Asphalt', 'Acier galvanisé': 'Galvanised steel', 'Grave latéritique': 'Lateritic gravel',
  P1: 'P1 — urgent', P2: 'P2 — planned', P3: 'P3 — routine',
  'Assainissement routier': 'Road drainage', 'Terre naturelle compactée': 'Compacted natural earth', 'Terre et maçonnerie': 'Earth and masonry',
  'Acier ondulé galvanisé': 'Galvanised corrugated steel', 'Élastomère fretté': 'Laminated elastomer',
};
const VALUE_FR = { P1: 'P1 — urgent', P2: 'P2 — programmé', P3: 'P3 — courant' };

/* ------------------------------------------------------------------ colour schemes */
const PALETTE = ['#00C2CB', '#0D2B5C', '#E07A3F', '#7A5CC2', '#4CA64C', '#C24C7A', '#8A9BB0'];
const FIXED = {
  Etat: { Bon: '#2E9E6B', Moyen: '#E0A100', 'Dégradé': '#E07A3F', Critique: '#D64545' },
  PrioriteEntretien: { P1: '#D64545', P2: '#E0A100', P3: '#2E9E6B' },
  NoteEtat: { 1: '#2E9E6B', 2: '#E0A100', 3: '#E07A3F', 4: '#D64545' },
};
const ORDER = {
  Etat: ['Critique', 'Dégradé', 'Moyen', 'Bon'], PrioriteEntretien: ['P1', 'P2', 'P3'], NoteEtat: [4, 3, 2, 1],
};
const COLOR_PARAMS = ['Etat', 'PrioriteEntretien', 'NoteEtat', 'Famille', 'Materiau', 'AnneeMiseEnService', 'ifcClass', 'original'];
const FILTER_PARAMS = ['Famille', 'Etat', 'PrioriteEntretien', 'Materiau', 'AnneeMiseEnService', 'ifcClass'];
const TABLE_COLS = [
  ['code', 'Code'], ['name', 'element'], ['Etat', 'Etat'], ['NoteEtat', 'NoteEtat'],
  ['PrioriteEntretien', 'PrioriteEntretien'], ['CoutEstime', 'CoutEstime'],
];

/* ------------------------------------------------------------------ helpers */
const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr');
const t = (k) => T[lang()][k];
let CUR = 'FCFA';
const pl = (k) => (k === 'CoutEstime' ? `${PROP_LABEL[k][lang() === 'en' ? 1 : 0]} (${CUR})` : PROP_LABEL[k] ? PROP_LABEL[k][lang() === 'en' ? 1 : 0] : k === 'ifcClass' ? t('ifcClass') : k === 'original' ? t('original') : k);
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
let apiPromise = null;
function getApi(wasmPath) {
  if (!apiPromise) {
    apiPromise = (async () => { const a = new IfcAPI(); a.SetWasmPath(wasmPath, true); await a.Init(); return a; })();
  }
  return apiPromise;
}

export async function mount(root, { ifcUrl, wasmPath, context, onSelect, extraProps }) {
  root.innerHTML = '';
  root.classList.add('bv-ready');
  const status = h('p', { class: 'bv-status mono' }, esc(t('loading')));
  root.append(status);

  /* --- read IFC */
  const api = await getApi(wasmPath);
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
    for (const cur of ['FCFA', 'GNF', 'EUR']) {
      if (rec.props[`CoutEstime${cur}`] != null) { rec.props.CoutEstime = rec.props[`CoutEstime${cur}`]; delete rec.props[`CoutEstime${cur}`]; CUR = cur; }
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

  /* --- GIS context in the 3D scene (layers that were active on the map) */
  const ctxGroup = new THREE.Group();
  scene.add(ctxGroup);
  const R = Math.max(size.x, size.z) * 0.95;
  function sprite(text, color = '#0D2B5C', scale = 1) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const fs = 44;
    g.font = `600 ${fs}px Inter, system-ui, sans-serif`;
    const w = Math.ceil(g.measureText(text).width) + 36;
    c.width = w; c.height = fs + 30;
    g.font = `600 ${fs}px Inter, system-ui, sans-serif`;
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(0, 0, w, c.height);
    g.fillStyle = color; g.fillRect(0, 0, 8, c.height);
    g.fillStyle = '#1E2430'; g.textBaseline = 'middle'; g.fillText(text, 20, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
    const narrow = ui.canvasWrap.clientWidth < 600;
    const k = 0.045 * scale * (narrow ? 0.85 : 1);
    sp.scale.set(k * w / c.height, k, 1);
    sp.renderOrder = 10;
    return sp;
  }
  function buildContext() {
    ctxGroup.children.slice().forEach((o) => { ctxGroup.remove(o); o.traverse?.((x) => { x.geometry?.dispose(); x.material?.map?.dispose(); x.material?.dispose(); }); });
    const c = context && context();
    if (!c) { grid.visible = true; return; }
    const sc = c.scene || {};
    grid.visible = !sc.ground;
    const cx = center.x, cz = center.z;
    if (sc.ground) {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 64),
        new THREE.MeshBasicMaterial({ color: sc.ground.color, transparent: true, opacity: sc.flood ? 0.25 : 0.45, depthWrite: false, side: THREE.DoubleSide }));
      disc.rotation.x = -Math.PI / 2; disc.position.set(cx, -0.02, cz);
      ctxGroup.add(disc);
      const lab = sprite(sc.ground.label, sc.ground.color);
      lab.position.set(cx + R * 0.25, 0.3, cz + R * 0.35);
      ctxGroup.add(lab);
    }
    if (sc.soil) {
      const block = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 3, 64, 1, true),
        new THREE.MeshBasicMaterial({ color: sc.soil.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      block.position.set(cx, -1.55, cz);
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(R, 64),
        new THREE.MeshBasicMaterial({ color: sc.soil.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
      bottom.rotation.x = -Math.PI / 2; bottom.position.set(cx, -3.05, cz);
      ctxGroup.add(block, bottom);
    }
    if (sc.flood) {
      const water = new THREE.Mesh(new THREE.CircleGeometry(R * 0.98, 64),
        new THREE.MeshBasicMaterial({ color: 0x2f7fc1, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      water.rotation.x = -Math.PI / 2; water.position.set(cx, sc.flood.depth, cz);
      water.renderOrder = 2;
      ctxGroup.add(water);
      const lab = sprite(sc.flood.label, '#2F7FC1');
      lab.position.set(cx - R * 0.7, sc.flood.depth + 0.4, cz - R * 0.5);
      ctxGroup.add(lab);
    }
    if (sc.traffic) {
      const lab = sprite(sc.traffic.label, '#234A7A', 1.0);
      lab.position.set(cx, box.max.y + R * 0.16, cz);
      ctxGroup.add(lab);
    }
    if (sc.impact) {
      const lab = sprite(sc.impact.label, sc.impact.color, 1.1);
      lab.position.set(cx, box.max.y + R * (sc.traffic ? 0.34 : 0.18), cz);
      ctxGroup.add(lab);
    }
    for (const f of sc.facilities || []) {
      const r = R * (0.55 + 0.4 * Math.min(f.dist, 500) / 500);
      const th = (f.bearing * Math.PI) / 180;
      const x = cx + r * Math.sin(th), z = cz - r * Math.cos(th);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.008, R * 0.008, R * 0.12, 8), new THREE.MeshBasicMaterial({ color: f.color }));
      pin.position.set(x, R * 0.06, z);
      const head = new THREE.Mesh(new THREE.SphereGeometry(R * 0.022, 16, 12), new THREE.MeshBasicMaterial({ color: f.color }));
      head.position.set(x, R * 0.12, z);
      const lab = sprite(f.label, f.color, 0.8);
      lab.position.set(x, R * 0.19, z);
      ctxGroup.add(pin, head, lab);
    }
    if (sc.ground || sc.soil || sc.flood || (sc.facilities && sc.facilities.length)) {
      const n = sprite(t('north'), '#0D2B5C', 0.8);
      n.position.set(cx, 0.2, cz - R * 1.05);
      ctxGroup.add(n);
    }
  }
  function renderCtxPanel(first) {
    const c = context && context();
    if (!c) return;
    ui.ctx.hidden = false;
    if (first) {
      ui.ctx.innerHTML = `<h4 class="bv-h" data-c="h"></h4><div class="bv-mini" data-c="mini"></div><table class="bv-kv" data-c="kv"></table>`;
      if (c.mini) c.mini(ui.ctx.querySelector('[data-c=mini]'));
    }
    ui.ctx.querySelector('[data-c=h]').textContent = t('ctx');
    ui.ctx.querySelector('[data-c=kv]').innerHTML = c.items.map((it) =>
      `<tr><th>${esc(it.label)}</th><td>${it.color ? `<span class="bv-badge" style="--c:${it.color}">${esc(it.value)}</span>` : esc(it.value)}</td></tr>`).join('');
  }
  buildContext();
  renderCtxPanel(true);

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
    const hasCtx = ctxGroup.children.length > 0 && meshesRoot.children.every((m) => m.visible);
    const r = Math.max(b.getSize(new THREE.Vector3()).length(), 4, hasCtx ? R * 1.9 : 0) * 0.68;
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
  const ro = new ResizeObserver(resize);
  ro.observe(ui.canvasWrap);
  resize();
  fitView();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  /* --- state */
  const state = { color: 'Etat', fparam: '', fval: '', hiddenCats: new Set(), isolate: null, selected: null, queryIds: null, hl: null,
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
    if (state.queryIds && !state.queryIds.has(rec.id)) return false;
    if (state.fparam && state.fval !== '' && String(valOf(rec, state.fparam)) !== state.fval) return false;
    if (state.color !== 'original' && state.hiddenCats.has(String(valOf(rec, state.color)))) return false;
    return true;
  };

  /* --- rendering of state */
  function apply() {
    for (const rec of all) {
      const vis = isVisible(rec);
      const col = state.color === 'original' ? rec.original : new THREE.Color(colorFor(state.color, valOf(rec, state.color)));
      const sel = rec.id === state.selected || (state.hl !== null && state.hl.has(rec.id));
      const dim = (state.selected !== null || state.hl !== null) && !sel;
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
        ${row(pl('CoutEstime'), p.CoutEstime ? fmt(p.CoutEstime) : esc(T[lang()].none))}
        ${row(pl('Volume'), esc(tv(p.Volume)))}
        ${row(pl('Longueur'), esc(tv(p.Longueur)))}
      </table>
      <p class="bv-muted bv-src mono">Pset_GIN2CO_Patrimoine · Qto_GIN2CO_Quantites</p>${extraProps ? extraProps(rec.code) : ''}`;
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
      return (c || (b.props.CoutEstime || 0) - (a.props.CoutEstime || 0)) * state.sortDir;
    });
    const head = TABLE_COLS.map(([k, lab]) => {
      const label = lab === 'Code' ? t('code') : lab === 'element' ? t('element') : lab === 'NoteEtat' ? t('score') : pl(lab);
      const arrow = state.sortKey === k ? (state.sortDir === 1 ? ' ▲' : ' ▼') : '';
      return `<th${k === 'CoutEstime' || k === 'NoteEtat' ? ' class="num"' : ''}><button type="button" data-sort="${k}">${esc(label)}${arrow}</button></th>`;
    }).join('');
    const body = vis.map((r) => {
      const p = r.props;
      return `<tr data-id="${r.id}" tabindex="0" class="${r.id === state.selected ? 'is-sel' : ''}">
        <td class="mono">${esc(r.code)}</td><td>${esc(r.name)}</td>
        <td><span class="bv-badge" style="--c:${colorFor('Etat', p.Etat)}">${esc(tv(p.Etat))}</span></td>
        <td class="num">${esc(tv(p.NoteEtat))}</td>
        <td><span class="bv-badge" style="--c:${colorFor('PrioriteEntretien', p.PrioriteEntretien)}">${esc(p.PrioriteEntretien)}</span></td>
        <td class="num">${p.CoutEstime ? fmt(p.CoutEstime) : '—'}</td></tr>`;
    }).join('');
    const total = vis.reduce((s, r) => s + (r.props.CoutEstime || 0), 0);
    ui.table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
    ui.total.innerHTML = `<span>${esc(t('shown')(vis.length, all.length))}</span>` +
      `<span>${esc(t('total'))}${t('colon')}<strong class="mono">${fmt(total)} ${CUR}</strong></span>`;
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
    state.isolate = null; state.hiddenCats.clear(); state.fparam = ''; state.fval = ''; state.queryIds = null;
    renderToolbar(); apply(); fitView();
  });
  ui.fitBtn.addEventListener('click', fitView);
  ui.table.addEventListener('click', (e) => {
    const s = e.target.closest('[data-sort]');
    if (s) {
      const k = s.getAttribute('data-sort');
      state.sortDir = state.sortKey === k ? -state.sortDir : (k === 'CoutEstime' || k === 'NoteEtat' ? -1 : 1);
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
  const notify = () => { if (onSelect) onSelect(state.selected === null ? null : elements.get(state.selected)?.code || null); };
  function select(id) {
    state.selected = state.selected === id ? null : id;
    state.hl = null;
    apply(); notify();
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
    state.hl = null;
    apply(); notify();
  });

  const mo = new MutationObserver(() => { renderToolbar(); apply(); buildContext(); renderCtxPanel(false); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

  renderToolbar();
  apply();
  const norm = (x) => String(x ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return {
    elements, state,
    /** Programmatic query used by the request assistant. */
    query(spec = {}) {
      if (spec.reset) {
        state.isolate = null; state.hiddenCats.clear(); state.fparam = ''; state.fval = ''; state.queryIds = null; state.selected = null;
      }
      let res = all.slice();
      const filtering = spec.etats?.length || spec.prios?.length || spec.kws?.length || spec.familles?.length || spec.noteMin;
      if (spec.etats?.length) res = res.filter((r) => spec.etats.includes(r.props.Etat));
      if (spec.prios?.length) res = res.filter((r) => spec.prios.includes(r.props.PrioriteEntretien));
      if (spec.noteMin) res = res.filter((r) => (r.props.NoteEtat || 0) >= spec.noteMin);
      if (spec.familles?.length) res = res.filter((r) => spec.familles.includes(r.props.Famille));
      const exact = spec.phrase ? all.filter((r) => norm(r.name).length > 4 && spec.phrase.includes(norm(r.name).replace(/^.* — /, ''))) : [];
      if (exact.length && spec.kws?.length) res = res.filter((r) => exact.includes(r));
      else if (spec.kws?.length) res = res.filter((r) => spec.kws.some((k) => norm(r.name).includes(k) || norm(r.props.Materiau).includes(k) || norm(r.props.Famille).includes(k)));
      if (filtering) { state.queryIds = new Set(res.map((r) => r.id)); state.isolate = null; }
      if (spec.color) { state.color = spec.color; state.hiddenCats.clear(); }
      if (spec.sort) { state.sortKey = spec.sort.key; state.sortDir = spec.sort.dir; }
      if (spec.isolate && res.length) { state.isolate = res[0].id; state.selected = res[0].id; }
      else if (filtering && res.length === 1) state.selected = res[0].id;
      renderToolbar(); apply(); fitView();
      const shown = filtering ? res : all;
      return {
        currency: CUR, count: shown.length, total: shown.reduce((x, r) => x + (r.props.CoutEstime || 0), 0),
        items: shown.map((r) => ({ name: r.name, code: r.code, etat: r.props.Etat, prio: r.props.PrioriteEntretien, cout: r.props.CoutEstime || 0 })),
      };
    },
    /** Highlights the elements whose tag is in codes (null clears); returns how many were found. */
    highlight(codes) {
      const set = codes ? new Set(codes) : null;
      const ids = set ? all.filter((r) => set.has(r.code)).map((r) => r.id) : [];
      state.hl = ids.length ? new Set(ids) : null;
      state.selected = ids.length === 1 ? ids[0] : null; state.isolate = null; state.queryIds = null;
      apply();
      return ids.length;
    },
    /** Selects the element with this tag. */
    selectCode(code) { const r = all.find((x) => x.code === code); if (r) { state.hl = null; state.selected = r.id; apply(); } return !!r; },
    refreshProps() { renderProps(); },
    destroy() {
      mo.disconnect();
      ro.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      renderer.dispose();
      renderer.forceContextLoss();
      root.innerHTML = '';
    },
  };
}

function prettyClass(name) {
  const map = { IFCWALL: 'IfcWall', IFCSLAB: 'IfcSlab', IFCRAILING: 'IfcRailing', IFCBUILDINGELEMENTPROXY: 'IfcBuildingElementProxy',
    IFCCOLUMN: 'IfcColumn', IFCBEAM: 'IfcBeam', IFCFOOTING: 'IfcFooting', IFCPIPESEGMENT: 'IfcPipeSegment', IFCPUMP: 'IfcPump',
    IFCDISTRIBUTIONCHAMBERELEMENT: 'IfcDistributionChamberElement' };
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
      <aside class="bv-side"><div data-r="ctx" class="bv-ctx" hidden></div><div data-r="legend" class="bv-legend"></div><div data-r="props" class="bv-props"></div></aside>
    </div>
    <div class="bv-table-wrap"><table class="bv-table" data-r="table"></table></div>
    <p class="bv-total" data-r="total"></p>`;
  root.append(wrap);
  const ui = {};
  wrap.querySelectorAll('[data-r]').forEach((el) => { ui[el.getAttribute('data-r')] = el; });
  return ui;
}
