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

Para la validación inicial sin introducir un método de pago, `.env.example` propone Google Gemini (`gemini-3.8-flash`), sujeto a la disponibilidad y cuota gratuita de la cuenta. La API de Gemini ya está integrada mediante `generateContent`. OpenAI sigue disponible como proveedor alternativo: utiliza en `AI_MODEL` el identificador de modelo habilitado para tu cuenta. Cambiar `AI_PROVIDER`, `AI_MODEL` y, cuando corresponda, `AI_BASE_URL` permite cambiar de proveedor sin modificar la lógica pedagógica. La clave debe configurarse solo en el entorno del servidor o en un archivo `.env` local ignorado por Git.

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

La respuesta normalizada contiene `message`, `exercise`, `evaluation`, `learnerUpdate` y `nextAction`. El nivel estimado por el tutor se conserva en el contexto de la sesión y se muestra en el resumen cuando el modelo aporta una estimación. El contrato está definido en `server/prompts.js`. Las llamadas a proveedores externos tienen un timeout de 30 segundos para evitar que una solicitud bloqueada deje la sesión esperando indefinidamente.

## Pruebas

Ejecutar localmente:

```bash
npm run check
npm test
```

GitHub Actions ejecuta ambos comandos al actualizar `main` o abrir un pull request hacia `main`. `npm run check` valida la sintaxis de los módulos principales; `npm test` ejecuta las pruebas automatizadas. Las pruebas cubren el contrato estructurado del tutor, los adaptadores de proveedores, el endpoint, la entrega de archivos estáticos y los módulos locales. Las pruebas de IA usan respuestas simuladas: no consumen API ni validan todavía la calidad real de cada modelo.

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
- El endpoint del tutor aplica un límite global en memoria de 60 solicitudes por cada 10 minutos y un máximo de 2 solicitudes simultáneas por instancia. El límite es compartido por todos los visitantes y se reinicia al reiniciar el servidor; no sustituye autenticación ni cuotas por usuario.
- El progreso se guarda localmente y no se sincroniza entre dispositivos.
- OpenAI usa Structured Outputs con un esquema JSON estricto; los demás adaptadores mantienen sus formatos nativos y el backend valida el contrato antes de devolver la respuesta.
- No se ha realizado una prueba humana de conversación con credenciales reales.
- La configuración de despliegue del backend y la gestión de secretos dependerán del hosting elegido.

## Próximos hitos

1. Configurar y probar un proveedor/modelo real elegido por el usuario, midiendo calidad, latencia y costo.
2. Incorporar autenticación y cuotas por usuario antes de exponer el backend públicamente; el límite global actual es solo una protección básica para pruebas.
3. Refinar el prompt pedagógico con sesiones reales y evaluación humana.
4. Añadir persistencia remota y perfiles cuando se defina el despliegue.
5. Realizar pruebas humanas en móvil y escritorio.

**Seguridad:** nunca incluir claves API en el frontend, en archivos versionados ni en registros del navegador.

## Ejecutar en Replit

La configuración de Replit está en `.replit` y utiliza `npm run dev`. El archivo `.env` es opcional: el backend carga ese archivo cuando existe, pero no lo exige. En Replit, configura las credenciales en **Secrets** (variables de entorno), sin crear ni subir un archivo con claves.

Secrets necesarios para Gemini:
- `AI_PROVIDER` = `gemini`
- `AI_API_KEY` = clave privada de Google AI Studio
- `AI_MODEL` = identificador de modelo disponible en tu cuenta

Replit proporciona `PORT` automáticamente cuando corresponde; localmente el servidor usa el puerto 3000 si no se define otro. El servidor escucha en `0.0.0.0` para aceptar conexiones del entorno de ejecución.

Después de pulsar Run, comprueba `/api/health`. Una respuesta con `status: "ok"` confirma que el servidor HTTP está activo. El campo `ai.configured` indica si el proveedor quedó configurado; no demuestra por sí solo que la clave tenga cuota o permisos válidos. La prueba real de Gemini se realiza enviando un turno al tutor.

Comandos:
- `npm run dev`: desarrollo con reinicio automático.
- `npm start`: ejecución normal.
- `npm test`: pruebas automatizadas.
- `npm run check`: validación sintáctica de los módulos principales.
