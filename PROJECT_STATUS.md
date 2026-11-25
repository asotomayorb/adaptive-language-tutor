# Registro de estado del proyecto — Adaptive Language Tutor

**Última actualización:** 18-11-2026  
**Rama activa de preview:** `feature/mobile-bottom-navigation`  
**Pull request:** [#2 – Improve adaptive tutor pedagogy and AI integration](https://github.com/asotomayorb/adaptive-language-tutor/pull/2)  
**Estado global:** sesiones reales Gemini aprobadas en `pt-BR` y `fr-FR` (3 turnos y 5 fragmentos de voz por idioma); una sesión real adicional de navegador en francés completó persistencia y exportación. Tests unitarios (71) y Browser E2E aprobados en el commit `2425e81` (runs [#44127681116](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44127681116) y [#44127681802](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44127681802)). Se añadió repaso espaciado de patrones lingüísticos mediante autoevaluación, incluyendo conversaciones libres sin respuesta única, y pistas adicionales generadas bajo demanda sin consumir turnos, con reproducción manual de sus fragmentos en el idioma objetivo. La comprobación inicial de salud tiene timeout de 5 s; se corrigió la exposición de archivos estáticos y se añadieron pruebas de rutas privadas y cabeceras de seguridad. Audio TTS está parcialmente implementado y probado en Chromium; la validación auditiva en dispositivos reales y la revisión de seguridad siguen pendientes. No declarar listo para prueba humana amplia ni desplegar públicamente todavía.

Este documento es el registro detallado del proyecto. El README principal mantiene únicamente la etapa actual y enlaza aquí para evitar duplicar información y mantener la documentación operativa breve.

## Resumen ejecutivo

| Etapa | Área | Estado |
|---|---|---|
| 1 | Base del repositorio y ejecución | Implementada; CI correcto en el último commit validado |
| 2 | Tutor IA, proveedores y pedagogía | Implementada; sesión real Gemini validada en 3 turnos |
| 3 | Pruebas automatizadas y CI | Aprobadas: 71 tests y Browser E2E en `2425e81` |
| 4 | Auditoría funcional y técnica | En curso; quedan comprobaciones funcionales y de seguridad |
| 5 | Validación con proveedor IA real | Smoke test Gemini aprobado; evaluación de calidad/costos y fallos pendiente |
| 6 | Prueba humana y ajustes de experiencia | Pendiente |
| 7 | Seguridad y preparación de producción | Pendiente |
| 8 | Reintegración y comprobación de Replit | Aplazada hasta el final |

**Etapa actual: 4.** La sesión real, CI y E2E están aprobados. Continuar con auditoría de flujo, cobertura real de audio y seguridad; todavía no avanzar a prueba humana.

---

## Etapa 1 — Base del repositorio y ejecución

**Estado: implementada.**

- [x] Repositorio GitHub: `asotomayorb/adaptive-language-tutor`.
- [x] Rama de trabajo: `feature/ai-tutor-pedagogy`.
- [x] Servidor Node.js con ejecución mediante `npm start` y desarrollo mediante `npm run dev`.
- [x] Servidor HTTP entrega la aplicación y los módulos estáticos.
- [x] Endpoint `GET /api/health`.
- [x] Configuración de entorno mediante variables y carga opcional de `.env`.
- [x] Modo local disponible sin credenciales IA.
- [x] Pull request #2 abierto; no hacer merge hasta completar validaciones.

**Verificación:** GitHub Actions #114 completó correctamente `npm run check` y `npm test` sobre el commit `1b8915beacf2e4636ed83a9ef69b3ca51fb3462f` de esta rama.

## Etapa 2 — Tutor IA, proveedores y pedagogía

**Estado: implementada; smoke test real aprobado en Gemini 3.5 Flash-Lite.**

- [x] Cliente frontend para consultar salud y solicitar turnos al backend.
- [x] Adaptadores para OpenAI, Anthropic, Gemini y proveedores compatibles con Chat Completions.
- [x] Clave API utilizada solo en el servidor.
- [x] Prompt en español para tutoría de portugués brasileño e inglés.
- [x] Una actividad principal por turno, variedad de ejercicios y adaptación progresiva.
- [x] Evaluación semántica con estados correcto, parcialmente correcto, incorrecto y no aplicable.
- [x] Contexto de hasta 12 intercambios recientes.
- [x] Actualización del nivel estimado y vocabulario del alumno.
- [x] Esquema JSON y validación de la respuesta del proveedor.
- [x] Timeout de proveedor de 45 segundos (configurado en `server/provider.js`).

**Pendiente:**
- [ ] Confirmar el identificador de modelo y la disponibilidad/cuota del proveedor elegido.
- [x] Ejecutar smoke test real desde GitHub Actions con Gemini 3.5 Flash-Lite. Run [#44120040434](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44120040434), commit `99fcfcc`: portugués brasileño (`pt-BR`) y francés (`fr-FR`), 3 turnos por idioma y 4 fragmentos de voz por sesión. Duración: 79,8 s para pt-BR y 39,8 s para fr-FR; ambos aprobados tras reintentos ante respuestas HTTP 503.
- [ ] Evaluar calidad de respuestas, naturalidad, adaptación, continuidad y consumo.
- [ ] Confirmar manejo de errores y límites reales del proveedor.

Las pruebas actuales de adaptadores usan respuestas simuladas; no acreditan conectividad ni compatibilidad real con los modelos configurados.

## Etapa 3 — Pruebas automatizadas y CI

**Estado: implementada; tests y Browser E2E aprobados en `288f639`.**

- [x] Pruebas de API y servidor.
- [x] Pruebas de adaptadores y validación de respuestas.
- [x] Pruebas del prompt y contrato estructurado.
- [x] Pruebas de lógica pedagógica local.
- [x] Pruebas de persistencia y repaso espaciado.
- [x] Workflow `.github/workflows/tests.yml` para Node 20.
- [x] GitHub Actions #166 completó con éxito `npm run check` y `npm test` en el commit `94e183016ec14c45d31510a71791549db96c0d5b`.
- [x] Actions #165 también validó previamente las correcciones de vocabulario IA, cliente frontend y límites del endpoint.
- [x] La ejecución #165 incluye las pruebas de vocabulario IA, cliente frontend y límites del endpoint añadidas durante esta auditoría.
- [x] La prueba de escape HTML y las pruebas nuevas de persistencia IA quedaron incluidas en esa ejecución.

## Etapa 4 — Auditoría funcional y técnica

**Estado: en curso; tests y Browser E2E aprobados en `7576158`; smoke real de API en portugués y francés, y sesión real de navegador francés aprobados en run #44122518840. El E2E cubre modo local, IA simulada, reintentos, persistencia, exportación, repaso, pronunciación de vocabulario del resumen y bloqueo de reintentos duplicados.**

### Flujo de sesión IA revisado parcialmente

- [x] Inicio de sesión: envía configuración, contexto del alumno y tarea `start_lesson`.
- [x] Unificar la aplicación de actualizaciones del alumno: el vocabulario del primer turno y de turnos posteriores se conserva, deduplicado, en la sesión y el resumen.
- [x] Respuesta: el frontend envía la respuesta del alumno junto con la actividad actual y el historial.
- [x] Reintento: existe acción para repetir inicio o reenvío tras un error.
- [x] Pistas: se muestra la pista incluida en el ejercicio actual.
- [x] Pistas progresivas IA: tras la pista inicial, el alumno puede pedir otra más específica al tutor; la tarea `request_hint` conserva la actividad, no evalúa ni incrementa el turno y respeta el locale objetivo. Sus fragmentos del idioma objetivo admiten reproducción automática y manual. Tests y Browser E2E aprobados en runs #44127681116 y #44127681802.
- [x] Progreso: registra turnos, aciertos, rachas, vocabulario y errores.
- [x] Finalización: permite pasar al resumen cuando el tutor finaliza o se alcanza la duración.
- [x] Persistencia: `finishSession()` guarda el resumen, vocabulario y errores en almacenamiento local.
- [x] Repaso IA: los errores registrados por el flujo IA reciben un identificador `ai-turn-N`; `persistSession()` los convierte en tarjetas de repaso genéricas y la vista puede usar el prompt y la respuesta esperada guardados.
- [x] Corregir colisiones de tarjetas IA: los identificadores `ai-turn-N` se repiten entre sesiones; ahora las claves incluyen marca temporal de sesión y turno.
- [x] Evitar crear tarjetas IA no calificables cuando la actividad no incluye una respuesta esperada.
- [x] Convertir `learnerUpdate.errorsToReview` en tarjetas de repaso cualitativas, también para conversaciones libres sin respuesta única.
- [x] Permitir autoevaluar cada patrón como «Lo recordé» o «Necesito practicarlo»; los intervalos se actualizan con el mismo sistema espaciado sin inventar una respuesta correcta.
- [x] Deduplicar patrones por idioma y contenido, preservando el intervalo ya conseguido cuando vuelven a aparecer.
- [x] Añadir pruebas de persistencia para ambos casos; tests aprobados en run #44093520831 y posteriores.
- [x] Validar en navegador que un error IA con respuesta esperada se persista como tarjeta, aparezca al vencer y se califique; E2E aprobado en run #44121394333.
- [x] Integrar `learnerUpdate.errorsToReview` en el resumen y en el historial de sesiones; no se convierten en tarjetas de respuesta única porque describen patrones, no respuestas calificables.
- [x] Las actividades IA sin `expectedAnswer` ya no generan tarjetas de repaso que no puedan calificarse.
- [x] Implementar repaso cualitativo de patrones para conversaciones libres sin respuesta única; tests unitarios y E2E aprobados en runs #44126872598 y #44126872696.
- [x] El botón de pista admite una consulta adicional al tutor para generar una pista adaptada sin cambiar la actividad ni consumir un turno. La pista inicial se muestra sin llamada adicional; el botón permanece disponible incluso en conversación libre.
- [ ] Evaluar calidad pedagógica de las pistas generadas en sesiones reales y asegurar que no revelen la solución demasiado pronto.
- [x] Corregir evaluación `not_applicable`: los turnos conversacionales sin evaluación objetiva ya no cuentan como errores, no rompen rachas y no reducen la precisión.
- [x] Separar el total de turnos de las respuestas evaluables en el resumen y exportación.
- [x] Evitar que una doble pulsación en «Ver resumen» persista dos veces la misma sesión.
- [x] Añadir pruebas para estados `correct`, `partially_correct`, `incorrect` y `not_applicable`; CI correcto en Actions #130.
- [x] El nivel estimado del tutor IA se conserva entre turnos y se muestra en el resumen; la sesión real smoke completó el ciclo, falta evaluación pedagógica de calidad.
- [x] Conectar `learnerUpdate.errorsToReview` con el resumen: los patrones se acumulan sin duplicados, se limitan en longitud/cantidad y se guardan en el historial de sesiones.
- [x] Añadir pruebas unitarias para acumulación, deduplicación, límites y persistencia de patrones IA.
- [x] Verificar una sesión real completa en navegador con Gemini: 3 turnos en francés, 1 sesión persistida y exportación JSON descargada; run #44122518840.
- [x] Añadir pruebas del cliente frontend para health check, envío de turnos, errores HTTP y respuestas no JSON. El health check inicial se aborta tras 5 s si el backend no responde, permitiendo continuar en modo local; probado en tests.
- [x] Añadir prueba de integración del ciclo IA en `tests/ai-session-flow.test.js`: actualizaciones del alumno, deduplicación de vocabulario/patrones, turnos `not_applicable`, evaluación, resumen, persistencia y tarjeta de repaso. tests aprobados en run #44093520831.
- [x] Pruebas de interacción DOM/navegador y del flujo completo de interfaz: modo local, modo IA simulado, reintentos, pistas, resumen, persistencia, exportación, repaso IA y autoevaluación de patrones; E2E aprobado en run #44126872696 (incluye viewport móvil de 390 px).

### Backend y seguridad revisados parcialmente

- [x] Límite de cuerpo: 32 KB.
- [x] Límite de mensaje: 8.000 caracteres.
- [x] Timeout de proveedor: 45 segundos.
- [x] Límite global en memoria: 60 solicitudes por 10 minutos.
- [x] Máximo de 2 solicitudes simultáneas por instancia.
- [x] Rechazo de rutas estáticas fuera del directorio raíz cubierto por prueba.
- [x] Reordenar el endpoint para validar JSON, mensaje y configuración antes de consumir cupo o concurrencia; añadir pruebas de regresión para solicitudes inválidas y proveedor no configurado.
- [x] Confirmar CI para el cambio: Actions #165, `npm run check` y `npm test` correctos.
- [x] Framework Playwright/Chromium en GitHub Actions; recorridos local e IA simulada aprobados.
- [x] Validar el flujo con proveedor real mediante `npm run test:provider-live`: 3 turnos y cierre confirmados en run #44093520976.
- [ ] Evaluar límites por IP/usuario y protección contra abuso antes de exposición pública.
- [ ] Revisar límites de historial y tamaño total de contexto enviado al proveedor.
- [x] Completar revisión de sanitización de contenido dinámico en la interfaz: todas las inserciones `innerHTML` usan valores constantes o pasan por `escapeHTML`; incluye prompts de catálogo, respuestas IA, tarjetas de repaso, vocabulario y resumen.
- [ ] Revisar privacidad, logs y errores del proveedor.
- [ ] Definir si se requiere CORS; actualmente la arquitectura está planteada para frontend y API en el mismo origen.
- [x] Corregir inserción de contenido generado por IA en el repaso y el resumen: los textos variables de tarjetas, vocabulario, idioma y foco recomendado ahora se escapan antes de insertarse como HTML.
- [x] Añadir pruebas unitarias para el helper de escape HTML, incluyendo etiquetas, comillas y valores no string; tests aprobados en run #44123809979.
- [x] Añadir pruebas de regresión para tarjetas IA duplicadas entre sesiones y actividades sin respuesta esperada. La ejecución quedó completada correctamente en GitHub Actions #114.
- [x] Restringir el servidor estático a `index.html` y archivos `.js`/`.css` de `src/`; bloquear archivos de entorno, backend, dependencias, scripts y tests. Diez rutas privadas y variantes de traversal cubiertas; tests y Browser E2E aprobados en run #44119446984 y #44119447002.
- [x] Añadir cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy` a respuestas de API y archivos estáticos; verificadas por pruebas.
- [ ] Ejecutar revisión completa de rutas, estados y casos extremos.

### Observaciones de arquitectura

- El progreso está almacenado en `localStorage`; no hay cuentas ni sincronización entre dispositivos.
- El rate limit es global por instancia, no por usuario, y se reinicia al reiniciar el servidor.
- El modo local y el modo IA comparten resumen y almacenamiento, pero sus experiencias de repaso no son idénticas.
- No se ha demostrado todavía el comportamiento en un despliegue persistente o con varias instancias.

## Etapa 5 — Validación con proveedor IA real

**Estado: smoke test real aprobado; validación ampliada pendiente.**

- [x] Proveedor inicial de validación: Google Gemini, modelo `gemini-3.5-flash-lite` (configurable; no es dependencia permanente).
- [x] Confirmar conectividad y compatibilidad del modelo mediante sesiones reales de tres turnos en portugués brasileño y francés.
- [x] La clave se utilizó como secreto de GitHub Actions; no se incorporó al repositorio ni a los logs.
- [x] Smoke test: inicio, tres evaluaciones, continuidad, fragmentos de voz y cierre completados en ambos idiomas.
- [x] Sesión real desde el navegador: tres turnos en francés, resumen, persistencia y exportación aprobados.
- [ ] Ampliar casos reales: respuestas incorrectas, pistas, cuota y credencial inválida.
- [x] Probar recuperación ante timeouts y respuestas 503 transitorias; [ ] probar cuota agotada, credencial inválida y respuesta JSON inválida con el proveedor real.
- [x] Latencia observada en el último smoke API: 96,7 s en pt-BR y 30,8 s en fr-FR. La sesión real de navegador también superó varios 503 y dos timeouts de intentos individuales gracias a reintentos manuales acotados. [ ] Medir costos y latencias en varias sesiones/modelos antes de seleccionar proveedor de producción.
- [x] Usar únicamente información ficticia durante pruebas iniciales.

## Etapa 6 — Prueba humana y experiencia de usuario

**Estado: preparación parcial.** El plan de prueba humana está preparado en `HUMAN_TEST_PLAN.md`; aún no iniciar la prueba amplia porque falta validar la voz en dispositivos reales y completar la cobertura de pistas/explicaciones.

- [x] Cobertura de audio en código para `speechSegments` IA, opciones, respuestas modelo, pistas y explicaciones locales pt-BR/inglés, feedback, repaso y vocabulario del resumen. La validación auditiva real sigue pendiente.
- [x] El contrato IA usa `speechSegments` con `text`, `language` y `locale`; el prompt separa el idioma objetivo del texto auxiliar en español. El backend rechaza segmentos cuyo locale no coincida con el seleccionado.
- [x] La selección de voz consulta dinámicamente `SpeechSynthesis.getVoices()` y prioriza coincidencia exacta de locale, con fallback por idioma. E2E simula voces `pt-BR` y `fr-FR`; falta validación auditiva en dispositivos reales.
- [x] La cobertura efectiva depende de las voces instaladas en el navegador/sistema operativo; si no hay coincidencia, el sistema conserva el locale solicitado, informa el fallback y no bloquea la práctica. La disponibilidad auditiva debe confirmarse en los dispositivos reales.
- [x] Control global de audio con estado accesible, iconos 🔊/🔇 y preferencia persistida en `localStorage`; E2E valida desactivación y reactivación.
- [x] Botón de reproducción manual por fragmento, con locale propio; E2E verifica reproducción en portugués y francés. El vocabulario del resumen también ofrece reproducción manual y lectura automática; E2E verifica el caso francés.
- [x] La reproducción cancela la locución anterior; el cambio de turno, la desactivación global y la salida a una nueva sesión/repaso detienen la locución.
- [x] No leer automáticamente instrucciones ni explicaciones en español salvo que español sea el idioma objetivo: el audio IA consume solo `speechSegments` etiquetados con el locale objetivo y el backend rechaza cualquier segmento con locale distinto.
- [x] El controlador gestiona API ausente, voz no instalada y errores de reproducción sin bloquear la práctica escrita; el fallback se comunica en la interfaz. Falta prueba en navegadores/dispositivos reales.
- [ ] Validar la selección de voz, pronunciación y fallback en los idiomas objetivo habilitados, incluyendo portugués brasileño e inglés como casos iniciales, y comprobar que incorporar otro idioma no requiera modificar la lógica de audio. Probar en móvil y escritorio, con teclado y lectores de pantalla.
- [x] E2E en Chromium con viewport móvil de 390 px y escritorio; setup y lección no presentan desbordamiento horizontal.
- [ ] Prueba auditiva y de interacción en dispositivos móviles y de escritorio reales.
- [ ] Portugués brasileño: naturalidad, corrección, vocabulario y situaciones reales.
- [ ] Inglés: naturalidad, corrección y progresión.
- [ ] Verificar adaptación desde principiante hasta niveles superiores.
- [ ] Evaluar que no repita mecánicamente el mismo tipo de ejercicio.
- [ ] Comprobar pistas, feedback, repaso, progreso, exportación y resumen.
- [x] Preparar un plan reproducible de prueba humana en `HUMAN_TEST_PLAN.md`, con escenarios locales, IA real, audio, persistencia, exportación y seguridad.
- [ ] Corregir problemas observados y repetir la prueba.

## Etapa 7 — Seguridad y preparación de producción

**Estado: pendiente; no habilitar uso público antes de resolverlo.**

- [ ] Elegir hosting y configuración de producción.
- [ ] Añadir autenticación si habrá cuentas.
- [ ] Implementar cuotas por usuario y límites robustos compartidos entre instancias.
- [ ] Evaluar almacenamiento remoto, privacidad y eliminación/exportación de datos.
- [ ] Revisar condiciones del proveedor IA y tratamiento de datos.
- [ ] Configurar secretos y observabilidad sin exponer credenciales ni contenido sensible.
- [ ] Revisar accesibilidad, rendimiento y errores de producción.
- [ ] Completar revisión del PR y merge tras aprobar etapas anteriores.

## Etapa 8 — Replit, último paso

**Estado: aplazada deliberadamente.**

- [ ] No invertir tiempo en depurar Replit mientras continúe la auditoría en GitHub.
- [ ] Una vez aprobadas las etapas 4, 5 y 6, revisar configuración de ejecución y dependencias.
- [ ] Comprobar entorno Nix y comando de inicio.
- [ ] Sincronizar y probar la versión validada, evitando que Replit ejecute una rama o versión distinta.
- [ ] Confirmar endpoints y sesión real desde Replit.
- [ ] Si Replit vuelve a introducir errores que no existan en GitHub, aislar el problema de entorno sin alterar el código validado.

---

## Próxima acción concreta

71 tests y Browser E2E están aprobados en `2425e81`; el smoke API y la sesión real de navegador están aprobados en run #44122518840. El repaso cualitativo de patrones y las pistas progresivas IA con reproducción manual ya están implementados y validados en navegador. Próximo trabajo: completar cobertura de audio en las explicaciones donde haya fragmentos del idioma objetivo, validar voces en dispositivos reales y cerrar los pendientes funcionales y de seguridad antes de preparar la prueba humana.

## Criterio para declarar el proyecto listo para prueba humana

No basta con que el workflow pase. Se requiere:
1. Auditoría funcional cerrada sin defectos bloqueantes.
2. CI correcto en el último commit de código.
3. Una sesión real con el proveedor configurado. (Cumplido para Gemini 3.5 Flash-Lite mediante smoke test de tres turnos.)
4. Confirmación de persistencia, repaso, cierre y recuperación ante errores.
5. Lectura automática del idioma objetivo, control global de audio y reproducción manual validados.
6. Instrucciones de prueba humana preparadas.

El merge y la reactivación de Replit se mantienen posteriores a esas validaciones.


## Auditoría adicional de backend y seguridad — 17-11-2026

**Alcance:** revisión estática de `server/index.js`, `server/provider.js`, `src/app.js`, `src/core/speech.js` y `tests/api.test.js`, contrastada con los workflows aprobados del commit `9e3fd6f`.

### Controles confirmados en el código
- [x] Los archivos estáticos se limitan a `index.html` y recursos `.js`/`.css` dentro de `src/`; archivos de entorno, backend, scripts, dependencias y tests no se sirven.
- [x] La resolución de rutas valida que el archivo permanezca dentro de `src/`; existen pruebas para traversal codificado y rutas privadas.
- [x] Las respuestas incluyen `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- [x] El endpoint IA limita el cuerpo a 32 KB, el mensaje a 8.000 caracteres, las solicitudes a 60 por 10 minutos y la concurrencia a 2 por instancia.
- [x] Las solicitudes inválidas y el proveedor sin configurar no consumen la cuota.
- [x] La clave del proveedor se utiliza en backend; el frontend consulta únicamente el estado de configuración y el endpoint de tutor.
- [x] Los textos dinámicos de la interfaz revisados pasan por escape HTML antes de insertarse como marcado.

### Riesgos y limitaciones que siguen abiertos
- [ ] El rate limit es global en memoria: un visitante puede agotar la cuota compartida; además se reinicia al reiniciar la instancia y no coordina varias instancias.
- [ ] No hay autenticación ni cuotas por usuario/IP. No exponer públicamente antes de incorporar controles adecuados al hosting elegido.
- [ ] El progreso y las sesiones permanecen en `localStorage`; no hay sincronización ni recuperación entre dispositivos. En dispositivos compartidos, los datos permanecen accesibles al perfil local del navegador.
- [ ] Revisar la política de retención y el nivel de detalle de logs del proveedor. El backend registra proveedor/modelo, duración y mensaje de error del proveedor; no registra deliberadamente el texto del alumno, pero los errores upstream deben revisarse antes de producción.
- [x] El endpoint devuelve un mensaje público normalizado; no expone el mensaje interno ni el status upstream del proveedor. Los logs tampoco guardan el texto completo del error. Pendiente definir retención, acceso y monitorización de logs en el hosting.
- [ ] No se ha realizado una prueba de penetración ni una auditoría de despliegue; esta revisión de código no equivale a una certificación de seguridad.

### Estado de audio y flujo funcional
- [x] El controlador TTS cancela la locución anterior, respeta el control global y permite reproducción manual por fragmento.
- [x] Los fragmentos de voz IA se filtran por locale objetivo en backend; las pistas adicionales no incrementan el contador de turnos y conservan la actividad.
- [x] Se completó la cobertura de código para pistas y explicaciones locales pt-BR/inglés y segmentos IA; se añadieron pruebas automatizadas. [ ] Sigue pendiente validación auditiva en dispositivos reales.
- [ ] Evaluar el comportamiento de reintentos cuando el servidor procesa una petición pero la respuesta se pierde: actualmente no existe idempotencia por identificador de turno, por lo que un reenvío puede repetir una llamada al proveedor.

**Conclusión de auditoría:** no se detectó en esta revisión una ruta que permita servir archivos privados mediante el servidor estático. Los principales bloqueos restantes son de preparación para producción (identidad, cuotas compartidas, privacidad y observabilidad) y validación real de audio/calidad pedagógica. Mantener el PR sin merge y no desplegar públicamente.

## Validación funcional de audio — 17-11-2026

**Último commit validado:** `3877a33217121e9c8d44f08e8896fb3bbaa64b1f`.

- [x] La resolución de voz TTS prioriza locale exacto, luego voz genérica del idioma (por ejemplo, `pt`) y finalmente una variante regional del mismo idioma. Se agregó cobertura unitaria para el fallback genérico.
- [x] La reactivación de audio automático incluye también los fragmentos visibles del panel de resumen. Antes de este ajuste, el selector de reanudación omitía `#summary-content`.
- [x] E2E comprueba que al desactivar y reactivar el audio en el resumen se reanuda la lectura del vocabulario y se conserva el locale objetivo (`fr-FR`).
- [x] CI del último commit: Tests run `44200273995` aprobado; Browser E2E run `44200273975` aprobado.
- [x] La cobertura automatizada anterior también pasó en los commits intermedios de estos cambios.

### Pendientes que no quedan resueltos por CI
- [ ] Validación auditiva en hardware y navegadores reales; los tests simulan SpeechSynthesis y no prueban la calidad acústica de las voces del sistema.
- [ ] Completar una matriz de todas las vistas con fragmentos objetivo (pistas, feedback, explicaciones y resumen) y confirmar qué contenido debe leerse automáticamente, sin pronunciar texto auxiliar en español.
- [ ] Prueba humana de portugués brasileño e inglés, incluyendo naturalidad, pronunciación, progresión pedagógica y recuperación ante fallos del proveedor.

**Decisión:** los dos defectos específicos de audio corregidos están cubiertos y CI está verde. Esto no cierra la etapa 6 ni habilita merge, despliegue público o sincronización con Replit. Continuar con auditoría de cobertura de voz por vista y preparar la validación manual controlada.

## Cobertura de audio en la primera pista IA — 17-11-2026

- [x] La primera pista IA ahora reproduce automáticamente los fragmentos del idioma objetivo que están presentes en los `speechSegments` del turno y que coinciden con el texto de la pista.
- [x] Se conserva el filtro por locale; no se envía a TTS el texto auxiliar en español.
- [x] Browser E2E comprueba la reproducción automática de un fragmento francés (`fr-FR`) al solicitar la primera pista.
- [x] CI del commit de código `536c389bb3e78c3532a740fb9ed8fb95929800c9`: Tests run `44200969722` y Browser E2E run `44200969555` aprobados.
- [x] `HUMAN_TEST_PLAN.md` ampliado para incluir primera pista IA, reactivación de audio en resumen y fallback de voz genérica por idioma.

**Alcance:** esta corrección solo pronuncia los segmentos objetivos que el proveedor ya entrega y que aparecen en la pista. No sintetiza ni traduce automáticamente texto libre en español. La auditoría de todas las variantes de pistas/explicaciones y la validación auditiva real siguen pendientes.


## Reanudación de audio: solo fragmentos visibles — 17-11-2026

**Commits:** corrección `6b2b2acd8434f35366ea3e7f5f1941cd65aba717`; prueba E2E `794d853a7665d719306999389fe0b784b439e715`.

- [x] Al reactivar la lectura automática, el selector excluye controles de pronunciación que estén dentro de paneles ocultos y elementos sin caja visible en el documento.
- [x] La prueba Browser E2E cambia del resumen al panel de lección y verifica que se reproduce únicamente el fragmento visible, no vocabulario del panel oculto.
- [x] Tests para `6b2b2ac`: run `44202286168` aprobado.
- [x] Browser E2E para `6b2b2ac`: run `44202286184` aprobado.
- [x] Tests para `794d853`: run `44202291522` aprobado.
- [x] Browser E2E para `794d853`: run `44202291477` aprobado.

**Conclusión:** la reanudación automática respeta la vista visible y no debe leer fragmentos de paneles ocultos. La prueba usa SpeechSynthesis simulado; no sustituye la validación auditiva en Android y escritorio. Se mantiene pendiente la auditoría de cobertura de explicaciones/pistas y la prueba humana real.


## Cancelación de audio al avanzar el repaso espaciado — 18-11-2026

**Commits:** corrección `5a562b73db2367036faf9c02de662b25bac125f6`; prueba Browser E2E `c081f496dd7ca67163ca8e9daa81b45e3ed7cb03`.

- [x] Se detectó que al pasar a la siguiente tarjeta de repaso espaciado podía continuar la locución automática de la tarjeta anterior.
- [x] `renderSpacedReview()` ahora detiene la voz antes de renderizar cada tarjeta, incluida la navegación entre tarjetas.
- [x] Browser E2E comprueba que avanzar desde una tarjeta cuya respuesta se acaba de pronunciar cancela la locución anterior.
- [x] CI del código `c081f49`: Tests run `44208647428` y Browser E2E run `44208647435`, aprobados.

**Alcance:** corrige la transición entre tarjetas del repaso espaciado. No sustituye la prueba auditiva en dispositivos reales ni cierra la auditoría global de audio.

## Normalización de errores del proveedor IA — 18-11-2026

**Commits:** backend `1e0b744b6aa2c3d885dd498b32ae20ed403d47e6`; prueba API `d10a3d1f36c0401f783d161acb36b3c56c59ae5b`.

- [x] El endpoint ya no devuelve al navegador el mensaje interno de excepción del proveedor ni su código HTTP upstream; responde con un mensaje genérico y estado 502.
- [x] Prueba API de regresión confirma que un error simulado con detalle interno no aparece en la respuesta pública.
- [x] CI del commit de prueba `d10a3d1`: Tests run `44209021102` y Browser E2E run `44209021047`, aprobados.

**Alcance:** reduce la exposición de detalles internos al cliente. No sustituye la revisión de retención y acceso a logs del servidor, que sigue pendiente.

### Reducción de datos sensibles en logs IA — 18-11-2026

**Commits:** backend `ce8696c3792d92c147b5376dfdddfda81db6c919`; prueba `7e6860f7245944a4e44d7cad6f16c946cd4eb756`.

- [x] Los logs del proveedor ya no incluyen el texto completo del error upstream; registran proveedor, modelo, duración, tipo de error y status upstream cuando existe.
- [x] Prueba unitaria intercepta el log y confirma que el detalle sensible simulado no se registra.
- [x] CI del commit de prueba `7e6860f`: Tests run `44209349422` y Browser E2E run `44209349457`, aprobados. El HEAD documental `48ac3e1` también pasó ambos workflows.

**Alcance:** limita el detalle almacenado en logs de errores del proveedor. Aún debe definirse retención, acceso y monitorización de logs en el hosting de producción.

## Cancelación inmediata de audio durante acciones IA — 18-11-2026

**Commits:** código `356d2db6278b0a498dcbd232aed211ff112130e7`; prueba E2E `24503f8ff378dd0c9bbcf72842d6f68b50432c72`; plan humano `262fd24ce436c2c469fae14f629fda928513e903`.

- [x] Al solicitar una pista, la locución previa se cancela inmediatamente.
- [x] Al enviar una respuesta, la locución previa se cancela antes de esperar la respuesta de la API.
- [x] Si falla una solicitud IA, se detiene la voz de la actividad anterior.
- [x] Browser E2E comprueba cancelación al solicitar una pista adicional y al enviar respuesta.
- [x] CI del código `24503f8`: Tests run `44270792647` y Browser E2E run `44270792661`, aprobados. El HEAD documental `b4fc1de` también pasó Tests run `44270925154` y Browser E2E run `44270924865`.

**Motivo:** antes, la voz de la actividad anterior podía continuar durante la espera de una pista o evaluación; ahora la cancelación sucede en la interacción del usuario, no al renderizar la respuesta siguiente.

## Límite de tamaño para respuestas IA — 18-11-2026

**Commits:** validación `f5c3fe8680d0291b72688c73bdc84fa02ca44b55`; prueba `b713d0446dcbf36a79a50f6aa68d4830b2bc9587`.

- [x] El backend rechaza respuestas estructuradas del proveedor superiores a 16 KiB antes de devolverlas al navegador.
- [x] Prueba de regresión cubre una respuesta JSON sobredimensionada.
- [x] CI del commit de prueba `b713d04`: Tests run `44271230670` y Browser E2E run `44271230710`, aprobados. El HEAD documental `90297c8` tiene Tests run `44271256424` aprobado; Browser E2E run `44271256523` sigue en ejecución.

**Motivo:** limitar el tamaño de contenido generado por el proveedor evita respuestas anormalmente grandes que puedan degradar la interfaz y ampliar innecesariamente el historial enviado en turnos posteriores.

## Pronunciación de fragmentos en pistas y explicaciones locales — 18-11-2026

**Commits:** catálogo pt-BR `a5b98ff8ec37adf76b005470ddb0abd5c19775b7`; catálogo inglés `396331fad5fb02fd85510a183d727ef66a329bd3`; lógica `7be892007250a854b9612d3a3f9f8d54d9111746`; prueba E2E `526ade6a461eecaf5686081a81c4e94625eade58`; plan humano `3e819dcd7595c0a6d496a27d7d6e20523da2bd36`.

- [x] Los catálogos locales pt-BR e inglés anotan explícitamente los fragmentos objetivos que aparecen en sus pistas y explicaciones.
- [x] El tutor reproduce esos fragmentos y añade controles de reproducción manual, sin leer en voz alta la explicación completa en español.
- [x] La misma lógica se aplica al feedback de respuestas y al repaso espaciado; se conserva el locale de cada idioma.
- [x] Browser E2E añadido para verificar el fragmento `dia` en una pista y `Bom dia` en una explicación pt-BR.
- [x] CI de lógica y E2E: Tests `44271777573` y Browser E2E `44271777528` aprobados; la ampliación E2E `aa271f6` pasó Tests `44271899793` y Browser E2E `44271899857`. HEAD final de catálogo `5c4a840` pasó Tests `44272216627` y Browser E2E `44272216458`.

**Alcance:** los catálogos locales iniciales son pt-BR e inglés. El contenido de idiomas personalizados depende de los `speechSegments` proporcionados por el tutor IA y validados por el backend.

## Preparación de prueba humana controlada — 18-11-2026

**HEAD de código:** `5c4a840ebfceb0b0edee3ea807b7ef9ef5d851ec` — Tests `44272216627` y Browser E2E `44272216458`, aprobados.
**HEAD de documentación:** `c345281a97c2a0be3da8ad381551dfce158ed924` — Tests `44272649978` y Browser E2E `44272650018`, aprobados.
**Proveedor real:** smoke test pt-BR/fr-FR y sesión de navegador aprobados en run `44271223866`.

- [x] Cobertura automatizada de flujo local, tutor IA, pistas, feedback, resumen, persistencia, repaso, exportación y reintentos.
- [x] Audio automático/manual, locales objetivo, fragmentos de pistas y explicaciones, cancelación al cambiar de vista/acción y filtro de paneles ocultos cubiertos por pruebas.
- [x] `HUMAN_TEST_PLAN.md` actualizado para comprobar portugués brasileño, inglés local (`en`), francés IA (`fr-FR`), audio en Android/escritorio, persistencia y recuperación ante errores.
- [ ] Validación humana real: naturalidad pedagógica, pronunciación, voces instaladas, calidad auditiva y persistencia en el dispositivo/entorno del usuario.

**Decisión:** la auditoría automatizada está cerrada para iniciar una prueba humana controlada. Esto no habilita producción. Siguen pendientes autenticación, cuotas compartidas, retención/acceso a logs, idempotencia, hosting y revisión de despliegue. PR #2 permanece draft; no merge, despliegue público ni sincronización con Replit.


## Requisitos de producto móvil consolidados — 18-11-2026

**Especificación vigente:** [README.md](README.md), secciones 2 a 9 y 11.  
**Pruebas de aceptación añadidas:** [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md), sección 8.

- [x] Se registraron las decisiones nuevas en README: navegación Ruta / Ejercicios / Teoría / Estadísticas; barra inferior solo con iconos; Ruta minimalista sin métricas; idioma y audio en cabecera; sin sección Configuración.
- [x] Se registró el flujo Global/Repaso → preparación (duración, nivel, tema) → ejercicio a pantalla completa.
- [x] Se registró la decisión de no realizar diagnóstico inicial y comenzar directamente en el nivel elegido.
- [x] Se registró que cerrar con X, tras confirmar, descarta el progreso temporal de la sesión actual sin borrar el historial previo.
- [x] Se añadieron criterios de aceptación para recuperación de fallos IA, limpieza de estado entre sesiones/idiomas y comportamiento móvil.
- [ ] Implementar la nueva navegación y las pantallas Ruta y Teoría.
- [ ] Eliminar la pantalla/sección Configuración y mover selector de idioma a la cabecera global.
- [ ] Implementar el flujo de preparación y sesión a pantalla completa, con X y audio únicamente.
- [ ] Eliminar el diagnóstico inicial y asegurar que el nivel seleccionado se aplique desde la primera actividad.
- [ ] Corregir el bloqueo del tutor IA, incluyendo timeout, cancelación de solicitudes obsoletas, recuperación y reinicio del estado de actividad.
- [ ] Asegurar que el cierre confirmado descarta la sesión actual y no persiste datos parciales.
- [ ] Ejecutar pruebas unitarias, Browser E2E y validación en dispositivo móvil real.

**Importante:** este registro confirma que la especificación y los casos de prueba quedaron documentados. No significa que los cambios de interfaz y lógica ya estén implementados. La revisión del código de la rama muestra que la interfaz actual todavía contiene Inicio/Configuración, navegación con etiquetas, métricas en Inicio y ejercicios integrados en la misma vista; esos elementos siguen pendientes de sustituir conforme al README.


## Rediseño de navegación y sesiones — implementación inicial 18-11-2026

### Cambios realizados en código
- [x] `index.html`: cuatro secciones Ruta, Ejercicios, Teoría y Estadísticas; barra inferior icon-only; selector de idioma y audio en cabecera.
- [x] `src/styles.css`: estilo móvil, icono activo destacado, controles de cabecera, sesión a pantalla completa y diálogo de confirmación.
- [x] `src/app.js`: selección Global/Repaso, preparación de sesión, pantalla completa, cierre con descarte, ocultación de métricas y controles secundarios.
- [x] `src/app.js`: se eliminó el flujo de diagnóstico inicial; el nivel elegido se utiliza desde la primera actividad.
- [x] `src/app.js`: la sesión de repaso trabaja sobre un borrador temporal y solo persiste al completar los repasos.
- [x] `src/core/tutor-client.js`: timeout de 30 segundos y cancelación de solicitudes al abandonar la sesión.
- [x] `src/app.js`: al fallar IA, el usuario puede reintentar o continuar con el motor local.
- [x] `README.md`: se añadieron los detalles de implementación y pendientes.
 
### Pendiente de verificación
- [ ] Ejecutar `npm run check`.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run test:e2e`.
- [ ] Verificar en preview Render después de desplegar este commit.
- [ ] Prueba manual en Android real.
- [ ] Diseñar e implementar el contenido real y progresión del modo historia Ruta.
- [ ] Incorporar explicaciones didácticas reales en Teoría.
- [ ] Revisar duración efectiva de sesiones y equivalencia provisional de dos turnos por minuto.

**Estado:** primera implementación de la estructura móvil realizada en la rama. Todavía no está certificada por pruebas automatizadas ni prueba humana. No fusionar a main ni considerar lista para producción hasta cerrar las verificaciones anteriores.


## Refinamientos de interfaz móvil — 18-11-2026

**Rama:** feature/mobile-bottom-navigation.

- [x] Se sustituyó el acceso inicial por bienvenida con botón Iniciar.
- [x] Se rediseñó la barra inferior con Ruta/mapa, Ejercicios/pesas, selector central globo+bandera, Teoría/libro y Estadísticas/gráfico.
- [x] El selector de idioma abre mosaico; la selección estándar se persiste y vuelve a Ruta. Para idiomas personalizados se toma la región del locale como bandera cuando está disponible.
- [x] Ejercicios presenta Global/Repaso y los tres selectores en una sola pantalla; cantidad ahora son preguntas (5/10/15/20).
- [x] Estadísticas muestra barras de precisión de sesiones históricas reales, o estado vacío.
- [x] Teoría tiene contenido inicial de Gramática, Vocabulario y Expresiones para pt-BR e inglés.
- [ ] Falta implementar Ruta como flujo pedagógico real con tema/nivel fijos, hitos y guardado parcial.
- [ ] El criterio sugerido para Ruta (80% en cinco preguntas y actividad integradora) está documentado en README, pero pendiente de aprobación.
- [ ] Aún no se han ejecutado npm run check, npm test ni npm run test:e2e para esta revisión.
- [ ] Falta verificación visual y funcional en Android y confirmación de despliegue Render.

**Importante:** no declarar esta revisión lista para prueba humana hasta cerrar los tests, la verificación en móvil y la progresión de Ruta.

- [x] Se corrigió el retorno desde una sesión para mantener visibles las opciones de Ejercicios y sus desplegables. Último commit de código: `6eb031f`.


### Despliegue de refinamientos móviles — 18-11-2026
- [x] Render build y deploy completados correctamente para el commit de código `6eb031fb9b1051ad993df1e9ea8dbf4cd96f9472` (deploy `dep-dbuugt8u01pc73e2o700`).
- [x] El servidor arrancó y anunció el servicio disponible.
- [ ] Tests de proyecto y prueba visual/funcional Android aún pendientes; el build de Render no los reemplaza.


## Revisión pedagógica y de contenido — 18-11-2026

**Rama:** feature/mobile-bottom-navigation.

- [x] Ruta con evaluación de 10 preguntas, umbral de dominio 8/10 y actividad integradora.
- [x] Guardado independiente de progreso parcial en Ruta; se puede salir y reanudar.
- [x] Ejercicios: 3 primeras preguntas con alternativas y luego escritura, independientemente del nivel.
- [x] Feedback neutral diferido a la pregunta siguiente; respuesta modelo con control de pronunciación.
- [x] Teoría con listado de temas y diapositivas a pantalla completa con navegación anterior/siguiente.
- [x] Mosaico de 23 idiomas estándar y alta de idiomas no listados mediante nombre únicamente; no se pide locale. El locale reconocido se infiere internamente.
- [x] Explicación emergente de variantes ortográficas inglesas (p. ej. color/colour).
- [x] Bienvenida desaparece al pulsar Iniciar y no se repite tras guardar idioma.
- [x] Ruta funciona con ejercicios locales para portugués/inglés y con tutor IA para otros idiomas cuando el proveedor está configurado; los borradores quedan separados por idioma.
- [ ] Ampliar el catálogo de unidades y revisar el contenido de la primera unidad.
- [x] GitHub Actions: npm run check, npm test y Browser E2E completados correctamente en el commit 3eef3801.
- [ ] Validar visual y auditivamente en Android real.

## Corrección de feedback, bienvenida y teoría — 18-11-2026

- [x] La pantalla de bienvenida ya no se salta al iniciar con idioma guardado; requiere pulsar Iniciar.
- [x] Feedback local e IA permanece al final de la pregunta actual. No hay avance automático; botón Continuar. El prompt IA evita repetir la respuesta o listar vocabulario/pronunciación en el mensaje de transición.
- [x] Alternativas colorean respuesta correcta en verde y opción incorrecta seleccionada en rojo; explicación adicional solo cuando hay error.
- [x] Se ocultan los bloques de texto Pronunciación/Vocabulario; se mantienen los controles de audio y lectura completa de la pregunta. Los ejemplos de escucha en portugués/inglés pronuncian la frase completa y piden su traducción al español; los ejercicios con hueco pronuncian la frase dejando pausa.
- [x] Teoría de pronombres en tabla bilingüe con audio por fila y contenido aplicado de artículos, ser/estar y tiempos presente/pasado/futuro para los 23 idiomas estándar.
- [x] Navegación entre secciones reinicia la vista en el inicio de cada sección.
- [x] Ruta guarda y restaura el feedback pendiente de la pregunta actual.
- [x] CI (npm run check, npm test y Browser E2E) aprobado en el commit `e227eea`.
- [x] Preview Render desplegado en estado `live` para el commit `e227eea` (deploy `dep-dbv2si8u01pc73clh3u0`).
- [ ] Validar el flujo visual y auditivo en Android real.



## Correcciones solicitadas — 18-11-2026 (siguiente iteración)

**Rama:** `feature/mobile-bottom-navigation`.

- [x] Ruta ahora tiene un único banner: tras el primer inicio cambia a **Continuar recorrido** y guarda el estado inicial antes de la primera respuesta. La ruta no se reinicia al volver a pulsar el banner.
- [x] Se retiró el mensaje gris de transición del tutor por encima de cada consigna.
- [x] Se ajustó la pronunciación de preguntas mixtas: extrae el segmento de la consigna, conserva el locale objetivo y transforma guiones bajos simples/múltiples en pausa.
- [x] El tutor no debe reproducir segmentos de voz en el idioma de origen como si fueran el idioma objetivo.
- [x] El botón de envío de respuesta escrita se elimina tras el envío correcto; el feedback permanece y el avance depende de Continuar.
- [x] El prompt IA exige actividades cerradas y verificables; no admite preguntas abiertas de preferencias sin respuesta modelo.
- [x] Los errores concretos quedan disponibles inmediatamente en Repaso al persistir la sesión; los patrones cualitativos conservan el primer intervalo de un día.
- [x] Teoría de italiano ampliada con artículos, *passato prossimo*, *futuro semplice*, ejemplos traducidos, vocabulario y expresiones aplicadas.
- [ ] CI completo pendiente de ejecución/confirmación sobre el último commit.
- [ ] Prueba visual y auditiva en Android pendiente.
- [ ] Completar y revisar el contenido aplicado de teoría para el resto de los idiomas; no asumir que la cobertura es homogénea.

### Diseño futuro (no implementado)
- Modo de comprensión lectora con textos originales o de dominio público/licencia abierta verificada, atribución y preguntas cerradas basadas en el texto.
- Clip cultural de 1–2 segundos asociado a cada bandera, usando exclusivamente grabaciones cuya licencia concreta esté verificada como dominio público o compatible.


### Validación cerrada de la iteración — 18-11-2026
- [x] `npm run check` y tests unitarios aprobados en GitHub Actions run `44424442155`.
- [x] Browser E2E aprobado en run `44424442327`, incluyendo banner único de Ruta, locución por locale, exclusión de fragmentos en español en el audio objetivo y desaparición del botón de envío de texto.
- [x] Render preview `live` con código `32673f0`, deploy `dep-dbv3kuhsrm7s73bap9n0`.
- [ ] Validación manual Android: comprobar voz real, pausas en huecos, apariencia y áreas táctiles.

## Iteración funcional — 18-11-2026

**Estado: implementación parcial; CI y Browser E2E aprobados; preview desplegado; prueba humana pendiente.**

- [x] La evaluación local acepta `expectedAnswer` además de `target`, y admite tolerancia de un error tipográfico cuando el ejercicio lo habilita.
- [x] La interfaz de ejercicios IA presenta feedback determinista inmediato antes de esperar la respuesta del tutor para preparar la siguiente actividad.
- [x] El prompt del tutor exige consignas en idioma objetivo y actividades integradoras cerradas.
- [x] Ruta evita reutilizar ejercicios respondidos y busca ejercicios aún no usados en el catálogo completo antes de finalizar por agotamiento.
- [x] Hito integrador local usa una tarea de traducción delimitada en lugar de una presentación abierta.
- [x] Resumen reducido a un único título (Resumen) y los apartados Aciertos, Errores, Vocabulario y Temas.
- [x] Estadísticas comparativas por idioma y gráfico lineal de precisión diaria.
- [x] Palabras de texto objetivo seleccionables: se muestra la traducción registrada o se solicita una traducción contextual al tutor IA cuando hace falta.
- [x] README y plan de prueba humana actualizados en esta iteración.
- [x] Ampliar Teoría con artículos comparativos para inglés, portugués brasileño, francés y alemán; vocabulario y expresiones aplicados para inglés y portugués brasileño.
- [ ] Completar la auditoría pedagógica de los demás idiomas: aún hay categorías de vocabulario/expresiones con contenido genérico y artículos sin suficiente detalle.
- [x] Tests automatizados aprobados en el commit desplegado.
- [x] Browser E2E aprobado en el commit desplegado.
- [ ] Validar latencia, corrección y consulta de palabras en Android real.
- [x] Desplegar manualmente a Render; deploy `dep-dbv59grl550s738ontg0` confirmado `live`.

**Riesgos conocidos:** la corrección inmediata de ejercicios IA utiliza la lista cerrada de respuestas aceptadas para evitar falsos positivos. Si el tutor no incluye una variante válida en `acceptedAnswers`, podría producir un falso negativo; por eso debe probarse con respuestas equivalentes reales y ampliar el conjunto de variantes donde corresponda.

- [x] E2E ampliado para probar traducción contextual por palabra y la vista de Estadísticas.

- [x] La selección de palabras dentro de una alternativa no dispara la respuesta; el envío requiere tocar el área de la opción fuera de la palabra.

- [x] El texto clicable distingue consignas marcadas en idioma objetivo de las instrucciones de apoyo en español.

- [x] Los aciertos se resaltan en verde en el resumen; las respuestas erróneas se marcan en rojo y muestran la solución.

- [x] La selección de palabras utiliza segmentación por idioma y contempla sistemas de escritura sin espacios entre palabras.

- [x] Se eliminó el texto de estado redundante que aparecía debajo del resumen.

- [x] Caso E2E de falso positivo añadido: una respuesta de otro idioma no se acepta aunque la evaluación simulada del tutor diga «correcta».

- [x] La paleta del gráfico se genera por cantidad de idiomas, evitando repetir los ocho colores iniciales.

- [x] Se corrigieron las referencias restantes a la paleta anterior en puntos y leyenda del gráfico.

**Último commit desplegado:** `459e10c46861aa31a344db1e14b424bdfee2ccad`  
**Preview:** https://adaptive-language-tutor-preview-5b3d.onrender.com/  
**Siguiente validación:** prueba humana Android; completar Teoría en los idiomas restantes.


## Iteración actual — 18/19-11-2026

- [x] Selector de estadísticas: 🌐 Global e idioma individual.
- [x] Comparación global mediante barras de precisión y línea punteada de promedio.
- [x] Vista por idioma con preguntas respondidas y precisión por día practicado; máximo 15 días activos, numerados sin fechas.
- [x] Eliminadas las traducciones emergentes al seleccionar palabras.
- [x] Instrucciones en español separadas del texto a evaluar en los ejercicios locales y en la presentación del tutor IA.
- [x] Resumen compacto: Aciertos y Errores con cifras sobre el total; se conserva el detalle de respuestas erróneas.
- [x] Repaso: un error conserva la tarjeta vencida; solo un acierto la mueve al siguiente intervalo.
- [ ] Validación humana Android de escalado del gráfico, legibilidad de etiquetas y flujo de repaso.

## Iteración de refinamiento — 19-11-2026

- [x] Gráficos de estadísticas ampliados: barras/puntos, trazos, tipografía y leyendas; el tamaño se conserva en móvil con scroll horizontal.
- [x] Eje horizontal de actividad diaria: título «Días» y marcas numéricas 1…15 sin repetir la palabra.
- [x] Feedback de ejercicios IA: «Continuar» aparece inmediatamente y espera de forma segura al resultado de la siguiente actividad.
- [x] Veredicto local determinista: el modelo no puede convertir una respuesta incorrecta en correcta ni provocar elogios contradictorios.
- [x] Eliminado el bloque gris de respuesta anterior en el hito integrador.
- [x] Hito integrador de Ruta: pistas progresivas para portugués e inglés y persistencia del nivel de pista.
- [x] Icono de Ruta sustituido por un mapa del tesoro con línea segmentada y destino marcado.
- [ ] Auditoría pedagógica completa de Teoría: siguen faltando explicaciones aplicadas en varios idiomas/temas; no marcar como resuelto.
- [x] Tests unitarios y comprobación estática: [GitHub Actions 44456571620](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44456571620).
- [x] Browser E2E: [GitHub Actions 44456571650](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44456571650).
- [x] Deploy manual Render LIVE: [dep-dbv7ee3rjlhs73b4lr9g](https://dashboard.render.com/web/srv-dbus3hnf3r2c739j9ir0/deploys/dep-dbv7ee3rjlhs73b4lr9g), commit `33db475`.
- [ ] Validación humana Android.

- [x] Consigna del hito integrador formulada en español y pistas progresivas disponibles tanto tras un error como mediante el botón «Pista».
- [x] Nivel de pista guardado en el borrador de Ruta para continuar tras recargar.

- [x] «Continuar» permanece habilitado mientras se prepara el siguiente turno; un toque anticipado se encola y avanza automáticamente al terminar la solicitud.

- [x] El control «Pista» se muestra explícitamente durante el hito integrador de Ruta; las acciones auxiliares permanecen ocultas en el resto de la sesión.

## Refinamiento 19-11-2026
- [x] Aviso de voz fallback retirado de la interfaz; TTS continúa usando el locale pedido y fallback del navegador.
- [x] Cabecera compactada y títulos de pantalla centrados.
- [x] Gráficos limitados al ancho disponible, sin scroll horizontal.
- [x] «Global» renombrado «Práctica»; controles de nivel/cantidad/tema ocultos en Repaso.
- [x] Consigna y frase objetivo se pronuncian en segmentos con locale separado.
- [x] Tres pistas progresivas para respuestas escritas.
- [x] Portugués: pasado/futuro ampliados con formas por pronombre, ejemplos, regla y excepciones.
- [x] Tests unitarios y Browser E2E aprobados; Preview desplegado en Render. [ ] Solicitar y completar prueba humana Android.
- [ ] Próxima fase: paquetes de contenido offline y motor local determinista para reducir llamadas IA en tiempo real.
- [ ] Roadmap: módulo de comprensión lectora con textos originales/de dominio público/licencia abierta, y lecturas de noticias didácticas con fuentes.
- [ ] Política obligatoria: registrar procedencia/licencia/atribución y verificar derechos antes de incluir cada texto.

- [x] Se prioriza el motor local cuando el paquete del idioma contiene ejercicios suficientes para la sesión; la IA en tiempo real queda como respaldo para catálogos insuficientes.

- [x] Tests unitarios y análisis estático: [44570968240](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570968240) — success.
- [x] Browser E2E: [44570968307](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570968307) — success.
- [x] Render manual deploy LIVE: [dep-dbviiv60tbcc738k7o2g](https://dashboard.render.com/web/srv-dbus3hnf3r2c739j9ir0/deploys/dep-dbviiv60tbcc738k7o2g), commit d41a7cb532c02cb90153e41b877dfeaf5ba212e2.
- [ ] Prueba humana Android y revisión de calidad pedagógica por idioma.


## Iteración Ruta / Ejercicios / Estadísticas — 19-11-2026

### Implementado en la rama activa
- Ruta con cuatro unidades por tema: Fundamentos, Viajes y orientación, Comida y restaurantes, Trabajo y estudios.
- Desbloqueo secuencial por finalización y estrellas de la unidad previa. Umbrales: unidad 2 = 3 estrellas en unidad 1; unidad 3 = 5 estrellas en unidad 2; unidad 4 = 3 estrellas en unidad 3 (umbral alcanzable con el conjunto actual de tres preguntas).
- Puntaje de 0–5 estrellas basado en precisión; resumen por unidad y persistencia por idioma. Se conserva el mejor porcentaje/estrellas de cada unidad; repetirla con un resultado inferior no reduce el avance ni vuelve a bloquear unidades.
- Ruta organiza actividades en vocabulario/conjugaciones, contexto y frases completas. En catálogos locales, los temas se corresponden con los ejercicios disponibles; en idiomas con IA, el tutor genera contenido por tema.
- Reinicio de Ruta con diálogo de confirmación; borra solo el progreso de Ruta del idioma activo.
- Ejercicios: banner desplegable “Ejercicio” para duración/nivel/tema; “Repaso” inicia directamente.
- Pistas de dos pasos solo para respuestas escritas: “Pista” → “Ver respuesta”. Repaso conserva el tipo de respuesta original y las mismas reglas.
- Resumen centrado con porcentaje y mensaje de rendimiento; eliminado el subtítulo “Aciertos”.
- Gráfico de barras global ampliado con menor separación; conserva adaptación móvil sin scroll horizontal.
- Pictogramas SVG originales según el objeto/tema de cada actividad.

### Decisiones y límites
- El modo relato con personajes/escenas encadenadas y los ejercicios de emparejar vocabulario quedan en roadmap.
- Los catálogos locales disponibles para Ruta son portugués brasileño e inglés. Los otros idiomas muestran las cuatro unidades si el tutor IA está configurado; sin IA quedan en preparación.
- La prueba humana debe validar si los umbrales de estrellas y el tamaño de las unidades son pedagógicamente adecuados. No se considera finalizado hasta probar en Android.

### Commits y CI
- Cambios principales de Ruta: `81fc199`, `fb37fd2`.
- Cambios de interacción y revisión: `d054c72`, `2af2271`, `570d419`, `8ecbf2e`.
- Ajustes de visuales, fases y puntuación: `3e7c9cb`, `f43500d`, `7fa4a5b`, `a0eb84c`, `c52249b`, `e92f732`.
- Tests unitarios del código más reciente: success en run [44592541104](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44592541104).
- Browser E2E confirmado success en run [44592484301](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44592484301); la ejecución del commit `e92f732` estaba en curso al registrar esta actualización.
- Preview todavía debe recibir un deploy manual de la rama actual. El deploy anterior LIVE no contiene estos cambios.
- Prueba humana Android pendiente.


### Despliegue verificado — 19-11-2026
- Preview: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Render service: `adaptive-language-tutor-preview-5b3d` (`srv-dbus3hnf3r2c739j9ir0`).
- Deploy LIVE: `dep-dbvkeng8v5cc73aukf70`.
- Commit desplegado: `b7d6526cc8e3629e7898796948ee9cf4fc10e1e9`.
- Auto-deploy continúa desactivado; el despliegue se ejecutó manualmente tras validar la rama.
- Runtime logs confirman `npm start`, `node server/index.js`, escucha en `0.0.0.0:10000` y mensaje de Render “Your service is live”.
- Tests unitarios del código desplegado: success [44593625853](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44593625853).
- Browser E2E del HEAD desplegado: success [44593625642](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44593625642).
- [ ] Prueba humana Android pendiente; no se declara cerrada la iteración hasta recibir ese resultado.


## Iteración UI — 19-11-2026

- Actualización en feature/mobile-bottom-navigation: barras del gráfico global afinadas y retirada la media global segmentada.
- Teoría reorganizada para separar tablas, notas de reglas/excepciones y ejemplos posteriores.
- Práctica: retirado el botón antiguo «Repasar error» (se conserva la modalidad independiente Repaso); encabezado de tema/nivel alineado con contador y etiqueta del pictograma mantenida debajo del icono.
- Reproducción manual restringida al locale del idioma objetivo.
- E2E ampliado para comprobar estos criterios. Pendiente confirmar los resultados de CI y revisar visual/auditivamente en Android real.


## Iteración 20-11-2026 — teoría, estadísticas y comprensión lectora

- Teoría de portugués: tablas de pasado y futuro muestran únicamente pronombre y forma verbal; se conservan ejemplos debajo de la tabla, seleccionados como muestra y no repetidos por cada fila.
- Vocabulario de portugués: el tema Tiempo y fechas se organiza en días de la semana, meses, estaciones, partes del día y expresiones temporales. Se añadió el tema Números cardinales y ordinales con formas frecuentes y reglas de composición.
- Estadísticas: comparación global con grupo de barras compacto y centrado; los gráficos global y por idioma usan viewBox fijo y una zona de altura reservada para evitar saltos al cambiar la vista.
- Comprensión lectora: nuevo modo independiente dentro de Ejercicios, con seis preguntas piloto A1/A2 en portugués y seis en inglés, dos textos por idioma, comprensión literal, inferencia y vocabulario contextual. Las preguntas son de selección múltiple y el texto permanece visible entre preguntas.
- Las funcionalidades y los datos de lectura se preparan para portugués e inglés; la validación humana inicial sigue centrada en portugués.
- Pruebas automatizadas: `npm run check`, `npm test` y `npm run test:e2e` completados correctamente en GitHub Actions para el commit `8fc76fa4f9594233e0b5417a3b8144d4568b0624`. La validación humana en Android sigue pendiente.


## Implementación — revisión de lectura y teoría (20-11-2026)

**Cambios incorporados en `feature/mobile-bottom-navigation`:**
- Reglas y excepciones de pasado/futuro en listas separadas, con un punto por idea.
- TTS del pasaje lector con pausa y continuación; locale del idioma objetivo.
- La sesión de comprensión lectora distingue visualmente preguntas del pasaje y práctica general. En el catálogo actual, al completar las seis preguntas de lectura se ofrecen actividades generales para completar la duración configurada.
- Se amplió la extensión y profundidad del pasaje A2 de portugués e inglés; el orden de selección prioriza el nivel elegido y después la longitud.
- Nombre visible «Entrenamiento» y consigna final de Ruta convertida en traducción de frase concreta con variantes aceptadas explícitas.

**Validación pendiente:** ejecutar CI y Browser E2E sobre el commit resultante; comprobar TTS real y scroll en Android. No declarar validación humana completa.


## Validación — Entrenamiento, TTS y teoría (20-11-2026)

- [x] `npm run check` y `npm test` aprobados en GitHub Actions run [#44673507639](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44673507639), commit `552a556ab46292e4a206080438d0a4a0ded2a90d`.
- [x] Browser E2E aprobado en run [#44673507580](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44673507580), commit `552a556ab46292e4a206080438d0a4a0ded2a90d`. Incluye teoría de pasado, lectura TTS con pausa/continuación, distinción lectura/práctica general, última pregunta de traducción y flujo de hito final de Ruta.
- [x] Render Preview desplegado: `dep-dbvsjg59fdbs73bthtvg`, estado `live`, commit `f4db84df3d0b0314eb49955d5b3b0182c0b4773c`. El commit posterior `552a556` solo actualiza pruebas E2E; el código de aplicación y contenido desplegado ya coincide con la rama.
- [ ] Prueba auditiva real del TTS y verificación de pausa/continuación en Android.
- [ ] Revisión manual del scroll y legibilidad de los pasajes A1/A2 en un teléfono real.
- [ ] Validación humana final de las variantes aceptadas de traducción en Ruta y Entrenamiento.

La rama permanece `feature/mobile-bottom-navigation`; no se hizo merge a `main`.


## Correcciones móviles — 20-11-2026

Implementación en curso en `feature/mobile-bottom-navigation`:

- [x] Estadísticas globales: reemplazado el SVG de barras verticales de ancho fijo por filas horizontales que ocupan el ancho disponible en móvil vertical.
- [x] Ruta: puntuación calculada desde las respuestas de la unidad (sin incluir el hito integrador), con porcentaje y estrellas coherentes. Se normalizan registros antiguos para que un porcentaje ya obtenido no deje estrellas insuficientes por datos obsoletos.
- [x] Comprensión lectora: eliminado el fallback a práctica general. Si se solicitan más preguntas que las disponibles, se recorre cíclicamente el banco lector.
- [x] TTS: cada fragmento expone su locale; `promptLocale` se respeta explícitamente y los controles manuales indican el locale de reproducción.
- [x] Teoría: helper común para separar reglas y excepciones en listas; aplicado a los renderizadores generales, artículos y temas aplicados de pasado/futuro.
- [x] Browser E2E actualizado para cubrir lectura de 10 preguntas sin mezcla, barras en viewport 390×844, locales de audio y desbloqueo de la segunda unidad tras completar correctamente la primera.

**Pendiente de validación:** CI y Browser E2E del commit actual. Sólo después de su aprobación se actualizará Render Preview. La prueba auditiva real en Android y la comprobación visual en el teléfono siguen siendo validaciones humanas pendientes. No se ha hecho merge a `main`.


**Despliegue de la iteración móvil:** Render Preview confirmado `live` en `dep-dbvt4mqjnfac738bvpqg`, commit `a94588dc58f940027b7d17742e7d6c4908652e57`. Render reportó build exitoso y proceso Node iniciado. No se pudo confirmar el resultado de GitHub Actions desde el estado de checks consultado; no declarar CI/E2E aprobados hasta revisar sus runs. Validación Android manual sigue pendiente.


## Actualización 20-11-2026 — regresiones reportadas

**Cambios aplicados en la rama de trabajo:**
- El selector de comprensión lectora deja de reciclar preguntas ya contestadas; si se agota el banco, termina la sesión en lugar de reiniciar el índice.
- Los fragmentos de voz de preguntas locales se filtran por el locale objetivo; las instrucciones y preguntas en español permanecen visibles pero no se reproducen con la voz portuguesa/inglesa.
- La vista IA ya no usa como fallback una pregunta de idioma origen para TTS del idioma objetivo.
- Los botones de audio de opciones y respuestas de referencia se limitan al locale objetivo.
- La lectura incorpora controles de reproducción/pausa, reinicio y barra de desplazamiento basada en SpeechSynthesisUtterance.onboundary.
- Los sonidos de acierto/error se aplican también al repaso y a la evaluación integradora de Ruta.

**Pendiente de validar antes de declarar corregido:**
- Reproducir la evaluación final de Ruta y comprobar registro/desbloqueo real de unidades; el flujo necesita una prueba funcional completa y no debe darse por resuelto solo por el cambio de sonido.
- Verificar TTS en Android real, ya que la disponibilidad de voces exactas y los eventos de progreso dependen del navegador/dispositivo.
- Confirmar que la barra de lectura avanza y permite saltar a otra posición con las voces instaladas.
- Ejecutar npm run check, npm test y Browser E2E después de los cambios.

- Corrección adicional: el puntaje final de Ruta ahora usa los contadores de intentos realmente evaluados (`session.attempted` / `session.correct`); los turnos conversacionales IA marcados `not_applicable` dejan de contabilizarse como respuestas incorrectas. Pendiente validar progresión de unidad con sesión IA real.

## Iteración 20-11-2026 — TTS, Teoría, Ruta y simplificación del frontend

### Cambios aplicados en la rama activa
- [x] TTS local: se elimina la inferencia automática del locale de consignas ambiguas. Solo se reproducen segmentos con locale explícito o rol de idioma claramente declarado.
- [x] Motor de voz: si no hay voz instalada compatible con el locale solicitado, se omite la reproducción en vez de dejar que el navegador use una voz predeterminada del idioma origen.
- [x] TTS IA: se validan fragmentos por locale propio; las instrucciones se sintetizan en español y los fragmentos objetivos en el locale objetivo. Los controles manuales siguen limitados al idioma objetivo.
- [x] Teoría: reglas y excepciones pasan a listas numeradas; se separa el conjunto de excepciones del pasado del correspondiente al futuro para portugués brasileño.
- [x] Ruta: el resumen muestra estrellas y un único bloque «Reforzar:»; se ocultan porcentaje, subtítulos de errores/vocabulario/temas y datos redundantes.
- [x] Ruta: el resumen ofrece acción directa para iniciar la siguiente unidad desbloqueada o volver a Ruta si aún no cumple el umbral.
- [x] Actividad: contador debajo de los controles X/audio; icono de tema como primer elemento del contenido; códigos MCER en niveles de dificultad.
- [x] Frontend: se elimina el selector de cambio de idioma durante el uso y la opción de idioma personalizado. Se conserva la selección inicial entre idiomas disponibles.
- [x] Estado interno de IA oculto; no se expone estado «Tutor IA disponible» al usuario.

### Pruebas añadidas/actualizadas
- [x] Unit tests TTS: voz objetivo ausente no debe provocar fallback a voz fuente.
- [x] Browser E2E: orden contador/icono, ausencia de selector de idioma activo, resumen de Ruta con estrellas y refuerzo único, y avance directo a la siguiente unidad.
- [x] npm run check y npm test aprobados en GitHub Actions para el commit de código 1c7a684.
- [x] npm run test:e2e aprobado en GitHub Actions para el commit de código 1c7a684.
- [x] Build y deploy manual de Render completados; Preview LIVE en dep-dc03b03m8hqs739dqns0.
- [ ] Prueba auditiva real en Android con portugués y español; comprobar también comportamiento cuando falta la voz objetivo.
- [x] Revisión estática de los temas de teoría presentes (gramática, vocabulario y expresiones) y corrección de la separación pasado/futuro; queda pendiente validación pedagógica humana de ejemplos y traducciones.
- [ ] Verificar que cada elemento de «Reforzar» identifique correctamente palabra/habilidad/tema tras errores locales y de IA.
- [ ] Prueba humana de desbloqueo y continuidad de las cuatro unidades de Ruta.

### Límites de validación
Los cambios están guardados en GitHub; npm run check, npm test, E2E y el deploy Render están aprobados para el commit de código 1c7a684. La voz y el flujo pedagógico requieren prueba humana Android. No se ha modificado Replit ni se ha hecho merge a main.


## Iteración 20-11-2026 — correcciones solicitadas de Ruta, Teoría, navegación y TTS

### Cambios implementados
- [x] Ruta: resumen presenta siempre estrellas y valoración cualitativa, incluso si una sesión incompleta llega al resumen.
- [x] Ruta: se usa el mismo conjunto de intentos evaluados para calificación, estrellas y desbloqueo; los turnos no evaluables de IA no cuentan.
- [x] Ruta: el botón inicia la unidad siguiente y el panel de actividad expone el ID de la unidad activa para verificar que no se reabra la anterior.
- [x] Ruta: si faltan estrellas, el resumen informa el umbral y permite repetir; si no quedan unidades, permite volver al mapa.
- [x] Teoría: reglas y excepciones pasan de listas planas a jerarquías con categoría de primer nivel y subelementos anidados cuando hay dos puntos, semicolon o enumeración de excepciones.
- [x] Navegación: flecha icon-only común en esquina superior izquierda para detalle de teoría, lista de temas, setup cuando corresponde y sesión a pantalla completa.
- [x] Navegación: al retroceder o cambiar sección se detiene el audio de la pantalla anterior.
- [x] TTS: los fragmentos de consigna objetivo se agregan aunque el proveedor IA también entregue fragmentos de origen; el locale se compara sin distinguir mayúsculas/minúsculas.
- [x] TTS: teoría pronuncia automáticamente el primer fragmento objetivo al abrir un tema y mantiene botones de pronunciación manual en los elementos disponibles.
- [x] TTS: el controlador espera `voiceschanged` si Android todavía no entrega voces y cancela solicitudes pendientes al detener reproducción.

### Pruebas añadidas/actualizadas
- [x] Test unitario para reproducción diferida al cargar voces Android.
- [x] E2E para valoración cualitativa y estrellas de Ruta, lanzamiento real de la unidad siguiente, jerarquía anidada, TTS automático/manual y flecha común.
- [ ] Ejecutar `npm run check`, `npm test` y `npm run test:e2e` sobre el HEAD final.
- [ ] Build y deploy manual Render; auto-deploy permanece desactivado.
- [ ] Prueba humana Android: verificar voces disponibles y acento correcto en contenido de actividad y teoría.
- [ ] Prueba humana: recorrer las cuatro unidades, incluyendo el caso de puntaje insuficiente para el desbloqueo.


### Verificación final — 20-11-2026
- [x] `npm run check` y `npm test` aprobados en run [44771349574](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44771349574).
- [x] `npm run test:e2e` aprobado en run [44771349707](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44771349707).
- [x] E2E de Ruta: calificación/valoración, continuidad real a unidad 2 y retorno al mapa desde la última unidad sin repetirla.
- [x] E2E de Teoría: subcategorías anidadas para excepciones de pasado y futuro.
- [x] E2E de TTS: reproducción automática y manual en locale objetivo; test unitario de espera a `voiceschanged`.
- [x] E2E de navegación: flecha superior común en sesión y detalles de teoría.
- [x] Render Preview LIVE: `dep-dc0749ss728c73clirf0`, commit `6b1f36f`.
- [ ] Prueba humana en Android: confirmar voces instaladas, acento y reproducción en actividad y teoría.
- [ ] Prueba humana en Android: comprobar visualmente la flecha y el espaciado en pantallas reales.
- [ ] Prueba pedagógica: recorrer todas las unidades con distintos porcentajes y comprobar que los errores de «Reforzar» sean representativos.

### Iteración de audio, progresión y consistencia de actividades — 20-11-2026

- [x] TTS: el locale objetivo se conserva en `utterance.lang` aunque Chrome no exponga un objeto Voice coincidente; se deja la resolución final al motor del sistema sin asignar la voz española.
- [x] TTS: reproducción de secuencias serializada; cada fragmento comienza al finalizar el anterior. `voiceschanged` conserva su reintento y se agrega una espera acotada con reintento explícito si Android no emite el evento.
- [x] Ruta: unidad inicial renombrada a «Inicio del viaje»; capítulo 1 genera preguntas breves de vocabulario y mantiene ejercicios gramaticales etiquetados; capítulo 2 aplica en contexto y frases progresivas.
- [x] Ruta: persistencia del mejor puntaje por unidad y evaluación de desbloqueo desde el registro guardado; E2E ampliado al umbral de 3 estrellas.
- [x] Actividades: cabecera común con nombre de sección, contador y audio; barra de progreso debajo y porcentaje sincronizado con la pregunta actual; icono y etiqueta temática antes de la consigna.
- [x] Resumen: se omite «Reforzar» si no hay elementos que revisar.
- [x] Teoría PT-BR: tabla de terminaciones regulares, tabla de conjugación irregular y ejemplos aplicados con traducción parentética en segunda línea; tablas con desplazamiento horizontal controlado.
- [ ] Confirmar resultado real de GitHub Actions para los últimos commits.
- [ ] Desplegar el commit de código validado en Render Preview (auto-deploy desactivado).
- [ ] Prueba humana Android: escuchar audio automático/manual en actividad y teoría; comprobar pronunciación y que no se use voz española.
- [ ] Prueba humana Android: revisar barra, cabecera, progreso y ancho/legibilidad de tablas.
- [ ] Recorrer Ruta desde «Inicio del viaje» hasta el resumen; confirmar que el capítulo 1 enseña vocabulario/reglas y que la siguiente unidad queda disponible al alcanzar el umbral.

- [x] Teoría: los ejemplos de los demás temas de conjugación y tiempos verbales también usan tablas de pronombre/ejemplo; se conserva la traducción entre paréntesis y se coloca debajo cuando existe en el contenido.

- [x] Teoría PT-BR: las excepciones del futuro simple (dizer, fazer, trazer, pôr, ter, vir y ser) también están conjugadas para todos los pronombres en una tabla independiente.

- [x] Ruta: el capítulo 2 ordena las actividades por nivel y longitud de respuesta, de estructuras breves a frases más complejas.
- [x] Teoría PT-BR: el pasado cubre el conjunto de irregulares frecuentes en dos tablas conjugadas; el futuro simple muestra sus siete raíces irregulares conjugadas por persona.
- [x] TTS: callbacks de finalización/progreso quedan invalidados al detener o reemplazar una reproducción, evitando que audio viejo avance tras cambiar de pantalla.

- [x] TTS Android: no se cancela un motor inactivo antes de la primera utterance; cancelación solo si hay audio activo/pendiente/pausado y reanudación explícita antes de reproducir.

### Resultado final de validación y despliegue — 20-11-2026

- [x] `npm run check` + `npm test` — 90 pruebas aprobadas: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44781107121
- [x] Browser E2E — aprobado: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44781107099
- [x] Render Preview desplegado y estado `live`: `dep-dc07vl3ncjis7381n1d0`
- [x] Commit desplegado: `d9e98d3fbc70cfb23be41066f6a1959448effb24`
- [x] Servicio vinculado a `feature/mobile-bottom-navigation`, auto-deploy desactivado; Replit permanece intacto.
- [ ] Audio audible en Android real: pendiente de comprobación manual; las pruebas de navegador no demuestran reproducción física.
- [ ] Revisar visualmente tablas y navegación en Android real.
- [ ] Confirmar con una sesión real que la unidad siguiente aparece desbloqueada tras obtener 3 estrellas y sobrevive a una recarga.

## Iteración 20-11-2026 — Audio PT-BR, actividades comunes y Repaso recuperable

### Implementado
- [x] Se leyó README al inicio de la iteración y se registran aquí las reglas nuevas; esta sección supersede requisitos previos en conflicto.
- [x] Afinamiento de contenido y locales centrado en portugués brasileño (pt-BR). No se han actualizado otros catálogos de idioma.
- [x] Audio en Ejercicios, Ruta, integración, Comprensión lectora, Repaso y expresiones erradas del resumen. Cada fragmento conserva locale; secuencia normal origen → objetivo y lectura pasaje → pregunta.
- [x] Catálogo PT-BR: locales explícitos para consignas y separación de consignas mixtas donde era necesario.
- [x] Cabecera/contador/progreso/icono/etiqueta temática comunes. Ruta cuenta también la integración (7 preguntas en la unidad de prueba); lectura limita el total a la duración seleccionada y al banco único disponible.
- [x] Entrenamiento ordenado: Ejercicios → Comprensión lectora → Repaso.
- [x] Resumen: solo expresiones incorrectas con audio y traducción; omite «Reforzar» vacío; acciones centradas de volver, reiniciar y siguiente; Ruta solo muestra siguiente unidad cuando se desbloquea.
- [x] Repaso: cola de todas las palabras/frases pendientes; persiste cada calificación; cierre/recarga conserva tarjetas restantes y contador; reanuda la primera no completada. Las tarjetas falladas quedan pendientes para otra pasada.
- [x] Renderización de estado vacío de Repaso y limpieza de audio anterior al navegar.

### Validación automatizada
- [x] Tests y check: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44825579828
- [x] Browser E2E: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44825579907
- [x] E2E cubre secuencia de voces, controles manuales, lectura automática, Ruta integración, progreso y contador, resumen enfocado y reanudación de Repaso tras cierre/recarga.
- [ ] Audio audible en Android real: pendiente; el navegador automatizado solo valida llamadas/orden y controles, no que el teléfono emita sonido.
- [ ] Revisión visual final en Android real: espaciado, legibilidad y botones de resumen.

### Alcance pendiente
- No extender contenido ni reglas específicas de PT-BR al resto de idiomas hasta que el usuario dé por afinado el flujo portugués.
- Repetir después la validación de TTS y de interfaces con voces y contenidos propios de cada idioma.

### Despliegue final
- [x] Render Preview LIVE: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- [x] Deploy: dep-dc0c80k0916s73db0ftg; commit desplegado: 94aa33457e7d244f7679ae72186ad2916b5623e9.
- [x] Build exitoso y servicio iniciado; auto-deploy desactivado.
- [x] Replit permanece intacto; solo se trabajó en feature/mobile-bottom-navigation.
- [ ] La prueba audible real en Android sigue pendiente.



## Alcance temporal de navegación — 21-11-2026
- Base visual canónica: `feature/mobile-bottom-navigation`.
- Navegación: selector central destacado de Idiomas (solo Italiano visible); Ruta y Entrenamiento bloqueados; Teoría y Estadísticas disponibles.
- Tras bienvenida/selección de idioma se abre Teoría como primera sección disponible. Estadísticas conserva su implementación.
- Los módulos de Ruta y Entrenamiento no se eliminan ni refactorizan; quedan temporalmente inaccesibles desde la navegación.
- Preview canónico previsto: `https://adaptive-language-tutor-preview-5b3d.onrender.com`; verificar el commit LIVE antes de compartir.


## Implementación y preview canónico — 21-11-2026
- [x] Se conserva la estética de feature/mobile-bottom-navigation; la aplicación abre directamente en Teoría, sin pantalla de bienvenida intermedia.
- [x] Barra inferior de cinco posiciones: Ruta bloqueada, Entrenamiento bloqueado, Idiomas central destacado, Teoría y Estadísticas disponibles.
- [x] Selector central limitado a Italiano; el idioma activo se muestra como bandera sobre el globo.
- [x] Teoría y Estadísticas mantienen sus implementaciones existentes. Los módulos bloqueados no se borran.
- [x] npm run check y npm test aprobados en 7fc2cf5; Browser E2E aprobado en run https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44964132590.
- [x] Render preview canónico LIVE: 7fc2cf5404fa637722e78060a12df9b8ef11f394, deploy dep-dc12va0u01pc738jrqtg, URL https://adaptive-language-tutor-preview-5b3d.onrender.com.
- [x] Preview duplicado de reconstrucción archivado: rama preservada como respaldo, entrypoint original guardado en archive/rebuild-functional-baseline-index.html, servicio redirigido al preview canónico (deploy dep-dc12u5ou01pc738jnm40).
- [ ] Revisión humana final en dispositivo Android: apariencia, toque, reproducción de pronunciación y navegación.


## Ajuste de interfaz vertical y Teoría — 22-11-2026
- Se ajustó CSS para mantener las cinco posiciones de navegación en una sola fila en móvil, incluido Estadísticas.
- Se alineó el título principal de sección con el control de audio sin reducir el tamaño del título.
- Se compactaron las filas de temas de Teoría, conservando altura táctil y separación.
- La actualización visual está registrada en `src/styles.css`; pendiente ejecutar CI/E2E y verificar el preview en Android físico.
- Esquema pedagógico propuesto, aún no implementado: unidades por nivel MCER con objetivos comunicativos y subtemas agrupados en gramática, vocabulario y expresiones.


## Teoría: jerarquía, centrado y audio — 22-11-2026
- Se añadió navegación Nivel A1 → seis unidades → Gramática/Vocabulario/Expresiones → subtemas existentes.
- Se mantuvieron los subtemas y detalles existentes; las unidades nuevas son solo títulos y agrupaciones, sin contenido didáctico añadido.
- Se centraron los títulos principales, se subrayaron palabras/frases cortas y se retiraron sus controles de reproducción.
- Se eliminó la reproducción automática al abrir temas de Teoría; los controles restantes reproducen manualmente textos largos.
- Browser E2E actualizado para jerarquía, navegación atrás, título centrado y ausencia de play en subtemas cortos. Pendiente ejecutar pruebas, inspeccionar el preview y revisar en Android real.


## Teoría: navegación simplificada — 22-11-2026
- Se retiró la pantalla intermedia de categorías. Las unidades abren directamente la lista de subtemas, con icono de categoría junto a cada nombre.
- Se mantiene «A1 · Principiante» como encabezado de la vista de unidades y el nombre exacto de la unidad al abrir sus subtemas; encabezados alineados a la izquierda.
- Validación automatizada y despliegue de esta iteración pendientes de ejecución/verificación.


## Teoría: encabezados acumulativos y detalle en flujo — 22-11-2026
- [x] Se agregó el encabezado de nivel encima del encabezado de unidad en la lista de subtemas y en el detalle.
- [x] Las filas de encabezado mantienen altura fija y controles de retorno por nivel.
- [x] El detalle dejó de ser un overlay fijo a pantalla completa; ahora se presenta dentro del flujo de Teoría.
- [x] El encabezado del detalle muestra icono de categoría antes de su nombre.
- [x] Browser E2E actualizado para comprobar acumulación, altura, posición en flujo y retorno.
- [ ] Ejecutar y confirmar CI/E2E sobre el commit final.
- [ ] Confirmar despliegue LIVE del preview canónico; revisión visual en Android permanece pendiente.


## Navegación jerárquica de Teoría — 22-11-2026
- [x] Sustituir las listas de botones por tres selectores desplegables progresivos: Etapa, Unidad y Subtema.
- [x] Agrupar las opciones del selector de subtema mediante categorías Gramática, Vocabulario y Expresiones.
- [x] Eliminar el rótulo «Nivel» de la entrada principal de Teoría.
- [x] En el detalle, mantener categoría como rótulo y subtema como título principal; mostrar debajo la ruta «A1 · Principiante > unidad» en tamaño menor.
- [x] Dejar una sola flecha de retorno en el detalle; cambiar etapa/unidad desde los selectores, sin flechas adicionales.
- [ ] Ejecutar `npm run check`, `npm test` y `npm run test:e2e` sobre el commit resultante.
- [ ] Confirmar que Render Preview despliega el commit resultante y revisar en Android físico la interacción de los tres desplegables.


### Corrección de ciclo de navegación — 22-11-2026
- [x] Actualizar `showScreen("theory")` para usar el nuevo contenedor de selectores; retirar referencias a las antiguas listas de nivel/unidad/subtema.
- [ ] Revalidar CI y Browser E2E después de este ajuste.

- [x] El selector de Etapa utiliza un placeholder inicial para garantizar que la selección de A1 dispare la carga del desplegable Unidad.


### Confirmación de deploy y estado de pruebas — 22-11-2026
- [x] Render deploy `dep-dc19agetlv9c73bf6gu0` finalizó **LIVE**; commit `e9caf17995211d65d0f390032845f2d2536a7d23`.
- [x] Servicio preview canónico confirmado en la rama `feature/mobile-bottom-navigation`; URL https://adaptive-language-tutor-preview-5b3d.onrender.com/.
- [ ] Tests `npm run check`, `npm test` y Browser E2E para este commit: no verificados. La consulta disponible de runs de commit devuelve solo ejecuciones asociadas a PR y no encontró ninguna para este SHA; no se atribuye aprobación sin evidencia.
- [ ] Revisar la navegación de tres desplegables y el detalle en Android real antes de cerrar la iteración.


## Implementación de árbol de Teoría B2 — 22-11-2026
- Se reemplaza la navegación por selectores Etapa/Unidad/Subtema por un árbol compacto de unidades con ramificaciones independientes.
- B2 aplicado: bloques de unidad independientes con borde izquierdo azul; fondo azul tenue y borde más intenso en la unidad expandida; subtemas sangrados con conectores `├` / `└`.
- La numeración árabe se aplica solo a las seis unidades; los subtemas no llevan números.
- Estado de expansión exclusivo: una sola unidad abierta; abrir otra colapsa la anterior; tocar la unidad abierta la colapsa.
- Se conserva el detalle de teoría y la unidad expandida al regresar desde un subtema.
- Pruebas automatizadas de árbol y expansión exclusiva añadidas a Browser E2E. Estado de CI y despliegue: pendiente de verificación.


### Validación y despliegue de Teoría B2 — 22-11-2026
- Commit de código y pruebas: `af0680ca58eb3c33d2f4a92ce6372d650ce1c6f4`.
- `npm run check`: aprobado, GitHub Actions run [45057647408](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45057647408).
- `npm test`: aprobado en el mismo run.
- Browser E2E: aprobado, run [45057647416](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45057647416). Incluye orden/numeración de unidades, subtemas sin numeración, expansión exclusiva, apertura del detalle y conservación de unidad al volver.
- Render Preview: deploy `dep-dc1jkoajnfac738v4j7g`, estado **LIVE**, commit `af0680ca58eb3c33d2f4a92ce6372d650ce1c6f4`.
- El servicio continúa con auto-deploy desactivado; el despliegue fue manual y el commit de preview coincide con el código validado.
- La prueba humana en Android/móvil queda pendiente para confirmar fidelidad visual, densidad, interacción táctil y legibilidad.


## Ajustes de Teoría B2 e idioma italiano — 22-11-2026
- Se simplificó el marcador de cada subtema a un único punto y se eliminó la línea vertical secundaria. El borde izquierdo azul de cada bloque de unidad se mantuvo con sus reglas originales.
- La ruta de etapa/unidad se movió fuera del encabezado del subtema y quedó bajo el título de sección «Teoría».
- Se conservaron los botones de pronunciación manual para fragmentos objetivo cortos; el locale esperado en la interfaz actual es it-IT.
- Se amplió Browser E2E para validar marcadores, borde azul, orden de encabezado y llamada de voz manual en italiano.
- Commits de implementación: dae2d56000277b71f53f4bd8231a5c0b230c1830 (app), 89a7f5984b8a149d91806c7740f0eac30f9b2b95 (HTML), 3fe60831f3f00e06078110eb924c305c4a151270 (CSS), 04a11fe73764724df0030295740442df000be484 (E2E).
- Pendiente: CI, despliegue Render y prueba auditiva real en Android. No considerar validado el audio físico hasta esa comprobación.

### Validación final de Teoría B2 italiana — 22-11-2026
- `npm run check` + `npm test`: aprobados en GitHub Actions run [45060797598](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45060797598).
- Browser E2E: aprobado en [45060797728](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45060797728), incluyendo marcador único, borde lateral de unidad, ubicación de ruta y reproducción manual it-IT.
- Render Preview: LIVE, deploy `dep-dc1k48d9fdbs73b2ua70`, commit `c55822c0ce8434ab086f0067715124fd7333377f`.
- Pendiente únicamente la prueba humana auditiva/táctil en Android para confirmar la voz italiana del dispositivo y la experiencia visual real.


## Ajustes de tipografía, espaciado y audio directo en Teoría — 22-11-2026
- Etapa, unidad y subtema se igualan a 16 px, tomando como referencia el encabezado «A1 · Principiante».
- Se reduce el margen inferior del encabezado del detalle a 4 px y el padding superior del contenido a 2 px para acercar la primera explicación al título.
- El texto objetivo corto se vuelve interactivo: al tocarlo se reproduce directamente en italiano (it-IT), sin icono Play. Se reserva el icono para fragmentos de más de 48 caracteres.
- El texto tocable incorpora rol y foco de teclado; se mantiene el texto objetivo exacto y no la traducción.
- Browser E2E actualizado para comprobar tipografía, espaciado, locale, texto leído y ausencia de icono redundante.
- Pendiente: CI, despliegue Render y prueba auditiva en Android real.

### Validación final de tipografía y pronunciación directa — 22-11-2026
- `npm run check` + `npm test`: aprobados, run `45062976801`.
- Browser E2E: aprobado, run `45062980099`, commit de test `d6158c913ffbbf44500a3898b274c1b79ca31ebe`.
- Render Preview: LIVE, deploy `dep-dc1kf756e07s73dkg96g`, commit `91b939557b44c77173021d1cd8167729706073e1`.
- Prueba humana Android sigue pendiente: confirmar apariencia en pantalla física y audio italiano audible al tocar palabras/frases cortas; los iconos permanecen para textos extensos.


## Iteración de jerarquía A y acabado visual — 22-11-2026
- Se registró la elección de ramas abiertas sin celdas y categorías monocolor conservando los glifos actuales.
- Se ajustaron espacios verticales entre unidades y subtemas, subrayado punteado de texto objetivo y separación compacta entre título, contenido y controles Anterior/Siguiente.
- Se conserva el TTS manual con locale it-IT y la estructura de unidades existente.
- Validación automatizada y despliegue Render pendientes; requiere ejecutar `npm run check`, `npm test`, Browser E2E y confirmar deploy LIVE.

## 23-11-2026 — Teoría A: refuerzo de espaciado y detalle
- Commit CSS: `7f2b9bc90bb4e3a89107d06e37b25c2aab17489c`.
- Se refuerza la separación vertical de unidades y subtemas, con filas de subtema de 44 px como mínimo y separación de ramas de 13–14 px.
- Se conservan el borde lateral azul de unidades, la estructura abierta sin tarjetas, los glifos de categoría monocolor y la pronunciación directa it-IT con subrayado punteado.
- Se compacta el encabezado/ruta del subtema y el espacio previo a Anterior/Siguiente, conservando objetivos táctiles de 44 px.
- Deploy previo `dep-dc1pnqqvcj2c73d73ke0` confirmado LIVE con commit `bad4f055`; el nuevo commit aún requiere CI y despliegue.
- Pendiente: confirmar Actions (check/tests y Browser E2E), desplegar el commit CSS y verificar que Render quede LIVE. Revisión humana Android sigue pendiente.
- CI del commit `f34ea7e46538f3f30db57838e531f9be42a51a78`: Tests aprobados [45097695210](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45097695210); Browser E2E aprobado [45097695208](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45097695208).
- Render deploy `dep-dc1pskss728c73d3rnh0` iniciado para el commit `73d7f6ca2ce5f8784794c78ad6be9a8195a40b51`; pendiente confirmar LIVE.

## 23-11-2026 — Iconos y encabezado compacto de Teoría
- Se reemplazaron los glifos 文, Aa y “ ” por SVG lineales monocolor: libro abierto (Gramática), libro con A (Vocabulario), globos de conversación (Expresiones).
- Detalle: fila superior con flecha de retorno a la izquierda, ruta Etapa > Unidad centrada y contador de subtema a la derecha en formato 1/4. Categoría y título alineados a la izquierda en una segunda fila.
- La jerarquía conserva el diseño de ramas abiertas, unidades con borde lateral azul y subtemas identificados por icono.
- Browser E2E actualizado para validar el nuevo orden y el sistema de iconos. Pendiente resultado CI y deploy LIVE.
- Render Preview: **LIVE**, deploy `dep-dc1r1aqfngtc738drrhg`, commit de interfaz `9090b62ef89910dd3e551a323eb1137b10064442`.
- Tests unitarios/estáticos aprobados en el HEAD de la revisión. Browser E2E del commit `9cd1f5547f5926bcf0451516651b0900bfa65486` está en curso tras ajustar el selector de encabezado del test; los fallos previos fueron aserciones/selector de test, no un fallo de compilación.
- Pendiente: resultado final Browser E2E y prueba humana visual/táctil/auditiva en Android.
- Validación final del HEAD `9cd1f5547f5926bcf0451516651b0900bfa65486`: Tests [45105290863](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45105290863) y Browser E2E [45105290817](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45105290817), ambos aprobados.
- Render Preview **LIVE**, deploy `dep-dc1r1aqfngtc738drrhg`, commit de interfaz `9090b62ef89910dd3e551a323eb1137b10064442`. El commit posterior `9cd1f55` solo corrigió selectores de test.
- Pendiente exclusivamente la validación humana visual/táctil/auditiva en Android.


## 23-11-2026 — Encabezados fijos y marcadores de subtema
- Se confirma la alternativa A: inmovilizar en Teoría todos los niveles que funcionan como encabezado, a todo el ancho de la sección: título «Teoría», etapa y unidad expandida. Los encabezados se apilan con offsets para no cubrirse entre sí; el encabezado de unidad acompaña el desplazamiento de sus subtemas.
- Los marcadores de los subtemas aumentan de tamaño y grosor visual: punto azul de 8 px, conservando la sangría, iconos de categoría y filas táctiles.
- Browser E2E incorpora comprobaciones de posición sticky y tamaño del marcador.
- Pendiente: resultado CI, deploy manual Render (autoDeploy desactivado) y comprobación en Android real de que el apilamiento sticky no tape contenido al desplazarse.


### Validación final — encabezados fijos y marcadores — 23-11-2026

- CI final del HEAD `7f446f2b8277a862432d6145c71dea59ad36d65d`: Tests aprobados en [45115607032](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45115607032) y Browser E2E aprobado en [45115607075](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45115607075).
- Render Preview **LIVE**, deploy `dep-dc1sj97f3r2c73dl79ig`, commit `7f446f2b8277a862432d6145c71dea59ad36d65d`.
- Pendiente únicamente validación visual/táctil en Android real para comprobar el apilamiento sticky durante desplazamiento y la visibilidad de las nuevas viñetas.


## 23-11-2026 — Ajuste de jerarquía y encabezado del detalle de Teoría
- HTML: encabezado de detalle agrupado en un único bloque sticky hasta el título del subtema.
- JS: icono de Vocabulario sustituido por símbolo de traducción; eliminado el nodo de viñeta de cada subtema. Se conserva el TTS directo existente.
- CSS: cabecera de detalle con retorno / «Teoría» / audio; ruta debajo; categoría y título alineados a la izquierda. En el menú solo permanece sticky el título de sección.
- Commits: `ed5a6d7`, `13e0b6b`, `f2c2e7c`, `7380b42`, documentación `92e505e`.
- Validación automatizada y Render: pendientes de consultar para este HEAD. No se afirma despliegue ni aprobación de pruebas.
- Prueba humana Android: pendiente (visual, táctil y audio real it-IT).

- Corrección de visibilidad: al abrir un subtema se retiran las clases `hidden` de la ruta y del contador; antes permanecían ocultos aunque JS actualizara su texto. Commit `dbeb02b`.
- El HEAD actual incorpora también esta corrección documental y queda pendiente de CI/Render LIVE.


## 23-11-2026 — Ajuste de glifo, celdas y título único de Teoría
- JS: glifo de Vocabulario cambiado a «Aa». Se agrega estado explícito `is-theory-detail-open` al abrir/cerrar el detalle.
- CSS: nivel A1 en celda azul suave; unidades numeradas en celdas azul más tenue. En detalle se oculta el encabezado global duplicado y se amplía el título interno «Teoría» a 24 px; se compacta el encabezado hacia arriba.
- Commits de código: `edcc8f5`, `adafe63`. README: `8fc7d13`.
- No se ejecutaron aún pruebas automatizadas ni se confirmó Render LIVE. Prueba humana Android pendiente.


## 23-11-2026 — Contraste de jerarquía y encabezado de subtema
- Se cambió el glifo de Vocabulario de Aa a un SVG de intercambio/traducción entre idiomas; Gramática y Expresiones permanecen intactos.
- El nivel usa #173B65 y las unidades #315B85 con texto claro, reforzando contraste sin alterar el árbol ni su expansión.
- Se ocultó la cabecera global duplicada mientras se abre un subtema; queda la cabecera interna con retorno, «Teoría» y audio, y el contenido se eleva.
- Cambios en rama `feature/mobile-bottom-navigation`; validación CI/E2E y despliegue Render pendientes. No se afirma que el preview esté actualizado.


## 24-11-2026 — Corrección de categorías y legibilidad de Teoría
- JS: `openTheoryTopic` ahora sincroniza la categoría activa con cada diapositiva al abrir, avanzar o retroceder. Corrige el defecto reportado donde el contenido especializado seguía dependiendo de la primera categoría abierta, aunque los glifos correspondieran a otra.
- JS: glifo de Vocabulario simplificado a un globo con meridianos/paralelos como símbolo de idioma.
- CSS: celdas de unidad cambiadas a `#4B81B8`, con texto blanco.
- Browser E2E: añadidas aserciones de cambio de categoría a través de Gramática/Vocabulario/Expresiones y color de unidad.
- Commits: JS `c0743b6`, CSS `75444d3`, E2E `b4537c4`. README actualizado en `51754d4`.
- No se ejecutaron todavía checks ni E2E; Render LIVE no confirmado. Revisión visual/táctil Android pendiente.


## 24-11-2026 — Glifo de Vocabulario y contador del detalle
- HTML: el contador de subtema (1/4) se movió dentro de la fila del título, alineado al extremo derecho junto al nombre. Ambos quedan dentro del bloque sticky, por lo que permanecen fijos durante el desplazamiento.
- JS: el glifo de Vocabulario cambia del globo a una marca bilingüe «A ⇄ 文», que comunica visualmente traducción entre idiomas y evita el glifo anterior que no se reconocía bien.
- CSS: se ajustan proporciones del símbolo y se organiza la fila del título con nombre flexible y contador no comprimible a la derecha.
- Browser E2E: se añaden aserciones para comprobar que el contador está anidado en la fila del título y aparece una sola vez.
- Commits: HTML 80de502, JS aff80b3, CSS e1894a9, E2E 79bcab7.
- Pendiente: validar CI, Render LIVE y la lectura visual en Android real; no se declara el preview actualizado hasta confirmar el deploy.


### Seguimiento del preview sin cambios — 24-11-2026
- Se leyó README y se verificó que el servicio correcto es `adaptive-language-tutor-preview-5b3d`, servicio `srv-dbus3hnf3r2c739j9ir0`, rama `feature/mobile-bottom-navigation`.
- Causa confirmada: `autoDeploy=no`; los pushes a GitHub no actualizan este preview. La conexión Render requería indicar workspace explícito; se localizó `My Workspace` (`tea-dbus0u5g1s2s73coteeg`).
- Se inició manualmente el despliegue del commit `0bf2879569ca831759e42e39b0c23ba61ea78484`, deploy `dep-dc2ek6etlv9c73ft8kb0`. En la última consulta el estado era `update_in_progress`; no declarar LIVE hasta confirmarlo.
- GitHub Actions: `Tests` aprobado (run 45305871034). `Browser E2E` falló (run 45305871098) en una aserción anterior: el estilo de las celdas de subtema devuelve `rgba(0, 0, 0, 0)` en vez del azul claro esperado. La ejecución no alcanzó las nuevas aserciones del contador/glifo. Corregir/actualizar esa aserción y volver a ejecutar E2E antes de dar la revisión por validada.


## Ajustes de jerarquía y encabezados globales — 24-11-2026
- Vocabulario cambia su glifo a «abc».
- Numeración de unidades en color neutro; el nombre de unidad usa acento azul sobre fondo azul suave.
- Subtemas con sangría ampliada y columna vacía reservada para futuros checks de finalización provenientes de Ruta. La columna es solo espacio visual: no se simula progreso ni se conecta aún a datos.
- Encabezados sticky generalizados a las pantallas de sección, incluida Estadísticas.
- Browser E2E actualizado para verificar número/título, espacio reservado, glifo y encabezado de Estadísticas.
- Pendiente ejecutar CI, revisar el deploy Render y validar scroll en dispositivo Android. No declarar estos cambios probados visualmente hasta confirmar E2E/preview.


### Estado de validación — ajustes de jerarquía y títulos — 24-11-2026
- La implementación de interfaz está desplegada en Render Preview: deploy `dep-dc2et9ei0phs73alhth0`, **LIVE**, commit `3353d9aa04cfa14f356b5af85e1a021db906cd55`. El servicio mantiene auto-deploy desactivado; los despliegues posteriores requieren activación manual.
- En el HEAD de trabajo `a5f38843458a7e7f55fd09a9cb826502d36d5786`, `npm run check` y `npm test` aprobaron en Actions run [45308702322](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308702322).
- Browser E2E del HEAD `a5f3884` está en ejecución en run [45308702254](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308702254). Las dos ejecuciones previas detectaron aserciones antiguas que no coincidían con la jerarquía vigente (subtemas abiertos y ausencia de borde lateral); se actualizaron para comprobar el diseño real. No declarar E2E aprobado hasta que finalice la ejecución actual.
- La reserva de espacio para checks es visual; la integración de finalización de temas con Ruta aún no existe. La comprobación visual/táctil en Android real sigue pendiente.


### Seguimiento de CI — glifo abc — 24-11-2026
- Se corrigió el último selector E2E que todavía esperaba el glifo bilingüe anterior; ahora comprueba «abc».
- `npm run check` y `npm test` aprobados en el HEAD `e6e7f06f0509c823493a0a11975c9a097e80dfa4`, Actions run [45308897457](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897457).
- Browser E2E del mismo HEAD sigue en ejecución en [45308897430](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897430); pendiente resultado. El preview Render ya está **LIVE** en deploy `dep-dc2eu2dg1s2s73b4bdh0`, commit `3419279bb749c5164cc19baf8aad71609d55f825`, que incluye los cambios de interfaz y el glifo abc en minúsculas.


### Resultado final de validación — 24-11-2026
- Browser E2E aprobado en el HEAD `e6e7f06f0509c823493a0a11975c9a097e80dfa4`, Actions run [45308897430](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897430).
- Tests (`npm run check` + `npm test`) también aprobados en [45308897457](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897457).
- Render Preview **LIVE**, deploy `dep-dc2eu2dg1s2s73b4bdh0`, commit de interfaz `3419279bb749c5164cc19baf8aad71609d55f825`.
- Falta únicamente la revisión visual/táctil en Android real. La columna para checks sigue siendo una reserva visual hasta implementar la relación con progreso de Ruta.


### Ajuste fino de separación entre unidades — 24-11-2026
- Se compacta la separación vertical entre unidades: el árbol no añade gap y cada unidad deja solo 2 px de margen inferior. Las ramas abiertas conservan 4 px al final para separar el siguiente bloque sin crear un hueco excesivo.
- La numeración de las unidades se fuerza a color neutro `#263e59` tanto en estado normal como expandido; el acento azul queda reservado al nombre de la unidad.
- Browser E2E comprueba el color de la numeración y el nuevo espaciado. Pendiente CI y deploy manual de Render (auto-deploy desactivado), además de revisión en Android.


### Deploy del ajuste de separación — 24-11-2026
- Render Preview **LIVE**: deploy `dep-dc2fhh4s728c73aelb30`, commit `3713d5949797d382eb85b74b1d90a26fb719a6c8`.
- `npm run check` y `npm test` aprobados en Actions run [45313920290](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920290).
- Browser E2E [45313920332](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920332) sigue en ejecución al momento de esta actualización; no se declara aprobado todavía.
- La prueba humana en Android debe confirmar que la reducción de espacios se percibe adecuada y que el número sigue neutro al expandir la unidad.


### Corrección de numeración neutra y selector E2E — 24-11-2026
- Se mantiene el número de unidad en color neutro `#263e59` en estado normal y expandido; el acento azul corresponde exclusivamente al nombre de la unidad. La regla CSS ya está aplicada en `src/styles.css`.
- Se corrigió el E2E: el contenedor `#theory-tree` es el propio grid, no contiene un descendiente `.theory-tree`. La aserción de separación ahora consulta el elemento correcto y evita un timeout ajeno al comportamiento visual.
- La prueba verifica el color calculado del número (`rgb(38, 62, 89)`), el color del nombre (`rgb(49, 91, 133)`) y el espaciado entre unidades.
- Validación anterior: `npm run check` y `npm test` aprobados en run [45313920290](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920290); Browser E2E falló por el selector incorrecto en [45313920332](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920332). Nueva ejecución pendiente.
- Render Preview estaba LIVE en deploy `dep-dc2fmbbncjis73cr8c60`, que contiene el CSS de numeración neutra. El auto-deploy sigue desactivado.


### Corrección reforzada de color en jerarquías tras reporte «sigue igual» — 24-11-2026
- Se inspeccionó el HTML generado: la numeración y el nombre de unidad son spans separados dentro de cada fila.
- La hoja CSS acumulaba reglas históricas contradictorias para los números (tonos claros en revisiones anteriores) y dependía de que el último override prevaleciera. Para eliminar la ambigüedad de cascada, el renderizado de cada unidad ahora fija directamente en el elemento: número neutro `#263e59` y nombre azul `#315b85`, incluyendo `-webkit-text-fill-color` para consistencia en navegadores móviles.
- Browser E2E verifica tanto el color calculado como los estilos explícitos de ambos spans.
- Commits: implementación `88a4ce2a5ae84fba589d0a95f0cb74e5f7023c04`; prueba `29b53577655f6c16a9a3a298612b17ee83895d74`.
- Pendiente: ejecutar CI, publicar con limpieza de caché Render (auto-deploy desactivado) y verificar el resultado LIVE antes de solicitar nueva revisión visual Android.


### Validación y publicación de la corrección reforzada de numeración — 24-11-2026
- La implementación fija en el HTML generado el color del número de unidad en `#263e59` y el del nombre en `#315b85`, incluyendo `-webkit-text-fill-color` para navegadores móviles. El cambio de código está en el commit `88a4ce2a5ae84fba589d0a95f0cb74e5f7023c04`; las aserciones E2E en `29b53577655f6c16a9a3a298612b17ee83895d74` verifican estilo explícito y color calculado.
- En el HEAD `b647fac64e3180fc024c99decbd115ee846fa764`, Tests aprobados en [45317664026](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45317664026) y Browser E2E aprobado en [45317664032](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45317664032).
- Render Preview confirmado **LIVE**, deploy `dep-dc2g0ejrjlhs73ck877g`, asociado al HEAD `b647fac64e3180fc024c99decbd115ee846fa764`. Se publicó manualmente con limpieza de caché porque el auto-deploy está desactivado.
- Pendiente únicamente la comprobación visual/táctil humana en Android. La aprobación E2E confirma el comportamiento en el navegador automatizado, pero no sustituye la revisión en el teléfono del usuario.


## 25-11-2026 — Recuperación selectiva de contenido italiano sobre base de seis unidades
- Rama de trabajo aislada: `recovery/intermediate-theory-content`, creada desde el punto restaurado de `feature/mobile-bottom-navigation`.
- Se recuperó desde los commits de trabajo posteriores el render de Teoría italiana de Unidad 1, conservando la jerarquía de seis unidades de la base funcional. No se incorporó la reorganización de ocho unidades ni el cambio de distribución que provocó la regresión.
- Unidad 1: cuatro subtemas desarrollados (Saludos y despedidas, Decir el nombre, Cómo estás, Pronombres y ser/estar), con tablas bilingües «Italiano» / «Español».
- TTS: cada variante separada por «/» o salto de línea dispone de su propio control y reproduce únicamente su texto.
- Conjugación: tablas separadas de pronombres y verbos; encabezados «essere» y «stare» en cursiva y entre comillas angulares; columnas con tamaño tipográfico uniforme. CSS: 19 px escritorio / 17 px móvil.
- Browser E2E actualizado para verificar el árbol de seis unidades, contenido de los cuatro subtemas, pronunciación por variante y tipografía.
- Commits de código: `bd01acf` (contenido/render), `59006e1` (CSS), `8e23221` y `1b48823` (alineación de títulos). Pruebas: `b70baaa`.
- Estado: CI, `npm run check`, `npm test`, Browser E2E y revisión de diff pendientes. Render no actualizado; no solicitar prueba humana todavía.


### Validación de la recuperación selectiva — 25-11-2026
- HEAD validado: `c4cf342423e59d56d65d4008cf5bf4046876f64c` (código) más registro de validación en README.
- `npm run check` y `npm test`: aprobados, Actions run [45522922228](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45522922228).
- Browser E2E: aprobado, run [45522922093](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45522922093).
- El E2E verifica seis unidades, cuatro subtemas de Unidad 1, dos destinos tocables/pronunciables por variante, encabezados italianos en cursiva con comillas angulares y tamaños equivalentes en columnas verbales.
- No se desplegó a Render ni se integró aún en `feature/mobile-bottom-navigation`. Pendiente revisión del diff/merge y después prueba humana Android.

## 25-11-2026 — Pulido de contenido y estructura de Unidad 2
- Se confirmó en código que Unidad 2 ya tenía cuatro subtemas desplegados, aunque algunos datos no correspondían a los títulos: Países e idiomas mostraba saludos, Artículos y adjetivos heredaba una lección de verbos, y Edad y procedencia mostraba indicaciones de transporte.
- Se corrigió la correspondencia pedagógica: pares país/idioma; concordancia de adjetivos italianos (-o/-a/-i/-e y formas en -e); expresiones de edad y procedencia con variantes formales e informales.
- Artículos y concordancia: reglas prácticas de artículos definidos/indefinidos, género, número, sonido inicial y apóstrofo se presentan en el párrafo introductorio antes de las tablas.
- CSS: todas las tablas de Teoría usan ancho completo y distribución uniforme de columnas, con ajuste de texto para móvil.
- TTS: variantes divididas por barra, salto de línea, guion largo y guion espaciado conservan controles de pronunciación separados.
- Browser E2E amplía cobertura a los cuatro subtemas de Unidad 2 y valida títulos, contenido, reglas previas a tablas, variantes TTS y columnas equilibradas. Se corrigieron errores de navegación de la prueba; último run `45606335111` sobre `e08b88c` pendiente al registrar este estado.
- `npm run check` y `npm test` aprobados en run [45606123743](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45606123743), commit `26c848e`.
- Render no actualizado; rama principal intacta. No integrar ni desplegar hasta Browser E2E aprobado y revisión del diff.