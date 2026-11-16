# Adaptive Language Tutor

Aplicación web de aprendizaje de idiomas basada en práctica conversacional y adaptación pedagógica.

## Estado actual

La aplicación ya separa tres responsabilidades:
- **Motor pedagógico** (`src/core/pedagogy.js`): sesiones, evaluación de respuestas, rachas, adaptación y resumen.
- **Catálogos lingüísticos** (`src/content/`): ejercicios, respuestas aceptadas, pistas, explicaciones y etiquetas por idioma.
- **Interfaz** (`index.html`, `src/app.js`, `src/styles.css`): configuración, diagnóstico, práctica, repaso y exportación.

Idiomas con contenido inicial: portugués brasileño e inglés.

## Funciones implementadas

- Sesiones de 8, 15 o 25 turnos.
- Niveles iniciales desde cero, básico/intermedio o diagnóstico de cuatro preguntas.
- Diagnóstico orientativo separado de los turnos de práctica.
- Evaluación de respuestas que ignora mayúsculas, tildes y puntuación básica.
- Dos errores consecutivos activan un modo de apoyo; tres aciertos consecutivos habilitan ejercicios de mayor dificultad cuando existen.
- Registro de errores y vocabulario durante la sesión.
- Persistencia local versionada de sesiones, precisión e historial de vocabulario.
- Repetición espaciada de errores: primer repaso al día siguiente; tras aciertos, intervalos de 3, 7 y 14 días. Un fallo reinicia el ciclo a un día.
- Panel de progreso por idioma y acceso a repasos pendientes.
- Repasos programados sin consumir turnos de práctica.
- Resumen y exportación JSON del progreso.

## Ejecutar localmente

Abrir `index.html` en un navegador moderno. No se requiere compilación.

## Pruebas

Requiere Node.js 20 o superior:

```bash
npm test
```

GitHub Actions ejecuta las pruebas automáticamente al actualizar `main` o abrir un pull request.

## Limitaciones conocidas

- Los catálogos son pequeños y sirven para validar el flujo, no como curso completo.
- La evaluación libre compara respuestas normalizadas y variantes explícitas; todavía no interpreta semánticamente frases equivalentes.
- El diagnóstico es orientativo, no una certificación de nivel.
- El progreso se guarda en el almacenamiento local del navegador y dispositivo; no se sincroniza entre dispositivos ni navegadores. Si se borran los datos del sitio, se pierde el progreso local (se recomienda exportar una copia).
- No existe conexión a IA ni backend en esta fase.

## Próximos hitos

1. Ampliar y revisar los contenidos lingüísticos con criterios de nivel.
2. Completar perfiles y sincronización opcional entre dispositivos.
3. Ampliar los catálogos y revisar los contenidos lingüísticos con criterios de nivel.
4. Definir un contrato estructurado para tutor IA y evaluación semántica.
5. Añadir backend seguro para integrar el proveedor de IA sin exponer credenciales.
6. Completar pruebas de interfaz y pruebas humanas en móvil/escritorio.

**Seguridad:** nunca guardar claves API en el frontend ni en el repositorio.
