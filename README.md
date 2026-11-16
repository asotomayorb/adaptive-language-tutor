# Adaptive Language Tutor

Aplicación web de aprendizaje de idiomas con un tutor conversacional de IA, arquitectura independiente del proveedor y un modo local de respaldo.

## Estado del proyecto

**Estado general: desarrollo funcional en GitHub; todavía no listo para despliegue público ni para validación humana final.**

Última actualización del registro: 16-11-2026. Rama de trabajo: `feature/ai-tutor-pedagogy`. Pull request asociado: [#2 – Improve adaptive tutor pedagogy and AI integration](https://github.com/asotomayorb/adaptive-language-tutor/pull/2).

### Implementado en el código

- Frontend web con configuración de idioma, duración, nivel y tema de sesión.
- Tutor IA conectado desde el navegador al backend mediante `GET /api/health` y `POST /api/tutor`.
- Adaptadores configurables para OpenAI, Anthropic, Gemini y proveedores compatibles con la API de chat de OpenAI.
- Credenciales de IA gestionadas en el servidor, no en el navegador.
- Contrato estructurado para los turnos del tutor: mensaje, actividad, evaluación, actualización del alumno y siguiente acción.
- Prompt pedagógico con adaptación gradual, evaluación semántica, continuidad de sesión, pistas y cierre por duración.
- Contexto conversacional reciente (hasta 12 intercambios) enviado al proveedor.
- Modo local de respaldo con catálogos A1/A2 de portugués brasileño e inglés.
- Progreso local, vocabulario, registro de errores y exportación JSON. El repaso espaciado con tarjetas está implementado en el modo local; los errores generados en sesiones IA todavía no se convierten en tarjetas de repaso.
- Protección básica del endpoint IA: cuerpo limitado a 32 KB, mensaje limitado a 8.000 caracteres, timeout externo de 30 segundos, máximo global de 60 solicitudes cada 10 minutos y máximo de 2 solicitudes simultáneas por instancia.
- Pruebas automatizadas para API/servidor, proveedores, prompt, pedagogía y almacenamiento.
- Workflow de GitHub Actions definido en `.github/workflows/tests.yml`; ejecuta `npm run check` y `npm test` con Node 20.

### Verificado hasta ahora

- La ruta `GET /api/health` está implementada en `server/index.js`.
- La ruta `POST /api/tutor` valida la solicitud y llama al adaptador de IA.
- Los cuatro adaptadores están implementados y tienen pruebas con respuestas simuladas.
- Hay pruebas de endpoints, entrega de archivos estáticos, rechazo de path traversal, límites de solicitudes, contrato del prompt, lógica pedagógica y persistencia local.
- La rama de trabajo y el PR #2 existen. El PR registra una ejecución de GitHub Actions exitosa para ambos comandos de validación; debe comprobarse de nuevo el estado de CI asociado al último commit antes de considerar cerrada esta etapa.

**Importante:** que existan pruebas automatizadas no demuestra que una conversación con un proveedor real funcione ni que la enseñanza sea pedagógicamente adecuada. Las pruebas de proveedor utilizan respuestas simuladas y no consumen API.

## Pendientes prioritarios

### 1. Auditoría y validación técnica en GitHub

- [ ] Ejecutar o confirmar `npm run check` y `npm test` sobre el último commit de la rama.
- [ ] Revisar el flujo completo del frontend IA: inicio, envío, reintento, pistas, progreso, finalización y resumen.
- [ ] Revisar estados de error, solicitudes simultáneas y consistencia de los turnos.
- [ ] Integrar los errores y `learnerUpdate.errorsToReview` del modo IA con el sistema de repaso; actualmente las sesiones IA registran errores para el resumen, pero no generan tarjetas espaciadas.
- [ ] Revisar seguridad y límites del backend antes de cualquier despliegue público.
- [ ] Resolver hallazgos y volver a ejecutar CI.

### 2. Proveedor de IA real

- [ ] Confirmar que el identificador de modelo configurado en `.env.example` está disponible para la cuenta y la API elegidas.
- [ ] Configurar la clave como secreto privado en el entorno de ejecución; nunca compartirla en el chat ni subirla al repositorio.
- [ ] Ejecutar una conversación real de principio a fin.
- [ ] Comprobar idioma, dialecto, adaptación de nivel, evaluación de respuestas, continuidad, pistas, duración, errores, latencia y consumo/costo.
- [ ] Comparar otro proveedor si el primero presenta problemas de cuota, calidad o costo.

### 3. Prueba humana y producto

- [ ] Probar en móvil y escritorio los flujos de portugués brasileño e inglés.
- [ ] Evaluar si las actividades son variadas, naturales, progresivas y útiles.
- [ ] Corregir problemas de interfaz y experiencia detectados en la prueba.
- [ ] Confirmar que el modo local sigue funcionando si la API no está configurada o falla.

### 4. Preparación para despliegue

- [ ] Definir hosting y configuración de producción.
- [ ] Incorporar autenticación y límites/cuotas por usuario antes de abrir el servicio al público. El límite actual es global, en memoria, compartido por todos los visitantes y se reinicia al reiniciar la instancia.
- [ ] Evaluar persistencia remota y perfiles si se requiere sincronización entre dispositivos.
- [ ] Revisar privacidad, tratamiento de datos y condiciones del proveedor elegido.
- [ ] Completar revisión del PR y hacer merge solo después de validar los puntos anteriores.

## Arquitectura

- **Frontend:** `index.html`, `src/app.js`, `src/styles.css`.
- **Backend HTTP:** `server/index.js`.
- **Adaptadores de IA:** `server/provider.js`.
- **Prompt y esquema de respuesta:** `server/prompts.js`.
- **Cliente del tutor:** `src/core/tutor-client.js`.
- **Pedagogía y modo local:** `src/core/pedagogy.js`, `src/content/`.
- **Persistencia local:** `src/core/storage.js`.
- **Pruebas:** `tests/`.

## Configuración y ejecución local

Requiere Node.js 20.6 o superior.

1. Copiar `.env.example` a `.env`.
2. Configurar `AI_PROVIDER`, `AI_API_KEY` y `AI_MODEL`. Para `openai-compatible`, configurar también `AI_BASE_URL`.
3. Ejecutar:

```bash
npm start
```

La aplicación queda disponible en `http://localhost:3000`. Para desarrollo con reinicio automático:

```bash
npm run dev
```

Validaciones:

```bash
npm run check
npm test
```

### Variables de entorno

| Variable | Uso |
|---|---|
| `AI_PROVIDER` | `openai`, `anthropic`, `gemini` o `openai-compatible` |
| `AI_API_KEY` | Clave privada del proveedor |
| `AI_MODEL` | Identificador del modelo habilitado en la cuenta |
| `AI_BASE_URL` | URL base para proveedores compatibles; requerida para `openai-compatible` |
| `PORT` | Puerto HTTP; predeterminado: 3000 |

El archivo `.env.example` contiene actualmente una configuración inicial propuesta para Gemini. La disponibilidad del modelo, cuota, condiciones y precio deben confirmarse en la cuenta y documentación oficial antes de una prueba real.

## Privacidad y seguridad

- No introducir claves API en frontend, commits, Issues, logs públicos ni conversaciones.
- Si se usa el nivel gratuito de un proveedor, revisar sus condiciones de tratamiento de datos. Para pruebas iniciales utilizar únicamente datos ficticios.
- No considerar el límite global actual como protección suficiente para un servicio público.
- El progreso actual se guarda en el navegador; no existe sincronización remota ni cuenta de usuario.

## Replit: aplazado hasta el final

**Replit queda deliberadamente fuera del flujo de trabajo actual.** El desarrollo, auditoría, correcciones y validaciones se realizarán primero en GitHub sobre la rama indicada. No invertir más tiempo en depurar Replit durante esta etapa.

Una vez que CI, la prueba real del proveedor y la prueba humana estén aprobadas, se revisarán la configuración de ejecución y el entorno de Replit como último paso. El archivo `.replit` está presente en la rama; eso, por sí solo, no confirma que el entorno de Replit esté correctamente configurado o que su compilación Nix funcione.
