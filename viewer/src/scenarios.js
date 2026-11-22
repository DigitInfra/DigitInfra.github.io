// GIN²CO — scenario comparison dashboard (same scoring and budget rules as the map, run for up to three settings)

const S = {
  fr: {
    intro: 'Comparez trois arbitrages sur la même zone. Chaque scénario combine une pondération des critères et une enveloppe ; le classement et le financement sont recalculés avec les mêmes règles que la carte.',
    preset: 'Point de départ', name: 'Nom du scénario', budget: 'Enveloppe', fromMap: 'Reprendre le réglage de la carte', toMap: 'Appliquer à la carte',
    custom: 'Personnalisé', kpiH: 'Indicateurs comparés', indicator: 'Indicateur',
    funded: 'Ouvrages financés', committed: 'Montant engagé', left: 'Reliquat', avoided: 'Coût de l’inaction évité / an',
    ratio: 'Inaction évitée par unité engagée', critical: 'Ouvrages critiques financés', effFunded: 'Efficacité moyenne des ouvrages financés (actuelle → après travaux)',
    verdicts: 'Verdicts des ouvrages financés (suffisant · à renforcer · à compléter)', comp: 'Compléments à prévoir après travaux',
    tons: 'Produits agricoles supplémentaires acheminés après travaux', tonsUnit: 't/an', perYear: '/ an',
    chartAvoided: 'Coût de l’inaction évité par an', chartCommitted: 'Montant engagé', chartFam: 'Montant engagé par famille d’ouvrages',
    tableH: 'Ouvrages retenus selon le scénario', code: 'Code', asset: 'Ouvrage', family: 'Famille', condition: 'État', cost: 'Coût ({CUR})',
    rankIn: (l) => `Rang ${l}`, retained: 'Retenu dans', core: 'Socle commun', depends: 'Selon le scénario',
    coreSum: (n, m) => `${n} ouvrage${n > 1 ? 's sont retenus' : ' est retenu'} dans les trois scénarios, pour ${m} : c’est le socle commun, à engager quel que soit l’arbitrage.`,
    depSum: (n) => `${n} autre${n > 1 ? 's' : ''} ouvrage${n > 1 ? 's dépendent' : ' dépend'} du scénario retenu.`,
    noCore: 'Aucun ouvrage n’est retenu dans les trois scénarios : le choix de pondération détermine entièrement la programmation.',
    note: 'Lecture : un ouvrage financé est indiqué par ✓ à côté de son rang. Le classement suit le score ; un ouvrage plus cher que le reliquat est sauté au profit des suivants.',
    applied: (l) => `Scénario ${l} appliqué à la carte.`, rankShort: 'rang',
    presets: { defaut: 'Réglage par défaut', usagers: 'Priorité aux usagers', risques: 'Priorité aux risques naturels', rentab: 'Priorité à la rentabilité' },
  },
  en: {
    intro: 'Compare three trade-offs on the same area. Each scenario combines a criteria weighting and a budget envelope; ranking and funding are recalculated with the same rules as the map.',
    preset: 'Starting point', name: 'Scenario name', budget: 'Envelope', fromMap: 'Copy the map settings', toMap: 'Apply to the map',
    custom: 'Custom', kpiH: 'Indicators compared', indicator: 'Indicator',
    funded: 'Assets funded', committed: 'Amount committed', left: 'Remaining', avoided: 'Avoided cost of inaction / yr',
    ratio: 'Inaction avoided per unit committed', critical: 'Critical assets funded', effFunded: 'Average efficiency of funded assets (current → after works)',
    verdicts: 'Verdicts of funded assets (sufficient · to reinforce · to complement)', comp: 'Complements needed after works',
    tons: 'Additional farm produce carried after works', tonsUnit: 't/yr', perYear: '/ yr',
    chartAvoided: 'Avoided cost of inaction per year', chartCommitted: 'Amount committed', chartFam: 'Amount committed by asset family',
    tableH: 'Assets selected in each scenario', code: 'Code', asset: 'Asset', family: 'Family', condition: 'Condition', cost: 'Cost ({CUR})',
    rankIn: (l) => `Rank ${l}`, retained: 'Selected in', core: 'Common core', depends: 'Scenario-dependent',
    coreSum: (n, m) => `${n} asset${n > 1 ? 's are' : ' is'} selected in all three scenarios, for ${m}: this is the common core, to be committed whatever the trade-off.`,
    depSum: (n) => `${n} other asset${n > 1 ? 's depend' : ' depends'} on the scenario chosen.`,
    noCore: 'No asset is selected in all three scenarios: the weighting choice fully determines the programme.',
    note: 'How to read: a funded asset shows ✓ next to its rank. Ranking follows the score; an asset costing more than the remaining amount is skipped in favour of the next ones.',
    applied: (l) => `Scenario ${l} applied to the map.`, rankShort: 'rank',
    presets: { defaut: 'Default settings', usagers: 'Users first', risques: 'Natural hazards first', rentab: 'Return first' },
  },
};

const PRESETS = {
  defaut: { etat: 5, pop: 3, trafic: 3, flood: 3, sol: 1, equip: 2, fin: 3 },
  usagers: { etat: 2, pop: 5, trafic: 5, flood: 2, sol: 0, equip: 4, fin: 2 },
  risques: { etat: 4, pop: 1, trafic: 1, flood: 5, sol: 4, equip: 1, fin: 1 },
  rentab: { etat: 2, pop: 1, trafic: 1, flood: 1, sol: 0, equip: 0, fin: 5 },
};
const SC_COLORS = ['#3B5FC0', '#E07A3F', '#0E9AA5'];
const LETTERS = ['A', 'B', 'C'];

export function createScenarioBoard(el, ctx) {
  const { A, CRIT, Z, lang, tv, money, fmt, pct, esc, FAM_C, ETAT_C } = ctx;
  const s = (k) => { const v = S[lang()][k]; return typeof v === 'string' ? v.replace('{CUR}', Z.cur) : v; };
  const maxBudget = Math.ceil(ctx.totalCost / Z.step) * Z.step;
  const scen = ['defaut', 'usagers', 'risques'].map((p) => ({ preset: p, name: null, w: { ...PRESETS[p] }, budget: ctx.defaultBudget }));
  const nameOf = (sc) => sc.name || (sc.preset ? s('presets')[sc.preset] : s('custom'));
  const nf = (x, d = 1) => new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);

  function simulate(sc) {
    const sw = Object.values(sc.w).reduce((x, y) => x + y, 0) || 1;
    const rows = A.map((a) => ({ a, score: Math.round(CRIT.reduce((acc, [k]) => acc + sc.w[k] * a.crit[k], 0) / sw * 100) }));
    rows.sort((x, y) => y.score - x.score || y.a.inaction - x.a.inaction);
    let left = sc.budget;
    rows.forEach((r, i) => { r.rank = i + 1; r.funded = r.a.cout <= left; if (r.funded) left -= r.a.cout; });
    const f = rows.filter((r) => r.funded).map((r) => r.a);
    const sum = (arr, g) => arr.reduce((acc, a) => acc + g(a), 0);
    const committed = sum(f, (a) => a.cout);
    const avoided = sum(f, (a) => a.inaction);
    const agri = (a) => (Z.cur === 'GNF' || a.famille.startsWith('Voirie')) && a.impact.eff > 0;
    const fam = {};
    for (const a of f) fam[a.famille] = (fam[a.famille] || 0) + a.cout;
    return {
      by: Object.fromEntries(rows.map((r) => [r.a.code, r])), f, committed, left, avoided,
      ratio: committed ? avoided / committed : 0,
      crit: f.filter((a) => a.note === 4).length, critAll: A.filter((a) => a.note === 4).length,
      effNow: f.length ? sum(f, (a) => a.impact.eff) / f.length : 0,
      effAfter: f.length ? sum(f, (a) => a.impact.eff_rehab) / f.length : 0,
      v: ['Suffisant', 'À renforcer', 'À compléter'].map((v) => f.filter((a) => a.impact.verdict === v).length),
      comp: f.filter((a) => a.impact.complement), compCost: sum(f.filter((a) => a.impact.complement), (a) => a.impact.complement.cost),
      tons: sum(f.filter(agri), (a) => a.impact.benef * (a.impact.eff_rehab / a.impact.eff - 1)),
      fam,
    };
  }

  el.innerHTML = `<p class="sd-intro" data-s="intro"></p><div class="sd-cards" data-s="cards"></div><div data-s="out"></div><p class="sd-live" aria-live="polite" data-s="live"></p>`;
  const $ = (k) => el.querySelector(`[data-s="${k}"]`);

  function renderCards() {
    $('intro').textContent = s('intro');
    const L_ = lang() === 'en' ? 1 : 0;
    $('cards').innerHTML = scen.map((sc, i) => `<section class="sd-card" style="--sc:${SC_COLORS[i]}" data-i="${i}" aria-label="${esc(`${LETTERS[i]} — ${nameOf(sc)}`)}">
      <div class="sd-card-h"><span class="sd-letter">${LETTERS[i]}</span>
        <input class="sd-name" type="text" value="${esc(nameOf(sc))}" aria-label="${esc(s('name'))}" data-act="name" maxlength="40"></div>
      <label class="sd-f"><span class="bv-l">${esc(s('preset'))}</span><select data-act="preset">
        ${Object.keys(PRESETS).map((p) => `<option value="${p}"${sc.preset === p ? ' selected' : ''}>${esc(s('presets')[p])}</option>`).join('')}
        ${sc.preset ? '' : `<option value="" selected>${esc(s('custom'))}</option>`}</select></label>
      <div class="sd-w">${CRIT.map(([k, lab]) => `<label class="sg-w"><span>${esc(lab[L_])}</span>
        <input type="range" min="0" max="5" step="1" value="${sc.w[k]}" data-w="${k}" aria-label="${esc(`${LETTERS[i]} — ${lab[L_]}`)}"><b class="mono">${sc.w[k]}</b></label>`).join('')}</div>
      <label class="sd-f sd-budget"><span class="bv-l">${esc(s('budget'))}</span>
        <input type="range" class="sg-range" min="0" max="${maxBudget}" step="${Z.step}" value="${sc.budget}" data-act="budget" aria-label="${esc(`${LETTERS[i]} — ${s('budget')}`)}">
        <b class="mono" data-act="budgetVal">${esc(money(sc.budget))}</b></label>
      <div class="sd-actions"><button type="button" class="sg-link" data-act="fromMap">${esc(s('fromMap'))}</button>
        <button type="button" class="bv-btn" data-act="toMap">${esc(s('toMap'))}</button></div>
    </section>`).join('');
  }

  function bars(title, vals, fmtV) {
    const mx = Math.max(...vals, 1);
    return `<figure class="sd-chart"><figcaption class="bv-h">${esc(title)}</figcaption>${vals.map((v, i) => `
      <div class="sd-bar" title="${esc(`${LETTERS[i]} — ${nameOf(scen[i])} : ${fmtV(v)}`)}"><span class="sd-bl"><i class="sd-dot" style="background:${SC_COLORS[i]}"></i>${LETTERS[i]}</span>
        <span class="sd-track"><i style="width:${(v / mx * 100).toFixed(1)}%;background:${SC_COLORS[i]}"></i></span><span class="sd-bv mono">${esc(fmtV(v))}</span></div>`).join('')}</figure>`;
  }

  function famChart(R) {
    const fams = Object.keys(FAM_C);
    const mx = Math.max(...R.map((r) => r.committed), 1);
    const rows = R.map((r, i) => `<div class="sd-bar"><span class="sd-bl"><i class="sd-dot" style="background:${SC_COLORS[i]}"></i>${LETTERS[i]}</span>
      <span class="sd-track sd-stack" style="width:${(r.committed / mx * 100).toFixed(1)}%">${fams.filter((k) => r.fam[k]).map((k) => `<i style="flex:${r.fam[k]};background:${FAM_C[k]}" title="${esc(`${LETTERS[i]} — ${tv(k)} : ${money(r.fam[k])}`)}"></i>`).join('')}</span>
      <span class="sd-bv mono">${esc(money(r.committed))}</span></div>`).join('');
    const leg = fams.map((k) => `<li><span class="bv-sw" style="background:${FAM_C[k]}"></span>${esc(tv(k))}</li>`).join('');
    return `<figure class="sd-chart sd-chart-wide"><figcaption class="bv-h">${esc(s('chartFam'))}</figcaption>${rows}<ul class="sd-leg">${leg}</ul></figure>`;
  }

  function renderOut() {
    const R = scen.map(simulate);
    const head = `<tr><th>${esc(s('indicator'))}</th>${scen.map((sc, i) => `<th class="num"><span class="sd-th"><i class="sd-dot" style="background:${SC_COLORS[i]}"></i>${LETTERS[i]} · ${esc(nameOf(sc))}</span></th>`).join('')}</tr>`;
    const best = (vals, hi = true) => { const m = hi ? Math.max(...vals) : Math.min(...vals); return vals.map((v) => vals.filter((x) => x === m).length < vals.length && v === m); };
    const row = (label, vals, show, hi) => {
      const b = hi == null ? vals.map(() => false) : best(vals, hi);
      return `<tr><th scope="row">${esc(label)}</th>${vals.map((v, i) => `<td class="num mono${b[i] ? ' sd-best' : ''}">${show(v, i)}</td>`).join('')}</tr>`;
    };
    let kpi = row(s('funded'), R.map((r) => r.f.length), (v) => `${v} / ${A.length}`, true)
      + row(s('committed'), R.map((r) => r.committed), (v) => esc(money(v)))
      + row(s('left'), R.map((r) => r.left), (v) => esc(money(v)), false)
      + row(s('avoided'), R.map((r) => r.avoided), (v) => esc(money(v)), true)
      + row(s('ratio'), R.map((r) => r.ratio), (v) => `${nf(v)} ×`, true)
      + row(s('critical'), R.map((r) => r.crit), (v, i) => `${v} / ${R[i].critAll}`, true)
      + row(s('effFunded'), R.map((r) => r.effAfter - r.effNow), (v, i) => `${pct(R[i].effNow)} → ${pct(R[i].effAfter)}`)
      + row(s('verdicts'), R.map((r) => 0), (v, i) => R[i].v.join(' · '))
      + row(s('comp'), R.map((r) => r.compCost), (v, i) => `${R[i].comp.length} · ${esc(money(v))}`);
    const anyTons = R.some((r) => r.tons > 0);
    if (anyTons) kpi += row(Z.cur === 'GNF' ? s('tons') : `${s('tons')} (${lang() === 'en' ? 'roads' : 'voirie'})`, R.map((r) => r.tons), (v) => `${fmt(Math.round(v / 10) * 10)} ${esc(s('tonsUnit'))}`, true);

    const codes = A.map((a) => a.code).filter((c) => R.some((r) => r.by[c].funded));
    const nFund = (c) => R.filter((r) => r.by[c].funded).length;
    codes.sort((x, y) => nFund(y) - nFund(x) || Math.min(...R.map((r) => r.by[x].rank)) - Math.min(...R.map((r) => r.by[y].rank)));
    const core = codes.filter((c) => nFund(c) === 3);
    const coreCost = core.reduce((acc, c) => acc + A.find((a) => a.code === c).cout, 0);
    const summary = core.length ? `${s('coreSum')(core.length, money(coreCost))} ${codes.length > core.length ? s('depSum')(codes.length - core.length) : ''}` : s('noCore');
    const tbl = `<thead><tr><th>${esc(s('code'))}</th><th>${esc(s('asset'))}</th><th>${esc(s('family'))}</th><th>${esc(s('condition'))}</th><th class="num">${esc(s('cost'))}</th>
      ${LETTERS.map((l, i) => `<th class="num"><span class="sd-th"><i class="sd-dot" style="background:${SC_COLORS[i]}"></i>${esc(s('rankIn')(l))}</span></th>`).join('')}<th>${esc(s('retained'))}</th></tr></thead><tbody>${
      codes.map((c) => {
        const a = A.find((x) => x.code === c);
        const n = nFund(c);
        return `<tr class="${n === 3 ? 'sd-core' : ''}"><td class="mono">${esc(c)}</td><td>${esc(tv(a.type))}</td><td>${esc(tv(a.famille))}</td>
          <td><span class="bv-badge" style="--c:${ETAT_C[a.etat]}">${esc(tv(a.etat))}</span></td><td class="num mono">${fmt(a.cout)}</td>
          ${R.map((r) => `<td class="num mono${r.by[c].funded ? '' : ' sd-off'}">${r.by[c].rank}${r.by[c].funded ? ' ✓' : ''}</td>`).join('')}
          <td>${n}/3 · ${n === 3 ? `<strong>${esc(s('core'))}</strong>` : esc(s('depends'))}</td></tr>`;
      }).join('')}</tbody>`;

    $('out').innerHTML = `
      <div class="sd-charts">${bars(s('chartAvoided'), R.map((r) => r.avoided), (v) => `${money(v)} ${s('perYear')}`)}${bars(s('chartCommitted'), R.map((r) => r.committed), money)}${famChart(R)}</div>
      <h4 class="bv-h sd-h">${esc(s('kpiH'))}</h4>
      <div class="bv-table-wrap sd-wrap"><table class="bv-table sd-kpi"><thead>${head}</thead><tbody>${kpi}</tbody></table></div>
      <h4 class="bv-h sd-h">${esc(s('tableH'))}</h4>
      <p class="sd-sum">${esc(summary)}</p>
      <div class="bv-table-wrap sd-wrap"><table class="bv-table sd-sel">${tbl}</table></div>
      <p class="bv-muted sg-small sd-note">${esc(s('note'))}</p>`;
  }

  el.addEventListener('input', (e) => {
    const card = e.target.closest('.sd-card');
    if (!card) return;
    const sc = scen[Number(card.dataset.i)];
    const k = e.target.getAttribute('data-w');
    if (k) {
      sc.w[k] = Number(e.target.value);
      e.target.nextElementSibling.textContent = e.target.value;
      if (sc.preset) { sc.preset = null; const sel = card.querySelector('[data-act=preset]'); if (!sel.querySelector('option[value=""]')) sel.insertAdjacentHTML('beforeend', `<option value="">${esc(s('custom'))}</option>`); sel.value = ''; }
    } else if (e.target.dataset.act === 'budget') {
      sc.budget = Number(e.target.value);
      card.querySelector('[data-act=budgetVal]').textContent = money(sc.budget);
    } else if (e.target.dataset.act === 'name') {
      sc.name = e.target.value.trim() || null;
    } else return;
    renderOut();
  });
  el.addEventListener('change', (e) => {
    if (e.target.dataset.act !== 'preset' || !e.target.value) return;
    const sc = scen[Number(e.target.closest('.sd-card').dataset.i)];
    sc.preset = e.target.value; sc.name = null; sc.w = { ...PRESETS[sc.preset] };
    renderCards(); renderOut();
  });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.tagName !== 'BUTTON') return;
    const i = Number(b.closest('.sd-card').dataset.i);
    const sc = scen[i];
    if (b.dataset.act === 'fromMap') {
      const m = ctx.getMap();
      sc.w = { ...m.w }; sc.budget = m.budget;
      const p = Object.keys(PRESETS).find((key) => CRIT.every(([k]) => PRESETS[key][k] === sc.w[k]));
      sc.preset = p || null;
      renderCards(); renderOut();
    } else if (b.dataset.act === 'toMap') {
      ctx.apply({ ...sc.w }, sc.budget);
      $('live').textContent = s('applied')(LETTERS[i]);
    }
  });

  return {
    render() { renderCards(); renderOut(); },
  };
}
