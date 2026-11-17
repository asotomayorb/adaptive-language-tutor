# Adaptive Language Tutor

Aplicación web de aprendizaje de idiomas con tutor conversacional de IA y modo local de respaldo.

## Estado actual

**Etapa 4 de 8: auditoría funcional y técnica en GitHub.** Gemini 3.5 Flash-Lite completó sesiones reales de 3 turnos en portugués brasileño (`pt-BR`) y francés (`fr-FR`), con 5 fragmentos de voz por idioma. Una sesión real adicional desde Chromium completó 3 turnos en francés, guardó el progreso y exportó el JSON. Tests y Browser E2E están aprobados. Se restringió el acceso a archivos públicos, se añadieron cabeceras de seguridad y se corrigieron los reintentos duplicados. Falta validar voces en dispositivos reales, completar la auditoría funcional y cerrar aspectos de seguridad antes de la prueba humana; no está listo para despliegue público.

**Próximo paso:** completar la cobertura de audio en todas las vistas, probar navegadores/dispositivos reales y cerrar los hallazgos de auditoría. El detalle de etapas, verificaciones y pendientes está en [PROJECT_STATUS.md](PROJECT_STATUS.md).

Rama de trabajo: `feature/ai-tutor-pedagogy` · [PR #2](https://github.com/asotomayorb/adaptive-language-tutor/pull/2).

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
