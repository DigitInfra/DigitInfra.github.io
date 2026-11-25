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
  ministre: { spaces: ['home', 'map', 'dash', 'prof', 'collab', 'ged'], views: ['ministre'] },
  mo: { spaces: ['home', 'map', 'dash', 'prof', 'assets', 'proj', 'collab', 'ged'], views: ['mo', 'tech'] },
  tech: { spaces: ['home', 'map', 'prof', 'assets', 'proj', 'collab', 'ged'], views: ['tech'] },
  bailleur: { spaces: ['home', 'map', 'dash', 'prof', 'proj', 'collab', 'ged'], views: ['bailleur'] },
  audit: { spaces: ['home', 'map', 'prof', 'assets', 'proj', 'collab', 'ged'], views: ['audit'] },
  controle: { spaces: ['home', 'map', 'prof', 'assets', 'proj', 'collab', 'ged'], views: ['tech'] },
  entreprise: { spaces: ['home', 'map', 'proj', 'collab', 'ged'], views: [] },
  admin: { spaces: ['home', 'map', 'dash', 'prof', 'assets', 'proj', 'collab', 'ged'], views: ['ministre', 'mo', 'tech', 'bailleur', 'audit'] },
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

export function createStore(zone) {
  const KEY = `gin2co-demo-${zone}-v1`;
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
