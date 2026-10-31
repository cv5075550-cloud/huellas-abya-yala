/* nivel2.js · Nivel 2 «Laboratorio del Tiempo» + su retroalimentación (Bloque 4)
   1) Línea de tiempo: 5 fichas, sólida o en debate (5 × 10 PE)
   2) Ordenar los 5 periodos (20 PE)
   3) Relacionar cada periodo con su característica (5 × 6 PE) */
const Nivel2 = (() => {
  const I = 1, W_EV = 10, W_ORDER = 20, W_TRAIT = 6, TASKS = 11;
  const root = document.getElementById('screen-nivel2');
  const fbRoot = document.getElementById('screen-fb2');
  const C = () => DATA.content.level2;
  const esc = UI.esc;
  const $ = s => root.querySelector(s);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let selE = null, selT = null, traitOrder = [];
  const seq = UI.sequencer(DATA.content.level2.periods.map(p => ({ id: p.id, text: p.name })));

  const say = (type, ctx) => Kuntur.respond(type, Object.assign({ level: I }, ctx)).then(t => UI.say(root, t));
  const sess = () => Game.session(I);
  const q = id => (sess().q || {})[id];
  const isDone = id => Boolean(q(id) && q(id).done);
  const evDone = () => C().evidence.filter(e => isDone(e.id)).length;
  const traitsDone = () => C().periods.filter(p => isDone('t_' + p.id)).length;
  const allEv = () => evDone() === C().evidence.length;
  const orderDone = () => isDone('orden');
  const allTraits = () => traitsDone() === C().periods.length;
  const tasksDone = () => evDone() + (orderDone() ? 1 : 0) + traitsDone();

  /* ---------- Plantilla ---------- */
  function template() {
    const c = C(), ax = c.axis, pos = age => ((ax.from - age) / (ax.from - ax.to) * 100).toFixed(1);
    const ticks = ax.ticks.map(t => `<span class="tl-tick" style="left:${pos(t)}%">${String(t).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>`).join('');
    const pins = c.evidence.map((e, n) => `<button type="button" class="tl-pin" style="left:${pos(e.age)}%;--row:${e.row}" data-e="${e.id}"
        aria-label="${esc(e.title)}, ${esc(e.ageLabel)}"><span>${n + 1}</span></button>`).join('');
    return `${UI.hud(I, TASKS)}${UI.dock()}
    <main class="lvl-main">
      <section class="lvl-sec">
        <h2><span class="step">1</span> Línea de tiempo de evidencias <span class="fb-pts">50 PE</span></h2>
        <p class="muted">Cada punto es un hallazgo, ubicado según su antigüedad (años atrás). Tócalo, lee la ficha y decide si es evidencia sólida o en debate.</p>
        <div class="tl" id="n2-tl" role="group" aria-label="Línea de tiempo, de más antiguo a más reciente">
          <div class="tl-axis"></div>${ticks}${pins}
          <span class="tl-cap">← hace más años · hace menos años →</span>
        </div>
        <div class="ficha" id="n2-ficha" aria-live="polite"></div>
      </section>

      <section class="lvl-sec" id="n2-b">
        <h2><span class="step">2</span> Ordena los periodos <span class="fb-pts">20 PE</span></h2>
        <p class="muted" id="n2-b-line"></p>
        <div class="order-pool" id="n2-pool"></div>
        <ol class="order-slots" id="n2-slots"></ol>
        <div class="order-actions"><button class="btn btn-primary" id="n2-check" type="button" disabled>Comprobar orden</button></div>
      </section>

      <section class="lvl-sec" id="n2-c">
        <h2><span class="step">3</span> Relaciona cada periodo con su característica <span class="fb-pts">30 PE</span></h2>
        <p class="muted" id="n2-c-line"></p>
        <div class="period-bar" id="n2-periods"></div>
        <ol class="cards" id="n2-traits"></ol>
        <p class="note-small" id="n2-note" hidden>${esc(c.periodNote)}</p>
      </section>
      <div class="lvl-finish"><button class="btn btn-primary btn-lg" id="n2-finish" type="button" hidden>Ver mis resultados</button></div>
    </main>`;
  }

  /* ---------- Pintado ---------- */
  function paint() {
    paintPins(); paintFicha(); paintOrder(); paintTraits();
    $('#n2-finish').hidden = !allTraits();
    UI.updateHud(root, I, tasksDone());
    injectIcons(root);
  }

  function paintPins() {
    root.querySelectorAll('.tl-pin').forEach(b => {
      b.classList.remove('shake');
      const e = C().evidence.find(x => x.id === b.dataset.e), st = q(e.id);
      b.classList.toggle('sel', selE === e.id);
      b.classList.toggle('done-solida', Boolean(st && st.done && e.answer === 'solida'));
      b.classList.toggle('done-debate', Boolean(st && st.done && e.answer === 'debate'));
      b.classList.toggle('missed', Boolean(st && st.done && st.earned === 0));
      b.classList.toggle('tried', Boolean(st && !st.done));
    });
  }

  function paintFicha() {
    const box = $('#n2-ficha'), e = C().evidence.find(x => x.id === selE);
    if (!e) { box.innerHTML = '<p class="muted">Toca un punto de la línea de tiempo para abrir su ficha.</p>'; return; }
    const st = q(e.id), done = st && st.done;
    let foot;
    if (done) {
      const ok = st.earned > 0;
      foot = `<p class="ficha-res ${ok ? 'ok' : 'fail'}"><b>${esc(C().classes[e.answer])}.</b> ${esc(e.why)}
        <span class="card-chip" style="--zc:${ok ? 'var(--teal)' : '#b5473a'}">${ok ? '+' + st.earned : '0'} PE</span></p>`;
    } else {
      foot = `<div class="ficha-btns">
        <button type="button" class="btn btn-ghost ans-solida" data-ans="solida">Evidencia sólida</button>
        <button type="button" class="btn btn-ghost ans-debate" data-ans="debate">Evidencia en debate</button></div>`;
    }
    box.innerHTML = `<h3>${esc(e.title)} <span class="fb-pts">${esc(e.ageLabel)}</span></h3><p>${esc(e.text)}</p>${foot}`;
  }

  function paintOrder() {
    const sec = $('#n2-b'), unlocked = allEv(), st = q('orden');
    sec.classList.toggle('locked', !unlocked);
    $('#n2-b-line').textContent = unlocked
      ? 'Toca cada periodo en el orden en que ocurrió, del más antiguo al más reciente. Toca uno colocado para devolverlo.'
      : 'Se desbloquea al clasificar las cinco fichas de evidencia.';
    const check = $('#n2-check');
    if (st && st.done) {
      $('#n2-pool').innerHTML = '';
      $('#n2-slots').innerHTML = C().periods.map((p, k) =>
        `<li class="slot filled ${st.earned > 0 ? 'ok' : 'fail'}"><span class="num">${k + 1}</span><span>${esc(p.name)}</span></li>`).join('');
      check.hidden = true;
      return;
    }
    check.hidden = false;
    $('#n2-pool').innerHTML = seq.poolHtml(!unlocked);
    $('#n2-slots').innerHTML = seq.slotsHtml();
    check.disabled = !unlocked || !seq.full();
  }

  function paintTraits() {
    const c = C(), sec = $('#n2-c'), unlocked = orderDone();
    sec.classList.toggle('locked', !unlocked);
    $('#n2-c-line').textContent = unlocked
      ? 'Toca una característica y luego el periodo al que corresponde. Cada acierto vale 6 PE.'
      : 'Se desbloquea al ordenar los periodos.';
    $('#n2-note').hidden = !unlocked;
    $('#n2-periods').innerHTML = unlocked ? c.periods.map((p, k) => {
      const matched = c.periods.some(x => x.id === p.id && isDone('t_' + p.id));
      return `<button type="button" class="period ${selT ? 'armed' : ''} ${matched ? 'matched' : ''}" data-period="${p.id}">
        <span class="num">${k + 1}</span><b>${esc(p.name)}</b><small>${esc(p.dates)}</small></button>`;
    }).join('') : '';
    $('#n2-traits').innerHTML = traitOrder.map((pid, n) => {
      const p = c.periods.find(x => x.id === pid), st = q('t_' + pid), done = st && st.done, ok = done && st.earned > 0;
      const cls = ['n1-card', done ? (ok ? 'ok' : 'fail') : st ? 'tried' : '', selT === pid ? 'sel' : ''].join(' ');
      const chip = done ? `<span class="card-chip" style="--zc:${ok ? 'var(--teal)' : '#b5473a'}">${esc(p.name)} · ${ok ? '+' + st.earned : '0'} PE</span>` : '';
      return `<li><button type="button" class="${cls}" data-trait="${pid}" ${(!unlocked || done) ? 'disabled' : ''} aria-pressed="${selT === pid}">
        <span class="card-n">${n + 1}</span><span>${esc(p.trait)}</span>${chip}</button></li>`;
    }).join('');
  }

  /* ---------- Acciones ---------- */
  function selectE(id) { selE = id; paint(); }

  function answerE(choice) {
    const e = C().evidence.find(x => x.id === selE);
    if (!e || sess().finished) return;
    const r = Game.answer(I, e.id, choice === e.answer, W_EV);
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') say('retry', { left: r.attemptsLeft });
    else if (r.status === 'failed') say('fail', { why: `Era <b>${C().classes[e.answer].toLowerCase()}</b>. ${e.why}` });
    paint();
    if (r.status === 'retry') { const b = $(`.tl-pin[data-e="${e.id}"]`); if (b) b.classList.add('shake'); }
    if (r.status !== 'retry' && allEv()) setTimeout(() => say('note', { text: 'Buen trabajo con las evidencias. Ahora ordena los <b>cinco periodos</b>, sin fechas: confía en lo que sabes.' }), 1200);
  }

  function check() {
    const ok = seq.order().every((id, k) => C().periods[k].id === id);
    const r = Game.answer(I, 'orden', ok, W_ORDER);
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') { say('retry', { left: r.attemptsLeft }); seq.reset(); }
    else if (r.status === 'failed') say('fail', { why: C().orderWhy });
    paint();
    if (r.status !== 'retry' && orderDone()) setTimeout(() => say('note', { text: 'Ahora aparecen los periodos con sus fechas. <b>Relaciona</b> cada característica con su periodo.' }), 1200);
  }

  function selectT(id) { selT = selT === id ? null : id; paint(); }

  function assignTrait(periodId) {
    if (!selT || sess().finished) return;
    const trait = C().periods.find(p => p.id === selT);
    const r = Game.answer(I, 't_' + selT, periodId === selT, W_TRAIT);
    selT = null;
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') say('retry', { left: r.attemptsLeft });
    else if (r.status === 'failed') say('fail', { why: `Correspondía a <b>${esc(trait.name)}</b> (${esc(trait.dates)}).` });
    paint();
    if (r.status === 'retry') { const b = $(`[data-trait="${trait.id}"]`); if (b) b.classList.add('shake'); }
    if (r.status !== 'retry' && allTraits()) setTimeout(() => say('ready'), 1200);
  }

  function hint() {
    const h = Game.useHint(I);
    if (!h.ok) { say('noHints'); return; }
    say('hint', { number: h.number, left: h.left });
    UI.updateHud(root, I, tasksDone());
  }
  function finish() { Game.finishLevel(I); App.go('fb2'); }

  /* ---------- Render ---------- */
  function render() {
    const had = sess() && !sess().finished && Object.keys(sess().q).length > 0;
    Game.beginLevel(I);
    selE = null; selT = null;
    traitOrder = shuffle(C().periods.map(p => p.id));
    seq.reset();
    root.innerHTML = template();
    paint();
    say('intro', { resumed: had });
  }

  /* ---------- Retroalimentación ---------- */
  function renderFeedback() {
    const s = sess();
    if (!s || !s.finished || !s.result) { App.go('museo'); return; }
    const c = C(), earned = id => (s.q[id] || {}).earned || 0;
    const stateOf = (pts, max) => pts >= max ? 'ok' : pts > 0 ? 'half' : 'fail';
    const lead = st => st === 'ok' ? 'Correcto a la primera.' : st === 'half' ? 'Correcto en el segundo intento (50 %).' : 'No se acertó.';

    const evItems = c.evidence.map(e => { const st = stateOf(earned(e.id), W_EV);
      return { state: st, text: `${e.title} (${e.ageLabel})`, detail: `<b>${esc(c.classes[e.answer])}.</b> ${esc(e.why)} <em>${lead(st)}</em>` }; });
    const evPts = c.evidence.reduce((a, e) => a + earned(e.id), 0);
    const oSt = stateOf(earned('orden'), W_ORDER);
    const trItems = c.periods.map(p => { const st = stateOf(earned('t_' + p.id), W_TRAIT);
      return { state: st, text: p.trait, detail: `<b>${esc(p.name)}</b> (${esc(p.dates)}). <em>${lead(st)}</em>` }; });
    const trPts = c.periods.reduce((a, p) => a + earned('t_' + p.id), 0);

    const strengths = [], reinforce = [];
    (evPts >= 40 ? strengths : reinforce).push('Distinguir evidencia sólida de evidencia en debate');
    (oSt === 'ok' ? strengths : reinforce).push('Ordenar los periodos: Paleoindio, Arcaico, Formativo, Clásico y Posclásico');
    (trPts >= 24 ? strengths : reinforce).push('Relacionar cada periodo con sus características');
    c.evidence.forEach(e => { if (earned(e.id) === 0) reinforce.push(`Repasar por qué ${e.title} es ${c.classes[e.answer].toLowerCase()}`); });

    UI.feedback(fbRoot, I, {
      sections: [
        { title: 'Parte 1 · Evidencias en la línea de tiempo', earned: evPts, max: 5 * W_EV, items: evItems },
        { title: 'Parte 2 · Orden de los periodos', earned: earned('orden'), max: W_ORDER,
          items: [{ state: oSt, text: 'Paleoindio → Arcaico → Formativo → Clásico → Posclásico', detail: esc(c.orderWhy) }] },
        { title: 'Parte 3 · Periodos y características', earned: trPts, max: 5 * W_TRAIT, items: trItems }
      ],
      strengths, reinforce
    });
  }

  /* ---------- Eventos ---------- */
  root.addEventListener('click', e => {
    const pin = e.target.closest('[data-e]');           if (pin) return selectE(pin.dataset.e);
    const ans = e.target.closest('[data-ans]');         if (ans) return answerE(ans.dataset.ans);
    const p = e.target.closest('[data-pool]');          if (p && !p.disabled) { seq.place(p.dataset.pool); return paint(); }
    const sl = e.target.closest('[data-slot]');         if (sl) { seq.unplace(Number(sl.dataset.slot)); return paint(); }
    const tr = e.target.closest('[data-trait]');        if (tr && !tr.disabled) return selectT(tr.dataset.trait);
    const per = e.target.closest('[data-period]');      if (per) return assignTrait(per.dataset.period);
    if (e.target.closest('[data-act="hint"]')) return hint();
    if (e.target.closest('#n2-check')) return check();
    if (e.target.closest('#n2-finish')) return finish();
  });

  App.register('nivel2', render);
  App.register('fb2', renderFeedback);
  return { render };
})();