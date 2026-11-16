# Adaptive Language Tutor

Aplicación web de aprendizaje de idiomas cuyo tutor principal está diseñado para funcionar mediante una API de IA, con arquitectura independiente del proveedor.

## Arquitectura objetivo

- **Frontend** (`index.html`, `src/app.js`, `src/styles.css`): interfaz, configuración y presentación de la experiencia.
- **Backend** (`server/`): valida solicitudes, conserva las credenciales fuera del navegador y comunica la aplicación con el proveedor seleccionado.
- **Adaptador de IA** (`server/provider.js`): interfaz común para OpenAI, Anthropic, Gemini y servicios compatibles con la API de chat de OpenAI.
- **Contrato pedagógico** (`server/prompts.js`): define el formato estructurado de las respuestas del tutor y las reglas de adaptación.
- **Persistencia** (`src/core/storage.js`, actualmente local): conserva el progreso en el navegador; la sincronización remota será una etapa posterior.
- **Catálogos** (`src/content/`): material lingüístico de referencia y respaldo, no el motor principal de generación de clases.

## Estado actual

El frontend ya consulta `GET /api/health` al iniciar. Cuando detecta un proveedor configurado, deriva las sesiones al endpoint `POST /api/tutor`; cuando el backend no está disponible o no hay proveedor configurado, conserva el modo local como respaldo. En modo IA, las respuestas y actividades se generan y evalúan dinámicamente y el cliente envía el contexto de la sesión al backend.

La integración está implementada, pero todavía no se ha probado con credenciales reales ni se ha evaluado la calidad pedagógica de un modelo en uso real.

## Proveedores

Configuración mediante variables de entorno del servidor:

| Variable | Función |
|---|---|
| `AI_PROVIDER` | `openai`, `anthropic`, `gemini` o `openai-compatible` |
| `AI_API_KEY` | Credencial privada del proveedor |
| `AI_MODEL` | Identificador del modelo elegido |
| `AI_BASE_URL` | URL base para proveedores compatibles; obligatoria para `openai-compatible` |
| `PORT` | Puerto HTTP (predeterminado: 3000) |

Para la validación inicial sin introducir un método de pago, `.env.example` propone Google Gemini (`gemini-3.8-flash`), sujeto a la disponibilidad y cuota gratuita de la cuenta. La API de Gemini ya está integrada mediante `generateContent`. OpenAI sigue disponible como proveedor alternativo (`gpt-6-luna` en la configuración anterior); cambiar `AI_PROVIDER`, `AI_MODEL` y, cuando corresponda, `AI_BASE_URL` permite cambiar de proveedor sin modificar la lógica pedagógica. La clave debe configurarse solo en el entorno del servidor o en un archivo `.env` local ignorado por Git.

**Privacidad del nivel gratuito:** Google indica que el contenido enviado mediante el nivel gratuito puede utilizarse para mejorar sus productos. Para esta etapa, probar solo con ejemplos ficticios y no introducir datos personales ni información sensible. Consulta las condiciones y cuotas vigentes en la [documentación oficial de precios](https://ai.google.dev/gemini-api/docs/pricing).

## Ejecutar localmente

Requiere Node.js 20.6 o superior.

1. Copiar `.env.example` a `.env`.
2. Completar proveedor, clave y modelo en `.env`.
3. Ejecutar:

```bash
npm start
```

La aplicación web y el backend quedan disponibles en `http://localhost:3000`. El frontend detecta automáticamente si hay un proveedor configurado: si lo hay, usa el tutor IA; si no, conserva el modo local. Comprobación del backend: `GET /api/health`.

## Contrato de tutoría

El endpoint `POST /api/tutor` recibe un objeto JSON con:
- `userMessage` (obligatorio).
- `task` (opcional).
- `learner` (idioma objetivo, dialecto, nivel, idioma nativo, metas y preferencias).
- `session` (objetivos y estado de la sesión).
- `history` (últimos intercambios relevantes).

La respuesta normalizada contiene `message`, `exercise`, `evaluation`, `learnerUpdate` y `nextAction`. El contrato está definido en `server/prompts.js`.

## Pruebas

```bash
npm test
```

GitHub Actions ejecuta `npm run check` y `npm test` al actualizar `main` o abrir un pull request. Las pruebas cubren el contrato estructurado del tutor, los adaptadores de proveedores, el endpoint, la entrega de archivos estáticos y los módulos locales. Las pruebas de IA usan respuestas simuladas: no consumen API ni validan todavía la calidad real de cada modelo.

## Funciones locales existentes

- Sesiones de 8, 15 o 25 turnos.
- Diagnóstico orientativo inicial.
- Catálogos A1/A2 de portugués brasileño e inglés.
- Evaluación local por coincidencia normalizada.
- Registro de errores y vocabulario.
- Repaso espaciado y progreso guardado en el navegador.
- Resumen y exportación JSON.

Estas funciones locales se mantienen como modo de respaldo cuando no hay un proveedor de IA configurado. Cuando la API está disponible, el flujo principal utiliza el tutor dinámico.

## Limitaciones pendientes

- No hay autenticación ni perfiles multiusuario.
- El progreso se guarda localmente y no se sincroniza entre dispositivos.
- OpenAI usa Structured Outputs con un esquema JSON estricto; los demás adaptadores mantienen sus formatos nativos y el backend valida el contrato antes de devolver la respuesta.
- No se ha realizado una prueba humana de conversación con credenciales reales.
- La configuración de despliegue del backend y la gestión de secretos dependerán del hosting elegido.

## Próximos hitos

1. Configurar y probar un proveedor/modelo real elegido por el usuario, midiendo calidad, latencia y costo.
2. Reforzar límites de uso, autenticación y protección contra abuso antes de exponer el backend públicamente.
3. Refinar el prompt pedagógico con sesiones reales y evaluación humana.
4. Añadir persistencia remota y perfiles cuando se defina el despliegue.
5. Realizar pruebas humanas en móvil y escritorio.

**Seguridad:** nunca incluir claves API en el frontend, en archivos versionados ni en registros del navegador.
