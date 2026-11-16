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

La base del backend y los adaptadores de proveedores ya está creada. El endpoint `POST /api/tutor` acepta el contexto del alumno y devuelve una respuesta estructurada. El endpoint `GET /api/health` informa si existe un proveedor configurado.

**Importante:** el frontend todavía utiliza el flujo local de ejercicios y no está conectado al endpoint de IA. Por tanto, esta entrega establece la infraestructura de integración, pero todavía no convierte la experiencia visible en un tutor impulsado por IA.

## Proveedores

Configuración mediante variables de entorno del servidor:

| Variable | Función |
|---|---|
| `AI_PROVIDER` | `openai`, `anthropic`, `gemini` o `openai-compatible` |
| `AI_API_KEY` | Credencial privada del proveedor |
| `AI_MODEL` | Identificador del modelo elegido |
| `AI_BASE_URL` | URL base para proveedores compatibles; obligatoria para `openai-compatible` |
| `PORT` | Puerto HTTP (predeterminado: 3000) |

No se selecciona un proveedor ni un modelo por defecto. Las credenciales deben configurarse en el entorno del servidor o en un archivo `.env` local ignorado por Git.

## Ejecutar localmente

Requiere Node.js 20 o superior.

1. Copiar `.env.example` a `.env`.
2. Completar proveedor, clave y modelo en `.env`.
3. Ejecutar:

```bash
npm start
```

El backend queda disponible en `http://localhost:3000`. Comprobación: `GET /api/health`.

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

GitHub Actions ejecuta las pruebas al actualizar `main` o abrir un pull request. Las pruebas de adaptadores usan respuestas simuladas: no consumen API ni validan todavía la calidad real de cada modelo.

## Funciones locales existentes

- Sesiones de 8, 15 o 25 turnos.
- Diagnóstico orientativo inicial.
- Catálogos A1/A2 de portugués brasileño e inglés.
- Evaluación local por coincidencia normalizada.
- Registro de errores y vocabulario.
- Repaso espaciado y progreso guardado en el navegador.
- Resumen y exportación JSON.

Estas funciones locales se mantendrán como respaldo y apoyo, pero la experiencia principal evolucionará hacia generación y evaluación dinámica mediante IA.

## Limitaciones pendientes

- El frontend aún no consume `/api/tutor`.
- No hay autenticación ni perfiles multiusuario.
- El progreso se guarda localmente y no se sincroniza entre dispositivos.
- La respuesta estructurada depende de que el modelo respete el contrato; las respuestas inválidas se rechazan.
- No se ha realizado una prueba humana de conversación con credenciales reales.
- La configuración de despliegue del backend y la gestión de secretos dependerán del hosting elegido.

## Próximos hitos

1. Conectar el flujo de sesión del frontend con `POST /api/tutor`, conservando el contexto de la conversación y el progreso.
2. Añadir pruebas del endpoint, límites de entrada y errores de proveedor.
3. Probar con un proveedor/modelo elegido por el usuario, midiendo calidad, latencia y costo.
4. Añadir persistencia remota y perfiles cuando se defina el despliegue.
5. Realizar pruebas humanas en móvil y escritorio.

**Seguridad:** nunca incluir claves API en el frontend, en archivos versionados ni en registros del navegador.
