# Registro de estado del proyecto — Adaptive Language Tutor

**Última actualización:** 17-11-2026  
**Rama:** `feature/ai-tutor-pedagogy`  
**Pull request:** [#2 – Improve adaptive tutor pedagogy and AI integration](https://github.com/asotomayorb/adaptive-language-tutor/pull/2)  
**Estado global:** sesión real Gemini aprobada (3 turnos, 5 fragmentos `pt-BR`); tests y Browser E2E aprobados en `9444bf3`. Se corrigió la exposición de archivos estáticos, se añadieron diez pruebas de rutas privadas y cabeceras de seguridad. Audio TTS está parcialmente implementado y probado con portugués y francés; el proveedor real completó ambas sesiones. Auditoría funcional, validación de voz en dispositivos reales y seguridad siguen pendientes. No declarar listo para prueba humana ni desplegar públicamente todavía.

Este documento es el registro detallado del proyecto. El README principal mantiene únicamente la etapa actual y enlaza aquí para evitar duplicar información y mantener la documentación operativa breve.

## Resumen ejecutivo

| Etapa | Área | Estado |
|---|---|---|
| 1 | Base del repositorio y ejecución | Implementada; CI correcto en el último commit validado |
| 2 | Tutor IA, proveedores y pedagogía | Implementada; sesión real Gemini validada en 3 turnos |
| 3 | Pruebas automatizadas y CI | Aprobadas en el último commit de código `9444bf3` |
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

**Estado: implementada; tests y Browser E2E aprobados en `9444bf3`.**

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

**Estado: en curso; tests y Browser E2E aprobados en `9444bf3`; sesión real Gemini aprobada en portugués brasileño y francés en run #44120040434. El E2E cubre modo local, IA simulada, reintentos, persistencia, exportación, repaso y configuración de idioma francés.**

### Flujo de sesión IA revisado parcialmente

- [x] Inicio de sesión: envía configuración, contexto del alumno y tarea `start_lesson`.
- [x] Unificar la aplicación de actualizaciones del alumno: el vocabulario del primer turno y de turnos posteriores se conserva, deduplicado, en la sesión y el resumen.
- [x] Respuesta: el frontend envía la respuesta del alumno junto con la actividad actual y el historial.
- [x] Reintento: existe acción para repetir inicio o reenvío tras un error.
- [x] Pistas: se muestra la pista incluida en el ejercicio actual.
- [x] Progreso: registra turnos, aciertos, rachas, vocabulario y errores.
- [x] Finalización: permite pasar al resumen cuando el tutor finaliza o se alcanza la duración.
- [x] Persistencia: `finishSession()` guarda el resumen, vocabulario y errores en almacenamiento local.
- [x] Repaso IA: los errores registrados por el flujo IA reciben un identificador `ai-turn-N`; `persistSession()` los convierte en tarjetas de repaso genéricas y la vista puede usar el prompt y la respuesta esperada guardados.
- [x] Corregir colisiones de tarjetas IA: los identificadores `ai-turn-N` se repiten entre sesiones; ahora las claves incluyen marca temporal de sesión y turno.
- [x] Evitar crear tarjetas IA no calificables cuando la actividad no incluye una respuesta esperada.
- [x] Añadir pruebas de persistencia para ambos casos; tests aprobados en run #44093520831 y posteriores.
- [x] Validar en navegador que un error IA con respuesta esperada se persista como tarjeta, aparezca al vencer y se califique; E2E aprobado en run #44093542317.
- [x] Integrar `learnerUpdate.errorsToReview` en el resumen y en el historial de sesiones; no se convierten en tarjetas de respuesta única porque describen patrones, no respuestas calificables.
- [x] Las actividades IA sin `expectedAnswer` ya no generan tarjetas de repaso que no puedan calificarse.
- [ ] Evaluar una alternativa pedagógica para repasar conversaciones libres sin respuesta única.
- [ ] Revisar el botón de pista: actualmente muestra la pista de la actividad en pantalla; no hace una nueva consulta al tutor para pedir una pista adaptada.
- [x] Corregir evaluación `not_applicable`: los turnos conversacionales sin evaluación objetiva ya no cuentan como errores, no rompen rachas y no reducen la precisión.
- [x] Separar el total de turnos de las respuestas evaluables en el resumen y exportación.
- [x] Evitar que una doble pulsación en «Ver resumen» persista dos veces la misma sesión.
- [x] Añadir pruebas para estados `correct`, `partially_correct`, `incorrect` y `not_applicable`; CI correcto en Actions #130.
- [x] El nivel estimado del tutor IA se conserva entre turnos y se muestra en el resumen; la sesión real smoke completó el ciclo, falta evaluación pedagógica de calidad.
- [x] Conectar `learnerUpdate.errorsToReview` con el resumen: los patrones se acumulan sin duplicados, se limitan en longitud/cantidad y se guardan en el historial de sesiones.
- [x] Añadir pruebas unitarias para acumulación, deduplicación, límites y persistencia de patrones IA.
- [ ] Verificar exportación y resumen con una sesión real completa en navegador; la sesión real de smoke valida el proveedor/API, mientras el E2E valida la interfaz con API simulada.
- [x] Añadir pruebas del cliente frontend para health check, envío de turnos, errores HTTP y respuestas no JSON.
- [x] Añadir prueba de integración del ciclo IA en `tests/ai-session-flow.test.js`: actualizaciones del alumno, deduplicación de vocabulario/patrones, turnos `not_applicable`, evaluación, resumen, persistencia y tarjeta de repaso. tests aprobados en run #44093520831.\n- [x] Pruebas de interacción DOM/navegador y del flujo completo de interfaz: modo local, modo IA simulado, reintentos, pistas, resumen, persistencia, exportación y repaso IA; E2E aprobado en run #44093542317.

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
- [ ] Completar revisión de sanitización y presentación de contenido generado por IA en todos los puntos de la interfaz; el repaso y resumen ya fueron corregidos y tienen prueba unitaria del helper.
- [ ] Revisar privacidad, logs y errores del proveedor.
- [ ] Definir si se requiere CORS; actualmente la arquitectura está planteada para frontend y API en el mismo origen.
- [x] Corregir inserción de contenido generado por IA en el repaso y el resumen: los textos variables de tarjetas, vocabulario, idioma y foco recomendado ahora se escapan antes de insertarse como HTML.
- [x] Añadir pruebas unitarias para el helper de escape HTML, incluyendo etiquetas, comillas y valores no string. La prueba existe; su ejecución en CI todavía debe confirmarse.
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
- [x] Smoke test: inicio, tres evaluaciones, continuidad, fragmentos de voz y cierre completados en ambos idiomas. [ ] Ampliar casos reales: respuestas incorrectas, pistas, cuota, credencial inválida y timeout.
- [ ] Probar errores de cuota, credencial inválida, timeout y respuesta JSON inválida.
- [x] Latencia observada: 79,8 s en pt-BR y 39,8 s en fr-FR; los 503 transitorios se recuperaron mediante reintentos. [ ] Medir costos y latencias en varias sesiones/modelos antes de seleccionar proveedor de producción.
- [ ] Usar únicamente información ficticia durante pruebas iniciales.

## Etapa 6 — Prueba humana y experiencia de usuario

**Estado: pendiente.** La experiencia de audio debe incorporarse antes de la prueba humana.

- [ ] Completar lectura automática de todos los fragmentos objetivo en cada pantalla (incluidos vocabulario y contenido de repaso/resumen). Ya existe lectura automática de fragmentos `speechSegments` IA, opciones y respuestas modelo en ejercicios locales; falta cobertura integral de todas las vistas.
- [x] El contrato IA usa `speechSegments` con `text`, `language` y `locale`; el prompt separa el idioma objetivo del texto auxiliar en español. El backend rechaza segmentos cuyo locale no coincida con el seleccionado.
- [x] La selección de voz consulta dinámicamente `SpeechSynthesis.getVoices()` y prioriza coincidencia exacta de locale, con fallback por idioma. E2E simula voces `pt-BR` y `fr-FR`; falta validación auditiva en dispositivos reales.
- [ ] La cobertura efectiva depende de las voces que ofrezca el navegador/sistema operativo: consultar `getVoices()`, seleccionar la mejor coincidencia de idioma/locale y contemplar fallback informado cuando no exista voz compatible. No prometer disponibilidad universal de voces en todos los dispositivos.
- [x] Control global de audio con estado accesible, iconos 🔊/🔇 y preferencia persistida en `localStorage`; E2E valida desactivación y reactivación.
- [x] Botón de reproducción manual por fragmento, con locale propio; E2E verifica reproducción en portugués y francés.
- [x] La reproducción cancela la locución anterior; el cambio de turno y la desactivación global llaman a `speech.stop()`/`cancel()`.
- [ ] No leer automáticamente instrucciones ni explicaciones en español salvo que español sea el idioma objetivo de esa actividad; separar explícitamente texto objetivo y texto auxiliar cuando el tutor mezcle idiomas.
- [x] El controlador gestiona API ausente, voz no instalada y errores de reproducción sin bloquear la práctica escrita; el fallback se comunica en la interfaz. Falta prueba en navegadores/dispositivos reales.
- [ ] Validar la selección de voz, pronunciación y fallback en los idiomas objetivo habilitados, incluyendo portugués brasileño e inglés como casos iniciales, y comprobar que incorporar otro idioma no requiera modificar la lógica de audio. Probar en móvil y escritorio, con teclado y lectores de pantalla.
- [ ] Prueba móvil y escritorio.
- [ ] Portugués brasileño: naturalidad, corrección, vocabulario y situaciones reales.
- [ ] Inglés: naturalidad, corrección y progresión.
- [ ] Verificar adaptación desde principiante hasta niveles superiores.
- [ ] Evaluar que no repita mecánicamente el mismo tipo de ejercicio.
- [ ] Comprobar pistas, feedback, repaso, progreso, exportación y resumen.
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

CI y Browser E2E están aprobados en `9444bf3`; el smoke test real de Gemini está aprobado en `99fcfcc` para `pt-BR` y `fr-FR` (3 turnos y 4 segmentos de voz por idioma). Próximo trabajo: cerrar cobertura de audio en todas las vistas, ejecutar pruebas reales en navegador/dispositivo, completar auditoría funcional y seguridad; después preparar la prueba humana.

## Criterio para declarar el proyecto listo para prueba humana

No basta con que el workflow pase. Se requiere:
1. Auditoría funcional cerrada sin defectos bloqueantes.
2. CI correcto en el último commit de código.
3. Una sesión real con el proveedor configurado. (Cumplido para Gemini 3.5 Flash-Lite mediante smoke test de tres turnos.)
4. Confirmación de persistencia, repaso, cierre y recuperación ante errores.
5. Lectura automática del idioma objetivo, control global de audio y reproducción manual validados.
6. Instrucciones de prueba humana preparadas.

El merge y la reactivación de Replit se mantienen posteriores a esas validaciones.
