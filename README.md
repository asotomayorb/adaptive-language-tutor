# Adaptive Language Tutor

Aplicación móvil-first para aprender idiomas mediante contenido progresivo, práctica, teoría contextual y seguimiento del aprendizaje.

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

**Regla de lectura:** no releer todos los documentos por defecto. Consultar las secciones necesarias y ampliar el alcance solo si aparecen dependencias o contradicciones. PROJECT_STATUS.md contiene una bitácora histórica extensa: consultar su resumen y la entrada más reciente relacionada con la tarea; no recorrer las 1.400 líneas completas salvo auditoría histórica. Confirmar siempre la realidad contra HEAD, pruebas y estado LIVE, porque una entrada antigua puede estar desactualizada.

## 2. Estado y entorno de trabajo

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

## 3. Mapa de la especificación

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

## 4. Arquitectura y comandos

- Frontend: index.html, src/app.js, src/styles.css.
- Backend/API: server/index.js; adaptadores IA: server/provider.js; prompts/esquemas: server/prompts.js.
- Cliente IA: src/core/tutor-client.js; pedagogía, contenido y progreso local: src/core/, src/content/.
- Pruebas: tests/. Runtime: Node.js 20.6 o superior.

```bash
npm ci
npm start
npm run check
npm test
npm run test:e2e
```

La app queda en http://localhost:3000; desarrollo: npm run dev. Los smoke tests reales requieren secretos/variables privados configurados. Nunca subir claves API al repositorio.

## 5. Protocolo de trabajo

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

## 6. Historial de documentación

- **26-11-2026:** reorganización documental para reducir lectura repetida: README convertido en índice operativo, especificación de producto separada en PRODUCT_SPEC.md, estado técnico y plan humano conservados en sus documentos respectivos. No se modificó código de la aplicación.
- **26-11-2026:** checkpoint de continuidad guardado en `recovery/intermediate-theory-content`, commit `59c87d6a02d9dfe8ebc84de6e9417e29401f4a74`. El checkpoint conserva como padre el estado previo de recuperación y añade como segundo padre el HEAD activo `e2f930645d2655de4493edb258501a38ce292766`; no se sobrescribió el historial anterior. La rama de desarrollo permanece `feature/mobile-bottom-navigation`.

- **26-11-2026:** workspace Render confirmado por el usuario: `My Workspace` (`tea-dbus0u5g1s2s73coteeg`). Auditoría de vigencia iniciada; no se eliminan archivos ni ramas sin verificar dependencias y autorización.
