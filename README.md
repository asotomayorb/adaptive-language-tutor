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


## Pantalla de bienvenida y navegación inferior — 21-11-2026
- Se incorpora una pantalla de bienvenida independiente con el título “Adaptive Language Tutor” y botón “Continuar”; el inicio con secciones y la navegación inferior aparecen solo después de continuar.
- Se rediseña la barra inferior como una bandeja flotante redondeada, con icono sobre etiqueta y acceso central Idiomas elevado, para aproximarse al esquema visual acordado.
- Esta modificación corrige la ausencia de la bienvenida y la presentación plana anterior. Debe verificarse visualmente en Render y con Browser E2E; no declarar despliegue actualizado hasta confirmar el SHA servido.


## Auditoría de discrepancia de preview y referencia — 21-11-2026
- Se confirma que el preview compartido para la reconstrucción (adaptive-language-tutor-rebuild-preview.onrender.com) sirve el commit antiguo deca27b, no los commits recientes de rebuild/functional-baseline. Por eso la pantalla de bienvenida y el rediseño de navegación no aparecen allí.
- La rama de referencia feature/mobile-bottom-navigation sigue existiendo en GitHub (HEAD 734b689); no fue eliminada ni sobrescrita. Su README documenta una navegación distinta (cuatro secciones, solo iconos), así que no debe confundirse con la especificación de cinco posiciones usada en la reconstrucción.
- La reconstrucción actual no es una restauración visual fiel: se simplificó la interfaz y se reimplementó Estadísticas, por lo que el gráfico previo puede no estar reproducido íntegramente. No afirmar que el diseño o sus gráficos se recuperaron hasta comparar la implementación de referencia y validar en el preview correcto.
- Preview indicado por el README de la rama de referencia: https://adaptive-language-tutor-preview-5b3d.onrender.com. Debe comprobarse que corresponda al servicio y commit esperados antes de compartirlo como preview actualizado.
- Acción correctiva pendiente: comparar la rama de referencia con la reconstrucción, recuperar de ella la interfaz/gráficos acordados sin perder la base funcional, y asociar/desplegar el preview correcto. No se modificó ni eliminó ninguna rama en esta auditoría.


## Alcance confirmado para la siguiente etapa — 21-11-2026
- Se toma la interfaz visual recuperada como base y se conserva; no se rediseña durante la restauración funcional.
- Añadir/confirmar el acceso central de la barra inferior como selector de idiomas, con italiano como única opción visible por ahora.
- A partir de esa base, retrotraer el funcionamiento por etapas según los contratos y decisiones ya definidos, priorizando comportamiento sobre ampliación de contenido.
- Cada etapa debe ser acotada, probada y registrada antes de continuar; no declarar cambios desplegados sin verificar el commit servido por Render.


## Próximo ajuste de interfaz y limpieza — 21-11-2026
- Mantener el formato visual actual como base; no rediseñar la interfaz durante este ajuste.
- Asegurar el acceso/icono central de Idiomas en la barra inferior como selector, con Italiano como única opción visible.
- Deshabilitar la selección y el acceso a Ruta y Entrenamiento; no borrar sus módulos ni sus datos en esta etapa.
- Conservar Teoría y Estadísticas sin cambios de estética ni funcionamiento.
- Después de validar estos cambios, auditar rutas, archivos y ramas duplicados o similares. Eliminar solo duplicados confirmados; mantener cualquier trabajo único como respaldo con nombre y documentación explícitos para evitar confusión.
- Validar el resultado antes de continuar con la restauración funcional progresiva. No se ha realizado aún esta implementación ni limpieza.


## Ejecución del ajuste inicial — 21-11-2026
- Se inició la implementación, pero la inspección del código detectó que `rebuild/functional-baseline` no contiene una pantalla ni módulo de Teoría: su botón está deshabilitado y no existe `#screen-theory`. Por tanto, no es posible cumplir «conservar Teoría tal como está» aplicando solo un bloqueo de Ruta/Entrenamiento; primero debe portarse la implementación funcional de Teoría desde `feature/mobile-bottom-navigation` o acordarse usar esa rama como referencia visual primaria.
- En `rebuild/functional-baseline`, Estadísticas sí existe y su implementación está en `src/app.js` y `index.html`; no se modificó.
- No se modificó código de interfaz ni se desplegó un commit nuevo en esta etapa, para evitar publicar una versión que omita Teoría o rompa la validación E2E de Entrenamiento/Estadísticas.
- Render tiene dos servicios activos: `adaptive-language-tutor-rebuild-preview` (rama `rebuild/functional-baseline`, autoDeploy) y `adaptive-language-tutor-preview-5b3d` (rama `feature/mobile-bottom-navigation`, autoDeploy desactivado). Las acciones Render conectadas disponibles permiten listar/consultar/desplegar, pero no eliminar servicios ni cambiar la rama del servicio existente. No se puede garantizar un único preview desde estas acciones sin intervenir en el Dashboard.
- Las ramas `feature/mobile-bottom-navigation` y `rebuild/functional-baseline` contienen implementaciones únicas (Teoría y módulos pedagógicos modulares, respectivamente); no se borran ni se marcan como duplicados. Próximo paso seguro: integrar Teoría de referencia en la base modular, adaptar E2E a Ruta/Entrenamiento bloqueados y verificar Estadísticas, luego consolidar el servicio único desde Render Dashboard.


## Ajuste de navegación — 21-11-2026
- [x] Se mantiene Idiomas como acceso central y se convierte en selector modal del idioma activo (Italiano). La selección no cambia el catálogo porque Italiano es el único idioma habilitado actualmente.
- [x] Ruta y Entrenamiento quedan deshabilitados en la navegación; el botón de acceso a Entrenamiento también queda bloqueado. No se borran sus módulos ni datos.
- [x] Teoría permanece temporalmente deshabilitada hasta portar y validar su pantalla funcional desde `feature/mobile-bottom-navigation`; se evita abrir una pantalla vacía.
- [x] Estadísticas y su implementación no se modifican.
- [x] El módulo Teoría se integra desde `feature/mobile-bottom-navigation`, con sus categorías, listado de temas, vistas detalladas, navegación anterior/siguiente y reproducción de pronunciación; se limita el idioma activo a Italiano.
- [x] Se recupera la estructura y los estilos originales de Teoría sin reemplazar el shell modular ni tocar la implementación de Estadísticas.
- [ ] Ejecutar CI/E2E y verificar el preview Render asociado a `rebuild/functional-baseline`.


## Restauración de Teoría — 21-11-2026
- [x] Se porta la pantalla de Teoría desde la rama de referencia: Gramática, Vocabulario y Expresiones; navegación por temas; detalle tipo diapositiva; anterior/siguiente; tablas y controles de pronunciación.
- [x] La restauración conserva el contenido aplicado de Italiano y sus ayudas de pronunciación. Se mantiene la rama modular como base; no se sustituye `src/app.js` completo por la versión monolítica anterior.
- [x] Se habilita Teoría en la barra inferior y se reinicia su navegación interna al volver a entrar.
- [x] Estadísticas y sus componentes no se modifican en esta etapa.
- [ ] Verificar CI, E2E y el deploy de Render del commit de esta restauración.


## Verificación y preview de navegación/Teoría — 21-11-2026
- [x] El acceso central de Idiomas abre el selector y devuelve a la pantalla Idiomas; Italiano sigue siendo la única opción disponible.
- [x] Ruta y Entrenamiento permanecen bloqueados desde la interfaz. El test E2E desbloquea el botón solo dentro del navegador de pruebas para mantener cobertura del flujo pedagógico sin habilitarlo a usuarios.
- [x] Teoría restaurada y accesible; se reinicia su navegación interna al volver a entrar. Estadísticas no se modificó.
- [x] Se ajusta el alto de la bienvenida y E2E mide la pantalla Idiomas después de continuar.
- [x] Tests unitarios aprobados en `67badac16a15546661c7cef52ddbd213f111f6bf` (run [44962433007](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44962433007)).
- [ ] Browser E2E del commit `67badac16a15546661c7cef52ddbd213f111f6bf` en ejecución (run [44962432997](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44962432997)); se actualizaron las expectativas para reflejar el bloqueo intencional de Entrenamiento y normalizar los espacios de la leyenda de Estadísticas.
- [x] Render Preview desplegado y en estado `live` desde `c8f6930a4bb759e58dd84221694cfa9443583b28`: https://adaptive-language-tutor-rebuild-preview.onrender.com.
- [ ] Revisión visual humana en móvil pendiente; el estado `live` confirma el deploy, no sustituye la inspección de la interfaz en el dispositivo.


## Incidencia de preview — 21-11-2026 (auditoría posterior)
- La URL `https://adaptive-language-tutor-rebuild-preview.onrender.com` corresponde al servicio Render `adaptive-language-tutor-rebuild-preview`, conectado a `rebuild/functional-baseline`. Render confirma como último deploy LIVE el commit `c8f6930a4bb759e58dd84221694cfa9443583b28`; no sirve el HEAD actual `799f9e1` porque ese commit posterior solo actualizó documentación con `[skip render]`.
- Existe además un segundo servicio, `adaptive-language-tutor-preview-5b3d`, URL `https://adaptive-language-tutor-preview-5b3d.onrender.com`, conectado a `feature/mobile-bottom-navigation`, con autoDeploy desactivado y último deploy LIVE `94aa33457e7d244f7679ae72186ad2916b5623e9`.
- Son dos previews distintos y no deben intercambiarse ni presentarse como equivalentes. La rama modular desplegada no es una restauración visual fiel de la interfaz de `feature/mobile-bottom-navigation`; por ello el deploy LIVE del servicio rebuild no demuestra que se haya cumplido la conservación visual solicitada.
- Incidencia reconocida: se compartió el enlace rebuild como si validara los cambios visuales acordados sin comprobar la interfaz servida en dispositivo. El usuario informó que la vista seguía igual al preview original. No declarar la interfaz corregida ni el preview aceptado hasta inspeccionar el resultado real y desplegar la base visual acordada.
- Próxima acción: tomar `feature/mobile-bottom-navigation` como referencia visual primaria, integrar sobre ella únicamente los cambios funcionales acordados (selector central de Idiomas; Ruta y Entrenamiento bloqueados; Teoría y Estadísticas conservadas), limpiar duplicados solo tras verificar equivalencia, y decidir cuál servicio quedará como único preview. No eliminar ramas ni servicios sin confirmación y capacidad administrativa adecuada.
