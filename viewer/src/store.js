// GIN²CO — demonstration store: fictitious members, rights, and data kept in this browser only (localStorage).
// A real deployment replaces this module with a server API (see the target architecture note).

export const MEMBERS = [
  { id: 'm1', name: 'Fatoumata Camara', role: 'mo', fr: 'Directrice du patrimoine — maître d’ouvrage', en: 'Asset director — asset owner' },
  { id: 'm2', name: 'Ibrahima Sow', role: 'tech', fr: 'Ingénieur d’entretien', en: 'Maintenance engineer' },
  { id: 'm3', name: 'Mariama Bah', role: 'ministre', fr: 'Conseillère technique du ministre', en: 'Technical adviser to the minister' },
  { id: 'm4', name: 'Jean Haba', role: 'bailleur', fr: 'Chargé de projet — bailleur', en: 'Project officer — funder' },
  { id: 'm5', name: 'Aminata Touré', role: 'audit', fr: 'Auditrice', en: 'Auditor' },
  { id: 'm6', name: 'Entreprise de travaux (fictive)', role: 'entreprise', fr: 'Entreprise de travaux', en: 'Works contractor' },
  { id: 'm7', name: 'Bureau de contrôle (fictif)', role: 'controle', fr: 'Bureau de contrôle', en: 'Supervision engineer' },
  { id: 'm8', name: 'DigitInfra', role: 'admin', fr: 'Administrateur de la plateforme', en: 'Platform administrator' },
];

// Rights by role. Kept deliberately simple and readable.
// What each role sees in the platform: spaces (menu) and dashboard views ("casquettes").
export const ACCESS = {
  // spaces: home (actions + dashboard of the role) · map / assets / dash = modes of the « Patrimoine » space (map, register, prioritisation) · proj · collab · ged
  // the register is open to every role; editing it depends on RIGHTS
  ministre: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'collab', 'ged'], views: ['ministre'] },
  mo: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'collab', 'ged'], views: ['mo', 'tech'] },
  tech: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: ['tech'] },
  bailleur: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'collab', 'ged'], views: ['bailleur'] },
  audit: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: ['audit'] },
  controle: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: ['tech'] },
  entreprise: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: [] },
  admin: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'collab', 'ged'], views: ['ministre', 'mo', 'tech', 'bailleur', 'audit'] },
};

export const RIGHTS = {
  editAsset: ['mo', 'tech', 'controle', 'admin'],
  addAsset: ['mo', 'admin'],
  manageData: ['mo', 'admin'],
  manageProject: ['mo', 'admin'],
  validateStep: ['mo', 'controle', 'admin'],
  checkQuality: ['controle', 'tech', 'mo', 'admin'],
  assignTask: ['mo', 'tech', 'controle', 'admin'],
  uploadDoc: ['mo', 'tech', 'controle', 'entreprise', 'admin'],
  publishDoc: ['mo', 'controle', 'admin'],
  comment: ['mo', 'tech', 'ministre', 'bailleur', 'audit', 'entreprise', 'controle', 'admin'],
};

const fresh = () => ({ v: 1, user: 'm1', edits: {}, added: [], log: [], projects: null, tasks: [], comments: [], activity: [], seq: 1 });

/* Institutional profile set (co-branded demonstrator): 4 levels + project intervenants (ISO 19650 appointed parties).
   perim: all = whole portfolio · grands = major projects whatever the owner · tp / agri = owner's perimeter · team = projects the member is invited to */
export const LEVELS = {
  1: { fr: 'Niveau 1 — Gouvernant', en: 'Level 1 — Government' },
  2: { fr: 'Niveau 2 — Administrateurs', en: 'Level 2 — Administrators' },
  3: { fr: 'Niveau 3 — Suivi et appui', en: 'Level 3 — Monitoring and support' },
  4: { fr: 'Niveau 4 — Maître d’ouvrage', en: 'Level 4 — Asset owner' },
  int: { fr: 'Intervenants des projets (parties désignées)', en: 'Project contributors (appointed parties)' },
};
export const MOA = { tp: { fr: 'Ministère des Travaux publics', en: 'Ministry of Public Works' }, agri: { fr: 'Ministère de l’Agriculture', en: 'Ministry of Agriculture' } };
const GOUV = {
  members: [
    { id: 'm9', name: 'Alpha Kaba', role: 'gouv', level: 1, org: 'PRG', perim: 'all', fr: 'Présidence de la République — conseiller chargé des grands projets', en: 'Presidency — adviser for major projects' },
    { id: 'm3', name: 'Mariama Bah', role: 'gouv', level: 1, org: 'PRIM', perim: 'all', fr: 'Primature — conseillère technique du Premier ministre', en: 'Prime Minister’s Office — technical adviser' },
    { id: 'm10', name: 'Sékou Condé', role: 'gouv', level: 1, org: 'MPCID', perim: 'all', fr: 'Ministère du Plan, de la Coopération internationale et du Développement — programmation des investissements', en: 'Ministry of Planning, International Cooperation and Development — investment programming' },
    { id: 'm11', name: 'Kadiatou Diallo', role: 'admin', level: 2, org: 'ONDRG', perim: 'all', fr: 'ONDRG — administratrice de la plateforme', en: 'ONDRG — platform administrator' },
    { id: 'm8', name: 'DigitInfra', role: 'admin', level: 2, org: 'DI', perim: 'all', fr: 'DigitInfra — administration technique de la plateforme', en: 'DigitInfra — technical platform administration' },
    { id: 'm4', name: 'Jean Haba', role: 'suivi', level: 3, org: 'ACGP', perim: 'grands', fr: 'ACGP — ingénieur chargé du suivi des grands projets', en: 'ACGP — major projects monitoring engineer' },
    { id: 'm5', name: 'Aminata Touré', role: 'suivi', level: 3, org: 'BTAP', perim: 'grands', fr: 'BTAP — chargée du suivi et de l’appui', en: 'BTAP — monitoring and support officer' },
    { id: 'm1', name: 'Fatoumata Camara', role: 'mo', level: 4, org: 'MTP', perim: 'tp', fr: 'Ministère des Travaux publics — directrice du patrimoine (MOA)', en: 'Ministry of Public Works — asset director (owner)' },
    { id: 'm2', name: 'Ibrahima Sow', role: 'mo', level: 4, org: 'MTP', perim: 'tp', fr: 'Ministère des Travaux publics — BSD, ingénieur d’entretien', en: 'Ministry of Public Works — strategy office, maintenance engineer' },
    { id: 'm12', name: 'Mamadou Sylla', role: 'mo', level: 4, org: 'MAG', perim: 'agri', fr: 'Ministère de l’Agriculture — BSD, chargé des pistes rurales', en: 'Ministry of Agriculture — strategy office, rural tracks' },
    { id: 'm13', name: 'Bureau d’études (fictif)', role: 'bet', level: 'int', org: 'BET', perim: 'team', fr: 'Bureau d’études — conception et maquettes', en: 'Design consultant — design and models' },
    { id: 'm6', name: 'Entreprise de travaux (fictive)', role: 'entreprise', level: 'int', org: 'ENT', perim: 'team', fr: 'Entreprise de travaux', en: 'Works contractor' },
    { id: 'm7', name: 'Bureau de contrôle (fictif)', role: 'controle', level: 'int', org: 'BCT', perim: 'team', fr: 'Bureau de contrôle', en: 'Supervision engineer' },
  ],
  access: {
    gouv: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'ged'], views: ['ministre', 'bailleur'] },
    admin: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'collab', 'ged'], views: ['ministre', 'mo', 'tech', 'bailleur', 'audit'] },
    suivi: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: ['tech', 'audit'] },
    mo: { spaces: ['home', 'map', 'assets', 'dash', 'proj', 'collab', 'ged'], views: ['mo', 'tech'] },
    bet: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: [] },
    entreprise: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: [] },
    controle: { spaces: ['home', 'map', 'assets', 'proj', 'collab', 'ged'], views: ['tech'] },
  },
  // ISO 19650: the owner (appointing party) accepts and publishes; contributors produce and share; administrators run the platform without approving content
  rights: {
    editAsset: ['mo'], addAsset: ['mo'], manageData: ['admin'], manageProject: ['mo'], validateStep: ['mo'],
    checkQuality: ['mo', 'controle', 'suivi'], assignTask: ['mo', 'controle', 'bet'], uploadDoc: ['mo', 'bet', 'entreprise', 'controle'],
    publishDoc: ['mo'], comment: ['mo', 'bet', 'entreprise', 'controle', 'suivi', 'admin'], flagGrand: ['admin'],
  },
};
export let PROFILE_SET = 'default';
/** Switches the shared member / access / rights tables to another profile set (modules keep their references). */
export function useProfileSet(name) {
  if (name !== 'gouv') return;
  PROFILE_SET = 'gouv';
  MEMBERS.splice(0, MEMBERS.length, ...GOUV.members);
  for (const k of Object.keys(ACCESS)) delete ACCESS[k];
  Object.assign(ACCESS, GOUV.access);
  for (const k of Object.keys(RIGHTS)) delete RIGHTS[k];
  Object.assign(RIGHTS, GOUV.rights);
}

export function createStore(zone, suffix = '') {
  const KEY = `gin2co-demo-${zone}${suffix}-v1`;
  let st = fresh();
  let persistent = true;
  try { const raw = localStorage.getItem(KEY); if (raw) st = { ...fresh(), ...JSON.parse(raw) }; } catch { persistent = false; }
  const subs = new Set();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { persistent = false; } };
  const emit = (what) => { save(); subs.forEach((f) => f(what)); };
  const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const me = () => MEMBERS.find((m) => m.id === st.user) || MEMBERS[0];

  return {
    get state() { return st; },
    get persistent() { return persistent; },
    me, stamp,
    can: (right) => (RIGHTS[right] || []).includes(me().role),
    setUser(id) { st.user = id; emit('user'); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    nextId(prefix) { st.seq += 1; return `${prefix}${st.seq}`; },
    log(code, what, kind = 'asset') {
      st.log.push({ when: stamp(), who: me().name, role: me().role, code, what, kind });
      st.activity.push({ when: stamp(), who: me().id, code, what, kind });
    },
    activity(code, what, kind) { st.activity.push({ when: stamp(), who: me().id, code, what, kind }); },
    commit(what) { emit(what); },
    exportJSON() { return JSON.stringify({ format: 'gin2co-demo', zone, exported: stamp(), data: st }, null, 2); },
    importJSON(txt) {
      const o = JSON.parse(txt);
      if (o.format !== 'gin2co-demo' || o.zone !== zone || !o.data) throw new Error('format');
      st = { ...fresh(), ...o.data }; emit('import');
    },
    reset() { st = fresh(); try { localStorage.removeItem(KEY); } catch { /* ignore */ } emit('reset'); },
  };
}
