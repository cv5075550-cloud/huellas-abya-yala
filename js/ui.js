/* ui.js · Componentes compartidos por los niveles (Bloque 3) */
const UI = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const levelLabel = i => DATA.levels[i].title.replace(' ·', '');

  /* Barra superior del nivel: PE en vivo, tareas y botón de pista */
  function hud(i, totalTasks) {
    const lv = DATA.levels[i];
    return `<header class="lvl-hud">
      <a class="back-link" href="#museo">&larr; Museo</a>
      <div class="lvl-title"><span class="ico" data-icon="${lv.icon}"></span>
        <div><small>${esc(levelLabel(i))}</small><strong>${esc(lv.name)}</strong></div></div>
      <div class="lvl-stats">
        <div class="stat" title="Puntos de Evidencia"><span>PE</span><b data-hud="pe">0</b><i>/${DATA.scoring.maxLevel}</i></div>
        <div class="stat"><span>Tareas</span><b data-hud="tasks">0</b><i>/${totalTasks}</i></div>
        <button class="btn btn-ghost btn-hint" type="button" data-act="hint">
          <span class="ico" data-icon="bulb"></span>Pista (−${DATA.scoring.hintPenalty} PE) · <b data-hud="hints">3</b></button>
      </div></header>`;
  }

  function updateHud(root, i, tasksDone) {
    const set = (k, v) => { const el = root.querySelector(`[data-hud="${k}"]`); if (el) el.textContent = v; };
    set('pe', Game.live(i));
    set('tasks', tasksDone);
    set('hints', Game.hintsLeft(i));
    const s = Game.session(i);
    const btn = root.querySelector('[data-act="hint"]');
    if (btn) btn.disabled = !s || s.finished || Game.hintsLeft(i) <= 0;
  }

  const dock = () => `<div class="lvl-kuntur">
      <img src="assets/icons/kuntur.svg" alt="" width="56" height="56">
      <p data-kuntur aria-live="polite"></p></div>`;

  function say(root, html) {
    const el = root.querySelector('[data-kuntur]');
    if (!el) return;
    el.innerHTML = html;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  /* Pantalla de retroalimentación genérica.
     cfg = { sections:[{title, earned, max, items:[{state:'ok'|'half'|'fail', text, detail}]}], strengths:[], reinforce:[] } */
  function feedback(root, i, cfg) {
    const res = Game.result(i);
    const lv = DATA.levels[i];
    const nextHref = '#nivel' + (i + 2);
    const badge = res.passed ? `<section class="fb-badge" style="--b:${lv.badgeColor}">
        <span class="badge-ring"><span class="ico" data-icon="${lv.badgeIcon}"></span></span>
        <div><small>Insignia obtenida</small><strong>${esc(lv.badge)}</strong></div></section>` : '';
    const mark = { ok: '✓', half: '½', fail: '✗', info: '•' };
    const sections = cfg.sections.map(sec => `
      <section class="fb-sec"><h2>${esc(sec.title)} <span class="fb-pts">${sec.earned} / ${sec.max} PE</span></h2>
        <ul class="fb-items">${sec.items.map(it => `
          <li class="fb-item ${it.state}"><span class="fb-mark" aria-label="${{ ok: 'Correcto', half: 'Correcto en el segundo intento', fail: 'Incorrecto', info: 'Nota' }[it.state]}">${mark[it.state]}</span>
            <div><p>${esc(it.text)}</p><p class="fb-detail">${it.detail}</p></div></li>`).join('')}
        </ul></section>`).join('');
    const list = arr => arr.length ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">—</p>';

    root.innerHTML = `
      <header class="fb-head"><a class="back-link" href="#museo">&larr; Museo</a>
        <h1>Retroalimentación · ${esc(levelLabel(i))}: ${esc(lv.name)}</h1></header>
      <main class="fb-main">
        <section class="fb-score ${res.passed ? 'ok' : 'no'}">
          <div class="fb-num"><b>${res.score}</b><span>/ ${DATA.scoring.maxLevel} PE</span></div>
          <div><h2>${res.passed ? '¡Nivel superado!' : `Aún no alcanzas los ${DATA.scoring.pass} PE`}</h2>
            <p>Puntos ganados: ${res.earned} · Pistas usadas: ${res.hints} (−${res.hints * DATA.scoring.hintPenalty} PE) · Mejor puntaje del nivel: ${res.best} PE</p></div>
        </section>
        ${badge}
        <div class="ins-kuntur"><img src="assets/icons/kuntur.svg" alt="" width="64" height="64"><p data-kuntur></p></div>
        ${sections}
        <div class="fb-summary">
          <section><h3>Fortalezas</h3>${list(cfg.strengths)}</section>
          <section><h3>Para reforzar</h3>${list(cfg.reinforce)}</section>
        </div>
        <div class="ins-actions">
          <a class="btn btn-ghost" href="#museo">Volver al museo</a>
          ${res.passed
            ? `<span class="fb-actions-r"><a class="link-btn" href="#nivel${i + 1}">Jugar este nivel de nuevo</a>
               ${i < DATA.scoring.levels - 1 ? `<a class="btn btn-primary btn-lg" href="${nextHref}">Continuar al Nivel ${i + 2}</a>` : ''}</span>`
            : `<a class="btn btn-primary btn-lg" href="#nivel${i + 1}">Reintentar nivel</a>`}
        </div>
      </main>`;
    injectIcons(root);
    Kuntur.respond('finish', { level: i, result: res }).then(t => say(root, t));
    window.scrollTo(0, 0);
  }

  /* Ordenador reutilizable: tocar una etapa la coloca en el siguiente hueco; tocar una colocada la devuelve.
     items = [{id, text}] (en cualquier orden). El nivel decide si el orden es correcto. */
  function sequencer(items) {
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const byId = id => items.find(x => x.id === id);
    let pool = [], slots = [];
    const reset = () => { pool = shuffle(items.map(x => x.id)); slots = items.map(() => null); };
    reset();
    return {
      reset,
      place(id) { const k = slots.indexOf(null); if (k < 0) return; slots[k] = id; pool = pool.filter(x => x !== id); },
      unplace(k) { if (slots[k]) { pool.push(slots[k]); slots[k] = null; } },
      full: () => slots.every(Boolean),
      order: () => slots.slice(),
      poolHtml: disabled => pool.map(id => `<button type="button" class="stage" data-pool="${id}" ${disabled ? 'disabled' : ''}>${esc(byId(id).text)}</button>`).join(''),
      slotsHtml: () => slots.map((id, k) => id
        ? `<li class="slot filled"><span class="num">${k + 1}</span><button type="button" class="stage placed" data-slot="${k}">${esc(byId(id).text)}</button></li>`
        : `<li class="slot"><span class="num">${k + 1}</span><span class="slot-empty">Posición ${k + 1}</span></li>`).join('')
    };
  }

  return { hud, updateHud, dock, say, feedback, sequencer, esc };
})();