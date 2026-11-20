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
