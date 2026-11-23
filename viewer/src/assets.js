// GIN²CO — asset register: update existing assets, add new ones, journal of changes (demonstration, stored in the browser)
import { kpis } from './charts.js';
import { MEMBERS } from './store.js';

const S = {
  fr: {
    you: 'Vous êtes', demo: 'Démonstration : membres et données fictifs. Les modifications restent dans ce navigateur ; exportez-les pour les conserver ou les transmettre.',
    noStore: 'Le navigateur n’autorise pas l’enregistrement local : les modifications seront perdues au rechargement.',
    rights: 'Vos droits', rightsList: { editAsset: 'modifier les ouvrages', addAsset: 'ajouter des ouvrages', manageData: 'importer, exporter, réinitialiser', manageProject: 'créer et piloter les projets', validateStep: 'valider les étapes', checkQuality: 'renseigner les contrôles qualité', assignTask: 'attribuer des tâches', comment: 'commenter et proposer' }, readOnly: 'consultation seule',
    add: '+ Ajouter un ouvrage', exp: 'Exporter (JSON)', imp: 'Importer', reset: 'Réinitialiser la démonstration',
    resetQ: 'Effacer toutes les modifications enregistrées dans ce navigateur et revenir aux données d’origine ?', impErr: 'Fichier non reconnu : il doit provenir de l’export de cette page.',
    kAssets: 'Ouvrages au registre', kMod: 'Ouvrages mis à jour', kAdd: 'Ouvrages ajoutés', kLast: 'Dernière mise à jour', never: 'aucune',
    regH: 'Registre des ouvrages', code: 'Code', asset: 'Ouvrage', fam: 'Famille', cond: 'État', cost: 'Coût ({CUR})', tmja: 'TMJA', insp: 'Inspection', status: 'Statut', act: 'Action',
    sOrig: 'Données d’origine', sMod: 'Mis à jour', sAdd: 'Ajouté', edit: 'Modifier', del: 'Supprimer', see: 'Voir sur la carte',
    editH: (c) => `Mettre à jour ${c}`, addH: 'Ajouter un ouvrage', note: 'Note d’état', costF: 'Coût de remise en état ({CUR})', tmjaF: 'Trafic (TMJA, véh./j)',
    inspF: 'Date de la dernière inspection', finF: 'Financement envisagé', obsF: 'Observation (désordres constatés, source)', famF: 'Famille', typeF: 'Type d’ouvrage', codeF: 'Code',
    posF: 'Position', pick: 'Placer sur la carte', picked: (la, lo) => `${la.toFixed(5)}, ${lo.toFixed(5)}`, notPicked: 'non placée',
    suggest: (v) => `Valeur indicative : ${v}`, useIt: 'utiliser', tmjaHint: (v) => `Point de comptage le plus proche : ${v} véh./j`,
    save: 'Enregistrer', cancel: 'Annuler', prevH: 'Aperçu du recalcul', ctxH: 'Contexte relevé automatiquement',
    effNow: 'Efficacité actuelle', effAfter: 'Après remise en état', verdict: 'Verdict', inaction: 'Coût de l’inaction', perYear: '/ an', compl: 'Complément',
    flood: 'Aléa inondation', sol: 'Sol', pop: 'Population à moins de 600 m', equip: 'Équipements à moins de 500 m', flows: 'Flux agricoles traversant l’ouvrage', none: 'aucun',
    errCost: 'Indiquez un coût positif.', errTmja: 'Indiquez un trafic positif ou nul.', errInsp: 'La date d’inspection ne peut pas être future.', errPos: 'Placez l’ouvrage sur la carte.', errCode: 'Ce code existe déjà.',
    logH: 'Journal des modifications', logEmpty: 'Aucune modification enregistrée.', when: 'Date', who: 'Auteur', what: 'Modification',
    no3d: 'La maquette IFC d’un ouvrage ajouté reste à produire.',
    delQ: (c) => `Supprimer l’ouvrage ajouté ${c} ?`,
    w: { note: 'État', cout: 'Coût', tmja: 'TMJA', inspection: 'Inspection', financement: 'Financement', obs: 'Observation' },
    addedTxt: (typ, c) => `Ajout de l’ouvrage (${typ}, ${c})`, delTxt: 'Suppression de l’ouvrage ajouté', obsSet: 'renseignée',
  },
  en: {
    you: 'You are', demo: 'Demonstration: fictitious members and data. Changes stay in this browser; export them to keep or share them.',
    noStore: 'This browser does not allow local storage: changes will be lost on reload.',
    rights: 'Your rights', rightsList: { editAsset: 'update assets', addAsset: 'add assets', manageData: 'import, export, reset', manageProject: 'create and run projects', validateStep: 'validate steps', checkQuality: 'record quality checks', assignTask: 'assign tasks', comment: 'comment and suggest' }, readOnly: 'read only',
    add: '+ Add an asset', exp: 'Export (JSON)', imp: 'Import', reset: 'Reset the demonstration',
    resetQ: 'Erase all changes stored in this browser and return to the original data?', impErr: 'File not recognised: it must come from this page’s export.',
    kAssets: 'Assets in the register', kMod: 'Assets updated', kAdd: 'Assets added', kLast: 'Last update', never: 'none',
    regH: 'Asset register', code: 'Code', asset: 'Asset', fam: 'Family', cond: 'Condition', cost: 'Cost ({CUR})', tmja: 'AADT', insp: 'Inspection', status: 'Status', act: 'Action',
    sOrig: 'Original data', sMod: 'Updated', sAdd: 'Added', edit: 'Edit', del: 'Delete', see: 'Show on map',
    editH: (c) => `Update ${c}`, addH: 'Add an asset', note: 'Condition rating', costF: 'Rehabilitation cost ({CUR})', tmjaF: 'Traffic (AADT, veh/day)',
    inspF: 'Last inspection date', finF: 'Intended funding', obsF: 'Note (defects observed, source)', famF: 'Family', typeF: 'Asset type', codeF: 'Code',
    posF: 'Position', pick: 'Place on the map', picked: (la, lo) => `${la.toFixed(5)}, ${lo.toFixed(5)}`, notPicked: 'not placed',
    suggest: (v) => `Indicative value: ${v}`, useIt: 'use', tmjaHint: (v) => `Nearest count point: ${v} veh/day`,
    save: 'Save', cancel: 'Cancel', prevH: 'Recalculation preview', ctxH: 'Context read automatically',
    effNow: 'Current efficiency', effAfter: 'After rehabilitation', verdict: 'Verdict', inaction: 'Cost of inaction', perYear: '/ yr', compl: 'Complement',
    flood: 'Flood hazard', sol: 'Soil', pop: 'Population within 600 m', equip: 'Facilities within 500 m', flows: 'Farm flows crossing the asset', none: 'none',
    errCost: 'Enter a positive cost.', errTmja: 'Enter a traffic of zero or more.', errInsp: 'The inspection date cannot be in the future.', errPos: 'Place the asset on the map.', errCode: 'This code already exists.',
    logH: 'Change log', logEmpty: 'No change recorded.', when: 'Date', who: 'Author', what: 'Change',
    no3d: 'The IFC model of an added asset is still to be produced.',
    delQ: (c) => `Delete the added asset ${c}?`,
    w: { note: 'Condition', cout: 'Cost', tmja: 'AADT', inspection: 'Inspection', financement: 'Funding', obs: 'Note' },
    addedTxt: (typ, c) => `Asset added (${typ}, ${c})`, delTxt: 'Added asset deleted', obsSet: 'filled in',
  },
};
const PREFIX = { 'Ouvrages d’art': 'OA', 'Routes revêtues': 'RN', 'Pistes rurales': 'PR' };

export function userStrip(store, lang, esc, rightsKeys) {
  const s = S[lang()];
  const me = store.me();
  const rights = rightsKeys.filter((r) => store.can(r));
  return `<div class="pl-user"><label class="bv-field"><span class="bv-l">${esc(s.you)}</span>
    <select data-user>${MEMBERS.map((m) => `<option value="${m.id}"${m.id === me.id ? ' selected' : ''}>${esc(m.name)} — ${esc(m[lang()])}</option>`).join('')}</select></label>
    <p class="pl-rights"><b>${esc(s.rights)} :</b> ${esc(rights.length ? rights.map((r) => s.rightsList[r] || r).join(' · ') : s.readOnly)}</p></div>
    <p class="pl-demo mono">${esc(s.demo)}${store.persistent ? '' : ` ${esc(s.noStore)}`}</p>`;
}

export function createAssetBoard(el, ctx) {
  const { lang, tv, fmt, money, esc, Z, ETAT_C, store } = ctx;
  const s = (k) => { const v = S[lang()][k]; return typeof v === 'string' ? v.replace('{CUR}', Z.cur) : v; };
  const nf = (x, d = 1) => new Intl.NumberFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);
  let form = null; // {mode:'edit'|'add', code, f:{...}}
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

  const suggestCost = (type, note) => {
    const xs = ctx.assets().filter((a) => a.type === type && !a._added).map((a) => a.cout / (0.35 + 0.3 * a.note)).sort((x, y) => x - y);
    if (!xs.length) return null;
    return Math.round(xs[Math.floor(xs.length / 2)] * (0.35 + 0.3 * note) / 1e7) * 1e7;
  };
  const nextCode = (fam) => {
    const p = PREFIX[fam] || 'X';
    const n = Math.max(0, ...ctx.assets().filter((a) => a.code.startsWith(`${p}-`)).map((a) => Number(a.code.split('-')[1]) || 0)) + 1;
    return `${p}-${String(n).padStart(2, '0')}`;
  };

  function preview() {
    if (!form) return '';
    const f = form.f;
    let a;
    try {
      if (form.mode === 'add') {
        if (f.lat == null) return `<p class="bv-muted">${esc(s('errPos'))}</p>`;
        a = ctx.preview(null, null, { ...f, cout: Number(f.cout) || 1, tmja: Number(f.tmja) || 0 });
      } else a = ctx.preview(form.code, { ...f, cout: Number(f.cout) || 1, tmja: f.tmja === '' ? null : Number(f.tmja) });
    } catch { return ''; }
    const im = a.impact;
    const ctxRows = form.mode === 'add' ? `<h5 class="pl-h5">${esc(s('ctxH'))}</h5><table class="bv-kv">
      <tr><th>${esc(s('flood'))}</th><td class="mono">${nf(a.flood, 2)}</td></tr><tr><th>${esc(s('sol'))}</th><td>${esc(tv(a.sol))}</td></tr>
      <tr><th>${esc(s('pop'))}</th><td class="mono">${fmt(a.pop)}</td></tr><tr><th>${esc(s('equip'))}</th><td class="mono">${a.equip}</td></tr>
      <tr><th>${esc(s('flows'))}</th><td class="mono">${a._flows.length ? `${a._flows.length} · ${fmt(Math.round(a._through / 10) * 10)} t/${lang() === 'en' ? 'yr' : 'an'}` : esc(s('none'))}</td></tr></table>` : '';
    return `${ctxRows}<h5 class="pl-h5">${esc(s('prevH'))}</h5><table class="bv-kv">
      <tr><th>${esc(s('effNow'))}</th><td class="mono">${nf(im.eff * 100)} %</td></tr>
      <tr><th>${esc(s('effAfter'))}</th><td class="mono">${nf(im.eff_rehab * 100)} %</td></tr>
      <tr><th>${esc(s('verdict'))}</th><td><span class="bv-badge" style="--c:${ctx.VERDICT_C[im.verdict]}">${esc(tv(im.verdict))}</span></td></tr>
      <tr><th>${esc(s('inaction'))}</th><td class="mono">${esc(money(a.inaction))} ${esc(s('perYear'))}</td></tr>
      ${im.complement ? `<tr><th>${esc(s('compl'))}</th><td>${esc(im.complement[lang()])} — ${esc(money(im.complement.cost))}</td></tr>` : ''}</table>`;
  }

  function formHtml() {
    if (!form) return '';
    const f = form.f, add = form.mode === 'add';
    const fams = Object.keys(ctx.FAM_C());
    const types = ctx.typesOf(f.famille);
    const sug = add ? suggestCost(f.type, Number(f.note)) : null;
    const fins = Object.keys(ctx.FIN_C());
    return `<section class="pl-form" aria-label="${esc(add ? s('addH') : s('editH')(form.code))}">
      <h4 class="bv-h">${esc(add ? s('addH') : s('editH')(form.code))}</h4>
      <div class="pl-form-grid"><div class="pl-fields">
      ${add ? `<label class="sd-f"><span class="bv-l">${esc(s('famF'))}</span><select data-f="famille">${fams.map((x) => `<option value="${esc(x)}"${x === f.famille ? ' selected' : ''}>${esc(tv(x))}</option>`).join('')}</select></label>
        <label class="sd-f"><span class="bv-l">${esc(s('typeF'))}</span><select data-f="type">${types.map((x) => `<option value="${esc(x)}"${x === f.type ? ' selected' : ''}>${esc(tv(x))}</option>`).join('')}</select></label>
        <label class="sd-f"><span class="bv-l">${esc(s('codeF'))}</span><input type="text" data-f="code" value="${esc(f.code)}" maxlength="12"></label>
        <div class="sd-f"><span class="bv-l">${esc(s('posF'))}</span><div class="pl-pos"><span class="mono">${f.lat == null ? esc(s('notPicked')) : esc(s('picked')(f.lat, f.lon))}</span>
          <button type="button" class="bv-btn" data-act="pick">${esc(s('pick'))}</button></div></div>` : ''}
      <label class="sd-f"><span class="bv-l">${esc(s('note'))}</span><select data-f="note">${[1, 2, 3, 4].map((n) => `<option value="${n}"${Number(f.note) === n ? ' selected' : ''}>${n} — ${esc(tv(['', 'Bon', 'Moyen', 'Dégradé', 'Critique'][n]))}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('costF'))}</span><input type="number" min="0" step="10000000" data-f="cout" value="${esc(f.cout)}">
        ${sug ? `<small class="pl-hint">${esc(s('suggest')(fmt(sug)))} <button type="button" class="sg-link" data-act="usecost" data-v="${sug}">${esc(s('useIt'))}</button></small>` : ''}</label>
      <label class="sd-f"><span class="bv-l">${esc(s('tmjaF'))}</span><input type="number" min="0" step="10" data-f="tmja" value="${esc(f.tmja ?? '')}">
        ${add && f.tmjaHint != null ? `<small class="pl-hint">${esc(s('tmjaHint')(fmt(f.tmjaHint)))} <button type="button" class="sg-link" data-act="usetmja" data-v="${f.tmjaHint}">${esc(s('useIt'))}</button></small>` : ''}</label>
      <label class="sd-f"><span class="bv-l">${esc(s('inspF'))}</span><input type="month" data-f="inspection" value="${esc(f.inspection || '')}" max="${today()}"></label>
      <label class="sd-f"><span class="bv-l">${esc(s('finF'))}</span><select data-f="financement">${fins.map((x) => `<option value="${esc(x)}"${x === f.financement ? ' selected' : ''}>${esc(tv(x))}</option>`).join('')}</select></label>
      <label class="sd-f"><span class="bv-l">${esc(s('obsF'))}</span><textarea rows="2" data-f="obs" maxlength="400">${esc(f.obs || '')}</textarea></label>
      <p class="pl-err" data-err role="alert"></p>
      <div class="sd-actions"><button type="button" class="sg-link" data-act="cancel">${esc(s('cancel'))}</button><button type="button" class="btn btn-primary" data-act="save">${esc(s('save'))}</button></div>
      </div><div class="pl-prev" data-prev>${preview()}</div></div></section>`;
  }

  function render() {
    const A = ctx.assets();
    const log = store.state.log.filter((l) => l.kind === 'asset');
    const canEdit = store.can('editAsset'), canAdd = store.can('addAsset'), canData = store.can('manageData');
    el.innerHTML = `${userStrip(store, lang, esc, ['editAsset', 'addAsset', 'manageData'])}
      <div class="pl-bar">${canAdd ? `<button type="button" class="btn btn-primary" data-act="add">${esc(s('add'))}</button>` : ''}
        <button type="button" class="bv-btn" data-act="export">${esc(s('exp'))}</button>
        ${canData ? `<label class="bv-btn pl-file">${esc(s('imp'))}<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <button type="button" class="sg-link" data-act="reset">${esc(s('reset'))}</button>` : ''}</div>
      ${kpis([{ v: String(A.length), l: s('kAssets') }, { v: String(A.filter((a) => a._mod).length), l: s('kMod'), tone: 'warn' }, { v: String(A.filter((a) => a._added).length), l: s('kAdd'), tone: 'ok' }, { v: log.length ? log[log.length - 1].when : s('never'), l: s('kLast') }])}
      ${formHtml()}
      <h4 class="bv-h sd-h">${esc(s('regH'))}</h4>
      <div class="bv-table-wrap sd-wrap"><table class="bv-table pf-table"><thead><tr><th>${esc(s('code'))}</th><th>${esc(s('asset'))}</th><th>${esc(s('fam'))}</th><th>${esc(s('cond'))}</th>
        <th class="num">${esc(s('cost'))}</th><th class="num">${esc(s('tmja'))}</th><th>${esc(s('insp'))}</th><th>${esc(s('status'))}</th><th>${esc(s('act'))}</th></tr></thead><tbody>
        ${A.map((a) => `<tr${form && form.code === a.code ? ' class="pl-cur"' : ''}><td><button type="button" class="sg-link mono" data-go="${esc(a.code)}" title="${esc(s('see'))}">${esc(a.code)}</button></td><td>${esc(tv(a.type))}</td><td>${esc(tv(a.famille))}</td>
          <td><span class="bv-badge" style="--c:${ETAT_C[a.etat]}">${esc(tv(a.etat))}</span></td><td class="num mono">${fmt(a.cout)}</td><td class="num mono">${a.tmja == null ? '—' : fmt(a.tmja)}</td><td class="mono">${esc(a.inspection || '—')}</td>
          <td>${a._added ? `<span class="pl-tag pl-add">${esc(s('sAdd'))}</span>` : a._mod ? `<span class="pl-tag pl-mod">${esc(s('sMod'))}</span>` : `<span class="bv-muted">${esc(s('sOrig'))}</span>`}</td>
          <td>${canEdit ? `<button type="button" class="sg-link" data-edit="${esc(a.code)}">${esc(s('edit'))}</button>` : ''}${a._added && canAdd ? ` · <button type="button" class="sg-link" data-del="${esc(a.code)}">${esc(s('del'))}</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <h4 class="bv-h sd-h">${esc(s('logH'))}</h4>
      ${log.length ? `<div class="bv-table-wrap sd-wrap"><table class="bv-table pf-table"><thead><tr><th>${esc(s('when'))}</th><th>${esc(s('who'))}</th><th>${esc(s('code'))}</th><th>${esc(s('what'))}</th></tr></thead><tbody>
        ${log.slice().reverse().slice(0, 40).map((l) => `<tr><td class="mono">${esc(l.when)}</td><td>${esc(l.who)}</td><td class="mono">${esc(l.code)}</td><td class="pf-wrap">${esc(l.what)}</td></tr>`).join('')}</tbody></table></div>`
        : `<p class="bv-muted">${esc(s('logEmpty'))}</p>`}`;
  }

  const refreshPreview = () => { const p = el.querySelector('[data-prev]'); if (p) p.innerHTML = preview(); };
  function startEdit(code) {
    const a = ctx.assets().find((x) => x.code === code);
    form = { mode: 'edit', code, f: { note: a.note, cout: a.cout, tmja: a.tmja ?? '', inspection: a.inspection || '', financement: a.financement, obs: a.obs || '' } };
    render(); el.querySelector('.pl-form')?.scrollIntoView({ block: 'nearest' });
  }
  function startAdd() {
    const fam = Object.keys(ctx.FAM_C())[0];
    const type = ctx.typesOf(fam)[0];
    form = { mode: 'add', code: null, f: { famille: fam, type, code: nextCode(fam), lat: null, lon: null, note: 3, cout: '', tmja: '', inspection: today(), financement: Object.keys(ctx.FIN_C())[0], obs: '' } };
    render(); el.querySelector('.pl-form')?.scrollIntoView({ block: 'nearest' });
  }
  function describe(a, f) {
    const w = s('w'); const parts = [];
    if (Number(f.note) !== a.note) parts.push(`${w.note} : ${tv(a.etat)} → ${tv(['', 'Bon', 'Moyen', 'Dégradé', 'Critique'][f.note])}`);
    if (Number(f.cout) !== a.cout) parts.push(`${w.cout} : ${money(a.cout)} → ${money(Number(f.cout))}`);
    const t0 = a.tmja ?? null, t1 = f.tmja === '' ? null : Number(f.tmja);
    if (t0 !== t1) parts.push(`${w.tmja} : ${t0 == null ? '—' : fmt(t0)} → ${t1 == null ? '—' : fmt(t1)}`);
    if ((a.inspection || '') !== f.inspection) parts.push(`${w.inspection} : ${a.inspection || '—'} → ${f.inspection}`);
    if (a.financement !== f.financement) parts.push(`${w.financement} : ${tv(a.financement)} → ${tv(f.financement)}`);
    if ((a.obs || '') !== f.obs) parts.push(`${w.obs} ${s('obsSet')} : « ${f.obs.slice(0, 120)} »`);
    return parts.join(' ; ');
  }
  function save() {
    const f = form.f, err = el.querySelector('[data-err]');
    const cout = Number(f.cout), tmja = f.tmja === '' ? null : Number(f.tmja);
    if (!(cout > 0)) { err.textContent = s('errCost'); return; }
    if (tmja != null && !(tmja >= 0)) { err.textContent = s('errTmja'); return; }
    if (f.inspection && f.inspection > today()) { err.textContent = s('errInsp'); return; }
    if (form.mode === 'add') {
      if (f.lat == null) { err.textContent = s('errPos'); return; }
      const code = f.code.trim().toUpperCase();
      if (!code || ctx.assets().some((a) => a.code === code)) { err.textContent = s('errCode'); return; }
      ctx.addAsset({ code, famille: f.famille, type: f.type, lat: f.lat, lon: f.lon, note: Number(f.note), cout, tmja: tmja ?? 0, inspection: f.inspection, financement: f.financement, obs: f.obs, annee: '—' },
        s('addedTxt')(tv(f.type), money(cout)));
    } else {
      const a = ctx.assets().find((x) => x.code === form.code);
      const fields = { note: Number(f.note), cout, tmja, inspection: f.inspection, financement: f.financement, obs: f.obs };
      const what = describe(a, { ...f, tmja: f.tmja });
      if (what) ctx.saveEdit(form.code, fields, what);
    }
    form = null; render();
  }

  el.addEventListener('input', (e) => {
    const k = e.target.dataset.f;
    if (!k || !form) return;
    form.f[k] = e.target.value;
    if (k === 'famille') { form.f.type = ctx.typesOf(form.f.famille)[0]; form.f.code = nextCode(form.f.famille); render(); return; }
    if (k === 'type' || k === 'note') { if (form.mode === 'add') { render(); return; } }
    refreshPreview();
  });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-user]')) { store.setUser(e.target.value); return; }
    if (e.target.dataset.act === 'import' && e.target.files[0]) {
      const fr = new FileReader();
      fr.onload = () => { try { store.importJSON(fr.result); } catch { alert(s('impErr')); } };
      fr.readAsText(e.target.files[0]);
    }
  });
  el.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'); if (go) { ctx.focus(go.dataset.go); return; }
    const ed = e.target.closest('[data-edit]'); if (ed) { startEdit(ed.dataset.edit); return; }
    const dl = e.target.closest('[data-del]');
    if (dl) { if (confirm(s('delQ')(dl.dataset.del))) ctx.removeAdded(dl.dataset.del, s('delTxt')); return; }
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT') return;
    const act = b.dataset.act;
    if (act === 'add') startAdd();
    else if (act === 'cancel') { form = null; render(); }
    else if (act === 'save') save();
    else if (act === 'usecost') { form.f.cout = b.dataset.v; render(); }
    else if (act === 'usetmja') { form.f.tmja = b.dataset.v; render(); }
    else if (act === 'pick') {
      ctx.pickOnMap((ll) => {
        form.f.lat = Math.round(ll.lat * 1e5) / 1e5; form.f.lon = Math.round(ll.lng * 1e5) / 1e5;
        const cx = ctx.contextAt({ lat: form.f.lat, lon: form.f.lon });
        form.f.tmjaHint = cx.tmjaHint;
        if (form.f.tmja === '' && cx.tmjaHint != null) form.f.tmja = String(cx.tmjaHint);
        render();
      });
    } else if (act === 'export') {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const u = URL.createObjectURL(blob); const aEl = document.createElement('a');
      aEl.href = u; aEl.download = `gin2co-${Z.cur === 'GNF' ? 'guinee' : 'benin'}-donnees.json`; aEl.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    } else if (act === 'reset') { if (confirm(s('resetQ'))) store.reset(); }
  });
  return { render, startAdd, startEdit, noModel: () => s('no3d') };
}
