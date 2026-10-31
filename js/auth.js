/* auth.js · Cuentas de docente y estudiante con Supabase (Bloque 8)
   Solo usa fetch (sin librerías). La URL y la clave "publishable/anon" son públicas por diseño;
   la seguridad real está en las políticas RLS de la base de datos (sql/supabase.sql).
   Si APP_CONFIG no tiene datos de Supabase, la app funciona como antes (sin cuentas). */
const Auth = (() => {
  const KEY = 'huellas_auth_v1';
  const CFG = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) || {};
  const BASE = String(CFG.SUPABASE_URL || '').trim().replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
  const ANON = String(CFG.SUPABASE_ANON_KEY || '').trim();
  const active = () => Boolean(BASE && ANON);

  let session = null;
  try { session = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { session = null; }
  const persist = () => { try { session ? localStorage.setItem(KEY, JSON.stringify(session)) : localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } };

  const needsLogin = () => active() && !(session && session.access_token);
  const token = () => (session && session.access_token) || '';
  const role = () => (session && session.role) || 'student';
  const isTeacher = () => role() === 'teacher';
  const user = () => (session && session.user) || null;
  const userId = () => (session && session.user && session.user.id) || '';
  const name = () => (session && (session.name || (session.user && session.user.email))) || '';

  /* ---------- Llamadas a Supabase ---------- */
  const MSG = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/already registered|already been registered/i, 'Ese correo ya tiene cuenta. Ingresa en la pestaña «Ingresar».'],
    [/at least \d+ characters|password should/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/email not confirmed/i, 'Debes confirmar tu correo antes de ingresar (revisa tu bandeja).'],
    [/signups? (not allowed|are disabled)|signup is disabled/i, 'El registro de cuentas nuevas está desactivado. Pide tu cuenta al docente.'],
    [/row-level security|violates|permission denied|not authorized/i, 'No tienes permiso para hacer esto (solo docentes).'],
    [/exceeded the maximum allowed size|payload too large|too large/i, 'El archivo supera el tamaño máximo permitido (50 MB).'],
    [/could not find the table|does not exist|bucket not found/i, 'Falta ejecutar el SQL del Bloque 9 en Supabase.'],
    [/rate limit|too many|429/i, 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'],
    [/valid email|invalid format|unable to validate email/i, 'Escribe un correo válido.']
  ];
  const friendly = raw => (MSG.find(([re]) => re.test(raw)) || [0, raw || 'No se pudo completar la acción.'])[1];

  async function api(path, { method = 'GET', body, bearer, headers: extra, raw } = {}) {
    const headers = { apikey: ANON };
    if (!raw) headers['Content-Type'] = 'application/json';
    if (bearer) headers.Authorization = 'Bearer ' + bearer;
    Object.assign(headers, extra);
    let res;
    try { res = await fetch(BASE + path, { method, headers, body: raw ? raw : (body ? JSON.stringify(body) : undefined) }); }
    catch { throw new Error('No hay conexión con el servidor de cuentas.'); }
    let data = null;
    try { data = await res.json(); } catch { /* sin cuerpo */ }
    if (!res.ok) throw new Error(friendly((data && (data.error_description || data.msg || data.message || data.error)) || 'HTTP ' + res.status));
    return data;
  }

  /* ---------- Sesión ---------- */
  function build(d) {
    return {
      access_token: d.access_token, refresh_token: d.refresh_token,
      expires_at: Date.now() + (Number(d.expires_in) || 3600) * 1000,
      user: { id: d.user.id, email: d.user.email }, role: 'student', name: ''
    };
  }

  async function fetchProfile() {
    if (!session) return null;
    try {
      const rows = await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=role,full_name`, { bearer: session.access_token });
      const p = rows && rows[0];
      return p ? { role: p.role === 'teacher' ? 'teacher' : 'student', name: p.full_name || '' } : null;
    } catch { return null; }
  }

  async function finishLogin(d) {
    session = build(d);
    const p = await fetchProfile();
    if (p) { session.role = p.role; session.name = p.name; }
    persist();
    return session;
  }

  async function signIn(email, password) {
    const d = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email.trim(), password } });
    return finishLogin(d);
  }

  async function signUp(fullName, email, password) {
    const d = await api('/auth/v1/signup', { method: 'POST', body: { email: email.trim(), password, data: { full_name: fullName.trim() } } });
    if (d && d.access_token) { await finishLogin(d); return { ok: true }; }
    return { ok: false, confirm: true };      // el proyecto exige confirmar el correo
  }

  async function refresh() {
    if (!session || !session.refresh_token) return false;
    try {
      const d = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
      session.access_token = d.access_token;
      session.refresh_token = d.refresh_token || session.refresh_token;
      session.expires_at = Date.now() + (Number(d.expires_in) || 3600) * 1000;
      persist();
      return true;
    } catch (e) {
      if (/conexi/i.test(e.message)) return true;   // sin internet: se conserva la sesión
      session = null; persist();
      return false;
    }
  }
  async function ensureFresh() {
    if (!session) return true;
    if (session.expires_at - Date.now() < 5 * 60 * 1000) return refresh();
    return true;
  }

  function signOut() {
    const t = token();
    if (t && active()) fetch(BASE + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + t } }).catch(() => { /* nada */ });
    session = null; persist();
    location.hash = '';
    location.reload();
  }

  /* ---------- Interfaz ---------- */
  function applyUser() {
    if (!session) return;
    const label = name() || (isTeacher() ? 'Docente' : 'Estudiante');
    document.querySelectorAll('#user-label, .user-label-copy').forEach(el => { el.textContent = label; });
    document.querySelectorAll('.lms-avatar').forEach(el => { el.textContent = label[0].toUpperCase(); });
  }

  function renderLogin() {
    ['#login-msg', '#signup-msg'].forEach(s => { const m = document.querySelector(s); if (m) m.textContent = ''; });
    const f = document.querySelector('#login-email'); if (f) f.focus();
  }

  function bindUI() {
    if (!active()) return;
    document.body.classList.add('auth-on');
    document.querySelectorAll('[data-logout]').forEach(b => { b.hidden = false; b.addEventListener('click', signOut); });

    const $ = s => document.querySelector(s);
    const tabs = [['#tab-login', '#form-login'], ['#tab-signup', '#form-signup']];
    const showTab = i => tabs.forEach(([t, f], k) => {
      $(t).setAttribute('aria-selected', String(k === i)); $(t).classList.toggle('on', k === i); $(f).hidden = k !== i;
    });
    $('#tab-login').addEventListener('click', () => showTab(0));
    $('#tab-signup').addEventListener('click', () => showTab(1));

    const done = () => { if (!location.hash || location.hash === '#login') location.hash = '#aula'; location.reload(); };
    const run = (form, msgSel, fn) => form.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = $(msgSel), btn = form.querySelector('button[type=submit]');
      msg.textContent = ''; btn.disabled = true;
      try { await fn(new FormData(form), msg); }
      catch (err) { msg.dataset.ok = '0'; msg.textContent = err.message; }
      btn.disabled = false;
    });
    run($('#form-login'), '#login-msg', async f => { await signIn(String(f.get('email')), String(f.get('password'))); done(); });
    run($('#form-signup'), '#signup-msg', async (f, msg) => {
      const r = await signUp(String(f.get('name')), String(f.get('email')), String(f.get('password')));
      if (r.ok) done();
      else { msg.dataset.ok = '1'; msg.textContent = 'Cuenta creada. Confirma tu correo y luego ingresa.'; showTab(0); }
    });

    // Con sesión: se sincroniza el rol (por si el docente lo cambió) y se mantiene el token vigente
    if (session) {
      applyUser();
      (async () => {
        if (!(await ensureFresh())) { location.reload(); return; }
        const p = await fetchProfile();
        if (p && (p.role !== session.role || p.name !== session.name)) {
          session.role = p.role; session.name = p.name; persist();
          if (typeof App !== 'undefined') App.setRole(p.role);
          applyUser();
        }
      })();
      setInterval(ensureFresh, 4 * 60 * 1000);
    }
  }

  App.register('login', renderLogin);
  document.addEventListener('DOMContentLoaded', bindUI);

  return { baseUrl: () => BASE, active, needsLogin, token, role, isTeacher, user, userId, name, signIn, signUp, signOut, api, ensureFresh };
})();
