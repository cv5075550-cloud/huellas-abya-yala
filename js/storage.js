/* storage.js · Persistencia del progreso en LocalStorage (Bloque 2)
   Se usa el nombre "Store" para no chocar con la interfaz global Storage del navegador. */
const Store = (() => {
  const BASE = 'huellas_state_v1';
  // Con sesión iniciada, el progreso se guarda por usuario (así dos cuentas en el mismo navegador no se mezclan)
  const KEY_AUTH = 'huellas_auth_v1';
  const KEY = () => {
    try { const a = JSON.parse(localStorage.getItem(KEY_AUTH) || 'null'); return a && a.user && a.user.id ? BASE + '_' + a.user.id : BASE; }
    catch { return BASE; }
  };
  let cache = null;

  const freshLevel = () => ({ score: 0, last: 0, attempts: 0 });
  const fresh = () => ({
    version: 1,
    started: false,                              // entró al museo al menos una vez
    levels: [freshLevel(), freshLevel(), freshLevel()],
    badges: [false, false, false],
    sessions: [null, null, null],                // intento en curso de cada nivel
    dictamen: { text: '', delivered: false },
    updatedAt: 0
  });

  function merge(base, saved) {
    if (!saved || typeof saved !== 'object') return base;
    const s = Object.assign(base, saved);
    s.levels = base.levels.map((d, i) => Object.assign(d, (saved.levels || [])[i]));
    s.badges = base.badges.map((d, i) => Boolean((saved.badges || [])[i]));
    s.sessions = base.sessions.map((d, i) => (saved.sessions || [])[i] || null);
    s.dictamen = Object.assign({ text: '', delivered: false }, saved.dictamen);
    return s;
  }

  function get() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY());
      cache = raw ? merge(fresh(), JSON.parse(raw)) : fresh();
    } catch { cache = fresh(); }
    return cache;
  }

  function save() {
    const s = get();
    s.updatedAt = Date.now();
    try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch { /* sin almacenamiento disponible */ }
  }

  function reset() {
    cache = fresh();
    try { localStorage.removeItem(KEY()); } catch { /* nada */ }
  }

  return { get, save, reset };
})();