/* game.js · Reglas de gamificación (Bloque 2)
   Los niveles (bloques 4-6) solo llaman a esta API; no calculan puntos por su cuenta.

   Flujo típico de un nivel:
     Game.beginLevel(i)                      -> abre (o retoma) el intento
     Game.answer(i, 'q1', esCorrecta, peso)  -> {status:'correct'|'retry'|'failed'|'closed', ...}
     Game.useHint(i)                         -> {ok, number, left, penalty}
     Game.finishLevel(i)                     -> {score, best, passed, badge, ...}
   Decisión de diseño: el puntaje oficial de un nivel es el MEJOR de sus intentos. */
const Game = (() => {
  const C = DATA.scoring;
  const listeners = [];
  const st = () => Store.get();
  const emit = () => { Store.save(); listeners.forEach(fn => fn(st())); };
  const on = fn => listeners.push(fn);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------- Consultas ---------- */
  const levelScore = i => st().levels[i].score;
  const totalScore = () => st().levels.reduce((a, l) => a + l.score, 0);
  const passed     = i => levelScore(i) >= C.pass;
  const isUnlocked = i => i === 0 || passed(i - 1);       // bloquea el avance sin 70 PE
  const hasBadge   = i => st().badges[i];
  const badgeCount = () => st().badges.filter(Boolean).length;
  const hasProgress = () => st().started || totalScore() > 0 || st().sessions.some(Boolean);
  const session    = i => st().sessions[i];

  const rank = (pts = totalScore()) => DATA.ranks.find(r => pts >= r.min && pts <= r.max) || DATA.ranks[0];
  const completed = () => st().levels.every((_, i) => passed(i)) && badgeCount() === C.levels && st().dictamen.delivered;

  /* PE en vivo del intento actual (se actualiza con cada respuesta o pista) */
  function live(i) {
    const s = session(i);
    if (!s) return levelScore(i);
    return clamp(Math.round(s.earned - s.hints * C.hintPenalty), 0, C.maxLevel);
  }
  const hintsLeft = i => { const s = session(i); return C.hintsPerLevel - (s ? s.hints : 0); };

  /* ---------- Intento de nivel ---------- */
  function beginLevel(i, { retry = false } = {}) {
    const cur = session(i);
    if (!cur || cur.finished || retry) {
      st().sessions[i] = { earned: 0, hints: 0, finished: false, q: {} };
      emit();
    }
    return session(i);
  }

  /* Dos intentos por pregunta: 1.º correcto = 100 %, 2.º correcto = 50 % */
  function answer(i, qid, correct, weight) {
    const s = session(i);
    if (!s || s.finished) return { status: 'closed' };
    const q = s.q[qid] || (s.q[qid] = { attempts: 0, done: false, earned: 0 });
    if (q.done) return { status: 'closed', earned: q.earned };
    q.attempts++;

    if (correct) {
      q.done = true;
      q.earned = weight * (q.attempts === 1 ? 1 : C.secondFactor);
      s.earned += q.earned;
      emit();
      return { status: 'correct', attempt: q.attempts, earned: q.earned, live: live(i) };
    }
    if (q.attempts >= C.maxAttempts) {       // sin más intentos: Kuntur ya puede explicar la respuesta
      q.done = true;
      emit();
      return { status: 'failed', attempt: q.attempts, earned: 0, live: live(i), reveal: true };
    }
    emit();
    return { status: 'retry', attempt: q.attempts, attemptsLeft: C.maxAttempts - q.attempts, live: live(i) };
  }

  /* Puntaje directo (p. ej. dictamen evaluado con rúbrica): una sola evaluación por intento de nivel */
  function award(i, qid, pts) {
    const s = session(i);
    if (!s || s.finished) return { status: 'closed' };
    const q = s.q[qid] || (s.q[qid] = { attempts: 0, done: false, earned: 0 });
    if (q.done) return { status: 'closed', earned: q.earned };
    q.attempts = 1; q.done = true; q.earned = pts; s.earned += pts;
    emit();
    return { status: 'awarded', earned: pts, live: live(i) };
  }
  /* Datos extra del intento (selecciones, texto del dictamen, etc.) */
  function setMeta(i, obj) { const s = session(i); if (!s) return; s.meta = Object.assign(s.meta || {}, obj); emit(); }
  const meta = i => (session(i) || {}).meta || {};

  const attemptsOf = (i, qid) => { const s = session(i); return s && s.q[qid] ? s.q[qid].attempts : 0; };

  /* Tres pistas por nivel; cada una resta 5 PE */
  function useHint(i) {
    const s = session(i);
    if (!s || s.finished || s.hints >= C.hintsPerLevel) return { ok: false, left: 0 };
    s.hints++;
    emit();
    return { ok: true, number: s.hints, left: C.hintsPerLevel - s.hints, penalty: C.hintPenalty, live: live(i) };
  }

  function finishLevel(i) {
    const s = session(i);
    if (!s) return null;
    const score = live(i);
    const lv = st().levels[i];
    s.finished = true;
    lv.attempts++;
    lv.last = score;
    if (score > lv.score) lv.score = score;
    const passedNow = score >= C.pass;
    let badge = false;
    if (passedNow && !st().badges[i]) { st().badges[i] = true; badge = true; }
    const result = { score, best: lv.score, passed: passedNow, badge, unlockedNext: passedNow && i < C.levels - 1,
                     canRetry: !passedNow, hints: s.hints, earned: Math.round(s.earned) };
    s.result = result;                       // se conserva para la pantalla de retroalimentación
    emit();
    return result;
  }

  /* ---------- Partida ---------- */
  function start() { st().started = true; emit(); }
  function reset() { Store.reset(); emit(); }
  function setDictamen(text, delivered = false) { st().dictamen = { text, delivered }; emit(); }

  /* Ayuda para pruebas desde la consola: Game.debug.setScore(0, 80) */
  const debug = {
    setScore(i, pts) {
      st().levels[i].score = clamp(pts, 0, C.maxLevel);
      st().started = true;
      emit();
    }
  };

  return { on, levelScore, totalScore, passed, isUnlocked, hasBadge, badgeCount, hasProgress, rank, completed,
           live, hintsLeft, session, result: i => (session(i) || {}).result, award, setMeta, meta, beginLevel, answer, attemptsOf, useHint, finishLevel, start, reset, setDictamen, debug };
})();