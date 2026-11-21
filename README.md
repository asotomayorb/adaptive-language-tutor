# Adaptive Language Tutor

Aplicación web de aprendizaje de idiomas con tutor conversacional de IA y modo local de respaldo.

## Estado actual

**Reconstrucción funcional en curso.** La rama `rebuild/functional-baseline` se creó desde la base modular `feature/ai-tutor-pedagogy`. Ya incluye un shell móvil de cinco secciones, Italiano como único idioma objetivo, fixtures locales mínimos, TTS segmentado en el tutor IA y la distribución visual recuperada de la rama anterior. Estadísticas vuelve a incluir tabla comparativa, selector Global/idioma, barras horizontales globales y gráfico diario de preguntas/precisión. `npm run check`, `npm test` y Browser E2E están aprobados en el commit `95de77c`. Aún no está listo para producción ni se ha realizado la prueba humana Android.

**Próximo paso:** cerrar CI/Browser E2E de la restauración visual, verificar el preview Render y continuar con persistencia, navegación y ciclo de vida en todos los flujos. El detalle de etapas, verificaciones y pendientes está en [PROJECT_STATUS.md](PROJECT_STATUS.md). El procedimiento de validación manual está preparado en [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md).

Rama de trabajo: `rebuild/functional-baseline`. PR #2 y PR #3 permanecen intactos y sin fusionar.

## Reconstrucción funcional — 21-11-2026

### Criterio y base de trabajo
- Se crea la rama `rebuild/functional-baseline` desde `feature/ai-tutor-pedagogy` (commit base `6b812581078e42cfa9bc452b25474901ba743a59`). Es una base temporal de trabajo, no una declaración de versión lista para producción.
- Se elige esta base por mantener módulos separados para interfaz, pedagogía, persistencia, voz, cliente IA y servidor, con pruebas unitarias y Browser E2E. La rama `feature/mobile-bottom-navigation` tiene una interfaz más desarrollada, pero acumula una gran cantidad de cambios concentrados en `src/app.js`; se usará como referencia de comportamientos e interfaces, no como sustitución automática.
- No se modifica `main`, no se fusionan PR #2 ni #3 y no se elimina ni reescribe ninguna rama.
- La rama de reconstrucción prioriza funcionamiento, contratos verificables, estado y ciclo de vida. No se amplía contenido ni catálogo por ahora.

### Auditoría de interfaz y comportamiento
- La reconstrucción ya incorpora una primera carcasa móvil de cinco secciones: Ruta, Entrenamiento, Idiomas, Teoría y Estadísticas. Idiomas es la pantalla inicial y ocupa la posición central en la navegación; Ruta y Teoría permanecen deshabilitadas hasta implementar sus flujos. Entrenamiento, Idiomas y Estadísticas están accesibles.
- Los catálogos visibles de esta base son portugués brasileño e inglés; el alcance vigente de la reconstrucción deberá quedar limitado a italiano como idioma objetivo.
- En la auditoría inicial, el contrato de audio solo devolvía fragmentos del idioma objetivo. La nueva implementación añade `questionSegments` con texto, idioma, locale e indicador `isTarget`; el servidor exige reconstrucción exacta de la consigna y valida locales cuando se proporcionan.
- El flujo conversacional de esta base sí incluye el resultado inicial del tutor en el historial que se envía junto con la primera respuesta del alumno. Este comportamiento debe conservarse y mantenerse cubierto por pruebas.
- La persistencia de progreso es local al navegador. No se ha verificado sincronización remota ni debe asumirse.
- Las pruebas automatizadas de esta base incluyen `npm run check`, `npm test` y `npm run test:e2e`; los resultados históricos de ramas anteriores no certifican automáticamente los cambios de esta reconstrucción.


### Implementación TTS segmentado — 21-11-2026
- [x] Contrato de tutor IA ampliado con `questionSegments`: `text`, `language`, `locale`, `isTarget`.
- [x] Consigna completa validada al concatenar segmentos; se rechazan omisiones, texto añadido y locale incorrecto para los idiomas origen/destino configurados.
- [x] Prompt pedagógico: instrucciones por defecto en idioma nativo; fragmento objetivo solo cuando es el elemento que se evalúa.
- [x] Interfaz de tutor IA: reproduce los segmentos en orden; subraya únicamente `isTarget=true`; al pulsarlo reproduce solo ese fragmento.
- [x] Ejercicios locales: lectura de la consigna en español; sin TTS en alternativas ni en feedback/respuestas.
- [x] Sección IDIOMAS inicial y central, Entrenamiento y Estadísticas accesibles; Ruta y Teoría visibles pero deshabilitadas.
- [x] Sesión de entrenamiento sin navegación inferior, con control de audio y confirmación antes de descartar una sesión.
- [x] Locale nativo predeterminado provisional `es-CL`; falta integrarlo con la configuración global para que sea modificable.
- [x] Prueba Browser E2E agregada para consigna mixta español/francés, orden de voces, subrayado y replay del fragmento objetivo.
- [x] `npm run check`, `npm test` y Browser E2E aprobados en el commit `95de77c`.
- [x] Browser E2E valida el caso mixto español/italiano, replay del fragmento objetivo, ausencia de TTS en respuestas, navegación, pantalla móvil sin scroll, persistencia, exportación y cierre/descartado de sesión.
- [ ] Extender la segmentación mixta a todos los tipos de consigna y futuras pantallas; verificar que opciones y respuestas no reciban TTS.
- [x] Selector y catálogo activo limitados a italiano. Los archivos de portugués e inglés permanecen en el repositorio como contenido histórico, pero ya no se ofrecen en la interfaz.

### Orden de reconstrucción
1. Asegurar contratos de datos y flujos conversacionales.
2. [En implementación] TTS por segmentos en el tutor IA: lectura secuencial origen/destino, subrayado solo del segmento objetivo y replay individual. Falta extenderlo a las demás vistas; alternativas y respuestas permanecen excluidas.
3. Recuperar la navegación y ciclo de vida acordados, con pantallas utilizables en móvil.
4. Verificar persistencia, errores, reintentos y modo local sin proveedor IA.
5. Ejecutar CI y Browser E2E en el commit final; después desplegar un Render Preview de esta rama.
6. Realizar prueba humana en Android. La automatización de navegador no demuestra que el dispositivo emita audio real.

### Registro de verificación
- Auditoría de ramas y estructura completada el 21-11-2026.
- No se ha realizado todavía una prueba humana Android sobre esta rama.
- No declarar la reconstrucción lista ni usar un preview como validación funcional hasta que los pasos automatizados y manuales correspondientes estén completados.

## Arquitectura

- Frontend: `index.html`, `src/app.js`, `src/styles.css`.
- Backend y API: `server/index.js`.
- Adaptadores IA: `server/provider.js`.
- Prompt y esquema: `server/prompts.js`.
- Cliente IA: `src/core/tutor-client.js`.
- Pedagogía, contenidos y progreso local: `src/core/`, `src/content/`.
- Pruebas: `tests/`.

## Ejecución local

Requiere Node.js 20.6 o superior. Copiar `.env.example` a `.env`, configurar `AI_PROVIDER`, `AI_API_KEY` y `AI_MODEL` (y `AI_BASE_URL` si corresponde), y ejecutar:

```bash
npm start
```

La aplicación queda en `http://localhost:3000`. Desarrollo: `npm run dev`. Validación: `npm run check` y `npm test`. Para una sesión real de diagnóstico del proveedor, inicia el servidor con las variables privadas configuradas y ejecuta `npm run test:provider-live` en otra terminal. El smoke test realiza una sesión corta de tres turnos y no imprime respuestas ni credenciales.

Nunca subir claves API al repositorio. Para pruebas iniciales con proveedores externos, usar datos ficticios.

## Replit

Replit queda aplazado hasta que las etapas de auditoría, proveedor real y prueba humana estén aprobadas. El desarrollo y las correcciones se realizan primero en GitHub.

## Restauración visual y Estadísticas — 21-11-2026

- Se recupera la navegación inferior de cinco posiciones, con iconos familiares y etiquetas visibles: Ruta, Entrenamiento, Idiomas (centro destacado), Teoría y Estadísticas. Ruta y Teoría siguen deshabilitadas hasta implementar sus flujos; no se reactiva funcionalidad incompleta.
- Se recupera la jerarquía de pantalla anterior: títulos centrados, tarjetas blancas, paneles redondeados y espacios compactos para móvil.
- Estadísticas vuelve a mostrar tabla por idioma (sesiones, palabras, precisión y progreso de Ruta), selector de vista Global/idioma, barras horizontales globales de ancho completo y gráfico diario por idioma con dos series: preguntas respondidas y precisión. El eje X usa días practicados consecutivos (1…15), sin fechas de calendario ni huecos por inactividad.
- El gráfico diario conserva leyenda y puntos legibles, usa desplazamiento horizontal interno solo cuando sea necesario para mantener legibilidad; la vista global prioriza filas horizontales que caben en el ancho móvil.
- Como Ruta aún no está habilitada en esta reconstrucción, su indicador se muestra como no disponible (—), nunca como progreso inventado.
- [x] `npm test` aprobó en el commit `e5d864b`; Browser E2E detectó que el inicio quedaba más alto que el viewport al agregar etiquetas de navegación.
- [x] Se redujo la altura mínima de la pantalla Idiomas para conservar el inicio compacto en móvil.
- [ ] Browser E2E de la corrección de altura y de la tabla/gráficos sigue pendiente; ver el último run en GitHub Actions antes de declarar validado.
- [ ] Revisar el preview Render actualizado en móvil y confirmar la distribución visual. El servicio Render aún muestra el deploy anterior; no asumir que ya contiene estos cambios hasta verificar el commit desplegado.
