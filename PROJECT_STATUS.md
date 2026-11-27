# Estado operativo del proyecto — Adaptive Language Tutor

**Fecha de auditoría:** 26-11-2026  
**Repositorio:** https://github.com/asotomayorb/adaptive-language-tutor  
**Rama de desarrollo:** `feature/mobile-bottom-navigation`  
**Rama de checkpoints:** `recovery/intermediate-theory-content` — conservar siempre.  
**Workspace Render:** My Workspace (`tea-dbus0u5g1s2s73coteeg`).  
**Servicio Preview:** `adaptive-language-tutor-preview-5b3d` (`srv-dbus3hnf3r2c739j9ir0`).  
**URL:** https://adaptive-language-tutor-preview-5b3d.onrender.com/

## 1. Alcance vigente

- **Idioma de origen:** español (`es-CL`).
- **Idioma objetivo:** italiano (`it-IT`), único idioma disponible.
- **UI activa:** Teoría y Estadísticas.
- **Contenido aprobado:** Unidades 1 y 2.
- **Unidades 3–6:** conservar títulos de unidades y subtemas, categorías y jerarquía; no conservar cuerpos, ejemplos, tablas ni datos de contenido. Deben reconstruirse desde los criterios y contenido de Unidades 1 y 2.
- **Ruta, Entrenamiento y tutor IA:** en espera. Mantener únicamente infraestructura que siga siendo una dependencia útil de su futura reactivación. Cuando se reactiven, usar español como origen e italiano como destino.
- **Versiones de portugués e inglés:** descartadas como versiones de producto. No mantener sus catálogos ni contenido; una eventual versión posterior se reconstruirá desde el modelo italiano y no se reactivarán los catálogos antiguos.
- **Otros idiomas heredados:** descartados. No mostrar ni mantener selectores, catálogos o contenido multilingüe.

## 2. Resultado de la auditoría de código

| Elemento | Estado | Decisión |
|---|---|---|
| `src/app.js` | Activo | Reducir definiciones de idioma a Italiano; retirar lógica multilingüe; conservar teoría de Unidades 1–2; dejar sin renderer de contenido las Unidades 3–6. |
| `src/content/pt-BR.js`, `src/content/en.js` | Obsoletos | Eliminar ambos catálogos. |
| Helpers y datos de teoría para múltiples idiomas | Obsoletos | Eliminar definiciones de idiomas, muestras, verbos, artículos y contenido aplicado que no correspondan al modelo italiano. |
| `server/prompts.js` | Infraestructura en espera | Fijar el contrato español → italiano, también al normalizar datos de sesión heredados. |
| `src/core/pedagogy.js`, `src/core/storage.js`, `src/core/speech.js`, `src/core/tutor-client.js`, `server/*` | En espera / dependencias | Conservar para los módulos futuros; ajustar las pruebas y el prompt al par español-italiano. |
| `scripts/live-provider-smoke.js` y workflow asociado | Validación del backend en espera | Mantener la prueba directa del proveedor en italiano. El smoke de navegador se retira porque prueba una UI de tutor IA que no está expuesta en la versión activa. |
| `tests/content.test.js`, `tests/content-speech.test.js` | Obsoletos | Retirar pruebas específicas de los catálogos eliminados; añadir cobertura de alcance lingüístico y normalización del par activo en `tests/prompts.test.js`. |
| `HUMAN_TEST_PLAN.md`, `PRODUCT_SPEC.md`, `README.md` | Documentación | Reescribir el alcance para evitar instrucciones históricas que parezcan vigentes. |

Los registros históricos de sesiones de otros idiomas pueden permanecer en el almacenamiento local del navegador, pero la aplicación no debe mostrarlos como idiomas disponibles ni mezclarlos en las estadísticas actuales. No borrar datos locales automáticamente durante esta limpieza.

## 3. Elementos retenidos en espera

- Ruta y Entrenamiento: módulos bloqueados desde la navegación, pero con requisitos futuros todavía útiles.
- Tutor IA y adaptadores: se conservan para la futura implementación de actividades italianas; el prompt y los datos enviados deben imponer español → italiano.
- Persistencia, repaso y estadísticas: se conservan; la UI actual solo presenta datos italianos.
- `.replit`: configuración de compatibilidad con el proyecto original. No controla el despliegue Render; no modificar el proyecto original Replit.
- `render.yaml`: conservar hasta verificar si existe una asociación Blueprint. No usarlo para crear o modificar infraestructura sin revisar el plan de Render.

## 4. Ramas

- **Activa:** `feature/mobile-bottom-navigation` (fuente del Preview Render).
- **Checkpoint obligatorio:** `recovery/intermediate-theory-content`, último checkpoint `d14fbdd8cb1daace8a31a321cfe445b32447139f`. Conserva el checkpoint anterior `59c87d6a…` y el estado auditado como segundo padre. No borrar ni usar como rama cotidiana.
- **Dependencia PR #2 y base PR #3:** `feature/ai-tutor-pedagogy`; mantener mientras los PR permanezcan abiertos.
- **PR #8:** `feature/unit-2-clarity-refinement`; mantener mientras siga abierto.
- **Preview separado:** `rebuild/functional-baseline`; conservar mientras siga existiendo ese servicio.
- Ramas históricas candidatas a limpieza posterior: `feature/openai-tutor-pedagogy`, `integration/unit-2-polish`, `integration/unit-2-polish-v2`. No se eliminan en esta acción.

## 5. Render y validación

- El usuario confirmó el 26-11-2026 que el Preview Render funcionaba correctamente.
- **Checkpoint de auditoría:** `recovery/intermediate-theory-content`, commit `d14fbdd8cb1daace8a31a321cfe445b32447139f`.
- **Cambio Países e idiomas:** commit funcional `bd4161f74ae708b71a455b0ba8f08e58c8e15320`. Se quitó Play de la tabla; las formas italianas se pronuncian al tocar cada palabra, incluidas variantes separadas por slash/guion, preservando el separador visual. La traducción española entre paréntesis aparece solo en la primera columna. Las tres columnas usan anchos iguales y celdas centradas verticalmente.
- **Tests:** aprobados en [45988073370](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45988073370), incluyendo `npm run check` y `npm test`.
- **Browser E2E:** aprobado en [45988073334](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45988073334). Verifica que no haya botones Play, que variantes separadas tengan TTS independiente, que las columnas sean iguales y que las traducciones solo aparezcan en País.
- **Render LIVE:** servicio `adaptive-language-tutor-preview-5b3d`; último deploy comprobado `dep-dc4m1456e07s73fplvcg`, commit `82eebebd3565d6fca367c19ffec5c9b75684a497`. El servicio sigue operativo, pero el deploy aún no incluye los cambios de Países e idiomas del commit `bd4161f`. Aunque Render tiene auto-deploy habilitado, no aparece un deploy posterior en la lista consultada.
- **Prueba humana pendiente:** publicar primero el commit actualizado y validar en Android pronunciación por toque, variantes, traducciones, ancho/alto de celdas y persistencia/recarga.


## 6. Criterio de limpieza

1. Eliminar implementaciones y pruebas de idiomas descartados.
2. No eliminar infraestructura que siga siendo necesaria para Ruta, Entrenamiento, tutor IA, almacenamiento, audio o seguridad en la futura versión italiana.
3. Mantener la historia recuperable mediante Git; evitar conservar documentos activos de 70–150 KB con instrucciones obsoletas.
4. No borrar datos locales históricos ni ramas con PR/deploy/checkpoint asociado.
5. No numerar cada iteración; registrar commits, CI y deploys. Usar tags/versiones solo para releases explícitos.

## 7. Próximos pasos

1. Confirmar que Render publica el commit funcional `8dc529f6b417371b2b60f8b7dc013941aa6cd67f`; no iniciar la prueba de persistencia hasta verificarlo.
2. Ejecutar la prueba humana de persistencia/recarga, navegación y contenido de Teoría en el Preview actualizado.
3. Solo después de la prueba, decidir si se eliminan las ramas históricas candidatas; no tocar la rama de checkpoint.
4. Reconstruir Unidades 3–6 de forma progresiva, usando Unidades 1–2 como referencia; no introducir contenido provisional.
