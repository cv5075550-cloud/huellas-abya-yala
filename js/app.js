/* app.js · Navegación y control de pantallas (Bloques 1-2)
   Rutas por hash: #aula · #curso:<id> · #inicio · #instrucciones · #museo · #nivel1..3
   Los niveles se registran con App.register('nivel1', renderFn) en sus bloques. */
const App = (() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = { extra: 'huellas_subjects_extra', role: 'huellas_role' };
  const MAX = DATA.scoring.maxTotal;

  const read  = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
  const esc   = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const authOn = () => typeof Auth !== 'undefined' && Auth.active();
  let remoteSubjects = [];       // asignaturas creadas por el docente (Supabase), visibles para todos
  const allSubjects = () => DATA.subjects.concat(authOn() ? remoteSubjects : read(KEY.extra, []));
  async function loadRemoteSubjects() {
    if (!authOn() || Auth.needsLogin()) return;
    try {
      const rows = await Auth.api('/rest/v1/subjects?select=*&order=created_at.asc', { bearer: Auth.token() });
      remoteSubjects = (rows || []).map(r => ({ id: r.id, name: r.name, grade: r.grade || '', teacher: 'Docente',
        summary: r.summary || '', color: r.color || '#2f7f78', units: [] }));
      if (currentScreen === 'aula') renderAula(); else if (currentScreen === 'curso') renderCurso();
    } catch { /* sin conexión o sin SQL del Bloque 9: solo se muestran las asignaturas base */ }
  }

  let currentSubject = null;
  let currentScreen = null;
  let pendingMsg = null;      // mensaje de Kuntur para mostrar al llegar al museo

  /* ---------- Rol (la cuenta docente real se hará después) ---------- */
  function setRole(role) {
    document.body.dataset.role = role;
    write(KEY.role, role);
    const label = role === 'teacher' ? 'Docente' : 'Estudiante';
    $$('#user-label, .user-label-copy').forEach(el => el.textContent = label);
    $$('.lms-avatar').forEach(el => el.textContent = label[0]);
    $('#btn-toggle-role').textContent = role === 'teacher' ? 'Volver a vista estudiante (temporal)' : 'Cambiar a vista docente (temporal)';
  }

  /* ---------- Navegación ---------- */
  const renderers = {};
  const register = (name, fn) => { renderers[name] = fn; };
  const go = hash => { location.hash = hash; };

  function route() {
    const [name, arg] = (location.hash.slice(1) || 'aula').split(':');
    if (arg) currentSubject = arg;

    if (authOn() && Auth.needsLogin()) return show('login');   // sin sesión solo se ve el ingreso
    if (name === 'login') return go('aula');

    const m = /^nivel([1-3])$/.exec(name);
    if (m) {
      const i = Number(m[1]) - 1;
      if (!Game.isUnlocked(i)) { pendingMsg = DATA.kunturLocked; return go('museo'); }   // sin 70 PE no se avanza
      if (!renderers[name])    { pendingMsg = DATA.kunturSoon;   return go('museo'); }   // nivel aún no construido
    }
    show(renderers[name] ? name : 'aula');
  }

  function show(id) {
    currentScreen = id;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + id));
    hideKuntur();
    renderers[id]();
    window.scrollTo(0, 0);
    document.title = id === 'museo' ? 'Museo de la Memoria Americana · Huellas de Abya Yala' : 'Huellas de Abya Yala';
  }

  /* ---------- Aula ---------- */
  function renderAula() {
    const pct = Math.round(Game.totalScore() / MAX * 100);
    $('#course-grid').innerHTML = allSubjects().map(s => {
      const p = s.units && s.units.length ? pct : 0;
      return `<a class="course-card" href="#curso:${esc(s.id)}" style="--c:${esc(s.color || '#b4532a')}">
        <div class="course-band"><span class="ico" data-icon="book"></span></div>
        <div class="course-info">
          <h3>${esc(s.name)}</h3>
          <small>${esc(s.grade || '')}${s.teacher ? ' · ' + esc(s.teacher) : ''}</small>
          <p class="muted">${esc(s.summary || '')}</p>
          <div class="mini-bar" aria-label="Progreso ${p}%"><i style="width:${p}%"></i></div>
        </div></a>`;
    }).join('');
    injectIcons();
  }

  /* ---------- Página de la asignatura ---------- */
  function renderCurso() {
    const subjects = allSubjects();
    const found = subjects.find(x => x.id === currentSubject);
    const s = found || subjects[0];
    if (found || !currentSubject) currentSubject = s.id;
    $('#curso-crumb').textContent = s.name;
    $('#curso-title').textContent = s.name;
    $('#curso-sub').textContent = s.summary || '';
    $('#curso-banner').style.setProperty('--c', s.color || '#b4532a');
    const units = (s.units || []).map(u => `
      <section class="unit"><h2>${esc(u.title)}</h2>
        ${u.activities.map(a => `
          <a class="activity" href="#${esc(a.route)}">
            <span class="activity-ico"><span class="ico" data-icon="compass"></span></span>
            <span class="activity-txt"><strong>${esc(a.title)}</strong><span>${esc(a.desc)} · ${Game.totalScore()}/${MAX} PE</span></span>
            <span class="tag">${esc(a.tag)}</span>
          </a>`).join('')}
      </section>`).join('');
    $('#curso-units').innerHTML = units || '<p class="empty">Esta asignatura aún no tiene actividades.</p>';
    if (typeof Recursos !== 'undefined') Recursos.render(s.id);
    ['#museo-back', '#inicio-back'].forEach(sel => { $(sel).href = '#curso:' + s.id; });
    injectIcons();
  }

  /* ---------- Portada (inicio) ---------- */
  function renderInicio() {
    const has = Game.hasProgress();
    $('#btn-continuar').hidden = !has;
    $('#btn-comenzar').textContent = has ? 'Nueva expedición' : 'Comenzar expedición';
    const save = $('#inicio-save');
    save.hidden = !has;
    if (has) save.textContent = `Partida guardada: ${Game.totalScore()} / ${MAX} PE · ${Game.badgeCount()} de 3 insignias`;
    renderers.curso();   // actualiza el enlace de regreso
  }

  /* ---------- Instrucciones ---------- */
  function renderInstrucciones() {
    $('#rank-list').innerHTML = DATA.ranks.map(r => `<li><b>${esc(r.name)}</b> · ${r.min}–${r.max} PE</li>`).join('');
    injectIcons();
  }

  /* ---------- Museo (menú de niveles) ---------- */
  function renderMuseo(opts = {}) {
    const pts = Game.totalScore(), pct = Math.round(pts / MAX * 100);
    $('#prog-fill').style.width = pct + '%';
    $('#prog-bar').setAttribute('aria-valuenow', pts);
    $('#prog-text').textContent = `${pts} / ${MAX} PE · ${pct}%`;

    $('#levels').innerHTML = DATA.levels.map((lv, i) => {
      const open = Game.isUnlocked(i), score = Game.levelScore(i);
      const chip = !open ? '<span class="chip locked"><span class="ico" data-icon="lock"></span>Bloqueado</span>'
        : score >= DATA.scoring.pass ? `<span class="chip done">${score}/100 PE ✓</span>`
        : score > 0 ? `<span class="chip">${score}/100 PE</span>`
        : `<span class="chip">Meta ${DATA.scoring.pass} PE</span>`;
      return `<button class="level-card ${open ? '' : 'is-locked'}" data-level="${i}" ${open ? '' : 'disabled'} aria-label="${esc(lv.title + ' ' + lv.name)}${open ? '' : ', bloqueado'}">
        <span class="level-icon" style="--tone:${lv.tone}"><span class="ico" data-icon="${lv.icon}"></span></span>
        <span class="level-panel" style="display:block">
          <h3>${esc(lv.title)}<br>${esc(lv.name)}</h3>
          <p>${esc(lv.sub)}</p>${chip}
        </span></button>`;
    }).join('');

    $('#badges').innerHTML = DATA.levels.map((lv, i) => `
      <li class="badge ${Game.hasBadge(i) ? '' : 'off'}" style="--b:${lv.badgeColor}">
        <span class="badge-ring"><span class="ico" data-icon="${lv.badgeIcon}"></span></span>${esc(lv.badge)}
      </li>`).join('');

    $('#museo-foot').textContent = DATA.museoFooter;
    injectIcons();
    if (!opts.silent) { say(pendingMsg || DATA.kunturWelcome); pendingMsg = null; }
  }

  /* ---------- Kuntur (burbuja provisional; kuntur.js la ampliará en el Bloque 7) ---------- */
  function say(html) {
    $('#kuntur-bubble').innerHTML = html;
    $('#kuntur-bubble').hidden = false;
    $('#kuntur-btn').setAttribute('aria-expanded', 'true');
  }
  function hideKuntur() {
    $('#kuntur-bubble').hidden = true;
    $('#kuntur-btn').setAttribute('aria-expanded', 'false');
  }

  const api = {
    startLevel(i) { go('nivel' + (i + 1)); },
    register, go, say, setRole
  };

  /* ---------- Eventos ---------- */
  function bind() {
    $('#levels').addEventListener('click', e => {
      const btn = e.target.closest('.level-card');
      if (!btn) return;
      if (btn.disabled) { say(DATA.kunturLocked); return; }
      api.startLevel(Number(btn.dataset.level));
    });
    $('#kuntur-btn').addEventListener('click', () => {
      $('#kuntur-bubble').hidden ? say(DATA.kunturWelcome) : hideKuntur();
    });
    $('#btn-toggle-role').addEventListener('click', () => setRole(document.body.dataset.role === 'teacher' ? 'student' : 'teacher'));

    // Portada
    const confirmDlg = $('#dlg-confirm');
    $('#btn-comenzar').addEventListener('click', () => Game.hasProgress() ? confirmDlg.showModal() : go('instrucciones'));
    $('#btn-continuar').addEventListener('click', () => go('museo'));
    confirmDlg.addEventListener('close', () => {
      if (confirmDlg.returnValue === 'ok') { Game.reset(); go('instrucciones'); }
    });
    $('#btn-entrar').addEventListener('click', () => { Game.start(); go('museo'); });

    // Docente: añadir asignatura
    const dlg = $('#dlg-subject');
    $('#btn-add-subject').addEventListener('click', () => { $('#form-subject').reset(); dlg.showModal(); });
    $('#dlg-cancel').addEventListener('click', () => dlg.close());
    $('#form-subject').addEventListener('submit', e => {
      const f = new FormData(e.target);
      const name = (f.get('name') || '').trim();
      if (!name) { e.preventDefault(); return; }
      const colors = ['#2f7f78', '#c98a2e', '#7a4b8a', '#4a6fa5'];
      if (authOn()) {      // con cuentas reales la asignatura se guarda en Supabase y la ven todos
        e.preventDefault();
        const data = { name, grade: (f.get('grade') || '').trim(), summary: (f.get('summary') || '').trim(),
          color: colors[remoteSubjects.length % colors.length] };
        Auth.api('/rest/v1/subjects', { method: 'POST', body: data, bearer: Auth.token(), headers: { Prefer: 'return=minimal' } })
          .then(() => { dlg.close(); return loadRemoteSubjects(); })
          .catch(err => alert('No se pudo guardar la asignatura: ' + err.message));
        return;
      }
      const extra = read(KEY.extra, []);
      extra.push({ id: 'x' + Date.now(), name, grade: (f.get('grade') || '').trim(), teacher: 'Docente',
        summary: (f.get('summary') || '').trim(), color: colors[extra.length % colors.length], units: [] });
      write(KEY.extra, extra);
      renderAula();
    });

    window.addEventListener('hashchange', route);

    // Los puntos se actualizan solos en la pantalla visible
    Game.on(() => {
      if (currentScreen === 'museo') renderMuseo({ silent: true });
      else if (currentScreen === 'aula') renderAula();
    });
  }

  function init() {
    register('aula', renderAula);
    register('curso', renderCurso);
    register('inicio', renderInicio);
    register('instrucciones', renderInstrucciones);
    register('museo', renderMuseo);
    injectIcons();
    bind();
    setRole(authOn() ? Auth.role() : read(KEY.role, 'student'));
    route();
    loadRemoteSubjects();
  }
  document.addEventListener('DOMContentLoaded', init);
  return api;
})();