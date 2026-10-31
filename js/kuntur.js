/* kuntur.js · Kuntur, guía educativo (Bloque 3: reglas programadas)
   Toda la app llama a Kuntur.respond(tipo, contexto). En el Bloque 7 se conectará Gemini
   con Kuntur.setProvider(fn); si falla o no hay clave, se usan siempre estas reglas. */
const Kuntur = (() => {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const lvName = i => DATA.levels[i].name;
  let provider = null;       // async (tipo, ctx, textoBase) => string | null

  const INTRO = [
    'Bienvenido/a al <b>Campamento Beringia</b>. Toca una tarjeta y luego elige su lugar en el mapa: Beringia, ruta interior o ruta costera. Después ordenarás las etapas del viaje.',
    'En el <b>Laboratorio del Tiempo</b> distinguirás la evidencia sólida de la que está en debate y ordenarás los periodos.',
    'Llegó la hora del <b>dictamen</b>. Revisa el expediente, elige tus evidencias y defiende el modelo mejor respaldado.'
  ];

  const RETRY = {
    0: ['Aún no es esa. Relee las palabras clave de la tarjeta y piensa en el mapa.',
        'Casi. Fíjate en el paisaje y en cómo se movía la gente en cada zona.'],
    1: ['Aún no. Piensa en cuántos hallazgos o pruebas independientes respaldan esa evidencia.',
        'Casi. Pregúntate si los especialistas coinciden o discuten este hallazgo, o cómo cambia la vida en cada periodo.'],
    2: ['Revisa con calma: piensa qué evidencias respaldan mejor la idea de un poblamiento temprano.',
        'Casi. Mira las fechas y pregúntate qué pasaba con el corredor interior en ese momento.']
  };

  const rules = {
    intro: c => c.resumed ? 'Retomamos donde lo dejaste, cronista. ¡Sigamos!' : INTRO[c.level],
    hint: c => {
      const h = DATA.content['level' + (c.level + 1)].hints[c.number - 1];
      const left = c.left ? `Te quedan ${c.left} ${c.left === 1 ? 'pista' : 'pistas'}.` : 'Esa fue tu última pista de este nivel.';
      return `<b>Pista ${c.number}:</b> ${h} <small>(−${DATA.scoring.hintPenalty} PE · ${left})</small>`;
    },
    noHints: () => 'Ya usaste las tres pistas de este nivel. Confía en lo que has aprendido, cronista.',
    zone: c => c.text,
    select: () => 'Bien. Ahora toca la zona del mapa que corresponde a esa tarjeta.',
    correct: c => c.attempt === 1
      ? pick(['¡Excelente, cronista! Acierto a la primera.', '¡Muy bien! Lo tenías claro.', '¡Así se hace! Una evidencia bien ubicada.'])
      : 'Bien, lo lograste en el segundo intento. Cuenta el 50 % del puntaje.',
    retry: c => pick(RETRY[c.level] || RETRY[0]) + ` Te queda ${c.left} intento.`,
    note: c => c.text,
    fail: c => `Esta vez no fue. ${c.why} Repasa este concepto, volverá a ayudarte más adelante.`,
    phaseB: () => 'Ya clasificaste las siete tarjetas. Ahora ordena las <b>tres etapas</b> del modelo de colonización: toca cada etapa en el orden en que ocurrió.',
    ready: () => 'Todo listo. Cuando quieras, revisa tus resultados.',
    finish: c => {
      const r = c.result;
      if (r.passed) return `¡Lo lograste, cronista! Sumaste <b>${r.score} PE</b> y ganaste la insignia <b>${DATA.levels[c.level].badge}</b>. ${r.unlockedNext ? 'El siguiente nivel ya está abierto.' : ''}`;
      return `Te faltaron <b>${DATA.scoring.pass - r.score} PE</b> para superar el nivel. Lee las explicaciones y vuelve a intentarlo: cuenta tu mejor puntaje.`;
    }
  };

  function text(type, ctx = {}) { return (rules[type] || (() => ''))(ctx); }

  async function respond(type, ctx = {}) {
    const base = text(type, ctx);
    if (provider) {
      try { const t = await provider(type, ctx, base); if (t) return t; } catch { /* usa reglas */ }
    }
    return base;
  }
  const setProvider = fn => { provider = fn; };

  /* Evaluación (p. ej. rúbrica del dictamen): usa el proveedor de IA si existe; si no, la función local. */
  async function evaluate(type, ctx, localFn) {
    if (provider) {
      try { const r = await provider(type, ctx, null); if (r && typeof r === 'object') return r; } catch { /* usa reglas */ }
    }
    return localFn(ctx);
  }

  return { respond, text, setProvider, evaluate, lvName };
})();