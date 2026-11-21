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

No se selecciona un proveedor ni un modelo por defecto. Las credenciales deben configurarse en el entorno del servidor o en un archivo `.env` local ignorado por Git.

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

GitHub Actions ejecuta `npm run check` y `npm test` al actualizar `main` o abrir un pull request. Las 26 pruebas actuales cubren el contrato de los adaptadores, el endpoint, la entrega de archivos estáticos y los módulos locales. Las pruebas de IA usan respuestas simuladas: no consumen API ni validan todavía la calidad real de cada modelo.

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
- La respuesta estructurada depende de que el modelo respete el contrato; las respuestas inválidas se rechazan.
- No se ha realizado una prueba humana de conversación con credenciales reales.
- La configuración de despliegue del backend y la gestión de secretos dependerán del hosting elegido.

## Próximos hitos

1. Configurar y probar un proveedor/modelo real elegido por el usuario, midiendo calidad, latencia y costo.
2. Reforzar límites de uso, autenticación y protección contra abuso antes de exponer el backend públicamente.
3. Refinar el prompt pedagógico con sesiones reales y evaluación humana.
4. Añadir persistencia remota y perfiles cuando se defina el despliegue.
5. Realizar pruebas humanas en móvil y escritorio.

**Seguridad:** nunca incluir claves API en el frontend, en archivos versionados ni en registros del navegador.

## Decisiones funcionales y de producto (21-11-2026)

Esta sección registra los acuerdos de producto definidos durante el rediseño de la experiencia. Estas decisiones complementan la arquitectura técnica anterior y deben considerarse requisitos de referencia para futuras modificaciones.

### 1. Punto de partida y navegación

- Retrotraer la experiencia a la base estable, conservando la bienvenida y la pantalla de inicio.
- La navegación principal debe contener, en este orden conceptual: **Ruta**, **Entrenamiento**, **IDIOMAS**, **Teoría** y **Estadísticas**.
- **IDIOMAS** debe ocupar la posición central y tener mayor jerarquía visual/tamaño.
- En el estado actual, solo **Idiomas** y **Estadísticas** deben estar seleccionables, además de la sección que se encuentre efectivamente en desarrollo. No habilitar secciones incompletas como si estuvieran terminadas.
- El idioma objetivo único de esta etapa es **italiano**.
- Los cambios de configuración deben aplicarse globalmente por defecto, no solo a una actividad o pantalla aislada.
- Conservar los avances del usuario al reorganizar o restaurar la interfaz.

### 2. Teoría: repositorio pedagógico común

- La sección **Teoría** debe estar desbloqueada desde el inicio, para que el usuario pueda consultar los contenidos y revisar resultados sin tener que completar primero la Ruta.
- La interfaz de Teoría debe estar siempre visible y navegable, incluso cuando ciertos contenidos o actividades aún no estén disponibles.
- Presentar las categorías de forma compacta: **Gramática**, **Vocabulario** y **Expresiones**.
- Teoría es el repositorio común de conocimientos de la aplicación. Debe organizarse por dificultad/profundidad y por temas.
- Las preguntas y actividades de Ruta y de los demás modos deben basarse en los contenidos definidos en Teoría. Evitar que cada modo mantenga temarios pedagógicos independientes o contradictorios.

### 3. Ruta: unidades, slides y evaluación

- La Ruta se organiza en unidades/capítulos de **10 ejercicios**.
- Cada unidad introduce primero sus conceptos mediante slides explicativas.
- Después de la introducción, el capítulo 1 evalúa los conceptos de esa unidad.
- Al aprobar la evaluación, marcar las slides/conceptos correspondientes con un ticket verde de completado.
- Una vez aprobados, ofrecer acceso a su repaso desde un panel o navegación lateral.
- La evaluación debe medir contenidos que hayan sido introducidos y estén disponibles en el repositorio común de Teoría.

### 4. Reproducción de voz (TTS): segmentación por idioma

El TTS debe respetar el idioma real de cada fragmento de texto. No debe asignar un único idioma a toda la pregunta cuando esta combina el idioma de origen y el idioma objetivo.

Reglas:

- Por defecto, las instrucciones y preguntas se formulan en el **idioma de origen**.
- Dentro de una instrucción puede aparecer un fragmento que debe evaluarse en el idioma objetivo o, cuando corresponda, en el idioma de origen.
- El TTS debe identificar y reproducir cada segmento en el idioma que le corresponde, manteniendo el orden original de lectura.
- No debe leer toda la pregunta como si estuviera escrita exclusivamente en el idioma de origen ni cambiar al idioma objetivo para leer toda la frase.
- El fragmento correspondiente al **idioma objetivo** debe quedar subrayado en la interfaz para permitir reproducir nuevamente ese fragmento de forma individual.
- El subrayado y la reproducción individual deben aplicarse solo al texto del idioma objetivo, no a la pregunta completa ni a los fragmentos en idioma de origen.
- Por ahora, el TTS no debe aplicarse a alternativas, opciones de respuesta ni respuestas.

**Ejemplo obligatorio de comportamiento**

Texto presentado: «¿Qué significa buongiorno?», donde «buongiorno» es el fragmento en italiano.

Orden de reproducción:
1. «¿Qué significa» — voz en español (idioma de origen).
2. «buongiorno» — voz en italiano (idioma objetivo).

En pantalla, únicamente **buongiorno** debe aparecer subrayado. Al pulsarlo o activar su reproducción individual, debe escucharse nuevamente «buongiorno» en italiano. No se debe volver a leer toda la pregunta.

La segmentación debe funcionar aunque el fragmento insertado esté en el idioma de origen en lugar del idioma objetivo. La regla general es detectar el idioma de cada segmento, no asumir que todo texto entre delimitadores o dentro de una pregunta pertenece siempre al idioma destino.

### 5. Criterios de implementación y validación

- Mantener separadas la presentación de la interfaz, la lógica pedagógica, la generación/evaluación del tutor y los servicios de voz.
- Las reglas de idioma de origen y objetivo deben obtenerse de la configuración global del estudiante.
- Validar el TTS con preguntas mixtas que contengan texto de origen y destino, comprobando tanto el idioma de cada segmento como el orden de reproducción.
- Verificar que solo los fragmentos del idioma objetivo sean subrayables/reproducibles individualmente.
- Comprobar que alternativas y respuestas no activen TTS por ahora.
- Verificar que Ruta, Entrenamiento y las demás actividades utilicen contenidos coherentes con el repositorio de Teoría.
- Las decisiones aquí registradas son requisitos acordados; su inclusión en este documento no implica que ya estén implementadas o probadas en la aplicación.

