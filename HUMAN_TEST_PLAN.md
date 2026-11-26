# Plan de prueba humana — Adaptive Language Tutor

**Objetivo:** validar la experiencia completa antes de declarar la aplicación lista para pruebas más amplias. Ejecutar con datos ficticios; nunca introducir información personal.

## 1. Preparación

1. Clonar el repositorio y usar la rama `feature/mobile-bottom-navigation`.
2. Ejecutar `npm ci` y `npm run check`.
3. Para probar el modo local, iniciar con `npm run dev` sin credenciales IA.
4. Para probar el tutor real, configurar un archivo local `.env` con `AI_PROVIDER`, `AI_API_KEY` y `AI_MODEL`; no subirlo a Git.
5. Iniciar la aplicación y comprobar que el estado de salud indica si el proveedor está configurado.

## 2. Modo local sin proveedor IA

- [ ] La aplicación permite comenzar una sesión sin conexión a Gemini.
- [ ] Portugués brasileño e inglés cargan actividades y opciones coherentes.
- [ ] Las respuestas correctas, incorrectas y escritas actualizan el progreso.
- [ ] Las pistas no revelan directamente la respuesta.
- [ ] El resumen refleja turnos, precisión, rachas y vocabulario.
- [ ] El repaso programado conserva la respuesta esperada y puede calificarse.
- [ ] Desactivar el audio no impide completar ninguna actividad.

## 3. Tutor IA y multilingüismo

Probar al menos dos idiomas con proveedor real:

- [ ] Portugués brasileño: locale `pt-BR`.
- [ ] Francés personalizado: locale `fr-FR`.
- [ ] Inglés del catálogo local: locale `en`; evaluar naturalidad, corrección, vocabulario y situaciones reales.
- [ ] Verificar que el idioma y locale elegidos llegan al tutor y se conservan en el resumen.
- [ ] Completar una sesión de al menos tres respuestas.
- [ ] Probar respuestas correctas, parciales, incorrectas y conversacionales.
- [ ] Comprobar que el tutor evalúa la respuesta anterior antes de proponer la siguiente actividad.
- [ ] Confirmar que la sesión no termina antes de la duración configurada.
- [ ] Solicitar pistas y comprobar que no se crea una actividad nueva ni se incrementa el turno.
- [ ] Provocar un error transitorio de red/proveedor y comprobar que el reintento no envía solicitudes duplicadas.
- [ ] Ante un error del proveedor, comprobar que la interfaz muestra un mensaje genérico sin detalles técnicos internos ni contenido de la respuesta upstream.
- [ ] Finalizar la sesión, revisar el resumen, recargar la página y confirmar persistencia.
- [ ] Exportar el progreso y comprobar que el archivo JSON se descarga y contiene la sesión.

## 4. Audio y pronunciación

Realizar estas comprobaciones en un navegador de escritorio y en un teléfono real:

- [ ] El audio automático comienza tras una acción explícita del usuario.
- [ ] El control global activa y desactiva la lectura; el estado se conserva al recargar.
- [ ] Desactivar el audio cancela la locución en curso.
- [ ] Solicitar una pista o enviar una respuesta mientras hay audio en curso detiene inmediatamente la locución anterior, sin esperar la respuesta del servidor.
- [ ] Si una solicitud IA falla, no continúa reproduciéndose audio de la actividad anterior.
- [ ] Reactivar el audio lee los fragmentos visibles del idioma objetivo, también en el panel de resumen.
- [ ] Al cambiar entre resumen, lección y otras vistas, reactivar el audio no debe leer fragmentos de paneles ocultos.
- [ ] La primera pista IA pronuncia automáticamente los fragmentos del idioma objetivo incluidos en la pista; la pista adicional también los reproduce.
- [ ] En los ejercicios locales, las pistas y explicaciones pronuncian únicamente los fragmentos del idioma objetivo anotados para ese contenido, sin leer la frase explicativa completa en español.
- [ ] Si solo existe una voz genérica del idioma (por ejemplo, `pt` sin variante regional), comprobar que se utiliza como fallback antes de recurrir a la voz predeterminada.
- [ ] Los fragmentos de portugués usan `pt-BR`; los de francés usan `fr-FR`.
- [ ] Los fragmentos del catálogo inglés usan locale `en` y seleccionan una voz inglesa compatible instalada en el dispositivo.
- [ ] Los botones individuales reproducen solo su fragmento y permiten repetirlo.
- [ ] El vocabulario del resumen se lee en el idioma objetivo y puede repetirse manualmente.
- [ ] Cambiar de turno, iniciar otra sesión o entrar al repaso detiene la locución anterior.
- [ ] Al avanzar entre tarjetas del repaso espaciado, no continúa la pronunciación de la tarjeta anterior.
- [ ] Si el sistema no tiene una voz compatible, la práctica escrita sigue funcionando y la interfaz informa el fallback.
- [ ] Comprobar que no se pronuncian por error las explicaciones auxiliares en español como si fueran texto objetivo.

**Importante:** la disponibilidad y calidad de las voces dependen del navegador y del sistema operativo. Las pruebas simuladas de CI no sustituyen esta comprobación auditiva.

## 5. Persistencia, repaso y exportación

- [ ] Cerrar una sesión y confirmar que aparece en el historial.
- [ ] Recargar y comprobar que sesiones, vocabulario, patrones y tarjetas siguen presentes.
- [ ] Calificar una tarjeta de repaso y confirmar que cambia su programación.
- [ ] Verificar que una conversación libre sin respuesta única no se convierte en una tarjeta imposible de calificar.
- [ ] Exportar progreso y comprobar que el JSON se puede abrir y contiene datos coherentes.

## 6. Seguridad básica

- [ ] Solicitar `/.env`, `/package.json`, `/server/provider.js` y `/tests/api.test.js`; todas deben devolver 404.
- [ ] Confirmar las cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- [ ] Confirmar que no aparecen claves API, respuestas completas del alumno ni historiales privados en la consola del servidor.
- [ ] Probar mensajes largos y solicitudes repetidas sin que la aplicación se bloquee.

## 7. Registro de resultados

Para cada escenario registrar:

| Campo | Resultado |
|---|---|
| Dispositivo y navegador | |
| Idioma y locale | |
| Escenario | |
| Resultado (aprobado / fallido) | |
| Pasos para reproducir | |
| Captura o log sin datos personales | |
| Severidad (bloqueante / alta / media / baja) | |

**Criterio de salida:** no declarar lista para prueba humana amplia mientras falle un flujo principal, no se confirme persistencia/exportación, o la lectura del idioma objetivo no se haya escuchado y verificado en al menos un dispositivo real.


## 8. Nueva navegación y experiencia móvil — requisitos vigentes 18-11-2026

- [ ] La barra inferior contiene exactamente cuatro accesos: Ruta, Ejercicios, Teoría y Estadísticas.
- [ ] La barra muestra iconos sin etiquetas visibles; el seleccionado se distingue sutilmente.
- [ ] El título de la sección aparece dentro de su pantalla.
- [ ] Ruta es la pantalla inicial y no muestra métricas ni panel de progreso.
- [ ] No existe acceso/sección Configuración; idioma y audio están en la cabecera de las pantallas normales.
- [ ] El selector de idioma permite cambiar el idioma sin perder el audio ni dejar estado de la actividad anterior.
- [ ] El icono de audio refleja visualmente el estado activado/desactivado (desactivado con diagonal roja o X gris).
- [ ] Ejercicios ofrece Global y Repaso como dos opciones claras.
- [ ] Después de elegir Global o Repaso aparece la preparación de duración, nivel y tema.
- [ ] La primera actividad comienza directamente en el nivel elegido; no aparece test ni pregunta diagnóstica inicial.
- [ ] La sesión ocupa la pantalla completa y oculta barra inferior y selector Global/Repaso.
- [ ] Durante la sesión solo quedan visibles X y audio, ambos icon-only.
- [ ] El audio conserva el estado al entrar/salir de sesión.
- [ ] Al pulsar X aparece confirmación. Cancelar mantiene intacta la sesión.
- [ ] Confirmar X descarta solo la sesión actual: no guarda respuestas parciales, métricas ni tarjetas de repaso. El historial previo permanece.
- [ ] Cambiar de sección, idioma o modalidad no reutiliza preguntas, historial, pistas ni solicitudes pendientes de la actividad anterior.
- [ ] Una respuesta IA lenta muestra estado de espera y no bloquea indefinidamente; timeout/error permite reintentar o continuar en modo local.
- [ ] Al fallar IA se puede salir de la sesión y navegar con normalidad.
- [ ] Teoría abre contenido de consulta sin iniciar una sesión automáticamente.
- [ ] Estadísticas es el único apartado con métricas e historial.
- [ ] No aparecen subtítulos redundantes, pie “Language Tutor” ni texto de relleno.
- [ ] En móvil no hay scroll horizontal, controles cortados ni solapamiento con la barra inferior o las áreas seguras del dispositivo.

**Criterio de salida:** todos los flujos anteriores deben aprobarse en viewport móvil y en un teléfono real antes de considerar completada esta revisión de experiencia. La especificación completa está en [README.md](README.md).


## 9. Refinamientos de interfaz móvil — 18-11-2026

- [ ] Primera apertura: aparece bienvenida con título grande y botón Iniciar.
- [ ] Pulsar Iniciar sin idioma guardado abre el mosaico; seleccionar portugués muestra 🇧🇷 y lleva a Ruta.
- [ ] Seleccionar inglés muestra 🇺🇸; cerrar y reabrir el navegador conserva la selección.
- [ ] El selector central del menú inferior muestra globo y bandera; al cambiar idioma vuelve a Ruta.
- [ ] Confirmar que las cinco posiciones inferiores son mapa, pesas, selector central, libro y gráfico, sin etiquetas textuales en los cuatro accesos de sección.
- [ ] En Ejercicios, Global/Repaso y cantidad/nivel/tema están visibles juntos; cambiar de opción no navega a otra pantalla.
- [ ] La cantidad seleccionada se interpreta como preguntas (por ejemplo, 5 preguntas produce cinco turnos, no diez).
- [ ] Estadísticas muestra datos reales cuando existen sesiones y un estado vacío cuando no hay historial.
- [ ] Teoría muestra temas y explicaciones dentro de cada categoría, en pt-BR e inglés.
- [ ] El audio sigue activado/desactivado al cambiar de sesión y al recargar la aplicación; comprobar controles de audio en pistas y correcciones.
- [ ] Revisar selector, mosaico, áreas táctiles, barra inferior y diálogos en Android real.
- [ ] Ruta aún está pendiente: no evaluar como completa hasta que tenga unidades, hitos, guardado parcial y recuperación al volver a abrir.

- [ ] Después de completar o descartar una sesión, volver a Ejercicios y confirmar que Global/Repaso, cantidad, nivel y tema siguen visibles y utilizables.


## 10. Revisión pedagógica y de idiomas — 18-11-2026

- [ ] Bienvenida desaparece inmediatamente al pulsar Iniciar; en siguientes aperturas con idioma guardado no vuelve a aparecer.
- [ ] El mosaico contiene los 23 idiomas estándar; la opción Otro idioma solicita solo nombre y nunca locale. Verificar que Suajili infiere 🇰🇪.
- [ ] Cambiar idioma actualiza bandera y regresa automáticamente a Ruta.
- [ ] Italiano, alemán, ruso, francés y otros idiomas muestran su bandera y locale interno correcto en solicitudes IA/TTS.
- [ ] Teoría: seleccionar categoría abre lista de temas legible; seleccionar tema abre diapositiva completa.
- [ ] En cada diapositiva, anterior/siguiente cambia el tema y el contador; primera/última diapositiva deshabilitan la flecha que no corresponde.
- [ ] Verificar ejemplos y pronombres en el idioma elegido; no mostrar ejemplos de otra lengua como equivalentes.
- [ ] En ejercicios de cualquier nivel, las tres primeras preguntas muestran tres alternativas y la cuarta solicita escritura.
- [ ] Tras responder, se avanza automáticamente; el feedback aparece neutral en la siguiente pregunta, con respuesta modelo y botón de pronunciación.
- [ ] Comprobar que las variantes “color/colour” abren una explicación emergente al tocar la palabra cuando el contenido inglés las incluye.
- [ ] Ruta guarda cada respuesta confirmada tanto en modo local como IA; cerrar, recargar y continuar retoma el número de pregunta y el contexto conversacional.
- [ ] Ruta requiere 8/10 en la comprobación de diez ejercicios y después una actividad integradora.
- [ ] Ejercicios descarta una sesión incompleta y no la agrega al historial.
- [ ] La última corrección aparece en el resumen y conserva su control de audio.

## 8. Feedback y teoría — revisión 18-11-2026

- [ ] Con un idioma guardado, recargar la app y comprobar que la bienvenida sigue visible hasta pulsar Iniciar.
- [ ] Responder una alternativa incorrecta: la pregunta no cambia, la alternativa correcta queda verde y la seleccionada roja; aparece explicación y botón Continuar.
- [ ] Responder correctamente: aparece Correcto, no se muestra explicación adicional y solo se avanza al pulsar Continuar.
- [ ] En preguntas escritas, el feedback también permanece en la pregunta actual hasta Continuar.
- [ ] El audio reproduce la frase completa de la pregunta; en una pregunta de recuerdo con hueco se oye la frase con pausa y no la palabra omitida.
- [ ] Los ejercicios de comprensión auditiva/traducción usan `speechText` y reproducen la frase completa en el idioma objetivo, sin revelar el texto de respuesta.
- [ ] No aparecen rótulos ni listados de texto “Pronunciación” o “Vocabulario” en el ejercicio IA; los controles de audio siguen disponibles.
- [ ] Teoría muestra pronombres en tabla de dos columnas, traducción al español y botón de pronunciación por pronombre.
- [ ] Ser/estar, presente, pasado y futuro muestran formas conjugadas, frases de ejemplo y reglas/excepciones del idioma seleccionado.
- [ ] Al volver a una sección, se muestra su pantalla inicial y no el subtema/diapositiva anterior.
- [ ] Ruta conserva la respuesta pendiente y su feedback al cerrar, recargar y reanudar.



## 11. Validación de correcciones — 18-11-2026

- [ ] Primera pulsación de Ruta inicia el recorrido y guarda el borrador inicial antes de contestar.
- [ ] Tras iniciar, el mismo banner cambia a **Continuar recorrido**; no aparece un segundo botón para iniciar ni se reinicia el progreso.
- [ ] Cerrar y recargar conserva el número de pregunta, el estado de respuesta pendiente y el botón Continuar.
- [ ] Las preguntas IA no muestran comentarios introductorios grises encima de la consigna.
- [ ] Probar al menos tres preguntas con instrucción en español + frase objetivo: el audio lee el segmento correcto en el locale objetivo, sin leer la instrucción en español.
- [ ] Probar un hueco escrito con un solo guion bajo y otro con varios: el audio hace una pausa y nunca verbaliza “guion bajo”.
- [ ] Probar una pregunta de texto libre: al enviar, desaparece el botón Enviar respuesta; queda el feedback y luego Continuar.
- [ ] Las preguntas de texto libre tienen una respuesta modelo verificable; no se admiten preferencias o conversación abierta sin contexto.
- [ ] Completar una sesión con al menos un error: el error concreto aparece inmediatamente en Repaso tras finalizar y persistir la sesión.
- [ ] Calificar el error en Repaso: el intervalo siguiente se actualiza; si se falla, vuelve al intervalo inicial.
- [ ] Teoría italiana: comprobar artículos definidos/indefinidos, *passato prossimo* con avere/essere, concordancia del participio, futuro simple, vocabulario y expresiones con audio y traducción.

## 12. Funcionalidades futuras — criterios antes de implementar

- [ ] Comprensión lectora: textos adecuados al nivel, de dominio público/licencia abierta verificada o redactados originalmente; mostrar fuente y atribución.
- [ ] Las preguntas se responden con evidencia del texto y tienen una respuesta delimitada.
- [ ] Audio cultural por bandera: verificar derechos de la grabación específica, no solo de la composición; duración objetivo de 1–2 segundos.
- [ ] Si no existe un audio inequívocamente reutilizable para un país/idioma, usar un recurso original/licenciado o no reproducir clip.


## 13. Estado de validación automatizada — 18-11-2026

- [x] Comprobación estática y tests unitarios: GitHub Actions run [44424442155](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44424442155).
- [x] Browser E2E: GitHub Actions run [44424442327](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44424442327).
- [x] Preview Render: deploy `dep-dbv3kuhsrm7s73bap9n0`, estado `live`, código `32673f0`.
- [ ] Prueba auditiva y visual en Android real; confirmar voces disponibles, pronunciación mixta y pausas en los huecos.

## 14. Validación de la iteración funcional — 18-11-2026

- [ ] En ejercicios IA, al enviar una respuesta aparece feedback antes de que termine de generarse la siguiente pregunta.
- [ ] Una respuesta exacta o incluida en `acceptedAnswers` se marca correcta.
- [ ] Una respuesta con un error tipográfico de un carácter en un término de al menos cuatro letras se acepta solo cuando el ejercicio habilita esa tolerancia.
- [ ] Una respuesta semánticamente incorrecta no se marca correcta por ser una frase gramatical.
- [ ] Probar variantes válidas no incluidas inicialmente en `acceptedAnswers`; registrar cualquier falso negativo para ampliar las variantes de forma explícita.
- [ ] Comprobar que algunas consignas de inglés y portugués están formuladas en el idioma objetivo y se entienden por el nivel.
- [ ] En Ruta, seleccionar un tema con pocas preguntas y completar suficientes turnos: no debe repetirse ninguna pregunta ya respondida; al agotarse el catálogo, debe finalizar sin repetir.
- [ ] El hito integrador solicita traducir una frase delimitada y acepta las variantes válidas y errores tipográficos pequeños, sin permitir respuestas abiertas.
- [ ] El resumen presenta únicamente el título Resumen y los subtítulos Aciertos, Errores, Vocabulario y Temas.
- [ ] Aciertos aparece en verde y errores en rojo; los errores muestran respuesta enviada y solución esperada.
- [ ] Vocabulario muestra solo palabras en el idioma objetivo, sin traducciones en línea.
- [ ] En una consigna, alternativa, corrección y vocabulario, tocar una palabra muestra su traducción cuando está registrada.
- [ ] Estadísticas integra todos los idiomas con actividad en una tabla: sesiones, palabras, precisión y progreso de Ruta.
- [ ] El gráfico muestra evolución diaria (no por sesión), con una línea y color por idioma y leyenda lateral.
- [ ] Probar estadísticas con varios idiomas, varios días, más de una sesión en un mismo día y días sin actividad.
- [ ] En Android, comprobar que la tabla se puede desplazar horizontalmente sin deformar la pantalla y que la leyenda del gráfico sigue siendo legible.

- [ ] Teoría inglés y portugués brasileño: comprobar las tablas de artículos y los cinco subtemas de vocabulario y expresiones, con traducción y audio.
- [ ] Teoría francés y alemán: comprobar las tablas de artículos, ejemplos y reglas de uso.
- [ ] Revisar uno por uno los idiomas restantes: ningún subtema debe quedarse en descripciones genéricas; cada uno debe mostrar contenido aplicado, traducción y contexto.

- [ ] Seleccionar una palabra con traducción ya registrada: debe aparecer sin demora.
- [ ] Seleccionar una palabra sin traducción registrada con IA configurada: debe mostrar el significado contextual y conservarlo mientras permanezca visible.
- [ ] Probar la selección sin proveedor IA: la práctica no debe bloquearse y debe informar que la traducción no está disponible.

- [ ] Verificar que el resumen no muestre un encabezado adicional encima de «Resumen».
- [ ] En Android, probar la consulta contextual por palabra y esperar la traducción final (no solo el indicador de carga).

- [ ] Dentro de una alternativa, tocar una palabra muestra su traducción sin seleccionar la respuesta; tocar el resto de la tarjeta sí selecciona la alternativa.

- [ ] En las consignas locales marcadas en idioma objetivo, seleccionar palabras muestra traducción; las consignas de apoyo en español no deben tratarse como texto objetivo.

- [ ] Confirmar que cada acierto se resalta en verde y cada respuesta errónea en rojo, incluida la respuesta modelo.

- [ ] Probar selección de palabras en chino, japonés o tailandés: cada unidad léxica debe ser seleccionable por separado y mostrar traducción contextual.

- [ ] Confirmar que no aparece texto de estado adicional debajo del resumen; solo el contenido y el botón de navegación.

- [ ] Confirmar que una respuesta en idioma equivocado no se marca correcta aunque el proveedor IA devuelva estado correct.

- [ ] Añadir más de ocho idiomas con actividad y comprobar que cada línea y entrada de leyenda mantiene un color distinto.

- [ ] Verificar que la app inicia sin errores de navegador antes de probar el resto del flujo.

**Preview disponible para prueba humana:** https://adaptive-language-tutor-preview-5b3d.onrender.com/  
**Commit:** `459e10c46861aa31a344db1e14b424bdfee2ccad`  
- [ ] Prueba humana Android de la iteración completa.


## Android — iteración de estadísticas, ejercicios y repaso

- [ ] En Estadísticas, abrir el selector y comprobar 🌐 Global con barras por idioma y línea punteada de precisión promedio.
- [ ] Elegir cada idioma y comprobar dos series: preguntas respondidas y precisión por día practicado.
- [ ] Confirmar que el eje horizontal muestra Día 1…Día 15, solo días practicados, sin fechas.
- [ ] Comprobar que la tabla comparativa sigue mostrando sesiones, palabras, precisión y progreso de Ruta.
- [ ] En Ejercicios, comprobar que la instrucción está en español y separada de la frase/pregunta que se evalúa.
- [ ] Pulsar palabras en consignas, opciones, correcciones y vocabulario: no debe aparecer una traducción emergente.
- [ ] Al finalizar una sesión, verificar Aciertos n/total y Errores n/total; los errores deben conservar respuesta y solución.
- [ ] En Repaso, responder una palabra incorrectamente y salir/completar el repaso: debe seguir pendiente.
- [ ] Responder correctamente esa palabra en otra sesión de repaso: debe dejar de aparecer como pendiente y pasar al siguiente intervalo.

## Android — refinamiento de estadísticas, feedback y Ruta — 19-11-2026

- [ ] En Estadísticas, abrir vista por idioma: el gráfico debe ocupar más espacio, con puntos y textos legibles; en móvil se puede desplazar horizontalmente sin encoger el contenido.
- [ ] Confirmar que el eje horizontal muestra «Días» una sola vez y debajo solo 1, 2, 3… hasta 15.
- [ ] En vista Global, comprobar que las barras y sus valores son claramente legibles y que la línea punteada del promedio no tapa los valores.
- [ ] En Ejercicios IA, enviar una respuesta y comprobar que «Continuar» aparece inmediatamente; mientras el tutor prepara el siguiente turno permanece deshabilitado y luego se habilita.
- [ ] Provocar una respuesta incorrecta y comprobar que el feedback permanece «Incorrecto», sin que un mensaje posterior muestre «¡Muy bien!» ni otro elogio incompatible.
- [ ] Después de avanzar, confirmar que no aparece el bloque gris con el feedback/respuesta de la pregunta anterior encima de la nueva consigna.
- [ ] En Ruta portugués, completar los diez ejercicios hasta el hito integrador y responder incorrectamente: debe conservar la misma pregunta y entregar pistas progresivas en español.
- [ ] Repetir intentos: cada error debe ofrecer la pista siguiente, sin borrar la respuesta ni reiniciar el nivel de pista al cerrar y reanudar Ruta.
- [ ] Confirmar que el icono de Ruta representa un mapa con recorrido punteado y destino marcado; comprobar su legibilidad en la barra inferior.
- [ ] En Teoría, registrar idioma, categoría y tema de cada explicación incompleta para la siguiente auditoría pedagógica; comprobar reglas, excepciones, tablas, ejemplos traducidos y audio.

- [ ] En el hito integrador de Ruta, probar tanto el botón «Pista» como los intentos incorrectos: ambos deben avanzar una sola vez por la secuencia 1/5…5/5.
- [ ] Confirmar que la consigna del hito integrador se explica en español y no aparece en portugués como imperativo.

- [ ] En una respuesta IA, tocar «Continuar» antes de que termine la preparación: el botón debe indicar que está continuando y la siguiente pregunta debe aparecer al completarse la solicitud, sin doble avance.

- [ ] En el hito integrador, confirmar que «Pista» está visible y operativo; no debe aparecer el control «Repasar error» en esa pantalla.


## Preview desplegado — 19-11-2026

- Preview: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Deploy LIVE: `dep-dbv7ee3rjlhs73b4lr9g` — commit `33db475`.
- La validación automatizada pasó; queda la comprobación humana en Android de los puntos listados arriba.

## Refinamiento UI/audio/teoría — prueba Android
- [ ] Confirmar que ya no aparece el aviso «No hay una voz instalada…» y que la práctica no queda bloqueada si el dispositivo carece de una voz exacta.
- [ ] Confirmar que el contenido sube, los títulos de sección quedan centrados y no se superponen con el control de audio.
- [ ] Estadísticas globales y por idioma: comprobar que los gráficos caben dentro de los márgenes sin scroll lateral y conservan legibilidad.
- [ ] Ejercicios: comprobar que el modo se llama «Práctica» y que en Repaso solo queda el control para comenzar; no deben aparecer nivel, cantidad ni tema.
- [ ] En un ejercicio mixto, comprobar que la consigna se lee en español y la frase objetivo en el idioma estudiado.
- [ ] En una respuesta escrita, solicitar las tres pistas y comprobar progresión; la tercera debe ofrecer una guía clara.
- [ ] Portugués: revisar Pasado y Futuro, tablas para eu/tu/você/ele/ela/nós/a gente/vocês/eles/elas, ejemplos y excepciones.
- [ ] Notar si alguna conjugación, traducción o ejemplo necesita corrección regional/contextual.

- [ ] Con portugués o inglés y una sesión de 5/10 preguntas, comprobar que se inicia como «Práctica local» y que las respuestas no esperan una evaluación IA remota.

## Preview de esta iteración
- URL: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Commit desplegado: d41a7cb532c02cb90153e41b877dfeaf5ba212e2.
- Deploy LIVE: dep-dbviiv60tbcc738k7o2g.
- Tests unitarios y Browser E2E aprobados: [44570968240](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570968240) · [44570968307](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570968307).
- Completar los checks Android de arriba; prestar atención al tamaño real de los gráficos y la pronunciación del sistema del dispositivo.


## Ruta por unidades y puntuación — prueba Android 19-11-2026

- [ ] En portugués o inglés, abrir Ruta y comprobar las cuatro unidades: Fundamentos, Viajes y orientación, Comida y restaurantes, Trabajo y estudios.
- [ ] Confirmar que solo Fundamentos está disponible al iniciar y que las unidades posteriores aparecen bloqueadas.
- [ ] Completar Fundamentos con un resultado de al menos 3 estrellas y comprobar que se desbloquea Viajes y orientación.
- [ ] Completar Viajes con menos de 5 estrellas y comprobar que Comida y restaurantes sigue bloqueada.
- [ ] Repetir Viajes hasta obtener 5 estrellas y confirmar que Comida y restaurantes se desbloquea. Este requisito es deliberadamente más estricto.
- [ ] Comprobar que Trabajo y estudios exige al menos 3 estrellas en Comida y restaurantes (el umbral debe ser alcanzable con las tres actividades actuales).
- [ ] En cada unidad, verificar el orden: vocabulario/conjugaciones → aplicación en contexto → frases completas. Las primeras etapas usan alternativas; la etapa final exige escribir.
- [ ] Cerrar Ruta después de responder una pregunta, volver a abrir y confirmar que continúa en la misma unidad y turno.
- [ ] Completar una unidad, revisar el porcentaje y las estrellas guardadas en su tarjeta.
- [ ] Repetir una unidad completada y comprobar que se puede mejorar su puntaje.
- [ ] Repetir una unidad con un resultado inferior y confirmar que conserva las estrellas del mejor intento y no vuelve a bloquear las unidades ya desbloqueadas.
- [ ] Pulsar Reiniciar ruta: aparece confirmación. Cancelar conserva las estrellas; confirmar borra solo el avance de Ruta del idioma activo.
- [ ] Tras reiniciar, confirmar que vuelve a quedar disponible solo la primera unidad y que el historial/estadísticas de Ejercicios se conserva.
- [ ] En un idioma no local con tutor IA, comprobar que aparecen las cuatro unidades y que cada una genera contenido del tema correspondiente. Si IA no está configurada, la ruta debe indicar que está en preparación.

## Ejercicios y Repaso — prueba Android 19-11-2026

- [ ] En Ejercicios, comprobar que el banner “Ejercicio” está cerrado inicialmente.
- [ ] Pulsarlo y verificar que se despliegan duración, nivel y tema; pulsarlo otra vez debe cerrar la configuración.
- [ ] Comprobar que “Repaso” está debajo y al tocarlo inicia inmediatamente, sin botón intermedio “Comenzar repaso”.
- [ ] Si no hay tarjetas pendientes, comprobar que aparece un mensaje claro y que no se abre una sesión vacía.
- [ ] En una pregunta de alternativas, verificar que no aparece el botón Pista.
- [ ] En una respuesta escrita, comprobar que la primera pulsación muestra una pista y el botón pasa a “Ver respuesta”; la segunda muestra la solución y oculta el botón.
- [ ] En Repaso, comprobar que una actividad originalmente de alternativas sigue usando alternativas y no muestra pistas.
- [ ] En Repaso escrito, comprobar la misma secuencia Pista → Ver respuesta.
- [ ] Comprobar que una respuesta errónea de Repaso sigue pendiente hasta responderla correctamente.

## Resumen, gráficos e imágenes — prueba Android 19-11-2026

- [ ] Al finalizar una sesión, comprobar que “Resumen” está centrado.
- [ ] Debajo del título, comprobar porcentaje y mensaje: 100% Perfecto; más de 80% Muy bien; más de 60% Bien; 40–60% Vas progresando; menos de 40% Sigue practicando.
- [ ] Confirmar que ya no aparece el subtítulo separado “Aciertos”; los errores, vocabulario y temas siguen disponibles.
- [ ] En Estadísticas Global, comprobar que las barras son grandes y tienen menos espacio vacío entre sí.
- [ ] Confirmar que el gráfico sigue cabiendo dentro de los márgenes de la pantalla sin scroll horizontal.
- [ ] Abrir actividades de vocabulario, viaje, comida y trabajo: comprobar que cada una muestra un pictograma relacionado con el objeto/contexto y que no tapa la consigna ni las opciones.
- [ ] Revisar los pictogramas en Android real: legibilidad, proporción y compatibilidad con la fuente emoji del dispositivo.

**Nota:** el modo relato con personajes ficticios y las actividades de emparejar palabras quedan para una fase futura; no marcarlos como funcionalidades ya implementadas.


## Android — refinamiento de estadísticas, teoría y controles de práctica — 19-11-2026

- [ ] Estadísticas Global: comprobar que las barras son visiblemente más estrechas y mantienen proporción legible.
- [ ] Confirmar que no existe línea segmentada, etiqueta ni leyenda de promedio global.
- [ ] Teoría de artículos, pasado y futuro: verificar que las tablas aparecen primero, las reglas/excepciones quedan agrupadas en notas legibles y los ejemplos completos aparecen debajo.
- [ ] En Ejercicios, confirmar que desapareció «Repasar error» sin afectar la modalidad independiente Repaso.
- [ ] Verificar que el encabezado de tema/nivel queda a la izquierda del contador «Pregunta n / total».
- [ ] Confirmar que la etiqueta breve del tema sigue debajo del pictograma y que no se repite un segundo encabezado de tema/nivel debajo del icono.
- [ ] En portugués e inglés, comprobar que cada botón ▶ reproduce solo palabras/frases del idioma objetivo; las instrucciones en español y opciones en español no deben ofrecer reproducción manual.


## Revisión humana — iteración 20-11-2026

- [ ] Teoría: pasado y futuro muestran solo Pronombre y Forma verbal en la tabla.
- [ ] Teoría: ejemplos aparecen debajo de la tabla y solo ilustran algunas personas.
- [ ] Vocabulario: revisar días, meses, estaciones, partes del día y expresiones temporales.
- [ ] Vocabulario: revisar cardinales, ordinales y reglas de género/composición.
- [ ] Estadísticas: en móvil vertical (390 px de ancho aprox.), cada idioma tiene una barra horizontal de ancho completo, con nombre y porcentaje legibles, sin scroll horizontal.
- [ ] Comprensión lectora: probar texto A1, responder las tres preguntas y comprobar que el texto sigue visible.
- [ ] Comprensión lectora: probar texto A2, inferencia y vocabulario contextual.
- [ ] Repetir las pruebas de teoría y estadísticas en portugués; después realizar regresión en inglés.


## 9. Entrenamiento y comprensión lectora — actualización 20-11-2026

- [ ] La sección y su navegación muestran «Entrenamiento» (sin cambiar el comportamiento de Ruta, Teoría o Estadísticas).
- [ ] El TTS del pasaje reproduce en el locale objetivo, permite pausar y continuar desde el punto pausado.
- [ ] Si TTS no está soportado, el botón se deshabilita y la lectura/ejercicio sigue siendo utilizable.
- [ ] En Comprensión lectora, el banco no recicla preguntas dentro de la sesión; si se agotan las preguntas únicas antes de alcanzar la cantidad seleccionada, la sesión termina correctamente.
- [ ] A1 usa un texto breve; A2 presenta mayor profundidad y extensión razonable. Revisar scroll, legibilidad y que los controles no queden ocultos en Android.
- [ ] La última actividad de cada unidad de Ruta pide traducir una frase concreta; probar la respuesta canónica y cada variante declarada como aceptada.
- [ ] Gramática: en todos los temas que contienen reglas y excepciones, ambas aparecen en secciones separadas, con un punto por línea; los ejemplos siguen debajo de tablas/notas.

- [ ] En Entrenamiento normal, y en la última pregunta de práctica general tras una sesión lectora de 10 preguntas, la consigna final pide traducir una frase específica y reconoce las variantes declaradas para ese ejercicio.


## Regresión de correcciones móviles — 20-11-2026

- [ ] Ruta: completar la primera unidad con todas las respuestas correctas y verificar 100%, 5 estrellas y desbloqueo de la segunda unidad.
- [ ] Ruta: comprobar que el hito integrador no altera el denominador ni resta un acierto a la puntuación de las preguntas de la unidad.
- [ ] Estadísticas: comprobar barras globales en teléfono vertical; nombres largos, porcentajes y barras deben caber sin que el gráfico quede diminuto.
- [ ] Comprensión lectora: seleccionar 10 preguntas con un banco de seis y verificar que se presentan únicamente las seis preguntas únicas, cada una con su pasaje, sin repetición ni práctica general.
- [ ] TTS: reproducir manualmente una instrucción en español y un texto objetivo en portugués; confirmar que se usan voces/idiomas distintos y correctos en cada control.
- [ ] TTS: revisar audio automático, lectura del pasaje y botones de pronunciación en Ruta, Teoría y Entrenamiento.
- [ ] Teoría: revisar artículos, ser/estar, presente, pasado y futuro; reglas/excepciones deben quedar separadas y legibles en pantalla vertical.


## 11. Regresiones reportadas — 20-11-2026

- [ ] TTS: texto de instrucciones/preguntas en español no debe recibir botón ni reproducción con voz del idioma objetivo.
- [ ] TTS: los botones de pronunciación solo aparecen junto a fragmentos del idioma objetivo; comprobar ejercicios de traducción y escucha.
- [ ] TTS: comprobar locales mixtos dentro de una misma actividad y que nunca se reutilice una voz portuguesa para texto español.
- [ ] Ruta: responder la evaluación integradora con cada respuesta aceptada y verificar que se registre la unidad, puntuación y desbloqueo de la siguiente.
- [ ] Ruta: comprobar respuestas incorrectas, reintento y persistencia al recargar.
- [ ] Comprensión lectora: completar las seis preguntas disponibles y confirmar que ninguna pregunta se repite; al agotarse el banco, finalizar sin reciclar preguntas.
- [ ] Comprensión lectora: play/pause, reinicio desde el comienzo y desplazamiento con la barra de reproducción. La barra depende de los eventos de límite de palabra que soporte la voz del navegador.
- [ ] Todas las actividades: sonido diferenciado de correcto/incorrecto en ejercicios, comprensión, repaso y evaluación final de Ruta.
- [ ] Todas las sesiones: orden visual consistente: título del tema, icono/ilustración del tema y actividad.

## 12. Regresiones y criterios nuevos — 20-11-2026

- [ ] TTS portugués: una consigna escrita en español no debe pronunciarse con voz portuguesa.
- [ ] TTS inglés: una consigna escrita en español no debe pronunciarse con voz inglesa.
- [ ] TTS mixto: cuando el estímulo contiene español y frase objetivo, ambos se reproducen en su locale propio; los botones manuales se ofrecen solo para fragmentos del idioma objetivo.
- [ ] TTS sin voz objetivo instalada: no debe utilizarse la voz predeterminada del idioma origen.
- [ ] TTS manual: cada botón debe reproducir únicamente el fragmento al que pertenece y mostrar/usar su locale real.
- [ ] Teoría: revisar uno por uno todos los temas de Gramática, Vocabulario y Expresiones del portugués brasileño y del inglés.
- [ ] Teoría pasado: comprobar que tabla, reglas, excepciones y ejemplos son exclusivamente de pasado.
- [ ] Teoría futuro: comprobar que tabla, reglas, excepciones y ejemplos son exclusivamente de futuro.
- [ ] Teoría: verificar jerarquía visual, orden tabla → reglas → excepciones → ejemplos y ausencia de párrafos convertidos en listas sin sentido.
- [ ] Ruta: el resumen muestra solo estrellas y el único subtítulo «Reforzar:».
- [ ] Ruta: los elementos de refuerzo coinciden con los errores reales (palabra, habilidad o tema).
- [ ] Ruta: al completar una unidad con estrellas suficientes, el botón del resumen inicia inmediatamente la siguiente unidad.
- [ ] Ruta: si la unidad siguiente está bloqueada, el resumen permite volver a Ruta y no deja al usuario atrapado.
- [ ] Actividad: el contador aparece inmediatamente debajo de X/audio y el icono de tema inmediatamente debajo del contador.
- [ ] Actividad: comprobar jerarquía anterior en Ruta, Entrenamiento, Comprensión lectora y Repaso.
- [ ] Dificultad: mostrar Principiante · A1, Intermedio · B1 y Avanzado · C1 en selector y cabecera.
- [ ] Navegación: no existe selector de cambio de idioma ni opción «Otro idioma»/entrada de idioma personalizado después del inicio.
- [ ] Frontend: no mostrar mensajes de disponibilidad del tutor IA ni interfaces de texto generativo.
- [ ] Android: repetir toda la revisión en viewport real; la automatización no sustituye la prueba auditiva ni de legibilidad.


## 13. Estado de validación automática — 20-11-2026

- [x] `npm run check` aprobado.
- [x] `npm test` aprobado.
- [x] `npm run test:e2e` aprobado: TTS de dos locales, resumen y continuidad de Ruta, selector de idioma, orden de contador/icono, teoría pasado/futuro, lectura sin repetición y navegación móvil.
- [x] Render Preview desplegado y LIVE.
- [ ] Prueba humana en Android: comprobar voces es-CL y pt-BR instaladas, y que cada fragmento use la voz propia.
- [ ] Prueba humana en Android: revisar tamaños, espacios y orden visual en móvil real.
- [ ] Prueba humana: completar las cuatro unidades de Ruta, provocar errores y confirmar que «Reforzar» enumera los temas/palabras correctos.
- [ ] Prueba humana: lectura con seis preguntas únicas, reproducción, pausa, reanudación, reinicio y progreso.


## 14. Regresión solicitada — Ruta, jerarquía, flecha y TTS — 20-11-2026

- [x] Ruta: completar una unidad con 100% y comprobar 5 estrellas + «Perfecto» + acción que inicia la unidad siguiente (E2E).
- [ ] Ruta: completar con 80–99%, 60–79% y menos de 60%; comprobar correspondencia estrellas/valoración y umbrales de desbloqueo.
- [ ] Ruta: si no alcanza las estrellas requeridas, el resumen informa el umbral y permite repetir la unidad.
- [x] Ruta: comprobar que la unidad que aparece activa después de «Continuar» es la siguiente por ID y contenido, no solo que la vista de sesión siga visible (E2E).
- [x] Ruta: comprobar que el resumen nunca queda sin una acción funcional; la última unidad vuelve al mapa en lugar de reiniciarse (E2E).
- [x] Teoría: pasado portugués presenta «Irregulares frecuentes en pretérito perfeito» como categoría con verbos dependientes anidados (E2E).
- [x] Teoría: futuro presenta sus raíces irregulares bajo «En futuro simple» sin mezclar excepciones del pasado (E2E).
- [ ] Teoría: inspeccionar todos los temas con reglas compuestas y comprobar jerarquía primer nivel/subnivel, orden y sangría.
- [x] Navegación: flecha icon-only idéntica en lista de temas, detalle de teoría y sesión (E2E).
- [ ] Navegación: retroceder detiene cualquier audio pendiente o activo; en sesión conserva confirmación de descarte cuando corresponda.
- [x] TTS: abrir un tema de teoría inicia pronunciación del idioma objetivo; pulsar un altavoz reproduce el elemento correcto (E2E).
- [x] TTS: actividad IA pronuncia automáticamente el fragmento objetivo y permite reproducirlo manualmente (E2E); actividad local usa el mismo filtro por locale.
- [x] TTS: test unitario de carga diferida cuando `getVoices()` está vacío y posterior evento `voiceschanged`; [ ] comprobarlo también en Android real.
- [ ] TTS: cuando no existe voz compatible, no debe escucharse la voz española como sustitución.
- [ ] Repetir todo en Android real; E2E no sustituye esta comprobación.



### Automatización completada — 20-11-2026
- [x] `npm run check`, `npm test` y `npm run test:e2e` aprobados.
- [x] Preview Render LIVE en `dep-dc0749ss728c73clirf0`.
- [ ] Prueba humana Android y revisión pedagógica integral siguen pendientes.

### Regresión adicional — 20-11-2026

- [ ] Android: probar reproducción automática al abrir actividad y reproducción manual; comprobar que el motor del sistema utiliza el locale objetivo aunque Chrome no exponga un objeto Voice coincidente.
- [ ] Android: comprobar reintento tras `voiceschanged` y, si no se dispara, tras el fallback temporizado; confirmar audio audible, no solo ausencia de error.
- [ ] Android: verificar que una secuencia de varios fragmentos se reproduce completa y en orden.
- [ ] Ruta: iniciar «Inicio del viaje»; el capítulo 1 debe preguntar por vocabulario/reglas mediante consignas breves; desde el capítulo 2 deben aparecer frases y aplicación contextual con dificultad progresiva.
- [ ] Ruta: completar con 3 estrellas y verificar que la unidad siguiente aparece habilitada en el mapa y que el botón del resumen inicia esa unidad.
- [ ] Actividades: confirmar en Ruta, Entrenamiento, Comprensión y Repaso título a la izquierda, contador a la derecha, barra inmediatamente debajo y pictograma antes de la consigna.
- [ ] Resumen: cuando no haya errores ni patrones pendientes, confirmar que no aparece el subtítulo «Reforzar».
- [ ] Teoría: revisar tablas de terminaciones -AR/-ER/-IR, excepciones conjugadas y ejemplos con traducción entre paréntesis; comprobar scroll horizontal local sin desbordamiento de pantalla.

- [ ] Teoría: verificar que ejemplos de presente, pasado y futuro en otros idiomas también se presentan en tabla de pronombre/ejemplo y mantienen la traducción parentética en una segunda línea.

- [ ] Teoría: revisar la tabla de futuro simple irregular y verificar las siete conjugaciones (dizer, fazer, trazer, pôr, ter, vir y ser) en singular y plural.

- [ ] Ruta: comprobar que las preguntas del capítulo 2 avanzan de frases cortas a estructuras progresivamente más complejas.
- [ ] Teoría PT-BR: revisar las dos tablas de irregulares del pasado y la tabla de siete verbos irregulares del futuro; verificar formas de todas las personas.
- [ ] TTS: al salir de una pantalla durante una secuencia o lectura, confirmar que no se reproduce ni actualiza contenido antiguo.

- [ ] Android: probar el primer audio justo después de entrar desde el mapa y después de cambiar de pantalla; verificar que la primera utterance no se pierde.

### Validación automatizada — 20-11-2026

- [x] Unit tests y comprobación de código aprobados (90 pruebas): https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44781107121
- [x] Browser E2E aprobado, incluyendo Ruta, desbloqueo persistente, cabecera común, resumen sin bloque vacío y tablas de teoría: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44781107099
- [x] Render Preview en estado LIVE: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- [ ] La prueba auditiva final debe ejecutarse en Android físico.
- [ ] La revisión visual final de tablas, barra y cabecera debe ejecutarse en Android físico.

## Nueva prueba humana — Iteración PT-BR 20-11-2026

### Audio (Android físico)
- [ ] Entrar en un ejercicio con consigna en español y texto objetivo en portugués: confirmar reproducción automática en orden origen → objetivo.
- [ ] Comprobar que cada fragmento visible ofrece su propio icono manual y que el icono usa la voz correcta.
- [ ] Probar Ejercicios, Ruta, integración, Comprensión lectora y Repaso; comprobar que ninguna sección queda sin audio/controles.
- [ ] En Comprensión lectora, confirmar que el pasaje se reproduce automáticamente y que después se escucha la pregunta.
- [ ] En Repaso, confirmar consigna, pronunciación objetivo y traducción tras responder.
- [ ] Activar/desactivar audio y navegar entre pantallas; confirmar que nunca continúa una frase de la pantalla anterior.
- [ ] En una actividad con ambos idiomas, confirmar el orden escuchado con las voces reales del dispositivo; revisar también una secuencia tras voiceschanged.

### Presentación y mecánica
- [ ] En cada actividad, comprobar cabecera (sección a izquierda, contador a derecha, audio), barra de progreso, icono/tema y consigna en ese orden.
- [ ] Ruta: comprobar contador continuo que incluye la integración y barra hasta 7/7.
- [ ] Lectura: probar duración 5 y 10; el contador debe respetar la selección y nunca superar el número de pasajes únicos.
- [ ] Entrenamiento: confirmar orden Ejercicios, Comprensión lectora, Repaso.
- [ ] Resumen con errores: solo palabras/frases incorrectas, pronunciación y traducción; sin temas/habilidades.
- [ ] Resumen sin errores: no debe aparecer el subtítulo «Reforzar».
- [ ] Probar volver al menú, reiniciar y siguiente ejercicio; en Ruta, la siguiente unidad solo aparece con estrellas suficientes y la última unidad vuelve al mapa.

### Repaso recuperable
- [ ] Crear varias palabras/frases pendientes y confirmar que aparecen todas en una misma sesión.
- [ ] Responder una tarjeta y cerrar: el progreso debe guardarse inmediatamente.
- [ ] Reabrir Repaso y confirmar que continúa con la siguiente tarjeta no completada, conservando el contador.
- [ ] Recargar el navegador durante Repaso y confirmar el mismo comportamiento.
- [ ] Completar todas las tarjetas: mostrar únicamente «Repaso finalizado» antes de las acciones.
- [ ] Responder incorrectamente una tarjeta: debe seguir pendiente para otra pasada, sin repetirse indefinidamente en la misma sesión.

### Alcance de idiomas
- [ ] Ejecutar esta lista primero con portugués brasileño (pt-BR).
- [ ] No aprobar ni propagar los cambios de contenido a otros idiomas hasta que PT-BR esté validado.

### Despliegue de prueba
- [x] Versión disponible en Render Preview: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- [x] Deploy LIVE: dep-dc0c80k0916s73db0ftg (commit 94aa33457e7d244f7679ae72186ad2916b5623e9).
- [ ] Ejecutar las pruebas de audio y disposición anteriores en Android físico sobre esta versión.



## 0. Alcance temporal de navegación (21-11-2026)
- [ ] La barra inferior muestra cinco posiciones: Ruta, Entrenamiento, Idiomas central, Teoría y Estadísticas.
- [ ] Ruta y Entrenamiento se muestran deshabilitados y no responden a pulsación ni teclado.
- [ ] El botón central abre el selector de idioma; solo Italiano está visible y seleccionable.
- [ ] Tras elegir Italiano se abre Teoría; categorías, temas, detalle y pronunciación siguen funcionando.
- [ ] Estadísticas abre y conserva sus gráficos/tabla y navegación interna.
- [ ] La barra inferior no permite entrar a Ruta o Entrenamiento por rutas de navegación indirectas.


## Resultado automatizado del alcance temporal — 21-11-2026
- [x] La aplicación abre directamente en Teoría y muestra la navegación desde el primer instante.
- [x] El selector central abre el diálogo y ofrece solo Italiano.
- [x] Ruta y Entrenamiento permanecen visibles y deshabilitados.
- [x] Teoría permite abrir categorías, temas y detalle.
- [x] Estadísticas abre sin errores de navegador.
- [x] npm run check y npm test aprobados; Browser E2E aprobado en https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44964132590.
- [ ] Falta completar la revisión manual táctil/auditiva en Android.


## Revisión manual — barra inferior y lista compacta de Teoría — 22-11-2026
- [ ] En móvil vertical (320–430 px), confirmar que Ruta, Entrenamiento, Idiomas, Teoría y Estadísticas caben en una sola fila y que Estadísticas no baja.
- [ ] Confirmar que el botón central de Idiomas sigue destacado y que los cinco objetivos táctiles no se superponen.
- [ ] Confirmar que el título de sección conserva su tamaño y queda a la misma altura que el icono de audio.
- [ ] Abrir cada categoría de Teoría: comprobar que las filas son más compactas, legibles y no se ven apretadas; probar títulos largos y navegación al detalle.


## Teoría: jerarquía y audio manual — 22-11-2026
- [ ] La entrada a Teoría muestra nivel A1; al seleccionarlo aparecen seis unidades tituladas.
- [ ] Cada unidad abre sus categorías disponibles y cada categoría muestra solo los subtemas asignados.
- [ ] Los controles atrás recorren correctamente subtemas → categorías → unidades → niveles.
- [ ] Palabras y frases cortas aparecen subrayadas y sin botón play; los textos largos conservan reproducción manual.
- [ ] Abrir un tema no inicia audio automáticamente; activar audio global no dispara lectura automática en Teoría.
- [ ] Los títulos de sección están centrados y mantienen el tamaño; validar barra inferior en móvil vertical.


## Teoría: navegación simplificada — 22-11-2026
- [ ] Al tocar «A1 · Principiante», el encabezado de la siguiente vista conserva exactamente «A1 · Principiante» y queda alineado a la izquierda.
- [ ] Al seleccionar una unidad, aparece directamente la lista de subtemas; el encabezado conserva exactamente el título de la unidad.
- [ ] Cada subtema muestra un icono de categoría junto al nombre; no existe pantalla separada de Gramática, Vocabulario o Expresiones.
- [ ] La flecha de retorno desde subtemas vuelve a unidades.


## Teoría: navegación acumulativa — 22-11-2026
- [ ] Al profundizar, los encabezados A1 y unidad se acumulan uno debajo del otro y no cambian su texto.
- [ ] La altura de cada fila con flecha se conserva entre la lista y el detalle.
- [ ] El subtema aparece debajo de la jerarquía dentro de Teoría, sin cubrir la pantalla completa.
- [ ] En el detalle, el icono de categoría aparece antes de «Gramática», «Vocabulario» o «Expresiones».
- [ ] Las flechas del detalle permiten volver al subtema, unidad o nivel correspondiente.


## Teoría — selectores jerárquicos y retorno único (22-11-2026)
- [ ] En Teoría, comprobar que la primera lista muestra «Etapa» y no la palabra «Nivel».
- [ ] Seleccionar A1 y verificar que aparece el desplegable Unidad con seis opciones.
- [ ] Seleccionar una unidad y verificar que aparece Subtema; sus opciones deben agruparse por Gramática, Vocabulario y Expresiones.
- [ ] Cambiar la unidad después de haber seleccionado una: el selector de subtema debe actualizarse y no conservar una selección perteneciente a la unidad anterior.
- [ ] Abrir un subtema y comprobar que su categoría/icono queda como rótulo, el nombre del subtema como título principal y la ruta «A1 · Principiante > unidad» debajo, en tamaño menor.
- [ ] Confirmar que la ruta no contiene flechas ni botones de retorno y que en el detalle existe exactamente una flecha.
- [ ] Pulsar la única flecha y confirmar que vuelve al conjunto de selectores conservando la etapa y unidad seleccionadas.
- [ ] Probar los desplegables en Android vertical y horizontal, incluyendo títulos largos y áreas táctiles.

- [ ] La primera opción del selector Etapa debe ser un placeholder; seleccionar A1 debe revelar Unidad sin depender de volver a elegir una opción ya seleccionada.


## Teoría — árbol B2 y expansión exclusiva (22-11-2026)
- [ ] En la pantalla Teoría, confirmar que el encabezado muestra «A1 · Principiante» y debajo aparecen las seis unidades en orden.
- [ ] Verificar numeración arábiga consecutiva 1–6 únicamente en las unidades; ningún subtema debe tener número.
- [ ] Comprobar que cada unidad es un bloque independiente con borde lateral azul y filas verticalmente compactas.
- [ ] Abrir una unidad: debe mostrar sus subtemas debajo, con sangría a la izquierda y conectores de rama; la unidad activa debe tener fondo azul muy tenue.
- [ ] Abrir otra unidad: la anterior debe colapsarse automáticamente y solo la nueva permanecer expandida.
- [ ] Tocar nuevamente la unidad expandida: debe colapsarse.
- [ ] Abrir un subtema: el detalle existente debe conservar contenido, categoría, título, ruta, audio manual y controles anterior/siguiente.
- [ ] Volver desde el detalle: debe regresar al árbol y conservar expandida la unidad de origen.
- [ ] Probar con viewport móvil estrecho (320 px), móvil estándar (390 px) y escritorio; comprobar ausencia de scroll horizontal y legibilidad de títulos largos.


### Verificación automatizada y disponibilidad para prueba humana — 22-11-2026
- [x] `npm run check` y `npm test` aprobados: [GitHub Actions 45057647408](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45057647408).
- [x] Browser E2E aprobado: [GitHub Actions 45057647416](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45057647416).
- [x] Preview Render actualizado y LIVE: deploy `dep-dc1jkoajnfac738v4j7g`, commit `af0680ca58eb3c33d2f4a92ce6372d650ce1c6f4`.
- [ ] Revisión visual y táctil humana en Android/móvil; comprobar que el resultado coincide con B2 y que la numeración/subniveles se perciben correctamente.


## 15. Revisión de Teoría B2 en italiano — 22-11-2026

- [ ] En la lista de unidades, confirmar que cada subtema muestra un único punto y no aparecen conectores duplicados ni una línea vertical secundaria.
- [ ] Confirmar que el borde lateral azul de cada unidad mantiene color, posición, continuidad y grosor.
- [ ] Abrir un subtema y verificar el orden visual: título de sección «Teoría» → ruta de etapa/unidad → categoría → título del subtema → contenido.
- [ ] En el detalle de pronombres, tocar varios botones de pronunciación, incluidos fragmentos de una sola palabra; cada uno debe leer únicamente el fragmento asociado.
- [ ] Confirmar que la voz seleccionada corresponde a italiano (it-IT) y que no se reproduce la traducción española.
- [ ] Repetir la prueba de pronunciación en Android real; la comprobación automatizada del locale no sustituye la validación auditiva.
- [ ] Volver desde el detalle y confirmar que la unidad de origen permanece expandida y que la expansión exclusiva sigue funcionando.

**Idioma vigente de esta revisión:** italiano (it-IT). Las referencias a portugués brasileño (pt-BR) en secciones históricas del plan corresponden a iteraciones anteriores.


### Validación automatizada de Teoría B2 italiana — 22-11-2026
- [x] Browser E2E comprueba los marcadores simples, la conservación del borde azul de unidad, la posición de la ruta y la reproducción manual con locale it-IT. Run [45060797728](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45060797728).
- [x] npm run check y npm test aprobados en run [45060797598](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45060797598).
- [x] Preview Render LIVE en deploy `dep-dc1k48d9fdbs73b2ua70`, commit `c55822c0ce8434ab086f0067715124fd7333377f`.
- [ ] Prueba auditiva/táctil en Android real pendiente.


## Ajustes visuales y audio directo de Teoría — 22-11-2026
- [ ] Confirmar que «A1 · Principiante», unidades y subtemas tienen el mismo tamaño tipográfico (16 px).
- [ ] Confirmar que el párrafo de desarrollo comienza más cerca del título del subtema.
- [ ] Tocar una palabra o frase breve en italiano: debe reproducirse directamente, sin icono Play.
- [ ] Confirmar que los fragmentos extensos conservan el icono Play y reproducen únicamente su propio texto.
- [ ] Confirmar reproducción italiana it-IT y ausencia de lectura de traducción española.
- [ ] Repetir las pruebas en Android real; verificar respuesta táctil y sonido audible.


### Resultado de validación — 22-11-2026
- [x] Igualdad de tamaño tipográfico (16 px) validada en Browser E2E.
- [x] Espaciado compacto entre encabezado y desarrollo validado en Browser E2E.
- [x] Pronunciación directa de texto corto en it-IT, sin icono Play redundante, validada en Browser E2E.
- [x] `npm run check` y `npm test` aprobados: [run 45062976801](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45062976801).
- [x] Browser E2E aprobado: [run 45062980099](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45062980099).
- [x] Preview Render LIVE: deploy `dep-dc1kf756e07s73dkg96g`.
- [ ] Prueba visual, táctil y auditiva en Android real.


### Teoría — revisión de jerarquía A
- [ ] Confirmar que las unidades se presentan como ramas abiertas, sin celdas/tarjetas, y que el borde lateral azul permanece.
- [ ] Verificar que los iconos de Gramática, Vocabulario y Expresiones son los mismos glifos, en monocolor.
- [ ] Confirmar mayor separación vertical entre subtemas y que el subrayado punteado sigue activando pronunciación italiana al tocarlo.
- [ ] Confirmar que el título, el contenido y los botones Anterior/Siguiente quedan compactos, sin superposición ni pérdida de área táctil.

## Teoría A — verificación de espaciado y detalle (23-11-2026)
- [ ] Confirmar separación perceptible entre unidades (aprox. 14 px) sin tarjetas ni fondos de celda.
- [ ] Confirmar separación entre subtemas (13–14 px), filas táctiles de al menos 44 px y sangría coherente.
- [ ] Confirmar que cada unidad conserva su borde lateral azul y los subtemas mantienen los glifos 文, Aa y “ ” en monocolor.
- [ ] Tocar una palabra/frase italiana: subrayado punteado visible y TTS audible en it-IT.
- [ ] En detalle, comprobar título y ruta compactos; el contenido comienza cerca del encabezado.
- [ ] Confirmar que Anterior/Siguiente quedan próximos al contenido, sin perder área táctil ni superponerse.
- [ ] Repetir en Android real; el E2E no acredita legibilidad táctil ni audio físico.

## Teoría — iconos y encabezado de subtema (23-11-2026)
- [ ] En el árbol, verificar icono de libro abierto para Gramática, libro con A para Vocabulario y globos de conversación para Expresiones; todos lineales y monocolor.
- [ ] Confirmar que no aparecen los glifos anteriores 文, Aa ni “ ”.
- [ ] Abrir un subtema: flecha de retorno a la izquierda en la fila superior.
- [ ] Confirmar ruta Etapa > Unidad centrada y contador 1/4 a la derecha.
- [ ] Confirmar categoría/icono (C) y título (D) alineados a la izquierda bajo la fila superior.
- [ ] Verificar que los textos largos de ruta se truncan sin superponerse al contador.
- [ ] Verificar navegación Anterior/Siguiente y TTS it-IT.


## Teoría — encabezados fijos y marcadores reforzados (23-11-2026)
- [ ] Desplazarse por la lista de Teoría: el título de sección permanece fijo arriba.
- [ ] Confirmar que la etapa queda fija debajo del título de sección y no se superpone.
- [ ] Expandir una unidad y desplazarse por sus subtemas: la fila de la unidad permanece fija debajo de etapa y título, a todo el ancho de la sección.
- [ ] Confirmar que al cambiar de unidad no queda un encabezado anterior superpuesto ni se tapa el primer subtema.
- [ ] Verificar que las viñetas/puntos de subtema se ven claramente más gruesos (8 px), manteniendo iconos y sangría.
- [ ] Repetir el desplazamiento en Android real, incluyendo el área segura superior y pantallas pequeñas.

### Estado automatizado — encabezados fijos y marcadores — 23-11-2026
- [x] Tests aprobados: [45115607032](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45115607032).
- [x] Browser E2E aprobado: [45115607075](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45115607075).
- [x] Render Preview LIVE: deploy `dep-dc1sj97f3r2c73dl79ig`.
- [ ] Comprobación visual/táctil en Android real pendiente.


## Teoría — encabezado sticky hasta título y glifos revisados (23-11-2026)
- [ ] En el menú de jerarquías, confirmar que solo «Teoría» permanece fijo; etapa y unidades se desplazan.
- [ ] Confirmar que los subtemas no muestran viñetas ni marcadores duplicados y que conservan su icono de categoría.
- [ ] Confirmar Gramática = libro abierto; Vocabulario = símbolo de traducción/intercambio de idiomas; Expresiones = globos de conversación.
- [ ] Abrir un subtema y confirmar una sola fila superior: retorno a la izquierda, «Teoría» centrado y audio a la derecha.
- [ ] Confirmar ruta inmediatamente debajo, sin divisor horizontal.
- [ ] Confirmar categoría e icono alineados a la izquierda, seguidos por el título.
- [ ] Desplazarse: la fila superior, ruta, categoría y título permanecen fijos; el contenido explicativo sí se desplaza.
- [ ] Tocar palabras italianas subrayadas: deben pronunciarse directamente, con locale it-IT y sin iconos Play adyacentes para palabras cortas.
- [ ] Confirmar subrayado punteado y navegación Anterior/Siguiente sin superposición.
- [ ] Repetir en teléfono Android real; verificar sonido audible, áreas táctiles y área segura superior.

- [ ] Confirmar que la ruta y el contador aparecen al abrir el detalle (se retiran sus estados iniciales `hidden`).


## Teoría — refinamiento visual (23-11-2026)
- [ ] Confirmar glifo «Aa» para Vocabulario, con tamaño y alineación consistentes con los otros iconos.
- [ ] Confirmar que A1 · Principiante aparece dentro de una celda azul suave.
- [ ] Confirmar que las unidades numeradas aparecen en celdas azules más tenues que la celda de nivel.
- [ ] Abrir un subtema: debe desaparecer el encabezado global superior y quedar una sola fila con retorno, «Teoría» grande y audio.
- [ ] Confirmar que «Teoría» tiene tamaño visual equivalente al encabezado de sección y que todo el bloque se sitúa arriba, sin espacio superior redundante.
- [ ] Volver a jerarquías: el encabezado global reaparece y las celdas de nivel/unidad mantienen su formato.


## Revisión visual — jerarquía y detalle de subtema (23-11-2026)
- En el menú de Teoría, comprobar contraste entre celda de nivel (#173B65) y celdas de unidad (#315B85), legibilidad del texto y conservación de expansión.
- Abrir un subtema y comprobar que no quede una franja superior vacía ni audio duplicado; debe verse solo la cabecera interna con retorno, «Teoría» y audio, seguida de ruta, categoría, título y contenido.
- Confirmar que el glifo de Vocabulario representa traducción/intercambio y no se deforma; Gramática y Expresiones deben conservar sus glifos.
- Revisar en Android real que el encabezado no tape contenido al desplazarse y que los controles mantengan áreas táctiles adecuadas.


## 24. Regresión de navegación entre subtemas de Teoría — 24-11-2026
- [ ] Abrir la unidad «Datos personales y entorno» y entrar a «Pronombres personales».
- [ ] Avanzar a «Vocabulario» y luego «Expresiones»: comprobar que rótulo, contenido y glifo corresponden a la categoría actual; no debe conservarse la categoría del primer subtema.
- [ ] Retroceder y comprobar que vuelve la categoría y contenido de Vocabulario.
- [ ] Repetir entrando primero por otro subtema y confirmar que el contenido no depende de cuál se abrió inicialmente.
- [ ] Confirmar que las celdas de unidad se ven en azul `#4B81B8` con texto blanco y que el glifo de Vocabulario se reconoce como idioma/globo.


## Teoría — glifo bilingüe y contador de subtema (24-11-2026)
- [ ] En el árbol de Teoría, comprobar que Vocabulario muestra «A ⇄ 文» claramente, sin globo ni deformación; Gramática y Expresiones conservan sus iconos.
- [ ] Abrir un subtema: comprobar que el título queda a la izquierda y el contador (por ejemplo, 1/4) alineado al extremo derecho en la misma línea.
- [ ] Avanzar y retroceder: el contador debe actualizarse (2/4, 3/4...) sin desplazarse a otra fila.
- [ ] Desplazarse por el contenido: título y contador permanecen fijos juntos en el encabezado sticky.
- [ ] Probar títulos largos y viewport de 320 px; el título debe poder ocupar el espacio disponible sin superponerse al contador.


## Revisión móvil — jerarquía y encabezados — 24-11-2026
- En Teoría, comprobar que la numeración de las unidades queda neutra y que solo el nombre de unidad lleva el acento azul.
- Expandir una unidad y comprobar la mayor sangría de los subtemas; el espacio vacío a la izquierda debe reservarse para el futuro check de Ruta, sin mostrar un check hasta que exista integración real.
- Verificar que el glifo de Vocabulario muestra «abc».
- En Estadísticas, desplazar la pantalla y comprobar que el título de sección permanece visible, igual que en las demás secciones.


## Menú de jerarquías — separación y numeración — 24-11-2026
- Comprobar que las unidades quedan más juntas, sin huecos verticales grandes entre filas.
- Confirmar que la numeración se ve neutra (sin azul/acento) tanto antes como después de expandir una unidad.
- Confirmar que el nombre de la unidad mantiene su acento azul y que la lista de subtemas conserva la sangría.


## Confirmación de color de numeración en jerarquías — 24-11-2026
- [ ] En Teoría, comprobar que los números 1–6 de las unidades usan color neutro, tanto en filas contraídas como expandidas.
- [ ] Confirmar que solo el nombre de la unidad conserva el acento azul.
- [ ] Verificar que no cambia el color al expandir otra unidad ni al volver desde el detalle de un subtema.
- [ ] Comprobar que las unidades mantienen la separación compacta y que los subtemas conservan su sangría/columna reservada.


## Comprobación reforzada de numeración — 24-11-2026
- [ ] En Teoría, el número de unidad se ve neutro (#263e59) tanto contraído como expandido.
- [ ] El nombre de unidad conserva el acento azul (#315b85).
- [ ] Confirmar que ambos colores se mantienen al cambiar de unidad y al regresar desde el detalle de un subtema.
- [ ] Verificar el preview Render recién publicado; recargar sin caché si el navegador conserva estilos anteriores.


## Validación automatizada y preview publicado — 24-11-2026
- [x] Tests CI aprobados: [run 45317664026](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45317664026).
- [x] Browser E2E aprobado: [run 45317664032](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45317664032).
- [x] Render Preview LIVE: deploy `dep-dc2g0ejrjlhs73ck877g`.
- [ ] Revisión visual en Android real: comprobar color neutro de números, acento azul solo en nombres, filas contraídas/expandidas y caché del navegador.


## Recuperación selectiva de Teoría italiana — 25-11-2026
- [ ] Confirmar que A1 conserva exactamente seis unidades y los títulos anteriores a la regresión.
- [ ] Abrir la primera unidad y comprobar los cuatro subtemas: «Saludos y despedidas», «Decir el nombre», «Cómo estás» y «Pronombres y ser/estar».
- [ ] En expresiones con variantes separadas por «/», tocar cada control por separado y comprobar que se pronuncia solo la variante correspondiente.
- [ ] En «Pronombres y ser/estar», comprobar que pronombres y conjugaciones están en tablas separadas.
- [ ] Confirmar que «essere» y «stare» aparecen en cursiva y entre « » en el encabezado, y que ambas columnas tienen el mismo tamaño de letra que la tabla bilingüe.
- [ ] Confirmar encabezados «Italiano» y «Español» en tablas de dos columnas.
- [ ] Ejecutar Browser E2E y pruebas automatizadas antes de publicar.
- [ ] Tras deploy LIVE, validar en Android el árbol, el tamaño de letra y la pronunciación real it-IT.


### Estado de automatización — 25-11-2026
- [x] `npm run check` y `npm test` aprobados: [45522922228](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45522922228).
- [x] Browser E2E aprobado: [45522922093](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45522922093).
- [ ] Revisión visual, táctil y auditiva en Android real después del despliegue Render.


### Publicación lista para prueba humana — 25-11-2026
- [x] Cambios integrados en `feature/mobile-bottom-navigation`.
- [x] Render Preview LIVE: deploy `dep-dc3399u8bjmc73ednf6g`, commit `395aace02fccbf51aa433a66a33a87aa32d8043e`.
- [x] CI y Browser E2E aprobados antes de integrar.
- [ ] En Android, confirmar las seis unidades A1 y los cuatro subtemas de la primera unidad.
- [ ] Tocar por separado cada variante con «/» y verificar que el audio reproduce solo esa frase en italiano.
- [ ] Confirmar que las columnas «essere» y «stare» se ven del mismo tamaño y que sus encabezados aparecen en cursiva y entre « ».


## Ajustes tipográficos de subtemas — 25-11-2026
- [ ] Confirmar que los términos italianos incluidos en títulos de subtemas se muestran en cursiva, entre « », y seguidos de su traducción española entre paréntesis.
- [ ] En «Pronombres y ser/estar», comprobar que el encabezado dice «Verbos «Essere» (ser) y «Stare» (estar)».
- [ ] Confirmar que las celdas y encabezados de tablas no heredan cursiva, comillas angulares ni traducciones de los títulos.
- [ ] En la última tabla de conjugación, comprobar que las tres columnas usan el mismo tamaño de letra (19 px escritorio / 17 px móvil).
- [ ] Verificar en Android que la legibilidad y el desplazamiento horizontal de la tabla siguen siendo adecuados.


## Unidad 2 — revisión humana de contenido y formato
- [ ] Países, gentilicios e idiomas: revisar traducciones, preposiciones y pronunciación.
- [ ] Artículos y concordancia: revisar formas definidas/indefinidas y ejemplos.
- [ ] Adjetivos: revisar concordancia masculino/femenino y singular/plural.
- [ ] Edad y procedencia: comprobar uso de `avere`, `essere di` y `venire da`, incluidas variantes formales.
- [ ] Confirmar encabezados de tabla Italiano/Español, tamaño uniforme y ausencia de cursiva/comillas/traducciones en las tablas.
- [ ] Probar pronunciación individual de variantes separadas por «/».
- [ ] Confirmar que Unidades 3–6 conservan títulos y no muestran contenido de lección.


## Unidad 2 italiana — validación humana tras publicación — 25-11-2026
- [ ] Abrir Teoría > A1 > Unidad 2 y comprobar los cuatro subtemas en orden: Países e idiomas, Artículos y concordancia, Artículos y adjetivos, Edad y procedencia.
- [ ] En Países e idiomas, confirmar que cada país e idioma tiene su propio control TTS cuando aparece separado por guion o barra; tocar cada variante y comprobar que solo se pronuncia esa variante.
- [ ] En Artículos y concordancia, comprobar que la explicación aparece antes de las tablas y que cubre género, número, sonidos iniciales y apóstrofo.
- [ ] En Artículos y adjetivos, comprobar que las columnas Masculino, Femenino y Plural quedan equilibradas y que los ejemplos concuerdan.
- [ ] En Edad y procedencia, comprobar preguntas y respuestas de edad y origen, incluidas las variantes formal e informal.
- [ ] En móvil vertical y horizontal, confirmar que ninguna tabla produce scroll horizontal ni texto cortado; comprobar anchura de columnas y ajuste de palabras largas.
- [ ] Confirmar que los títulos italianos conservan cursiva, comillas angulares y traducción española donde corresponde; los encabezados de tabla permanecen sin formato adicional.
- [ ] Confirmar que la tabla de conjugación mantiene tamaño tipográfico uniforme en las tres columnas.
- [ ] Confirmar voz it-IT audible en el teléfono y pronunciación individual de cada variante; el test de navegador no sustituye la prueba auditiva.

### Automatización y despliegue — 25-11-2026
- [x] Tests: GitHub Actions run 45614659980.
- [x] Browser E2E: GitHub Actions run 45614660104.
- [x] Render Preview LIVE: deploy dep-dc3daucipgvc738c5k10, commit 19627135bf04bcb7c0a83330f007ebee04a0f8de.
- [ ] Prueba humana visual, táctil y auditiva en Android.


## Unidad 2 — adjetivos: vocabulario y uniformidad de tablas (26-11-2026)
- [ ] En «Artículos y adjetivos», confirmar que la tabla «Adjetivos frecuentes» aparece después de la regla y antes de los ejemplos.
- [ ] Verificar los seis pares: bello/bonito, buono/bueno, grande/grande, nuovo/nuevo, piccolo/pequeño e interessante/interesante.
- [ ] Tocar cada adjetivo italiano y comprobar que reproduce únicamente esa palabra.
- [ ] Confirmar que las tablas de regla, vocabulario y ejemplos tienen el mismo ancho exterior y el mismo tamaño de texto en sus celdas.
- [ ] Revisar ajuste de columnas, traducciones y ausencia de scroll horizontal en móvil vertical y horizontal.
- [ ] Confirmar que los ejemplos siguen vinculados a las terminaciones -o, -a y -e → -i y conservan traducción española y TTS.
- [ ] Ejecutar Tests y Browser E2E; no marcar como validado hasta que ambos aprueben.
- [ ] Tras publicación Render LIVE, comprobar el preview en Android.


### Validación automatizada del ajuste de adjetivos — 26-11-2026
- [x] Tests CI aprobados: [run 45826567300](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826567300).
- [x] Browser E2E aprobado: [run 45826567302](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826567302).
- [ ] Render Preview actualizado al commit final y verificado LIVE.
- [ ] Prueba visual, táctil y auditiva en Android real.


### Publicación Render — ajuste de adjetivos — 26-11-2026
- [x] Render Preview LIVE: deploy `dep-dc430l3l550s7381s230`, commit `89aa6ccd2380f8a1000d89876be791fd591e2ad4`.
- [x] Build y arranque de aplicación confirmados en logs Render.
- [x] Tests y Browser E2E aprobados para el HEAD publicado.
- [ ] Prueba visual, táctil y auditiva en Android real: vocabulario previo a ejemplos, tablas de ancho y tipografía uniformes, seis controles de pronunciación.
