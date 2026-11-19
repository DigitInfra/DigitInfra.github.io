// GIN²CO — local request assistant (rule-based interpreter, FR/EN). No generative AI, no network calls.

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const TXT = {
  fr: {
    title: 'Assistant de requêtes', open: 'Assistant de requêtes', close: 'Réduire',
    note: 'Interpréteur local : vocabulaire métier, sans IA générative. Données fictives.',
    placeholder: 'Posez une question sur les ouvrages…', send: 'Envoyer',
    hello: 'Bonjour. Interrogez le patrimoine en langage courant : je filtre la carte et, si une maquette est ouverte, la visionneuse 3D.',
    understood: 'Critères compris', none: 'Aucun ouvrage ne correspond.', nothing: 'Je n’ai pas reconnu de critère dans cette requête. Essayez par exemple :',
    assets: (n) => `${n} ouvrage${n > 1 ? 's' : ''}`, elements: (n) => `${n} élément${n > 1 ? 's' : ''}`,
    totalCost: 'coût total', avgEff: 'efficacité moyenne', cleared: 'Requête effacée : tous les ouvrages sont de nouveau affichés.',
    budgetSet: (v) => `Enveloppe budgétaire fixée à ${v}.`, layerOn: (l) => `Couche « ${l} » activée.`, layerOff: (l) => `Couche « ${l} » masquée.`,
    colorSet: (l) => `Ouvrages colorés par ${l}.`, elColorSet: (l) => `Éléments colorés par ${l}.`, weightSet: (k, v) => `Poids « ${k} » réglé à ${v}.`,
    weightsReset: 'Pondération réinitialisée.', opening: (c) => `Ouverture de la maquette ${c}…`, closed: 'Retour à la carte.',
    unknownCode: (c) => `Je ne trouve pas l’ouvrage ${c}.`, viewerHint: 'Requête appliquée aux éléments de la maquette ouverte.',
    benefs: 'bénéficiaires', impact: 'Impact', verdict: 'Verdict', complement: 'Complément',
    examples: 'Exemples', mapCtx: 'Carte', viewerCtx: 'Maquette 3D',
  },
  en: {
    title: 'Request assistant', open: 'Request assistant', close: 'Minimise',
    note: 'Local interpreter: domain vocabulary, no generative AI. Fictitious data.',
    placeholder: 'Ask a question about the assets…', send: 'Send',
    hello: 'Hello. Query the asset base in plain language: I filter the map and, when a model is open, the 3D viewer.',
    understood: 'Criteria understood', none: 'No asset matches.', nothing: 'I did not recognise any criterion in this request. Try for example:',
    assets: (n) => `${n} asset${n > 1 ? 's' : ''}`, elements: (n) => `${n} element${n > 1 ? 's' : ''}`,
    totalCost: 'total cost', avgEff: 'average efficiency', cleared: 'Query cleared: all assets are shown again.',
    budgetSet: (v) => `Budget envelope set to ${v}.`, layerOn: (l) => `“${l}” layer turned on.`, layerOff: (l) => `“${l}” layer hidden.`,
    colorSet: (l) => `Assets coloured by ${l}.`, elColorSet: (l) => `Elements coloured by ${l}.`, weightSet: (k, v) => `“${k}” weight set to ${v}.`,
    weightsReset: 'Weights reset.', opening: (c) => `Opening the ${c} model…`, closed: 'Back to the map.',
    unknownCode: (c) => `I cannot find asset ${c}.`, viewerHint: 'Request applied to the elements of the open model.',
    benefs: 'beneficiaries', impact: 'Impact', verdict: 'Verdict', complement: 'Complement',
    examples: 'Examples', mapCtx: 'Map', viewerCtx: '3D model',
  },
};
const EX_BJ = {
  fr: {
    map: ['Ouvrages de drainage à compléter', 'Top 5 des ouvrages prioritaires', 'Ouvrages critiques à moins de 500 m d’une école',
      'Routes qui évacuent plus de 20 000 t de produits agricoles', 'Centres de santé : efficacité et verdict', 'Efficacité inférieure à 60 %',
      'Active la couche inondation', 'Budget 100 M', 'Ouvre DR-04 en 3D'],
    viewer: ['Éléments critiques', 'Éléments P1 et leur coût', 'Colore par matériau', 'Isole la toiture', 'Montre les murs', 'Tout afficher', 'Retour à la carte'],
  },
  en: {
    map: ['Drainage assets to be complemented', 'Top 5 priority assets', 'Critical assets within 500 m of a school',
      'Roads carrying more than 20,000 t of farm produce', 'Health centres: efficiency and verdict', 'Efficiency below 60%',
      'Turn on the flood layer', 'Budget 100 M', 'Open DR-04 in 3D'],
    viewer: ['Critical elements', 'P1 elements and their cost', 'Colour by material', 'Isolate the roof', 'Show the walls', 'Show all', 'Back to the map'],
  },
};

/* ------------------------------------------------------------------ vocabulary */
const TYPES_BJ = [
  [/\bdalots?\b|\bbox culverts?\b/, (a) => a.type.startsWith('Dalot'), ['Dalots', 'Box culverts']],
  [/\bponceaux?\b|\bsmall culverts?\b|\bculverts?\b(?! box)/, (a) => a.type === 'Ponceau', ['Ponceaux', 'Small culverts']],
  [/\bcaniveaux?\b|\bdrains? macon|\bmasonry drains?\b/, (a) => a.type === 'Caniveau maçonné', ['Caniveaux', 'Masonry drains']],
  [/\bcollecteurs?\b|\bstorm sewers?\b|\bsewers?\b/, (a) => a.type.startsWith('Collecteur'), ['Collecteurs', 'Storm sewers']],
  [/\bexutoires?\b|\boutfalls?\b/, (a) => a.type === 'Exutoire', ['Exutoires', 'Outfalls']],
  [/\bbassins? de retention\b|\bretention basins?\b/, (a) => a.type === 'Bassin de rétention', ['Bassins de rétention', 'Retention basins']],
  [/\bstations? de relevage\b|\bpumping stations?\b/, (a) => a.type === 'Station de relevage', ['Stations de relevage', 'Pumping stations']],
  [/\becoles?\b|\bschools?\b/, (a) => a.type === 'École primaire', ['Écoles primaires', 'Primary schools']],
  [/\bcolleges?\b|\bsecondary schools?\b/, (a) => a.type === 'Collège', ['Collèges', 'Secondary schools']],
  [/\bcentres? de sante\b|\bsante\b|\bhealth( centres?| centers?)?\b/, (a) => a.type === 'Centre de santé', ['Centres de santé', 'Health centres']],
  [/\bmairies?\b|\btown halls?\b/, (a) => a.type === 'Mairie d’arrondissement', ['Mairies', 'Town halls']],
  [/\bmarches? couverts?\b|\bmarches?\b|\bmarkets?\b/, (a) => a.type === 'Marché couvert', ['Marchés couverts', 'Covered markets']],
];
const FAMS_BJ = [
  [/\bdrainage\b|\bassainissement\b|\bsanitation\b/, 'Drainage & assainissement', ['Drainage', 'Drainage']],
  [/\bvoirie\b|\bouvrages? d'art\b|\broutes?\b|\broads?\b|\bstructures? routier/, 'Voirie & ouvrages d’art', ['Voirie', 'Roads']],
  [/\bbatiments?\b|\bbuildings?\b|\bequipements publics\b|\bpublic buildings?\b/, 'Bâtiments publics', ['Bâtiments', 'Buildings']],
];
const ETATS = [
  [/\bmauvais etats?\b|\bbad condition\b|\bpoor condition\b|\bdegrades? ou critiques?\b/, ['Dégradé', 'Critique']],
  [/\bcritiques?\b|\bcritical\b/, ['Critique']], [/\bdegrades?\b|\bpoor\b/, ['Dégradé']],
  [/\bmoyens?\b|\bfair\b/, ['Moyen']], [/\bbons? etats?\b|\ben bon etat\b|\bgood condition\b|\bgood\b/, ['Bon']],
];
const VERDICTS = [
  [/\ba completer\b|\bcompleter\b|\bcomplement|\bto be complemented\b|\bneeds? (an? )?(complement|extension|additional)/, 'À compléter'],
  [/\ba renforcer\b|\brenforcer\b|\ba rehabiliter\b|\brehabilit|\bto be reinforced\b|\breinforce/, 'À renforcer'],
  [/\bsuffisants?\b|\bsufficient\b/, 'Suffisant'],
];
const SOLS_BJ = [
  [/\bargil|\bvase|\bcompressible|\bclay/, 'Argiles et vases compressibles'], [/\bsable|\bsand/, 'Sables littoraux'],
  [/\blaterit|\bterre de barre/, 'Terre de barre (sols latéritiques)'],
];
const FINS_BJ = [
  [/\bbailleurs?\b|\blenders?\b|\bdonors?\b/, 'Bailleur (programme)'], [/\bbudget communal\b|\bmunicipal budget\b|\bcommune\b/, 'Budget communal'],
  [/\bfonds (d'entretien )?routier\b|\broad (maintenance )?fund\b/, 'Fonds d’entretien routier'],
];
const EX_GN = {
  fr: {
    map: ['Ouvrages d’art à compléter', 'Top 5 des ouvrages prioritaires', 'Pistes en mauvais état',
      'Ouvrages qui acheminent plus de 50 000 t de produits agricoles', 'Ouvrages qui relient le plus de ménages agricoles', 'Efficacité inférieure à 60 %',
      'Active la couche bassins', 'Budget 40 Md', 'Ouvre OA-01 en 3D'],
    viewer: ['Éléments critiques', 'Éléments P1 et leur coût', 'Colore par matériau', 'Montre la chaussée', 'Isole les poutres', 'Tout afficher', 'Retour à la carte'],
  },
  en: {
    map: ['Bridges and culverts to be complemented', 'Top 5 priority assets', 'Tracks in poor condition',
      'Assets carrying more than 50,000 t of farm produce', 'Assets linking the most farm households', 'Efficiency below 60%',
      'Turn on the basins layer', 'Budget 40 bn', 'Open OA-01 in 3D'],
    viewer: ['Critical elements', 'P1 elements and their cost', 'Colour by material', 'Show the pavement', 'Isolate the girders', 'Show all', 'Back to the map'],
  },
};
const TYPES_GN = [
  [/\bponts?\b|\bbridges?\b(?! (and|&) culverts?)/, (a) => a.type.startsWith('Pont'), ['Ponts', 'Bridges']],
  [/\bdalots?\b|\bbox culverts?\b/, (a) => a.type.startsWith('Dalot'), ['Dalots', 'Box culverts']],
  [/\bbuses?\b|\bsteel culverts?\b|(?<!(and|&) )\bculverts?\b(?! box)/, (a) => a.type === 'Buse métallique', ['Buses métalliques', 'Steel culverts']],
  [/\bradiers?\b|\bdrifts?\b|\bsubmersibles?\b/, (a) => a.type === 'Radier submersible', ['Radiers submersibles', 'Submersible drifts']],
  [/\bremblais?\b|\bembankments?\b/, (a) => a.type === 'Section en remblai sur zone basse', ['Sections en remblai', 'Embankment sections']],
  [/\bpistes? en terre\b|\bearth tracks?\b/, (a) => a.type === 'Piste en terre', ['Pistes en terre', 'Earth tracks']],
  [/\bpistes? en laterite\b|\blaterite tracks?\b|\bgravel tracks?\b/, (a) => a.type === 'Piste en latérite', ['Pistes en latérite', 'Laterite tracks']],
];
const FAMS_GN = [
  [/\bouvrages? d'art\b|\bbridges? (and|&) culverts?\b|\bstructures?\b/, 'Ouvrages d’art', ['Ouvrages d’art', 'Bridges & culverts']],
  [/\broutes? revetues?\b|\broutes? bitumees?\b|\bsections? (de route|bitumees?)\b|\bpaved roads?\b|\broutes? nationales?\b|\bnational roads?\b/, 'Routes revêtues', ['Routes revêtues', 'Paved roads']],
  [/\bpistes?\b|\btracks?\b|\brural roads?\b/, 'Pistes rurales', ['Pistes rurales', 'Rural tracks']],
];
const SOLS_GN = [
  [/\bvase|\bmangrove|\bmud/, 'Vases de mangrove'], [/\balluvion|\bsable|\bsand|\balluvium/, 'Alluvions argilo-sableuses'],
  [/\blaterit|\bferral/, 'Sols ferrallitiques (latérite)'],
];
const FINS_GN = [
  [/\bbailleurs?\b|\blenders?\b|\bdonors?\b/, 'Bailleur (programme)'], [/\bcollectivit|\blocal authorit/, 'Collectivité locale'],
  [/\bbudget national\b|\bnational (investment )?budget\b|\bbnd\b/, 'Budget national d’investissement'],
  [/\bfonds (d'entretien )?routier\b|\broad (maintenance )?fund\b/, 'Fonds d’entretien routier'],
];
const VOCAB = {
  bj: { EX: EX_BJ, TYPES: TYPES_BJ, FAMS: FAMS_BJ, SOLS: SOLS_BJ, FINS: FINS_BJ, codes: /\b(vo|dr|bp)\s*-?\s*(\d{1,2})\b|\bdlt\s*-?\s*0?1\b/,
    fac: [[/ecole|school/, 'École', ['d’une école', 'of a school']], [/sante|health/, 'Centre de santé', ['d’un centre de santé', 'of a health centre']], [/./, 'Marché', ['d’un marché', 'of a market']]],
    facRe: 'ecoles?|schools?|centres? de sante|health centres?|marches?|markets?' },
  gn: { EX: EX_GN, TYPES: TYPES_GN, FAMS: FAMS_GN, SOLS: SOLS_GN, FINS: FINS_GN, codes: /\b(oa|rn|pr)\s*-?\s*(\d{1,2})\b/,
    fac: [[/collecte|collection/, 'Point de collecte', ['d’un point de collecte', 'of a collection point']], [/sante|health/, 'Centre de santé', ['d’un centre de santé', 'of a health centre']], [/./, 'Marché', ['d’un marché', 'of a market']]],
    facRe: 'points? de collecte|collection points?|centres? de sante|health centres?|marches?|markets?' },
};
const FIELDS = [
  ['eff', /efficacit|efficien/], ['score', /\bscore\b/], ['inaction', /inaction/], ['cout', /\bcout|\bcost|\bmontant|\bprix\b|\bfcfa\b|\bgnf\b/],
  ['tmja', /\btmja\b|\btrafic|\btraffic|\bvehicul|\baadt\b/], ['tonnes', /\btonnes?\b|\btonnage|\bt\b|\bproduits? agricoles|\bfarm produce|\bagricultur/],
  ['menages', /\bmenages\b|\bhouseholds?\b|\bfoyers\b/], ['pop', /\bhabitants?\b|\bhab\b|\bpopulation|\bpeople\b|\bbeneficiair|\bbeneficiar|\bresidents\b/],
];
const LAYERS = [
  [/inondation|flood/, 'base', 'flood', ['Aléa inondation', 'Flood hazard']], [/\bsols?\b|geotech|soil/, 'base', 'sol', ['Géotechnique', 'Geotechnics']],
  [/population|densit/, 'base', 'pop', ['Densité de population', 'Population density']], [/trafic|traffic/, 'traffic', true, ['Trafic', 'Traffic']],
  [/equipements|facilities/, 'facilities', true, ['Équipements', 'Facilities']], [/bassins?( agricoles?| de production)?|basins?|agricole|farm|\bflux\b|\bflows?\b/, 'basins', true, ['Bassins agricoles', 'Farm basins']],
];
const COLORS_MAP = [[/efficacit|efficien/, 'eff', ['efficacité', 'efficiency']], [/verdict/, 'verdict', ['verdict', 'verdict']],
  [/\betat|condition/, 'etat', ['état', 'condition']], [/famille|family/, 'famille', ['famille', 'family']],
  [/financement|funding/, 'fin', ['financement', 'funding']], [/score|priorit/, 'score', ['score', 'score']]];
const COLORS_VIEW = [[/materi/, 'Materiau', ['matériau', 'material']], [/priorit/, 'PrioriteEntretien', ['priorité', 'priority']],
  [/\bnote|score/, 'NoteEtat', ['note d’état', 'condition score']], [/famille|family/, 'Famille', ['famille', 'family']],
  [/annee|year|service/, 'AnneeMiseEnService', ['année de mise en service', 'year in service']], [/classe|ifc/, 'ifcClass', ['classe IFC', 'IFC class']],
  [/\betat|condition/, 'Etat', ['état', 'condition']], [/origin/, 'original', ['couleurs d’origine', 'original colours']]];
const WEIGHTS = [[/etat|condition/, 'etat', ['état', 'condition']], [/population/, 'pop', ['population', 'population']], [/trafic|traffic/, 'trafic', ['trafic', 'traffic']],
  [/inondation|flood/, 'flood', ['inondation', 'flood']], [/\bsol|soil/, 'sol', ['sol', 'soil']], [/equipement|facilit/, 'equip', ['équipements', 'facilities']],
  [/rentabilit|financ|return/, 'fin', ['rentabilité', 'return']]];
const EL_KW = [
  [/\bmurs? en aile\b|\bwing ?walls?\b/, ['mur en aile']], [/\bmurs?\b|\bwalls?\b|\bfacades?\b|\bpignons?\b|\brefend/, ['mur', 'facade', 'pignon', 'refend']],
  [/\bdalles?\b|\bslabs?\b/, ['dalle', 'dallage', 'plancher']], [/\bradiers?\b/, ['radier']], [/\bpiedroits?\b/, ['piedroit']], [/\bperres?\b|\briprap\b/, ['perre', 'enrochement']],
  [/\bchaussee|\bpavement|\broad surface|\bcouches? de roulement|\bwearing course/, ['chaussee', 'couche de roulement']],
  [/\bpoutres?\b|\bgirders?\b/, ['poutre']], [/\bculees?\b|\babutments?\b/, ['culee']], [/\bpiles?\b|\bpiers?\b/, ['pile']],
  [/\bfosses?\b|\bditch(es)?\b|\bside drains?\b/, ['fosse']], [/\bplateformes?\b|\bplatforms?\b/, ['plateforme']],
  [/\baccotements?\b|\bshoulders?\b/, ['accotement']], [/\bappareils? d'appui|\bbearings?\b/, ['appareil']], [/\bhourdis\b|\bdeck\b/, ['hourdis']], [/\bgarde-corps|\bguardrails?|\brailings?/, ['garde-corps']], [/\bclotures?|\bfences?/, ['cloture']],
  [/\btoitures?|\btoits?\b|\broofs?\b|\bcouvertures?/, ['toiture', 'couverture', 'auvent']], [/\bpoteaux?|\bcolumns?/, ['poteau', 'file de poteaux']],
  [/\bpompes?|\bpumps?/, ['pompe']], [/\bbuses?\b|\bpipes?\b|\bconduites?/, ['buse', 'conduite']], [/\bregards?|\bmanholes?|\bavaloirs?/, ['regard', 'avaloir']],
  [/\btroncons?|\bsections?\b|\bcadres?/, ['troncon', 'cadre']], [/\bfondations?|\bfootings?/, ['fondation']], [/\betals?|\bstalls?/, ['etal']],
  [/\bcharpente|\btruss|\bbeams?/, ['charpente']], [/\bbeton|\bconcrete/, ['beton']], [/\bmaconnerie|\bmasonry/, ['maconnerie']],
];

function parseNumber(str) {
  const s0 = str.trim();
  if (/^\d{1,3}(?:[\s,]\d{3})+$/.test(s0)) return parseFloat(s0.replace(/[\s,]/g, ''));
  return parseFloat(s0.replace(/\s/g, '').replace(',', '.'));
}

/* ------------------------------------------------------------------ UI */
export function createAssistant(api) {
  const V = VOCAB[api.zone] || VOCAB.bj;
  const { EX, TYPES, FAMS, SOLS, FINS } = V;
  const GN = api.zone === 'gn';
  const L = () => api.lang();
  const tt = (k) => TXT[L()][k];
  const dock = document.createElement('div');
  dock.className = 'as-dock';
  dock.hidden = true;
  dock.innerHTML = `
    <button type="button" class="as-toggle" aria-expanded="false"></button>
    <section class="as-panel" hidden aria-label="assistant">
      <header class="as-head"><div><p class="as-title"></p><p class="as-note"></p></div><button type="button" class="as-min" aria-label="close">—</button></header>
      <div class="as-log" aria-live="polite"></div>
      <div class="as-chips"></div>
      <form class="as-form"><input type="text" class="as-input" autocomplete="off"><button type="submit" class="as-send"></button></form>
    </section>`;
  document.body.append(dock);
  const $ = (s) => dock.querySelector(s);
  const log = $('.as-log');
  let greeted = false;

  function labels() {
    $('.as-toggle').textContent = tt('open');
    $('.as-title').textContent = tt('title');
    $('.as-note').textContent = tt('note');
    $('.as-input').placeholder = tt('placeholder');
    $('.as-send').textContent = tt('send');
    $('.as-min').setAttribute('aria-label', tt('close'));
    chips();
  }
  function chips() {
    const ctx = api.viewer() ? 'viewer' : 'map';
    $('.as-chips').innerHTML = `<span class="as-chips-h mono">${esc(tt('examples'))} · ${esc(ctx === 'viewer' ? tt('viewerCtx') : tt('mapCtx'))}</span>` +
      EX[L()][ctx].map((e) => `<button type="button" class="as-chip">${esc(e)}</button>`).join('');
  }
  function say(html, who = 'bot') {
    const d = document.createElement('div');
    d.className = `as-msg as-${who}`;
    d.innerHTML = html;
    log.append(d);
    log.scrollTop = log.scrollHeight;
  }
  function openPanel(on) {
    $('.as-panel').hidden = !on;
    $('.as-toggle').hidden = on;
    $('.as-toggle').setAttribute('aria-expanded', String(on));
    dock.classList.toggle('is-open', on);
    if (on) {
      if (!greeted) { say(esc(tt('hello'))); greeted = true; }
      chips();
      $('.as-input').focus();
    }
  }
  $('.as-toggle').addEventListener('click', () => openPanel(true));
  $('.as-min').addEventListener('click', () => openPanel(false));
  $('.as-chips').addEventListener('click', (e) => { const b = e.target.closest('.as-chip'); if (b) ask(b.textContent); });
  $('.as-form').addEventListener('submit', (e) => { e.preventDefault(); const v = $('.as-input').value.trim(); if (v) { ask(v); $('.as-input').value = ''; } });
  log.addEventListener('click', (e) => {
    const b = e.target.closest('[data-code]');
    if (b) api.focus(b.getAttribute('data-code'));
  });
  new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  labels();

  async function ask(text) {
    say(esc(text), 'user');
    try {
      const out = await interpret(text);
      say(out);
    } catch (err) {
      console.error(err);
      say(esc(String(err.message || err)));
    }
    chips();
  }

  /* ---------------------------------------------------------------- interpreter */
  const en = () => L() === 'en';
  const lab = (pair) => pair[en() ? 1 : 0];
  const fmt = (n) => new Intl.NumberFormat(en() ? 'en-GB' : 'fr-FR').format(Math.round(n));
  const money = (n) => (api.money ? api.money(n) : `${new Intl.NumberFormat(en() ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }).format(n / 1e6)} M FCFA`);
  const UNIT = api.unit || 1e6;
  const pct = (x) => (en() ? `${Math.round(x * 100)}%` : `${Math.round(x * 100)} %`);
  const crit = (arr) => `<p class="as-crit"><span class="mono">${esc(tt('understood'))}</span> ${arr.map((c) => `<span class="as-tag">${esc(c)}</span>`).join(' ')}</p>`;
  const codeBtn = (c) => `<button type="button" class="as-code mono" data-code="${esc(c)}">${esc(c)}</button>`;
  const help = () => `${esc(tt('nothing'))}<ul>${EX[L()][api.viewer() ? 'viewer' : 'map'].slice(0, 5).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;

  function findCode(q) {
    const m = q.match(V.codes);
    if (!m) return null;
    if (m[0].startsWith('dlt')) return 'DLT01';
    return `${m[1].toUpperCase()}-${m[2].padStart(2, '0')}`;
  }

  async function interpret(raw) {
    const q = norm(raw);
    const viewer = api.viewer();

    if (/^(aide|help|exemples?|examples?|que (peux|sais)-tu|bonjour|salut|hello|hi)\b/.test(q)) return `${esc(tt('hello'))}<br>${help().replace(esc(tt('nothing')), esc(en() ? 'For example:' : 'Par exemple :'))}`;

    // close the 3D panel
    if (viewer && /(retour (a la )?carte|ferme|fermer|close|back to (the )?map|quitter)/.test(q)) { api.close3d(); return esc(tt('closed')); }

    // clear / reset
    if (/^(efface|effacer|reinitialis|reset|clear|annule|tout afficher|show all|affiche tout)/.test(q)) {
      if (viewer) { viewer.query({ reset: true }); return esc(en() ? 'All elements are shown again.' : 'Tous les éléments sont de nouveau affichés.'); }
      api.setQuery(null); return esc(tt('cleared'));
    }

    // budget
    let m = q.match(/\b(budget|enveloppe|envelope)\b[^\d]{0,25}(\d[\d\s]*(?:[.,]\d+)?)\s*(md|milliards?|bn|billions?|m\b|millions?|k\b)?/);
    if (m && !/\b(finance|funded|ouvrages?|assets?)\b.*\bbudget communal\b/.test(q) && !/budget communal|municipal budget/.test(q)) {
      let v = parseNumber(m[2]);
      const u = m[3] || '';
      if (/^(md|milliard|bn|billion)/.test(u)) v *= 1e9; else if (/^k/.test(u)) v *= 1e3; else if (/^m/.test(u)) v *= 1e6; else if (v < 10000) v *= UNIT;
      const set = api.setBudget(v);
      return `${esc(tt('budgetSet')(money(set)))}<br>${esc(api.budgetSummary())}`;
    }

    // weights
    m = q.match(/\b(poids|weight)\b\s*(?:de |du |de la |des |de l'|of (the )?)?([a-z' ]+?)\s*(?:a|=|:|to|sur)?\s*(\d)\b/);
    if (m) {
      const w = WEIGHTS.find(([re]) => re.test(m[3]));
      if (w) { api.setWeight(w[1], Number(m[4])); return esc(tt('weightSet')(lab(w[2]), m[4])) + '<br>' + esc(api.topSummary(5)); }
    }
    if (/(reinitialise|reset).*(poids|weights)/.test(q)) { api.resetWeights(); return esc(tt('weightsReset')); }

    // colour by
    m = q.match(/\b(colore|colorie|colorer|colour|color)\w*\b.*\b(par|by|selon|according to)\b\s*(.+)$/);
    if (m) {
      if (viewer) {
        const c = COLORS_VIEW.find(([re]) => re.test(m[3]));
        if (c) { viewer.query({ color: c[1] }); return esc(tt('elColorSet')(lab(c[2]))); }
      } else {
        const c = COLORS_MAP.find(([re]) => re.test(m[3]));
        if (c) { api.setColor(c[1]); return esc(tt('colorSet')(lab(c[2]))); }
      }
    }

    // layers
    const on = /^(active|activer|affiche|afficher|montre|montrer|ajoute|ajouter|superpose|show|display|turn on|add|enable)\b/.test(q) || /\bcouche\b|\blayer\b/.test(q);
    const off = /^(masque|masquer|cache|cacher|retire|retirer|desactive|desactiver|enleve|hide|remove|turn off|disable)\b/.test(q);
    if ((on || off) && !viewer) {
      const hits = LAYERS.filter(([re]) => re.test(q));
      if (hits.length && (/\bcouche|\blayer/.test(q) || !/(ouvrages?|assets?|ecoles?|routes?)/.test(q))) {
        const msgs = hits.map(([, key, val, names0]) => { const names = key === 'basins' && api.basinsLabel ? api.basinsLabel : names0; api.setLayer(key, off ? (key === 'base' ? 'none' : false) : val); return off ? tt('layerOff')(lab(names)) : tt('layerOn')(lab(names)); });
        return esc(msgs.join(' '));
      }
    }

    // asset code: open 3D / focus
    const code = findCode(q);
    if (code) {
      const a = api.assets().find((x) => x.code === code);
      if (!a) return esc(tt('unknownCode')(code));
      const wants3d = /\b3d\b|maquette|visionneuse|ouvr(e|ir)|open|model|viewer|bim/.test(q);
      const elSpec = elementSpec(q);
      if (wants3d || (elSpec.any && !viewer)) {
        const v = await api.open3d(code);
        let extra = '';
        if (v && elSpec.any) extra = '<br>' + viewerAnswer(v.query(elSpec.spec), elSpec.tags);
        return esc(tt('opening')(code)) + extra;
      }
      if (viewer && elSpec.any) return viewerAnswer(viewer.query(elSpec.spec), elSpec.tags);
      api.focus(code);
      return assetCard(a);
    }

    // element-level query when a model is open
    if (viewer) {
      const es = elementSpec(q);
      if (es.any) return `<p class="as-muted">${esc(tt('viewerHint'))}</p>` + viewerAnswer(viewer.query(es.spec), es.tags);
    }

    // asset-level query
    return assetQuery(q, raw);
  }

  function elementSpec(q) {
    const spec = {}; const tags = [];
    const et = ETATS.find(([re]) => re.test(q));
    if (et) { spec.etats = et[1]; tags.push(`${en() ? 'condition' : 'état'} ∈ {${et[1].map((x) => (en() ? { Bon: 'Good', Moyen: 'Fair', 'Dégradé': 'Poor', Critique: 'Critical' }[x] : x)).join(', ')}}`); }
    const pr = [...q.matchAll(/\bp([123])\b/g)].map((x) => `P${x[1]}`);
    if (/\burgent/.test(q)) pr.push('P1');
    if (pr.length) { spec.prios = [...new Set(pr)]; tags.push(`${en() ? 'priority' : 'priorité'} ∈ {${spec.prios.join(', ')}}`); }
    const kws = [];
    for (const [re, k] of EL_KW) if (re.test(q)) { kws.push(...k); tags.push(k[0]); if (re.source.includes('aile')) break; }
    if (kws.length) spec.kws = kws.map(norm);
    if (/\bisole|\bisolate/.test(q)) spec.isolate = true;
    spec.phrase = q;
    if (/\btrie|\bsort/.test(q) && /cout|cost/.test(q)) { spec.sort = { key: 'CoutEstime', dir: -1 }; tags.push(en() ? 'sort: cost ↓' : 'tri : coût ↓'); }
    const any = !!(spec.etats || spec.prios || spec.kws || spec.isolate || spec.sort || /\belements?\b/.test(q));
    return { spec, tags, any };
  }

  function viewerAnswer(r, tags) {
    if (!r.count) return (tags.length ? crit(tags) : '') + esc(en() ? 'No element matches in this model.' : 'Aucun élément ne correspond dans cette maquette.');
    const list = r.items.slice().sort((x, y) => y.cout - x.cout).slice(0, 8)
      .map((i) => `<li>${esc(i.name)} — ${esc(i.etat)}, ${esc(i.prio)}, ${fmt(i.cout)} ${esc(r.currency || 'FCFA')}</li>`).join('');
    return (tags.length ? crit(tags) : '') + `<p><strong>${esc(tt('elements')(r.count))}</strong> · ${esc(tt('totalCost'))} ${fmt(r.total)} ${esc(r.currency || 'FCFA')}</p><ul>${list}</ul>`;
  }

  function assetCard(a) {
    const im = a.impact;
    const col0 = en() ? ': ' : ' : ';
    const nf = (x) => (x.d ? new Intl.NumberFormat(en() ? 'en-GB' : 'fr-FR', { minimumFractionDigits: x.d, maximumFractionDigits: x.d }).format(x.v) : fmt(x.v));
    const k = im.kpis.filter((x) => !x.txt).slice(0, 3).map((x) => `<li>${esc(en() ? x.en : x.fr)}${col0}${nf(x)} ${esc(en() ? x.uen : x.ufr)}</li>`).join('');
    const col = en() ? ': ' : ' : ';
    return `<p>${codeBtn(a.code)} <strong>${esc(api.tv(a.type))}</strong> — ${esc(api.tv(a.etat))}, score ${a.score}/100 (#${a.rank})</p>
      <ul>${k}<li>${esc(en() ? 'Efficiency' : 'Efficacité')}${col}${pct(im.eff)} → ${pct(im.eff_rehab)}</li>
      <li>${esc(tt('verdict'))}${col}<strong>${esc(api.tv(im.verdict))}</strong></li>
      ${im.complement ? `<li>${esc(tt('complement'))}${col}${esc(en() ? im.complement.en : im.complement.fr)} (${money(im.complement.cost)})</li>` : ''}</ul>`;
  }

  function benefOf(a, field) {
    if (GN) return field === 'tonnes' ? a.impact.benef : field === 'menages' ? a.impact.hh : field === 'pop' ? a.pop : null;
    if (field === 'tonnes') return a.famille.startsWith('Voirie') ? a.impact.benef : null;
    if (field === 'menages') return a.famille.startsWith('Drainage') ? a.impact.benef : null;
    if (field === 'pop') return a.famille.startsWith('Bâtiments') ? a.impact.benef : a.pop;
    return null;
  }

  function assetQuery(q, raw) {
    let A = api.assets().slice();
    const tags = [];
    let text = q;

    // proximity to facilities
    const prox = text.match(new RegExp(`(?:a moins de|dans un rayon de|within|less than|under)?\\s*(\\d+(?:[.,]\\d+)?)\\s*(km|m|metres?|meters?)\\s*(?:d'une?|de la|du|des|d'un|of an?|from an?|of)\\s*(${V.facRe})`))
      || text.match(new RegExp(`(?:pres|proche|a proximite)\\s*(?:d'une?|de|du|des)\\s*(${V.facRe})|\\bnear (?:an? )?(${V.facRe})`));
    if (prox) {
      let dist = 500; let what;
      if (prox[3]) { dist = parseNumber(prox[1]) * (prox[2] === 'km' ? 1000 : 1); what = prox[3]; } else what = prox[1] || prox[2];
      const fdef = V.fac.find(([re]) => re.test(what));
      const ftype = fdef[1];
      A = A.filter((a) => api.nearest(a, ftype) <= dist);
      tags.push(`${en() ? 'within' : 'à moins de'} ${fmt(dist)} m ${fdef[2][en() ? 1 : 0]}`);
      text = text.replace(prox[0], ' ');
    }

    // type / family (types first; family only if no type)
    const types = TYPES.filter(([re]) => re.test(text));
    if (types.length) {
      A = A.filter((a) => types.some(([, f]) => f(a)));
      tags.push(types.map(([, , n]) => lab(n)).join(' + '));
    } else {
      const fams = FAMS.filter(([re]) => re.test(text));
      if (fams.length) { A = A.filter((a) => fams.some(([, f]) => a.famille === f)); tags.push(fams.map(([, , n]) => lab(n)).join(' + ')); }
    }

    // condition
    const et = ETATS.find(([re]) => re.test(text));
    if (et) { A = A.filter((a) => et[1].includes(a.etat)); tags.push(`${en() ? 'condition' : 'état'} ∈ {${et[1].map((x) => api.tv(x)).join(', ')}}`); }

    // verdict
    const vd = VERDICTS.filter(([re]) => re.test(text));
    if (vd.length) { A = A.filter((a) => vd.some(([, v]) => a.impact.verdict === v)); tags.push(`${tt('verdict')}${en() ? ': ' : ' : '}${vd.map(([, v]) => api.tv(v)).join(' / ')}`); }

    // flood zone / soil
    if (/zones? inondables?|inondables?\b|flood[- ]prone|alea (d'inondation )?(eleve|fort)|high flood/.test(text)) {
      const thr = /tres (eleve|fort)|very high/.test(text) ? 0.75 : 0.5;
      A = A.filter((a) => a.flood >= thr); tags.push(`${en() ? 'flood hazard' : 'aléa inondation'} ≥ ${thr}`);
    }
    const so = SOLS.find(([re]) => re.test(text));
    if (so) { A = A.filter((a) => a.sol === so[1]); tags.push(api.tv(so[1])); }

    // funding
    if (/non finances?|hors enveloppe|not funded|unfunded|outside the envelope/.test(text)) { A = A.filter((a) => !a.funded); tags.push(en() ? 'not funded' : 'non financés'); }
    else if (/\bfinances?\b|\bfunded\b|dans l'enveloppe|within the envelope/.test(text)) { A = A.filter((a) => a.funded); tags.push(en() ? 'funded' : 'financés'); }
    const fi = FINS.find(([re]) => re.test(text));
    if (fi) { A = A.filter((a) => a.financement === fi[1]); tags.push(api.tv(fi[1])); }

    // numeric comparisons
    const cleaned = text.replace(/\b(vo|dr|bp|oa|rn|pr)\s*-?\s*\d{1,2}\b/g, ' ').replace(/\b(top|les|the|first|premiers?)\s+\d+\b/g, ' ');
    const numRe = /(\d{1,3}(?:[\s,]\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?)\s*(%|md\b|milliards?|bn\b|m\b|millions?|k\b|fcfa|gnf|tonnes?|t\b|habitants?|hab\b|menages|households?|vehicules?|veh\b)?/g;
    let mm;
    while ((mm = numRe.exec(cleaned))) {
      const before = cleaned.slice(Math.max(0, mm.index - 45), mm.index);
      const after = cleaned.slice(mm.index, mm.index + mm[0].length + 30);
      let op = null;
      const opDefs = [[/(>=|≥|au moins|at least|minimum)\s*$/, '>='], [/(<=|≤|au plus|at most|maximum)\s*$/, '<='],
        [/(>|plus de|superieure? a|superieurs? a|more than|over|above|greater than|depassant|depasse)\s*$/, '>'],
        [/(<|moins de|inferieure? a|inferieurs? a|less than|under|below|fewer than|sous)\s*$/, '<']];
      const tail = before.replace(/\s*(de|d'|du|des|of|than|a)\s*$/, (x) => x);
      for (const [re, o] of opDefs) { if (re.test(tail.trimEnd()) || re.test(before.trimEnd())) { op = o; break; } }
      if (!op) { const near = before.slice(-20); for (const [re, o] of opDefs) if (new RegExp(re.source.replace('\\s*$', '')).test(near)) { op = o; break; } }
      if (!op) continue;
      const ctx = `${before} ${after}`;
      let field = null;
      const unit = (mm[2] || '').trim();
      if (unit === '%') field = /score/.test(before) ? 'score' : 'eff';
      else if (/^(tonnes?|t)$/.test(unit)) field = 'tonnes';
      else if (/^(habitants?|hab)$/.test(unit)) field = 'pop';
      else if (/^(menages|households?)$/.test(unit)) field = 'menages';
      else if (/^(vehicules?|veh)$/.test(unit)) field = 'tmja';
      if (!field) for (const [f, re] of FIELDS) if (re.test(before.slice(-40))) { field = f; break; }
      if (!field) for (const [f, re] of FIELDS) if (re.test(ctx)) { field = f; break; }
      if (!field) continue;
      let v = parseNumber(mm[1]);
      if (field === 'cout' || field === 'inaction') {
        if (/^(md|milliard|bn)/.test(unit)) v *= 1e9; else if (/^k/.test(unit)) v *= 1e3; else if (/^m/.test(unit)) v *= 1e6; else if (v < 10000) v *= UNIT;
      } else if (/^k$/.test(unit)) v *= 1e3;
      if (field === 'eff' && v > 1) v /= 100;
      const get = (a) => (field === 'eff' ? a.impact.eff : field === 'score' ? a.score : field === 'cout' ? a.cout : field === 'inaction' ? a.inaction
        : field === 'tmja' ? a.tmja : benefOf(a, field));
      const cmp = { '>': (x) => x > v, '<': (x) => x < v, '>=': (x) => x >= v, '<=': (x) => x <= v }[op];
      A = A.filter((a) => { const x = get(a); return x != null && cmp(x); });
      const fl = { eff: en() ? 'efficiency' : 'efficacité', score: 'score', cout: en() ? 'cost' : 'coût', inaction: en() ? 'cost of inaction' : 'coût de l’inaction',
        tmja: 'TMJA', tonnes: en() ? 'farm produce (t/yr)' : 'produits agricoles (t/an)', menages: GN ? (en() ? 'farm households linked' : 'ménages agricoles reliés') : (en() ? 'households protected' : 'ménages protégés'), pop: en() ? 'population served' : 'population desservie' }[field];
      const shown = field === 'eff' ? pct(v) : (field === 'cout' || field === 'inaction') ? money(v) : fmt(v);
      tags.push(`${fl} ${op.replace('>=', '≥').replace('<=', '≤')} ${shown}`);
    }

    // top N and sorting
    let sortKey = null; let dir = -1;
    if (/moins efficaces?|least efficient|plus faible efficacite|lowest efficiency/.test(text)) { sortKey = 'eff'; dir = 1; }
    else if (/plus efficaces?|most efficient|meilleure efficacite/.test(text)) sortKey = 'eff';
    else if (/plus (cher|couteux)|most expensive|plus gros cout/.test(text)) sortKey = 'cout';
    else if (/impact|beneficiair|beneficiar|plus utiles?|most useful|servent le plus|le plus de (menages|habitants|tonnes|personnes)|most (households|people|tonnes)|protegent le plus|desservent le plus|evacuent le plus|carry the most|protect the most|serve the most|link(ing|s)? the most|relient le plus|relie le plus/.test(text)) {
      sortKey = 'benef';
      if (GN && /menages|households|relient|link/.test(text)) sortKey = 'hh';
      const fam = GN ? null : /menages|households|protege|protect|inondation|flood/.test(text) ? 'Drainage & assainissement'
        : /tonnes|agricole|farm|evacu|carry/.test(text) ? 'Voirie & ouvrages d\u2019art'
        : /habitants|people|personnes|desserv|serve/.test(text) ? 'Bâtiments publics' : null;
      if (fam && !A.every((a) => a.famille === fam)) { A = A.filter((a) => a.famille === fam); tags.push(api.tv(fam)); }
    }
    else if (/inaction/.test(text) && /top|plus|most|highest/.test(text)) sortKey = 'inaction';
    else if (/prioritaires?|priorite|priority|urgent|classement|ranking/.test(text)) sortKey = 'score';
    const topm = text.match(/\b(?:top|les|the|first|premiers?)\s*(\d+)\b/);
    if (sortKey || topm) {
      const k = sortKey || 'score';
      const val = (a) => (k === 'eff' ? a.impact.eff : k === 'cout' ? a.cout : k === 'benef' ? a.impact.benef : k === 'hh' ? a.impact.hh || 0 : k === 'inaction' ? a.inaction : a.score);
      A.sort((x, y) => (val(y) - val(x)) * (dir === -1 ? 1 : -1));
      const kl = { eff: en() ? 'efficiency' : 'efficacité', cout: en() ? 'cost' : 'coût', benef: en() ? 'impact' : 'impact', hh: en() ? 'farm households' : 'ménages agricoles', inaction: en() ? 'inaction' : 'inaction', score: 'score' }[k];
      tags.push(`${en() ? 'sort' : 'tri'} : ${kl} ${dir === -1 ? '↓' : '↑'}`);
    } else A.sort((x, y) => y.score - x.score);
    if (topm) { A = A.slice(0, Number(topm[1])); tags.push(`top ${topm[1]}`); }

    if (!tags.length) return help();
    api.setQuery(A.map((a) => a.code), raw);
    if (!A.length) return crit(tags) + esc(tt('none'));
    const total = A.reduce((s, a) => s + a.cout, 0);
    const effAvg = A.reduce((s, a) => s + a.impact.eff, 0) / A.length;
    const countQ = /combien|how many|nombre/.test(text);
    let html = crit(tags);
    html += `<p><strong>${esc(tt('assets')(A.length))}</strong> · ${esc(tt('totalCost'))} ${money(total)} · ${esc(tt('avgEff'))} ${pct(effAvg)}</p>`;
    if (A.length === 1) return html + assetCard(A[0]);
    if (!countQ || A.length <= 10) {
      html += `<ul class="as-list">${A.slice(0, 10).map((a) => `<li>${codeBtn(a.code)} ${esc(api.tv(a.type))} — ${esc(api.tv(a.etat))} · ${pct(a.impact.eff)} · <em>${esc(api.tv(a.impact.verdict))}</em> · ${esc(en() ? a.impact.label.en : a.impact.label.fr)}</li>`).join('')}</ul>`;
    }
    const comp = A.filter((a) => a.impact.complement);
    if (comp.length) html += `<p class="as-muted">${esc(tt('complement'))}${en() ? ': ' : ' : '}${comp.length} · ${money(comp.reduce((s, a) => s + a.impact.complement.cost, 0))}</p>`;
    return html;
  }

  return {
    show(on) { dock.hidden = !on; },
    refresh: chips,
    ask,
    el: dock,
  };
}
