// GIN²CO — project follow-up from feasibility to final acceptance, with quality-control checkpoints (demonstration)
import { createSpace, SPACE_TABS } from './projspace.js';
import { kpis, donut, hbars } from './charts.js';
import { userStrip } from './assets.js';

const L = (fr, en) => ({ fr, en });
export const STEPS = [
  { k: 'faisa', n: L('Identification et faisabilité', 'Identification and feasibility'), m: 3,
    deliv: [L('Fiche d’identification de l’ouvrage', 'Asset identification sheet'), L('Diagnostic de l’état (inspection)', 'Condition diagnosis (inspection)'), L('Étude de faisabilité technique et économique', 'Technical and economic feasibility study'), L('Analyse environnementale et sociale préliminaire', 'Preliminary environmental and social screening')],
    checks: [L('Inspection datée de moins de 12 mois', 'Inspection less than 12 months old'), L('Coût de l’inaction et rendement chiffrés', 'Cost of inaction and return quantified'), L('Variantes comparées : réparer, renforcer, remplacer', 'Options compared: repair, strengthen, replace'), L('Emprises et foncier identifiés', 'Right of way and land identified')] },
  { k: 'aps', n: L('Avant-projet sommaire (APS)', 'Outline design (APS)'), m: 3,
    deliv: [L('Levés topographiques', 'Topographic survey'), L('Étude hydrologique et hydraulique', 'Hydrological and hydraulic study'), L('Reconnaissance géotechnique préliminaire', 'Preliminary geotechnical investigation'), L('Note APS et estimation à ± 20 %', 'Outline design report and ± 20% estimate')],
    checks: [L('Débit de projet et période de retour justifiés', 'Design flow and return period justified'), L('Dimensionnement préliminaire cohérent avec le trafic et l’aléa', 'Preliminary sizing consistent with traffic and hazard'), L('Estimation dans l’enveloppe ou écart justifié', 'Estimate within envelope or variance justified')] },
  { k: 'apd', n: L('Avant-projet détaillé (APD)', 'Detailed design (APD)'), m: 4,
    deliv: [L('Plans et notes de calcul', 'Drawings and design calculations'), L('Maquette numérique IFC de l’ouvrage', 'IFC digital model of the asset'), L('Estimation détaillée à ± 10 %', 'Detailed ± 10% estimate'), L('Plan de gestion environnementale et sociale', 'Environmental and social management plan')],
    checks: [L('Notes de calcul vérifiées par un tiers', 'Design calculations checked by a third party'), L('Maquette IFC conforme au cahier des charges BIM (propriétés renseignées)', 'IFC model compliant with the BIM requirements (properties filled in)'), L('Quantités issues de la maquette cohérentes avec l’estimation', 'Model quantities consistent with the estimate'), L('Mesures environnementales intégrées au projet', 'Environmental measures built into the design')] },
  { k: 'dao', n: L('Appel d’offres et passation', 'Tendering and award'), m: 4,
    deliv: [L('Dossier d’appel d’offres (CCAP, CCTP, BPU, DQE)', 'Tender documents (conditions, specifications, bill of quantities)'), L('Rapport d’analyse des offres', 'Bid evaluation report'), L('Marché signé', 'Signed contract'), L('Ordre de service de démarrage', 'Notice to commence')],
    checks: [L('Le CCTP reprend les critères de contrôle qualité', 'Specifications include the quality-control criteria'), L('Procédure conforme aux règles du bailleur', 'Procedure compliant with the funder’s rules'), L('Montant du marché dans l’enveloppe', 'Contract amount within the envelope')] },
  { k: 'travaux', n: L('Travaux', 'Works'), m: 8,
    deliv: [L('Plan d’assurance qualité de l’entreprise', 'Contractor’s quality assurance plan'), L('Journal de chantier à jour', 'Site diary up to date'), L('Procès-verbaux d’essais', 'Test reports'), L('Situations de travaux', 'Progress payment statements')],
    checks: null },
  { k: 'rp', n: L('Réception provisoire', 'Provisional acceptance'), m: 1,
    deliv: [L('Procès-verbal de réception provisoire', 'Provisional acceptance certificate'), L('Liste des réserves', 'Snag list'), L('Dossier des ouvrages exécutés et maquette « tel que construit »', 'As-built records and as-built model')],
    checks: [L('Réserves levées ou planifiées avec délai', 'Snags cleared or scheduled with a deadline'), L('Maquette « tel que construit » livrée et intégrée au patrimoine', 'As-built model delivered and added to the asset register'), L('Épreuves de réception réalisées si exigées', 'Acceptance tests carried out where required')] },
  { k: 'rd', n: L('Réception définitive', 'Final acceptance'), m: 12,
    deliv: [L('Rapport de fin de période de garantie', 'End-of-warranty report'), L('Procès-verbal de réception définitive', 'Final acceptance certificate'), L('Mise à jour du registre du patrimoine', 'Asset register updated')],
    checks: [L('Aucun désordre pendant la garantie, ou désordres traités', 'No defect during warranty, or defects remedied'), L('Note d’état mise à jour après travaux', 'Condition rating updated after works'), L('Retenue de garantie libérée', 'Retention released')] },
];
const WORKS = {
  'Pont à poutres en béton armé': [L('Résistance du béton (essais d’écrasement sur éprouvettes)', 'Concrete strength (cylinder crushing tests)'), L('Enrobage et position des armatures', 'Rebar cover and position'), L('Pose des appareils d’appui', 'Bearing installation'), L('Épreuve de chargement avant mise en service', 'Load test before opening')],
  culvert: [L('Compactage du remblai (≥ 95 % de l’Optimum Proctor)', 'Backfill compaction (≥ 95% of Proctor optimum)'), L('Calage et pente du radier', 'Invert level and slope'), L('Résistance du béton', 'Concrete strength'), L('Protection des têtes (perrés, murs en aile)', 'Head protection (riprap, wing walls)')],
  'Radier submersible': [L('Ancrage et parafouilles', 'Anchoring and cut-off walls'), L('Résistance du béton', 'Concrete strength'), L('Protection aval contre l’affouillement', 'Downstream scour protection')],
  road: [L('Compacité des couches de chaussée', 'Pavement layer compaction'), L('Épaisseurs mises en œuvre', 'Layer thicknesses'), L('Déflexion (poutre Benkelman)', 'Deflection (Benkelman beam)'), L('Uni et dévers', 'Evenness and crossfall'), L('Assainissement latéral (fossés, exutoires)', 'Side drainage (ditches, outfalls)')],
  track: [L('Épaisseur et portance (CBR) de la couche de latérite', 'Laterite layer thickness and bearing (CBR)'), L('Profil en travers et bombement', 'Cross-section and camber'), L('Fossés et exutoires', 'Ditches and outfalls'), L('Franchissement des points critiques', 'Crossings at critical points')],
};
const worksChecks = (types) => {
  const keys = new Set(types.map((t) => (WORKS[t] ? t : /Dalot|Buse/.test(t) ? 'culvert' : /Piste/.test(t) ? 'track' : 'road')));
  return [...keys].flatMap((k) => WORKS[k]);
};
const CST = { todo: '#8A9BB0', ok: '#2E9E6B', res: '#E0A100', nc: '#D64545' };

const S = {
  fr: {
    intro: 'Chaque opération de travaux suit le cycle d’un projet financé par un bailleur, en sept étapes. Une étape ne peut être validée que si ses livrables sont fournis et si ses points de contrôle sont conformes ou levés.',
    ref: 'Points de contrôle indicatifs, à remplacer par le référentiel national (CCTP, normes, guides) lors du déploiement.',
    kProj: 'Projets suivis', kWorks: 'En travaux', kAmount: 'Montant des projets', kNc: 'Non-conformités et réserves ouvertes', kSteps: 'Étapes validées',
    byStep: 'Projets par étape en cours', progress: 'Avancement des projets (étapes validées)', newP: '+ Créer un projet',
    pName: 'Intitulé', pAssets: 'Ouvrages concernés (Ctrl ou Cmd pour en choisir plusieurs)', pStart: 'Démarrage', create: 'Créer', cancel: 'Annuler', errP: 'Donnez un intitulé et choisissez au moins un ouvrage.',
    step: 'Étape', deliv: 'Livrables attendus', checks: 'Points de contrôle qualité', status: 'Statut', note: 'Observation', by: 'Par',
    st: { todo: 'À contrôler', ok: 'Conforme', res: 'Réserve', nc: 'Non conforme' },
    validate: 'Valider l’étape', validated: (who, when) => `Étape validée par ${who} le ${when}`, blockers: 'Pour valider : ', missingD: (n) => `${n} livrable(s) manquant(s)`, openC: (n) => `${n} point(s) de contrôle non conforme(s) ou à contrôler`,
    noRight: 'Votre rôle ne permet pas de valider cette étape.', current: 'en cours', done: 'validée', future: 'à venir', planned: 'prévu',
    worksPct: 'Avancement physique des travaux', amount: 'Montant', assetsL: 'Ouvrages', histH: 'Historique du projet', noHist: 'Aucun événement.',
    closedAll: 'Projet clôturé : toutes les étapes sont validées.', rpNote: 'À la réception provisoire, la note d’état des ouvrages concernés est remise à 1 (Bon) dans le registre.',
    logValid: (st) => `Étape « ${st} » validée`, logCheck: (c, s1) => `Contrôle « ${c} » : ${s1}`, logDeliv: (d, on) => `Livrable « ${d} » ${on ? 'fourni' : 'retiré'}`, logPct: (p) => `Avancement des travaux porté à ${p} %`, logNew: (n) => `Projet créé : ${n}`,
    rpEdit: 'Réception provisoire des travaux : état remis à Bon', open: 'Ouvrir',
  },
  en: {
    intro: 'Each works operation follows the cycle of a funder-financed project, in seven steps. A step can only be validated when its deliverables are provided and its checkpoints are compliant or cleared.',
    ref: 'Indicative checkpoints, to be replaced by the national reference documents (specifications, standards, guides) at deployment.',
    kProj: 'Projects monitored', kWorks: 'Under works', kAmount: 'Project amount', kNc: 'Open non-conformities and snags', kSteps: 'Steps validated',
    byStep: 'Projects by current step', progress: 'Project progress (steps validated)', newP: '+ Create a project',
    pName: 'Title', pAssets: 'Assets concerned (Ctrl or Cmd to select several)', pStart: 'Start', create: 'Create', cancel: 'Cancel', errP: 'Give a title and select at least one asset.',
    step: 'Step', deliv: 'Expected deliverables', checks: 'Quality checkpoints', status: 'Status', note: 'Note', by: 'By',
    st: { todo: 'To check', ok: 'Compliant', res: 'Snag', nc: 'Non-compliant' },
    validate: 'Validate the step', validated: (who, when) => `Step validated by ${who} on ${when}`, blockers: 'To validate: ', missingD: (n) => `${n} missing deliverable(s)`, openC: (n) => `${n} checkpoint(s) non-compliant or to check`,
    noRight: 'Your role does not allow you to validate this step.', current: 'in progress', done: 'validated', future: 'upcoming', planned: 'planned',
    worksPct: 'Physical progress of works', amount: 'Amount', assetsL: 'Assets', histH: 'Project history', noHist: 'No event.',
    closedAll: 'Project closed: all steps are validated.', rpNote: 'At provisional acceptance, the condition rating of the assets concerned is reset to 1 (Good) in the register.',
    logValid: (st) => `Step “${st}” validated`, logCheck: (c, s1) => `Check “${c}”: ${s1}`, logDeliv: (d, on) => `Deliverable “${d}” ${on ? 'provided' : 'withdrawn'}`, logPct: (p) => `Works progress set to ${p}%`, logNew: (n) => `Project created: ${n}`,
    rpEdit: 'Provisional acceptance of works: condition reset to Good', open: 'Open',
  },
};

const addMonths = (ym, k) => { const [y, m] = ym.split('-').map(Number); const t = y * 12 + (m - 1) + k; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
function plan(start) { const out = []; let cur = start; for (const st of STEPS) { out.push(cur); cur = addMonths(cur, st.m); } out.push(cur); return out; }

function blankSteps(types) {
  return STEPS.map((st) => ({ d: st.deliv.map(() => false), c: (st.checks || worksChecks(types)).map(() => ({ s: 'todo', note: '' })), v: null }));
}
function seed(assets) {
  const byCode = Object.fromEntries(assets.map((a) => [a.code, a]));
  const mk = (id, name, codes, start, upto, partial) => {
    const types = codes.map((c) => (byCode[c] || {}).type).filter(Boolean);
    const steps = blankSteps(types);
    const dates = plan(start);
    for (let i = 0; i < upto; i++) {
      steps[i].d = steps[i].d.map(() => true);
      steps[i].c = steps[i].c.map(() => ({ s: 'ok', note: '' }));
      steps[i].v = { by: i % 2 ? 'Bureau de contrôle (fictif)' : 'Fatoumata Camara', when: `${dates[i + 1]}-15` };
    }
    if (partial) partial(steps[upto]);
    return { id, name, codes, start, step: upto, pct: 0, steps, hist: [] };
  };
  return [
    mk('P1', L('Réhabilitation du pont OA-01', 'Rehabilitation of bridge OA-01'), ['OA-01'], '2025-03', 4, (s) => {
      s.d = [true, true, true, false]; s.c = s.c.map((c, i) => ({ s: ['ok', 'ok', 'res', 'todo'][i] || 'todo', note: i === 2 ? 'Appareils d’appui posés avec un défaut de calage côté aval ; reprise demandée.' : '' }));
    }),
    mk('P2', L('Remplacement des buses OA-02 et OA-04 par des dalots', 'Replacing culverts OA-02 and OA-04 with box culverts'), ['OA-02', 'OA-04'], '2026-03', 2, (s) => {
      s.d = [true, true, false, false]; s.c = s.c.map((c, i) => ({ s: i === 1 ? 'nc' : 'todo', note: i === 1 ? 'Propriétés d’état et de coût absentes sur 6 éléments de la maquette.' : '' }));
    }),
    mk('P3', L('Renforcement de la section RN-03', 'Strengthening of road section RN-03'), ['RN-03'], '2025-12', 3, (s) => { s.d = [true, false, false, false]; }),
    mk('P4', L('Aménagement de la piste PR-07', 'Upgrading of rural track PR-07'), ['PR-07'], '2026-09', 0, (s) => { s.d = [true, true, false, false]; s.c[0] = { s: 'ok', note: '' }; }),
  ].map((p) => { if (p.id === 'P1') p.pct = 60; return p; });
}

export function createProjectBoard(el, ctx) {
  const { lang, esc, fmt, money, store, tv } = ctx;
  const s = (k) => S[lang()][k];
  const nm = (o) => o[lang()];
  let sel = null, viewStep = null, creating = false, tab = 'summary';
  const projects = () => { if (!store.state.projects) store.state.projects = seed(ctx.assets()); return store.state.projects; };
  const amountOf = (p) => p.codes.reduce((acc, c) => acc + ((ctx.assets().find((a) => a.code === c) || {}).cout || 0), 0);
  const checksOf = (p, i) => STEPS[i].checks || worksChecks(p.codes.map((c) => (ctx.assets().find((a) => a.code === c) || {}).type).filter(Boolean));
  const openIssues = (p) => p.steps.reduce((acc, st) => acc + st.c.filter((c) => c.s === 'nc' || c.s === 'res').length, 0);
  const validatedCount = (p) => p.steps.filter((x) => x.v).length;
  const blockers = (p, i) => {
    const st = p.steps[i]; const out = [];
    const md = st.d.filter((x) => !x).length; if (md) out.push(s('missingD')(md));
    const oc = st.c.filter((c) => c.s !== 'ok').length; if (oc) out.push(s('openC')(oc));
    return out;
  };
  const space = createSpace(ctx, { STEPS, plan, blockers: (p, i) => blockers(p, i), openIssues: (p) => openIssues(p), validatedCount: (p) => validatedCount(p), amountOf: (p) => amountOf(p) });
  const hist = (p, what) => { p.hist.push({ when: store.stamp(), who: store.me().name, what }); store.activity(p.id, what, 'project'); };

  function stepper(p, interactive) {
    const dates = plan(p.start);
    return `<ol class="pj-steps">${STEPS.map((st, i) => {
      const cls = p.steps[i].v ? 'is-done' : i === p.step ? 'is-cur' : '';
      const lab = p.steps[i].v ? s('done') : i === p.step ? s('current') : s('future');
      const inner = `<span class="pj-dot">${p.steps[i].v ? '✓' : i + 1}</span><span class="pj-sl">${esc(nm(st.n))}</span><span class="pj-sd mono">${dates[i]}</span>`;
      return `<li class="${cls}${interactive && viewStep === i ? ' is-view' : ''}" title="${esc(`${nm(st.n)} — ${lab}`)}">${interactive ? `<button type="button" data-step="${i}" aria-label="${esc(`${nm(st.n)} — ${lab}`)}">${inner}</button>` : inner}</li>`;
    }).join('')}</ol>`;
  }

  function portfolio() {
    const P = projects();
    const counts = STEPS.map((st, i) => P.filter((p) => p.step === i && !p.steps[i]?.v).length);
    const closed = P.filter((p) => validatedCount(p) === STEPS.length).length;
    const seqCol = ['#C9D7EF', '#A9BFE6', '#86A3DA', '#6286CC', '#3B5FC0', '#2D4A99', '#1F3570'];
    return kpis([
      { v: String(P.length), l: s('kProj') },
      { v: String(P.filter((p) => p.step === 4 && !p.steps[4].v).length), l: s('kWorks') },
      { v: money(P.reduce((acc, p) => acc + amountOf(p), 0)), l: s('kAmount') },
      { v: String(P.reduce((acc, p) => acc + openIssues(p), 0)), l: s('kNc'), tone: 'warn' },
      { v: `${P.reduce((acc, p) => acc + validatedCount(p), 0)} / ${P.length * STEPS.length}`, l: s('kSteps'), tone: 'ok' },
    ]) + `<div class="pf-grid">
      ${donut(s('byStep'), STEPS.map((st, i) => ({ label: nm(st.n), value: counts[i], color: seqCol[i], display: String(counts[i]) })).concat(closed ? [{ label: lang() === 'en' ? 'Closed' : 'Clôturés', value: closed, color: '#2E9E6B', display: String(closed) }] : []),
        { center: String(P.length), centerSub: lang() === 'en' ? 'projects' : 'projets', pctFmt: ctx.pct })}
      ${hbars(s('progress'), P.map((p) => ({ label: p.id, sub: nm(p.name), value: validatedCount(p), color: '#3B5FC0', display: `${validatedCount(p)} / ${STEPS.length}` })))}
    </div>`;
  }

  function list() {
    return `<div class="pj-list">${projects().map((p) => `<article class="pj-card${sel === p.id ? ' is-sel' : ''}">
      <header><b class="mono">${esc(p.id)}</b> <span>${esc(nm(p.name))}</span><button type="button" class="sg-link" data-open="${p.id}">${esc(s('open'))}</button></header>
      ${stepper(p, false)}
      <p class="pj-meta">${esc(s('assetsL'))} : ${p.codes.map((c) => `<button type="button" class="sg-link mono" data-go="${esc(c)}">${esc(c)}</button>`).join(' ')} · ${esc(s('amount'))} : <span class="mono">${esc(money(amountOf(p)))}</span>${openIssues(p) ? ` · <span class="pj-warn">${openIssues(p)} ${esc(s('st').nc.toLowerCase())} / ${esc(s('st').res.toLowerCase())}</span>` : ''}</p>
    </article>`).join('')}</div>`;
  }

  function detail() {
    const p = projects().find((x) => x.id === sel);
    if (!p) return '';
    if (viewStep == null) viewStep = Math.min(p.step, STEPS.length - 1);
    const i = viewStep, st = p.steps[i], def = STEPS[i];
    const canQ = store.can('checkQuality'), canP = store.can('manageProject'), canV = store.can('validateStep');
    const editable = !st.v && i <= p.step;
    const bl = blockers(p, i);
    const checks = checksOf(p, i);
    return `<section class="pj-detail" aria-label="${esc(nm(p.name))}">
      ${stepper(p, true)}
      ${validatedCount(p) === STEPS.length ? `<p class="pf-msg">${esc(s('closedAll'))}</p>` : ''}
      <div class="pj-cols">
        <div><h5 class="pl-h5">${esc(s('step'))} ${i + 1} — ${esc(nm(def.n))}</h5>
          <h5 class="pl-h5">${esc(s('deliv'))}</h5>
          <ul class="pj-deliv">${def.deliv.map((d, j) => `<li><label><input type="checkbox" data-deliv="${j}"${st.d[j] ? ' checked' : ''}${editable && (canP || canQ) ? '' : ' disabled'}> ${esc(nm(d))}</label></li>`).join('')}</ul>
          ${def.k === 'travaux' ? `<label class="sd-f pj-pct"><span class="bv-l">${esc(s('worksPct'))}</span><input type="range" min="0" max="100" step="5" value="${p.pct}" data-pct${editable && (canP || canQ) ? '' : ' disabled'}><b class="mono">${p.pct} %</b></label>` : ''}
          ${def.k === 'rp' ? `<p class="cc-note">${esc(s('rpNote'))}</p>` : ''}
        </div>
        <div><h5 class="pl-h5">${esc(s('checks'))}</h5>
          <table class="bv-table pf-table pj-checks"><thead><tr><th>${esc(s('checks'))}</th><th>${esc(s('status'))}</th><th>${esc(s('note'))}</th></tr></thead><tbody>
          ${checks.map((c, j) => `<tr><td class="pf-wrap">${esc(nm(c))}</td><td>${editable && canQ
            ? `<select data-check="${j}" aria-label="${esc(nm(c))}">${Object.keys(CST).map((k) => `<option value="${k}"${st.c[j].s === k ? ' selected' : ''}>${esc(s('st')[k])}</option>`).join('')}</select>`
            : `<span class="bv-badge" style="--c:${CST[st.c[j].s]}">${esc(s('st')[st.c[j].s])}</span>`}</td>
            <td>${editable && canQ ? `<input type="text" data-cnote="${j}" value="${esc(st.c[j].note)}" maxlength="200">` : esc(st.c[j].note || '—')}</td></tr>`).join('')}
          </tbody></table>
          <p class="cc-note">${esc(s('ref'))}</p>
        </div>
      </div>
      <div class="pj-valid">${st.v ? `<p class="pj-ok">✓ ${esc(s('validated')(st.v.by, st.v.when))}</p>`
        : i === p.step ? `${bl.length ? `<p class="pj-warn">${esc(s('blockers'))}${esc(bl.join(' ; '))}</p>` : ''}
          ${canV ? `<button type="button" class="btn btn-primary" data-validate${bl.length ? ' disabled' : ''}>${esc(s('validate'))}</button>` : `<p class="bv-muted">${esc(s('noRight'))}</p>`}` : ''}</div>
      <h5 class="pl-h5">${esc(s('histH'))}</h5>
      ${p.hist.length ? `<ul class="pj-hist">${p.hist.slice().reverse().slice(0, 12).map((h) => `<li><span class="mono">${esc(h.when)}</span> · ${esc(h.who)} · ${esc(h.what)}</li>`).join('')}</ul>` : `<p class="bv-muted">${esc(s('noHist'))}</p>`}
    </section>`;
  }

  function createForm() {
    if (!creating) return '';
    const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `<section class="pl-form"><h4 class="bv-h">${esc(s('newP').replace('+ ', ''))}</h4><div class="pl-fields">
      <label class="sd-f"><span class="bv-l">${esc(s('pName'))}</span><input type="text" data-np="name" maxlength="90"></label>
      <label class="sd-f"><span class="bv-l">${esc(s('pStart'))}</span><input type="month" data-np="start" value="${ym}"></label>
      <label class="sd-f pj-multi"><span class="bv-l">${esc(s('pAssets'))}</span><select multiple size="6" data-np="codes">${ctx.ranked().map((a) => `<option value="${esc(a.code)}">${esc(a.code)} — ${esc(tv(a.type))}${a.funded ? ' ✓' : ''}</option>`).join('')}</select></label>
      <p class="pl-err" data-perr role="alert"></p>
      <div class="sd-actions"><button type="button" class="sg-link" data-act="pcancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-act="pcreate">${esc(s('create'))}</button></div></div></section>`;
  }

  function workspace(p) {
    const T = space.tabs(), n = space.counts(p);
    const cur = Math.min(p.step, STEPS.length - 1);
    return `<div class="ps">
      <header class="ps-head"><button type="button" class="sg-link" data-ps-back>${esc(space.label('back'))}</button>
        <div class="ps-title"><span class="ps-id mono">${esc(p.id)}</span><h2>${esc(nm(p.name))}</h2></div>
        <p class="ps-meta">${esc(s('assetsL'))} : ${p.codes.map((c) => `<button type="button" class="sg-link mono" data-go="${esc(c)}">${esc(c)}</button>`).join(' ')} · ${esc(s('step'))} ${cur + 1}/${STEPS.length} — ${esc(nm(STEPS[cur].n))} · ${esc(s('amount'))} <span class="mono">${esc(money(amountOf(p)))}</span>
          · <button type="button" class="sg-link" data-ps-map>${esc(space.label('onMap'))}</button></p>
        ${stepper(p, false)}</header>
      <nav class="ps-tabs" role="tablist">${SPACE_TABS.map((k) => `<button type="button" role="tab" aria-selected="${tab === k}" class="${tab === k ? 'is-on' : ''}" data-ps-tab="${k}">${esc(T[k])}${n[k] ? ` <span>${n[k]}</span>` : ''}</button>`).join('')}</nav>
      <div class="ps-body">${tab === 'quality' ? detail() : space.body(tab, p)}</div></div>`;
  }

  function render() {
    projects();
    const p = sel && projects().find((x) => x.id === sel);
    if (p) { el.innerHTML = workspace(p); space.after(el, p, tab); return; }
    space.leave();
    el.innerHTML = `${userStrip(store, lang, esc, ['manageProject', 'validateStep', 'checkQuality'])}
      <p class="sd-intro">${esc(s('intro'))}</p>
      ${portfolio()}
      <div class="pl-bar sd-h">${store.can('manageProject') ? `<button type="button" class="btn btn-primary" data-act="new">${esc(s('newP'))}</button>` : ''}</div>
      ${createForm()}${list()}`;
  }
  const rerender = (t) => { if (t) tab = t; render(); };
  const commit = () => store.commit('projects');

  el.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'); if (go) { ctx.focus(go.dataset.go); return; }
    const op = e.target.closest('[data-open]');
    if (op) { sel = op.dataset.open; viewStep = null; tab = 'summary'; render(); el.scrollIntoView?.({ block: 'start' }); return; }
    if (e.target.closest('[data-ps-back]')) { sel = null; render(); return; }
    if (e.target.closest('[data-ps-map]')) { ctx.focusProject(sel); return; }
    const tb = e.target.closest('[data-ps-tab]'); if (tb) { tab = tb.dataset.psTab; render(); return; }
    const cp = sel && projects().find((x) => x.id === sel);
    if (cp && space.onClick(e, cp, el, rerender)) return;
    const sb = e.target.closest('[data-step]'); if (sb) { viewStep = Number(sb.dataset.step); render(); return; }
    if (e.target.closest('[data-validate]')) {
      const p = projects().find((x) => x.id === sel);
      const i = p.step;
      p.steps[i].v = { by: store.me().name, when: store.stamp() };
      hist(p, s('logValid')(nm(STEPS[i].n)));
      if (STEPS[i].k === 'rp') for (const c of p.codes) ctx.resetCondition(c, s('rpEdit'));
      if (i < STEPS.length - 1) { p.step = i + 1; viewStep = p.step; }
      commit(); return;
    }
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'new') { creating = true; render(); }
    else if (b.dataset.act === 'pcancel') { creating = false; render(); }
    else if (b.dataset.act === 'pcreate') {
      const name = el.querySelector('[data-np=name]').value.trim();
      const codes = [...el.querySelector('[data-np=codes]').selectedOptions].map((o) => o.value);
      const start = el.querySelector('[data-np=start]').value || '2026-12';
      if (!name || !codes.length) { el.querySelector('[data-perr]').textContent = s('errP'); return; }
      const types = codes.map((c) => ctx.assets().find((a) => a.code === c).type);
      const id = `P${projects().length + 1}`;
      const p = { id, name: { fr: name, en: name }, codes, start, step: 0, pct: 0, steps: blankSteps(types), hist: [] };
      projects().push(p); hist(p, s('logNew')(name));
      creating = false; sel = id; viewStep = 0; tab = 'summary'; commit();
    }
  });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-user]')) { store.setUser(e.target.value); return; }
    const p = projects().find((x) => x.id === sel); if (!p) return;
    if (space.onChange(e, p, el, rerender)) return;
    const st = p.steps[viewStep];
    if (e.target.dataset.deliv != null) {
      const j = Number(e.target.dataset.deliv); st.d[j] = e.target.checked;
      hist(p, s('logDeliv')(nm(STEPS[viewStep].deliv[j]), e.target.checked)); commit();
    } else if (e.target.dataset.check != null) {
      const j = Number(e.target.dataset.check); st.c[j].s = e.target.value;
      hist(p, s('logCheck')(nm(checksOf(p, viewStep)[j]), s('st')[e.target.value])); commit();
    } else if (e.target.dataset.cnote != null) {
      st.c[Number(e.target.dataset.cnote)].note = e.target.value; commit();
    } else if (e.target.hasAttribute('data-pct')) {
      p.pct = Number(e.target.value); hist(p, s('logPct')(p.pct)); commit();
    }
  });
  el.addEventListener('input', (e) => { if (e.target.hasAttribute('data-pct')) e.target.nextElementSibling.textContent = `${e.target.value} %`; });
  return {
    render, ensure: projects, leave: () => space.leave(),
    open(id, t = 'summary', ver = null) { sel = id; viewStep = null; tab = SPACE_TABS.includes(t) ? t : 'summary'; if (ver) space.setVersion(ver); render(); },
  };
}

