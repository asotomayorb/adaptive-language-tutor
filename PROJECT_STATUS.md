# Registro de estado del proyecto — Adaptive Language Tutor

**Última actualización:** 16-11-2026  
**Rama:** `feature/ai-tutor-pedagogy`  
**Pull request:** [#2 – Improve adaptive tutor pedagogy and AI integration](https://github.com/asotomayorb/adaptive-language-tutor/pull/2)  
**Estado global:** código funcional en desarrollo; pendiente de validación integral y de producto. No desplegar públicamente todavía.

Este documento es el registro detallado del proyecto. El README principal mantiene únicamente la etapa actual y enlaza aquí para evitar duplicar información y mantener la documentación operativa breve.

## Resumen ejecutivo

| Etapa | Área | Estado |
|---|---|---|
| 1 | Base del repositorio y ejecución | Implementada; CI previo correcto |
| 2 | Tutor IA, proveedores y pedagogía | Implementada en código; sin prueba de API real |
| 3 | Pruebas automatizadas y CI | Implementadas; volver a confirmar en el último commit |
| 4 | Auditoría funcional y técnica | En curso |
| 5 | Validación con proveedor IA real | Pendiente |
| 6 | Prueba humana y ajustes de experiencia | Pendiente |
| 7 | Seguridad y preparación de producción | Pendiente |
| 8 | Reintegración y comprobación de Replit | Aplazada hasta el final |

**Etapa actual: 4.** No avanzar a la validación humana como si la auditoría estuviera cerrada. Resolver los hallazgos funcionales prioritarios y volver a ejecutar las pruebas.

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

**Verificación pendiente:** confirmar nuevamente CI sobre el commit más reciente de la rama. El registro previo de Actions mostró éxito de `npm run check` y `npm test`, pero esa ejecución no demuestra que los commits posteriores estén validados.

## Etapa 2 — Tutor IA, proveedores y pedagogía

**Estado: implementada en código; validación real pendiente.**

- [x] Cliente frontend para consultar salud y solicitar turnos al backend.
- [x] Adaptadores para OpenAI, Anthropic, Gemini y proveedores compatibles con Chat Completions.
- [x] Clave API utilizada solo en el servidor.
- [x] Prompt en español para tutoría de portugués brasileño e inglés.
- [x] Una actividad principal por turno, variedad de ejercicios y adaptación progresiva.
- [x] Evaluación semántica con estados correcto, parcialmente correcto, incorrecto y no aplicable.
- [x] Contexto de hasta 12 intercambios recientes.
- [x] Actualización del nivel estimado y vocabulario del alumno.
- [x] Esquema JSON y validación de la respuesta del proveedor.
- [x] Timeout de proveedor de 30 segundos.

**Pendiente:**
- [ ] Confirmar el identificador de modelo y la disponibilidad/cuota del proveedor elegido.
- [ ] Ejecutar una conversación real completa, sin compartir la clave API.
- [ ] Evaluar calidad de respuestas, naturalidad, adaptación, continuidad y consumo.
- [ ] Confirmar manejo de errores y límites reales del proveedor.

Las pruebas actuales de adaptadores usan respuestas simuladas; no acreditan conectividad ni compatibilidad real con los modelos configurados.

## Etapa 3 — Pruebas automatizadas y CI

**Estado: implementada; actualización de CI pendiente de confirmación.**

- [x] Pruebas de API y servidor.
- [x] Pruebas de adaptadores y validación de respuestas.
- [x] Pruebas del prompt y contrato estructurado.
- [x] Pruebas de lógica pedagógica local.
- [x] Pruebas de persistencia y repaso espaciado.
- [x] Workflow `.github/workflows/tests.yml` para Node 20.
- [x] Una ejecución anterior de GitHub Actions completó con éxito `npm run check` y `npm test`.
- [ ] Confirmar ejecución exitosa sobre el HEAD actual de la rama, después de los cambios de documentación y de cualquier corrección posterior.

## Etapa 4 — Auditoría funcional y técnica

**Estado: en curso.**

### Flujo de sesión IA revisado parcialmente

- [x] Inicio de sesión: envía configuración, contexto del alumno y tarea `start_lesson`.
- [x] Respuesta: el frontend envía la respuesta del alumno junto con la actividad actual y el historial.
- [x] Reintento: existe acción para repetir inicio o reenvío tras un error.
- [x] Pistas: se muestra la pista incluida en el ejercicio actual.
- [x] Progreso: registra turnos, aciertos, rachas, vocabulario y errores.
- [x] Finalización: permite pasar al resumen cuando el tutor finaliza o se alcanza la duración.
- [x] Persistencia: `finishSession()` guarda el resumen, vocabulario y errores en almacenamiento local.
- [x] Repaso IA: los errores registrados por el flujo IA reciben un identificador `ai-turn-N`; `persistSession()` los convierte en tarjetas de repaso genéricas y la vista puede usar el prompt y la respuesta esperada guardados.
- [ ] Revisar con pruebas que las tarjetas IA se creen correctamente, se muestren y se califiquen; la integración existe en el código, pero falta validación de extremo a extremo.
- [ ] Determinar si `learnerUpdate.errorsToReview` debe convertirse en datos de repaso estructurados. Actualmente el frontend no consume ese campo; el registro de intentos incorrectos sí alimenta tarjetas.
- [ ] Revisar la calidad de las tarjetas IA cuando `expectedAnswer` esté vacío o la actividad sea conversación libre.
- [ ] Revisar el botón de pista: actualmente muestra la pista de la actividad en pantalla; no hace una nueva consulta al tutor para pedir una pista adaptada.
- [ ] Verificar que el diagnóstico inicial sea coherente en el modo IA y que el nivel estimado se refleje correctamente.
- [ ] Verificar que exportación y resumen incluyan de forma consistente los datos IA.
- [ ] Añadir o completar pruebas del cliente frontend y del flujo integral de sesión IA.

### Backend y seguridad revisados parcialmente

- [x] Límite de cuerpo: 32 KB.
- [x] Límite de mensaje: 8.000 caracteres.
- [x] Timeout de proveedor: 30 segundos.
- [x] Límite global en memoria: 60 solicitudes por 10 minutos.
- [x] Máximo de 2 solicitudes simultáneas por instancia.
- [x] Rechazo de rutas estáticas fuera del directorio raíz cubierto por prueba.
- [ ] Revisar el orden de aplicación de límites y validaciones; actualmente las solicitudes al endpoint consumen cupo antes de validar cuerpo y configuración.
- [ ] Evaluar límites por IP/usuario y protección contra abuso antes de exposición pública.
- [ ] Revisar límites de historial y tamaño total de contexto enviado al proveedor.
- [ ] Revisar sanitización y presentación de contenido generado por IA en todos los puntos de la interfaz.
- [ ] Revisar privacidad, logs y errores del proveedor.
- [ ] Definir si se requiere CORS; actualmente la arquitectura está planteada para frontend y API en el mismo origen.
- [x] Corregir inserción de contenido generado por IA en el repaso y el resumen: los textos variables de tarjetas, vocabulario, idioma y foco recomendado ahora se escapan antes de insertarse como HTML.
- [ ] Añadir pruebas automatizadas específicas para impedir regresiones XSS en el repaso y el resumen.
- [ ] Ejecutar revisión completa de rutas, estados y casos extremos.

### Observaciones de arquitectura

- El progreso está almacenado en `localStorage`; no hay cuentas ni sincronización entre dispositivos.
- El rate limit es global por instancia, no por usuario, y se reinicia al reiniciar el servidor.
- El modo local y el modo IA comparten resumen y almacenamiento, pero sus experiencias de repaso no son idénticas.
- No se ha demostrado todavía el comportamiento en un despliegue persistente o con varias instancias.

## Etapa 5 — Validación con proveedor IA real

**Estado: pendiente.**

- [ ] Seleccionar el proveedor inicial según disponibilidad, cuota, precio, calidad y condiciones de datos.
- [ ] Confirmar modelo y API vigente en la cuenta del proveedor.
- [ ] Guardar la clave en variables privadas del entorno de ejecución.
- [ ] Probar inicio, varios turnos, respuestas correctas/incorrectas, pistas, continuidad y cierre.
- [ ] Probar errores de cuota, credencial inválida, timeout y respuesta JSON inválida.
- [ ] Registrar latencia y costo aproximado por sesión.
- [ ] Usar únicamente información ficticia durante pruebas iniciales.

## Etapa 6 — Prueba humana y experiencia de usuario

**Estado: pendiente.**

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

Continuar la etapa 4: añadir pruebas de regresión para el escape de contenido IA, completar pruebas del flujo de sesión y repaso, revisar el manejo de pistas y diagnóstico, y corregir hallazgos. Después confirmar CI sobre el commit actualizado.

## Criterio para declarar el proyecto listo para prueba humana

No basta con que el workflow pase. Se requiere:
1. Auditoría funcional cerrada sin defectos bloqueantes.
2. CI correcto en el último commit.
3. Una sesión real con el proveedor configurado.
4. Confirmación de persistencia, repaso, cierre y recuperación ante errores.
5. Instrucciones de prueba humana preparadas.

El merge y la reactivación de Replit se mantienen posteriores a esas validaciones.
