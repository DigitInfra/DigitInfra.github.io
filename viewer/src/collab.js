// GIN²CO — collaborative space (demonstration): roles, tasks, comments and suggestions, activity feed
import { kpis } from './charts.js';
import { userStrip } from './assets.js';
import { MEMBERS, RIGHTS } from './store.js';

const S = {
  fr: {
    intro: 'Les membres du projet échangent autour des ouvrages et des opérations : tâches attribuées, discussions, suggestions et non-conformités, avec un fil d’activité commun.',
    views: { feed: 'Fil d’activité', tasks: 'Tâches', talk: 'Discussions', members: 'Membres et rôles' },
    kOpen: 'Tâches ouvertes', kLate: 'Tâches en retard', kMine: 'Tâches qui vous sont attribuées', kThreads: 'Discussions ouvertes', kSugg: 'Suggestions en attente',
    cols: { todo: 'À faire', doing: 'En cours', review: 'En validation', done: 'Terminé' },
    prio: { high: 'Haute', mid: 'Normale', low: 'Basse' },
    newTask: '+ Nouvelle tâche', title: 'Intitulé', desc: 'Description', assignee: 'Attribuée à', due: 'Échéance', priority: 'Priorité', link: 'Lien', noLink: 'Aucun',
    create: 'Créer', cancel: 'Annuler', errTask: 'Donnez un intitulé à la tâche.', mineOnly: 'Seulement mes tâches', late: 'en retard', moveTo: 'Déplacer vers',
    types: { comment: 'Commentaire', suggestion: 'Suggestion', question: 'Question', nc: 'Non-conformité' },
    newThread: '+ Nouvelle discussion', type: 'Type', text: 'Message', post: 'Publier', errText: 'Écrivez un message.',
    mentionHint: 'Mentionnez un membre avec @ suivi de son prénom (ex. @Ibrahima).',
    reply: 'Répondre', replyPh: 'Votre réponse…', resolve: 'Marquer comme résolu', reopen: 'Rouvrir', resolved: 'Résolu', open: 'Ouvert',
    support: 'Soutenir', supported: 'Soutenue', supports: (n) => `${n} soutien${n > 1 ? 's' : ''}`, toTask: 'Créer une tâche', all: 'Tous', allLinks: 'Tous les liens', filterOpen: 'Ouvertes', filterAll: 'Toutes',
    forYou: 'Pour vous', forYouEmpty: 'Rien de nouveau pour vous.', mentioned: 'vous a mentionné', assigned: 'vous a attribué une tâche', feedEmpty: 'Aucune activité.',
    role: 'Rôle', member: 'Membre', rights: 'Droits', rightsNames: { editAsset: 'Modifier les ouvrages', addAsset: 'Ajouter des ouvrages', manageData: 'Importer, exporter', manageProject: 'Piloter les projets', validateStep: 'Valider les étapes', checkQuality: 'Contrôles qualité', assignTask: 'Attribuer des tâches', comment: 'Commenter, proposer' },
    readOnlyNote: 'Votre rôle permet de consulter et de commenter, pas d’attribuer des tâches.',
    logTask: (t) => `Tâche créée : ${t}`, logMove: (t, c) => `Tâche « ${t} » → ${c}`, logThread: (k) => `Nouvelle ${k.toLowerCase()}`, logReply: 'Réponse publiée', logResolve: 'Discussion résolue', logSupport: 'Suggestion soutenue',
    projects: 'Projets', assetsL: 'Ouvrages', on: 'sur', go: 'Ouvrir',
  },
  en: {
    intro: 'Project members work together around assets and operations: assigned tasks, discussions, suggestions and non-conformities, with a shared activity feed.',
    views: { feed: 'Activity feed', tasks: 'Tasks', talk: 'Discussions', members: 'Members and roles' },
    kOpen: 'Open tasks', kLate: 'Overdue tasks', kMine: 'Tasks assigned to you', kThreads: 'Open discussions', kSugg: 'Pending suggestions',
    cols: { todo: 'To do', doing: 'In progress', review: 'In review', done: 'Done' },
    prio: { high: 'High', mid: 'Normal', low: 'Low' },
    newTask: '+ New task', title: 'Title', desc: 'Description', assignee: 'Assigned to', due: 'Due date', priority: 'Priority', link: 'Link', noLink: 'None',
    create: 'Create', cancel: 'Cancel', errTask: 'Give the task a title.', mineOnly: 'Only my tasks', late: 'overdue', moveTo: 'Move to',
    types: { comment: 'Comment', suggestion: 'Suggestion', question: 'Question', nc: 'Non-conformity' },
    newThread: '+ New discussion', type: 'Type', text: 'Message', post: 'Post', errText: 'Write a message.',
    mentionHint: 'Mention a member with @ followed by their first name (e.g. @Ibrahima).',
    reply: 'Reply', replyPh: 'Your reply…', resolve: 'Mark as resolved', reopen: 'Reopen', resolved: 'Resolved', open: 'Open',
    support: 'Support', supported: 'Supported', supports: (n) => `${n} supporter${n > 1 ? 's' : ''}`, toTask: 'Create a task', all: 'All', allLinks: 'All links', filterOpen: 'Open', filterAll: 'All',
    forYou: 'For you', forYouEmpty: 'Nothing new for you.', mentioned: 'mentioned you', assigned: 'assigned you a task', feedEmpty: 'No activity.',
    role: 'Role', member: 'Member', rights: 'Rights', rightsNames: { editAsset: 'Update assets', addAsset: 'Add assets', manageData: 'Import, export', manageProject: 'Run projects', validateStep: 'Validate steps', checkQuality: 'Quality checks', assignTask: 'Assign tasks', comment: 'Comment, suggest' },
    readOnlyNote: 'Your role allows you to view and comment, not to assign tasks.',
    logTask: (t) => `Task created: ${t}`, logMove: (t, c) => `Task “${t}” → ${c}`, logThread: (k) => `New ${k.toLowerCase()}`, logReply: 'Reply posted', logResolve: 'Discussion resolved', logSupport: 'Suggestion supported',
    projects: 'Projects', assetsL: 'Assets', on: 'on', go: 'Open',
  },
};
const TYPE_C = { comment: '#3B5FC0', suggestion: '#0E9AA5', question: '#9C5BB5', nc: '#D64545' };
const PRIO_C = { high: '#D64545', mid: '#E0A100', low: '#8A9BB0' };

function seed() {
  return {
    tasks: [
      { id: 'T1', title: 'Lever la réserve sur les appareils d’appui', desc: 'Reprendre le calage côté aval et fournir le procès-verbal de contrôle.', assignee: 'm6', creator: 'm7', due: '2026-12-05', prio: 'high', status: 'doing', link: 'P1', created: '2026-11-10 09:12' },
      { id: 'T2', title: 'Compléter les propriétés de la maquette IFC', desc: 'État, désordre et coût manquants sur 6 éléments (point de contrôle APD).', assignee: 'm8', creator: 'm1', due: '2026-12-10', prio: 'mid', status: 'todo', link: 'P2', created: '2026-11-14 15:40' },
      { id: 'T3', title: 'Inspecter PR-07 après la saison des pluies', desc: 'Relever les bourbiers et la longueur des points critiques.', assignee: 'm2', creator: 'm1', due: '2026-12-15', prio: 'mid', status: 'todo', link: 'PR-07', created: '2026-11-17 08:05' },
      { id: 'T4', title: 'Préparer la note de priorisation pour le cabinet', desc: 'Trois scénarios et le socle commun, à partir du tableau de bord.', assignee: 'm1', creator: 'm3', due: '2026-11-30', prio: 'high', status: 'review', link: '', created: '2026-11-12 11:30' },
      { id: 'T5', title: 'Vérifier la procédure de passation RN-03', desc: 'Conformité aux règles du bailleur avant l’avis de non-objection.', assignee: 'm4', creator: 'm1', due: '2026-11-15', prio: 'mid', status: 'done', link: 'P3', created: '2026-10-28 10:00' },
    ],
    comments: [
      { id: 'C1', type: 'suggestion', link: 'OA-08', author: 'm2', when: '2026-11-08 10:21', status: 'open', supports: ['m1', 'm4'],
        text: 'Remplacer le radier par un dalot multicellulaire plutôt que de le réparer : même remis en état, il reste coupé une partie de l’année.',
        replies: [{ author: 'm1', when: '2026-11-09 08:47', text: 'D’accord sur le principe. @Jean, ce type de complément est-il finançable dans le programme ?' }] },
      { id: 'C2', type: 'question', link: 'P2', author: 'm4', when: '2026-11-15 16:02', status: 'open', supports: [],
        text: 'Combien de ménages agricoles seront reliés aux marchés une fois les deux buses remplacées ?', replies: [] },
      { id: 'C3', type: 'comment', link: 'OA-05', author: 'm5', when: '2026-11-03 14:10', status: 'resolved', supports: [],
        text: 'L’ouvrage est noté « Bon » mais classé « à compléter » : vérifier la cohérence.',
        replies: [{ author: 'm2', when: '2026-11-04 09:30', text: 'Cohérent : l’ouvrage est en bon état mais sous-dimensionné, il est submergé une partie de l’année.' }] },
      { id: 'C4', type: 'nc', link: 'P1', author: 'm7', when: '2026-11-10 09:05', status: 'open', supports: [],
        text: 'Défaut de calage des appareils d’appui côté aval. Réserve inscrite ; tâche T1 ouverte pour l’entreprise.', replies: [] },
    ],
  };
}

export function createCollabBoard(el, ctx) {
  const { lang, esc, store, tv } = ctx;
  const s = (k) => S[lang()][k];
  let view = 'tasks', mine = false, taskForm = null, threadForm = null, tFilter = { type: '', link: '', status: 'open' };
  const mem = (id) => MEMBERS.find((m) => m.id === id) || { name: id, fr: '', en: '' };
  const today = () => new Date().toISOString().slice(0, 10);
  const st = () => {
    if (!store.state.collabSeeded) { const sd = seed(); store.state.tasks = sd.tasks.concat(store.state.tasks || []); store.state.comments = sd.comments.concat(store.state.comments || []); store.state.collabSeeded = true; }
    return store.state;
  };
  const linkLabel = (l) => {
    if (!l) return s('noLink');
    const p = ctx.projects().find((x) => x.id === l);
    if (p) return `${p.id} — ${p.name[lang()]}`;
    const a = ctx.assets().find((x) => x.code === l);
    return a ? `${a.code} — ${tv(a.type)}` : l;
  };
  const linkChip = (l) => (l ? `<button type="button" class="cl-link mono" data-link="${esc(l)}">${esc(l)}</button>` : '');
  const avatar = (id) => { const m = mem(id); const ini = m.name.split(/\s+/).filter((w) => /^[A-ZÉ]/.test(w)).slice(0, 2).map((w) => w[0]).join('') || m.name[0]; return `<span class="cl-av" title="${esc(`${m.name} — ${m[lang()]}`)}">${esc(ini)}</span>`; };
  const fmtText = (t) => esc(t).replace(/@([A-Za-zÀ-ÿ’'-]+)/g, (m0, n) => (MEMBERS.some((m) => m.name.split(' ')[0].toLowerCase() === n.toLowerCase()) ? `<b class="cl-at">@${n}</b>` : m0));
  const mentions = (t) => MEMBERS.filter((m) => new RegExp(`@${m.name.split(' ')[0]}\\b`, 'i').test(t)).map((m) => m.id);
  const linkOptions = (sel) => {
    const P = ctx.projects();
    return `<option value="">${esc(s('noLink'))}</option><optgroup label="${esc(s('projects'))}">${P.map((p) => `<option value="${p.id}"${sel === p.id ? ' selected' : ''}>${esc(`${p.id} — ${p.name[lang()]}`)}</option>`).join('')}</optgroup>
      <optgroup label="${esc(s('assetsL'))}">${ctx.assets().map((a) => `<option value="${esc(a.code)}"${sel === a.code ? ' selected' : ''}>${esc(`${a.code} — ${tv(a.type)}`)}</option>`).join('')}</optgroup>`;
  };
  const act = (code, what) => store.activity(code, what, 'collab');
  const commit = () => store.commit('collab');

  function header() {
    const T = st().tasks, C = st().comments, me = store.me().id;
    const open = T.filter((t) => t.status !== 'done');
    return `${userStrip(store, lang, esc, ['assignTask', 'comment'])}<p class="sd-intro">${esc(s('intro'))}</p>
      ${kpis([
        { v: String(open.length), l: s('kOpen') },
        { v: String(open.filter((t) => t.due && t.due < today()).length), l: s('kLate'), tone: 'alert' },
        { v: String(open.filter((t) => t.assignee === me).length), l: s('kMine'), tone: 'ok' },
        { v: String(C.filter((c) => c.status === 'open').length), l: s('kThreads') },
        { v: String(C.filter((c) => c.type === 'suggestion' && c.status === 'open').length), l: s('kSugg'), tone: 'warn' },
      ])}
      <div class="cl-views" role="tablist">${Object.entries(s('views')).map(([k, v]) => `<button type="button" role="tab" aria-selected="${k === view}" data-view="${k}">${esc(v)}</button>`).join('')}</div>`;
  }

  function tasksView() {
    const me = store.me().id;
    const T = st().tasks.filter((t) => !mine || t.assignee === me);
    const canAssign = store.can('assignTask');
    const form = taskForm ? `<section class="pl-form"><h4 class="bv-h">${esc(s('newTask').replace('+ ', ''))}</h4><div class="pl-fields">
      <label class="sd-f"><span class="bv-l">${esc(s('title'))}</span><input type="text" data-tf="title" value="${esc(taskForm.title || '')}" maxlength="120"></label>
      <label class="sd-f"><span class="bv-l">${esc(s('assignee'))}</span><select data-tf="assignee">${MEMBERS.map((m) => `<option value="${m.id}"${taskForm.assignee === m.id ? ' selected' : ''}>${esc(`${m.name} — ${m[lang()]}`)}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('due'))}</span><input type="date" data-tf="due" value="${esc(taskForm.due || '')}"></label>
      <label class="sd-f"><span class="bv-l">${esc(s('priority'))}</span><select data-tf="prio">${Object.entries(s('prio')).map(([k, v]) => `<option value="${k}"${(taskForm.prio || 'mid') === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('link'))}</span><select data-tf="link">${linkOptions(taskForm.link || '')}</select></label>
      <label class="sd-f" style="grid-column:1/-1"><span class="bv-l">${esc(s('desc'))}</span><textarea rows="2" data-tf="desc" maxlength="400">${esc(taskForm.desc || '')}</textarea></label>
      <p class="pl-err" data-terr role="alert"></p>
      <div class="sd-actions"><button type="button" class="sg-link" data-a="tcancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-a="tcreate">${esc(s('create'))}</button></div></div></section>` : '';
    return `<div class="pl-bar">${canAssign ? `<button type="button" class="btn btn-primary" data-a="tnew">${esc(s('newTask'))}</button>` : `<p class="bv-muted">${esc(s('readOnlyNote'))}</p>`}
      <label class="bv-field sg-cb"><input type="checkbox" data-a="mine"${mine ? ' checked' : ''}><span>${esc(s('mineOnly'))}</span></label></div>${form}
      <div class="cl-board">${Object.entries(s('cols')).map(([k, v]) => {
        const xs = T.filter((t) => t.status === k);
        return `<section class="cl-col"><h5 class="pl-h5">${esc(v)} <span class="mono">${xs.length}</span></h5>${xs.map((t) => {
          const lateT = t.status !== 'done' && t.due && t.due < today();
          const canMove = canAssign || t.assignee === store.me().id;
          return `<article class="cl-card" style="--p:${PRIO_C[t.prio]}"><p class="cl-ct"><span class="mono">${esc(t.id)}</span> ${esc(t.title)}</p>
            ${t.desc ? `<p class="cl-cd">${esc(t.desc)}</p>` : ''}
            <p class="cl-cm">${avatar(t.assignee)} <span>${esc(mem(t.assignee).name)}</span></p>
            <p class="cl-cm">${linkChip(t.link)} <span class="mono${lateT ? ' cl-late' : ''}">${esc(t.due || '')}${lateT ? ` · ${esc(s('late'))}` : ''}</span> <span class="cl-prio">${esc(s('prio')[t.prio])}</span></p>
            ${canMove ? `<label class="cl-move"><span class="sr">${esc(s('moveTo'))}</span><select data-move="${t.id}" aria-label="${esc(`${s('moveTo')} — ${t.title}`)}">${Object.entries(s('cols')).map(([c, cv]) => `<option value="${c}"${c === t.status ? ' selected' : ''}>${esc(cv)}</option>`).join('')}</select></label>` : ''}
          </article>`;
        }).join('')}</section>`;
      }).join('')}</div>`;
  }

  function talkView() {
    const C = st().comments.filter((c) => (!tFilter.type || c.type === tFilter.type) && (!tFilter.link || c.link === tFilter.link) && (tFilter.status !== 'open' || c.status === 'open'));
    const me = store.me().id; const canC = store.can('comment');
    const links = [...new Set(st().comments.map((c) => c.link).filter(Boolean))];
    const form = threadForm ? `<section class="pl-form"><h4 class="bv-h">${esc(s('newThread').replace('+ ', ''))}</h4><div class="pl-fields">
      <label class="sd-f"><span class="bv-l">${esc(s('type'))}</span><select data-hf="type">${Object.entries(s('types')).map(([k, v]) => `<option value="${k}"${(threadForm.type || 'comment') === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('link'))}</span><select data-hf="link">${linkOptions(threadForm.link || '')}</select></label>
      <label class="sd-f" style="grid-column:1/-1"><span class="bv-l">${esc(s('text'))}</span><textarea rows="3" data-hf="text" maxlength="600"></textarea><small class="pl-hint">${esc(s('mentionHint'))}</small></label>
      <p class="pl-err" data-herr role="alert"></p>
      <div class="sd-actions"><button type="button" class="sg-link" data-a="hcancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-a="hpost">${esc(s('post'))}</button></div></div></section>` : '';
    return `<div class="pl-bar">${canC ? `<button type="button" class="btn btn-primary" data-a="hnew">${esc(s('newThread'))}</button>` : ''}
      <select data-flt="type" aria-label="${esc(s('type'))}"><option value="">${esc(s('all'))}</option>${Object.entries(s('types')).map(([k, v]) => `<option value="${k}"${tFilter.type === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <select data-flt="link" aria-label="${esc(s('link'))}"><option value="">${esc(s('allLinks'))}</option>${links.map((l) => `<option value="${esc(l)}"${tFilter.link === l ? ' selected' : ''}>${esc(linkLabel(l))}</option>`).join('')}</select>
      <select data-flt="status" aria-label="${esc(s('open'))}"><option value="open"${tFilter.status === 'open' ? ' selected' : ''}>${esc(s('filterOpen'))}</option><option value="all"${tFilter.status === 'all' ? ' selected' : ''}>${esc(s('filterAll'))}</option></select></div>${form}
      <div class="cl-threads">${C.slice().reverse().map((c) => `<article class="cl-thread${c.status === 'resolved' ? ' is-res' : ''}" style="--t:${TYPE_C[c.type]}">
        <header><span class="cl-type">${esc(s('types')[c.type])}</span> ${linkChip(c.link)} <span class="bv-muted">${esc(linkLabel(c.link))}</span>
          <span class="cl-st">${c.status === 'resolved' ? `✓ ${esc(s('resolved'))}` : esc(s('open'))}</span></header>
        <div class="cl-msg">${avatar(c.author)}<div><p class="cl-who"><b>${esc(mem(c.author).name)}</b> <span class="bv-muted">${esc(mem(c.author)[lang()])} · ${esc(c.when)}</span></p><p>${fmtText(c.text)}</p></div></div>
        ${c.replies.map((r) => `<div class="cl-msg cl-reply">${avatar(r.author)}<div><p class="cl-who"><b>${esc(mem(r.author).name)}</b> <span class="bv-muted">${esc(r.when)}</span></p><p>${fmtText(r.text)}</p></div></div>`).join('')}
        <footer>
          ${c.type === 'suggestion' ? `<button type="button" class="bv-btn${c.supports.includes(me) ? ' is-on' : ''}" data-sup="${c.id}"${canC ? '' : ' disabled'}>${esc(c.supports.includes(me) ? s('supported') : s('support'))} · ${esc(s('supports')(c.supports.length))}</button>` : ''}
          ${canC && c.status === 'open' ? `<input type="text" class="cl-rin" data-rin="${c.id}" placeholder="${esc(s('replyPh'))}" maxlength="400"><button type="button" class="bv-btn" data-rep="${c.id}">${esc(s('reply'))}</button>` : ''}
          ${(c.author === me || ['mo', 'admin'].includes(store.me().role)) ? `<button type="button" class="sg-link" data-res="${c.id}">${esc(c.status === 'open' ? s('resolve') : s('reopen'))}</button>` : ''}
          ${store.can('assignTask') && c.status === 'open' ? `<button type="button" class="sg-link" data-totask="${c.id}">${esc(s('toTask'))}</button>` : ''}
        </footer></article>`).join('')}</div>`;
  }

  function feedView() {
    const me = store.me();
    const firstName = me.name.split(' ')[0];
    const events = [
      ...st().activity.map((a) => ({ when: a.when, who: a.who, what: a.what, link: a.code })),
      ...st().comments.flatMap((c) => [{ when: c.when, who: c.author, what: `${s('types')[c.type]} : ${c.text}`, link: c.link }, ...c.replies.map((r) => ({ when: r.when, who: r.author, what: `${s('reply')} : ${r.text}`, link: c.link }))]),
      ...st().tasks.map((t) => ({ when: t.created, who: t.creator, what: s('logTask')(t.title), link: t.link, to: t.assignee })),
    ].filter((e) => e.when).sort((x, y) => (x.when < y.when ? 1 : -1));
    const seen = new Set(); const uniq = events.filter((e) => { const k = `${e.when}|${e.who}|${e.what}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const forMe = uniq.filter((e) => e.to === me.id || new RegExp(`@${firstName}\\b`, 'i').test(e.what)).slice(0, 6);
    const row = (e) => `<li>${avatar(e.who)}<div><p class="cl-who"><b>${esc(mem(e.who).name)}</b> <span class="bv-muted mono">${esc(e.when)}</span> ${linkChip(e.link)}</p><p>${fmtText(e.what)}</p></div></li>`;
    return `<div class="cl-feed-grid"><section><h5 class="pl-h5">${esc(s('views').feed)}</h5>${uniq.length ? `<ul class="cl-feed">${uniq.slice(0, 30).map(row).join('')}</ul>` : `<p class="bv-muted">${esc(s('feedEmpty'))}</p>`}</section>
      <aside><h5 class="pl-h5">${esc(s('forYou'))} — ${esc(me.name)}</h5>${forMe.length ? `<ul class="cl-feed">${forMe.map(row).join('')}</ul>` : `<p class="bv-muted">${esc(s('forYouEmpty'))}</p>`}</aside></div>`;
  }

  function membersView() {
    const R = Object.keys(RIGHTS);
    return `<div class="bv-table-wrap sd-wrap"><table class="bv-table pf-table cl-rights"><thead><tr><th>${esc(s('member'))}</th><th>${esc(s('role'))}</th>${R.map((r) => `<th class="num">${esc(s('rightsNames')[r])}</th>`).join('')}</tr></thead><tbody>
      ${MEMBERS.map((m) => `<tr${m.id === store.me().id ? ' class="pl-cur"' : ''}><td>${avatar(m.id)} ${esc(m.name)}</td><td>${esc(m[lang()])}</td>${R.map((r) => `<td class="num">${RIGHTS[r].includes(m.role) ? '✓' : '—'}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>`;
  }

  function render() {
    st();
    const body = { tasks: tasksView, talk: talkView, feed: feedView, members: membersView }[view]();
    el.innerHTML = `${header()}<div class="cl-body">${body}</div>`;
  }

  el.addEventListener('click', (e) => {
    const lk = e.target.closest('[data-link]');
    if (lk) { const l = lk.dataset.link; if (/^P\d+$/.test(l)) ctx.openProject(l); else ctx.focus(l); return; }
    const v = e.target.closest('[data-view]'); if (v) { view = v.dataset.view; render(); return; }
    const me = store.me().id;
    const sup = e.target.closest('[data-sup]');
    if (sup) { const c = st().comments.find((x) => x.id === sup.dataset.sup); c.supports = c.supports.includes(me) ? c.supports.filter((x) => x !== me) : [...c.supports, me]; act(c.link, s('logSupport')); commit(); return; }
    const rep = e.target.closest('[data-rep]');
    if (rep) {
      const inp = el.querySelector(`[data-rin="${rep.dataset.rep}"]`); const txt = inp.value.trim(); if (!txt) return;
      const c = st().comments.find((x) => x.id === rep.dataset.rep); c.replies.push({ author: me, when: store.stamp(), text: txt });
      act(c.link, s('logReply')); commit(); return;
    }
    const res = e.target.closest('[data-res]');
    if (res) { const c = st().comments.find((x) => x.id === res.dataset.res); c.status = c.status === 'open' ? 'resolved' : 'open'; if (c.status === 'resolved') act(c.link, s('logResolve')); commit(); return; }
    const tt = e.target.closest('[data-totask]');
    if (tt) { const c = st().comments.find((x) => x.id === tt.dataset.totask); view = 'tasks'; taskForm = { title: c.text.slice(0, 100), desc: '', link: c.link, prio: c.type === 'nc' ? 'high' : 'mid', assignee: me }; render(); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'tnew') { taskForm = { assignee: me, prio: 'mid', link: '' }; render(); }
    else if (a === 'tcancel') { taskForm = null; render(); }
    else if (a === 'tcreate') {
      const g = (k) => el.querySelector(`[data-tf="${k}"]`).value;
      const title = g('title').trim(); if (!title) { el.querySelector('[data-terr]').textContent = s('errTask'); return; }
      const id = `T${st().tasks.length + 1}`;
      st().tasks.push({ id, title, desc: g('desc').trim(), assignee: g('assignee'), creator: me, due: g('due'), prio: g('prio'), status: 'todo', link: g('link'), created: store.stamp() });
      act(g('link'), s('logTask')(title)); taskForm = null; commit();
    } else if (a === 'hnew') { threadForm = { type: 'comment', link: tFilter.link || '' }; render(); }
    else if (a === 'hcancel') { threadForm = null; render(); }
    else if (a === 'hpost') {
      const g = (k) => el.querySelector(`[data-hf="${k}"]`).value;
      const text = g('text').trim(); if (!text) { el.querySelector('[data-herr]').textContent = s('errText'); return; }
      const id = `C${st().comments.length + 1}`;
      st().comments.push({ id, type: g('type'), link: g('link'), author: me, when: store.stamp(), status: 'open', supports: [], text, replies: [], mentions: mentions(text) });
      act(g('link'), s('logThread')(s('types')[g('type')])); threadForm = null; tFilter.status = 'open'; commit();
    }
  });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-user]')) { store.setUser(e.target.value); return; }
    if (e.target.dataset.a === 'mine') { mine = e.target.checked; render(); return; }
    if (e.target.dataset.flt) { tFilter[e.target.dataset.flt] = e.target.value; render(); return; }
    if (e.target.dataset.move) {
      const t = st().tasks.find((x) => x.id === e.target.dataset.move); t.status = e.target.value;
      act(t.link, s('logMove')(t.title, s('cols')[t.status])); commit();
    }
  });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.rin) el.querySelector(`[data-rep="${e.target.dataset.rin}"]`).click(); });
  return { render, showMine() { view = 'tasks'; mine = true; render(); }, filterLink(l) { view = 'talk'; tFilter = { type: '', link: l, status: 'all' }; render(); }, count: (l) => st().comments.filter((c) => c.link === l).length };
}
