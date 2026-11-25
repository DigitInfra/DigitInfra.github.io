// GIN²CO — project workspace: summary, versioned 3D, tasks, documents (GED), discussions, team and history of one project.
// Tasks, comments and documents are the shared ones (collaborative space, GED): the workspace shows those linked to the project or to its assets.
import { kpis } from './charts.js';
import { MEMBERS } from './store.js';
import { targetPicker, readPicker } from './parts.js';

const S = {
  fr: {
    back: '← Tous les projets', onMap: 'Voir sur la carte',
    tabs: { summary: 'Synthèse', quality: 'Étapes et qualité', m3d: 'Maquette 3D', tasks: 'Tâches', docs: 'Documents', talk: 'Discussions', team: 'Équipe et historique' },
    kStep: 'Étape en cours', kWorks: 'Avancement des travaux', kAmount: 'Montant', kIssues: 'Réserves et non-conformités', kTasks: 'Tâches ouvertes', kLate: (n) => `dont ${n} en retard`, kDocs: 'Documents',
    next: 'Prochaines actions', toValidate: 'Pour valider l’étape :', ready: 'L’étape en cours peut être validée.', assetsH: 'Ouvrages concernés', lastDocs: 'Derniers documents', lastModel: 'Maquette numérique', noModel: 'Aucune maquette pour ce projet.', see3d: 'Ouvrir la maquette', seeAll: 'Voir tout',
    version: 'Version affichée', existing: (c) => `Existant — ${c} (registre)`, full: 'Plein écran', newVer: 'Déposer une nouvelle version IFC', loading: 'Chargement de la maquette…', err3d: 'La maquette n’a pas pu être chargée.', note3d: 'La maquette « existant » vient du registre du patrimoine ; les versions suivantes sont celles déposées dans la GED du projet.',
    cols: { todo: 'À faire', doing: 'En cours', review: 'En validation', done: 'Terminé' }, prio: { high: 'Haute', mid: 'Normale', low: 'Basse' },
    newTask: '+ Nouvelle tâche', title: 'Intitulé', desc: 'Description', assignee: 'Attribuée à', due: 'Échéance', priority: 'Priorité', link: 'Rattachement', create: 'Créer', cancel: 'Annuler', errTask: 'Donnez un intitulé.', noTasks: 'Aucune tâche.', late: 'en retard', move: 'Statut', noAssign: 'Votre rôle permet de suivre les tâches, pas d’en attribuer.',
    gen: 'Général du projet', genDocs: 'Documents généraux du projet', direct: 'Documents propres', belowA: 'Sur ses parties et éléments', belowP: 'Sur ses éléments', above: 'Hérités', from: 'Rattachés à :', noNode: 'Aucun document pour cet élément.', genNote: (n) => `${n} document(s) général(aux) du projet s’appliquent aussi.`,
    kinds: { asset: 'Ouvrage', part: 'Partie d’ouvrage', el: 'Élément (maquette IFC)' }, treeL: 'Arborescence des ouvrages', elements: 'Afficher les éléments', noIfc: 'Pas de maquette IFC pour cet ouvrage.',
    byStruct: 'Par ouvrage et partie', byPhase: 'Par étape', attach: 'Rattacher', saveT: 'Enregistrer le rattachement', concerns: 'Concerne', pickHint: 'cochez l’ouvrage entier, une partie ou des éléments ; ne rien cocher pour un document général du projet',
    see3d2: 'Voir en 3D', model: 'Maquette', hlOn: 'Surbrillance :', hlClear: 'Effacer', elDocs: 'Documents de l’élément', noElDocs: 'Aucun document rattaché.', via: 'via', allElDocs: 'Tous ses documents',
    upDoc: '+ Déposer un document', file: 'Fichier', type: 'Type', phase: 'Étape', save: 'Déposer', errFile: 'Choisissez un fichier.', inGed: 'Ouvrir dans la GED', open: 'Ouvrir', noDocs: 'Aucun document pour cette étape.', docsIntro: 'Chaque document est soit général au projet, soit rattaché à un ou plusieurs ouvrages, parties d’ouvrage ou éléments de la maquette. Choisissez un nœud pour voir ses documents propres et ceux dont il hérite. Ce sont les mêmes documents que dans la GED commune.',
    types: { comment: 'Commentaire', suggestion: 'Suggestion', question: 'Question', nc: 'Non-conformité' }, newThread: '+ Nouvelle discussion', text: 'Message', post: 'Publier', errText: 'Écrivez un message.', reply: 'Répondre', replyPh: 'Votre réponse…', resolve: 'Marquer comme résolu', reopen: 'Rouvrir', resolved: 'Résolu', openS: 'Ouvert', noTalk: 'Aucune discussion.', mention: 'Mentionnez un membre avec @ suivi de son prénom.',
    team: 'Membres impliqués', role: 'Rôle', openT: 'Tâches ouvertes', lastAct: 'Dernière action', hist: 'Historique du projet', noHist: 'Aucun événement.', project: 'Projet',
    logTask: (t) => `Tâche créée : ${t}`, logMove: (t, c) => `Tâche « ${t} » → ${c}`, logThread: 'Nouvelle discussion', logReply: 'Réponse publiée', logResolve: 'Discussion résolue',
  },
  en: {
    back: '← All projects', onMap: 'Show on the map',
    tabs: { summary: 'Summary', quality: 'Steps and quality', m3d: '3D model', tasks: 'Tasks', docs: 'Documents', talk: 'Discussions', team: 'Team and history' },
    kStep: 'Current step', kWorks: 'Works progress', kAmount: 'Amount', kIssues: 'Snags and non-conformities', kTasks: 'Open tasks', kLate: (n) => `${n} overdue`, kDocs: 'Documents',
    next: 'Next actions', toValidate: 'To validate the step:', ready: 'The current step can be validated.', assetsH: 'Assets concerned', lastDocs: 'Latest documents', lastModel: 'Digital model', noModel: 'No model for this project.', see3d: 'Open the model', seeAll: 'See all',
    version: 'Version shown', existing: (c) => `Existing — ${c} (register)`, full: 'Full screen', newVer: 'Upload a new IFC version', loading: 'Loading the model…', err3d: 'The model could not be loaded.', note3d: 'The “existing” model comes from the asset register; the following versions are those uploaded to the project’s documents.',
    cols: { todo: 'To do', doing: 'In progress', review: 'In review', done: 'Done' }, prio: { high: 'High', mid: 'Normal', low: 'Low' },
    newTask: '+ New task', title: 'Title', desc: 'Description', assignee: 'Assigned to', due: 'Due date', priority: 'Priority', link: 'Attached to', create: 'Create', cancel: 'Cancel', errTask: 'Give a title.', noTasks: 'No task.', late: 'overdue', move: 'Status', noAssign: 'Your role lets you follow tasks, not assign them.',
    gen: 'General project', genDocs: 'General project documents', direct: 'Own documents', belowA: 'On its parts and elements', belowP: 'On its elements', above: 'Inherited', from: 'Attached to:', noNode: 'No document for this item.', genNote: (n) => `${n} general project document(s) also apply.`,
    kinds: { asset: 'Asset', part: 'Part of works', el: 'Element (IFC model)' }, treeL: 'Asset tree', elements: 'Show elements', noIfc: 'No IFC model for this asset.',
    byStruct: 'By asset and part', byPhase: 'By step', attach: 'Attach', saveT: 'Save attachment', concerns: 'Concerns', pickHint: 'tick the whole asset, a part or elements; tick nothing for a general project document',
    see3d2: 'Show in 3D', model: 'Model', hlOn: 'Highlighted:', hlClear: 'Clear', elDocs: 'Element documents', noElDocs: 'No attached document.', via: 'via', allElDocs: 'All its documents',
    upDoc: '+ Upload a document', file: 'File', type: 'Type', phase: 'Step', save: 'Upload', errFile: 'Choose a file.', inGed: 'Open in the EDMS', open: 'Open', noDocs: 'No document for this step.', docsIntro: 'Each document is either general to the project or attached to one or more assets, parts of works or model elements. Pick a node to see its own documents and those it inherits. They are the same documents as in the shared EDMS.',
    types: { comment: 'Comment', suggestion: 'Suggestion', question: 'Question', nc: 'Non-conformity' }, newThread: '+ New discussion', text: 'Message', post: 'Post', errText: 'Write a message.', reply: 'Reply', replyPh: 'Your reply…', resolve: 'Mark as resolved', reopen: 'Reopen', resolved: 'Resolved', openS: 'Open', noTalk: 'No discussion.', mention: 'Mention a member with @ followed by their first name.',
    team: 'Members involved', role: 'Role', openT: 'Open tasks', lastAct: 'Last action', hist: 'Project history', noHist: 'No event.', project: 'Project',
    logTask: (t) => `Task created: ${t}`, logMove: (t, c) => `Task “${t}” → ${c}`, logThread: 'New discussion', logReply: 'Reply posted', logResolve: 'Discussion resolved',
  },
};
const TYPE_C = { comment: '#3B5FC0', suggestion: '#0E9AA5', question: '#9C5BB5', nc: '#D64545' };
const PRIO_C = { high: '#D64545', mid: '#E0A100', low: '#8A9BB0' };
const ST_C = { wip: '#8A9BB0', shared: '#3B5FC0', published: '#2E9E6B', archived: '#6B7280' };
export const SPACE_TABS = ['summary', 'quality', 'm3d', 'tasks', 'docs', 'talk', 'team'];

export function createSpace(ctx, h) {
  const { lang, esc, store, tv, money } = ctx;
  const s = (k) => S[lang()][k];
  const nm = (o) => (o ? o[lang()] : '');
  const mem = (id) => MEMBERS.find((m) => m.id === id) || MEMBERS.find((m) => m.name === id) || { id, name: id, fr: '', en: '' };
  const today = () => new Date().toISOString().slice(0, 10);
  const links = (p) => [p.id, ...p.codes];
  const tasksOf = (p) => (store.state.tasks || []).filter((t) => links(p).includes(t.link));
  const talksOf = (p) => (store.state.comments || []).filter((c) => links(p).includes(c.link));
  const ged = () => ctx.ged();
  const docsOf = (p) => { const g = ged(); return g ? links(p).flatMap((l) => g.docsFor(l)) : []; };
  const mentions = (t) => MEMBERS.filter((m) => new RegExp(`@${m.name.split(' ')[0]}\\b`, 'i').test(t)).map((m) => m.id);
  let taskForm = false, threadForm = false, docForm = false, ver = null;
  let docView = 'struct', node = 'gen', openParts = new Set(), editDoc = null, hl = null; // hl: { id, title, codes }
  const C = () => (ctx.catalog ? ctx.catalog() : null);
  const isAsset = (l) => ctx.assets().some((a) => a.code === l);
  const tg = (d) => { const g = ged(); return g ? g.targetsOf(d) : []; };
  const projAssets = (p) => p.codes.map((c) => ctx.assets().find((a) => a.code === c)).filter(Boolean);
  const nodeLabel = (k) => (k === 'gen' ? s('gen') : C() ? C().label(k, lang()) : k);
  // documents of the project concerning a node of the tree: direct, below it, inherited from above
  function docsAt(p, k) {
    const D = docsOf(p), c = C();
    if (k === 'gen') return { direct: D.filter((d) => !tg(d).length), below: [], above: [] };
    const direct = D.filter((d) => tg(d).includes(k));
    const below = D.filter((d) => !direct.includes(d) && tg(d).some((t) => t !== k && c.inside(t, k)));
    const anc = c.ancestors(k);
    const above = D.filter((d) => !direct.includes(d) && !below.includes(d) && tg(d).some((t) => anc.includes(t)));
    return { direct, below, above };
  }
  const countAt = (p, k) => { const r = docsAt(p, k); return r.direct.length + r.below.length; };
  let v3 = null; // { pid, key, host, viewer }

  /* --- 3D versions: register model of each asset, then IFC versions uploaded to the project */
  function versions(p) {
    const out = [];
    const g = ged();
    const used = new Set(g ? g.models(p.id).map((m) => m.v.file.url).filter(Boolean) : []);
    for (const c of p.codes) { const a = ctx.assets().find((x) => x.code === c); const url = `${ctx.modelsBase}${c}.ifc`; if (a && !a._added && !used.has(url)) out.push({ key: `reg:${c}`, label: s('existing')(c), note: '', asset: a, url }); }
    if (g) for (const m of g.models(p.id)) out.push({ key: `${m.d.id}:${m.v.ver}`, label: `${m.v.ver} · ${m.v.date}`, note: m.v.note || '', asset: ctx.assets().find((x) => x.code === p.codes[0]), d: m.d, v: m.v });
    return out;
  }
  const curVer = (p) => { const V = versions(p); return V.find((x) => x.key === ver) || V.at(-1); };

  function summary(p) {
    const { STEPS } = h;
    const cur = Math.min(p.step, STEPS.length - 1);
    const T = tasksOf(p).filter((t) => t.status !== 'done');
    const late = T.filter((t) => t.due && t.due < today()).length;
    const D = docsOf(p);
    const bl = h.blockers(p, cur);
    const closed = h.validatedCount(p) === STEPS.length;
    const V = versions(p);
    const lastV = V.at(-1);
    return kpis([
      { v: closed ? '✓' : `${cur + 1} / ${STEPS.length}`, l: `${s('kStep')} — ${nm(STEPS[cur].n)}` },
      { v: `${p.pct || 0} %`, l: s('kWorks') },
      { v: money(h.amountOf(p)), l: s('kAmount') },
      { v: String(h.openIssues(p)), l: s('kIssues'), tone: h.openIssues(p) ? 'warn' : 'ok' },
      { v: String(T.length), l: `${s('kTasks')}${late ? ` (${s('kLate')(late)})` : ''}`, tone: late ? 'alert' : '' },
      { v: String(D.length), l: s('kDocs') },
    ]) + `<div class="ps-grid">
      <section class="hm-card"><header><h4 class="bv-h">${esc(s('next'))}</h4></header>
        ${closed ? '' : bl.length ? `<p class="pj-warn">${esc(s('toValidate'))} ${esc(bl.join(' ; '))}</p>` : `<p class="pj-ok">${esc(s('ready'))}</p>`}
        ${T.length ? `<ul class="hm-list">${T.slice().sort((a, b) => ((a.due || '9') < (b.due || '9') ? -1 : 1)).slice(0, 5).map((t) => `<li><span class="hm-dot" style="background:${PRIO_C[t.prio]}"></span><div><b>${esc(t.title)}</b><small>${esc(mem(t.assignee).name)} · <span class="mono${t.due && t.due < today() ? ' cl-late' : ''}">${esc(t.due || '—')}</span> · ${esc(s('cols')[t.status])}</small></div></li>`).join('')}</ul>` : `<p class="bv-muted">${esc(s('noTasks'))}</p>`}
        <p><button type="button" class="sg-link" data-ps-tab="tasks">${esc(s('seeAll'))} →</button></p></section>
      <section class="hm-card"><header><h4 class="bv-h">${esc(s('lastModel'))}</h4></header>
        ${lastV ? `<p><b>${esc(lastV.label)}</b>${lastV.note ? `<br><small class="bv-muted">${esc(lastV.note)}</small>` : ''}</p><p class="bv-muted">${V.length} ${lang() === 'en' ? 'version(s)' : 'version(s)'}</p><p><button type="button" class="btn btn-primary" data-ps-tab="m3d">${esc(s('see3d'))} →</button></p>` : `<p class="bv-muted">${esc(s('noModel'))}</p>`}</section>
      <section class="hm-card"><header><h4 class="bv-h">${esc(s('assetsH'))}</h4></header>
        <ul class="hm-codes">${p.codes.map((c) => { const a = ctx.assets().find((x) => x.code === c); return a ? `<li><button type="button" class="sg-link mono" data-ps-asset="${esc(c)}">${esc(c)}</button> ${esc(tv(a.type))} · ${esc(tv(a.etat))} · ${esc(money(a.cout))}</li>` : ''; }).join('')}</ul></section>
      <section class="hm-card"><header><h4 class="bv-h">${esc(s('lastDocs'))}</h4><button type="button" class="sg-link" data-ps-tab="docs">${esc(s('seeAll'))}</button></header>
        ${D.length ? `<ul class="hm-list">${D.slice(0, 4).map((d) => `<li><span class="hm-doc mono">${esc(d.type)}</span><div><button type="button" class="sg-link" data-ps-open="${esc(d.id)}">${esc(nm(d.title))}</button><small class="mono">${esc(d.code)} · ${esc(d.versions.at(-1).ver)} · ${esc(d.versions.at(-1).date)}</small></div></li>`).join('')}</ul>` : `<p class="bv-muted">${esc(s('noDocs'))}</p>`}</section>
    </div>`;
  }

  function m3d(p) {
    const V = versions(p);
    if (!V.length) return `<p class="bv-muted">${esc(s('noModel'))}</p>`;
    const cv = curVer(p);
    return `<div class="ps-3dbar"><label class="sd-f"><span class="bv-l">${esc(s('version'))}</span><select data-ps-ver>${V.map((v) => `<option value="${esc(v.key)}"${v.key === cv.key ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>
      <p class="ps-vnote">${esc(cv.note)}</p>
      <button type="button" class="bv-btn" data-ps-full>${esc(s('full'))}</button>
      ${store.can('uploadDoc') ? `<label class="bv-btn ps-file">${esc(s('newVer'))}<input type="file" accept=".ifc" data-ps-ifc hidden></label>` : ''}</div>
      ${V.some((v) => !v.d) ? `<p class="cc-note">${esc(s('note3d'))}</p>` : ''}
      ${hl ? `<p class="ps-hl" role="status"><span>${esc(s('hlOn'))} <b>${esc(hl.title)}</b> — ${esc(hl.targets)}</span><button type="button" class="sg-link" data-ps-a="hlclear">${esc(s('hlClear'))}</button></p>` : ''}
      <div data-ps3d class="ps-3dslot"></div>`;
  }
  // documents of an element, shown in the 3D side panel
  function elementDocs(p, code) {
    const c = C(); if (!c || !c.elIndex.has(code)) return '';
    const { direct, above } = docsAt(p, code);
    const part = c.parentOf(code), asset = c.assetOf(code);
    const li = (d, why) => `<li><button type="button" class="sg-link" data-ps-open="${esc(d.id)}">${esc(nm(d.title))}</button><small class="mono">${esc(d.code)} · ${esc(d.versions.at(-1).ver)}${why ? ` · ${esc(why)}` : ''}</small></li>`;
    const via = (d) => (tg(d).includes(part) ? c.partName(part.split('#')[1], lang()) : asset);
    return `<div class="ps-eldocs"><h4 class="bv-h">${esc(s('elDocs'))} (${direct.length + above.length})</h4>
      ${direct.length + above.length ? `<ul>${direct.map((d) => li(d, '')).join('')}${above.map((d) => li(d, `${s('via')} ${via(d)}`)).join('')}</ul>` : `<p class="bv-muted">${esc(s('noElDocs'))}</p>`}
      <p><button type="button" class="sg-link" data-ps-node="${esc(code)}">${esc(s('allElDocs'))} →</button></p></div>`;
  }

  function memberOpts(sel) { return MEMBERS.map((m) => `<option value="${m.id}"${m.id === sel ? ' selected' : ''}>${esc(m.name)} — ${esc(m[lang()])}</option>`).join(''); }
  function linkOpts(p) { return links(p).map((l) => `<option value="${esc(l)}">${esc(l === p.id ? `${p.id} — ${nm(p.name)}` : l)}</option>`).join(''); }

  function tasks(p) {
    const T = tasksOf(p);
    const me = store.me().id;
    const canA = store.can('assignTask');
    const card = (t) => { const late = t.due && t.due < today() && t.status !== 'done'; const canMove = canA || t.assignee === me;
      return `<article class="cl-card"><p class="cl-ct"><span class="hm-dot" style="background:${PRIO_C[t.prio]}"></span> <b>${esc(t.title)}</b></p>
        ${t.desc ? `<p class="cl-cd">${esc(t.desc)}</p>` : ''}
        <p class="cl-cm">${esc(mem(t.assignee).name)} · <span class="mono${late ? ' cl-late' : ''}">${esc(t.due || '—')}</span>${late ? ` · ${esc(s('late'))}` : ''}${t.link !== p.id ? ` · <span class="mono">${esc(t.link)}</span>` : ''}</p>
        ${canMove ? `<select data-ps-move="${esc(t.id)}" aria-label="${esc(s('move'))}">${Object.keys(S.fr.cols).map((k) => `<option value="${k}"${t.status === k ? ' selected' : ''}>${esc(s('cols')[k])}</option>`).join('')}</select>` : ''}</article>`; };
    return `<div class="pl-bar">${canA ? `<button type="button" class="btn btn-primary" data-ps-a="tnew">${esc(s('newTask'))}</button>` : `<p class="bv-muted">${esc(s('noAssign'))}</p>`}</div>
      ${taskForm ? `<section class="pl-form"><div class="pl-fields">
        <label class="sd-f"><span class="bv-l">${esc(s('title'))}</span><input type="text" data-ps-tf="title" maxlength="120"></label>
        <label class="sd-f"><span class="bv-l">${esc(s('desc'))}</span><input type="text" data-ps-tf="desc" maxlength="240"></label>
        <label class="sd-f"><span class="bv-l">${esc(s('assignee'))}</span><select data-ps-tf="assignee">${memberOpts(me)}</select></label>
        <label class="sd-f"><span class="bv-l">${esc(s('due'))}</span><input type="date" data-ps-tf="due"></label>
        <label class="sd-f"><span class="bv-l">${esc(s('priority'))}</span><select data-ps-tf="prio">${Object.keys(PRIO_C).map((k) => `<option value="${k}"${k === 'mid' ? ' selected' : ''}>${esc(s('prio')[k])}</option>`).join('')}</select></label>
        <label class="sd-f"><span class="bv-l">${esc(s('link'))}</span><select data-ps-tf="link">${linkOpts(p)}</select></label>
        <p class="pl-err" data-ps-err role="alert"></p>
        <div class="sd-actions"><button type="button" class="sg-link" data-ps-a="tcancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-ps-a="tcreate">${esc(s('create'))}</button></div></div></section>` : ''}
      <div class="cl-board">${Object.keys(S.fr.cols).map((k) => { const xs = T.filter((t) => t.status === k); return `<section class="cl-col"><h5 class="pl-h5">${esc(s('cols')[k])} <span>${xs.length}</span></h5>${xs.map(card).join('') || `<p class="bv-muted">—</p>`}</section>`; }).join('')}</div>`;
  }

  function docRow(p, d, mode) {
    const g = ged(), c = C();
    const lv = d.versions.at(-1); const is3d = d.type === 'M3D' && lv.file.kind !== 'demo';
    const t = tg(d);
    const can3d = c && t.some((x) => c.expand(x).length);
    const chips = t.length ? t.map((x) => `<button type="button" class="gd-chip" data-ps-node="${esc(x)}">${esc(c ? c.label(x, lang()) : x)}</button>`).join(' ') : `<span class="gd-chip gd-gen">${esc(s('gen'))}</span>`;
    return `<tr${editDoc === d.id ? ' class="pl-cur"' : ''}><td class="mono">${esc(d.code)}</td><td class="pf-wrap">${esc(nm(d.title))}<div class="gd-chips">${chips}</div></td>${mode === 'phase' ? `<td>${esc(g.typeName(d.type))}</td>` : ''}<td class="mono">${esc(lv.ver)}</td>
      <td><span class="bv-badge" style="--c:${ST_C[d.status]}">${esc(g.label(d.status))}</span></td>${mode === 'phase' ? '' : `<td>${esc(nm((h.STEPS.find((x) => x.k === d.phase) || {}).n))}</td>`}
      <td class="ps-acts">${is3d ? `<button type="button" class="sg-link" data-ps-tab3d="${esc(d.id)}:${esc(lv.ver)}">${esc(s('model'))}</button>` : `<button type="button" class="sg-link" data-ps-open="${esc(d.id)}">${esc(s('open'))}</button>`}
        ${can3d ? `<button type="button" class="sg-link" data-ps-hl="${esc(d.id)}">${esc(s('see3d2'))}</button>` : ''}
        <button type="button" class="sg-link" data-ps-ged="${esc(d.id)}">${esc(s('inGed'))}</button>
        ${store.can('uploadDoc') && c ? `<button type="button" class="sg-link" data-ps-edit="${esc(d.id)}">${esc(s('attach'))}</button>` : ''}</td></tr>`;
  }
  const docTable = (p, xs, mode) => `<div class="bv-table-wrap sd-wrap"><table class="bv-table pf-table ps-docs"><tbody>${xs.map((d) => docRow(p, d, mode)).join('')}</tbody></table></div>`;

  function tree(p) {
    const c = C();
    const btn = (k, lab, n, cls = '') => `<button type="button" class="ps-tn${cls}${node === k ? ' is-on' : ''}" data-ps-node="${esc(k)}"><span>${lab}</span>${n ? `<i>${n}</i>` : ''}</button>`;
    return `<nav class="ps-tree" aria-label="${esc(s('treeL'))}">
      ${btn('gen', esc(s('gen')), docsAt(p, 'gen').direct.length, ' ps-tgen')}
      ${projAssets(p).map((a) => `<div class="ps-ta">${btn(a.code, `<b class="mono">${esc(a.code)}</b> ${esc(tv(a.type))}`, countAt(p, a.code), ' ps-tasset')}
        ${c.partsOf(a.code).map((pt) => { const open = openParts.has(pt.key) || (node !== 'gen' && c.inside(node, pt.key));
          return `<div class="ps-tp"><div class="ps-tprow"><button type="button" class="ps-tog" data-ps-tog="${esc(pt.key)}" aria-expanded="${open}" aria-label="${esc(s('elements'))}">${open ? '▾' : '▸'}</button>${btn(pt.key, esc(c.partName(pt.k, lang())), countAt(p, pt.key))}</div>
            ${open ? `<div class="ps-tels">${pt.els.map((e) => btn(e.c, `<span class="mono">${esc(e.c.slice(a.code.length + 1))}</span> ${esc(e.n)}`, countAt(p, e.c), ' ps-tel')).join('')}</div>` : ''}</div>`; }).join('')}
        ${c.partsOf(a.code).length ? '' : `<p class="bv-muted ps-tnone">${esc(s('noIfc'))}</p>`}</div>`).join('')}
    </nav>`;
  }

  function docs(p) {
    const { STEPS } = h;
    const D = docsOf(p);
    const g = ged(), c = C();
    const ed = editDoc && D.find((d) => d.id === editDoc);
    const head = `<p class="sd-intro">${esc(s('docsIntro'))}</p>
      <div class="pl-bar"><div class="ps-seg" role="group">${['struct', 'phase'].map((k) => `<button type="button" class="${docView === k ? 'is-on' : ''}" data-ps-view="${k}">${esc(s(k === 'struct' ? 'byStruct' : 'byPhase'))}</button>`).join('')}</div>
        ${store.can('uploadDoc') ? `<button type="button" class="btn btn-primary" data-ps-a="dnew">${esc(s('upDoc'))}</button>` : ''}</div>
      ${docForm ? `<section class="pl-form"><div class="pl-fields">
        <label class="sd-f"><span class="bv-l">${esc(s('file'))}</span><input type="file" data-ps-df="file"></label>
        <label class="sd-f"><span class="bv-l">${esc(s('title'))}</span><input type="text" data-ps-df="title" maxlength="140"></label>
        <label class="sd-f"><span class="bv-l">${esc(s('type'))}</span><select data-ps-df="type">${g.types().map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
        <label class="sd-f"><span class="bv-l">${esc(s('phase'))}</span><select data-ps-df="phase">${STEPS.map((st, i) => `<option value="${st.k}"${i === Math.min(p.step, STEPS.length - 1) ? ' selected' : ''}>${esc(nm(st.n))}</option>`).join('')}</select></label>
        ${c ? `<div class="sd-f ps-wide"><span class="bv-l">${esc(s('concerns'))} — ${esc(s('pickHint'))}</span>${targetPicker(c, projAssets(p), node === 'gen' ? [] : [node], { lang: lang(), esc, name: 'psup', tv })}</div>` : ''}
        <p class="pl-err" data-ps-err role="alert"></p>
        <div class="sd-actions"><button type="button" class="sg-link" data-ps-a="dcancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-ps-a="dsave">${esc(s('save'))}</button></div></div></section>` : ''}
      ${ed ? `<section class="pl-form"><h4 class="bv-h">${esc(s('attach'))} — ${esc(nm(ed.title))}</h4><p class="cc-note">${esc(s('pickHint'))}</p>
        ${targetPicker(c, projAssets(p), tg(ed), { lang: lang(), esc, name: 'psedit', tv })}
        <div class="sd-actions"><button type="button" class="sg-link" data-ps-a="ecancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-ps-a="esave">${esc(s('saveT'))}</button></div></section>` : ''}`;
    if (docView === 'phase' || !c) {
      return head + STEPS.map((st, i) => { const xs = D.filter((d) => d.phase === st.k); if (!xs.length && i > p.step) return '';
        return `<h5 class="pl-h5 ps-ph">${i + 1}. ${esc(nm(st.n))} <span>${xs.length}</span></h5>${xs.length ? docTable(p, xs, 'phase') : `<p class="bv-muted">${esc(s('noDocs'))}</p>`}`; }).join('');
    }
    const r = docsAt(p, node);
    const k = node === 'gen' ? 'gen' : c.kind(node);
    const up = node === 'gen' ? [] : c.ancestors(node);
    const sec = (title, xs, note) => (xs.length ? `<h5 class="pl-h5 ps-ph">${esc(title)} <span>${xs.length}</span></h5>${note ? `<p class="cc-note">${esc(note)}</p>` : ''}${docTable(p, xs, 'struct')}` : '');
    const showIn3d = k !== 'gen' && c.expand(node).length;
    return head + `<div class="ps-docgrid">${tree(p)}<div class="ps-doclist">
      <div class="ps-nodehead"><h4 class="bv-h">${esc(nodeLabel(node))}</h4>${k !== 'gen' ? `<small>${esc(s('kinds')[k])}</small>` : ''}
        ${showIn3d ? `<button type="button" class="sg-link" data-ps-hlnode="${esc(node)}">${esc(s('see3d2'))}</button>` : ''}</div>
      ${sec(k === 'gen' ? s('genDocs') : s('direct'), r.direct)}
      ${sec(k === 'asset' ? s('belowA') : s('belowP'), r.below)}
      ${sec(s('above'), r.above, up.length ? `${s('from')} ${up.map((x) => (c.kind(x) === 'part' ? `${s('kinds').part.toLowerCase()} « ${c.partName(x.split('#')[1], lang())} »` : `${s('kinds').asset.toLowerCase()} ${x}`)).join(lang() === 'en' ? ' and ' : ' et ')}` : '')}
      ${!r.direct.length && !r.below.length && !r.above.length ? `<p class="bv-muted">${esc(s('noNode'))}</p>` : ''}
      ${k !== 'gen' ? `<p class="cc-note">${esc(s('genNote')(docsAt(p, 'gen').direct.length))} <button type="button" class="sg-link" data-ps-node="gen">${esc(s('gen'))} →</button></p>` : ''}
    </div></div>`;
  }

  function talk(p) {
    const C = talksOf(p).slice().sort((a, b) => (a.status === b.status ? (a.when < b.when ? 1 : -1) : a.status === 'open' ? -1 : 1));
    const me = store.me().id;
    return `<div class="pl-bar"><button type="button" class="btn btn-primary" data-ps-a="hnew">${esc(s('newThread'))}</button></div>
      ${threadForm ? `<section class="pl-form"><div class="pl-fields">
        <label class="sd-f"><span class="bv-l">${esc(s('type'))}</span><select data-ps-hf="type">${Object.keys(TYPE_C).map((k) => `<option value="${k}">${esc(s('types')[k])}</option>`).join('')}</select></label>
        <label class="sd-f"><span class="bv-l">${esc(s('link'))}</span><select data-ps-hf="link">${linkOpts(p)}</select></label>
        <label class="sd-f ps-wide"><span class="bv-l">${esc(s('text'))}</span><textarea data-ps-hf="text" rows="3" maxlength="600"></textarea><small class="bv-muted">${esc(s('mention'))}</small></label>
        <p class="pl-err" data-ps-err role="alert"></p>
        <div class="sd-actions"><button type="button" class="sg-link" data-ps-a="hcancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-ps-a="hpost">${esc(s('post'))}</button></div></div></section>` : ''}
      ${C.length ? C.map((c) => `<article class="cl-thread"><header><span class="bv-badge" style="--c:${TYPE_C[c.type]}">${esc(s('types')[c.type])}</span> <b>${esc(mem(c.author).name)}</b> <small class="mono">${esc(c.when)}</small>${c.link !== p.id ? ` <small class="mono">· ${esc(c.link)}</small>` : ''} <span class="ps-st">${esc(c.status === 'open' ? s('openS') : s('resolved'))}</span></header>
        <p>${esc(c.text)}</p>
        ${c.replies.map((r) => `<p class="ps-rep"><b>${esc(mem(r.author).name)}</b> <small class="mono">${esc(r.when)}</small><br>${esc(r.text)}</p>`).join('')}
        <div class="ps-rbar"><input type="text" data-ps-rin="${esc(c.id)}" placeholder="${esc(s('replyPh'))}" aria-label="${esc(s('reply'))}"><button type="button" class="bv-btn" data-ps-rep="${esc(c.id)}">${esc(s('reply'))}</button>
        ${c.author === me || store.can('manageProject') || store.can('validateStep') ? `<button type="button" class="sg-link" data-ps-res="${esc(c.id)}">${esc(c.status === 'open' ? s('resolve') : s('reopen'))}</button>` : ''}</div></article>`).join('') : `<p class="bv-muted">${esc(s('noTalk'))}</p>`}`;
  }

  function team(p) {
    const T = tasksOf(p), C = talksOf(p), D = docsOf(p);
    const ids = new Set([...T.flatMap((t) => [t.assignee, t.creator]), ...C.flatMap((c) => [c.author, ...c.replies.map((r) => r.author)]), ...D.flatMap((d) => d.versions.map((v) => mem(v.author).id)), ...p.hist.map((x) => mem(x.who).id)]);
    const act = (store.state.activity || []).filter((a) => links(p).includes(a.code) && a.kind !== 'project');
    // history rebuilt from the project objects (steps, documents, tasks, discussions) plus logged changes
    const L_ = lang() === 'en';
    const valid = p.steps.map((x, i) => (x.v ? { when: x.v.when, who: x.v.by, what: `${L_ ? 'Step validated' : 'Étape validée'} : ${nm(h.STEPS[i].n)}` } : null)).filter(Boolean);
    const isValid = (x) => valid.some((v) => v.when === x.when && v.who === x.who);
    const derived = [
      ...valid,
      ...D.flatMap((d) => d.versions.map((v) => ({ when: v.date, who: v.author, what: `${L_ ? 'Document' : 'Document'} ${d.code} ${v.ver} — ${nm(d.title)}` }))),
      ...T.map((t) => ({ when: t.created || '', who: mem(t.creator).name, what: `${L_ ? 'Task assigned to' : 'Tâche attribuée à'} ${mem(t.assignee).name} : ${t.title}` })),
      ...C.flatMap((c) => [{ when: c.when, who: mem(c.author).name, what: `${s('types')[c.type]} : ${c.text.slice(0, 90)}${c.text.length > 90 ? '…' : ''}` }, ...c.replies.map((r) => ({ when: r.when, who: mem(r.author).name, what: `${L_ ? 'Reply' : 'Réponse'} : ${r.text.slice(0, 90)}${r.text.length > 90 ? '…' : ''}` }))]),
    ];
    const logged = [...p.hist.filter((x) => !isValid(x)).map((x) => ({ when: x.when, who: x.who, what: x.what })),
      ...act.filter((a) => a.kind === 'asset').map((a) => ({ when: a.when, who: mem(a.who).name, what: `${a.code} · ${a.what}` }))];
    const ev = [...derived, ...logged].filter((e) => e.when).sort((a, b) => (a.when < b.when ? 1 : -1));
    const lastOf = (m) => ev.find((e) => e.who === m.name);
    const M = MEMBERS.filter((m) => ids.has(m.id));
    return `<div class="ps-grid ps-grid2"><section class="hm-card"><header><h4 class="bv-h">${esc(s('team'))}</h4></header>
      <ul class="ps-team">${M.map((m) => { const n = T.filter((t) => t.assignee === m.id && t.status !== 'done').length; const la = lastOf(m);
        return `<li><span class="ga-av hm-av">${esc(m.name.slice(0, 1))}</span><div><b>${esc(m.name)}</b><small>${esc(m[lang()])}</small>${la ? `<small class="mono">${esc(s('lastAct'))} : ${esc(la.when)}</small>` : ''}</div>${n ? `<span class="ps-badge">${n} ${esc(lang() === 'en' ? 'open task(s)' : 'tâche(s) ouverte(s)')}</span>` : ''}</li>`; }).join('')}</ul></section>
      <section class="hm-card"><header><h4 class="bv-h">${esc(s('hist'))}</h4></header>
      ${ev.length ? `<ul class="pj-hist">${ev.slice(0, 30).map((e) => `<li><span class="mono">${esc(e.when)}</span> · ${esc(e.who)} · ${esc(e.what)}</li>`).join('')}</ul>` : `<p class="bv-muted">${esc(s('noHist'))}</p>`}</section></div>`;
  }

  function body(tab, p) {
    if (tab === 'summary') return summary(p);
    if (tab === 'm3d') return m3d(p);
    if (tab === 'tasks') return tasks(p);
    if (tab === 'docs') return ged() ? docs(p) : '';
    if (tab === 'talk') return talk(p);
    if (tab === 'team') return team(p);
    return '';
  }
  function counts(p) {
    return { tasks: tasksOf(p).filter((t) => t.status !== 'done').length, docs: docsOf(p).length, talk: talksOf(p).filter((c) => c.status === 'open').length, m3d: versions(p).length };
  }

  // prepares a 3D highlight of the elements covered by targets, on a version of the right asset
  function showIn3d(p, targets, title) {
    const c = C();
    const codes = [...new Set(targets.flatMap((t) => c.expand(t)))];
    const assets = new Set(targets.map((t) => c.assetOf(t)));
    const V = versions(p), cv = curVer(p);
    if (cv && !assets.has(cv.asset?.code)) { const alt = [...V].reverse().find((v) => assets.has(v.asset?.code)); if (alt) ver = alt.key; }
    hl = { title, codes, targets: targets.map((t) => c.label(t, lang())).join(', ') };
  }

  /* --- inline 3D viewer kept alive across re-renders */
  function leave() { if (v3) { v3.viewer?.destroy(); v3.host.remove(); v3 = null; } }
  async function after(el, p, tab) {
    const slot = el.querySelector('[data-ps3d]');
    if (tab !== 'm3d' || !slot) { leave(); return; }
    const cv = curVer(p);
    if (v3 && v3.pid === p.id && v3.key === cv.key) { slot.replaceWith(v3.host); if (v3.viewer) { if (hl) v3.viewer.highlight(hl.codes); else v3.viewer.refreshProps?.(); } return; }
    leave();
    const host = document.createElement('div');
    host.className = 'ps-3dhost';
    host.innerHTML = `<p class="bv-status mono">${esc(s('loading'))}</p>`;
    slot.replaceWith(host);
    const mine = { pid: p.id, key: cv.key, host, viewer: null };
    v3 = mine;
    try {
      const url = cv.url || await ged().urlOf(cv.d, cv.v);
      host.innerHTML = '';
      const viewer = await ctx.mount3d(host, cv.asset, url, {
        extraProps: (code) => elementDocs(p, code),
        onSelect: () => { if (hl) { hl = null; el.querySelector('.ps-hl')?.remove(); } },
      });
      if (v3 === mine) { mine.viewer = viewer; if (hl) viewer.highlight(hl.codes); } else viewer.destroy();
    } catch (err) {
      console.error(err);
      if (v3 === mine) host.innerHTML = `<p class="bv-status">${esc(s('err3d'))}</p>`;
    }
  }

  const commit = (what = 'collab') => store.commit(what);
  const act = (code, what) => store.activity(code, what, 'collab');
  function onClick(e, p, el, rerender) {
    const q = (sel) => e.target.closest(sel);
    let b;
    if ((b = q('[data-ps-asset]'))) { ctx.focus(b.dataset.psAsset); return true; }
    if ((b = q('[data-ps-open]'))) { const g = ged(); const d = g.ensure().find((x) => x.id === b.dataset.psOpen); g.openVersion(d, d.versions.at(-1)); return true; }
    if ((b = q('[data-ps-ged]'))) { ctx.openDoc(b.dataset.psGed); return true; }
    if ((b = q('[data-ps-tab3d]'))) { ver = b.dataset.psTab3d; rerender('m3d'); return true; }
    if ((b = q('[data-ps-node]'))) { node = b.dataset.psNode; docView = 'struct'; editDoc = null; rerender('docs'); el.querySelector('.ps-doclist')?.scrollIntoView({ block: 'nearest' }); return true; }
    if ((b = q('[data-ps-tog]'))) { const k = b.dataset.psTog; if (openParts.has(k)) openParts.delete(k); else openParts.add(k); rerender(); return true; }
    if ((b = q('[data-ps-view]'))) { docView = b.dataset.psView; rerender(); return true; }
    if ((b = q('[data-ps-edit]'))) { editDoc = b.dataset.psEdit; docForm = false; rerender(); el.querySelector('.pl-form')?.scrollIntoView({ block: 'nearest' }); return true; }
    if ((b = q('[data-ps-hl]'))) {
      const d = ged().ensure().find((x) => x.id === b.dataset.psHl);
      showIn3d(p, tg(d), nm(d.title)); rerender('m3d'); return true;
    }
    if ((b = q('[data-ps-hlnode]'))) { showIn3d(p, [b.dataset.psHlnode], nodeLabel(b.dataset.psHlnode)); rerender('m3d'); return true; }
    if (q('[data-ps-full]')) { const cv = curVer(p); Promise.resolve(cv.url || ged().urlOf(cv.d, cv.v)).then((url) => ctx.fullscreen3d(p, cv, url)); return true; }
    if ((b = q('[data-ps-rep]'))) {
      const inp = el.querySelector(`[data-ps-rin="${b.dataset.psRep}"]`); const txt = inp.value.trim(); if (!txt) return true;
      const c = store.state.comments.find((x) => x.id === b.dataset.psRep); c.replies.push({ author: store.me().id, when: store.stamp(), text: txt });
      act(c.link, s('logReply')); commit(); return true;
    }
    if ((b = q('[data-ps-res]'))) { const c = store.state.comments.find((x) => x.id === b.dataset.psRes); c.status = c.status === 'open' ? 'resolved' : 'open'; if (c.status === 'resolved') act(c.link, s('logResolve')); commit(); return true; }
    if (!(b = q('[data-ps-a]'))) return false;
    const a = b.dataset.psA;
    const err = (m) => { const x = el.querySelector('[data-ps-err]'); if (x) x.textContent = m; };
    if (a === 'hlclear') { hl = null; v3?.viewer?.highlight(null); rerender(); return true; }
    if (a === 'ecancel') { editDoc = null; rerender(); return true; }
    if (a === 'esave') { const d = ged().ensure().find((x) => x.id === editDoc); editDoc = null; ged().setTargets(d, readPicker(el, 'psedit')); return true; }
    if (a === 'tnew') { taskForm = true; rerender(); } else if (a === 'tcancel') { taskForm = false; rerender(); }
    else if (a === 'tcreate') {
      const g = (k) => el.querySelector(`[data-ps-tf="${k}"]`).value;
      const title = g('title').trim(); if (!title) { err(s('errTask')); return true; }
      store.state.tasks.push({ id: `T${store.state.tasks.length + 1}`, title, desc: g('desc').trim(), assignee: g('assignee'), creator: store.me().id, due: g('due'), prio: g('prio'), status: 'todo', link: g('link'), created: store.stamp() });
      act(g('link'), s('logTask')(title)); taskForm = false; commit();
    } else if (a === 'hnew') { threadForm = true; rerender(); } else if (a === 'hcancel') { threadForm = false; rerender(); }
    else if (a === 'hpost') {
      const g = (k) => el.querySelector(`[data-ps-hf="${k}"]`).value;
      const text = g('text').trim(); if (!text) { err(s('errText')); return true; }
      store.state.comments.push({ id: `C${store.state.comments.length + 1}`, type: g('type'), link: g('link'), author: store.me().id, when: store.stamp(), status: 'open', supports: [], text, replies: [], mentions: mentions(text) });
      act(g('link'), s('logThread')); threadForm = false; commit();
    } else if (a === 'dnew') { docForm = true; rerender(); } else if (a === 'dcancel') { docForm = false; rerender(); }
    else if (a === 'dsave') {
      const g = (k) => el.querySelector(`[data-ps-df="${k}"]`);
      const file = g('file').files[0]; if (!file) { err(s('errFile')); return true; }
      docForm = false;
      const targets = C() ? readPicker(el, 'psup') : [];
      ged().addDoc({ file, title: g('title').value.trim() || file.name, type: g('type').value, link: p.id, phase: g('phase').value, targets });
    }
    return true;
  }
  function onChange(e, p, el, rerender) {
    const t = e.target;
    if (t.matches('[data-ps-move]')) {
      const tk = store.state.tasks.find((x) => x.id === t.dataset.psMove); tk.status = t.value;
      act(tk.link, s('logMove')(tk.title, s('cols')[t.value])); commit(); return true;
    }
    if (t.matches('[data-ps-ver]')) { ver = t.value; rerender(); return true; }
    if (t.matches('[data-ps-ifc]') && t.files[0]) {
      ged().addModelVersion(p.id, t.files[0], h.STEPS[Math.min(p.step, h.STEPS.length - 1)].k).then((r) => { if (r) ver = `${r.d.id}:${r.v.ver}`; rerender(); });
      return true;
    }
    return false;
  }
  return { body, after, leave, onClick, onChange, counts, tabs: () => s('tabs'), label: (k) => s(k), setVersion: (k) => { ver = k; } };
}
