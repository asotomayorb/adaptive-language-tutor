# Adaptive Language Tutor

Aplicación móvil-first para aprender italiano desde el español mediante teoría contextual y seguimiento del aprendizaje.

> **Punto de entrada operativo para personas y agentes IA.** Este README define cómo orientarse en el repositorio y qué documentación consultar. La especificación funcional completa está en [PRODUCT_SPEC.md](PRODUCT_SPEC.md); el estado técnico comprobado está en [PROJECT_STATUS.md](PROJECT_STATUS.md); las pruebas manuales pendientes están en [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md).

## 1. Lectura rápida según la tarea

| Tipo de tarea | Lectura requerida |
|---|---|
| Cualquier cambio | README + rama/HEAD real |
| UI, navegación, estilos o audio | PRODUCT_SPEC.md: secciones 2, 3, 4 y 6; PROJECT_STATUS.md; pruebas relacionadas |
| Teoría, gramática, vocabulario o ejemplos | PRODUCT_SPEC.md: secciones 4 y 5; revisar contenido/código afectado |
| Estadísticas | PRODUCT_SPEC.md: sección 7; revisar persistencia y pruebas |
| Ruta o Entrenamiento | PRODUCT_SPEC.md: sección 8; comprobar primero el estado real del módulo |
| Backend, arquitectura, seguridad o despliegue | PROJECT_STATUS.md, package.json y archivos técnicos afectados |
| Validación visual o prueba humana | HUMAN_TEST_PLAN.md y estado LIVE de Render |
| Checkpoint o recuperación | Rama recovery/intermediate-theory-content; comparar commits/diff antes de recuperar |

**Regla de lectura:** no releer todos los documentos por defecto. Consultar las secciones necesarias y ampliar el alcance solo si aparecen dependencias o contradicciones. PROJECT_STATUS.md contiene el estado operativo y las decisiones de auditoría vigentes; consultar sus secciones relevantes y contrastarlas con el HEAD real. Confirmar siempre la realidad contra HEAD, pruebas y estado LIVE, porque una entrada antigua puede estar desactualizada.

## 2. Alcance funcional vigente

- Idioma de origen: español (`es-CL`). Idioma objetivo: italiano (`it-IT`), único idioma disponible.
- Unidades 1, 2 y 3 mantienen contenido desarrollado y validado; las tres siguen una estructura editorial y visual común.
- Unidades 4–6 conservan títulos y jerarquía, con cuerpos vacíos hasta su desarrollo.
- Las versiones anteriores de otros idiomas y sus catálogos se retiran. Si se decide incorporar otra lengua, se reconstruirá replicando el modelo italiano.
- Ruta, Entrenamiento y tutor IA permanecen en espera. Se conserva su infraestructura solo cuando sea dependencia útil de una futura reactivación, siempre con español como origen e italiano como destino.

## 3. Estado y entorno de trabajo

- Repositorio: https://github.com/asotomayorb/adaptive-language-tutor
- Rama activa de desarrollo: feature/mobile-bottom-navigation.
- Rama de checkpoints que debe conservarse: [recovery/intermediate-theory-content](https://github.com/asotomayorb/adaptive-language-tutor/tree/recovery/intermediate-theory-content). No es rama de desarrollo ni fuente directa de Render.
- Preview Render: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Servicio Render: adaptive-language-tutor-preview-5b3d, workspace confirmado **My Workspace** (`tea-dbus0u5g1s2s73coteeg`). Verificar el deploy LIVE y su commit antes de afirmar que el preview contiene un cambio.
- El proyecto original de Replit permanece intacto; no modificarlo ni sincronizarlo sin autorización expresa.
- El estado técnico, commits, pruebas y pendientes verificados están en [PROJECT_STATUS.md](PROJECT_STATUS.md).
- Las comprobaciones manuales pendientes están en [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md).
- Las reglas funcionales y de producto están en [PRODUCT_SPEC.md](PRODUCT_SPEC.md).
- La aprobación visual/funcional de Teoría en Unidades 1 y 2 es un checkpoint de producto; no implica que otros módulos estén terminados ni que futuras modificaciones estén aprobadas.

## 4. Mapa de la especificación

| Sección de PRODUCT_SPEC.md | Contenido |
|---|---|
| 2 | Alcance, navegación y controles globales |
| 3 | Idioma y audio |
| 4 | Teoría: jerarquía y navegación |
| 5 | Teoría: reglas editoriales, contenido, tablas y ejemplos |
| 6 | Estética general |
| 7 | Estadísticas |
| 8 | Requisitos conservados para Ruta y Entrenamiento |
| 9 | Privacidad de contenido y derechos |
| 12 | Registro breve de decisiones vigentes |

## 5. Arquitectura y comandos

- Frontend: index.html, src/app.js, src/styles.css.
- Backend/API: server/index.js; adaptadores IA: server/provider.js; prompts/esquemas: server/prompts.js.
- Cliente IA: src/core/tutor-client.js; pedagogía, audio y progreso local: src/core/. La teoría italiana vigente está integrada en src/app.js; los catálogos de idiomas anteriores se retiraron.
- Pruebas: tests/. Runtime: Node.js 20.6 o superior.

```bash
npm ci
npm start
npm run check
npm test
npm run test:e2e
```

La app queda en http://localhost:3000; desarrollo: npm run dev. El smoke test directo del proveedor requiere secretos/variables privados configurados. No hay smoke de navegador del tutor IA mientras esa UI permanezca en espera. Nunca subir claves API al repositorio.

## 6. Protocolo de trabajo

### Antes de editar
1. Leer este README y verificar rama, HEAD y estado limpio/diff real.
2. Consultar únicamente las secciones de PRODUCT_SPEC.md relacionadas con el alcance; ampliar cuando existan dependencias.
3. Revisar PROJECT_STATUS.md, pruebas relacionadas y alcance autorizado.
4. Si hay una decisión visual sin aprobar, presentar el esquema solicitado y esperar confirmación.
5. Distinguir siempre entre requisito documentado, implementación existente y comportamiento efectivamente validado.

### Después de editar
1. Actualizar PRODUCT_SPEC.md si cambió una regla funcional o de producto.
2. Actualizar PROJECT_STATUS.md con cambios técnicos, commit, pruebas y pendientes reales.
3. Actualizar HUMAN_TEST_PLAN.md si cambió una vista o interacción.
4. Ejecutar npm run check, npm test y Browser E2E cuando corresponda.
5. Vincular cada resultado de prueba al HEAD exacto; un build correcto no equivale a validación funcional.
6. Verificar Render LIVE y su commit antes de afirmar que el preview está actualizado.
7. Solicitar prueba humana solo cuando la versión publicada corresponda al cambio validado; E2E no sustituye la revisión visual, táctil y auditiva en Android.
8. Registrar checkpoints aprobados en la rama recovery/intermediate-theory-content y documentar claramente su referencia. No sobrescribir ni eliminar checkpoints existentes.
9. No asignar una versión numerada a cada iteración: registrar hitos con commit, resultados CI y deploy. Reservar versiones semánticas/tags para releases identificables.

## 7. Historial de documentación

- **26-11-2026:** reorganización documental para reducir lectura repetida: README convertido en índice operativo, especificación de producto separada en PRODUCT_SPEC.md, estado técnico y plan humano conservados en sus documentos respectivos. No se modificó código de la aplicación.
- **26-11-2026:** checkpoint de continuidad guardado en `recovery/intermediate-theory-content`, commit `59c87d6a02d9dfe8ebc84de6e9417e29401f4a74`. El checkpoint conserva como padre el estado previo de recuperación y añade como segundo padre el HEAD activo `e2f930645d2655de4493edb258501a38ce292766`; no se sobrescribió el historial anterior. La rama de desarrollo permanece `feature/mobile-bottom-navigation`.

- **26-11-2026:** workspace Render confirmado por el usuario: `My Workspace` (`tea-dbus0u5g1s2s73coteeg`).
- **26-11-2026:** el usuario confirma que Render Preview funciona correctamente. Se fija español (`es-CL`) → italiano (`it-IT`) como único par lingüístico; se retiran los catálogos antiguos de otros idiomas y el código multilingüe asociado. En ese momento las Unidades 3–6 conservaban solo títulos y jerarquía; esta situación fue reemplazada el 27-11-2026 por el desarrollo de Unidad 3. Se mantienen en espera los módulos futuros con utilidad demostrable; no se eliminan ramas ni el checkpoint de recuperación.
- **26-11-2026:** se retira el smoke de navegador del tutor IA porque esa interfaz no está activa; se conserva el smoke directo del backend italiano.
- **26-11-2026:** auditoría español → italiano completada. Tests y Browser E2E aprobados en el commit `8dc529f`; smoke directo del proveedor italiano aprobado en `0994113`. Render Preview sigue mostrando el deploy anterior (`a947068`) y requiere confirmar el nuevo despliegue antes de la prueba humana de persistencia.
- **27-11-2026:** checkpoint de la auditoría guardado en `recovery/intermediate-theory-content`, commit `d14fbdd8cb1daace8a31a321cfe445b32447139f`, conservando el checkpoint anterior y capturando el estado auditado como segundo padre.
- **27-11-2026:** Países e idiomas actualizado en `bd4161f`: TTS táctil individual sin Play, separadores preservados, traducción entre paréntesis solo en País y columnas/celdas equilibradas. Tests y Browser E2E aprobados (`45988073370`, `45988073334`). Render confirmó LIVE el deploy `dep-dc4n04h7lnhs73948v10` para el HEAD `8f268aab801356625bf6d00fa4a1775d43ec6505`.
- **27-11-2026:** Países e idiomas ajustado tras revisión: columnas adaptadas al contenido (sin anchos idénticos forzados), texto con ajuste de línea sin desbordamiento y celdas alineadas por fila. E2E actualizado para comprobar el ajuste y ausencia de overflow. Render confirmó LIVE el deploy `dep-dc4nrn56e07s73808l0g` para el HEAD `b48966800b17b633631e19d2712d89d7100c9e97`.

- **27-11-2026:** checkpoint posterior al ajuste de Países e idiomas guardado en `recovery/intermediate-theory-content`, commit `ae0c064940062ccb71fdfd16a10ab74cfb3a28ae`, conservando el checkpoint previo y capturando el HEAD activo como segundo padre. Revisión pedagógica de Unidades 1 y 2 completada en conversación; no se modificó contenido didáctico. Hallazgo principal: cobertura temática A1 inicial razonable, pero conviene complementar con tareas comunicativas y práctica guiada. Estado: `[COMPLETADO]`.


- **27-11-2026:** ampliación de la teoría de referencia A1 implementada. En Unidad 1 se añadieron la omisión habitual del sujeto, el uso formal de `Lei` y contextos de `essere/stare`; en Unidad 2 se incorporaron ejemplos concretos de artículos y plurales, uso partitivo de `dei/degli/delle`, concordancia adjetival con más combinaciones y `venire da` junto con la distinción formal/informal. Las frases italianas nuevas tienen pronunciación individual. Archivos: `src/app.js`, `tests/browser/e2e.js`, `PRODUCT_SPEC.md`, `PROJECT_STATUS.md` y este `README.md`. Una primera ejecución E2E detectó variantes que compartían control; se corrigió y la ejecución final quedó aprobada. Tests: [46017975532](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/46017975532); Browser E2E: [46017975252](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/46017975252). Render Preview LIVE: `dep-dc4pcsijnfac73b6bsb0`, commit de aplicación `e946ebc2759cf77f6670d18c61be2fccd5b086c5`. Estado: [COMPLETADO].


- **27-11-2026:** consolidación de las reglas funcionales, editoriales y estéticas de Teoría completada. Unidades 1–3 comparten introducción breve, bloques de referencia agrupados y ejemplos aplicados cuando aportan valor; sin excepciones de maquetación. El audio en cabecera es solo un interruptor global; el contenido italiano se pronuncia tocando cada fragmento, sin botones Play ni altavoces junto al texto. Las variantes separadas por barra, guion, raya o flecha mantienen su separador y pronunciación independiente; pronombres de tablas de conjugación también son táctiles. Unidad 3 desarrollada con nueve subtemas: Familia, Profesiones, Rutinas y lugares, Días y fechas, Presente habitual, Pasado (`passato prossimo`), Futuro simple (introducción), Rutinas diarias y La hora. Unidades 4–6 siguen vacías. Se retiraron reglas activas obsoletas que indicaban Unidades 3–6 vacías. Archivos: `src/app.js`, `src/styles.css`, `tests/browser/e2e.js`, `PRODUCT_SPEC.md`, `HUMAN_TEST_PLAN.md`, `PROJECT_STATUS.md` y `README.md`. Checkpoint previo conservado en `recovery/intermediate-theory-content`, commit `a5a22797a0e42e13d0402b0a9567fd8a33b82bb9`. Tests aprobados: [46031008271](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/46031008271); Browser E2E aprobado: [46031008250](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/46031008250), para el HEAD `e7c04c7067b58b7bb7e2d788728e6ff2402efc48`. Estado: [COMPLETADO]. Render Preview: sincronizar tras esta actualización documental; no se requieren cambios de variables ni de build.


- **27-11-2026:** checkpoint previo a ajustes estéticos de Teoría guardado en `recovery/theory-style-before-fixes-2026-11-27`, apuntando al HEAD `ed42e70fd00ab9238727bef5b42618ee7693da2f`. El checkpoint conserva el estado aprobado de Unidades 1–3 antes de cambios de formato, scroll y navegación. Estado de ajustes: `[PENDIENTE: implementación y validación aún no iniciadas]`.


- **27-11-2026:** ajustes estéticos de Teoría iniciados: se agregaron `src/theory-polish.css` y `src/theory-polish.js`, enlazados desde `index.html`. Incluyen tipografía heredada uniforme, cursiva para italiano fuera de tablas, texto sin delimitadores angulares, limpieza de separadores, reinicio de scroll al cambiar de subtema y controles anterior/siguiente fijados sobre la navegación inferior. Archivos modificados: `index.html`, `src/theory-polish.css`, `src/theory-polish.js`. Tests aprobados en commit `53c10bee5df03a4c72cfd7938b2eb64ad8b0188e`; Browser E2E sigue en ejecución y Render aún no se ha sincronizado. Estado: [PENDIENTE: esperar Browser E2E, validar comportamiento visual y sincronizar Render].

- **27-11-2026:** corrección de la vista previa solicitada: se eliminaron secuencias literales `\\n` que aparecían en la esquina superior, se restauró el scroll vertical del contenido largo de Teoría y se añadió negrita a las expresiones italianas (manteniendo cursiva fuera de tablas y texto sin cursiva dentro de ellas). Archivos: `index.html`, `src/theory-polish.css`, `src/theory-polish.js`. Commit de código: `f9fb1ac98cad13a5fb8293e897c11f14c8cce106`. Deploy Render: `dep-dc4td0p7lnhs739q2k30`, estado al registrar: `build_in_progress`. No se ejecutó aún una prueba humana en navegador. Estado: [PENDIENTE: confirmar deploy live y validar scroll/visual en preview].

- **27-11-2026:** revisión editorial y de navegación de las Unidades 1–3: expresiones italianas en negrita y cursiva fuera de tablas, en negrita sin cursiva dentro de tablas, sin comillas angulares; normalización de `//` a `/`; y 170 px de espacio inferior en el área desplazable para que el contenido final no quede cubierto por Anterior/Siguiente. Archivos: `src/app.js`, `src/theory-polish.js`, `src/theory-polish.css`, `tests/browser/e2e.js`, `PRODUCT_SPEC.md`, `HUMAN_TEST_PLAN.md`, `PROJECT_STATUS.md` y este `README.md`. Código: `f7b6d2cfc1bbb7f1d3509cdd713321b2ff1babba`; registro técnico: `2b1f82910efa4fc94e94878f61f6705a7098d5d8`. E2E actualizado, pero sin resultado de ejecución para este HEAD; Render aún muestra el deploy previo `f9fb1ac`. Estado: [PENDIENTE: desplegar y validar pruebas automatizadas y visuales en Android]. No se modificaron variables ni configuración de build.
