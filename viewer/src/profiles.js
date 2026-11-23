// GIN²CO — dashboards by user profile (minister, owner, technician, funder, auditor)
import { kpis, donut, hbars, histogram, stacked } from './charts.js';

const P = {
  fr: {
    intro: 'Chaque profil voit les mêmes données sous l’angle de ses décisions. Les chiffres suivent les réglages de la carte (pondération et enveloppe).',
    pick: 'Profil',
    profiles: {
      ministre: ['Ministre', 'Vue stratégique : état du patrimoine, coût de l’inaction, effet du budget'],
      mo: ['Maître d’ouvrage', 'Programmation : enveloppe, ouvrages retenus, sources de financement'],
      tech: ['Technicien', 'État technique : notes, coupures, efficacité, compléments à prévoir'],
      bailleur: ['Bailleur', 'Bancabilité : rendement des travaux, bénéficiaires, besoins complémentaires'],
      audit: ['Auditeur', 'Contrôle : cohérence et complétude des données, ancienneté des inspections, journal'],
    },
    assets: 'Ouvrages suivis', need: 'Besoin de remise en état', inaction: 'Coût annuel de l’inaction', critical: 'Ouvrages critiques',
    prog: 'Programme actuel', avoided: 'Inaction évitée par le programme (par an)', perYear: '/ an', funded: 'financés', ofTotal: 'du total',
    msgMin: (n, b, p, v) => `Avec une enveloppe de ${b}, ${n} ouvrages sur 25 sont remis en état. Ils suppriment ${p} du coût annuel de l’inaction, soit ${v} par an.`,
    donutEtat: 'État du patrimoine (nombre d’ouvrages)', donutVerdict: 'Verdict après analyse d’impact', inactionFam: 'Coût annuel de l’inaction par famille',
    effNet: 'Efficacité moyenne du réseau', effNow: 'Aujourd’hui', effAfter: 'Après le programme', effNote: 'Moyenne des efficacités des 25 ouvrages ; les ouvrages financés passent à leur efficacité après travaux.',
    top5: 'Cinq premières priorités', rank: 'Rang', code: 'Code', asset: 'Ouvrage', cond: 'État', cost: 'Coût', fundedQ: 'Financé', yes: 'oui', no: 'non',
    envelope: 'Enveloppe', committed: 'Montant engagé', left: 'Reliquat', nFunded: 'Ouvrages financés', comp: 'Compléments à prévoir', critOut: 'Critiques hors enveloppe',
    histScore: 'Répartition des scores', inEnv: 'Financé', outEnv: 'Hors enveloppe', costFam: 'Besoin par famille : financé et hors enveloppe',
    finDonut: 'Sources de financement envisagées (montant)', progTable: 'Programme de travaux', cum: 'Cumul', verdict: 'Verdict', source: 'Financement',
    noteAvg: 'Note d’état moyenne', closure: 'Jours de coupure cumulés', effAvg: 'Efficacité moyenne actuelle', toComplete: 'Ouvrages à compléter', oldInsp: 'Inspections de plus de 6 mois',
    etatFam: 'État par famille (nombre d’ouvrages)', histEff: 'Efficacité actuelle des ouvrages', topClosure: 'Jours de coupure par an (8 ouvrages les plus touchés)',
    compTable: 'Ouvrages à compléter : ce que la remise en état ne règle pas', effCol: 'Efficacité actuelle → après', compCol: 'Complément', compCost: 'Coût du complément',
    yieldPark: 'Rendement du parc', yieldProg: 'Rendement du programme', hhLinked: 'Ménages agricoles reliés (programme)', compAll: 'Investissement complémentaire', shareDonor: 'Part « bailleur » du besoin',
    yieldSub: 'inaction évitée par an pour 1 engagé', yieldParkSub: 'coût annuel de l’inaction pour 1 de travaux', hhSub: 'cumul par ouvrage financé', histYield: 'Rendement des ouvrages (inaction annuelle ÷ coût des travaux)', inactionProgFam: 'Inaction évitée par famille (programme)',
    topYield: 'Cinq meilleurs rendements', yieldCol: 'Rendement', inactCol: 'Inaction / an',
    yieldNote: 'Le rendement donne un ordre de grandeur de l’utilité de la dépense. Ce n’est pas une rentabilité financière.',
    completeness: 'Complétude des données', checksOk: 'Contrôles de cohérence', recent: 'Inspections de moins de 12 mois', ageAvg: 'Ancienneté moyenne des inspections', changes: 'Modifications enregistrées', status: 'Statut des données', fictitious: 'Fictives',
    months: 'mois', checksH: 'Contrôles automatiques', check: 'Contrôle', rule: 'Règle', result: 'Résultat', anomalies: 'Anomalies', none: 'aucune',
    histAge: 'Ancienneté des inspections (mois)', donutChecks: 'Résultat des contrôles (ouvrage × contrôle)', conform: 'Conformes', anomaly: 'Anomalies',
    logH: 'Journal des modifications', logEmpty: 'Aucune modification enregistrée dans ce navigateur.', when: 'Date', who: 'Auteur', what: 'Modification',
    checks: [
      ['Note et état', 'note de 1 à 4 et libellé d’état cohérent'],
      ['Coût', 'coût de remise en état positif'],
      ['Coût de l’inaction', 'valeur positive ou nulle'],
      ['Efficacités', 'efficacité actuelle ≤ efficacité après travaux'],
      ['Verdict', 'conforme au seuil de 85 %'],
      ['Complément', 'chiffré pour chaque ouvrage « à compléter »'],
      ['Localisation', 'coordonnées dans l’emprise de la zone'],
      ['Inspection', 'date renseignée et non future'],
      ['Financement', 'source envisagée renseignée'],
    ],
  },
  en: {
    intro: 'Each profile sees the same data through the lens of its own decisions. Figures follow the map settings (weighting and envelope).',
    pick: 'Profile',
    profiles: {
      ministre: ['Minister', 'Strategic view: asset condition, cost of inaction, effect of the budget'],
      mo: ['Asset owner', 'Programming: envelope, selected assets, funding sources'],
      tech: ['Technician', 'Technical condition: ratings, closures, efficiency, complements needed'],
      bailleur: ['Funder', 'Bankability: return on works, beneficiaries, further needs'],
      audit: ['Auditor', 'Control: data consistency and completeness, inspection age, change log'],
    },
    assets: 'Assets monitored', need: 'Rehabilitation need', inaction: 'Annual cost of inaction', critical: 'Critical assets',
    prog: 'Current programme', avoided: 'Inaction avoided by the programme (per year)', perYear: '/ yr', funded: 'funded', ofTotal: 'of total',
    msgMin: (n, b, p, v) => `With an envelope of ${b}, ${n} of 25 assets are rehabilitated. They remove ${p} of the annual cost of inaction, i.e. ${v} per year.`,
    donutEtat: 'Asset condition (number of assets)', donutVerdict: 'Verdict after impact analysis', inactionFam: 'Annual cost of inaction by family',
    effNet: 'Average network efficiency', effNow: 'Today', effAfter: 'After the programme', effNote: 'Average efficiency of the 25 assets; funded assets move to their post-works efficiency.',
    top5: 'Top five priorities', rank: 'Rank', code: 'Code', asset: 'Asset', cond: 'Condition', cost: 'Cost', fundedQ: 'Funded', yes: 'yes', no: 'no',
    envelope: 'Envelope', committed: 'Amount committed', left: 'Remaining', nFunded: 'Assets funded', comp: 'Complements needed', critOut: 'Critical assets outside envelope',
    histScore: 'Score distribution', inEnv: 'Funded', outEnv: 'Outside envelope', costFam: 'Need by family: funded and outside envelope',
    finDonut: 'Intended funding sources (amount)', progTable: 'Works programme', cum: 'Cumulative', verdict: 'Verdict', source: 'Funding',
    noteAvg: 'Average condition rating', closure: 'Total closure days', effAvg: 'Average current efficiency', toComplete: 'Assets to complement', oldInsp: 'Inspections older than 6 months',
    etatFam: 'Condition by family (number of assets)', histEff: 'Current efficiency of assets', topClosure: 'Closure days per year (8 most affected assets)',
    compTable: 'Assets to complement: what rehabilitation does not solve', effCol: 'Efficiency current → after', compCol: 'Complement', compCost: 'Complement cost',
    yieldPark: 'Portfolio return', yieldProg: 'Programme return', hhLinked: 'Farm households linked (programme)', compAll: 'Further investment', shareDonor: '“Funder” share of need',
    yieldSub: 'inaction avoided per year per 1 committed', yieldParkSub: 'annual cost of inaction per 1 of works', hhSub: 'sum over funded assets', histYield: 'Asset return (annual inaction ÷ works cost)', inactionProgFam: 'Inaction avoided by family (programme)',
    topYield: 'Five best returns', yieldCol: 'Return', inactCol: 'Inaction / yr',
    yieldNote: 'Return gives an order of magnitude of the usefulness of spending. It is not a financial rate of return.',
    completeness: 'Data completeness', checksOk: 'Consistency checks', recent: 'Inspections under 12 months', ageAvg: 'Average inspection age', changes: 'Recorded changes', status: 'Data status', fictitious: 'Fictitious',
    months: 'months', checksH: 'Automatic checks', check: 'Check', rule: 'Rule', result: 'Result', anomalies: 'Anomalies', none: 'none',
    histAge: 'Inspection age (months)', donutChecks: 'Check results (asset × check)', conform: 'Compliant', anomaly: 'Anomalies',
    logH: 'Change log', logEmpty: 'No change recorded in this browser.', when: 'Date', who: 'Author', what: 'Change',
    checks: [
      ['Rating and condition', 'rating 1 to 4 with matching condition label'],
      ['Cost', 'positive rehabilitation cost'],
      ['Cost of inaction', 'zero or positive value'],
      ['Efficiencies', 'current efficiency ≤ post-works efficiency'],
      ['Verdict', 'consistent with the 85% threshold'],
      ['Complement', 'costed for every asset “to complement”'],
      ['Location', 'coordinates inside the area'],
      ['Inspection', 'date filled in and not in the future'],
      ['Funding', 'intended source filled in'],
    ],
  },
};
const ORDER = ['ministre', 'mo', 'tech', 'bailleur', 'audit'];
const NOTE_ETAT = { 1: 'Bon', 2: 'Moyen', 3: 'Dégradé', 4: 'Critique' };
const BLUE = '#3B5FC0', GREY = '#C3CEDC';

export function createProfileBoard(el, ctx) {
  const { lang, tv, money, fmt, pct, esc, Z, ETAT_C, VERDICT_C } = ctx;
  const s = (k) => P[lang()][k];
  const nf = (x, d = 1) => new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);
  const pf = (x) => pct(x);
  let cur = 'ministre';
  const kpiOf = (a, re) => (a.impact.kpis || []).find((k) => re.test(k.fr));
  const monthsSince = (ym) => { if (!ym) return null; const [y, m] = ym.split('-').map(Number); const d = new Date(); return (d.getFullYear() * 12 + d.getMonth() + 1) - (y * 12 + m); };
  const sum = (arr, g) => arr.reduce((acc, x) => acc + g(x), 0);
  const famList = () => Object.keys(ctx.FAM_C());

  function header() {
    return `<p class="sd-intro">${esc(s('intro'))}</p>
      <div class="pf-pick" role="radiogroup" aria-label="${esc(s('pick'))}">${ORDER.map((k) => `
        <button type="button" role="radio" aria-checked="${k === cur}" class="pf-chip${k === cur ? ' is-on' : ''}" data-pf="${k}">
          <b>${esc(s('profiles')[k][0])}</b><span>${esc(s('profiles')[k][1])}</span></button>`).join('')}</div>`;
  }

  function table(head, rows) {
    return `<div class="bv-table-wrap sd-wrap"><table class="bv-table pf-table"><thead><tr>${head.map((h) => `<th${h[1] ? ' class="num"' : ''}>${esc(h[0])}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>`;
  }
  const badge = (txt, col) => `<span class="bv-badge" style="--c:${col}">${esc(tv(txt))}</span>`;
  const codeBtn = (c) => `<button type="button" class="sg-link mono" data-go="${esc(c)}">${esc(c)}</button>`;

  function base() {
    const R = ctx.ranked();
    const f = R.filter((a) => a.funded);
    const total = sum(R, (a) => a.cout), inact = sum(R, (a) => a.inaction);
    const committed = sum(f, (a) => a.cout), avoided = sum(f, (a) => a.inaction);
    return { R, f, total, inact, committed, avoided, budget: ctx.budget() };
  }

  const views = {
    ministre() {
      const { R, f, total, inact, committed, avoided, budget } = base();
      const crit = R.filter((a) => a.note === 4).length;
      const effNow = sum(R, (a) => a.impact.eff) / R.length;
      const effAfter = sum(R, (a) => (a.funded ? a.impact.eff_rehab : a.impact.eff)) / R.length;
      const fam = famList();
      return kpis([
        { v: String(R.length), l: s('assets') },
        { v: money(total), l: s('need') },
        { v: money(inact), l: s('inaction'), tone: 'warn' },
        { v: `${crit}`, l: s('critical'), s: `${pf(crit / R.length)} ${s('ofTotal')}`, tone: 'alert' },
        { v: `${f.length} ${s('funded')}`, l: s('prog'), s: money(committed) },
        { v: money(avoided), l: s('avoided'), s: `${pf(avoided / inact)} ${s('ofTotal')}`, tone: 'ok' },
      ]) + `<p class="pf-msg">${esc(s('msgMin')(f.length, money(budget), pf(avoided / inact), money(avoided)))}</p>
      <div class="pf-grid">
        ${donut(s('donutEtat'), ['Bon', 'Moyen', 'Dégradé', 'Critique'].map((k) => ({ label: tv(k), value: R.filter((a) => a.etat === k).length, color: ETAT_C[k] })), { center: String(R.length), centerSub: lang() === 'en' ? 'assets' : 'ouvrages', pctFmt: pf })}
        ${donut(s('donutVerdict'), ['Suffisant', 'À renforcer', 'À compléter'].map((k) => ({ label: tv(k), value: R.filter((a) => a.impact.verdict === k).length, color: VERDICT_C[k] })), { center: String(R.length), centerSub: lang() === 'en' ? 'assets' : 'ouvrages', pctFmt: pf })}
        ${hbars(s('inactionFam'), fam.map((k) => { const v = sum(R.filter((a) => a.famille === k), (a) => a.inaction); return { label: tv(k), value: v, color: ctx.FAM_C()[k], display: money(v) }; }))}
        ${hbars(s('effNet'), [{ label: s('effNow'), value: effNow, color: GREY, display: pf(effNow) }, { label: s('effAfter'), value: effAfter, color: BLUE, display: pf(effAfter) }], { note: s('effNote') })}
      </div>
      <h4 class="bv-h sd-h">${esc(s('top5'))}</h4>
      ${table([[s('rank'), 1], [s('code')], [s('asset')], [s('cond')], [`${s('cost')} (${Z.cur})`, 1], [s('fundedQ')]],
        R.slice(0, 5).map((a) => `<tr><td class="num mono">${a.rank}</td><td>${codeBtn(a.code)}</td><td>${esc(tv(a.type))}</td><td>${badge(a.etat, ETAT_C[a.etat])}</td><td class="num mono">${fmt(a.cout)}</td><td>${a.funded ? `✓ ${s('yes')}` : s('no')}</td></tr>`))}`;
    },
    mo() {
      const { R, f, committed, budget } = base();
      const comp = f.filter((a) => a.impact.complement);
      const fam = famList();
      const bins = [0, 10, 20, 30, 40, 50, 60, 70];
      const binOf = (sc) => Math.min(bins.length - 2, Math.floor(sc / 10));
      const finC = ctx.FIN_C();
      return kpis([
        { v: money(budget), l: s('envelope') },
        { v: money(committed), l: s('committed') },
        { v: money(budget - committed), l: s('left') },
        { v: `${f.length} / ${R.length}`, l: s('nFunded') },
        { v: `${comp.length} · ${money(sum(comp, (a) => a.impact.complement.cost))}`, l: s('comp'), tone: 'warn' },
        { v: String(R.filter((a) => a.note === 4 && !a.funded).length), l: s('critOut'), tone: 'alert' },
      ]) + `<div class="pf-grid">
        ${histogram(s('histScore'), bins.slice(0, -1).map((b, i) => ({ label: `${b}–${bins[i + 1] - 1}`, parts: [
          { label: s('inEnv'), value: R.filter((a) => a.funded && binOf(a.score) === i).length, color: BLUE },
          { label: s('outEnv'), value: R.filter((a) => !a.funded && binOf(a.score) === i).length, color: GREY }] })), { legend: [{ label: s('inEnv'), color: BLUE }, { label: s('outEnv'), color: GREY }] })}
        ${stacked(s('costFam'), fam.map((k) => {
          const xs = R.filter((a) => a.famille === k); const fi = sum(xs.filter((a) => a.funded), (a) => a.cout); const nf_ = sum(xs.filter((a) => !a.funded), (a) => a.cout);
          return { label: tv(k), display: money(fi + nf_), parts: [{ label: s('inEnv'), value: fi, color: BLUE, display: money(fi) }, { label: s('outEnv'), value: nf_, color: GREY, display: money(nf_) }] };
        }), [{ label: s('inEnv'), color: BLUE }, { label: s('outEnv'), color: GREY }])}
        ${donut(s('finDonut'), Object.keys(finC).map((k) => { const v = sum(R.filter((a) => a.financement === k), (a) => a.cout); return { label: tv(k), value: v, color: finC[k], display: money(v) }; }), { center: money(sum(R, (a) => a.cout)).split(' ')[0], centerSub: `${Z.sfx[lang() === 'en' ? 1 : 0]} ${Z.cur}`, pctFmt: pf })}
      </div>
      <h4 class="bv-h sd-h">${esc(s('progTable'))}</h4>
      ${table([[s('rank'), 1], [s('code')], [s('asset')], [s('verdict')], [`${s('cost')} (${Z.cur})`, 1], [`${s('cum')} (${Z.cur})`, 1], [s('source')]],
        f.map((a) => `<tr><td class="num mono">${a.rank}</td><td>${codeBtn(a.code)}</td><td>${esc(tv(a.type))}</td><td>${badge(a.impact.verdict, VERDICT_C[a.impact.verdict])}</td><td class="num mono">${fmt(a.cout)}</td><td class="num mono">${fmt(a.cum)}</td><td>${esc(tv(a.financement))}</td></tr>`))}`;
    },
    tech() {
      const { R } = base();
      const fam = famList();
      const closure = (a) => (kpiOf(a, /^Jours de coupure/) || {}).v || 0;
      const toc = R.filter((a) => a.impact.verdict === 'À compléter');
      const effBins = [[0, 0.4, '< 40 %', '#D64545'], [0.4, 0.6, '40–59 %', '#E07A3F'], [0.6, 0.85, '60–84 %', '#E0A100'], [0.85, 1.01, '≥ 85 %', '#2E9E6B']];
      const top = [...R].sort((x, y) => closure(y) - closure(x)).slice(0, 8);
      return kpis([
        { v: `${nf(sum(R, (a) => a.note) / R.length)} / 4`, l: s('noteAvg') },
        { v: String(R.filter((a) => a.note >= 3).length), l: `${tv('Dégradé')} + ${tv('Critique')}`, tone: 'alert' },
        { v: fmt(sum(R, closure)), l: s('closure'), s: lang() === 'en' ? 'days per year' : 'jours par an', tone: 'warn' },
        { v: pf(sum(R, (a) => a.impact.eff) / R.length), l: s('effAvg') },
        { v: String(toc.length), l: s('toComplete') },
        { v: String(R.filter((a) => (monthsSince(a.inspection) ?? 99) > 6).length), l: s('oldInsp') },
      ]) + `<div class="pf-grid">
        ${stacked(s('etatFam'), fam.map((k) => ({ label: tv(k), parts: ['Bon', 'Moyen', 'Dégradé', 'Critique'].map((e_) => ({ label: tv(e_), value: R.filter((a) => a.famille === k && a.etat === e_).length, color: ETAT_C[e_] })) })),
          ['Bon', 'Moyen', 'Dégradé', 'Critique'].map((e_) => ({ label: tv(e_), color: ETAT_C[e_] })))}
        ${histogram(s('histEff'), effBins.map(([lo, hi, lab, col]) => ({ label: lab, parts: [{ label: lab, value: R.filter((a) => a.impact.eff >= lo && a.impact.eff < hi).length, color: col }] })))}
        ${hbars(s('topClosure'), top.map((a) => ({ label: a.code, sub: tv(a.type), value: closure(a), color: ETAT_C[a.etat], display: `${closure(a)} ${lang() === 'en' ? 'd' : 'j'}` })))}
      </div>
      <h4 class="bv-h sd-h">${esc(s('compTable'))}</h4>
      ${table([[s('code')], [s('asset')], [s('cond')], [s('effCol')], [s('compCol')], [`${s('compCost')} (${Z.cur})`, 1]],
        toc.map((a) => `<tr><td>${codeBtn(a.code)}</td><td>${esc(tv(a.type))}</td><td>${badge(a.etat, ETAT_C[a.etat])}</td><td class="mono">${nf(a.impact.eff * 100)} % → ${nf(a.impact.eff_rehab * 100)} %</td><td class="pf-wrap">${esc(a.impact.complement ? a.impact.complement[lang()] : '—')}</td><td class="num mono">${a.impact.complement ? fmt(a.impact.complement.cost) : '—'}</td></tr>`))}`;
    },
    bailleur() {
      const { R, f, total, inact, committed, avoided } = base();
      const y = (a) => a.inaction / a.cout;
      const fam = famList();
      const yb = [[0, 1, '< 1'], [1, 2, '1–2'], [2, 5, '2–5'], [5, 10, '5–10'], [10, 1e9, '≥ 10']];
      const finC = ctx.FIN_C();
      const donor = sum(R.filter((a) => /Bailleur/.test(a.financement)), (a) => a.cout);
      return kpis([
        { v: `${nf(inact / total)} ×`, l: s('yieldPark'), s: s('yieldParkSub') },
        { v: `${nf(committed ? avoided / committed : 0)} ×`, l: s('yieldProg'), s: s('yieldSub'), tone: 'ok' },
        { v: money(avoided), l: s('avoided') },
        { v: fmt(Math.round(sum(f, (a) => a.impact.hh || 0) / 10) * 10), l: s('hhLinked'), s: s('hhSub') },
        { v: money(sum(R.filter((a) => a.impact.complement), (a) => a.impact.complement.cost)), l: s('compAll'), tone: 'warn' },
        { v: pf(donor / total), l: s('shareDonor'), s: money(donor) },
      ]) + `<div class="pf-grid">
        ${histogram(s('histYield'), yb.map(([lo, hi, lab]) => ({ label: lab, parts: [
          { label: s('inEnv'), value: R.filter((a) => a.funded && y(a) >= lo && y(a) < hi).length, color: BLUE },
          { label: s('outEnv'), value: R.filter((a) => !a.funded && y(a) >= lo && y(a) < hi).length, color: GREY }] })), { legend: [{ label: s('inEnv'), color: BLUE }, { label: s('outEnv'), color: GREY }], note: s('yieldNote') })}
        ${donut(s('finDonut'), Object.keys(finC).map((k) => { const v = sum(R.filter((a) => a.financement === k), (a) => a.cout); return { label: tv(k), value: v, color: finC[k], display: money(v) }; }), { center: money(total).split(' ')[0], centerSub: `${Z.sfx[lang() === 'en' ? 1 : 0]} ${Z.cur}`, pctFmt: pf })}
        ${hbars(s('inactionProgFam'), fam.map((k) => { const v = sum(f.filter((a) => a.famille === k), (a) => a.inaction); return { label: tv(k), value: v, color: ctx.FAM_C()[k], display: money(v) }; }))}
      </div>
      <h4 class="bv-h sd-h">${esc(s('topYield'))}</h4>
      ${table([[s('code')], [s('asset')], [`${s('cost')} (${Z.cur})`, 1], [`${s('inactCol')} (${Z.cur})`, 1], [s('yieldCol'), 1], [s('fundedQ')]],
        [...R].sort((a, b) => y(b) - y(a)).slice(0, 5).map((a) => `<tr><td>${codeBtn(a.code)}</td><td>${esc(tv(a.type))}</td><td class="num mono">${fmt(a.cout)}</td><td class="num mono">${fmt(a.inaction)}</td><td class="num mono">${nf(y(a))} ×</td><td>${a.funded ? `✓ ${s('yes')}` : s('no')}</td></tr>`))}`;
    },
    audit() {
      const { R } = base();
      const [[bs, bw], [bn, be]] = ctx.bounds;
      const now = new Date(); const ym = now.getFullYear() * 12 + now.getMonth() + 1;
      const rules = [
        (a) => [1, 2, 3, 4].includes(a.note) && NOTE_ETAT[a.note] === a.etat,
        (a) => a.cout > 0,
        (a) => a.inaction >= 0,
        (a) => a.impact.eff <= a.impact.eff_rehab + 1e-9,
        (a) => a.impact.verdict === (a.impact.eff >= 0.85 ? 'Suffisant' : a.impact.eff_rehab >= 0.85 ? 'À renforcer' : 'À compléter'),
        (a) => a.impact.verdict !== 'À compléter' || (a.impact.complement && a.impact.complement.cost > 0),
        (a) => a.lat >= bs && a.lat <= bn && a.lon >= bw && a.lon <= be,
        (a) => !!a.inspection && (() => { const [y_, m] = a.inspection.split('-').map(Number); return y_ * 12 + m <= ym; })(),
        (a) => !!a.financement,
      ];
      const res = rules.map((r) => R.filter((a) => !r(a)).map((a) => a.code));
      const totalChecks = rules.length * R.length;
      const bad = res.reduce((acc, x) => acc + x.length, 0);
      const fields = ['code', 'type', 'famille', 'lat', 'lon', 'note', 'etat', 'cout', 'tmja', 'pop', 'flood', 'sol', 'inspection', 'financement'];
      const filled = sum(R, (a) => fields.filter((k) => a[k] !== null && a[k] !== undefined && a[k] !== '').length);
      const ages = R.map((a) => monthsSince(a.inspection)).filter((x) => x != null);
      const ageBins = [[0, 3, '0–3'], [4, 6, '4–6'], [7, 9, '7–9'], [10, 12, '10–12'], [13, 999, '> 12']];
      const log = ctx.getLog();
      return kpis([
        { v: pf(filled / (fields.length * R.length)), l: s('completeness') },
        { v: `${rules.length - res.filter((x) => x.length).length} / ${rules.length}`, l: s('checksOk'), tone: bad ? 'warn' : 'ok' },
        { v: `${ages.filter((x) => x <= 12).length} / ${R.length}`, l: s('recent') },
        { v: `${nf(sum(ages, (x) => x) / Math.max(1, ages.length))} ${s('months')}`, l: s('ageAvg') },
        { v: String(log.length), l: s('changes') },
        { v: s('fictitious'), l: s('status'), tone: 'warn' },
      ]) + `<div class="pf-grid">
        ${donut(s('donutChecks'), [{ label: s('conform'), value: totalChecks - bad, color: '#2E9E6B', display: fmt(totalChecks - bad) }, { label: s('anomaly'), value: bad, color: '#D64545', display: fmt(bad) }], { center: fmt(totalChecks), centerSub: lang() === 'en' ? 'checks' : 'contrôles', pctFmt: pf })}
        ${histogram(s('histAge'), ageBins.map(([lo, hi, lab]) => ({ label: lab, parts: [{ label: lab, value: ages.filter((x) => x >= lo && x <= hi).length, color: hi > 12 ? '#D64545' : BLUE }] })))}
      </div>
      <h4 class="bv-h sd-h">${esc(s('checksH'))}</h4>
      ${table([[s('check')], [s('rule')], [s('result'), 1], [s('anomalies')]],
        s('checks').map(([c, r], i) => `<tr><td>${esc(c)}</td><td>${esc(r)}</td><td class="num mono">${R.length - res[i].length} / ${R.length}${res[i].length ? '' : ' ✓'}</td><td>${res[i].length ? res[i].map(codeBtn).join(' ') : esc(s('none'))}</td></tr>`))}
      <h4 class="bv-h sd-h">${esc(s('logH'))}</h4>
      ${log.length ? table([[s('when')], [s('who')], [s('code')], [s('what')]], log.slice().reverse().slice(0, 50).map((l) => `<tr><td class="mono">${esc(l.when)}</td><td>${esc(l.who)}</td><td>${codeBtn(l.code)}</td><td>${esc(l.what)}</td></tr>`))
        : `<p class="bv-muted">${esc(s('logEmpty'))}</p>`}`;
    },
  };

  function render() {
    el.innerHTML = `${header()}<div class="pf-view">${views[cur]()}</div>`;
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pf]');
    if (b) { cur = b.dataset.pf; render(); el.querySelector(`[data-pf="${cur}"]`).focus(); return; }
    const g = ev.target.closest('[data-go]');
    if (g) ctx.focus(g.dataset.go);
  });
  el.addEventListener('keydown', (ev) => {
    const b = ev.target.closest('[data-pf]');
    if (!b || (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft')) return;
    const i = (ORDER.indexOf(b.dataset.pf) + (ev.key === 'ArrowRight' ? 1 : ORDER.length - 1)) % ORDER.length;
    cur = ORDER[i]; render(); el.querySelector(`[data-pf="${cur}"]`).focus();
  });
  return { render, setProfile(k) { if (views[k]) { cur = k; render(); } } };
}
