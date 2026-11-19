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
- [ ] Ejecutar tests unitarios y Browser E2E de esta iteración; desplegar Preview y solicitar prueba humana Android.
- [ ] Próxima fase: paquetes de contenido offline y motor local determinista para reducir llamadas IA en tiempo real.
- [ ] Roadmap: módulo de comprensión lectora con textos originales/de dominio público/licencia abierta, y lecturas de noticias didácticas con fuentes.
- [ ] Política obligatoria: registrar procedencia/licencia/atribución y verificar derechos antes de incluir cada texto.

- [x] Se prioriza el motor local cuando el paquete del idioma contiene ejercicios suficientes para la sesión; la IA en tiempo real queda como respaldo para catálogos insuficientes.

- [x] Tests unitarios y análisis estático: [44570456063](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570456063) — success.
- [x] Browser E2E: [44570456053](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570456053) — success.
- [x] Render manual deploy LIVE: [dep-dbvihnafngtc73cctgr0](https://dashboard.render.com/web/srv-dbus3hnf3r2c739j9ir0/deploys/dep-dbvihnafngtc73cctgr0), commit 6857c44.
- [ ] Prueba humana Android y revisión de calidad pedagógica por idioma.
