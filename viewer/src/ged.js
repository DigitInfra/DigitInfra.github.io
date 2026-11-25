// GIN²CO — common document management (GED / environnement commun de données), demonstration.
// Metadata in the shared demo store; uploaded files kept in this browser (IndexedDB).
import { kpis } from './charts.js';
import { STEPS } from './projects.js';

const L = (fr, en) => ({ fr, en });
const ST = { wip: '#8A9BB0', shared: '#3B5FC0', published: '#2E9E6B', archived: '#6B7280' };
const TYPES = { RAP: L('Rapport', 'Report'), NDC: L('Note de calcul', 'Design calculation'), PLN: L('Plan', 'Drawing'), M3D: L('Maquette IFC', 'IFC model'), PV: L('Procès-verbal', 'Certificate'), DAO: L('Dossier d’appel d’offres', 'Tender documents'), MAR: L('Marché', 'Contract'), PHO: L('Photo', 'Photo'), AUT: L('Autre', 'Other') };
const S = {
  fr: {
    intro: 'Espace documentaire commun : chaque document est rattaché à un projet ou à un ouvrage et à une étape, versionné, et suit un circuit de statuts inspiré de l’ISO 19650 (en cours → partagé → publié → archivé).',
    demo: 'Les documents préchargés sont fictifs. Les fichiers que vous déposez restent dans ce navigateur.',
    kDocs: 'Documents', kWip: 'En cours', kShared: 'Partagés', kPub: 'Publiés', kVer: 'Versions',
    all: 'Tous les documents', noLink: 'Patrimoine (hors projet)', search: 'Rechercher (code, titre)', anyType: 'Tous types', anyStatus: 'Tous statuts',
    code: 'Code', title: 'Titre', type: 'Type', phase: 'Étape', ver: 'Indice', status: 'Statut', date: 'Date', author: 'Auteur', open: 'Ouvrir', view3d: 'Voir en 3D',
    st: { wip: 'En cours', shared: 'Partagé', published: 'Publié', archived: 'Archivé' },
    to: { shared: 'Partager', published: 'Publier', archived: 'Archiver', wip: 'Repasser en cours' },
    upload: '+ Déposer un document', newVer: 'Déposer une nouvelle version', file: 'Fichier', link: 'Rattachement', note: 'Commentaire de version',
    save: 'Déposer', cancel: 'Annuler', errFile: 'Choisissez un fichier.', errTitle: 'Donnez un titre.', versions: 'Historique des versions',
    noRight: 'Votre rôle permet de consulter les documents, pas d’en déposer.', none: 'Aucun document pour ce filtre.', fictive: 'Document fictif de démonstration',
    logUp: (c) => `Document déposé : ${c}`, logVer: (c, v) => `Nouvelle version ${v} : ${c}`, logSt: (c, s1) => `${c} → ${s1}`, close: 'Fermer', space: 'Espace du projet', size: 'Taille', noPhase: '—',
  },
  en: {
    intro: 'Shared document space: each document is attached to a project or an asset and to a step, versioned, and follows a status workflow inspired by ISO 19650 (work in progress → shared → published → archived).',
    demo: 'Preloaded documents are fictitious. Files you upload stay in this browser.',
    kDocs: 'Documents', kWip: 'Work in progress', kShared: 'Shared', kPub: 'Published', kVer: 'Versions',
    all: 'All documents', noLink: 'Assets (no project)', search: 'Search (code, title)', anyType: 'All types', anyStatus: 'All statuses',
    code: 'Code', title: 'Title', type: 'Type', phase: 'Step', ver: 'Revision', status: 'Status', date: 'Date', author: 'Author', open: 'Open', view3d: 'View in 3D',
    st: { wip: 'Work in progress', shared: 'Shared', published: 'Published', archived: 'Archived' },
    to: { shared: 'Share', published: 'Publish', archived: 'Archive', wip: 'Back to work in progress' },
    upload: '+ Upload a document', newVer: 'Upload a new version', file: 'File', link: 'Attached to', note: 'Version note',
    save: 'Upload', cancel: 'Cancel', errFile: 'Choose a file.', errTitle: 'Give a title.', versions: 'Version history',
    noRight: 'Your role lets you view documents, not upload them.', none: 'No document for this filter.', fictive: 'Fictitious demonstration document',
    logUp: (c) => `Document uploaded: ${c}`, logVer: (c, v) => `New version ${v}: ${c}`, logSt: (c, s1) => `${c} → ${s1}`, close: 'Close', space: 'Project space', size: 'Size', noPhase: '—',
  },
};
const NEXT = { wip: ['shared'], shared: ['published', 'wip'], published: ['archived'], archived: [] };

/* --- IndexedDB for uploaded files */
const idb = (() => {
  let dbp = null;
  const db = () => (dbp ||= new Promise((res, rej) => { const r = indexedDB.open('gin2co-ged', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = (mode, fn) => db().then((d) => new Promise((res, rej) => { const t = d.transaction('files', mode); const q = fn(t.objectStore('files')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  return { put: (k, v) => tx('readwrite', (s) => s.put(v, k)), get: (k) => tx('readonly', (s) => s.get(k)), clear: () => tx('readwrite', (s) => s.clear()) };
})();

function seed(modelsBase) {
  const d = (id, code, title, type, link, phase, status, versions) => ({ id, code, title, type, link, phase, status, versions });
  const v = (ver, date, author, note, file = { kind: 'demo' }) => ({ ver, date, author, note, file });
  return [
    d('D1', 'GIN-P1-RAP-001', L('Rapport d’inspection détaillée du pont OA-01', 'Detailed inspection report, bridge OA-01'), 'RAP', 'P1', 'faisa', 'published', [v('V1', '2025-03-12', 'Ibrahima Sow', 'Inspection initiale')]),
    d('D2', 'GIN-P1-RAP-002', L('Étude de faisabilité de la réhabilitation', 'Rehabilitation feasibility study'), 'RAP', 'P1', 'faisa', 'published', [v('V1', '2025-05-20', 'DigitInfra', 'Comparaison réparer / renforcer / remplacer')]),
    d('D3', 'GIN-P1-RAP-003', L('Note d’avant-projet sommaire', 'Outline design report'), 'RAP', 'P1', 'aps', 'published', [v('V1', '2025-08-04', 'Bureau de contrôle (fictif)', '')]),
    d('D4', 'GIN-P1-NDC-001', L('Note de calcul — renforcement des poutres de la travée 2', 'Design calculation — strengthening of span 2 girders'), 'NDC', 'P1', 'apd', 'published', [v('V1', '2025-10-02', 'Bureau de contrôle (fictif)', ''), v('V2', '2025-11-18', 'Bureau de contrôle (fictif)', 'Prise en compte des remarques du contrôle')]),
    d('D5', 'GIN-P1-M3D-001', L('Maquette numérique du pont OA-01', 'Digital model of bridge OA-01'), 'M3D', 'P1', 'travaux', 'shared', [
      v('V1', '2025-03-15', 'DigitInfra', 'État existant au diagnostic', { kind: 'url', url: `${modelsBase}OA-01.ifc`, name: 'OA-01.ifc' }),
      v('V2', '2026-11-15', 'Entreprise de travaux (fictive)', 'Travaux en cours : 9 éléments réparés sur 15, réception en attente', { kind: 'url', url: `${modelsBase}versions/OA-01_v2.ifc`, name: 'OA-01_v2.ifc' })]),
    d('D6', 'GIN-P1-DAO-001', L('Dossier d’appel d’offres — travaux de réhabilitation', 'Tender documents — rehabilitation works'), 'DAO', 'P1', 'dao', 'published', [v('V1', '2026-01-10', 'Fatoumata Camara', '')]),
    d('D7', 'GIN-P1-MAR-001', L('Marché de travaux signé', 'Signed works contract'), 'MAR', 'P1', 'dao', 'published', [v('V1', '2026-04-28', 'Fatoumata Camara', '')]),
    d('D8', 'GIN-P1-RAP-004', L('Plan d’assurance qualité de l’entreprise', 'Contractor quality assurance plan'), 'RAP', 'P1', 'travaux', 'published', [v('V1', '2026-05-12', 'Entreprise de travaux (fictive)', '')]),
    d('D9', 'GIN-P1-PV-001', L('Procès-verbaux d’essais sur béton', 'Concrete test reports'), 'PV', 'P1', 'travaux', 'shared', [v('V1', '2026-09-30', 'Bureau de contrôle (fictif)', 'Éprouvettes à 28 jours conformes')]),
    d('D10', 'GIN-P1-PHO-001', L('Photos — calage des appareils d’appui côté aval', 'Photos — downstream bearing levelling'), 'PHO', 'P1', 'travaux', 'shared', [v('V1', '2026-11-10', 'Bureau de contrôle (fictif)', 'Réserve inscrite')]),
    d('D11', 'GIN-P1-RAP-005', L('Journal de chantier — novembre 2026', 'Site diary — November 2026'), 'RAP', 'P1', 'travaux', 'wip', [v('V1', '2026-11-20', 'Entreprise de travaux (fictive)', '')]),
    d('D12', 'GIN-P2-RAP-001', L('Note APS — remplacement des buses par des dalots', 'Outline design — replacing culverts with box culverts'), 'RAP', 'P2', 'aps', 'published', [v('V1', '2026-07-01', 'Bureau de contrôle (fictif)', '')]),
    d('D13', 'GIN-P2-M3D-001', L('Maquette APD des dalots OA-02 et OA-04', 'Detailed design model, box culverts OA-02 and OA-04'), 'M3D', 'P2', 'apd', 'wip', [v('V1', '2026-11-05', 'DigitInfra', 'Propriétés incomplètes sur 6 éléments')]),
    d('D14', 'GIN-P3-DAO-001', L('Dossier d’appel d’offres — section RN-03', 'Tender documents — section RN-03'), 'DAO', 'P3', 'dao', 'shared', [v('V1', '2026-10-15', 'Fatoumata Camara', 'Pour avis de non-objection du bailleur')]),
    d('D15', 'GIN-P4-RAP-001', L('Fiche d’identification de la piste PR-07', 'Identification sheet, track PR-07'), 'RAP', 'P4', 'faisa', 'published', [v('V1', '2026-09-20', 'Ibrahima Sow', '')]),
  ];
}

export function createGedBoard(el, ctx) {
  const { lang, esc, store, tv } = ctx;
  const s = (k) => S[lang()][k];
  const nm = (o) => (o ? o[lang()] : '');
  let folder = 'all', q = '', fType = '', fStatus = '', sel = null, form = null;
  const docs = () => { if (!store.state.docs) store.state.docs = seed(ctx.modelsBase); return store.state.docs; };
  const last = (d) => d.versions.at(-1);
  const phaseName = (k) => { const st = STEPS.find((x) => x.k === k); return st ? nm(st.n) : s('noPhase'); };
  const linkName = (l) => { const p = ctx.projects().find((x) => x.id === l); if (p) return `${p.id} — ${nm(p.name)}`; const a = ctx.assets().find((x) => x.code === l); return a ? `${a.code} — ${tv(a.type)}` : s('noLink'); };
  const can = (r) => store.can(r);
  const badge = (st) => `<span class="bv-badge" style="--c:${ST[st]}">${esc(s('st')[st])}</span>`;

  async function urlOf(d, vv) {
    const f = vv.file;
    if (f.kind === 'url') return f.url;
    if (f.kind === 'idb') { const blob = await idb.get(f.key); return blob ? URL.createObjectURL(blob) : null; }
    const html = `<!doctype html><meta charset="utf-8"><title>${esc(d.code)}</title><body style="font-family:system-ui;max-width:720px;margin:40px auto;color:#1E2430">
      <p style="color:#8A6100;background:#FFF6DB;padding:8px 12px">${esc(s('fictive'))}</p><h1 style="color:#0D2B5C">${esc(nm(d.title))}</h1>
      <p><b>${esc(s('code'))}</b> ${esc(d.code)} · <b>${esc(s('ver'))}</b> ${esc(vv.ver)} · <b>${esc(s('date'))}</b> ${esc(vv.date)}</p>
      <p><b>${esc(s('link'))}</b> ${esc(linkName(d.link))} · <b>${esc(s('phase'))}</b> ${esc(phaseName(d.phase))}</p><p>${esc(vv.note || '')}</p></body>`;
    return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  }
  async function openVersion(d, vv) {
    const isIfc = d.type === 'M3D' && vv.file.kind !== 'demo';
    const u = await urlOf(d, vv);
    if (!u) return;
    if (isIfc && ctx.open3d) { ctx.open3d(d, vv, u); return; }
    window.open(u, '_blank', 'noopener');
  }

  function tree() {
    const P = ctx.projects();
    const n = (f) => docs().filter(f).length;
    return `<nav class="gd-tree" aria-label="GED"><button type="button" data-folder="all" class="${folder === 'all' ? 'is-on' : ''}">${esc(s('all'))} <span>${docs().length}</span></button>
      ${P.map((p) => `<button type="button" data-folder="${p.id}" class="${folder === p.id && !phaseF ? 'is-on' : ''}"><b>${esc(p.id)}</b> ${esc(nm(p.name))} <span>${n((d) => d.link === p.id)}</span></button>
        ${folder === p.id ? STEPS.map((st) => { const c = n((d) => d.link === p.id && d.phase === st.k); return c ? `<button type="button" class="gd-sub${phaseF === st.k ? ' is-on' : ''}" data-folder="${p.id}" data-phase="${st.k}">${esc(nm(st.n))} <span>${c}</span></button>` : ''; }).join('') : ''}`).join('')}
      <button type="button" data-folder="assets" class="${folder === 'assets' ? 'is-on' : ''}">${esc(s('noLink'))} <span>${n((d) => !P.some((p) => p.id === d.link))}</span></button></nav>`;
  }
  let phaseF = '';
  function list() {
    const P = ctx.projects();
    const xs = docs().filter((d) => (folder === 'all' || (folder === 'assets' ? !P.some((p) => p.id === d.link) : d.link === folder))
      && (!phaseF || d.phase === phaseF) && (!fType || d.type === fType) && (!fStatus || d.status === fStatus)
      && (!q || `${d.code} ${nm(d.title)}`.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => (last(a).date < last(b).date ? 1 : -1));
    if (!xs.length) return `<p class="bv-muted">${esc(s('none'))}</p>`;
    return `<div class="bv-table-wrap sd-wrap"><table class="bv-table pf-table gd-table"><thead><tr><th>${esc(s('code'))}</th><th>${esc(s('title'))}</th><th>${esc(s('type'))}</th><th>${esc(s('phase'))}</th><th>${esc(s('ver'))}</th><th>${esc(s('status'))}</th><th>${esc(s('date'))}</th><th></th></tr></thead><tbody>
      ${xs.map((d) => `<tr class="${sel === d.id ? 'pl-cur' : ''}" data-doc="${d.id}" tabindex="0"><td class="mono">${esc(d.code)}</td><td class="pf-wrap">${esc(nm(d.title))}</td><td>${esc(nm(TYPES[d.type]))}</td>
        <td>${esc(phaseName(d.phase))}</td><td class="mono">${esc(last(d).ver)}</td><td>${badge(d.status)}</td><td class="mono">${esc(last(d).date)}</td>
        <td><button type="button" class="sg-link" data-openv="${d.id}">${esc(d.type === 'M3D' && last(d).file.kind !== 'demo' ? s('view3d') : s('open'))}</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  function detail() {
    const d = docs().find((x) => x.id === sel);
    if (!d) return '';
    const canUp = can('uploadDoc'), canPub = can('publishDoc');
    const moves = NEXT[d.status].filter((n) => (n === 'published' || n === 'archived' ? canPub : canUp));
    return `<aside class="gd-detail" aria-label="${esc(d.code)}"><div class="sg-row"><h4 class="bv-h">${esc(nm(d.title))}</h4><button type="button" class="sg-link" data-a="close">${esc(s('close'))}</button></div>
      <table class="bv-kv"><tr><th>${esc(s('code'))}</th><td class="mono">${esc(d.code)}</td></tr><tr><th>${esc(s('type'))}</th><td>${esc(nm(TYPES[d.type]))}</td></tr>
        <tr><th>${esc(s('link'))}</th><td>${esc(linkName(d.link))}</td></tr><tr><th>${esc(s('phase'))}</th><td>${esc(phaseName(d.phase))}</td></tr><tr><th>${esc(s('status'))}</th><td>${badge(d.status)}</td></tr></table>
      ${moves.length ? `<p class="gd-moves">${moves.map((m) => `<button type="button" class="bv-btn" data-move="${m}">${esc(s('to')[m] || s('st')[m])}</button>`).join(' ')}</p>` : ''}
      ${ctx.projects().some((p) => p.id === d.link) && ctx.openProject ? `<p><button type="button" class="sg-link" data-a="space">${esc(s('space'))} ${esc(d.link)} →</button></p>` : ''}
      <h5 class="pl-h5">${esc(s('versions'))}</h5>
      <ol class="gd-vers">${d.versions.slice().reverse().map((vv, i) => `<li><span class="mono">${esc(vv.ver)}</span> · ${esc(vv.date)} · ${esc(vv.author)}${vv.note ? `<br><small>${esc(vv.note)}</small>` : ''}
        <button type="button" class="sg-link" data-ov="${d.versions.length - 1 - i}">${esc(d.type === 'M3D' && vv.file.kind !== 'demo' ? s('view3d') : s('open'))}</button></li>`).join('')}</ol>
      ${canUp && d.status !== 'archived' ? `<div class="gd-up"><label class="sd-f"><span class="bv-l">${esc(s('newVer'))}</span><input type="file" data-nv></label>
        <label class="sd-f"><span class="bv-l">${esc(s('note'))}</span><input type="text" data-nvnote maxlength="160"></label></div>` : ''}</aside>`;
  }
  function uploadForm() {
    if (!form) return '';
    const P = ctx.projects();
    return `<section class="pl-form"><h4 class="bv-h">${esc(s('upload').replace('+ ', ''))}</h4><div class="pl-fields">
      <label class="sd-f"><span class="bv-l">${esc(s('file'))}</span><input type="file" data-uf="file"></label>
      <label class="sd-f"><span class="bv-l">${esc(s('title'))}</span><input type="text" data-uf="title" maxlength="140"></label>
      <label class="sd-f"><span class="bv-l">${esc(s('type'))}</span><select data-uf="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${esc(nm(v))}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('link'))}</span><select data-uf="link">${P.map((p) => `<option value="${p.id}"${folder === p.id ? ' selected' : ''}>${esc(`${p.id} — ${nm(p.name)}`)}</option>`).join('')}
        ${ctx.assets().map((a) => `<option value="${esc(a.code)}">${esc(`${a.code} — ${tv(a.type)}`)}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('phase'))}</span><select data-uf="phase">${STEPS.map((st) => `<option value="${st.k}">${esc(nm(st.n))}</option>`).join('')}</select></label>
      <p class="pl-err" data-uerr role="alert"></p>
      <div class="sd-actions"><button type="button" class="sg-link" data-a="ucancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-a="usave">${esc(s('save'))}</button></div></div></section>`;
  }
  function render() {
    const D = docs();
    el.innerHTML = `<p class="sd-intro">${esc(s('intro'))}</p><p class="gd-demo">${esc(s('demo'))}</p>
      ${kpis([{ v: String(D.length), l: s('kDocs') }, { v: String(D.filter((d) => d.status === 'wip').length), l: s('kWip'), tone: 'warn' }, { v: String(D.filter((d) => d.status === 'shared').length), l: s('kShared') }, { v: String(D.filter((d) => d.status === 'published').length), l: s('kPub'), tone: 'ok' }, { v: String(D.reduce((a, d) => a + d.versions.length, 0)), l: s('kVer') }])}
      <div class="pl-bar">${can('uploadDoc') ? `<button type="button" class="btn btn-primary" data-a="up">${esc(s('upload'))}</button>` : `<p class="bv-muted">${esc(s('noRight'))}</p>`}
        <input type="search" class="gd-q" data-f="q" value="${esc(q)}" placeholder="${esc(s('search'))}" aria-label="${esc(s('search'))}">
        <select data-f="type" aria-label="${esc(s('type'))}"><option value="">${esc(s('anyType'))}</option>${Object.entries(TYPES).map(([k, v]) => `<option value="${k}"${fType === k ? ' selected' : ''}>${esc(nm(v))}</option>`).join('')}</select>
        <select data-f="status" aria-label="${esc(s('status'))}"><option value="">${esc(s('anyStatus'))}</option>${Object.keys(ST).map((k) => `<option value="${k}"${fStatus === k ? ' selected' : ''}>${esc(s('st')[k])}</option>`).join('')}</select></div>
      ${uploadForm()}
      <div class="gd-grid${sel ? ' has-detail' : ''}">${tree()}<div class="gd-list">${list()}</div>${detail()}</div>`;
  }
  const commit = () => store.commit('ged');
  const nextCode = (link, type) => { const n = docs().filter((d) => d.link === link && d.type === type).length + 1; return `GIN-${link}-${type}-${String(n).padStart(3, '0')}`; };
  async function addDoc({ file, title, type, link, phase }) {
    if (/\.ifc$/i.test(file.name)) type = 'M3D';
    const code = nextCode(link, type);
    const fileRef = await storeFile(file);
    const d = { id: `D${Date.now()}`, code, title: { fr: title, en: title }, type, link, phase, status: 'wip', versions: [{ ver: 'V1', date: new Date().toISOString().slice(0, 10), author: store.me().name, note: '', file: fileRef }] };
    docs().push(d);
    store.activity(link, s('logUp')(code), 'ged'); commit();
    return d;
  }
  async function addVersion(d, file, note = '') {
    const ver = `V${d.versions.length + 1}`;
    const v = { ver, date: new Date().toISOString().slice(0, 10), author: store.me().name, note, file: await storeFile(file) };
    d.versions.push(v);
    if (d.status === 'published') d.status = 'shared';
    store.activity(d.link, s('logVer')(d.code, ver), 'ged'); commit();
    return v;
  }
  async function storeFile(file) { const key = `f${Date.now()}${Math.random().toString(36).slice(2, 6)}`; await idb.put(key, file); return { kind: 'idb', key, name: file.name, size: file.size }; }

  el.addEventListener('click', async (e) => {
    const f = e.target.closest('[data-folder]');
    if (f) { folder = f.dataset.folder; phaseF = f.dataset.phase || ''; render(); return; }
    const ov = e.target.closest('[data-openv]'); if (ov) { const d = docs().find((x) => x.id === ov.dataset.openv); openVersion(d, last(d)); return; }
    const ovv = e.target.closest('[data-ov]'); if (ovv) { const d = docs().find((x) => x.id === sel); openVersion(d, d.versions[Number(ovv.dataset.ov)]); return; }
    const mv = e.target.closest('[data-move]');
    if (mv) { const d = docs().find((x) => x.id === sel); d.status = mv.dataset.move; store.activity(d.link, s('logSt')(d.code, s('st')[d.status]), 'ged'); commit(); return; }
    const row = e.target.closest('tr[data-doc]'); if (row) { sel = row.dataset.doc; render(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'close') { sel = null; render(); }
    else if (a.dataset.a === 'space') { const d = docs().find((x) => x.id === sel); ctx.openProject(d.link); }
    else if (a.dataset.a === 'up') { form = {}; render(); }
    else if (a.dataset.a === 'ucancel') { form = null; render(); }
    else if (a.dataset.a === 'usave') {
      const g = (k) => el.querySelector(`[data-uf="${k}"]`);
      const file = g('file').files[0], title = g('title').value.trim() || (file ? file.name : '');
      if (!file) { el.querySelector('[data-uerr]').textContent = s('errFile'); return; }
      form = null;
      await addDoc({ file, title, type: g('type').value, link: g('link').value, phase: g('phase').value });
    }
  });
  el.addEventListener('keydown', (e) => { const row = e.target.closest('tr[data-doc]'); if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = row.dataset.doc; render(); } });
  el.addEventListener('input', (e) => { if (e.target.dataset.f === 'q') { q = e.target.value; const l = el.querySelector('.gd-list'); if (l) l.innerHTML = list(); } });
  el.addEventListener('change', async (e) => {
    if (e.target.dataset.f === 'type') { fType = e.target.value; render(); return; }
    if (e.target.dataset.f === 'status') { fStatus = e.target.value; render(); return; }
    if (e.target.hasAttribute('data-nv') && e.target.files[0]) {
      const d = docs().find((x) => x.id === sel);
      await addVersion(d, e.target.files[0], el.querySelector('[data-nvnote]').value.trim());
    }
  });
  return {
    render, ensure: docs, label: (st) => s('st')[st], typeName: (t) => nm(TYPES[t]),
    docsFor: (link) => docs().filter((d) => d.link === link).sort((a, b) => (last(a).date < last(b).date ? 1 : -1)),
    models: (link) => docs().filter((d) => d.link === link && d.type === 'M3D').flatMap((d) => d.versions.filter((x) => x.file.kind !== 'demo').map((x) => ({ d, v: x }))),
    openDoc(id) { const d = docs().find((x) => x.id === id); if (d) { sel = id; folder = ctx.projects().some((p) => p.id === d.link) ? d.link : 'assets'; phaseF = ''; render(); } },
    openFolder(id) { folder = id; phaseF = ''; sel = null; render(); },
    openVersion, urlOf, addDoc, clearFiles: () => idb.clear(),
    types: () => Object.entries(TYPES).map(([k, v]) => [k, nm(v)]),
    async addModelVersion(link, file, phase) {
      let d = docs().find((x) => x.link === link && x.type === 'M3D' && x.status !== 'archived');
      if (!d) { d = await addDoc({ file, title: file.name, type: 'M3D', link, phase }); return { d, v: d.versions[0] }; }
      return { d, v: await addVersion(d, file) };
    },
  };
}
