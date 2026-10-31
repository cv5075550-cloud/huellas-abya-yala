/* nivel3.js · Nivel 3 «Gran Travesía al Sur» + su retroalimentación (Bloque 5)
   1) Expediente: elegir evidencias (20 PE) · 2) Modelo mejor respaldado (15 PE)
   3) Mapa hacia Mesoamérica y los Andes (15 PE) · 4) Dictamen de 4-6 líneas, rúbrica (50 PE)
   La rúbrica se evalúa con reglas locales; Kuntur.evaluate() la delegará a Gemini en el Bloque 6. */
const Nivel3 = (() => {
  const I = 2, W_EV = 20, W_MODEL = 15, W_MAP = 15, TASKS = 4;
  const LEVEL_PTS = { logrado: 12.5, parcial: 7, inicial: 3 };
  const LEVEL_NAME = { logrado: 'Logrado', parcial: 'Parcial', inicial: 'Inicial' };
  const LEVEL_STATE = { logrado: 'ok', parcial: 'half', inicial: 'fail' };
  const root = document.getElementById('screen-nivel3');
  const fbRoot = document.getElementById('screen-fb3');
  const C = () => DATA.content.level3;
  const esc = UI.esc;
  const $ = s => root.querySelector(s);
  const fmt = n => String(n).replace('.', ',');

  let selEv = new Set(), chosenModel = null, path = [], sending = false;

  const say = (type, ctx) => Kuntur.respond(type, Object.assign({ level: I }, ctx)).then(t => UI.say(root, t));
  const sess = () => Game.session(I);
  const isDone = id => { const q = (sess().q || {})[id]; return Boolean(q && q.done); };
  const tasksDone = () => ['ev', 'modelo', 'mapa', 'dictamen'].filter(isDone).length;

  /* ---------- Rúbrica local (reglas simples y transparentes) ---------- */
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const has = (t, words) => words.some(w => t.includes(w));
  const EV_KEYS = {
    A: ['white sands', 'nuevo mexico', '21 000', '23 000', '21000', '23000'],
    B: ['monte verde', 'chile'],
    C: ['corredor', '12 600', '12600', 'libre de hielo', 'sedimento'],
    D: ['adn', 'genoma', 'genetic', 'anzick', 'estancamiento'],
    E: ['calvert', 'columbia britanica'],
    F: ['puntas']
  };
  const VOCAB = ['beringia', 'glaciar', 'glaciacion', 'corredor', 'kelp', 'algas', 'estancamiento', 'radiocarbono', 'adn', 'datacion', 'clovis'];

  function localRubric({ text }) {
    const t = norm(text);
    const lines = text.split('\n').map(x => x.trim()).filter(Boolean).length;
    const cited = Object.values(EV_KEYS).filter(keys => has(t, keys)).length;
    const goodModel = has(t, ['costa', 'costera', 'pacifico', 'anterior a clovis', 'antes de clovis', 'preclovis', 'pre-clovis', 'anteriores a clovis']);
    const because = has(t, ['porque', 'ya que', 'pues', 'debido', 'por eso', 'por lo tanto', 'gracias a', 'sugiere', 'indica', 'demuestra', 'muestra', 'apoya']);
    const doubt = has(t, ['duda', 'incert', 'debate', 'discut', 'no se sabe', 'se desconoce', 'falta', 'aun no', 'todavia', 'sin resolver', 'controver', 'queda por', 'pregunta abierta']);
    const specific = has(t, ['fecha', 'cuando', 'antiguedad', 'ruta', 'sumerg', 'bajo el mar', 'restos humanos', 'quienes', 'una sola', 'varias']);
    const regions = (t.includes('mesoamerica') ? 1 : 0) + (has(t, ['andes', 'andino']) ? 1 : 0);
    const vocab = VOCAB.filter(w => t.includes(w)).length;

    const crit = [];
    crit.push(cited >= 3 ? { id: 'uso', level: 'logrado', msg: `Citaste ${cited} evidencias distintas.` }
      : cited === 2 ? { id: 'uso', level: 'parcial', msg: 'Citaste 2 evidencias. Cita al menos 3 y explica qué aporta cada una.' }
      : { id: 'uso', level: 'inicial', msg: 'Casi no se reconocen evidencias concretas. Nombra sitios o estudios del expediente.' });
    crit.push(goodModel && (because || cited >= 1) ? { id: 'modelo', level: 'logrado', msg: 'Elegiste un modelo anterior a Clovis y lo justificaste con evidencias.' }
      : goodModel ? { id: 'modelo', level: 'parcial', msg: 'Nombras el modelo, pero falta justificarlo con evidencias («porque…», «esto indica…»).' }
      : { id: 'modelo', level: 'inicial', msg: 'No se identifica con claridad el modelo mejor respaldado ni su justificación.' });
    crit.push(doubt && specific ? { id: 'dudas', level: 'logrado', msg: 'Señalaste una duda concreta que sigue abierta.' }
      : doubt ? { id: 'dudas', level: 'parcial', msg: 'Mencionas incertidumbre, pero de forma general. Di qué exactamente no se sabe (fecha, ruta, sitios sumergidos…).' }
      : { id: 'dudas', level: 'inicial', msg: 'No mencionas dudas científicas. Siempre quedan preguntas abiertas.' });
    crit.push(regions === 2 && vocab >= 2 ? { id: 'claro', level: 'logrado', msg: 'Texto ordenado, con vocabulario preciso y mención de Mesoamérica y los Andes.' }
      : regions >= 1 || vocab >= 2 ? { id: 'claro', level: 'parcial', msg: 'Falta mencionar Mesoamérica y los Andes, o usar más vocabulario preciso (Beringia, corredor, glaciar…).' }
      : { id: 'claro', level: 'inicial', msg: 'El texto es poco preciso. Usa vocabulario del tema y menciona hacia dónde se dispersaron los grupos.' });
    return { criteria: crit, lines };
  }

  /* ---------- Plantilla ---------- */
  const mapSVG = () => `
    <svg class="map map3" viewBox="0 0 340 500" role="group" aria-label="Mapa esquemático de América para trazar la dispersión">
      <rect width="340" height="500" fill="#cfe3e0"/>
      <path d="M20 20L120 12L220 40L270 100L250 170L205 215L170 262L140 255L95 205L55 130Z" fill="#e3c99b"/>
      <path d="M140 255L172 262L190 290L210 312L196 326L168 306L138 282Z" fill="#e3c99b"/>
      <path d="M196 326L262 340L292 395L262 465L232 495L218 462L206 395L186 350Z" fill="#e3c99b"/>
      <text x="300" y="34" class="map-txt" text-anchor="middle">N</text><path d="M300 42v22M295 50l5-8 5 8" stroke="#6a4a35" stroke-width="2" fill="none"/>
      <polyline id="n3-line" points="" fill="none" stroke="#b4532a" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round"/>
      <g id="n3-pts"></g>
    </svg>`;

  function template() {
    const c = C();
    return `${UI.hud(I, TASKS)}${UI.dock()}
    <main class="lvl-main">
      <section class="lvl-sec">
        <h2><span class="step">1</span> Expediente del cronista <span class="fb-pts">20 PE</span></h2>
        <p class="muted">Lee las seis evidencias y elige al menos tres que respalden tu dictamen.</p>
        <ul class="ev-grid" id="n3-ev"></ul>
        <div class="order-actions"><span class="muted" id="n3-ev-count"></span>
          <button class="btn btn-primary" id="n3-ev-ok" type="button" disabled>Confirmar selección</button></div>
      </section>

      <section class="lvl-sec" id="n3-m">
        <h2><span class="step">2</span> ¿Qué modelo está mejor respaldado? <span class="fb-pts">15 PE</span></h2>
        <p class="muted" id="n3-m-line"></p>
        <ul class="model-list" id="n3-models"></ul>
        <div class="order-actions"><button class="btn btn-primary" id="n3-m-ok" type="button" disabled>Confirmar modelo</button></div>
      </section>

      <section class="lvl-sec" id="n3-p">
        <h2><span class="step">3</span> Traza la gran travesía al sur <span class="fb-pts">15 PE</span></h2>
        <p class="muted" id="n3-p-line"></p>
        <div class="map3-wrap">${mapSVG()}
          <div class="map3-side"><ol id="n3-steps" class="steps-list"></ol>
            <div class="order-actions"><button class="btn btn-ghost" id="n3-p-reset" type="button">Reiniciar ruta</button>
              <button class="btn btn-primary" id="n3-p-ok" type="button" disabled>Confirmar ruta</button></div></div>
        </div>
      </section>

      <section class="lvl-sec" id="n3-d">
        <h2><span class="step">4</span> Dictamen del Cronista <span class="fb-pts">50 PE</span></h2>
        <p class="muted" id="n3-d-line"></p>
        <textarea id="n3-text" rows="8" maxlength="900" placeholder="Escribe de 4 a 6 líneas. Pulsa Enter para separar cada línea."></textarea>
        <div class="dict-meta"><span id="n3-count"></span></div>
        <details class="rubric-help"><summary>¿Cómo se evalúa mi dictamen?</summary>
          <ul><li><b>Uso de evidencias:</b> cita al menos 3 y explica qué aporta cada una.</li>
          <li><b>Modelo mejor respaldado:</b> elige un modelo y justifícalo.</li>
          <li><b>Dudas abiertas:</b> señala al menos una duda concreta.</li>
          <li><b>Claridad y estructura:</b> 4–6 líneas, vocabulario preciso y mención de Mesoamérica y los Andes.</li></ul></details>
        <div class="order-actions"><button class="btn btn-primary" id="n3-send" type="button" disabled>Entregar dictamen</button></div>
        <div id="n3-rubric" aria-live="polite"></div>
      </section>
      <div class="lvl-finish"><button class="btn btn-primary btn-lg" id="n3-finish" type="button" hidden>Ver mis resultados</button></div>
    </main>`;
  }

  /* ---------- Pintado ---------- */
  function paint() {
    paintEv(); paintModel(); paintMap(); paintDictamen();
    $('#n3-finish').hidden = !isDone('dictamen');
    UI.updateHud(root, I, tasksDone());
    injectIcons(root);
  }

  function paintEv() {
    const done = isDone('ev');
    $('#n3-ev').innerHTML = C().evidence.map(e => {
      const on = selEv.has(e.id);
      const tag = done ? `<span class="ev-tag ${e.supports ? 'yes' : 'no'}">${e.supports ? 'Respalda el modelo' : 'Contexto: no concluyente'}</span>` : '';
      return `<li><button type="button" class="ev-card ${on ? 'sel' : ''} ${done && on ? (e.supports ? 'ok' : 'fail') : ''}" data-ev="${e.id}" aria-pressed="${on}" ${done ? 'disabled' : ''}>
        <span class="ev-id">${e.id}</span>
        <span><strong>${esc(e.title)}</strong> <small>${esc(e.age)}</small><span class="ev-text">${esc(e.text)}</span>${tag}${done ? `<span class="ev-note">${esc(e.note)}</span>` : ''}</span>
      </button></li>`;
    }).join('');
    $('#n3-ev-count').textContent = done ? '' : `${selEv.size} seleccionada${selEv.size === 1 ? '' : 's'} (mínimo ${C().minEvidence})`;
    $('#n3-ev-ok').hidden = done;
    $('#n3-ev-ok').disabled = selEv.size < C().minEvidence;
  }

  function paintModel() {
    const unlocked = isDone('ev'), done = isDone('modelo');
    $('#n3-m').classList.toggle('locked', !unlocked);
    $('#n3-m-line').textContent = unlocked ? 'Con las evidencias que elegiste, ¿qué explicación del poblamiento tiene más respaldo hoy?' : 'Se desbloquea al confirmar tu selección de evidencias.';
    const q = (sess().q || {}).modelo;
    $('#n3-models').innerHTML = C().models.map(m => {
      const on = chosenModel === m.id;
      const best = done && m.id === C().bestModel;
      return `<li><button type="button" class="model-opt ${on ? 'sel' : ''} ${best ? 'ok' : ''}" data-model="${m.id}" ${(!unlocked || done) ? 'disabled' : ''} aria-pressed="${on}">
        <strong>${esc(m.title)}</strong><span>${esc(m.text)}</span>${done && (best || (on && q.earned === 0)) ? `<em>${esc(m.why)}</em>` : ''}</button></li>`;
    }).join('');
    $('#n3-m-ok').hidden = done;
    $('#n3-m-ok').disabled = !unlocked || !chosenModel;
  }

  function paintMap() {
    const unlocked = isDone('modelo'), done = isDone('mapa'), m = C().map;
    $('#n3-p').classList.toggle('locked', !unlocked);
    $('#n3-p-line').textContent = unlocked
      ? 'Toca los cuatro lugares en el orden en que los grupos humanos avanzaron hacia el sur.'
      : 'Se desbloquea al confirmar el modelo.';
    const seq = done ? m.order : path;
    $('#n3-line').setAttribute('points', seq.map(id => { const p = m.points.find(x => x.id === id); return `${p.x},${p.y}`; }).join(' '));
    $('#n3-pts').innerHTML = m.points.map(p => {
      const n = seq.indexOf(p.id) + 1;
      return `<g class="pt ${n ? 'on' : ''}" data-pt="${p.id}" tabindex="${unlocked && !done ? 0 : -1}" role="button" aria-label="${esc(p.name)}">
        <circle cx="${p.x}" cy="${p.y}" r="15"/><text x="${p.x}" y="${p.y + 5}" text-anchor="middle" class="pt-n">${n || ''}</text>
        <text x="${p.x + 22}" y="${p.y + 5}" class="map-txt">${esc(p.name)}</text></g>`;
    }).join('');
    $('#n3-steps').innerHTML = (done ? m.order : path).map(id => `<li>${esc(m.points.find(x => x.id === id).name)}</li>`).join('') || '<li class="muted">Aún no marcaste ningún lugar.</li>';
    $('#n3-p-reset').hidden = done; $('#n3-p-ok').hidden = done;
    $('#n3-p-ok').disabled = !unlocked || path.length !== m.order.length;
    $('#n3-p-reset').disabled = !unlocked || !path.length;
  }

  const lineCount = t => t.split('\n').map(x => x.trim()).filter(Boolean);
  function paintDictamen(keepText) {
    const unlocked = isDone('mapa'), done = isDone('dictamen'), ta = $('#n3-text');
    $('#n3-d').classList.toggle('locked', !unlocked);
    $('#n3-d-line').textContent = unlocked
      ? 'Redacta tu dictamen: cita evidencias, elige el modelo mejor respaldado, reconoce una duda abierta y nombra Mesoamérica y los Andes.'
      : 'Se desbloquea al trazar la ruta en el mapa.';
    ta.disabled = !unlocked || done || sending;
    const lines = lineCount(ta.value), n = lines.length, short = lines.some(l => l.split(/\s+/).length < 3);
    const ok = n >= 4 && n <= 6 && !short;
    $('#n3-count').textContent = `Líneas: ${n} (necesitas de 4 a 6, de al menos 3 palabras cada una)`;
    $('#n3-count').className = ok ? 'ok' : '';
    $('#n3-send').hidden = done;
    $('#n3-send').disabled = !unlocked || !ok || sending;
    const meta = Game.meta(I);
    $('#n3-rubric').innerHTML = done && meta.rubric ? rubricHtml(meta.rubric) : '';
  }

  const rubricHtml = crit => `<div class="rubric-res"><h3>Resultado de la rúbrica</h3><ul>${crit.map(r => {
    const name = C().rubric.find(x => x.id === r.id).name;
    return `<li class="${LEVEL_STATE[r.level]}"><b>${esc(name)} · ${LEVEL_NAME[r.level]} (${fmt(LEVEL_PTS[r.level])} / 12,5)</b><br>${esc(r.msg)}</li>`;
  }).join('')}</ul></div>`;

  /* ---------- Acciones ---------- */
  function confirmEv() {
    const c = C(), ids = [...selEv];
    const supportive = ids.filter(id => c.evidence.find(e => e.id === id).supports).length;
    const ok = ids.length >= c.minEvidence && supportive >= c.minEvidence;
    Game.setMeta(I, { selected: ids });
    const r = Game.answer(I, 'ev', ok, W_EV);
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') say('retry', { left: r.attemptsLeft });
    else if (r.status === 'failed') say('fail', { why: 'Para respaldar tu dictamen necesitabas al menos tres evidencias que apoyen el modelo mejor sustentado. Revisa las etiquetas del expediente.' });
    paint();
    if (r.status !== 'retry') setTimeout(() => say('note', { text: 'Ahora decide qué <b>modelo</b> está mejor respaldado por las evidencias.' }), 1200);
  }

  function confirmModel() {
    const r = Game.answer(I, 'modelo', chosenModel === C().bestModel, W_MODEL);
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') say('retry', { left: r.attemptsLeft });
    else if (r.status === 'failed') say('fail', { why: C().models.find(m => m.id === C().bestModel).why });
    paint();
    if (r.status !== 'retry') setTimeout(() => say('note', { text: 'Es hora de orientarte: traza en el mapa la dirección de la <b>gran travesía al sur</b>.' }), 1200);
  }

  function togglePt(id) {
    if (!isDone('modelo') || isDone('mapa')) return;
    if (!path.includes(id)) path.push(id);
    paintMap();
  }
  function confirmMap() {
    const m = C().map, ok = path.length === m.order.length && path.every((id, k) => id === m.order[k]);
    const r = Game.answer(I, 'mapa', ok, W_MAP);
    if (r.status === 'correct') say('correct', { attempt: r.attempt });
    else if (r.status === 'retry') { say('retry', { left: r.attemptsLeft }); path = []; }
    else if (r.status === 'failed') say('fail', { why: m.why });
    paint();
    if (r.status !== 'retry') setTimeout(() => say('note', { text: 'Último reto: escribe tu <b>dictamen</b> de 4 a 6 líneas.' }), 1200);
  }

  async function sendDictamen() {
    const ta = $('#n3-text'), text = lineCount(ta.value).join('\n');
    sending = true; paintDictamen();
    say('note', { text: 'Estoy leyendo tu dictamen con atención…' });
    const ctx = { text, selected: [...selEv], model: chosenModel };
    const res = await Kuntur.evaluate('rubric', ctx, localRubric);
    const crit = C().rubric.map(r => {
      const f = (res.criteria || []).find(x => x.id === r.id) || { level: 'inicial', msg: '' };
      return { id: r.id, level: LEVEL_PTS[f.level] ? f.level : 'inicial', msg: f.msg || '' };
    });
    const total = crit.reduce((a, r) => a + LEVEL_PTS[r.level], 0);
    Game.setMeta(I, { text, rubric: crit });
    Game.award(I, 'dictamen', total);
    Game.setDictamen(text, true);
    sending = false;
    say('note', { text: `Dictamen entregado: obtuviste <b>${fmt(total)} de 50 PE</b> en la rúbrica. Revisa los comentarios y luego mira tus resultados.` });
    paint();
  }

  function hint() {
    const h = Game.useHint(I);
    if (!h.ok) { say('noHints'); return; }
    say('hint', { number: h.number, left: h.left });
    UI.updateHud(root, I, tasksDone());
  }
  function finish() { Game.finishLevel(I); App.go('fb3'); }

  /* ---------- Render ---------- */
  function render() {
    const had = sess() && !sess().finished && Object.keys(sess().q).length > 0;
    Game.beginLevel(I);
    const meta = Game.meta(I);
    selEv = new Set(meta.selected || []);
    chosenModel = null; path = []; sending = false;
    root.innerHTML = template();
    $('#n3-text').value = meta.text || '';
    paint();
    say('intro', { resumed: had });
  }

  /* ---------- Retroalimentación ---------- */
  function renderFeedback() {
    const s = sess();
    if (!s || !s.finished || !s.result) { App.go('museo'); return; }
    const c = C(), meta = s.meta || {}, earned = id => (s.q[id] || {}).earned || 0;
    const st = (pts, max) => pts >= max ? 'ok' : pts > 0 ? 'half' : 'fail';
    const lead = x => x === 'ok' ? 'Correcto a la primera.' : x === 'half' ? 'Correcto en el segundo intento (50 %).' : 'No se acertó.';

    const evSel = (meta.selected || []).map(id => c.evidence.find(e => e.id === id));
    const evSt = st(earned('ev'), W_EV);
    const evItems = evSel.map(e => ({ state: e.supports ? 'ok' : 'fail', text: `${e.id}. ${e.title}`,
      detail: `<b>${e.supports ? 'Respalda el modelo.' : 'Contexto: no concluyente.'}</b> ${esc(e.note)}` }));
    evItems.push({ state: 'info', text: 'Resultado de la selección', detail: `<em>${lead(evSt)}</em>` });

    const best = c.models.find(m => m.id === c.bestModel);
    const mSt = st(earned('modelo'), W_MODEL), pSt = st(earned('mapa'), W_MAP);
    const crit = meta.rubric || [];
    const dictItems = crit.map(r => ({ state: LEVEL_STATE[r.level], text: c.rubric.find(x => x.id === r.id).name,
      detail: `<b>${LEVEL_NAME[r.level]} (${fmt(LEVEL_PTS[r.level])} / 12,5).</b> ${esc(r.msg)}` }));
    dictItems.push({ state: 'info', text: 'Tu dictamen', detail: `<em>${esc(meta.text || '').replace(/\n/g, '<br>')}</em>` });

    const strengths = [], reinforce = [];
    (evSt === 'ok' ? strengths : reinforce).push('Elegir evidencias que respaldan el modelo');
    (mSt === 'ok' ? strengths : reinforce).push('Identificar el modelo mejor respaldado');
    (pSt === 'ok' ? strengths : reinforce).push('Orientar la dispersión hacia Mesoamérica y los Andes en el mapa');
    crit.forEach(r => { const n = c.rubric.find(x => x.id === r.id).name; (r.level === 'logrado' ? strengths : reinforce).push(`Dictamen · ${n}`); });

    UI.feedback(fbRoot, I, {
      sections: [
        { title: 'Tarea 1 · Expediente de evidencias', earned: earned('ev'), max: W_EV, items: evItems },
        { title: 'Tarea 2 · Modelo mejor respaldado', earned: earned('modelo'), max: W_MODEL,
          items: [{ state: mSt, text: best.title + ': ' + best.text, detail: esc(best.why) + ` <em>${lead(mSt)}</em>` }] },
        { title: 'Tarea 3 · Mapa de la gran travesía', earned: earned('mapa'), max: W_MAP,
          items: [{ state: pSt, text: c.map.order.map(id => c.map.points.find(p => p.id === id).name).join(' → '), detail: esc(c.map.why) + ` <em>${lead(pSt)}</em>` }] },
        { title: 'Tarea 4 · Dictamen del Cronista (rúbrica)', earned: earned('dictamen'), max: 50, items: dictItems }
      ],
      strengths, reinforce
    });
  }

  /* ---------- Eventos ---------- */
  root.addEventListener('click', e => {
    const ev = e.target.closest('[data-ev]');
    if (ev && !ev.disabled) { const id = ev.dataset.ev; selEv.has(id) ? selEv.delete(id) : selEv.add(id); return paint(); }
    const mo = e.target.closest('[data-model]');
    if (mo && !mo.disabled) { chosenModel = mo.dataset.model; return paintModel(); }
    const pt = e.target.closest('[data-pt]');
    if (pt) return togglePt(pt.dataset.pt);
    if (e.target.closest('#n3-ev-ok')) return confirmEv();
    if (e.target.closest('#n3-m-ok')) return confirmModel();
    if (e.target.closest('#n3-p-reset')) { path = []; return paintMap(); }
    if (e.target.closest('#n3-p-ok')) return confirmMap();
    if (e.target.closest('#n3-send')) return sendDictamen();
    if (e.target.closest('[data-act="hint"]')) return hint();
    if (e.target.closest('#n3-finish')) return finish();
  });
  root.addEventListener('input', e => { if (e.target.id === 'n3-text') paintDictamen(); });
  root.addEventListener('keydown', e => {
    const g = e.target.closest('g[data-pt]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); togglePt(g.dataset.pt); }
  });

  App.register('nivel3', render);
  App.register('fb3', renderFeedback);
  return { render, localRubric };
})();