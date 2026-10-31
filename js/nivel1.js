/* nivel1.js · Nivel 1 «Campamento Beringia» + su retroalimentación (Bloque 3)
   Etapa A: clasificar 7 tarjetas en el mapa (7 × 10 PE) · Etapa B: ordenar 3 etapas (30 PE). */
const Nivel1 = (() => {
  const I = 0, W_CARD = 10, W_ORDER = 30, TASKS = 8;
  const root = document.getElementById('screen-nivel1');
  const fbRoot = document.getElementById('screen-fb1');
  const C = () => DATA.content.level1;
  const esc = UI.esc;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let selected = null, cardOrder = [], slots = [null, null, null], pool = [];

  const say = (type, ctx) => Kuntur.respond(type, Object.assign({ level: I }, ctx)).then(t => UI.say(root, t));
  const sess = () => Game.session(I);
  const q = id => (sess().q || {})[id];
  const cardsDone = () => C().cards.filter(c => q(c.id) && q(c.id).done).length;
  const allCardsDone = () => cardsDone() === C().cards.length;
  const orderDone = () => Boolean(q('orden') && q('orden').done);

  /* ---------- Mapa esquemático (SVG) ---------- */
  const mapSVG = () => `
  <svg class="map" viewBox="0 0 640 380" role="img" aria-label="Mapa esquemático de Beringia y de las rutas hacia el sur">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
    <rect width="640" height="380" fill="#cfe3e0"/>
    <path d="M0 0H195L212 42L186 84L206 124L150 156L0 168Z" fill="#e3c99b"/>
    <path d="M640 0H430L412 44L436 84L346 128L332 200L340 280L372 340L400 380H640Z" fill="#e3c99b"/>
    <path class="map-bering" d="M195 12H428V124H202Z" fill="#f1dcae" stroke="#b98a55" stroke-width="2" stroke-dasharray="6 5"/>
    <ellipse cx="395" cy="215" rx="42" ry="90" fill="#fff" fill-opacity=".92" stroke="#a9c4c8"/>
    <ellipse cx="565" cy="215" rx="105" ry="122" fill="#fff" fill-opacity=".92" stroke="#a9c4c8"/>
    <text x="395" y="218" class="map-txt sm" text-anchor="middle">Hielo</text>
    <text x="395" y="233" class="map-txt sm" text-anchor="middle">cordillerano</text>
    <text x="565" y="218" class="map-txt sm" text-anchor="middle">Hielo laurentino</text>
    <text x="70" y="90" class="map-txt">ASIA</text>
    <text x="520" y="40" class="map-txt">AMÉRICA DEL NORTE</text>
    <text x="320" y="46" class="map-txt big" text-anchor="middle">BERINGIA</text>
    <text x="320" y="64" class="map-txt sm" text-anchor="middle">(hoy bajo el mar)</text>
    <text x="300" y="372" class="map-txt sm" text-anchor="end">Hacia Mesoamérica y los Andes ↓</text>

    <g class="zone" data-zone="beringia" tabindex="0" role="button" aria-label="Zona Beringia"><rect x="195" y="12" width="233" height="112" fill="#d99a3d" fill-opacity=".001"/><rect class="zone-ring" x="199" y="16" width="225" height="104" rx="8" fill="none" stroke="#d99a3d" stroke-width="4"/></g>
    <g class="zone" data-zone="costera" tabindex="0" role="button" aria-label="Zona ruta costera del Pacífico">
      <path d="M352 124 C332 170 326 230 342 290 S372 345 392 372" fill="none" stroke="transparent" stroke-width="38"/>
      <path class="route" d="M352 124 C332 170 326 230 342 290 S372 345 392 372" fill="none" stroke="#2f7f78" stroke-width="6" stroke-dasharray="3 9" stroke-linecap="round" marker-end="url(#arr)"/></g>
    <g class="zone" data-zone="interior" tabindex="0" role="button" aria-label="Zona ruta interior">
      <path d="M430 96 C446 110 450 120 448 140 C458 190 458 250 448 310 S440 350 440 372" fill="none" stroke="transparent" stroke-width="30"/>
      <path class="route" d="M430 96 C446 110 450 120 448 140 C458 190 458 250 448 310 S440 350 440 372" fill="none" stroke="#b4532a" stroke-width="6" stroke-dasharray="3 9" stroke-linecap="round" marker-end="url(#arr)"/></g>
  </svg>`;

  const zoneBtns = () => Object.entries(C().zones).map(([k, z]) =>
    `<button type="button" class="zone-btn z-${k}" data-zone="${k}"><b>${esc(z.name)}</b><span data-count="${k}">0</span></button>`).join('');

  /* ---------- Plantilla de la pantalla ---------- */
  function template() {
    return `${UI.hud(I, TASKS)}${UI.dock()}
    <main class="lvl-main">
      <section class="lvl-sec">
        <h2><span class="step">1</span> Clasifica las evidencias</h2>
        <p class="muted" id="n1-line">Toca una tarjeta y luego su lugar en el mapa (también puedes arrastrarla). Cada acierto vale 10 PE.</p>
        <div class="lvl-grid">
          <div class="map-wrap">${mapSVG()}<div class="zone-btns">${zoneBtns()}</div></div>
          <ol class="cards" id="n1-cards"></ol>
        </div>
      </section>
      <section class="lvl-sec" id="n1-b">
        <h2><span class="step">2</span> Ordena el modelo de colonización <span class="fb-pts">30 PE</span></h2>
        <p class="muted" id="n1-b-line"></p>
        <div class="order-pool" id="n1-pool"></div>
        <ol class="order-slots" id="n1-slots"></ol>
        <div class="order-actions"><button class="btn btn-primary" id="n1-check" type="button" disabled>Comprobar orden</button></div>
      </section>
      <div class="lvl-finish"><button class="btn btn-primary btn-lg" id="n1-finish" type="button" hidden>Ver mis resultados</button></div>
    </main>`;
  }

  /* ---------- Pintado ---------- */
  function paint() {
    const c = C();
    // tarjetas
    const counts = { beringia: 0, interior: 0, costera: 0 };
    $('#n1-cards').innerHTML = cardOrder.map((id, n) => {
      const card = c.cards.find(x => x.id === id), st = q(id);
      const done = st && st.done, ok = done && st.earned > 0;
      if (done) counts[card.zone]++;
      const cls = ['n1-card', done ? (ok ? 'ok' : 'fail') : st ? 'tried' : '', selected === id ? 'sel' : ''].join(' ');
      const chip = done ? `<span class="card-chip z-${card.zone}">${esc(c.zones[card.zone].name)} · ${ok ? '+' + st.earned : '0'} PE</span>` : '';
      return `<li><button type="button" class="${cls}" data-id="${id}" ${done ? 'disabled' : 'draggable="true"'} aria-pressed="${selected === id}">
        <span class="card-n">${n + 1}</span><span>${esc(card.text)}</span>${chip}</button></li>`;
    }).join('');
    Object.entries(counts).forEach(([k, v]) => { $(`[data-count="${k}"]`).textContent = v; });
    root.querySelectorAll('.zone-btn').forEach(b => b.classList.toggle('armed', Boolean(selected)));

    paintOrder();
    $('#n1-finish').hidden = !orderDone();
    UI.updateHud(root, I, cardsDone() + (orderDone() ? 1 : 0));
    injectIcons(root);
  }

  function paintOrder() {
    const sec = $('#n1-b'), stages = C().stages, st = q('orden');
    const unlocked = allCardsDone();
    sec.classList.toggle('locked', !unlocked);
    $('#n1-b-line').textContent = unlocked
      ? 'Toca cada etapa en el orden en que ocurrió. Toca una etapa ya colocada para devolverla.'
      : 'Se desbloquea al clasificar las siete tarjetas.';
    const slotsEl = $('#n1-slots'), poolEl = $('#n1-pool'), check = $('#n1-check');

    if (st && st.done) {                                   // resuelto: se muestra el orden correcto
      poolEl.innerHTML = '';
      slotsEl.innerHTML = stages.slice().sort((a, b) => a.order - b.order).map(s =>
        `<li class="slot filled ${st.earned > 0 ? 'ok' : 'fail'}"><span class="num">${s.order}</span><span>${esc(s.text)}</span></li>`).join('');
      check.hidden = true;
      return;
    }
    check.hidden = false;
    poolEl.innerHTML = pool.map(id => `<button type="button" class="stage" data-pool="${id}" ${unlocked ? '' : 'disabled'}>${esc(stages.find(s => s.id === id).text)}</button>`).join('');
    slotsEl.innerHTML = slots.map((id, k) => id
      ? `<li class="slot filled"><span class="num">${k + 1}</span><button type="button" class="stage placed" data-slot="${k}">${esc(stages.find(s => s.id === id).text)}</button></li>`
      : `<li class="slot"><span class="num">${k + 1}</span><span class="slot-empty">Etapa ${k + 1}</span></li>`).join('');
    check.disabled = !unlocked || slots.some(x => !x);
  }

  const $ = s => root.querySelector(s);

  /* ---------- Acciones ---------- */
  function select(id) {
    if (sess().finished) return;
    selected = selected === id ? null : id;
    $('#n1-line').textContent = selected ? 'Tarjeta elegida: ahora toca la zona que le corresponde en el mapa.' : 'Toca una tarjeta y luego su lugar en el mapa (también puedes arrastrarla). Cada acierto vale 10 PE.';
    paint();
  }

  function assign(zone) {
    const c = C();
    if (!selected) {
      say('zone', { text: `<b>${c.zones[zone].name}:</b> ${c.zones[zone].info}` });
      return;
    }
    const card = c.cards.find(x => x.id === selected);
    const r = Game.answer(I, card.id, zone === card.zone, W_CARD);
    selected = null;
    $('#n1-line').textContent = 'Toca una tarjeta y luego su lugar en el mapa (también puedes arrastrarla). Cada acierto vale 10 PE.';
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') say('retry', { left: r.attemptsLeft });
    else if (r.status === 'failed') say('fail', { why: `Correspondía a <b>${c.zones[card.zone].name}</b>. ${card.why}` });
    paint();
    if (r.status === 'retry') { const el = $(`[data-id="${card.id}"]`); if (el) el.classList.add('shake'); }
    if (allCardsDone() && r.status !== 'retry') setTimeout(() => say('phaseB'), 1200);
  }

  function placeStage(id) {
    const k = slots.indexOf(null);
    if (k < 0) return;
    slots[k] = id; pool = pool.filter(x => x !== id); paint();
  }
  function unplace(k) { pool.push(slots[k]); slots[k] = null; paint(); }

  function check() {
    const stages = C().stages;
    const ok = slots.every((id, k) => stages.find(s => s.id === id).order === k + 1);
    const r = Game.answer(I, 'orden', ok, W_ORDER);
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') { say('retry', { left: r.attemptsLeft }); pool = shuffle(stages.map(s => s.id)); slots = [null, null, null]; }
    else if (r.status === 'failed') say('fail', { why: C().orderWhy });
    paint();
    if (orderDone()) setTimeout(() => say('ready'), 1500);
  }

  function hint() {
    const h = Game.useHint(I);
    if (!h.ok) { say('noHints'); return; }
    say('hint', { number: h.number, left: h.left });
    UI.updateHud(root, I, cardsDone() + (orderDone() ? 1 : 0));
  }

  function finish() { Game.finishLevel(I); App.go('fb1'); }

  /* ---------- Render de la pantalla del nivel ---------- */
  function render() {
    const had = sess() && !sess().finished && Object.keys(sess().q).length > 0;
    Game.beginLevel(I);
    selected = null;
    cardOrder = shuffle(C().cards.map(c => c.id));
    pool = shuffle(C().stages.map(s => s.id));
    slots = [null, null, null];
    root.innerHTML = template();
    paint();
    say('intro', { resumed: had });
  }

  /* ---------- Retroalimentación ---------- */
  function renderFeedback() {
    const s = sess();
    if (!s || !s.finished || !s.result) { App.go('museo'); return; }
    const c = C();
    const cardItems = c.cards.map(card => {
      const st = s.q[card.id] || { earned: 0, attempts: 0 };
      const state = st.earned >= W_CARD ? 'ok' : st.earned > 0 ? 'half' : 'fail';
      const lead = state === 'ok' ? 'Correcto a la primera.' : state === 'half' ? 'Correcto en el segundo intento (50 %).' : 'No se acertó.';
      return { state, text: card.text, detail: `<b>${esc(c.zones[card.zone].name)}.</b> ${esc(card.why)} <em>${lead}</em>` };
    });
    const cardPts = c.cards.reduce((a, x) => a + ((s.q[x.id] || {}).earned || 0), 0);
    const oq = s.q.orden || { earned: 0 };
    const orderState = oq.earned >= W_ORDER ? 'ok' : oq.earned > 0 ? 'half' : 'fail';
    const orderItem = { state: orderState,
      text: 'Orden de las tres etapas: salida de Asia → permanencia en Beringia → dispersión hacia el sur.',
      detail: esc(C().orderWhy) };

    const strengths = [], reinforce = [];
    (cardPts >= 56 ? strengths : reinforce).push('Clasificación de evidencias en Beringia, ruta interior y ruta costera');
    (orderState === 'ok' ? strengths : reinforce).push('Secuencia de las etapas del modelo de colonización');
    c.cards.forEach((card, n) => { if (cardItems[n].state === 'fail') reinforce.push(`Repasar el concepto de «${c.zones[card.zone].name}» (tarjeta: ${card.text.split(' ').slice(0, 7).join(' ')}…)`); });

    UI.feedback(fbRoot, I, {
      sections: [
        { title: 'Etapa 1 · Clasificación de evidencias', earned: cardPts, max: C().cards.length * W_CARD, items: cardItems },
        { title: 'Etapa 2 · Etapas del modelo de colonización', earned: oq.earned, max: W_ORDER, items: [orderItem] }
      ],
      strengths, reinforce
    });
  }

  /* ---------- Eventos (delegados; el contenido se regenera) ---------- */
  root.addEventListener('click', e => {
    const card = e.target.closest('.n1-card');
    if (card && !card.disabled) return select(card.dataset.id);
    const zone = e.target.closest('[data-zone]');
    if (zone) return assign(zone.dataset.zone);
    const p = e.target.closest('[data-pool]');
    if (p && !p.disabled) return placeStage(p.dataset.pool);
    const sl = e.target.closest('[data-slot]');
    if (sl) return unplace(Number(sl.dataset.slot));
    if (e.target.closest('[data-act="hint"]')) return hint();
    if (e.target.closest('#n1-check')) return check();
    if (e.target.closest('#n1-finish')) return finish();
  });
  root.addEventListener('keydown', e => {
    const g = e.target.closest('g[data-zone]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); assign(g.dataset.zone); }
  });
  root.addEventListener('dragstart', e => {
    const card = e.target.closest('.n1-card');
    if (!card) return;
    selected = card.dataset.id;
    e.dataTransfer.setData('text/plain', selected);
    e.dataTransfer.effectAllowed = 'move';
  });
  root.addEventListener('dragover', e => { if (e.target.closest('[data-zone]')) e.preventDefault(); });
  root.addEventListener('drop', e => {
    const zone = e.target.closest('[data-zone]');
    if (zone) { e.preventDefault(); assign(zone.dataset.zone); }
  });

  App.register('nivel1', render);
  App.register('fb1', renderFeedback);
  return { render };
})();