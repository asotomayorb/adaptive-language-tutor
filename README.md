# Adaptive Language Tutor

Aplicación web de aprendizaje de idiomas con tutor conversacional de IA y modo local de respaldo.

## Estado actual

**Etapa 4 de 8: auditoría funcional y técnica en GitHub.** Gemini 3.5 Flash-Lite completó sesiones reales de 3 turnos en portugués brasileño (`pt-BR`) y francés (`fr-FR`), con 5 fragmentos de voz por idioma. Una sesión real adicional desde Chromium completó 3 turnos en francés, guardó el progreso y exportó el JSON. Tests y Browser E2E están aprobados. Se restringió el acceso a archivos públicos, se añadieron cabeceras de seguridad y se corrigieron los reintentos duplicados. Falta validar voces en dispositivos reales, completar la auditoría funcional y cerrar aspectos de seguridad antes de la prueba humana; no está listo para despliegue público.

**Próximo paso:** completar la cobertura de audio en todas las vistas, probar navegadores/dispositivos reales y cerrar los hallazgos de auditoría. El detalle de etapas, verificaciones y pendientes está en [PROJECT_STATUS.md](PROJECT_STATUS.md). El procedimiento de validación manual está preparado en [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md).

Rama de trabajo: `feature/ai-tutor-pedagogy` · [PR #2](https://github.com/asotomayorb/adaptive-language-tutor/pull/2).

## Reconstrucción funcional — 21-11-2026

### Criterio y base de trabajo
- Se crea la rama `rebuild/functional-baseline` desde `feature/ai-tutor-pedagogy` (commit base `6b812581078e42cfa9bc452b25474901ba743a59`). Es una base temporal de trabajo, no una declaración de versión lista para producción.
- Se elige esta base por mantener módulos separados para interfaz, pedagogía, persistencia, voz, cliente IA y servidor, con pruebas unitarias y Browser E2E. La rama `feature/mobile-bottom-navigation` tiene una interfaz más desarrollada, pero acumula una gran cantidad de cambios concentrados en `src/app.js`; se usará como referencia de comportamientos e interfaces, no como sustitución automática.
- No se modifica `main`, no se fusionan PR #2 ni #3 y no se elimina ni reescribe ninguna rama.
- La rama de reconstrucción prioriza funcionamiento, contratos verificables, estado y ciclo de vida. No se amplía contenido ni catálogo por ahora.

### Auditoría de interfaz y comportamiento
- La base elegida todavía muestra una pantalla de configuración/sesión; no contiene la navegación completa acordada (Ruta, Entrenamiento, Idiomas, Teoría y Estadísticas). No debe presentarse como interfaz final.
- Los catálogos visibles de esta base son portugués brasileño e inglés; el alcance vigente de la reconstrucción deberá quedar limitado a italiano como idioma objetivo.
- El contrato de audio actual solo devuelve fragmentos del idioma objetivo en `speechSegments`; no representa preguntas mixtas origen/destino con segmentos, subrayado selectivo y reproducción individual. Esta regla nueva reemplaza el comportamiento anterior.
- El flujo conversacional de esta base sí incluye el resultado inicial del tutor en el historial que se envía junto con la primera respuesta del alumno. Este comportamiento debe conservarse y mantenerse cubierto por pruebas.
- La persistencia de progreso es local al navegador. No se ha verificado sincronización remota ni debe asumirse.
- Las pruebas automatizadas de esta base incluyen `npm run check`, `npm test` y `npm run test:e2e`; los resultados históricos de ramas anteriores no certifican automáticamente los cambios de esta reconstrucción.

### Orden de reconstrucción
1. Asegurar contratos de datos y flujos conversacionales.
2. Implementar TTS por segmentos de idioma: lectura secuencial origen/destino, subrayado solo del segmento objetivo y replay individual; excluir alternativas y respuestas.
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
