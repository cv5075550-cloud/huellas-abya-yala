/* data.js · Datos de la aplicación.
   Bloque 1: asignaturas, niveles (solo metadatos) y textos de interfaz.
   Los contenidos históricos de cada nivel se añadirán en sus bloques. */
const DATA = {
  scoring: {
    levels: 3,
    maxLevel: 100,       // PE máximos por nivel
    maxTotal: 300,
    pass: 70,            // PE mínimos para desbloquear el siguiente nivel
    maxAttempts: 2,      // intentos por pregunta
    secondFactor: 0.5,   // segundo intento correcto = 50 %
    hintsPerLevel: 3,
    hintPenalty: 5       // PE que resta cada pista
  },
  ranks: [
    { min: 0,   max: 209, name: 'Explorador/a novel' },
    { min: 210, max: 269, name: 'Arqueólogo/a' },
    { min: 270, max: 300, name: 'Arqueólogo/a Jefe/a' }
  ],
  museoFooter: 'Huellas de Abya Yala • Recurso educativo • 8.º–10.º grado • Aprende jugando, explora la historia',

  subjects: [
    {
      id: 'ccss-historia',
      name: 'Estudios Sociales · Historia de América',
      grade: '8.º–10.º EGB',
      teacher: 'Docente de Estudios Sociales',
      summary: 'Explora cómo y cuándo llegaron las primeras sociedades a América y cómo se fueron transformando.',
      color: '#b4532a',
      units: [
        {
          title: 'Unidad 1 · El primer poblamiento de América',
          activities: [
            {
              id: 'huellas',
              title: 'Huellas de Abya Yala',
              desc: 'Expedición al primer poblamiento de América',
              route: 'inicio',
              tag: 'Actividad interactiva'
            }
          ]
        }
      ]
    }
  ],

  // Subtítulos tomados del diseño de referencia
  levels: [
    { id: 1, title: 'Nivel 1 ·', name: 'Campamento Beringia',  sub: '¿Por dónde y cómo?',   icon: 'compass',   tone: '#bfe0d8', badge: 'Brújula de Beringia',  badgeColor: '#b4532a', badgeIcon: 'compass' },
    { id: 2, title: 'Nivel 2 ·', name: 'Laboratorio del Tiempo', sub: 'Dataciones y ADN',     icon: 'hourglass', tone: '#f5d38e', badge: 'Cronómetro del Hielo', badgeColor: '#2f7f78', badgeIcon: 'hourglass' },
    { id: 3, title: 'Nivel 3 ·', name: 'Gran Travesía al Sur', sub: 'Dictamen del Cronista', icon: 'scroll',    tone: '#efb99a', badge: 'Cartógrafo del Sur',   badgeColor: '#c98a2e', badgeIcon: 'scroll' }
  ],

  // Contenidos por nivel (fuente: docs/documento-academico.md)
  content: {
    level1: {
      zones: {
        beringia: { name: 'Beringia', info: 'territorio que unió Siberia y Alaska cuando el nivel del mar bajó durante la glaciación. Hoy está bajo el mar.' },
        interior: { name: 'Ruta interior', info: 'corredor entre grandes glaciares, en el actual Canadá, que se abrió cuando el hielo retrocedió.' },
        costera:  { name: 'Ruta costera del Pacífico', info: 'camino bordeando la costa, con embarcaciones y recursos marinos como focas, peces y algas.' }
      },
      cards: [
        { id: 'c1', zone: 'beringia', text: 'Un territorio hoy cubierto por el mar unió Siberia y Alaska cuando el nivel del agua bajó por el hielo acumulado.',
          why: 'Con tanta agua atrapada en glaciares, el nivel del mar bajó y dejó al descubierto un extenso puente de tierra.' },
        { id: 'c2', zone: 'interior', text: 'Un pasillo entre dos enormes capas de hielo, en el actual Canadá, se fue abriendo al derretirse los glaciares.',
          why: 'Es el llamado corredor libre de hielo; solo fue transitable cuando los glaciares retrocedieron lo suficiente.' },
        { id: 'c3', zone: 'costera', text: 'Grupos con embarcaciones avanzaron bordeando la costa, aprovechando focas, peces y bosques de algas marinas.',
          why: 'Es la hipótesis de la «ruta de las algas» (kelp highway): la costa ofrecía alimento parecido a lo largo de todo el viaje.' },
        { id: 'c4', zone: 'beringia', text: 'Una población pudo permanecer aislada allí durante miles de años y diferenciarse genéticamente de sus parientes asiáticos.',
          why: 'Es la hipótesis del «estancamiento beringio», apoyada por estudios de ADN antiguo y actual.' },
        { id: 'c5', zone: 'costera', text: 'Huellas humanas de unos 13 000 años se conservaron en una isla de la costa de Columbia Británica.',
          why: 'Son los hallazgos de Calvert Island: muestran presencia humana temprana en la costa del Pacífico.' },
        { id: 'c6', zone: 'interior', text: 'Se proponía que cazadores de grandes animales avanzaron tierra adentro por un camino que debía tener pasto y fauna.',
          why: 'Es la idea del modelo clásico «Clovis primero»; las investigaciones recientes cuestionan su cronología.' },
        { id: 'c7', zone: 'beringia', text: 'Una estepa fría y seca, con mamuts y otros herbívoros, se extendía por esta región hoy bajo el mar de Bering.',
          why: 'Beringia era un paisaje terrestre amplio, no solo un «puente» estrecho.' }
      ],
      stages: [
        { id: 's1', order: 1, text: 'Salida desde el noreste de Asia hacia Beringia, siguiendo la fauna y los recursos.' },
        { id: 's2', order: 2, text: 'Permanencia prolongada en Beringia (estancamiento beringio), con aislamiento y adaptación al frío.' },
        { id: 's3', order: 3, text: 'Dispersión hacia el sur por la costa del Pacífico y/o por el corredor interior.' }
      ],
      orderWhy: 'La secuencia empieza en Asia, pasa por un largo periodo en Beringia y solo después se abre el avance hacia el sur.',
      hints: [
        'Piensa en el nivel del mar: ¿qué pasa con la tierra cuando el agua se convierte en hielo?',
        'Busca palabras clave en cada tarjeta: costa, algas, embarcaciones · pasillo, hielo, tierra adentro · puente, estepa, aislamiento.',
        'En el orden de las etapas, pregúntate: ¿dónde estaba la gente antes de poder bajar hacia el sur?'
      ]
    },
    level2: {
      axis: { from: 30000, to: 11000, ticks: [30000, 25000, 20000, 15000, 12000] },
      classes: { solida: 'Evidencia sólida', debate: 'Evidencia en debate' },
      evidence: [
        { id: 'e1', title: 'Monte Verde (Chile)', age: 14500, ageLabel: '≈ 14 500 años', row: 0, answer: 'solida',
          text: 'Restos de viviendas, herramientas y alimentos de unos 14 500 años.',
          why: 'Tras décadas de revisión, la comunidad científica aceptó el sitio; demostró presencia humana antes de Clovis.' },
        { id: 'e2', title: 'Puntas Clovis', age: 13000, ageLabel: '≈ 13 000 años', row: 1, answer: 'solida',
          text: 'Puntas de proyectil talladas, de unos 13 000 años, halladas en toda Norteamérica.',
          why: 'Son abundantes y bien datadas. Probaron una cultura extendida, pero no que fuera la primera.' },
        { id: 'e3', title: 'Genoma de Anzick-1', age: 12700, ageLabel: '≈ 12 700 años', row: 2, answer: 'solida',
          text: 'ADN de un niño enterrado hace unos 12 700 años (Montana, Estados Unidos).',
          why: 'Su genoma está emparentado con pueblos originarios actuales de América Central y del Sur; es evidencia genética directa.' },
        { id: 'e4', title: 'Cueva Chiquihuite (México)', age: 26500, ageLabel: 'más de 26 000 años', row: 0, answer: 'debate',
          text: 'Herramientas de piedra que algunos investigadores fechan en más de 26 000 años.',
          why: 'Otros especialistas dudan de que las piedras sean herramientas humanas y no fragmentos naturales; faltan más pruebas.' },
        { id: 'e5', title: 'Cuevas Bluefish (Yukón)', age: 24000, ageLabel: '≈ 24 000 años', row: 1, answer: 'debate',
          text: 'Un hueso de caballo con marcas, fechado hacia 24 000 años.',
          why: 'Algunos creen que las marcas son de origen humano; otros las atribuyen a causas naturales.' }
      ],
      periods: [
        { id: 'paleoindio', name: 'Paleoindio',  dates: 'hasta ~8000 a. C.',        trait: 'Grupos nómadas que cazaban, recolectaban y usaban puntas de proyectil.' },
        { id: 'arcaico',    name: 'Arcaico',     dates: '~8000 – 2000 a. C.',       trait: 'Se domestican plantas y aumenta la vida seminómada y estacional.' },
        { id: 'formativo',  name: 'Formativo',   dates: '~2000 a. C. – 250 d. C.',  trait: 'Aldeas agrícolas, cerámica y primeros centros ceremoniales.' },
        { id: 'clasico',    name: 'Clásico',     dates: '~250 – 900 d. C.',         trait: 'Grandes ciudades y Estados con arquitectura monumental.' },
        { id: 'posclasico', name: 'Posclásico',  dates: '~900 – 1521 d. C.',        trait: 'Mayor militarismo, comercio y expansión de grandes imperios.' }
      ],
      periodNote: 'Esta periodificación es la clásica de Mesoamérica; en los Andes se usan otros nombres (Precerámico, Horizontes). Las fechas varían según la región.',
      orderWhy: 'Los periodos avanzan desde grupos nómadas (Paleoindio) hacia sociedades con agricultura, ciudades y, al final, grandes imperios (Posclásico).',
      hints: [
        'Las evidencias sólidas tienen muchos hallazgos o varias pruebas independientes que coinciden.',
        'Una evidencia en debate suele tener un solo sitio o interpretaciones enfrentadas entre especialistas.',
        'En los periodos, sigue la pista de los cambios: nomadismo → plantas → aldeas → ciudades → imperios.'
      ]
    },
    level3: {
      minEvidence: 3,
      evidence: [
        { id: 'A', title: 'Huellas de White Sands (Nuevo México)', age: 'unos 21 000–23 000 años', supports: true,
          text: 'Huellas humanas datadas con varios métodos independientes. Sugieren presencia humana durante el máximo glacial; su antigüedad extrema mantiene cierto debate.',
          note: 'Sugiere presencia humana durante el máximo glacial, mucho antes de Clovis.' },
        { id: 'B', title: 'Monte Verde (Chile)', age: 'unos 14 500 años', supports: true,
          text: 'Sitio con viviendas, herramientas y alimentos. Muestra presencia humana temprana en el extremo sur de América.',
          note: 'Presencia humana en el sur antes de que el corredor interior estuviera abierto.' },
        { id: 'C', title: 'Estudios del corredor libre de hielo', age: 'habitable hace unos 12 600 años', supports: true,
          text: 'Sedimentos y ADN ambiental indican que el corredor entre los glaciares no fue habitable hasta unos 12 600 años atrás.',
          note: 'Si el corredor no era habitable tan temprano, la ruta interior difícilmente fue la primera vía hacia el sur.' },
        { id: 'D', title: 'ADN antiguo (Anzick-1 y un genoma de Alaska)', age: 'unos 12 700 y 11 500 años', supports: true,
          text: 'Los genomas indican un origen común en una población que se separó de grupos asiáticos y se aisló en Beringia.',
          note: 'Apoya un origen común en una población aislada en Beringia.' },
        { id: 'E', title: 'Huellas de Calvert Island (Columbia Británica)', age: 'unos 13 000 años', supports: true,
          text: 'Huellas humanas conservadas en una isla de la costa del Pacífico de Canadá.',
          note: 'Muestra presencia humana en la costa del Pacífico, lo que apoya la ruta costera.' },
        { id: 'F', title: 'Puntas Clovis', age: 'unos 13 000 años', supports: false,
          text: 'Puntas de proyectil talladas, muy extendidas por Norteamérica, de una cultura bien datada.',
          note: 'Muestra una cultura muy extendida, pero más reciente que otros sitios; no prueba que fueran los primeros.' }
      ],
      models: [
        { id: 'a', title: 'Clovis primero', text: 'Los primeros pobladores llegaron hace unos 13 000 años por la ruta interior.',
          why: 'Existen sitios más antiguos que Clovis, como Monte Verde, y el corredor interior no era transitable tan temprano.' },
        { id: 'b', title: 'Poblamiento anterior a Clovis', text: 'Grupos originados en Beringia llegaron antes de Clovis, probablemente por la costa del Pacífico.',
          why: 'Reúne la mayor cantidad de evidencias: sitios anteriores a Clovis, un corredor interior cerrado al principio y hallazgos costeros. Aun así, quedan dudas abiertas.' },
        { id: 'c', title: 'Llegada reciente', text: 'Los primeros grupos llegaron hace menos de 13 000 años.',
          why: 'Contradice sitios bien datados como Monte Verde (unos 14 500 años).' }
      ],
      bestModel: 'b',
      map: {
        points: [
          { id: 'beringia', name: 'Beringia', x: 52, y: 44 },
          { id: 'norteamerica', name: 'Norteamérica', x: 170, y: 150 },
          { id: 'mesoamerica', name: 'Mesoamérica', x: 168, y: 288 },
          { id: 'andes', name: 'Los Andes', x: 222, y: 420 }
        ],
        order: ['beringia', 'norteamerica', 'mesoamerica', 'andes'],
        why: 'La dispersión avanzó de norte a sur: desde Beringia, por Norteamérica, hasta Mesoamérica y luego los Andes.'
      },
      rubric: [
        { id: 'uso',    name: 'Uso de evidencias' },
        { id: 'modelo', name: 'Modelo mejor respaldado' },
        { id: 'dudas',  name: 'Dudas científicas abiertas' },
        { id: 'claro',  name: 'Claridad y estructura' }
      ],
      hints: [
        'Pregunta clave: ¿qué evidencias son anteriores a la apertura del corredor interior?',
        'Un buen dictamen cita evidencias, elige un modelo y admite lo que aún no sabemos.',
        'Recuerda mencionar hacia dónde se dispersaron los grupos: Mesoamérica y los Andes.'
      ]
    }
  },

  // Mensajes provisionales de Kuntur (Bloque 7 los sustituirá por reglas + Gemini)
  kunturWelcome: '¡Bienvenido/a, cronista! Soy <b>Kuntur</b>. Juntos reconstruiremos el Mapa de la Gran Travesía. Empieza por el Nivel 1.',
  kunturLocked: 'Este nivel sigue bloqueado. Necesitas al menos <b>70 PE</b> en el nivel anterior.',
  kunturSoon: 'Este nivel se activará en uno de los próximos bloques de desarrollo.'
};