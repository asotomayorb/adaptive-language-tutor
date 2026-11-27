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
- **Contenido desarrollado y validado por CI/E2E:** Unidades 1, 2 y 3.
- **Unidad 3:** nueve subtemas desarrollados bajo la estructura común de Teoría.\n- **Unidades 4–6:** conservar títulos de unidades y subtemas, categorías y jerarquía; sus cuerpos permanecen vacíos hasta su desarrollo.
- **Ruta, Entrenamiento y tutor IA:** en espera. Mantener únicamente infraestructura que siga siendo una dependencia útil de su futura reactivación. Cuando se reactiven, usar español como origen e italiano como destino.
- **Versiones de portugués e inglés:** descartadas como versiones de producto. No mantener sus catálogos ni contenido; una eventual versión posterior se reconstruirá desde el modelo italiano y no se reactivarán los catálogos antiguos.
- **Otros idiomas heredados:** descartados. No mostrar ni mantener selectores, catálogos o contenido multilingüe.

## 2. Resultado de la auditoría de código

| Elemento | Estado | Decisión |
|---|---|---|
| `src/app.js` | Activo | Reducir definiciones de idioma a Italiano; retirar lógica multilingüe; conservar teoría de Unidades 1–3; dejar sin renderer de contenido las Unidades 4–6. |
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
- **Cambio Países e idiomas (ajuste de desbordamiento y distribución):** CSS actualizado para que el ancho de columnas responda al contenido, el gentilicio tenga espacio para sus variantes y el texto envuelva sin desbordarse; celdas de cada fila permanecen alineadas. Se conserva TTS por variante y traducción solo en País. Cambios en `src/styles.css`, `tests/browser/e2e.js` y `PRODUCT_SPEC.md`.
- **Tests:** aprobados en [45988073370](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45988073370), incluyendo `npm run check` y `npm test`.
- **Browser E2E:** aprobado en [45988073334](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45988073334). Verifica que no haya botones Play, que variantes separadas tengan TTS independiente, que las columnas sean iguales y que las traducciones solo aparezcan en País.
- **Render LIVE antes del ajuste actual:** `dep-dc4n04h7lnhs73948v10`, commit `8f268aab801356625bf6d00fa4a1775d43ec6505`. Publicar el ajuste de desbordamiento al terminar validación.
- **Prueba humana pendiente:** validar en Android pronunciación por toque, variantes, traducciones, ajuste de línea, distribución adaptada al contenido y persistencia/recarga.


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
4. Mantener Unidades 1–3 conforme a la estructura común y desarrollar Unidades 4–6 progresivamente, sin contenido provisional.


## 8. Complemento de referencia A1 (27-11-2026)

- Se amplió el contenido de referencia de Unidad 1: omisión habitual del pronombre sujeto, concordancia formal de `Lei` en tercera persona singular y explicación contextual de `essere/stare` sin equivalencia mecánica con «ser/estar».
- Unidad 2: artículos definidos/indefinidos ahora incluyen sustantivos concretos y sus plurales; se explica que no hay plural directo de `un/una` y se introducen `dei/degli/delle` en uso partitivo frecuente. Los ejemplos italianos tienen pronunciación individual.
- Adjetivos: ejemplos ampliados para masculino/femenino y singular/plural en terminaciones `-o` y `-e`.
- Edad y procedencia: añadido `venire da` y explicitada la correspondencia informal `hai/sei` frente al tratamiento formal `ha/è` con `Lei`.
- Se actualizaron las aserciones Browser E2E para cubrir los nuevos conceptos, ejemplos y variantes. Unidad 1 solo se amplió en su subtema gramatical; la Unidad 3 se desarrolló posteriormente en nueve subtemas.
- Commits de implementación: `f600190`, `acc0962`, `57c48bc`, `bcdd071`, `7a30e61`, `6336a65`, `e946ebc`. Una primera E2E detectó que las variantes de ejemplos con / compartían un solo control; se corrigió para que cada frase tenga TTS individual. Tests aprobados en [46017975532](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/46017975532) y Browser E2E aprobado en [46017975252](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/46017975252), ambos para el HEAD `e946ebc2759cf77f6670d18c61be2fccd5b086c5). Render Preview LIVE: deploy `dep-dc4pcsijnfac73b6bsb0` para ese mismo HEAD. No se requieren cambios de variables ni de configuración de build.


## 9. Consolidación de Teoría y Unidad 3 (27-11-2026)

- **Checkpoint previo:** rama `recovery/intermediate-theory-content`, commit `a5a22797a0e42e13d0402b0a9567fd8a33b82bb9`. Conserva el checkpoint anterior `ae0c064940062ccb71fdfd16a10ab74cfb3a28ae` y captura como segundo padre el estado validado de Unidades 1–2 (`55bc0b04a65fc1e70257f18867bbccd4127cd23d)).
- **Reglas consolidadas:** todos los subtemas desarrollados comparten introducción breve, secciones de referencia agrupadas y ejemplos aplicados cuando correspondan. Se elimina el uso de botones Play/altavoz en Teoría; todo texto italiano, incluidos fragmentos largos y términos en títulos, se pronuncia tocándolo. Las variantes separadas conservan el separador y son objetivos independientes. Traducciones españolas no se pronuncian como italiano.
- **Unidad 3 desarrollada (nueve subtemas):** Familia, Profesiones, Rutinas y lugares, Días y fechas, Presente habitual, Pasado (`passato prossimo`), Futuro simple (introducción), Rutinas diarias y La hora. El futuro se presenta como ampliación inicial, priorizando el presente para planes inmediatos.
- **Unidad 1 y 2:** se conserva su contenido; se normaliza el contenedor y la estructura visual común. Países e idiomas ahora también tiene introducción breve. Se retiran estilos CSS residuales de botones Play en Teoría.
- **Unidad 4–6:** continúan con títulos y jerarquía, sin cuerpo didáctico.
- **Archivos actualizados:** `src/app.js`, `src/styles.css`, `tests/browser/e2e.js`, `PRODUCT_SPEC.md`, `HUMAN_TEST_PLAN.md`. README se actualizará al cerrar esta tarea.
- **Validación:** Tests y Browser E2E aprobados para el commit `56da0e6b287665017d5e27e73ffdb59d9922586d`. E2E cubre los ocho subtemas existentes de Unidades 1–2, los nueve subtemas de Unidad 3, estructura común, pronunciación táctil, ausencia de botones y que Unidades 4–6 sigan vacías.
- **Render:** pendiente de publicar y verificar el commit final de esta consolidación. No se modificaron variables de entorno ni configuración de build.
- **Prueba humana pendiente:** revisar en Android la presentación responsive, pronunciación táctil de variantes y frases largas, y navegación por los subtemas.
