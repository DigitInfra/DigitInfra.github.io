// GIN²CO — "Mon espace": personal home of the signed-in profile (tasks, mentions, followed projects, role alerts, recent documents)
import { STEPS } from './projects.js';
import { MEMBERS } from './store.js';

const S = {
  fr: {
    hello: (n) => `Bonjour ${n}`, today: (d) => `Nous sommes le ${d}.`, tasks: 'Mes tâches', noTask: 'Aucune tâche ouverte.', late: 'en retard', due: 'échéance',
    forYou: 'Mentions et discussions', noMsg: 'Rien de nouveau.', projects: 'Projets suivis', step: 'Étape', ready: 'Étape prête à être validée', issues: (n) => `${n} non-conformité(s) ou réserve(s) ouverte(s)`,
    watch: 'À surveiller', docs: 'Documents récents', noDoc: 'Aucun document.', go: 'Ouvrir', see: 'Voir tout',
    w: {
      ministre: ['Coût annuel de l’inaction', 'Inaction évitée par le programme', 'Ouvrages critiques'],
      crit: 'Ouvrages critiques hors enveloppe', oldInsp: 'Inspections de plus de 6 mois', nc: 'Non-conformités et réserves ouvertes', yield: 'Rendement du programme', prog: 'Avancement des projets', journal: 'Dernières modifications du registre', none: 'Rien à signaler.',
    },
  },
  en: {
    hello: (n) => `Hello ${n}`, today: (d) => `Today is ${d}.`, tasks: 'My tasks', noTask: 'No open task.', late: 'overdue', due: 'due',
    forYou: 'Mentions and discussions', noMsg: 'Nothing new.', projects: 'Followed projects', step: 'Step', ready: 'Step ready to be validated', issues: (n) => `${n} open non-conformity(ies) or snag(s)`,
    watch: 'To watch', docs: 'Recent documents', noDoc: 'No document.', go: 'Open', see: 'See all',
    w: {
      ministre: ['Annual cost of inaction', 'Inaction avoided by the programme', 'Critical assets'],
      crit: 'Critical assets outside the envelope', oldInsp: 'Inspections older than 6 months', nc: 'Open non-conformities and snags', yield: 'Programme return', prog: 'Project progress', journal: 'Latest register changes', none: 'Nothing to report.',
    },
  },
};

export function createHomeBoard(el, ctx) {
  const { lang, esc, store, tv, money, pct } = ctx;
  const s = (k) => S[lang()][k];
  const today = () => new Date().toISOString().slice(0, 10);
  const mem = (id) => MEMBERS.find((m) => m.id === id) || { name: id };
  const nm = (o) => (o ? o[lang()] : '');
  const card = (title, body, more) => `<section class="hm-card"><header><h4 class="bv-h">${esc(title)}</h4>${more ? `<button type="button" class="sg-link" data-go="${more}">${esc(s('see'))}</button>` : ''}</header>${body}</section>`;
  const monthsSince = (ym) => { if (!ym) return 99; const [y, m] = ym.split('-').map(Number); const d = new Date(); return d.getFullYear() * 12 + d.getMonth() + 1 - (y * 12 + m); };

  function render() {
    const me = store.me(), role = me.role, st = store.state;
    const first = me.name.split(' ')[0].replace(/^(Bureau|Entreprise|DigitInfra)$/, me.name.split(' (')[0]);
    const tasks = (st.tasks || []).filter((t) => t.assignee === me.id && t.status !== 'done').sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1);
    const re = new RegExp(`@${me.name.split(' ')[0]}\\b`, 'i');
    const msgs = (st.comments || []).flatMap((c) => [{ c, m: c }, ...c.replies.map((r) => ({ c, m: r }))])
      .filter(({ c, m }) => re.test(m.text) || (c.author === me.id && c.status === 'open' && c.replies.length))
      .sort((a, b) => (a.m.when < b.m.when ? 1 : -1)).slice(0, 4);
    const P = ctx.projects();
    const mine = role === 'entreprise' && !ctx.scoped ? P.filter((p) => (st.tasks || []).some((t) => t.assignee === me.id && t.link === p.id)) : P;
    const R = ctx.ranked();
    const openIssues = (p) => p.steps.reduce((a, x) => a + x.c.filter((c) => c.s === 'nc' || c.s === 'res').length, 0);
    const ready = (p) => { const x = p.steps[p.step]; return x && !x.v && x.d.every(Boolean) && x.c.every((c) => c.s === 'ok'); };

    const taskHtml = tasks.length ? `<ul class="hm-list">${tasks.slice(0, 4).map((t) => { const late = t.due && t.due < today(); return `<li><span class="hm-dot" style="background:${t.prio === 'high' ? '#D64545' : t.prio === 'mid' ? '#E0A100' : '#8A9BB0'}"></span>
      <div><b>${esc(t.title)}</b><small>${t.link ? `${esc(t.link)} · ` : ''}${esc(s('due'))} <span class="mono${late ? ' cl-late' : ''}">${esc(t.due || '—')}</span>${late ? ` · ${esc(s('late'))}` : ''}</small></div></li>`; }).join('')}</ul>` : `<p class="bv-muted">${esc(s('noTask'))}</p>`;
    const msgHtml = msgs.length ? `<ul class="hm-list">${msgs.map(({ c, m }) => `<li><span class="ga-av hm-av">${esc(mem(m.author).name.slice(0, 1))}</span><div><b>${esc(mem(m.author).name)}</b> <small class="mono">${esc(m.when)}</small><small>${c.link ? `${esc(c.link)} · ` : ''}${esc(m.text.slice(0, 140))}</small></div></li>`).join('')}</ul>` : `<p class="bv-muted">${esc(s('noMsg'))}</p>`;
    const projHtml = mine.length ? `<ul class="hm-proj">${mine.map((p) => { const n = p.steps.filter((x) => x.v).length; const iss = openIssues(p);
      return `<li><button type="button" class="hm-p" data-proj="${p.id}"><b class="mono">${esc(p.id)}</b> ${esc(nm(p.name))}
        <span class="hm-bar"><i style="width:${(n / STEPS.length * 100).toFixed(0)}%"></i></span>
        <small>${esc(s('step'))} ${Math.min(p.step + 1, STEPS.length)}/${STEPS.length} — ${esc(nm((STEPS[p.step] || STEPS.at(-1)).n))}${iss ? ` · <span class="pj-warn">${esc(s('issues')(iss))}</span>` : ''}${ready(p) && store.can('validateStep') ? ` · <span class="pj-ok">${esc(s('ready'))}</span>` : ''}</small></button></li>`; }).join('')}</ul>` : `<p class="bv-muted">${esc(s('w').none)}</p>`;

    // role-specific watch list
    const W = s('w');
    let watch = '';
    const f = R.filter((a) => a.funded);
    const inact = R.reduce((a, x) => a + x.inaction, 0), avoided = f.reduce((a, x) => a + x.inaction, 0), committed = f.reduce((a, x) => a + x.cout, 0);
    const codeList = (xs, extra) => (xs.length ? `<ul class="hm-codes">${xs.slice(0, 6).map((a) => `<li><button type="button" class="sg-link mono" data-asset="${esc(a.code)}">${esc(a.code)}</button> ${esc(tv(a.type))}${extra ? ` · ${esc(extra(a))}` : ''}</li>`).join('')}</ul>` : `<p class="bv-muted">${esc(W.none)}</p>`);
    if (role === 'ministre') {
      watch = `<div class="hm-kpis"><div><b>${esc(money(inact))}</b><small>${esc(W.ministre[0])}</small></div><div><b>${esc(money(avoided))}</b><small>${esc(W.ministre[1])} (${pct(avoided / inact)})</small></div><div><b>${R.filter((a) => a.note === 4).length}</b><small>${esc(W.ministre[2])}</small></div></div>`;
    } else if (role === 'mo' || role === 'admin') {
      watch = `<h5 class="pl-h5">${esc(W.crit)}</h5>${codeList(R.filter((a) => a.note === 4 && !a.funded), (a) => money(a.cout))}
        <h5 class="pl-h5">${esc(W.nc)}</h5><p>${P.reduce((a, p) => a + openIssues(p), 0)}</p>`;
    } else if (role === 'tech' || role === 'controle') {
      watch = `<h5 class="pl-h5">${esc(W.oldInsp)}</h5>${codeList(R.filter((a) => monthsSince(a.inspection) > 6), (a) => a.inspection || '—')}
        <h5 class="pl-h5">${esc(W.nc)}</h5><p>${P.reduce((a, p) => a + openIssues(p), 0)}</p>`;
    } else if (role === 'bailleur') {
      watch = `<div class="hm-kpis"><div><b>${committed ? (avoided / committed).toFixed(1).replace('.', lang() === 'en' ? '.' : ',') : '0'} ×</b><small>${esc(W.yield)}</small></div><div><b>${esc(money(committed))}</b><small>${lang() === 'en' ? 'Amount committed' : 'Montant engagé'}</small></div></div>`;
    } else if (role === 'audit') {
      const log = (st.log || []).slice(-4).reverse();
      watch = `<h5 class="pl-h5">${esc(W.journal)}</h5>${log.length ? `<ul class="hm-codes">${log.map((l) => `<li><span class="mono">${esc(l.when)}</span> · ${esc(l.code)} · ${esc(l.what.slice(0, 80))}</li>`).join('')}</ul>` : `<p class="bv-muted">${esc(W.none)}</p>`}`;
    } else if (role === 'entreprise' || role === 'bet') {
      watch = `<h5 class="pl-h5">${esc(W.nc)}</h5><p>${mine.reduce((a, p) => a + openIssues(p), 0)}</p>`;
    }
    const docs = ctx.docs().slice().sort((a, b) => (a.versions.at(-1).date < b.versions.at(-1).date ? 1 : -1)).filter((d) => role !== 'entreprise' || mine.some((p) => p.id === d.link)).slice(0, 4);
    const docHtml = docs.length ? `<ul class="hm-list">${docs.map((d) => `<li><span class="hm-doc mono">${esc(d.type)}</span><div><button type="button" class="sg-link" data-doc="${d.id}">${esc(nm(d.title))}</button><small class="mono">${esc(ctx.codeOf ? ctx.codeOf(d) : d.code)} · ${esc(ctx.revOf ? ctx.revOf(d, d.versions.length - 1) : d.versions.at(-1).ver)} · ${esc(d.versions.at(-1).date)}</small></div></li>`).join('')}</ul>` : `<p class="bv-muted">${esc(s('noDoc'))}</p>`;

    const dateTxt = new Intl.DateTimeFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    el.innerHTML = `<header class="hm-head"><h2>${esc(s('hello')(first))}</h2><p>${esc(me[lang()])} · ${esc(s('today')(dateTxt))}</p></header>
      <div class="hm-grid hm-strip">
        ${card(s('tasks'), taskHtml, ctx.allowed('collab') ? 'collab' : '')}
        ${role === 'entreprise' || role === 'bet' ? card(s('watch'), watch || `<p class="bv-muted">${esc(W.none)}</p>`, '') : ''}
        ${card(s('projects'), projHtml, ctx.allowed('proj') ? 'proj' : '')}
        ${card(s('forYou'), msgHtml, ctx.allowed('collab') ? 'collab' : '')}
        ${card(s('docs'), docHtml, 'ged')}
      </div>`;
  }
  el.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) { ctx.go(g.dataset.go); return; }
    const p = e.target.closest('[data-proj]'); if (p) { ctx.openProject(p.dataset.proj); return; }
    const a = e.target.closest('[data-asset]'); if (a) { ctx.focus(a.dataset.asset); return; }
    const d = e.target.closest('[data-doc]'); if (d) ctx.openDoc(d.dataset.doc);
  });
  return { render };
}
