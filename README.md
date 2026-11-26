# Adaptive Language Tutor

Aplicación móvil-first para aprender idiomas mediante una ruta progresiva, ejercicios adaptativos, teoría contextual y seguimiento del aprendizaje. Incluye tutor conversacional de IA y modo local de respaldo.

> **Documento de referencia del producto.** Antes de implementar o modificar una función, revisar este README y `PROJECT_STATUS.md`. Si una instrucción nueva cambia una decisión anterior, actualizar aquí la decisión vigente y registrar el cambio en la bitácora. No recuperar comportamientos antiguos que contradigan estas reglas.

## 1. Estado del proyecto y entorno

- Repositorio: `asotomayorb/adaptive-language-tutor`.
- Rama de trabajo móvil: `feature/mobile-bottom-navigation`.
- Desarrollo y correcciones en GitHub; Render se utiliza para el preview móvil.
- Replit queda intacto y aplazado: **no modificar ni sincronizar el proyecto original de Replit** hasta autorización expresa.
- Preview Render: https://adaptive-language-tutor-preview-5b3d.onrender.com
- Estado de producto: en revisión de experiencia móvil y corrección de flujos. La disponibilidad del preview no significa que todos los requisitos de producto estén implementados ni que esté listo para producción.
- Consultar [PROJECT_STATUS.md](PROJECT_STATUS.md) para el estado técnico verificado y [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md) para pruebas manuales.

## 2. Estructura principal de navegación

La navegación visible mantiene cinco posiciones: Ruta, Entrenamiento, selector central de Idiomas, Teoría y Estadísticas. En el alcance temporal actual, Ruta y Entrenamiento están bloqueados; Teoría y Estadísticas son las únicas secciones navegables.

1. **Ruta** — visible pero temporalmente no seleccionable.
2. **Entrenamiento** — visible pero temporalmente no seleccionable.
3. **Idiomas** — selector central destacado; Italiano es la única opción habilitada actualmente.
4. **Teoría** — accesible y conservada.
5. **Estadísticas** — accesible y conservada.

Reglas de navegación:
- Barra inferior fija, optimizada para móvil, con cinco posiciones y **solo iconos**: sin texto visible bajo los iconos. El selector central de Idiomas es un botón elevado y destacado.
- Los iconos deben ser claros y distinguibles. El seleccionado puede mostrarse ligeramente más grande y/o con mayor grosor/contraste.
- El nombre de la sección se muestra dentro del contenido de la pantalla, nunca como etiqueta bajo el icono.
- No incluir una sección “Configuración”.
- No mostrar una barra de navegación inferior durante una sesión de ejercicio a pantalla completa.
- No añadir secciones, accesos o textos explicativos que no estén definidos aquí sin actualizar primero esta especificación.

## 3. Diseño y controles globales

- Diseño mobile-first, limpio, minimalista y sin desplazamiento horizontal.
- Eliminar subtítulos explicativos redundantes, textos de relleno, pie “Language Tutor” y elementos decorativos que no aporten a la tarea.
- La pantalla Ruta debe ser visualmente minimalista y no mostrar estadísticas, métricas, rachas, palabras, precisión ni resúmenes numéricos.
- En las pantallas normales (Ruta, Ejercicios, Teoría y Estadísticas), ubicar en la parte superior:
  - selector de idioma objetivo, representado por un icono;
  - control de audio, representado por un icono.
- El estado de audio desactivado debe ser inequívoco: icono con línea diagonal roja o una X gris. Al reactivarlo, volver al icono normal.
- El idioma debe poder cambiarse desde el control superior, sin una sección de Configuración.
- En una sesión activa, mostrar únicamente el control de cerrar (X) y el control de audio. No permitir cambiar idioma durante la sesión.
- Mantener accesibilidad: controles icon-only con `aria-label`, foco visible y objetivos táctiles adecuados.

## 4. Ruta / modo historia

- Es la pantalla inicial y representa el camino principal de aprendizaje.
- Debe organizar el contenido en etapas o unidades secuenciales, con desbloqueo/progresión comprensible.
- La experiencia debe sentirse como un recorrido de aprendizaje, no como un panel de estadísticas.
- No mostrar métricas en esta pantalla.
- El detalle pedagógico, mapa de unidades, reglas de desbloqueo y contenido narrativo deben definirse y documentarse antes de implementar cada bloque. No inventar una progresión que contradiga el nivel o idioma elegido.

## 5. Ejercicios: modalidades y flujo

La sección Ejercicios ofrece dos opciones iniciales:
- **Global:** práctica amplia que combina habilidades y contenidos del idioma.
- **Repaso:** práctica de errores/elementos previamente registrados y pendientes de reforzar.

Flujo obligatorio:
1. El usuario entra a Ejercicios.
2. Elige Global o Repaso.
3. Se abre una pantalla de preparación con duración, nivel y tema.
4. Al comenzar, se entra en una vista de ejercicio **a pantalla completa**.
5. En pantalla completa desaparecen la barra inferior y las opciones Global/Repaso. Solo permanecen X y audio, ambos icon-only.
6. Al tocar X, pedir confirmación antes de abandonar.

Configuración de sesión:
- Duración, nivel y tema se eligen en la pantalla de preparación, después de elegir Global o Repaso.
- El nivel elegido se respeta desde la primera actividad.
- **No realizar diagnóstico inicial** ni iniciar la sesión con preguntas diagnósticas abiertas, independientemente del nivel elegido.
- La adaptación de dificultad puede ocurrir durante la práctica, de forma gradual y sin bloquear el inicio con un test separado.
- No mostrar métricas, contadores de racha, palabras o errores durante el ejercicio.

Comportamiento al cerrar:
- La X abre una confirmación explícita.
- Decisión vigente: **descartar el progreso de la sesión actual** al confirmar el cierre. No guardar el resultado parcial ni convertir sus respuestas en progreso/tarjetas de repaso.
- Cancelar mantiene la sesión activa sin alteraciones.
- El descarte de la sesión actual no debe borrar el historial de sesiones anteriores que ya estaba guardado.

Errores y cambio de contexto:
- Al cambiar de modalidad, idioma o ruta, reiniciar correctamente el estado temporal de la actividad anterior. No reutilizar preguntas, historial IA, pistas, respuestas pendientes ni indicadores de carga de la sesión previa.
- Si el usuario cambia de sección mientras no está en una sesión activa, no dejar solicitudes o estados antiguos que contaminen la siguiente actividad.
- Las solicitudes al tutor IA deben tener timeout, estado de carga visible, manejo de error y opción clara de reintentar o continuar en modo local cuando corresponda.
- Un fallo o demora de IA nunca debe dejar el ejercicio bloqueado indefinidamente ni impedir navegar a otra sección.
- Evitar respuestas duplicadas/reintentos concurrentes y cancelar solicitudes obsoletas cuando el usuario abandona o cambia de actividad.
- El flujo debe seguir siendo utilizable si la IA no está disponible.

## 6. Teoría

- Sección independiente, accesible desde la barra inferior.
- Material organizado por idioma, nivel y tema.
- Explicaciones breves y consultables; no debe iniciar automáticamente un ejercicio ni una sesión IA.
- Desde una explicación puede ofrecerse un acceso voluntario a practicar ese contenido, que debe llevar al flujo de selección/preparación de ejercicios.
- No duplicar en Teoría la pantalla de estadísticas ni convertirla en un apartado de configuración.

## 7. Estadísticas

- Único lugar donde se muestran métricas, historial y evolución.
- Las métricas pueden incluir sesiones completadas, vocabulario, precisión, errores/repasos pendientes y evolución temporal, siempre que estén sustentadas por datos reales.
- No mostrar datos ficticios como si fueran del usuario.
- No duplicar estas métricas en Ruta ni durante los ejercicios.

## 8. Idiomas y audio

- Alcance activo del selector: Italiano únicamente. Los otros catálogos y datos históricos permanecen en el repositorio, pero no se ofrecen en la interfaz hasta una etapa posterior.
- El locale objetivo debe mantenerse consistente en las actividades, historial y síntesis de voz.
- La lectura automática puede activarse/desactivarse desde el icono superior.
- Audio desactivado no debe impedir practicar por escrito.
- La reactivación no debe reproducir fragmentos de pantallas ocultas ni contenido de actividades anteriores.
- Los controles de pronunciación individual, cuando existan, reproducen solo el fragmento objetivo correspondiente.
- No leer automáticamente explicaciones auxiliares en español como si fueran contenido del idioma objetivo.
- En pantalla completa de ejercicios, conservar el control de audio junto a la X.

## 9. Persistencia y datos

- Separar claramente el progreso histórico ya guardado del estado temporal de una sesión en curso.
- Al cerrar y confirmar una sesión, descartar solo el estado temporal de esa sesión, según la decisión vigente.
- No persistir respuestas parciales, métricas ni tarjetas de repaso procedentes de una sesión descartada.
- No borrar sesiones anteriores, vocabulario o tarjetas ya guardadas.
- Cualquier cambio en persistencia debe tener pruebas de regresión para evitar pérdida o contaminación de datos.

## 10. Arquitectura técnica conocida

- Frontend: `index.html`, `src/app.js`, `src/styles.css`.
- Backend/API: `server/index.js`.
- Adaptadores IA: `server/provider.js`.
- Prompts/esquemas: `server/prompts.js`.
- Cliente IA: `src/core/tutor-client.js`.
- Pedagogía, contenidos y progreso local: `src/core/`, `src/content/`.
- Pruebas: `tests/`.
- Runtime: Node.js 20.6 o superior.

## 11. Reglas de implementación y prevención de regresiones

Antes de cambiar código:
1. Leer este README y revisar el estado real de la rama.
2. Identificar qué vistas, componentes, persistencia y pruebas se ven afectados.
3. Mantener las decisiones de producto de este documento como criterios de aceptación.
4. No afirmar que algo está implementado o probado sin verificarlo en el código y/o ejecutar la prueba correspondiente.
5. No reemplazar una función existente sin revisar sus dependencias y pruebas.

Después de cada cambio:
1. Actualizar este README si cambia una decisión, flujo o requisito.
2. Registrar en `PROJECT_STATUS.md` el cambio técnico, commit, pruebas y pendientes reales.
3. Actualizar `HUMAN_TEST_PLAN.md` cuando cambie un flujo visible o una interacción.
4. Ejecutar al menos `npm run check` y `npm test`; ejecutar Browser E2E cuando afecte a la interfaz o navegación.
5. Verificar la experiencia en viewport móvil y, antes de dar por lista la prueba humana, en un dispositivo real.
6. Revisar que no se haya reintroducido Inicio como sección, Configuración, etiquetas de texto en la barra inferior, estadísticas en Ruta/ejercicios, diagnóstico inicial o guardado de sesiones descartadas.

## 12. Ejecución local

Copiar `.env.example` a `.env`, configurar `AI_PROVIDER`, `AI_API_KEY` y `AI_MODEL` (y `AI_BASE_URL` si corresponde), y ejecutar:

```bash
npm ci
npm start
```

La aplicación queda en `http://localhost:3000`. Desarrollo: `npm run dev`. Validación: `npm run check` y `npm test`. Para pruebas E2E: `npm run test:e2e`. Para smoke tests reales, usar `npm run test:provider-live` y `npm run test:browser-live` con variables privadas configuradas.

Nunca subir claves API al repositorio. Para pruebas iniciales con proveedores externos, usar datos ficticios.

## 13. Registro de decisiones y cambios

### Decisiones vigentes — 18-11-2026
- Navegación principal: Ruta, Ejercicios, Teoría, Estadísticas.
- Ruta es la pantalla inicial; “modo historia” describe su enfoque, no una quinta sección.
- Barra inferior fija con iconos solamente; icono seleccionado ligeramente destacado.
- Sin sección Configuración. Selector de idioma y audio en la parte superior de las pantallas normales.
- Pantalla Ruta minimalista, sin métricas.
- Ejercicios: elegir Global o Repaso; luego duración, nivel y tema; luego ejercicio a pantalla completa.
- Sin diagnóstico inicial: comenzar directamente en el nivel elegido.
- Sesión activa: solo X y audio. Cierre confirmado descarta la sesión actual y sus cambios no guardados.
- La IA debe fallar de forma recuperable y no bloquear la actividad ni la navegación.
- README es la referencia central para no perder instrucciones previas.

### Historial de requisitos anteriores conservados
- La app es mobile-first y debe evitar desplazamiento horizontal.
- El audio puede desactivarse sin perder funcionalidad escrita.
- El idioma/locale debe conservarse correctamente en tutoría IA y TTS.
- Global y Repaso son modalidades diferentes; Repaso trabaja con errores/elementos guardados de sesiones completadas, no con datos de una sesión descartada.
- El desarrollo permanece en GitHub/Render; el proyecto original de Replit no se toca sin autorización.


## 14. Implementación móvil — estado al 18-11-2026

### Implementado en la rama móvil
- [x] Cuatro secciones en navegación: Ruta, Ejercicios, Teoría y Estadísticas.
- [x] Barra inferior con cuatro iconos sin etiquetas; el seleccionado se destaca.
- [x] Cabecera global con selector de idioma y control de audio.
- [x] Estado de audio apagado visible con icono de silencio y X superpuesta.
- [x] Ruta inicial sin panel de estadísticas ni métricas.
- [x] Ejercicios con selección Global / Repaso y pantalla de preparación posterior.
- [x] Preparación con duración, nivel y tema.
- [x] Vista de sesión a pantalla completa; barra inferior y controles de navegación desaparecen.
- [x] En sesión solo quedan los controles superiores X y audio; contadores y botones auxiliares de pista/repaso quedan ocultos.
- [x] La X solicita confirmación mientras la sesión está activa; confirmar cancela solicitudes y descarta el estado temporal de esa sesión.
- [x] No se inicia un diagnóstico ni se envían indicadores de diagnóstico al tutor IA.
- [x] Solicitudes IA limitadas a 30 segundos, cancelables al cerrar y con alternativa para continuar con ejercicios locales.
- [x] Repaso usa una copia temporal de progreso; se guarda al completar el conjunto de repasos, y se descarta si se cierra antes.
- [x] Estadísticas aparecen únicamente en la sección Estadísticas.

### Pendiente / no debe darse por terminado
- [ ] Convertir Ruta en un recorrido narrativo real con etapas, contenidos y desbloqueos persistentes. El contenido de etapa actual es todavía un esqueleto visual.
- [ ] Incorporar contenido didáctico real en Teoría, conectado al idioma y nivel. Las tarjetas actuales son categorías iniciales.
- [ ] Verificar en navegador que los cuatro flujos se comportan correctamente en distintos tamaños móviles.
- [ ] Ejecutar `npm run check`, `npm test` y `npm run test:e2e` en CI o entorno con dependencias.
- [ ] Probar en un teléfono Android real, especialmente selector de idioma, teclado, audio, diálogo de cierre y áreas seguras.
- [ ] Confirmar que el servicio Render preview despliega este commit y que la sesión IA funciona con el proveedor configurado.

### Nota sobre duración
La selección se expresa en minutos. En la implementación actual se asignan provisionalmente dos turnos de ejercicio por minuto (por ejemplo, 10 minutos = 20 turnos). Ajustar esta equivalencia tras pruebas reales de duración de sesión.


## 15. Refinamientos de producto móvil — 18-11-2026

### Requisitos confirmados
- [x] La experiencia debe comenzar con una pantalla de bienvenida: nombre de la aplicación en tamaño destacado y un botón principal “Iniciar”. Al pulsarlo se entra a la aplicación; si aún no hay idioma seleccionado, primero se abre el selector de idiomas.
- [x] La barra inferior contiene cinco posiciones: Ruta (mapa), Ejercicios (pesas), selector central de idioma (globo + bandera seleccionada), Teoría (libro) y Estadísticas (gráfico). Los cuatro accesos de sección son icon-only; el selector de idioma central es visualmente más grande y destacado.
- [x] La bandera central debe representar siempre el idioma objetivo actual, conservarse entre visitas y cambiar al seleccionar otro idioma. Al tocar el selector se abre un mosaico de idiomas con bandera; al elegir un idioma se guarda y se vuelve automáticamente a Ruta.
- [x] En Ejercicios, Global/Repaso y los selectores de cantidad, nivel y tema conviven en la misma pantalla. Los tres parámetros son desplegables; no debe aparecer una pantalla intermedia de preparación ni textos de estado como “Preparar sesión” o “Tutor IA disponible”.
- [x] La cantidad de ejercicios se expresa en preguntas, no en minutos. Los valores iniciales propuestos en la interfaz son 5, 10, 15 y 20 preguntas.
- [x] Estadísticas incluye un gráfico de evolución construido únicamente con sesiones reales guardadas. Si no hay sesiones, debe mostrarse un estado vacío, nunca datos inventados.
- [x] Teoría debe mostrar contenido debajo de cada categoría y no limitarse a subtítulos vacíos.
- [x] Las pistas y correcciones conservan su control de audio individual. El estado global de audio debe persistir entre sesiones.
- [x] Ruta no muestra los selectores de Ejercicios. Cada etapa define de antemano tema, nivel y actividad; su duración se determina por hitos pedagógicos, no por minutos.

### Criterio propuesto para hitos de Ruta — pendiente de aprobación
1. Una unidad cubre un objetivo comunicativo concreto y entre 3 y 5 microtemas relacionados.
2. Cada microtema contiene 3 a 5 preguntas/actividades breves.
3. Se desbloquea el siguiente microtema con al menos 80% de acierto en una comprobación de 5 preguntas (mínimo 4 correctas).
4. El cierre de unidad exige una actividad integradora que combine los microtemas; se puede requerir 80% o una segunda oportunidad de refuerzo.
5. El progreso parcial de Ruta se guarda después de cada respuesta confirmada; cerrar la sesión permite retomarla desde la última actividad guardada.
6. Ejercicios mantiene el comportamiento opuesto: cerrar una sesión incompleta descarta todas sus respuestas temporales.

**Propuesta de ejemplo:** “Saludos y presentaciones” → saludos → nombre y procedencia → preguntas personales → diálogo integrado. El nivel y los contenidos se fijan por unidad, según el idioma.

### Estado de implementación de esta revisión
- [x] Pantalla de bienvenida con botón Iniciar.
- [x] Barra inferior de cinco posiciones con iconos de mapa, pesas, libro y gráfico; selector de idioma central destacado.
- [x] Mosaico de selección de idiomas y persistencia de idioma/flag; idiomas iniciales disponibles: portugués brasileño e inglés. Los idiomas personalizados usan la región del locale para intentar mostrar su bandera.
- [x] Ejercicios: Global/Repaso y campos desplegables en la misma pantalla.
- [x] Cantidad de preguntas (5/10/15/20) sustituye a duración en minutos en la configuración de la sesión.
- [x] Gráfico de precisión por sesión con datos guardados y estado vacío.
- [x] Teoría incorpora contenidos iniciales en Gramática, Vocabulario y Expresiones para portugués brasileño e inglés.
- [ ] Implementar sesiones reales de Ruta con unidades, hitos, desbloqueos y progreso parcial persistente.
- [ ] Aprobar o ajustar el umbral de dominio y estructura de hitos propuestos arriba antes de fijar la progresión pedagógica.
- [ ] Ampliar el mosaico de idiomas y verificar visualmente las banderas en Android.
- [ ] Auditar el estado persistente del audio en sesiones nuevas y entre reinicios del navegador.
- [ ] Ejecutar npm run check, npm test y npm run test:e2e; la compilación Render no sustituye estas pruebas ni la prueba real en Android.

**Nota de precisión:** la pantalla Ruta sigue siendo una estructura visual de etapas; todavía no inicia una sesión con contenido prefijado ni guarda progreso parcial. El gráfico actual muestra la precisión de sesiones completadas como indicador observable, no una estimación ficticia de dominio del idioma.

- [x] Corrección de navegación: al finalizar o descartar una sesión de Ejercicios, la pantalla vuelve a mostrar Global/Repaso y los tres desplegables; no quedan ocultos tras regresar de la sesión.


**Despliegue de preview:** el commit de código `6eb031fb9b1051ad993df1e9ea8dbf4cd96f9472` se desplegó correctamente en Render el 18-11-2026 (deploy `dep-dbuugt8u01pc73e2o700`). La aplicación quedó disponible en la URL de preview. El despliegue confirma instalación y arranque del servidor, no la validación visual/funcional en navegador ni los tests de proyecto.


## 16. Revisión pedagógica y de contenido — 18-11-2026 (decisiones vigentes)

Esta sección **prevalece sobre cualquier regla anterior incompatible** de las secciones 5, 6, 8, 13, 14 y 15.

### Ruta: hitos aprobados
- Una unidad cubre un objetivo comunicativo concreto y entre 3 y 5 microtemas.
- La comprobación de dominio consta de **10 ejercicios** (no 5) y exige al menos **8/10 respuestas correctas**.
- Tras superar la comprobación, se completa una actividad integradora que combina lo aprendido en la unidad.
- El nivel, tema y contenido se fijan por unidad; Ruta no ofrece los selectores de Ejercicios.
- Cada respuesta confirmada se guarda inmediatamente en un borrador independiente. Cerrar Ruta conserva el progreso y ofrece “Continuar recorrido” al volver.
- Si no se alcanza 8/10, se repite la comprobación. El hito no se desbloquea hasta superar también la actividad integradora.
- Ejercicios mantiene la regla opuesta: una sesión incompleta se descarta y no se guarda como progreso parcial.

### Teoría: navegación por diapositivas
- Las categorías principales son Gramática, Vocabulario y Expresiones.
- Al elegir categoría se muestra un listado legible de temas, sin párrafos diminutos en la lista.
- Al tocar un tema se abre una vista completa independiente con el contenido desarrollado en una diapositiva.
- Las diapositivas incluyen navegación anterior/siguiente y cierre/retorno al listado.
- Los ejemplos deben corresponder al idioma seleccionado. No mostrar ejemplos de inglés/portugués como si fueran del idioma de destino cuando no corresponda.

### Catálogo estándar de idiomas
- El mosaico ofrece portugués brasileño, inglés, italiano, alemán, ruso, francés, español, japonés, chino mandarín, coreano, neerlandés, árabe, hindi, turco, griego, polaco, sueco, noruego, danés, hebreo, vietnamita, indonesio y tailandés.
- El mosaico incluye 23 idiomas estándar y permite añadir un idioma no listado escribiendo solo su nombre, sin pedir locale. El sistema infiere locale/bandera para idiomas reconocidos; si no existe una equivalencia conocida, usa locale neutral y una bandera neutra cuando no existe una bandera reconocida. Los códigos internos nunca se muestran en la interfaz.
- Los idiomas con ejercicios locales disponibles funcionan sin IA; los restantes requieren tutor IA configurado para generar ejercicios.
- La variante regional se enseña dentro del contenido cuando sea relevante. Ejemplo: una palabra inglesa como “color” puede mostrar una explicación emergente con la forma británica “colour”.

### Ejercicios: secuencia de respuesta y feedback
- La cantidad se expresa en preguntas; el valor inicial es 10, con opciones 5/10/15/20.
- Las **tres primeras preguntas** son siempre de selección múltiple con tres alternativas, sin importar el nivel seleccionado.
- Desde la cuarta pregunta se solicita una respuesta escrita, sin alternativas.
- Al responder, la aplicación avanza automáticamente a la pregunta siguiente.
- La evaluación de la respuesta anterior aparece en formato neutral dentro de la siguiente pregunta, junto con la respuesta modelo y su control de pronunciación. La última respuesta se incluye en el resumen.
- Las opciones iniciales, respuestas modelo, pistas y correcciones mantienen controles de audio individuales. La preferencia global de audio persiste entre sesiones.

### Bienvenida
- La bienvenida se muestra en la primera apertura sin idioma seleccionado.
- Al tocar Iniciar desaparece inmediatamente; si no existe idioma guardado, se abre el mosaico de idiomas.
- En siguientes aperturas, con idioma ya guardado, se entra directamente a Ruta.

### Estado técnico de esta revisión
- [x] Mosaico estándar sin entrada manual de locale y 23 idiomas.
- [x] Locale interno por idioma y persistencia de la bandera.
- [x] Listado de temas de Teoría y diapositivas con flechas anterior/siguiente.
- [x] Ejemplos localizados básicos para el catálogo estándar.
- [x] Primeras tres preguntas de selección múltiple y posteriores de escritura en modo local y contrato IA.
- [x] Feedback neutral diferido a la pregunta siguiente y respuesta modelo con audio.
- [x] Ruta: comprobación de diez preguntas, umbral 8/10, actividad integradora y guardado parcial reanudable.
- [x] Ruta admite ejercicios locales para portugués e inglés y tutor IA para los demás idiomas cuando el proveedor está configurado.
- [x] Los borradores de Ruta se guardan por idioma e incluyen el estado conversacional IA para permitir reanudación.
- [x] Documentación y pruebas E2E actualizadas para los flujos nuevos.
- [ ] Ampliar la profundidad y variedad de unidades de Ruta; la primera unidad cubre Fundamentos/Saludos y presentaciones.
- [x] GitHub Actions: npm run check, npm test y npm run test:e2e completados correctamente en el commit 3eef3801 (18-11-2026).
- [ ] Validar visual y auditivamente en Android real.
- [ ] Verificar el comportamiento de las 23 voces según las voces instaladas en el dispositivo.

## 16. Correcciones de experiencia de ejercicio y teoría — 18-11-2026

- La bienvenida permanece visible al cargar, incluso si existe un idioma guardado. Solo el botón **Iniciar** permite entrar; para usuarios nuevos abre el selector de idioma y la selección confirma la entrada.
- En ejercicios, la respuesta se evalúa sin abandonar la pregunta. Se muestran estado correcto/incorrecto, respuesta correcta y explicación adicional únicamente cuando hay error. En alternativas, la opción correcta queda verde y la elegida incorrecta roja. El usuario avanza únicamente con **Continuar**.
- Las sesiones locales y del tutor IA siguen el mismo patrón de espera; el tutor puede preparar la siguiente actividad en segundo plano, pero no la muestra ni cambia de pregunta hasta que el usuario continúe. El mensaje IA de la pregunta siguiente es neutral; la explicación de error queda en el feedback de la pregunta actual.
- Se ocultan los rótulos y listados de “Pronunciación” y “Vocabulario” que podían revelar respuestas. Se conserva el audio, que reproduce la frase completa de la pregunta. En ejercicios de recuerdo con espacio en blanco se conserva una pausa. Los ejemplos de escucha en portugués e inglés reproducen la frase completa en el idioma objetivo, presentan alternativas y respuesta en español, y usan pronunciación en el idioma de la respuesta. Otros ejercicios pueden definir `speechText` y `speechLocale`.
- Teoría: pronombres en tabla bilingüe de dos columnas, con pronunciación reproducible por fila; descripción conceptual más breve y palabras del idioma objetivo destacadas. Pronombres, artículos, ser/estar y tiempos presente, pasado y futuro incluyen tablas, ejemplos, conjugaciones y reglas/excepciones para los 23 idiomas estándar; cada diapositiva mantiene navegación anterior/siguiente.
- Cambiar de sección vuelve a su pantalla inicial: categorías de Teoría, configuración de Ejercicios, inicio de Ruta o Estadísticas.
- Ruta conserva el estado de una respuesta pendiente al guardar y reanudar; el feedback queda en la pregunta respondida y espera Continuar.
- Se amplió el plan E2E para comprobar bienvenida explícita, feedback sin avance automático, colores, tablas de teoría y reanudación.
- CI (npm run check, npm test y Browser E2E) aprobado en el commit `e227eea`.
- Preview Render desplegado y en estado `live` en el commit `e227eea` (deploy `dep-dbv2si8u01pc73clh3u0`).



## Revisión funcional posterior — 18-11-2026

### Cambios incorporados en la rama de desarrollo
- Ruta utiliza un único banner: la primera pulsación crea y guarda el recorrido; desde entonces el mismo banner cambia a **Continuar recorrido** y restaura el último punto guardado. No vuelve a ofrecer iniciar una segunda ruta para ese idioma.
- Se eliminan los mensajes introductorios grises del tutor que aparecían encima de la pregunta. La pantalla prioriza la consigna concreta.
- La locución de preguntas mixtas toma el contenido posterior a la instrucción, conserva el locale del idioma objetivo y convierte guiones bajos simples o múltiples en una pausa. Los ejercicios IA filtran la locución al idioma objetivo y no reproducen segmentos de origen como si fueran el idioma aprendido.
- En respuestas escritas, el botón **Enviar respuesta** desaparece tras enviar; el flujo queda en el feedback y el botón **Continuar**.
- El tutor IA debe crear ejercicios cerrados y corregibles. Se prohíben preguntas de preferencias o conversación abierta sin respuesta verificable. Para texto libre solo se aceptan traducciones, huecos, correcciones, transformaciones y comprensión con respuesta delimitada.
- Los errores de ejercicios concretos se incorporan a Repaso inmediatamente al guardar la sesión; los patrones cualitativos mantienen su programación espaciada inicial.
- Se amplió Teoría de italiano con tablas aplicadas de artículos definidos/indefinidos, conjugación del *passato prossimo* y *futuro semplice*, ejemplos traducidos y vocabulario/expresiones de uso cotidiano.

### Pendiente de validación
- Ejecutar CI completo (comprobación estática, tests unitarios y Browser E2E) sobre los últimos commits.
- Verificar en Android que la locución no mezcla idiomas ni verbaliza el signo de hueco; la síntesis de voz depende de las voces instaladas.
- Probar que un error finalizado aparece inmediatamente en Repaso y que al calificarlo se programa el siguiente intervalo.
- Revisar y completar el contenido aplicado de los demás idiomas y categorías; la ampliación detallada de esta tanda se concentra en italiano.
- No declarar la revisión lista para prueba humana hasta que CI y la prueba visual/auditiva en Android estén aprobados.

### Propuesta futura: comprensión lectora y audio cultural
No implementado todavía. Diseñar como un modo independiente:
1. Presentar un texto breve adecuado al nivel, con fuente y atribución visibles.
2. Usar únicamente textos originales o materiales con estado de dominio público/licencia abierta verificado para el uso previsto; un artículo de noticias moderno o un fragmento corto de un libro no se vuelve libre por ser breve.
3. Formular preguntas cerradas sobre información explícita, vocabulario en contexto e inferencias con respuesta justificable en el texto.
4. Al elegir una bandera/idioma, reproducir un clip identificable de 1–2 segundos solo si la grabación concreta tiene derechos de dominio público o licencia compatible comprobada. La antigüedad de una composición no garantiza que una grabación moderna sea libre.


### Validación y preview de esta iteración
- [x] `npm run check` y tests unitarios aprobados en GitHub Actions (run [44424442155](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44424442155)).
- [x] Browser E2E aprobado (run [44424442327](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44424442327)).
- [x] Render preview desplegado y `live` para el código `32673f0` (deploy `dep-dbv3kuhsrm7s73bap9n0`).
- [ ] Prueba visual y auditiva en Android real; CI no puede verificar la calidad de las voces instaladas ni la interacción táctil del dispositivo.

## 14. Iteración funcional — 18-11-2026

Cambios incorporados en la rama de preview:

- Ejercicios IA: mostrar una corrección determinista inmediata contra `expectedAnswer` y `acceptedAnswers` mientras se prepara la siguiente actividad. La respuesta solo se considera correcta si coincide con la solución modelo o una variante aceptada; la tolerancia opcional admite un único error ortográfico pequeño.
- Ejercicios: algunas consignas de inglés y portugués brasileño están redactadas directamente en el idioma objetivo.
- Ruta: agotar las preguntas del tema lleva a preguntas no usadas del catálogo completo; no se reciclan preguntas respondidas. Si el catálogo se agota, la sesión termina sin repetir.
- Hito integrador local: sustituye la presentación abierta por una traducción de respuesta delimitada, con variantes aceptadas y tolerancia tipográfica acotada.
- Resumen: estructura simplificada con los apartados Aciertos, Errores, Vocabulario y Temas.
- Estadísticas: tabla comparativa simultánea por idioma (sesiones, palabras, precisión y progreso de Ruta) y gráfico lineal de precisión diaria con leyenda lateral.
- Texto objetivo: las palabras del enunciado, opciones, corrección y vocabulario pueden seleccionarse para consultar la traducción registrada o solicitar una traducción contextual al tutor IA.

Pendiente de esta revisión:
- Completar la auditoría y corrección del contenido de Teoría para todos los idiomas. Se amplió el material aplicado de artículos, vocabulario y expresiones para inglés y portugués brasileño, además del bloque detallado de italiano; los otros idiomas aún requieren revisión.
- Validar en E2E la corrección inmediata, tolerancia tipográfica, no repetición de Ruta, resumen, consulta por palabra y gráfico diario.
- Confirmar la experiencia real en Android y comprobar latencia percibida con el proveedor IA.

- Teoría: artículos con tablas comparativas para inglés, portugués brasileño, francés y alemán; vocabulario y expresiones aplicados para inglés y portugués brasileño.

- La consulta por palabra incorpora traducción contextual bajo demanda cuando el proveedor IA está configurado; las traducciones locales registradas se muestran sin solicitud adicional.

- El resumen no conserva el encabezado redundante «Sesión completada»: «Resumen» es el único título del contenido.
- El flujo de traducción por palabra es bajo demanda y usa el contexto de la frase cuando no hay una traducción local.
- E2E actualizado para esperar la respuesta de traducción contextual y verificar la tabla/gráfico de Estadísticas.

- En opciones de respuesta, tocar una palabra abre su traducción sin enviar accidentalmente la opción; tocar el área restante de la alternativa permite responder.

- Las consignas locales marcadas como idioma objetivo también permiten consultar cada palabra; las instrucciones que siguen en español no se convierten en texto clicable.

- En el resumen, los aciertos y errores se resaltan por separado (verde y rojo); la palabra de cada acierto sigue siendo seleccionable para traducirla.

- La segmentación de palabras usa límites lingüísticos del navegador cuando están disponibles, para que los idiomas con escritura continua (p. ej. chino, japonés o tailandés) no se traten como una única palabra.

- Elimina también el estado «Sesión finalizada» bajo el resumen para mantener la pantalla limitada al contenido solicitado y su acción de navegación.

- El test E2E incluye una respuesta deliberadamente incorrecta que el mock IA intenta marcar como correcta; la validación local debe rechazarla.

- El gráfico genera un color distinto para cada idioma presente en la tabla, incluso cuando se estudian más de ocho idiomas.

- Corrección de la paleta dinámica: las referencias de línea, puntos y leyenda usan ahora la misma función de color por idioma; E2E comprueba errores de inicialización antes de interactuar.

## Preview desplegado — 18-11-2026

- Rama: `feature/mobile-bottom-navigation`
- Commit desplegado: `459e10c46861aa31a344db1e14b424bdfee2ccad`
- Deploy Render: `dep-dbv59grl550s738ontg0` — estado `live`
- Preview: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Validación automatizada del commit: Tests y Browser E2E aprobados.
- Pendiente: prueba humana en Android y completar teoría de los idiomas restantes.


## Iteración UI y aprendizaje — estadísticas, consignas y repaso

- **Estadísticas / selector de gráfico:** vista 🌐 Global con barras de precisión actual por idioma y línea horizontal punteada de promedio global; cada idioma tiene una vista propia con dos series (preguntas respondidas y precisión), agrupadas por día practicado y limitadas a los últimos 15 días activos. El eje X usa «Día 1…Día 15», sin fechas de calendario ni huecos por inactividad.
- **Tabla de estadísticas:** conserva sesiones, palabras, precisión y progreso de Ruta por idioma.
- **Ejercicios:** elimina las traducciones emergentes al pulsar palabras. La instrucción en español se muestra separada del texto o frase de la actividad en idioma objetivo. El tutor IA recibe la misma regla para sus siguientes actividades.
- **Resumen:** Aciertos y Errores muestran su recuento sobre el total (p. ej. 3/5); la lista de errores conserva respuesta enviada y solución.
- **Repaso:** una respuesta incorrecta deja la tarjeta vencida y pendiente; una respuesta correcta la programa para el siguiente intervalo.
- **Pruebas:** E2E verifica el selector global/idioma, los gráficos, la separación de instrucciones y la ausencia de traducciones emergentes; tests de almacenamiento verifican que los errores sigan pendientes hasta corregirse.

### Esquema de pantallas

```text
APP
├── Ruta
│   └── Unidad / progreso / continuar
├── Ejercicios
│   ├── Global
│   │   └── configuración → pregunta → corrección → Resumen
│   └── Repaso
│       └── palabra pendiente → respuesta → intervalo (solo si acierta)
├── 🌐 Selector de idioma
├── Teoría
│   ├── Gramática
│   ├── Vocabulario
│   └── Expresiones
└── Estadísticas
    ├── Tabla comparativa por idioma
    └── Selector de gráfico
        ├── 🌐 Global: barras + promedio punteado
        └── Idioma: preguntas/día + precisión/día (últimos 15 días practicados)
```

La barra inferior mantiene cinco posiciones: Ruta · Ejercicios · Selector de idioma · Teoría · Estadísticas.

## Iteración de refinamiento — 19-11-2026

- **Estadísticas:** gráficos con mayor área útil, barras y puntos más grandes, etiquetas y leyendas legibles; el gráfico diario numera los días como 1…15 y muestra «Días» una sola vez como título del eje horizontal. En pantallas estrechas se conserva el tamaño mediante desplazamiento horizontal del gráfico.
- **Ejercicios IA:** el botón «Continuar» aparece junto al feedback inmediatamente después del envío; queda temporalmente deshabilitado mientras se calcula y registra la siguiente actividad. Una respuesta incorrecta conserva el estado incorrecto aunque el proveedor la elogie; los mensajes genéricos de elogio no se reutilizan como consigna de la pregunta siguiente.
- **Feedback anterior:** se elimina el bloque gris de respuesta previa que se repetía encima del hito integrador.
- **Ruta:** el hito integrador entrega pistas progresivas en español para la presentación en portugués o inglés, mantiene la pregunta y conserva el nivel de pista al reanudar. El icono de Ruta pasa a ser un mapa del tesoro con recorrido punteado y destino marcado.
- **Teoría:** la estructura general y algunos temas tienen contenido aplicado, pero siguen existiendo explicaciones genéricas y cobertura desigual entre idiomas. No se considera terminada; requiere auditoría tema por tema y ampliación de ejemplos, conjugaciones, reglas y excepciones por idioma.

### Esquema de las pantallas modificadas

```text
ESTADÍSTICAS
└── Selector Global / Idioma
    ├── Global: barras de precisión + promedio punteado
    └── Idioma: preguntas ●──● + precisión ●──●
        └── Eje X: Días | 1  2  3 ... 15

EJERCICIOS IA
└── Pregunta → Responder
    ├── Feedback correcto/incorrecto inmediato
    └── Continuar (visible al instante; se habilita al terminar el cálculo)

RUTA
└── Mapa del tesoro → unidad → preguntas → hito integrador
    └── Respuesta libre incorrecta → pista 1 → pista 2 → ... → nuevo intento
```

- **Ruta / hito integrador:** la consigna de portugués e inglés está formulada en español. Las pistas también se pueden solicitar manualmente con el botón «Pista»; cada intento incorrecto avanza al siguiente nivel y la secuencia se guarda al reanudar.

- **Continuar durante la latencia IA:** el botón queda disponible desde que aparece el feedback. Si se pulsa antes de que el tutor termine de preparar el siguiente turno, la acción queda en cola y la app avanza automáticamente cuando la respuesta está lista.

- En el hito integrador, el botón «Pista» queda visible aunque las acciones auxiliares estén ocultas durante el resto de la sesión; la opción de repaso no aparece en esa actividad.

### Validación automatizada — refinamiento 19-11-2026

- Tests unitarios y comprobación estática: [GitHub Actions 44456571620](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44456571620) — correcto.
- Browser E2E: [GitHub Actions 44456571650](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44456571650) — correcto.
- Deploy manual Render: [LIVE, commit `33db475`](https://dashboard.render.com/web/srv-dbus3hnf3r2c739j9ir0/deploys/dep-dbv7ee3rjlhs73b4lr9g).
- Pendiente: prueba humana en Android.

## Refinamiento de interfaz, audio y contenido — 19-11-2026

### Cambios de esta iteración
- Se elimina el aviso visible de voz no instalada. La síntesis de voz sigue intentando usar la voz del dispositivo con el locale solicitado y no bloquea la práctica si no hay una voz exacta.
- Se compacta la cabecera superior y se centran los títulos de sección.
- Los gráficos de estadísticas usan el ancho disponible y no requieren desplazamiento horizontal.
- El modo «Global» de Ejercicios se presenta como «Práctica». Repaso oculta nivel, cantidad de preguntas y tema; conserva únicamente el acceso para comenzar el repaso.
- El estado del tutor queda al final del bloque de práctica.
- La lectura en voz alta de ejercicios separa la consigna en español del texto objetivo, usando el locale correspondiente para cada segmento.
- Las preguntas de respuesta escrita disponen de tres niveles de pista; la tercera ofrece una guía explícita de solución.
- Portugués brasileño: Pasado y Futuro incorporan conjugación por pronombre, ejemplos traducidos, construcciones frecuentes e irregularidades.

### Dirección de producto: contenido sin IA en tiempo real
La siguiente evolución recomendada es preparar paquetes de contenido fuera de la sesión y guardarlos versionados en el repositorio. La aplicación debe ejecutar localmente la selección de ejercicios, validación de respuestas, normalización de tildes/variantes, pistas, puntuación, adaptación y repaso espaciado. TTS seguirá siendo del dispositivo/navegador. La IA quedaría como herramienta de autoría offline, revisión editorial y, opcionalmente, actualización de noticias; no debería evaluar cada respuesta en tiempo real.

Antes de publicar un paquete generado con IA, debe pasar controles de nivel, precisión lingüística, traducciones, respuestas aceptadas, tres pistas progresivas, metadatos de idioma y revisión humana. Cada paquete debe registrar versión, autoría/procedencia y licencia.

### Próximos módulos propuestos
- **Comprensión lectora:** fragmentos breves originales o con licencia compatible, seguidos de preguntas literales, inferenciales y de vocabulario. El primer alcance debe usar textos originales creados para la app y textos de dominio público verificado o con licencia abierta compatible. No copiar libros, traducciones, artículos ni noticias protegidas.
- **Noticias para lectura:** se podrán generar textos didácticos originales basados en hechos actuales, enlazando fuentes y conservando fecha de consulta; no reproducir artículos completos ni su redacción.
- **Editoría visual:** comparar variantes de interfaz A/B en Preview antes de adoptar un diseño. Para prototipos externos se puede usar Figma o Penpot; la implementación final y la prueba funcional se mantienen en esta app.

### Política de derechos de contenido
Todo texto de aprendizaje debe ser original, de dominio público verificado o estar cubierto por una licencia que permita el uso previsto. Guardar fuente, autor, licencia, atribución requerida y fecha de verificación. No reutilizar material protegido solo porque sea accesible públicamente en internet.

- **Práctica local prioritaria:** si el idioma ya tiene un paquete local con suficientes ejercicios para la cantidad elegida, la sesión utiliza el motor determinista y no llama al tutor IA en tiempo real. La IA queda como respaldo cuando falta contenido suficiente (por ejemplo, idiomas aún sin catálogo o sesiones más largas).

- La teoría de portugués también distingue formas estándar y variación brasileña regional de `tu` (`tu falaste` / `tu vais falar` frente a usos coloquiales regionales), además de la construcción frecuente con `a gente`.

- El control de pistas queda visible también en la práctica normal; las respuestas escritas permiten recorrer tres pistas progresivas.

### Validación y Preview de esta iteración
- Tests unitarios y análisis estático: [GitHub Actions 44570968240](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570968240) — correcto.
- Browser E2E: [GitHub Actions 44570968307](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44570968307) — correcto.
- Render: [deploy LIVE dep-dbviiv60tbcc738k7o2g](https://dashboard.render.com/web/srv-dbus3hnf3r2c739j9ir0/deploys/dep-dbviiv60tbcc738k7o2g), commit d41a7cb532c02cb90153e41b877dfeaf5ba212e2.
- Preview: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Pendiente: prueba humana en Android; la automatización no sustituye la revisión de pronunciación, legibilidad y calidad pedagógica.

- El etiquetado de voz por segmento también se aplica al paquete local de inglés: consigna en español y frase objetivo en inglés (o español cuando el estímulo es una frase fuente).


## 16. Revisión de Ruta, Ejercicios y Estadísticas — 19-11-2026

Esta sección establece las decisiones vigentes y **prevalece sobre descripciones anteriores** que todavía nombren la modalidad “Global”, las tres pistas o una Ruta de una sola unidad.

### Ruta: unidades, estrellas y progresión

- Ruta presenta cuatro unidades secuenciales: **Fundamentos**, **Viajes y orientación**, **Comida y restaurantes** y **Trabajo y estudios**.
- Cada unidad se completa con una secuencia pedagógica de tres etapas:
  1. Vocabulario y conjugaciones.
  2. Aplicación en contexto.
  3. Producción de frases completas.
- En los idiomas con catálogo local (portugués brasileño e inglés), las unidades usan los ejercicios disponibles de su tema. En idiomas con tutor IA configurado, las cuatro unidades se ofrecen con generación de actividades por tema.
- La calificación de cada unidad se expresa en **0–5 estrellas**: una estrella por cada tramo completo de 20 puntos porcentuales de precisión (100% = 5 estrellas; 80–99% = 4; 60–79% = 3).
- La unidad 2 requiere completar la unidad 1 con al menos **3 estrellas**. La unidad 3 requiere completar la unidad 2 con **5 estrellas**. La unidad 4 requiere completar la unidad 3 con **3 estrellas**. La secuencia garantiza que todas las unidades anteriores estén completadas. El umbral de la última unidad se ajusta al tamaño actual de su conjunto de preguntas para que sea alcanzable.
- Si una unidad está completada pero no alcanza el umbral de la siguiente, puede repetirse para mejorar el puntaje. Se conserva el **mejor porcentaje y puntaje** obtenido en cada unidad: una repetición con peor resultado no reduce estrellas ni vuelve a bloquear unidades ya desbloqueadas.
- El progreso de Ruta se guarda por idioma y por unidad. Cerrar la aplicación permite retomar la unidad desde la última respuesta confirmada.
- **Reiniciar ruta** abre una confirmación explícita. Confirmar elimina únicamente el avance/unidades/estrellas de Ruta del idioma activo; no borra historial de ejercicios, vocabulario ni estadísticas generales.
- El modo relato con personajes ficticios, escenas cotidianas y conversaciones encadenadas queda como evolución futura. La estructura de unidades ya permite incorporarlo sin crear otra sección.
- Las actividades de emparejar palabra-significado al estilo Duolingo quedan previstas para introducir vocabulario nuevo cuando haya contenido didáctico suficiente. La versión actual usa selección múltiple en las primeras etapas y escritura en la etapa final.

### Ejercicios y Repaso

- La antigua modalidad “Global” se denomina **Ejercicio**.
- El banner **Ejercicio** despliega/oculta los selectores de duración, nivel y tema. La configuración queda dentro de la misma sección.
- El banner **Repaso** inicia el repaso directamente al tocarlo, sin una pantalla ni un botón adicional de inicio.
- Repaso respeta el tipo de respuesta original: alternativas cuando la actividad original era de selección múltiple y respuesta escrita cuando correspondía.
- Las ayudas aparecen solo para respuestas escritas: primer paso **Pista** y segundo paso **Ver respuesta**. Se ocultan en preguntas de alternativas. La misma regla se aplica a Repaso.
- El resumen muestra el título **Resumen** centrado y, debajo, el porcentaje de aciertos y una valoración: 100% “Perfecto”; más de 80% “Muy bien”; más de 60% “Bien”; 40–60% “Vas progresando”; menos de 40% “Sigue practicando”. Se elimina el subtítulo independiente “Aciertos”.
- Las sesiones de Ejercicios siguen sin guardar progreso parcial cuando se descartan mediante la X y su confirmación.

### Estadísticas y recursos visuales

- El gráfico global recupera barras más grandes y reduce el espacio horizontal entre ellas. Los gráficos siguen adaptándose al ancho disponible sin scroll horizontal.
- Las actividades muestran pictogramas SVG originales elegidos según vocabulario, objeto o tema (por ejemplo, café, transporte, restaurante o trabajo). Son ilustraciones generadas por la propia interfaz, no imágenes copiadas de terceros.
- Los textos, frases de integración, ejemplos y explicaciones agregados en esta iteración son originales. Todo contenido futuro debe ser original, de dominio público verificado o contar con una licencia abierta compatible; guardar autor/fuente/licencia/atribución cuando corresponda.

### Límites actuales

- La progresión por estrellas está implementada; el equilibrio pedagógico de umbrales y el número de ejercicios por unidad todavía requieren validación humana.
- Las unidades de portugués e inglés usan catálogos locales. Para otros idiomas, la ruta depende de que el tutor IA esté configurado y disponible.
- El modo relato y las actividades de emparejar son mejoras futuras, no funcionalidades activas en esta iteración.
- La prueba automatizada no sustituye la prueba humana en Android: revisar legibilidad, tamaño de barras, tarjetas, teclado, audio y diálogos en el dispositivo real.


## Refinamiento UI y contenido — 19-11-2026 (última solicitud)

- **Estadísticas globales:** barras más estrechas (ancho máximo 54 SVG px y 52% del espacio por idioma); se elimina por completo la línea segmentada y la leyenda del promedio global. Se mantiene la comparación de precisión por idioma y los gráficos individuales.
- **Teoría:** las tablas quedan antes de las notas de uso/reglas/excepciones; los ejemplos trabajados se muestran después de las tablas. Reglas y excepciones se presentan en bloques diferenciados para facilitar lectura.
- **Ejercicios:** se elimina el control obsoleto «Repasar error» de la pantalla de práctica; el repaso programado sigue disponible como modalidad independiente. El encabezado de tema/nivel se ubica a la izquierda del contador de preguntas; el pictograma conserva debajo su etiqueta breve.
- **Audio manual:** los botones ▶ solo se generan para fragmentos cuyo locale coincide con el idioma objetivo activo. Las instrucciones y opciones en español no muestran botón de reproducción dentro de una práctica de otro idioma.
- La comprobación automatizada debe cubrir ancho de barras, ausencia de promedio, jerarquía del encabezado, etiqueta bajo pictograma, ausencia de «Repasar error», audio manual solo en idioma objetivo y orden tabla → notas → ejemplos.


## 17. Revisión pedagógica y criterio obligatorio para esquemas de interfaz — 20-11-2026

### Teoría
- Mantener las tablas de conjugación de pasado y futuro con las columnas Pronombre y Forma verbal.
- Reorganizar las reglas y excepciones: una idea por renglón o elemento visual; usar listas, subtítulos y tablas breves cuando permitan comparar formas. Evitar párrafos densos o mezclar regla, ejemplo y excepción en un mismo bloque.
- Los ejemplos representativos permanecen después de la tabla. El vocabulario actual se conserva sin cambios salvo correcciones puntuales solicitadas.

### Entrenamiento y comprensión lectora
- El nombre visible de la sección antes llamada «Ejercicios» pasa a ser **Entrenamiento**. Mantener las modalidades y flujos vigentes salvo los cambios expresamente definidos aquí.
- La comprensión lectora debe ofrecer reproducción TTS del pasaje con controles visibles de reproducir y pausar. La lectura debe usar el locale del idioma objetivo; no sintetizar como portugués/inglés los textos auxiliares en español.
- En sesiones de 10 preguntas, distinguir explícitamente las preguntas basadas en el pasaje de las preguntas generales de práctica. Las preguntas generales no deben presentarse como si dependieran del texto.
- La dificultad de lectura puede progresar combinando (a) profundidad lingüística/temática y (b) extensión y complejidad del pasaje. Los textos más largos pueden ocupar más de una pantalla y permitir scroll vertical, siempre que la longitud sea razonable para el nivel y no esconda la consigna ni los controles. No usar longitud por sí sola como indicador de nivel.
- La última pregunta de Ruta/entrenamiento debe tener una consigna inequívoca y un objetivo de respuesta único y evaluable (por ejemplo, traducir una frase concreta). Evitar preguntas abiertas que admitan varias respuestas correctas si el evaluador solo reconoce una. Si se usa respuesta abierta, declarar y probar variantes aceptadas.

### Criterio obligatorio para presentar esquemas y alternativas de interfaz
- Cuando el usuario solicite «esquemas de interfaz», «mockups», «cómo se vería» o alternativas visuales, **mostrar pantallas**, no tablas comparativas.
- Representar cada sección y subsección afectada mediante una vista independiente. Incluir los estados relevantes (pantalla inicial, selección, preparación, actividad, resultado, estados de audio/pausa, etc.) según el flujo que se esté evaluando.
- Si corresponde comparar alternativas A/B, presentar cada alternativa como una representación visual de la misma pantalla/flujo, con sus componentes, jerarquía, controles y contenido de ejemplo. No limitarse a describir diferencias en una tabla.
- No omitir subsecciones ni reducir toda la aplicación a una única pantalla genérica. Mantener consistencia con navegación, cabecera, selector de idioma, controles de audio y navegación inferior definidos en este README.
- Antes de implementar un rediseño, usar estos esquemas para validar la estructura visual cuando el usuario los haya solicitado. Si no se solicitó un esquema, no introducir mockups innecesarios.

### Registro de feedback — 20-11-2026
- [x] Teoría: separar visualmente reglas y excepciones en líneas/listas/tablas.
- [x] Comprensión lectora: TTS del pasaje con pausa y continuación.
- [x] Sesión de 10 preguntas: diferenciar comprensión del texto y práctica general.
- [x] Progresión piloto de lectura por nivel, profundidad y extensión razonable del pasaje.
- [x] Renombrar «Ejercicios» como «Entrenamiento» en navegación, títulos y textos visibles.
- [x] Ruta/entrenamiento: última pregunta de respuesta única, con consigna específica y evaluación coherente.
- [x] Documentar el criterio de esquemas visuales por pantalla/sección/subsección y alternativas A/B sin tablas comparativas.

Este registro define los criterios de aceptación de la próxima iteración; los puntos marcados pendientes no deben describirse como implementados hasta que el código y las pruebas lo confirmen.


## 18. Implementación — entrenamiento y lectura (20-11-2026)

- La sección visible se denomina **Entrenamiento**; los identificadores internos de navegación pueden conservar el nombre histórico `exercises` para evitar romper enlaces y estado.
- La modalidad Comprensión lectora presenta controles TTS propios del pasaje: reproducir, pausar y continuar. La voz usa el locale del idioma objetivo. Si Web Speech no está disponible, el control queda deshabilitado y la actividad escrita sigue disponible.
- En el modo Comprensión lectora, todas las preguntas de la sesión deben depender de los pasajes. Si la duración supera el número de preguntas únicas disponibles, se reutiliza el banco de preguntas de lectura de forma cíclica; nunca se incorporan ejercicios generales en esa sesión.
- La progresión del piloto combina nivel del pasaje (A1/A2), profundidad temática y extensión. Los textos A1 son breves; A2 incluye más contexto, conectores y detalles y puede requerir scroll vertical. El nivel no se determina solo por cantidad de palabras.
- El hito final de Ruta ahora solicita traducir una frase específica por unidad; se conserva una lista explícita y pequeña de variantes equivalentes aceptadas.
- En Teoría, todos los temas gramaticales que incluyan reglas y excepciones deben mostrarlas en secciones separadas, con cada punto en una línea independiente; tablas para conjugaciones y ejemplos debajo de las reglas.

- En las sesiones de Entrenamiento (incluida la fase de práctica general posterior a lectura), la última pregunta local se reserva para una traducción concreta por tema. Cada una de las cuatro áreas tiene un ejercicio final marcado y variantes equivalentes declaradas; se evita una consigna abierta con una sola cadena aceptada.


**Validación de implementación — 20-11-2026:** `npm run check` y `npm test` aprobados en GitHub Actions run [44673507639](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44673507639); Browser E2E aprobado en run [44673507580](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44673507580). Preview Render desplegado y live en `dep-dbvsjg59fdbs73bthtvg` (commit de código `f4db84d`). La validación auditiva real y Android siguen pendientes.


## Correcciones de experiencia móvil — 20-11-2026

- Estadísticas globales: usar barras horizontales de ancho completo, con nombre de idioma y porcentaje en cada fila. El diseño debe priorizar viewport móvil vertical y evitar SVG fijo comprimido.
- Ruta: el resultado se calcula desde las respuestas puntuables de la unidad, excluyendo el hito integrador independiente. Las respuestas puntuables, porcentaje y estrellas deben compartir el mismo conjunto de datos. Los registros antiguos derivan estrellas mínimas desde su porcentaje para reparar desbloqueos inconsistentes.
- Comprensión lectora: sesión aislada del entrenamiento general. No se repite ninguna pregunta dentro de una sesión; si se solicitan más preguntas que elementos únicos disponibles, la sesión termina al agotarse el banco.
- TTS: cada fragmento conserva su locale explícito; los controles manuales identifican el idioma reproducido. Se priorizan `speechLocale` y `promptLocale` sobre cualquier inferencia heurística.
- Gramática: el renderizador común separa reglas y excepciones en listas legibles, también en los temas de artículos, pasado y futuro con contenido aplicado.

**Despliegue de esta iteración:** Render Preview live en `dep-dbvt4mqjnfac738bvpqg`, commit `a94588dc58f940027b7d17742e7d6c4908652e57`. Render confirmó build y arranque correctos. La automatización E2E quedó aprobada en la iteración posterior del 20-11-2026; la validación auditiva y visual en Android sigue pendiente.

## 19. Decisiones vigentes — TTS, Ruta y consistencia visual (20-11-2026)

Esta sección prevalece sobre instrucciones anteriores que permitan cambiar el idioma objetivo desde la navegación, expongan texto de estado del tutor IA o muestren el resumen de Ruta como tres apartados separados.

### TTS y separación de idiomas
- Cada fragmento que se sintetiza debe tener un locale explícito y validado. No inferir el idioma por similitud léxica, signos de puntuación o palabras aisladas.
- Las consignas e instrucciones en español usan es-CL; el contenido objetivo usa el locale del idioma elegido. Los fragmentos sin metadatos inequívocos no se reproducen automáticamente.
- No usar la voz predeterminada del navegador cuando no existe una voz compatible con el locale solicitado. Es preferible omitir ese fragmento a pronunciarlo con el acento del idioma origen.
- Los botones de audio individuales solo aparecen para texto objetivo y muestran el locale correspondiente.
- La IA permanece como servicio interno del backend. El frontend no ofrece chat libre, entrada generativa ni selector de idioma personalizado. El idioma se elige una vez al iniciar entre las opciones disponibles; durante el uso no existe un control para incorporar/cambiar idioma. Una futura selección de noticias recientes puede añadirse exclusivamente dentro de Comprensión lectora.

### Teoría
- Pasado y Futuro son temas independientes: cada uno presenta introducción, tabla/estructura de formas, reglas de uso, excepciones propias y ejemplos de ese mismo tiempo verbal.
- Una excepción no debe aparecer en otro tiempo verbal. Las irregularidades del pasado y las del futuro deben estar separadas, incluso cuando compartan un mismo verbo.
- Reglas y excepciones se presentan como listas numeradas legibles, con un punto por idea. Los encabezados distinguen la regla general de los casos especiales. Las tablas preceden a las reglas y los ejemplos quedan al final.
- Revisar la congruencia conceptual y la estética de todos los temas de Gramática, Vocabulario y Expresiones para los catálogos que se ofrecen en el frontend. No marcar como auditados temas o idiomas sin contenido real.

### Ruta: resumen y continuidad
- El resumen de Ruta muestra las estrellas obtenidas (0–5), sin porcentaje ni apartados separados de Errores, Vocabulario y Temas.
- El único subtítulo del resumen es **Reforzar:**. Su lista reúne palabras, habilidades o temas asociados a respuestas fallidas. Si no hubo errores, indica que no hay elementos pendientes.
- Si la siguiente unidad está desbloqueada, el resumen ofrece una acción directa para comenzar esa unidad. Si no lo está, ofrece volver a Ruta; nunca debe dejar al usuario detenido en el resumen sin una salida.
- El puntaje, las estrellas, el desbloqueo y el texto del resumen deben derivarse del mismo conjunto de respuestas puntuables.

### Jerarquía común de actividades
- En toda actividad a pantalla completa, el orden inicial es: controles X/audio → contador de pregunta/actividad → icono/ilustración del tema → consigna y contenido → respuesta.
- El nombre de dificultad incluye nivel MCER: Principiante · A1, Intermedio · B1 y Avanzado · C1. Los códigos son una referencia de interfaz y deben revisarse si el plan de estudios asigna otro nivel.
- El estado interno del tutor IA no se muestra como texto de interfaz.

### Protocolo de trabajo y revisión visual
- Antes de cada iteración, leer este README y revisar el estado vigente de la rama.
- En cada respuesta de avance del proyecto, incluir una muestra esquemática de las pantallas afectadas; no sustituirla por una tabla de características.
- Si se presentan alternativas A/B, representar visualmente ambas variantes de la misma pantalla. Cada decisión se recoge con una selección única; el resumen de elecciones se devuelve en orden, por ejemplo: **A · A · B · A**.
- Al cerrar cada iteración, actualizar README, PROJECT_STATUS y HUMAN_TEST_PLAN con cambios, pruebas y pendientes reales. No confundir build exitoso con validación funcional ni con prueba humana en Android.
- Mantener GitHub/Render como entorno de trabajo; Replit permanece intacto.


## 20. Validación y despliegue — 20-11-2026

- HEAD de código validado: `1c7a68490cf9eb2e54a1b8a3efd20ac9ed3ddee7` en `feature/mobile-bottom-navigation`.
- `npm run check`: aprobado en GitHub Actions.
- `npm test`: aprobado en GitHub Actions run [44731566557](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44731566557).
- `npm run test:e2e`: aprobado en GitHub Actions run [44731566605](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44731566605).
- Render Preview: **LIVE**, deploy `dep-dc03b03m8hqs739dqns0`, mismo commit de código.
- La lectura mantiene el criterio de no repetir preguntas dentro de una misma sesión; si se agota el banco antes de la cantidad solicitada, finaliza sin reciclar preguntas.
- Pendiente de prueba humana: voces reales Android, navegación táctil, legibilidad móvil, barra/progreso/seek del reproductor y recorrido completo de las cuatro unidades.


## 21. Corrección de progresión, jerarquía y navegación — 20-11-2026

### Ruta
- El resumen de cada unidad debe mostrar siempre una calificación visible: 0–5 estrellas y una valoración cualitativa coherente con el porcentaje de respuestas puntuables (Perfecto, Muy bien, Bien, Vas progresando o Sigue practicando). El porcentaje no reemplaza las estrellas.
- El conjunto puntuable debe ser idéntico para el resumen y el cálculo de estrellas/desbloqueo. Los turnos IA no evaluables y la actividad integradora no se suman al denominador.
- Si se desbloquea la unidad siguiente, el botón del resumen la inicia y la nueva sesión debe identificarse inequívocamente con el ID de esa unidad.
- Si faltan estrellas, el resumen debe indicar cuántas se necesitan y permitir repetir la unidad. Si la ruta terminó, debe permitir volver al mapa. No debe existir un resumen sin una acción funcional.
- Si por un fallo se llega al resumen sin actividad integradora completada, mostrar la calificación disponible y ofrecer repetir la unidad; no registrar la unidad como completada ni desbloquear la siguiente.
- «Reforzar:» reúne habilidades, palabras y patrones vinculados a respuestas incorrectas; si no hay ninguno, indicarlo explícitamente.

### Teoría
- Las reglas y excepciones deben representar relaciones conceptuales, no solo una lista plana. Estructura visual requerida: categoría/regla principal y, debajo, subreglas o casos dependientes con sangría; las excepciones forman un bloque separado con su propia categoría y subelementos.
- Una regla independiente permanece como elemento de primer nivel. Los casos que explican o ejemplifican una regla se anidan como subelementos.
- Las tablas preceden a las reglas y los ejemplos permanecen al final. No mezclar reglas de pasado y futuro.

### Navegación
- Toda pantalla secundaria o detalle utiliza la misma flecha icon-only (←) en la esquina superior izquierda para volver al nivel anterior. Se elimina «Volver», «← Categorías» y otros formatos textuales alternativos.
- En sesiones a pantalla completa, la flecha sustituye la X visual, pero mantiene la confirmación de descarte en Entrenamiento y vuelve al mapa cuando se está en Ruta.
- No mantener reproducción de audio de una pantalla después de retroceder o cambiar de sección.

### Audio del idioma objetivo
- El contenido objetivo debe tener reproducción automática cuando el audio automático está activado y control manual cuando el contenido lo permite.
- Cada fragmento conserva su locale objetivo explícito; no debe usar la voz española como sustitución.
- En Android/Chrome, si `speechSynthesis.getVoices()` todavía está vacío, esperar al evento `voiceschanged` y volver a intentar. Si la lista ya está disponible pero no incluye una voz compatible, no sustituirla por la voz origen.
- Al detener audio o cambiar de pantalla, cancelar también las reproducciones pendientes de carga de voces.

### Esquema visual de referencia
En las respuestas de avance se muestran pantallas esquemáticas con componentes, tarjetas, botones, jerarquía y espacios similares al preview web/móvil; no usar diagramas ASCII ni generar imágenes.



## 22. Validación final de esta corrección — 20-11-2026

- Commit desplegado: `6b1f36fe463fdcff284b5101c0a18793d4476b97`.
- `npm run check` y `npm test`: aprobados en GitHub Actions run [44771349574](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44771349574).
- `npm run test:e2e`: aprobado en run [44771349707](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44771349707), incluyendo el caso de última unidad que debe volver al mapa sin reiniciarse.
- Render Preview: **LIVE**, deploy `dep-dc0749ss728c73clirf0`.
- La validación de navegador cubre resumen con estrellas y valoración, inicio de la unidad siguiente, retorno desde la última unidad, reglas anidadas, flecha común y audio objetivo automático/manual.
- Pendiente: validación auditiva y visual humana en Android; en particular, comprobar `voiceschanged` en el dispositivo y la disponibilidad real de voces objetivo.

## 23. Revisión de audio, desbloqueo, actividades y teoría — 20-11-2026

### Audio objetivo en Android
- Mantener siempre `utterance.lang` con el locale explícito del fragmento.
- Si Chrome expone voces, priorizar la coincidencia exacta o por idioma. Si la lista no incluye un objeto Voice para el locale solicitado, permitir que el motor TTS del sistema resuelva el locale explícito; no cambiar el texto ni asignarle la voz de español.
- Si `getVoices()` devuelve una lista vacía, esperar `voiceschanged` y realizar un segundo intento. Si Android no emite el evento, reintentar tras una espera acotada usando el locale explícito del sistema.
- Las secuencias de fragmentos se reproducen una a una, esperando el final/error de cada utterance; detener la sesión cancela la cola pendiente.
- La validación real en Android sigue siendo obligatoria. Un `speak()` sin error no demuestra que el usuario haya oído audio.

### Ruta
- La primera unidad se presenta como **Inicio del viaje**.
- Cada unidad separa dos capítulos pedagógicos: (1) vocabulario esencial y reglas/conjugaciones nuevas mediante preguntas breves; (2) aplicación en contexto y frases de dificultad progresiva.
- El capítulo inicial genera preguntas de significado a partir de los términos disponibles en el catálogo y conserva ejercicios de gramática cuando están etiquetados como tales.
- La progresión sigue usando la calificación por estrellas y el umbral documentado de cada unidad. Al guardar un resultado, se conserva el mejor puntaje y la unidad siguiente se habilita desde el registro persistido, no desde el estado temporal de la pantalla.

### Jerarquía común de actividades
- Cabecera compartida: nombre de sección a la izquierda, contador a la derecha y control de audio en la misma línea.
- Barra de progreso inmediatamente debajo; su porcentaje refleja la pregunta actual (incluye la pregunta en curso).
- A continuación aparece el icono/ilustración del tema, la etiqueta de capítulo/tema y luego la consigna.
- El mismo patrón aplica a Ruta, Entrenamiento y Comprensión lectora; Repaso conserva contador de tarjetas y progreso equivalente.
- En el resumen de Ruta, omitir completamente el bloque y subtítulo «Reforzar» cuando no haya elementos pendientes.

### Teoría
- Para portugués, el pasado incluye tabla de terminaciones regulares (-AR, -ER, -IR) y una tabla de conjugación de verbos irregulares frecuentes.
- Los ejemplos aplicados se presentan en tabla de dos columnas: pronombre y frase en idioma objetivo; traducción debajo y entre paréntesis. El mismo formato tabular se aplica a los ejemplos de los demás temas de conjugación y tiempos verbales cuando hay contenido disponible; las traducciones existentes entre paréntesis se conservan y se muestran en una segunda línea.
- Las tablas pueden desplazarse horizontalmente dentro de su propio contenedor en móvil, sin comprimir el texto hasta hacerlo ilegible.
- Los casos de futuro mantienen sus tablas propias y no mezclan excepciones del pasado. En portugués, los irregulares del futuro simple (dizer, fazer, trazer, pôr, ter, vir y ser) también se muestran conjugados para todas las personas, en una tabla independiente.

### Validación de esta iteración
- Los tests unitarios y Browser E2E deben cubrir el fallback Android de locale explícito, reproducción secuencial, capítulo de descubrimiento, encabezado/progreso, omisión de «Reforzar» vacío y desbloqueo al umbral de estrellas.
- La prueba auditiva en Android y la revisión de legibilidad de las tablas en dispositivo real permanecen pendientes hasta ejecutarse físicamente.

- En Ruta, el capítulo 2 ordena las frases de aplicación por nivel y complejidad creciente (longitud de respuesta), manteniendo primero las estructuras más sencillas.

- Para Android, no se llama a `cancel()` cuando el motor TTS está inactivo: se cancela solo una reproducción/petición activa y se reanuda el motor antes de hablar. Esto evita que cancelar un motor idle suprima la primera utterance tras navegar.

### Deploy de validación — 20-11-2026
- GitHub Actions: `npm run check` + `npm test` passed: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44781107121
- Browser E2E passed: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44781107099
- Render Preview: **LIVE**, deploy `dep-dc07vl3ncjis7381n1d0`, commit `d9e98d3fbc70cfb23be41066f6a1959448effb24`.
- Preview URL: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- The Render service remains on `feature/mobile-bottom-navigation`; auto-deploy is disabled. Replit has not been modified.
- Android audio playback and human review of mobile table layout remain pending device validation.

## 24. Contrato común de actividades y afinamiento PT-BR — 20-11-2026

> Esta sección reemplaza cualquier regla anterior de resumen, audio o persistencia de Repaso que la contradiga.

### Alcance de idioma
- El afinamiento funcional y pedagógico actual se valida exclusivamente con **portugués brasileño (pt-BR)**.
- Se actualizaron locales y ejemplos del catálogo PT-BR; no se deben trasladar cambios de contenido, conjugación o traducción a otros catálogos hasta que PT-BR quede aprobado.
- Los componentes de interfaz son compartidos por arquitectura; los demás idiomas aún no han pasado la validación humana equivalente.

### Audio bilingüe
- Todas las actividades evaluadas (Ruta, Ejercicios, Comprensión lectora y Repaso) conservan segmentos con locale explícito y controles manuales para los fragmentos visibles.
- La reproducción automática respeta el orden visual: instrucción/origen antes del texto objetivo en ejercicios normales; pasaje objetivo antes de su pregunta de comprensión en lectura.
- El catálogo PT-BR declara explícitamente es-CL o pt-BR en las consignas que requieren voz; los huecos de metadatos se completaron y se separaron consignas mixtas cuando correspondía.
- Ruta incluye audio en su actividad integradora; lectura reproduce automáticamente el pasaje; Repaso reproduce la consigna y la expresión objetivo disponible; los resúmenes reproducen las expresiones incorrectas.
- Cambiar de pantalla invalida la cola anterior. El botón global vuelve a reproducir la secuencia de la actividad actual, no texto oculto de una pantalla anterior.
- Si hay una secuencia de voz explícita, no se añade automáticamente un término que pueda revelar una respuesta oculta.

### Presentación y progreso común
- Todas las actividades evaluadas usan cabecera con sección a la izquierda, contador a la derecha y audio en la misma línea; barra de progreso debajo; icono del tema y etiqueta de capítulo/tema antes de la consigna.
- El contador representa el total real de interacciones evaluadas: Ruta incluye su integración (por ejemplo, 1/7 … 7/7); lectura limita el total al banco único disponible y al número seleccionado; Repaso usa el total de tarjetas pendientes de la sesión.
- Entrenamiento muestra sus modos en este orden: **Ejercicios → Comprensión lectora → Repaso**.

### Resumen común
- «Reforzar» muestra únicamente palabras/frases incorrectas, cada una con pronunciación del idioma objetivo y traducción entre paréntesis. No se muestran habilidades, temas ni categorías.
- Si no hay errores que reforzar, se omite por completo el subtítulo.
- Las acciones aparecen como tarjetas con iconos centrados: volver al menú de origen, reiniciar sesión y pasar al siguiente ejercicio. En Ruta, la tercera acción se denomina «Siguiente unidad» y solo aparece si el umbral de desbloqueo está cumplido; la última unidad no ofrece una continuación ficticia.

### Repaso continuo y recuperable
- Una sesión incluye todas las tarjetas de palabras/frases pendientes del idioma seleccionado; no se limita a una tarjeta por entrada al módulo.
- Cada respuesta actualiza y persiste el progreso de inmediato.
- Si se cierra o recarga una sesión incompleta, se conserva la cola restante, el contador y las tarjetas ya procesadas; al volver a Repaso, continúa en la primera tarjeta no completada.
- Cada tarjeta se intenta una vez por pasada; las incorrectas permanecen pendientes para una pasada posterior y no generan un bucle infinito en la misma sesión.
- Las tarjetas de patrones no se mezclan con el Repaso de palabras/frases.

### Validación automatizada
- npm run check + npm test: aprobado, run [44825579828](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44825579828).
- Browser E2E: aprobado, run [44825579907](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44825579907). Incluye orden bilingüe, audio en lectura/Ruta/Repaso, contador, resumen, cola de Repaso reanudable y desbloqueo.
- Pendiente de validación humana: reproducción audible y orden de voces en Android real, incluyendo navegación entre actividades; legibilidad y disposición final en pantalla física.

## 25. Despliegue de la iteración PT-BR — 20-11-2026
- Render Preview: **LIVE** en https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Deploy: dep-dc0c80k0916s73db0ftg.
- Commit desplegado: 94aa33457e7d244f7679ae72186ad2916b5623e9.
- Build y arranque confirmados en logs de Render; auto-deploy permanece desactivado.
- Rama de Preview: feature/mobile-bottom-navigation. Replit permanece intacto.
- Validación humana de sonido en Android físico sigue pendiente; no se considera resuelta por la prueba automatizada.


## Cambio de base de trabajo — 21-11-2026
- Decisión vigente: continuar el desarrollo desde `feature/mobile-bottom-navigation`, cuyo Preview es la referencia visual preferida. No usar `rebuild/functional-baseline` como base de interfaz ni desplegarla como Preview principal.
- La rama `rebuild/functional-baseline` se conserva temporalmente como respaldo aislado para rescatar componentes o lógica útil; no se mezclan sus estilos ni su shell visual con la rama móvil.
- Próximo alcance inicial sobre esta rama: (1) incorporar/confirmar selector central de idiomas con Italiano como única opción habilitada/visible por ahora; (2) bloquear Ruta y Entrenamiento sin borrar sus implementaciones; (3) mantener Teoría y Estadísticas sin cambios visuales ni funcionales.
- Antes de editar, comparar el estado real de `index.html`, `src/app.js`, estilos y pruebas. Después validar con `npm run check`, `npm test` y Browser E2E. No afirmar despliegue hasta verificar el commit live.
- Consolidación de Preview: mantener como Preview de referencia `https://adaptive-language-tutor-preview-5b3d.onrender.com/`. El servicio `adaptive-language-tutor-rebuild-preview` es alternativo y debe retirarse desde Render Dashboard después de verificar que no es necesario; no borrar ramas con contenido único.


### Ajuste de alcance y navegación — 21-11-2026
- Se conserva `feature/mobile-bottom-navigation` como base visual canónica; no se rediseña la bienvenida, tarjetas, Teoría ni Estadísticas.
- La barra inferior queda en cinco posiciones: Ruta bloqueada, Entrenamiento bloqueado, selector central de Idiomas, Teoría disponible y Estadísticas disponible.
- Italiano es la única opción visible y seleccionable en el selector central. Al iniciar o cambiar el idioma, se abre Teoría como primera sección disponible; Estadísticas permanece accesible.
- Ruta y Entrenamiento no se borran: sus módulos se conservan como respaldo interno, pero no se puede acceder a ellos desde la navegación y `showScreen` rechaza su apertura.
- Preview canónico: `https://adaptive-language-tutor-preview-5b3d.onrender.com`. El servicio rebuild queda marcado como respaldo histórico y no debe compartirse como preview de usuario.


## Alcance temporal vigente y preview canónico — 21-11-2026
- La app abre directamente en **Teoría**, sin pantalla de bienvenida intermedia. El usuario ve desde el primer instante la interfaz móvil y la barra inferior.
- La barra inferior tiene cinco posiciones: **Ruta** (bloqueada), **Entrenamiento** (bloqueado), **Idiomas** (selector central elevado con globo y bandera), **Teoría** (disponible) y **Estadísticas** (disponible).
- El selector central abre un diálogo con **Italiano** como única opción visible. Al confirmar o cancelar, la navegación vuelve a la sección disponible actual.
- Teoría y Estadísticas conservan sus implementaciones y estilos existentes; Ruta y Entrenamiento se mantienen en el repositorio, pero están temporalmente inaccesibles desde la interfaz.
- npm run check y npm test aprobados en el commit 7fc2cf5; Browser E2E aprobado en el run https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44964132590.
- Render confirma el preview canónico LIVE desde el commit 7fc2cf5404fa637722e78060a12df9b8ef11f394, deploy dep-dc12va0u01pc738jrqtg: https://adaptive-language-tutor-preview-5b3d.onrender.com.
- El preview alternativo de reconstrucción queda archivado: su rama conserva el código como respaldo, el entrypoint original se guarda en archive/rebuild-functional-baseline-index.html, y el servicio alternativo redirige al preview canónico (deploy LIVE dep-dc12u5ou01pc738jnm40). No eliminar la rama ni los datos históricos.
- La verificación E2E se ejecutó en Chromium con viewport móvil; no reemplaza la revisión visual y táctil humana en Android.


## Refinamiento vertical móvil — 22-11-2026
- La navegación inferior debe mostrar sus cinco destinos en una sola fila, sin que Estadísticas se desplace a una segunda línea; conservar el botón central de Idiomas destacado.
- En las pantallas principales, el título de sección mantiene su tamaño y queda alineado verticalmente con el control de audio de la cabecera.
- La lista de temas de Teoría usa filas compactas con espacio suficiente entre ellas y área táctil adecuada; evitar tarjetas excesivamente altas para títulos breves.
- Propuesta de organización futura de Teoría: unidades progresivas vinculadas al MCER (A1, A2, B1, B2, C1/C2), con temas agrupados por objetivo comunicativo y subtemas de gramática, vocabulario y expresiones. El esquema detallado se mantiene como propuesta hasta revisión; no implica que el contenido esté implementado.


## Jerarquía de Teoría y audio — 22-11-2026
- Jerarquía de navegación: **nivel → unidad → subtema**. Gramática, Vocabulario y Expresiones no son pantallas ni niveles separados; cada subtema muestra un icono identificador de su categoría al inicio del nombre.
- El nivel A1 muestra seis unidades con títulos únicamente: Primeros contactos; Datos personales y entorno; Rutinas y tiempo; Comida y compras; Viajes y orientación; Números y cantidades. Los subtemas existentes se agrupan bajo las unidades; no se agregan explicaciones nuevas en esta etapa.
- Al abrir A1, el encabezado conserva «A1 · Principiante»; al abrir una unidad, el encabezado de la lista conserva exactamente el título de esa unidad. Los subtítulos de Teoría se alinean a la izquierda.
- Los títulos principales de sección permanecen centrados y conservan su tamaño.
- En Teoría, palabras y frases cortas del idioma objetivo se muestran subrayadas, sin control de reproducción. Los textos largos pueden tener botón de reproducción manual. La lectura automática está desactivada en Teoría; la lectura automática queda reservada para preguntas de ejercicios.
- Los cambios de jerarquía y audio deben validarse con Browser E2E y revisión visual/auditiva manual. No declarar el preview actualizado hasta confirmar el deploy.


### Ajuste de navegación de Teoría — 22-11-2026
- Se simplificó la navegación a nivel → unidad → subtemas, eliminando el nivel/pantalla intermedia de categorías.
- Gramática, Vocabulario y Expresiones se indican mediante iconos junto al nombre de cada subtema.
- Los encabezados de nivel y unidad conservan sus nombres al entrar a la siguiente vista; los subtítulos quedan alineados a la izquierda.

### Verificación de navegación simplificada — 22-11-2026
- Commit de código: `0b96d5a007005a0b3b4a59d1336891fb0eab736e`.
- `npm run check` + `npm test`: aprobados en [GitHub Actions](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44992684949).
- Browser E2E: en ejecución al registrar esta nota: [run 44992684991](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/44992684991).
- Render Preview: **LIVE**, deploy `dep-dc18fkeq1p3s73fg7t6g`, commit `0b96d5a007005a0b3b4a59d1336891fb0eab736e`; [preview canónico](https://adaptive-language-tutor-preview-5b3d.onrender.com/).


### Navegación acumulativa de Teoría — 22-11-2026
- Los encabezados de nivel y unidad se acumulan en filas consecutivas al profundizar hacia la lista y el detalle del subtema.
- Cada fila de encabezado conserva altura fija e incluye su flecha de retorno; la navegación mantiene visible la jerarquía superior.
- El subtema se muestra como contenido siguiente dentro de Teoría, no como pantalla fija a pantalla completa.
- El encabezado del detalle muestra el icono de categoría inmediatamente antes del nombre (por ejemplo, icono de gramática + «Gramática»).
- Validación automatizada y despliegue de esta revisión quedan pendientes hasta completar CI y confirmar el preview LIVE.

- Último commit de esta revisión: `ce437d5c2b6788ed5f480728f9f039537f687b0e`; Render inició el deploy `dep-dc18tbvf3r2c73c0uogg` y seguía en construcción al registrar esta nota. No declarar el preview actualizado hasta que el deploy figure LIVE.


## Ajuste de navegación de Teoría — 22-11-2026 (vigente)
- Esta decisión **reemplaza** los encabezados acumulativos y las flechas de retorno por nivel descritos en la iteración anterior.
- La navegación de Teoría usa selectores desplegables jerárquicos y progresivos: **Etapa → Unidad → Subtema**. Las opciones de subtema se agrupan visualmente mediante optgroups de Gramática, Vocabulario y Expresiones.
- No mostrar la palabra «Nivel» como encabezado del menú principal de Teoría; usar «Etapa».
- Al abrir un subtema, conservar el nombre del subtema como título principal, con su categoría/icono como rótulo superior.
- Debajo del título se muestra una ruta breve y de menor tamaño: «A1 · Principiante > Nombre de unidad». La ruta no lleva flechas ni controles de retorno.
- El detalle contiene una sola flecha de retroceso, que devuelve a los selectores jerárquicos. No mostrar flechas adicionales para volver a etapa o unidad; esas dimensiones se cambian directamente en sus desplegables.
- Mantener el contenido, los ejemplos, la pronunciación manual y el orden pedagógico existentes. Este cambio afecta la navegación y su presentación, no amplía el temario.
- Validar los selectores en móvil, la agrupación por categoría, el título/ruta y la existencia de una sola flecha mediante Browser E2E. La revisión táctil final en Android sigue siendo manual.


- Corrección de integración — 22-11-2026: al volver a Teoría desde otra sección, el restablecimiento de vista debe operar sobre el contenedor único de selectores y el detalle; no debe intentar ocultar las antiguas listas independientes.

- El selector de Etapa comienza con una opción neutra («Selecciona una etapa»); al elegir A1 se habilita la selección de Unidad, sin depender de volver a seleccionar un valor precargado.


### Confirmación de preview — 22-11-2026
- Render deploy `dep-dc19agetlv9c73bf6gu0` finalizó en estado **LIVE** con el commit `e9caf17995211d65d0f390032845f2d2536a7d23`.
- El preview canónico sigue siendo https://adaptive-language-tutor-preview-5b3d.onrender.com/.
- La consulta de runs asociadas al commit no devolvió ejecuciones; el conector disponible filtra a runs disparadas por pull request. No se afirma que `npm run check`, `npm test` ni Browser E2E hayan pasado para este commit. Consultar Actions directamente o ejecutar localmente antes de considerar la navegación validada.


### Diseño confirmado de navegación de Teoría — 22-11-2026
- Se adopta como base visual la alternativa **B: árbol jerárquico persistente**, manteniendo visibles los niveles superiores mientras se navega por la jerarquía.
- La jerarquía es Etapa → Unidad → Subtemas. Gramática, Vocabulario y Expresiones son categorías identificadas mediante iconos/etiquetas en los subtemas, no niveles jerárquicos.
- Regla de expansión exclusiva: dentro de una misma lista jerárquica solo puede permanecer expandida una unidad a la vez. Al expandir otra unidad, la anterior se colapsa automáticamente; por ejemplo, abrir «Datos personales y entorno» colapsa «Primeros contactos».
- Las unidades se enumeran con números arábigos (1, 2, 3, 4, 5, 6), conservando sus títulos.
- La presentación visual detallada de filas, conectores y detalle de subtema queda sujeta a revisión de los ejemplos antes de implementarse.


### Diseño visual confirmado de Teoría — variante B2 (22-11-2026)
- Variante elegida: **B2 — Ramificaciones independientes**, con selección azul.
- Cada unidad es un bloque independiente con borde izquierdo azul; la unidad expandida recibe un fondo azul muy tenue y un borde azul más marcado.
- Los subtemas aparecen debajo de la unidad, con sangría a la izquierda y conectores de rama `├` / `└`. No se numeran los subtemas.
- La numeración arábiga (1, 2, 3, 4, 5, 6) identifica exclusivamente las unidades y respeta su orden.
- Solo una unidad puede permanecer expandida a la vez. Al abrir otra, la anterior se colapsa automáticamente; tocar la unidad abierta la vuelve a colapsar.
- La presentación es compacta y vertical; no usar selectores desplegables, tarjetas altas, nodos circulares ni líneas verticales compartidas por toda la lista.
- Las categorías Gramática, Vocabulario y Expresiones siguen siendo identificadores visuales de los subtemas, no niveles jerárquicos.
- El detalle de subtema conserva su contenido, navegación anterior/siguiente y retorno único; al volver, mantiene expandida la unidad de origen.


### Validación y preview de B2 — 22-11-2026
- Código y pruebas de la variante B2: commit `af0680ca58eb3c33d2f4a92ce6372d650ce1c6f4`.
- `npm run check` y `npm test`: aprobados en GitHub Actions [45057647408](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45057647408).
- Browser E2E: aprobado en [45057647416](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45057647416).
- Render Preview: **LIVE**, deploy `dep-dc1jkoajnfac738v4j7g`, commit `af0680ca58eb3c33d2f4a92ce6372d650ce1c6f4`.
- La prueba humana visual y táctil en móvil queda pendiente.


## Ajustes solicitados tras prueba humana de Teoría B2 — 22-11-2026

### Diseño aprobado para la siguiente iteración
- **Árbol B2:** conservar sin cambios la línea/borde lateral azul que identifica cada unidad y su estado expandido. No alterar su color, posición, continuidad, grosor ni comportamiento.
- **Subtemas:** eliminar los conectores/viñetas duplicados que aparecen a la izquierda. Sustituirlos por un único marcador sencillo por subtema (punto pequeño o segmento breve), manteniendo la sangría, los iconos de categoría y la jerarquía visual. No dibujar una segunda línea vertical para los subtemas.
- **Detalle de Teoría:** el orden del encabezado debe ser: título de sección **«Teoría»** → ruta jerárquica (etapa y unidad) → categoría del subtema → título del subtema → contenido. La ruta no debe aparecer debajo del título del subtema.
- **Audio manual:** corregir la reproducción individual del texto en idioma objetivo. El control debe reproducir exactamente el fragmento objetivo asociado, con su locale explícito (para la validación actual, italiano it-IT), sin leer la traducción en español ni depender del audio automático global. Debe funcionar al pulsarlo manualmente en Android.
- **No regresiones:** conservar el contenido, navegación, selección azul B2, expansión exclusiva y borde lateral azul de unidades.

### Estado
- La propuesta de interfaz de estos tres ajustes fue presentada para revisión visual.
- **Pendiente de implementación:** los cambios anteriores aún no se han aplicado al código ni desplegado. La reproducción manual de voz sigue siendo un defecto abierto hasta que se corrija y se valide auditivamente en Android.
- Antes de cerrar esta iteración: actualizar pruebas Browser E2E para orden de encabezado y ausencia de conectores duplicados; añadir/verificar prueba de TTS con locale it-IT; ejecutar npm run check, npm test y Browser E2E; desplegar y confirmar Render LIVE.


### Implementación de ajustes de Teoría B2 e italiano — 22-11-2026
- [x] Subtemas: se sustituyeron los conectores de rama duplicados por un único punto sencillo. Se eliminó la línea vertical secundaria de los subtemas.
- [x] Se conserva sin cambios el borde lateral azul de cada unidad: grosor de 2 px, color normal y estado expandido.
- [x] Detalle: la ruta «A1 · Principiante > Unidad» ahora se presenta inmediatamente debajo del título de sección «Teoría» y antes de categoría y título del subtema.
- [x] Pronunciación manual: se mantienen controles individuales incluso para palabras y frases cortas. Cada botón conserva el texto objetivo y su locale explícito.
- [x] Idioma vigente de la aplicación: **italiano (it-IT)**. Cualquier referencia a pt-BR en notas anteriores describe versiones históricas y no es un requisito vigente para esta iteración.
- [x] Browser E2E ampliado para comprobar marcador único, ausencia de conectores, borde azul de unidad, posición de ruta y reproducción manual con locale it-IT.
- [x] npm run check y npm test aprobados en GitHub Actions run [45060797598](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45060797598).
- [x] Browser E2E aprobado en run [45060797728](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45060797728).
- [x] Render Preview **LIVE**, deploy dep-dc1k48d9fdbs73b2ua70, commit c55822c0ce8434ab086f0067715124fd7333377f.
- [ ] Validación auditiva manual pendiente en teléfono Android real. La prueba automatizada verifica el texto y locale enviados a SpeechSynthesis, pero no puede certificar la voz instalada ni el sonido físico del dispositivo.

### Resultado de CI y despliegue — 22-11-2026
- Checks unitarios/estáticos: aprobados, run 45060797598.
- Browser E2E: aprobado, run 45060797728.
- Render Preview: LIVE, deploy dep-dc1k48d9fdbs73b2ua70, commit c55822c0ce8434ab086f0067715124fd7333377f.
- La aplicación queda disponible para revisión visual y funcional. La comprobación de voz debe completarse en un teléfono Android real; CI no verifica el audio audible.


## Ajustes de legibilidad y pronunciación directa en Teoría — 22-11-2026
- La tipografía de la jerarquía (etapa, unidad y subtema) debe compartir el tamaño del encabezado «A1 · Principiante»: 16 px.
- Reducir el espacio vertical entre el encabezado del subtema y el inicio de su desarrollo; el párrafo explicativo comienza inmediatamente después del título, sin un hueco amplio.
- Las palabras y frases breves en italiano se reproducen al tocar directamente el texto subrayado. No muestran icono Play.
- Reservar el icono Play para fragmentos de pronunciación extensos (más de 48 caracteres); el icono reproduce solo ese fragmento.
- Los textos tocables deben ser accesibles por teclado y anunciarse como controles.
- Mantener el locale italiano it-IT y no leer traducciones en español.
- Añadir pruebas E2E para igualdad de tamaños, espaciado compacto y pronunciación directa del texto. Validar CI y Render antes de cerrar.

### Validación y despliegue — ajustes de legibilidad y audio — 22-11-2026
- `npm run check` + `npm test`: aprobados en GitHub Actions run [45062976801](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45062976801).
- Browser E2E: aprobado en run [45062980099](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45062980099). Verifica tamaños jerárquicos iguales, inicio compacto del contenido y pronunciación directa del texto corto en it-IT.
- Render Preview: **LIVE**, deploy `dep-dc1kf756e07s73dkg96g`, commit `91b939557b44c77173021d1cd8167729706073e1`.
- Pendiente solo la comprobación visual/táctil y auditiva en Android real.


### Preferencias de interfaz confirmadas — 22-11-2026
- Se elige la alternativa A para Teoría: ramas abiertas, sin celdas/tarjetas.
- Los iconos de categorías conservan los mismos glifos actuales (Gramática «文», Vocabulario «Aa», Expresiones «“ ”»), en tratamiento monocolor.
- Aumentar la separación vertical entre unidades y subtemas, especialmente entre subtemas.
- El subrayado de palabras/frases en italiano debe ser segmentado/punteado y seguir activando TTS al tocar el texto.
- Reducir el espacio bajo el título del subtema y antes de los controles Anterior/Siguiente.
- Conservar el contenido, el audio italiano it-IT, la selección azul y la línea lateral de unidades; no reintroducir tarjetas ni conectores duplicados.


### Continuación de revisión — 22-11-2026
- Se volvió a leer esta especificación antes de continuar.
- El último cambio de estilos de Teoría está presente en la rama. No se encontraron checks de CI asociados al commit de documentación más reciente; esto no demuestra que las pruebas hayan fallado, solo que no hay resultados disponibles en la consulta realizada.
- La comprobación de Render no pudo completarse porque la cuenta conectada no tiene un workspace seleccionado. No se afirma que el preview incluya los últimos cambios.
- Próximo paso técnico: validar `npm run check`, `npm test` y Browser E2E en un entorno con dependencias; después confirmar el deploy LIVE. La prueba visual/táctil y auditiva en Android sigue siendo manual.


### Validación posterior — 22-11-2026
- Se verificaron los runs de GitHub Actions para el HEAD actual `1fde4397dd38f8e79f7b37ee94e20849f17ea832`: Tests [45096368092](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45096368092) y Browser E2E [45096368051](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45096368051), ambos completados con conclusión `success`.
- Esto valida los checks automatizados en ese commit, pero no confirma que Render haya desplegado los cambios. La comprobación del servicio sigue pendiente por falta de workspace Render seleccionado.
- La revisión visual/táctil y auditiva en Android real sigue pendiente.


### Diagnóstico de preview sin cambios — 23-11-2026
- Se identificó que el servicio canónico `adaptive-language-tutor-preview-5b3d` tenía `autoDeploy` desactivado y su último deploy LIVE era `91b939557b44c77173021d1cd8167729706073e1`, anterior a los estilos de la revisión actual. Esto explica que el preview se viera igual pese a que los checks del código actual pasaron.
- Se inició un despliegue manual de la rama actual: deploy `dep-dc1pnqqvcj2c73d73ke0`, commit `bad4f055d711c05e118d5868d93c105045126e80`. Al registrar esta nota, Render seguía en `build_in_progress`; no declarar LIVE hasta confirmarlo.

### Ajuste reforzado de jerarquía A y detalle de subtema — 23-11-2026
- Se verificó que el deploy manual anterior está LIVE en el commit `bad4f055d711c05e118d5868d93c105045126e80`; el usuario reportó que la interfaz seguía igual, por lo que se reforzaron los valores visuales en CSS en lugar de repetir el mismo despliegue.
- Aumentar de forma perceptible la separación entre unidades y, especialmente, entre subtemas: árbol con 14 px de separación; ramas con 14 px y filas de subtema de al menos 44 px.
- Mantener las unidades sin tarjetas, conservar la línea lateral azul y los glifos existentes (文, Aa, “ ”) en monocolor.
- Subrayado de italiano con patrón dotted y TTS directo conservado.
- Detalle de subtema: reducir margen superior del encabezado y ruta, y reducir al mínimo el espacio antes de Anterior/Siguiente sin disminuir su área táctil.
- Cambio CSS: commit `7f2b9bc90bb4e3a89107d06e37b25c2aab17489c`. Pendiente CI, Browser E2E y nuevo deploy LIVE.
- Se preparará un esquema de revisión del detalle con partes A–F identificadas en la respuesta, sin incorporar etiquetas temporales a la interfaz de producción.
- Deploy manual iniciado para el HEAD `73d7f6ca2ce5f8784794c78ad6be9a8195a40b51`: Render deploy `dep-dc1pskss728c73d3rnh0`, estado inicial `build_in_progress`. Confirmar LIVE antes de compartir como actualizado.
- Validación del commit `f34ea7e46538f3f30db57838e531f9be42a51a78`: Tests aprobados en [45097695210](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45097695210) y Browser E2E aprobado en [45097695208](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45097695208). Render deploy `dep-dc1pskss728c73d3rnh0` seguía en `build_in_progress` en la última consulta.

### Nueva presentación de jerarquías y detalle de subtema — 23-11-2026
- Se sustituyen los glifos de texto de las categorías por iconos lineales SVG monocolor: Gramática = libro abierto; Vocabulario = libro abierto con letra A; Expresiones = dos globos de conversación. No se muestran los antiguos caracteres 文, Aa ni “ ”.
- En el detalle, la fila superior agrupa A y B: A es la flecha de retorno a la izquierda; B es la ruta Etapa > Unidad centrada. El contador de posición del subtema se ubica a la derecha y usa formato compacto (por ejemplo, 1/4).
- C (categoría/icono) y D (título del subtema) quedan en un bloque independiente alineado a la izquierda, inmediatamente debajo de la fila superior.
- Se mantiene el cuerpo del contenido y la navegación Anterior/Siguiente.
- En la jerarquía, se mantiene el árbol abierto A elegido: etapa, unidades con borde lateral azul y subtemas con iconos de categoría. La nomenclatura A–D se usa en los esquemas de revisión, no como etiquetas añadidas a producción.
- Se actualizó Browser E2E para comprobar iconos SVG, orden/alineación del encabezado y contador 1/4. Pendiente confirmar Actions y Render LIVE.
- Render deploy `dep-dc1r1aqfngtc738drrhg` quedó **LIVE** con el código de interfaz del commit `9090b62ef89910dd3e551a323eb1137b10064442`. Tests aprobados para el HEAD de esa revisión; Browser E2E se volvió a ejecutar después de corregir un selector de test y sigue en curso. La prueba humana Android sigue pendiente.
- Validación final del HEAD `9cd1f5547f5926bcf0451516651b0900bfa65486`: Tests aprobados en [45105290863](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45105290863) y Browser E2E aprobado en [45105290817](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45105290817). El deploy LIVE `dep-dc1r1aqfngtc738drrhg` contiene el código visual `9090b62ef89910dd3e551a323eb1137b10064442`; el commit posterior `9cd1f55` solo ajustó selectores de la prueba.

### Revisión visual solicitada para Teoría — 23-11-2026
- **Estado:** propuesta de interfaz presentada; implementación pendiente de revisión/aprobación visual del usuario.
- **Detalle de subtema, fila A:** reunir en una sola línea la flecha de retroceso a la izquierda, el título de sección «Teoría» centrado y el control de audio a la derecha. Todo el contenido situado debajo de esta fila conserva el orden y disposición vigentes (ruta/contador, categoría, título, contenido y anterior/siguiente).
- **Glifos de categorías:** conservar los glifos actuales de Gramática y Expresiones. Sustituir únicamente el glifo de Vocabulario por un símbolo asociado a traducción/letras/idiomas; comparar visualmente una opción de traducción antes de fijarla.
- **Jerarquía B2:** conservar ramas abiertas, borde lateral azul de las unidades y ausencia de tarjetas. Reducir la separación y sangría de los subtemas C para acercarlos visualmente a la unidad B que los contiene, manteniendo legibilidad y áreas táctiles.
- **Encabezados fijos al desplazar:** evaluar un comportamiento sticky similar a inmovilizar filas en Excel. Alternativa principal para revisión: mantener fija la cabecera de etapa y la unidad expandida en dos niveles; comparar con una alternativa que fije solo la etapa. Evitar que el encabezado fijo oculte el primer subtema y respetar el área segura superior del móvil.
- No implementar ni desplegar estos cambios hasta que el usuario revise las alternativas visuales y confirme el comportamiento sticky.


### Confirmación de encabezados sticky y viñetas de jerarquía — 23-11-2026
- Se confirma la alternativa A con alcance a toda la sección Teoría: título de sección, etapa y unidad expandida quedan inmovilizados en una pila de encabezados de ancho completo, con niveles escalonados para evitar superposición.
- Durante el desplazamiento por los subtemas, el encabezado de la unidad expandida permanece visible debajo de la etapa; se respeta el área segura superior en móvil.
- Las viñetas de subtemas se refuerzan como puntos azules de 8 px, más visibles que el marcador anterior, sin modificar el tamaño tipográfico ni la sangría general.
- Browser E2E verifica estilos sticky y diámetro del marcador. La prueba real en Android sigue siendo necesaria para confirmar la sensación de desplazamiento y ausencia de contenido oculto.


### Validación y despliegue — encabezados fijos y viñetas — 23-11-2026

- CI final del HEAD `7f446f2b8277a862432d6145c71dea59ad36d65d`: Tests aprobados en [45115607032](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45115607032) y Browser E2E aprobado en [45115607075](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45115607075).
- Render Preview **LIVE**, deploy `dep-dc1sj97f3r2c73dl79ig`, commit `7f446f2b8277a862432d6145c71dea59ad36d65d`.
- Pendiente únicamente validación visual/táctil en Android real para comprobar el apilamiento sticky durante desplazamiento y la visibilidad de las nuevas viñetas.


### Ajustes de encabezados y jerarquía — 23-11-2026
- Se limita el sticky del menú de jerarquías al encabezado de sección «Teoría»; la etapa y las filas de unidad/subtema se desplazan normalmente.
- En el detalle, el encabezado fijo muestra flecha de retorno, título de sección centrado y control de audio. El audio de esta cabecera queda conectado al mismo estado global.
- Se eliminan las viñetas de subtemas, conservando sus glifos de categoría. Las unidades usan azul suave y los subtemas un celeste de menor intensidad.
- El glifo de Vocabulario se sustituye por un símbolo de traducción/idiomas, sin libro.
- Browser E2E actualizado para las nuevas reglas. No se ejecutó localmente en esta acción; el resultado de CI queda pendiente. No se afirma despliegue Render hasta verificarlo.


### Implementación de encabezado y glifos de Teoría — 23-11-2026
- Menú de jerarquías: el único encabezado sticky es «Teoría»; etapa y unidades se desplazan con el contenido.
- Se eliminaron los marcadores/viñetas generados junto a los subtemas; se conservan los iconos SVG de categoría y su alineación.
- Gramática conserva el libro abierto y Expresiones conserva los globos de conversación. Vocabulario usa ahora un símbolo lineal de traducción/intercambio entre idiomas, sin libro.
- Detalle de subtema: una sola fila superior con retorno a la izquierda, «Teoría» centrado y audio a la derecha. Debajo se muestra la ruta jerárquica, luego categoría alineada a la izquierda y título del subtema.
- Se agruparon la fila superior, ruta, categoría y título en un bloque sticky; el bloque permanece fijo hasta el título inclusive. El cuerpo del contenido continúa desplazándose.
- Se mantiene el subrayado punteado y la pronunciación directa de palabras cortas en el idioma objetivo. No se duplicó la lógica de TTS existente.
- Commits de implementación: HTML `ed5a6d7`, JS `13e0b6b`, CSS `f2c2e7c` y `7380b42`.
- Estado de validación: no se ejecutaron localmente `npm run check`, `npm test` ni Browser E2E en esta acción. Pendiente comprobar Actions y Render LIVE; también falta validación visual/táctil/auditiva en Android real.

- Corrección adicional tras inspección del DOM: la ruta y el contador se inicializan con clase `hidden`; ahora se muestran explícitamente al abrir el detalle. Commit JS `dbeb02b`. Esto evita que la ruta solicitada quede oculta aunque su texto ya se hubiera actualizado.


### Refinamiento visual de Teoría — 23-11-2026
- Vocabulario: el glifo se simplifica a «Aa», evitando el símbolo de flechas anterior.
- Menú de jerarquías: el encabezado de nivel (por ejemplo, A1 · Principiante) se presenta en una celda azul suave; cada unidad numerada se presenta en una celda azul más tenue. Se conserva la expansión exclusiva, los subtemas, sus iconos y el comportamiento de desplazamiento ya aprobado.
- Detalle de subtema: se oculta el encabezado global superior mientras el detalle está abierto, eliminando la duplicación de «Teoría». El título centrado de la fila interna aumenta a 24 px (tamaño de encabezado de sección) y el bloque se compacta hacia arriba. El botón de retorno y el audio se mantienen en sus posiciones.
- La apertura y el retorno del detalle controlan una clase de estado explícita para ocultar/mostrar el encabezado externo sin depender de selectores CSS relacionales.
- Commits de código: JS `edcc8f5`; CSS `adafe63`.
- Pendiente: npm run check, npm test, Browser E2E, confirmar Render LIVE y revisión humana en Android.


### Contraste de jerarquía y glifo de vocabulario — 23-11-2026
- Se aprueba el glifo de traducción/intercambio para Vocabulario; no usar Aa ni libro. El SVG representa el intercambio entre idiomas con flechas y trazos tipográficos.
- El menú de jerarquías aumenta el contraste: celda de nivel #173B65 y celdas de unidades #315B85, con texto claro. Se mantiene la diferencia de intensidad entre nivel y unidad.
- En el detalle de subtema se oculta la cabecera global que duplicaba el control de audio; se conserva la cabecera interna con retorno, título «Teoría» y audio. El contenido restante sube al espacio liberado.
- Validación automatizada y Render LIVE pendientes de confirmar para esta revisión. La revisión humana móvil sigue pendiente.


### Diagnóstico de Render tras reporte de preview sin cambios — 24-11-2026
- Se comprobó que el servicio canónico `adaptive-language-tutor-preview-5b3d` apunta a `feature/mobile-bottom-navigation`, pero tiene el auto-deploy desactivado. Por eso los nuevos commits no se publican automáticamente.
- El último deploy LIVE previo correspondía al commit `0f49e5faf5f585afa1ece566ef975806d4f64ef7`, no al HEAD de la rama.
- Se inició un deploy manual del HEAD `c5293f7f6893b36a5e588324e6e3961ffb8780f8`: deploy `dep-dc2e1metlv9c73frfaa0`. Estado observado: `build_in_progress`; pendiente confirmar LIVE. No afirmar todavía que la vista esté actualizada.


### Corrección de contenido y glifo de Teoría — 24-11-2026
- Las celdas de unidad usan azul más claro `#4B81B8`, con texto blanco y contraste conservado.
- Vocabulario usa un glifo de globo/idioma más reconocible, en lugar del SVG de flechas que se percibía extraño.
- Se corrigió el estado del detalle: al avanzar o retroceder, la categoría activa se deriva del subtema actual. Antes persistía la categoría del primer subtema abierto, haciendo que el contenido especializado y el rótulo quedaran desincronizados aunque el icono cambiara.
- Browser E2E ahora cubre el cambio Gramática → Vocabulario → Expresiones y el color de unidad. Pendiente CI, despliegue Render LIVE y comprobación humana móvil.


### Corrección de glifo y contador de subtema — 24-11-2026
- Vocabulario: reemplazar el globo que seguía sin reconocerse correctamente por un glifo bilingüe compacto «A ⇄ 文», que identifica letras/idiomas y traducción. Gramática y Expresiones no cambian.
- Detalle de subtema: el contador (por ejemplo, 1/4) se ubica en la misma línea que el título, alineado a la derecha. El título ocupa el espacio flexible y el contador conserva su ancho.
- La fila completa de título y contador forma parte del encabezado sticky; ambos permanecen visibles al desplazarse por el contenido.
- Browser E2E incorpora verificaciones de ubicación única del contador junto al título.
- Commits: HTML 80de502, JS aff80b3, CSS e1894a9, E2E 79bcab7; documentación actualizada en los commits inmediatamente anteriores.
- Pendiente validar CI, Render LIVE y prueba visual/táctil en Android real.


### Seguimiento de preview sin cambios — 24-11-2026
- Causa: el servicio `adaptive-language-tutor-preview-5b3d` tiene auto-deploy desactivado (`autoDeploy=no`); un push a la rama no publica automáticamente los cambios.
- Se identificó el workspace Render `My Workspace` y se inició deploy manual `dep-dc2ek6etlv9c73ft8kb0`, asociado al commit `0bf2879569ca831759e42e39b0c23ba61ea78484`.
- Último estado consultado: `update_in_progress`. El preview no se considera actualizado hasta que Render confirme `LIVE`.
- CI: `Tests` aprobado; `Browser E2E` falló en la aserción previa del color de las celdas de subtema (color calculado transparente, esperado azul claro). Las nuevas aserciones de glifo y contador todavía no se ejecutaron. Revisar la prueba antes de declarar validación completa.


### Ajustes de jerarquía, glifo y encabezados globales — 24-11-2026
- En las filas de unidad, la numeración conserva color neutro; el nombre de la unidad recibe el acento azul. Las celdas mantienen un fondo azul suave.
- Los subtemas aumentan su sangría y reservan una columna vacía a la izquierda para incorporar en el futuro el check de finalización alimentado por Ruta. No se muestran checks ficticios ni se conecta todavía el progreso de Ruta.
- Vocabulario usa el glifo textual «abc».
- Los encabezados de sección permanecen fijos durante el desplazamiento en todas las pantallas, incluida Estadísticas.
- Browser E2E cubre estos estilos y la reserva visual para checks. La conexión de checks con Ruta queda pendiente de implementar junto con el progreso real de temas.


### Estado de validación — ajustes de jerarquía y títulos — 24-11-2026
- La implementación de interfaz está desplegada en Render Preview: deploy `dep-dc2et9ei0phs73alhth0`, **LIVE**, commit `3353d9aa04cfa14f356b5af85e1a021db906cd55`. El servicio mantiene auto-deploy desactivado; los despliegues posteriores requieren activación manual.
- En el HEAD de trabajo `a5f38843458a7e7f55fd09a9cb826502d36d5786`, `npm run check` y `npm test` aprobaron en Actions run [45308702322](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308702322).
- Browser E2E del HEAD `a5f3884` está en ejecución en run [45308702254](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308702254). Las dos ejecuciones previas detectaron aserciones antiguas que no coincidían con la jerarquía vigente (subtemas abiertos y ausencia de borde lateral); se actualizaron para comprobar el diseño real. No declarar E2E aprobado hasta que finalice la ejecución actual.
- La reserva de espacio para checks es visual; la integración de finalización de temas con Ruta aún no existe. La comprobación visual/táctil en Android real sigue pendiente.


### Seguimiento de CI — glifo abc — 24-11-2026
- Se corrigió el último selector E2E que todavía esperaba el glifo bilingüe anterior; ahora comprueba «abc».
- `npm run check` y `npm test` aprobados en el HEAD `e6e7f06f0509c823493a0a11975c9a097e80dfa4`, Actions run [45308897457](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897457).
- Browser E2E del mismo HEAD sigue en ejecución en [45308897430](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897430); pendiente resultado. El preview Render ya está **LIVE** en deploy `dep-dc2eu2dg1s2s73b4bdh0`, commit `3419279bb749c5164cc19baf8aad71609d55f825`, que incluye los cambios de interfaz y el glifo abc en minúsculas.


### Resultado final de validación — 24-11-2026
- Browser E2E aprobado en el HEAD `e6e7f06f0509c823493a0a11975c9a097e80dfa4`, Actions run [45308897430](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897430).
- Tests (`npm run check` + `npm test`) también aprobados en [45308897457](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45308897457).
- Render Preview **LIVE**, deploy `dep-dc2eu2dg1s2s73b4bdh0`, commit de interfaz `3419279bb749c5164cc19baf8aad71609d55f825`.
- Falta únicamente la revisión visual/táctil en Android real. La columna para checks sigue siendo una reserva visual hasta implementar la relación con progreso de Ruta.


### Ajuste fino de separación entre unidades — 24-11-2026
- Se compacta la separación vertical entre unidades: el árbol no añade gap y cada unidad deja solo 2 px de margen inferior. Las ramas abiertas conservan 4 px al final para separar el siguiente bloque sin crear un hueco excesivo.
- La numeración de las unidades se fuerza a color neutro `#263e59` tanto en estado normal como expandido; el acento azul queda reservado al nombre de la unidad.
- Browser E2E comprueba el color de la numeración y el nuevo espaciado. Pendiente CI y deploy manual de Render (auto-deploy desactivado), además de revisión en Android.


### Deploy del ajuste de separación — 24-11-2026
- Render Preview **LIVE**: deploy `dep-dc2fhh4s728c73aelb30`, commit `3713d5949797d382eb85b74b1d90a26fb719a6c8`.
- `npm run check` y `npm test` aprobados en Actions run [45313920290](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920290).
- Browser E2E [45313920332](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920332) sigue en ejecución al momento de esta actualización; no se declara aprobado todavía.
- La prueba humana en Android debe confirmar que la reducción de espacios se percibe adecuada y que el número sigue neutro al expandir la unidad.


### Corrección del espaciado de jerarquías tras reporte visual — 24-11-2026
- Se identificó la causa: el override anterior buscaba `.theory-tree` como descendiente de `#theory-tree`, pero el propio contenedor tiene ambos identificadores/clases. Por ello el `gap:0` no se aplicaba y seguía activo el espacio amplio de 13–14 px.
- Se corrigió el selector para aplicar `display:grid` y `gap:0` directamente a `#screen-theory #theory-tree`. Se mantienen 2 px entre unidades, 4 px al final de ramas y numeración neutra.
- Commit de corrección CSS: `2ac2b2ad273b588ea4b2c539fdde10b90439b396`. Pendiente CI y deploy manual Render; auto-deploy continúa desactivado.


### Corrección de numeración neutra y selector E2E — 24-11-2026
- Se mantiene el número de unidad en color neutro `#263e59` en estado normal y expandido; el acento azul corresponde exclusivamente al nombre de la unidad. La regla CSS ya está aplicada en `src/styles.css`.
- Se corrigió el E2E: el contenedor `#theory-tree` es el propio grid, no contiene un descendiente `.theory-tree`. La aserción de separación ahora consulta el elemento correcto y evita un timeout ajeno al comportamiento visual.
- La prueba verifica el color calculado del número (`rgb(38, 62, 89)`), el color del nombre (`rgb(49, 91, 133)`) y el espaciado entre unidades.
- Validación anterior: `npm run check` y `npm test` aprobados en run [45313920290](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920290); Browser E2E falló por el selector incorrecto en [45313920332](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45313920332). Nueva ejecución pendiente.
- Render Preview estaba LIVE en deploy `dep-dc2fmbbncjis73cr8c60`, que contiene el CSS de numeración neutra. El auto-deploy sigue desactivado.


### Corrección reforzada de color en jerarquías tras reporte «sigue igual» — 24-11-2026
- Se inspeccionó el HTML generado: la numeración y el nombre de unidad son spans separados dentro de cada fila.
- La hoja CSS acumulaba reglas históricas contradictorias para los números (tonos claros en revisiones anteriores) y dependía de que el último override prevaleciera. Para eliminar la ambigüedad de cascada, el renderizado de cada unidad ahora fija directamente en el elemento: número neutro `#263e59` y nombre azul `#315b85`, incluyendo `-webkit-text-fill-color` para consistencia en navegadores móviles.
- Browser E2E verifica tanto el color calculado como los estilos explícitos de ambos spans.
- Commits: implementación `88a4ce2a5ae84fba589d0a95f0cb74e5f7023c04`; prueba `29b53577655f6c16a9a3a298612b17ee83895d74`.
- Pendiente: ejecutar CI, publicar con limpieza de caché Render (auto-deploy desactivado) y verificar el resultado LIVE antes de solicitar nueva revisión visual Android.


### Validación y publicación de la corrección reforzada de numeración — 24-11-2026
- La implementación fija en el HTML generado el color del número de unidad en `#263e59` y el del nombre en `#315b85`, incluyendo `-webkit-text-fill-color` para navegadores móviles. El cambio de código está en el commit `88a4ce2a5ae84fba589d0a95f0cb74e5f7023c04`; las aserciones E2E en `29b53577655f6c16a9a3a298612b17ee83895d74` verifican estilo explícito y color calculado.
- En el HEAD `b647fac64e3180fc024c99decbd115ee846fa764`, Tests aprobados en [45317664026](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45317664026) y Browser E2E aprobado en [45317664032](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45317664032).
- Render Preview confirmado **LIVE**, deploy `dep-dc2g0ejrjlhs73ck877g`, asociado al HEAD `b647fac64e3180fc024c99decbd115ee846fa764`. Se publicó manualmente con limpieza de caché porque el auto-deploy está desactivado.
- Pendiente únicamente la comprobación visual/táctil humana en Android. La aprobación E2E confirma el comportamiento en el navegador automatizado, pero no sustituye la revisión en el teléfono del usuario.


### Seguimiento de reporte visual persistente — 24-11-2026
- El usuario informa que el menú de jerarquías todavía se ve igual después de la publicación.
- Se volvió a consultar Render: el servicio Preview tiene el deploy `dep-dc2g0ejrjlhs73ck877g` en estado **LIVE**, asociado al commit `b647fac64e3180fc024c99decbd115ee846fa764`. El auto-deploy permanece desactivado.
- No se aplican más cambios CSS a ciegas: las pruebas automatizadas ya verifican los estilos, pero no permiten identificar qué versión o elemento está viendo el usuario en su Android.
- Próximo diagnóstico pendiente: solicitar una captura actual del menú de jerarquías abierto (idealmente mostrando una unidad expandida) y confirmar que se abrió el preview Render, no una pestaña/app instalada antigua. Con esa evidencia se comparará el DOM/estilos visibles antes de modificar nuevamente.


### Recuperación anterior a la reducción de jerarquías A1 — 25-11-2026
- El rollback anterior a `59a8456152d63915e733f53b39e229c1add8cfe3` no recuperó el estado solicitado: ese commit ya era posterior a los cambios de teoría que dejaron el foco en A1.
- Se identificó en el historial que `430906f742591fee14e00b54f438a28b4a3b161c` reorganizó la jerarquía A1 y limitó el desarrollo visible a la Unidad 1. Su ancestro inmediato `0d2b76035c16c96c14d1d956b721ca99ae3f0524` precede esa modificación.
- La rama se restauró exactamente a `0d2b76035c16c96c14d1d956b721ca99ae3f0524`, sin aplicar parches al código. Este es el punto anterior a la modificación de jerarquías que se está recuperando.
- Render debe completar el despliegue y verificarse contra ese árbol antes de considerar restaurado el servicio.


### Reconstrucción del punto intermedio previo a la regresión — 24-11-2026
- Se comparó el árbol restaurado `0d2b76035c16c96c14d1d956b721ca99ae3f0524` con los commits de ajustes visuales y E2E del 24-11: el árbol restaurado ya contiene esos cambios (incluidos los commits `88a4ce2`, `29b5357`, `2ac2b2a`, `3713d59` y `e6e7f06` como ancestros).
- La comparación directa `0d2b760...430906f` confirma que entre ambos existe un único commit posterior de código: `430906f742591fee14e00b54f438a28b4a3b161c`. Su diff afecta solo `src/app.js` y reemplaza el contenido anterior de teoría por una nueva distribución de temas/unidades, dejando los desarrollos descriptivos concentrados en la primera unidad.
- Por tanto, el punto intermedio recuperable y más completo antes de esa regresión es `0d2b760`; no corresponde cherry-pickear los ajustes visuales porque ya están incorporados en ese árbol. Si en el preview no aparecen, la discrepancia debe diagnosticarse contra el commit realmente servido o el estado/caché del navegador, no rehaciendo los cambios.
- Render Preview confirmó LIVE el deploy `dep-dc32ro8m7kps73cvansg`, commit `d330e3fcb1624a80854e48821b90c256a143f063`, cuyo árbol de código corresponde a `0d2b760` más este registro documental.


### Recuperación selectiva de avances de Teoría sin reducir la jerarquía — 25-11-2026
- Se parte de la base restaurada anterior a la reducción A1 y se recuperan selectivamente los avances posteriores de contenido italiano, sin reincorporar el commit que cambió el árbol a ocho unidades.
- Se conserva la jerarquía original de seis unidades y sus títulos. La primera unidad vuelve a mostrar cuatro subtemas desarrollados: saludos y despedidas, decir el nombre, cómo estás, y pronombres/ser-estar.
- Se recupera la pronunciación independiente para cada variante de una celda separada por «/» o salto de línea: cada control reproduce únicamente su frase.
- En la comparación verbal se separan las tablas de pronombres y conjugación; los términos «essere» y «stare» se muestran en cursiva y entre comillas angulares. Se iguala el tamaño de las columnas verbales y las tablas bilingües (19 px escritorio / 17 px móvil).
- Se adaptó Browser E2E para comprobar los cuatro subtemas, las variantes de pronunciación, el formato de encabezados y la conservación de las seis unidades.
- Implementación en revisión: rama `recovery/intermediate-theory-content`. No publicar en Render ni integrar a la rama principal hasta completar CI y revisar el diff.


### Validación automatizada de recuperación selectiva — 25-11-2026
- `npm run check` y `npm test`: aprobados en GitHub Actions run [45522922228](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45522922228).
- Browser E2E: aprobado en run [45522922093](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45522922093).
- Las pruebas cubren la jerarquía de seis unidades, los cuatro subtemas de Unidad 1, la pronunciación independiente de variantes y la tipografía/encabezados de las tablas de pronombres y conjugación.
- La revisión humana Android y el despliegue Render siguen pendientes; el preview canónico no se ha modificado.


### Integración y despliegue Render de la recuperación selectiva — 25-11-2026
- Pull request [#5](https://github.com/asotomayorb/adaptive-language-tutor/pull/5) integrado mediante squash en la rama `feature/mobile-bottom-navigation`.
- Commit integrado: `395aace02fccbf51aa433a66a33a87aa32d8043e`.
- Se conserva la jerarquía A1 de seis unidades y se recuperan los cuatro subtemas desarrollados de Unidad 1, la pronunciación independiente de variantes y el formato tipográfico de las tablas.
- Validación CI `npm run check` + `npm test`: aprobada, run [45523103299](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45523103299).
- Browser E2E: aprobado, run [45523103462](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45523103462).
- Render Preview **LIVE**, deploy `dep-dc3399u8bjmc73ednf6g`, commit `395aace02fccbf51aa433a66a33a87aa32d8043e`, con limpieza de caché.
- Los logs de Render confirman inicio correcto de `npm start`, escucha en `0.0.0.0:10000` y servicio LIVE. La revisión visual/táctil/auditiva en Android sigue pendiente.


### Checkpoint confirmado — recuperación selectiva de Teoría italiana — 25-11-2026
- Checkpoint funcional aceptado por el usuario: commit de código `395aace02fccbf51aa433a66a33a87aa32d8043e`; HEAD documental previo `44e22c21d90f8242c1426d87f3b8485c97fe5934`.
- Rama: `feature/mobile-bottom-navigation`. Se preserva la jerarquía A1 de seis unidades y la recuperación de los cuatro subtemas de Unidad 1.
- CI y Browser E2E aprobados; Render Preview LIVE en deploy `dep-dc3399u8bjmc73ednf6g`.
- El checkpoint queda establecido como base estable para los siguientes ajustes de formato en subtemas. La prueba humana en Android permanece pendiente y no se considera aprobada.


### Ajustes de formato en subtemas italianos — 25-11-2026
- Se confirmó el checkpoint solicitado: base funcional `395aace02fccbf51aa433a66a33a87aa32d8043e`, registrado en README y PROJECT_STATUS antes de continuar.
- Los títulos de subtemas convierten términos italianos reconocidos a cursiva, comillas angulares y traducción española entre paréntesis. Para «Pronombres y ser/estar», el encabezado ahora presenta «Essere» (ser) y «Stare» (estar).
- Los encabezados y celdas de tablas quedan fuera de ese formato; en la tabla de conjugación los encabezados son texto simple.
- La última tabla de conjugación aplica tamaño uniforme a sus tres columnas: 19 px escritorio y 17 px móvil.
- Cambios de código: `448503a3effc7852a5811ba0a9ea313eb7ac8201` (render de títulos), `107e947cc32a801f8b5cac9f2c99d0022a65efc3` (CSS), `0131e4687c4cba885c1a9524490256f191512b4d` (E2E).
- Tests `npm run check` + `npm test`: aprobados, Actions [45529304385](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45529304385) y [45529365304](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45529365304).
- Browser E2E: aprobado, Actions [45529304350](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45529304350) y [45529365187](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45529365187).
- Render Preview **LIVE**, deploy `dep-dc340mk0916s73fkoni0`, asociado al commit documental `b90f852c1f9226bffc860e5ce52309e6a773ddf7`, que contiene el código validado.
- Sigue pendiente la revisión visual/táctil/auditiva humana en Android; los checks correspondientes quedaron añadidos a `HUMAN_TEST_PLAN.md`.


### Checkpoint confirmado — Unidad 1 validada y reglas tipográficas — 25-11-2026
- El usuario confirma guardar como checkpoint el estado con Unidad 1 desarrollada y sus reglas de formato aplicadas.
- Código validado: `0131e4687c4cba885c1a9524490256f191512b4d`; HEAD documental vigente al registrar el checkpoint: `0948936d0687ef0122bf951bb44b19a74cd0ea14`.
- Rama: `feature/mobile-bottom-navigation`. Se conserva la jerarquía A1 de seis unidades.
- Tests y Browser E2E aprobados; Render Preview LIVE, deploy `dep-dc340mk0916s73fkoni0`.
- Este checkpoint es la base segura para limpiar los contenidos de unidades posteriores y desarrollar la Unidad 2. Unidad 1 debe permanecer intacta.


### Limpieza de subtemas y desarrollo de Unidad 2 — 25-11-2026
- Checkpoint anterior conservado: Unidad 1 y reglas de formato validadas, registrado antes de iniciar esta fase.
- Se vació el contenido de los subtemas de Unidades 3 a 6, manteniendo todos sus títulos y la jerarquía de seis unidades. Unidad 1 permanece intacta.
- Unidad 2 desarrollada para italiano en sus cuatro subtemas:
  1. Países e idiomas: países, uso de preposiciones de lugar, gentilicios y nombres de idiomas.
  2. Artículos y concordancia: artículos definidos e indefinidos, usos y ejemplos.
  3. Artículos y adjetivos: concordancia de adjetivos en género y número, terminaciones -o/-a/-i/-e y ejemplos.
  4. Edad y procedencia: preguntas/respuestas, edad con `avere`, origen con `essere di` / `venire da`, variantes formales e informales.
- Se conserva el formato de tablas bilingües Italiano/Español, pronunciación independiente para cada variante separada por «/», y títulos italianos en cursiva entre « » con traducción española entre paréntesis. Los encabezados de tablas quedan sin ese formato.
- E2E verifica los cuatro subtemas de Unidad 2, sus tablas, pronunciación por variantes, formato de títulos y ausencia de contenido en Unidad 3. Unidad 1 sigue cubierta por las pruebas previas.
- CI `npm run check` + `npm test`: aprobado, run [45531925766](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45531925766).
- Browser E2E: aprobado, run [45531925531](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45531925531).
- Commits de código: `0e8b28b` (contenido Unidad 2 y limpieza), `571a0ca` (E2E), `30f7b9f` (formato de títulos italianos), `dc05ceb` (corrección de sintaxis y validación final).
- Render deploy en curso: `dep-dc34b395efls73aor580`, código `dc05ceb51c49db20f6cebb9479e3e467d374cc76`. Registrar estado LIVE al completarse.
- La prueba humana en Android continúa pendiente.


- Confirmación final Render Preview: deploy `dep-dc34b395efls73aor580` terminó en estado **LIVE** el 25-11-2026, desplegando exactamente el código validado `dc05ceb51c49db20f6cebb9479e3e467d374cc76`. El auto-deploy permanece desactivado.


### Checkpoint confirmado — Unidad 2 y nuevas reglas globales de teoría — 25-11-2026
- El usuario confirma guardar checkpoint sobre el estado de Unidad 2: código validado `dc05ceb51c49db20f6cebb9479e3e467d374cc76`; Render Preview LIVE en deploy `dep-dc34b395efls73aor580`.
- Se conserva Unidad 1 intacta, la jerarquía A1 de seis unidades y los cuerpos de Unidades 3–6 vacíos, manteniendo sus títulos.
- Nuevos criterios globales pendientes de implementar y validar en todos los subtemas:
  1. Distribuir el ancho de las columnas de tablas de la forma más equitativa posible, incluida la tabla de edad.
  2. Separar en controles TTS independientes cada expresión italiana dividida por «/», guion u otro separador de variantes; aplica a países, nacionalidades y cualquier otro subtema.
  3. Explicar las reglas antes de la tabla correspondiente, nunca dentro de sus celdas.
  4. Formular las reglas en un párrafo introductorio simple; cuando ayude, mostrar terminaciones en líneas breves, por ejemplo `-o (masculino) / -e → -i` y `-a (femenino) → -e`.
  5. No repetir la regla en un cuadro inferior de la tabla. Las excepciones pueden ir en un cuadro posterior, pero deben explicarse claramente y no presentarse como ejemplos aislados.
- El checkpoint registra el estado previo a estos cambios; no implica que los nuevos criterios ya estén implementados. Pendiente aplicar los cambios, añadir cobertura de pruebas, validar CI/E2E y actualizar Render si corresponde.
- Prueba humana en Android sigue pendiente.


## Política vigente de ramas y Render — 25-11-2026
- Rama de desarrollo activa: `feature/mobile-bottom-navigation`. El trabajo funcional nuevo y las correcciones cotidianas continúan aquí.
- Render Preview canónico permanece conectado a `feature/mobile-bottom-navigation`; esta es la rama que se publica y se valida en el teléfono.
- Rama `recovery/intermediate-theory-content`: respaldo histórico/de recuperación. No usarla como rama de desarrollo cotidiano, no conectarla a Render y no desplegarla directamente.
- Los avances que se quieran preservar como respaldo se registran mediante commits/checkpoints identificables en `recovery`; evitar reescrituras o borrados de su historial.
- Para rescatar un avance, comparar primero las ramas y trasladar selectivamente commits o cambios desde `recovery` hacia `feature/mobile-bottom-navigation`; ejecutar validaciones y publicar desde la rama activa.
- No hacer merge completo ni cambiar la rama configurada en Render como mecanismo automático de rescate. Cualquier integración debe ser selectiva y verificable.
- Estado al registrar esta política: el pulido de Unidad 2 está validado por CI en `recovery`, pero todavía no se ha incorporado a la rama activa ni publicado en Render. La revisión humana Android también sigue pendiente.


### Checkpoint confirmado — política de ramas y Render — 25-11-2026
- El usuario confirma la política de ramas: `feature/mobile-bottom-navigation` sigue como única rama de desarrollo activo y fuente del preview canónico.
- `recovery/intermediate-theory-content` queda exclusivamente como respaldo histórico; no se conecta ni se despliega directamente en Render.
- El servicio canónico `adaptive-language-tutor-preview-5b3d` conserva la rama `feature/mobile-bottom-navigation` y el auto-deploy manual/desactivado.
- Verificación previa a esta publicación: Render estaba LIVE en deploy `dep-dc34b395efls73aor580`, commit `dc05ceb51c49db20f6cebb9479e3e467d374cc76`. La rama activa avanzó después únicamente con documentación de política/checkpoint; no hay cambios de código funcional posteriores a ese deploy.
- Se solicita publicar el HEAD documental de la rama activa para dejar el preview sincronizado con el checkpoint. La versión funcional servida seguirá siendo la del código validado `dc05ceb51c49db20f6cebb9479e3e467d374cc76`; el pulido adicional de Unidad 2 de `recovery` no está integrado y no debe aparecer todavía en Render.
- La prueba visual/táctil/auditiva humana en Android continúa pendiente.


### Publicación Render tras confirmar el checkpoint — 25-11-2026
- Deploy manual completado correctamente: `dep-dc3d627lot8c739r7nig`, estado **LIVE**.
- Render quedó asociado al HEAD de la rama activa `012497be4811bc03f5939b83eaf15ba26f8a1754`. El commit contiene el registro documental del checkpoint; no introduce cambios funcionales respecto del código ya validado.
- Los logs de la nueva instancia confirman ejecución de `npm start` y escucha de la aplicación en `0.0.0.0:10000`.
- El código funcional servido sigue siendo el de Unidad 2 validado en `dc05ceb51c49db20f6cebb9479e3e467d374cc76`. Los criterios adicionales que siguen solo en `recovery/intermediate-theory-content` no se han desplegado ni integrado.
- Pendiente: revisión humana visual, táctil y auditiva en Android.


## Integración selectiva y publicación del pulido de Unidad 2 — 25-11-2026
- Se corrigió la discrepancia del preview: el deploy anterior había publicado únicamente documentación, por lo que la interfaz seguía mostrando el código previo.
- El usuario confirmó el checkpoint de política de ramas: feature/mobile-bottom-navigation sigue como rama activa y origen del Render canónico; recovery/intermediate-theory-content permanece como respaldo histórico, sin desarrollo diario ni despliegue directo.
- Se rescató selectivamente el pulido de Unidad 2 desde recovery mediante PR #7; no se fusionó la rama de respaldo completa. Código integrado en 19627135bf04bcb7c0a83330f007ebee04a0f8de.
- Cambios: contenido de países/idiomas con variantes TTS independientes por / y guiones; reglas de artículos antes de tablas; concordancia de adjetivos con tabla de tres columnas; edad y procedencia; tablas de teoría a ancho completo, columnas equitativas y ajuste de texto móvil. Se conserva el formato de títulos italianos y el tamaño uniforme de la tabla de conjugación.
- Tests aprobados: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45614659980. Browser E2E aprobado: https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45614660104.
- Render Preview LIVE: deploy dep-dc3daucipgvc738c5k10, commit 19627135bf04bcb7c0a83330f007ebee04a0f8de. Logs confirman inicio con npm start y escucha en 0.0.0.0:10000. El servicio conserva la rama activa y auto-deploy desactivado.
- Esta integración reemplaza las notas anteriores que indicaban que el pulido de Unidad 2 seguía solo en recovery. La rama recovery no se modifica y queda conservada como respaldo.
- Pendiente: prueba humana en Android (visual, táctil y auditiva), especialmente distribución de tablas, lectura individual de variantes y navegación por los cuatro subtemas de Unidad 2.
- Checkpoint funcional publicado: 19627135bf04bcb7c0a83330f007ebee04a0f8de. Mantenerlo como punto de retorno antes de ampliar contenidos.
- Se ajustaron los workflows para ejecutar Tests y Browser E2E también en PR dirigidos a la rama activa, además de los eventos push.


### Ajustes de claridad solicitados para Unidad 2 — 25-11-2026
- Se aplican las últimas instrucciones del chat origen, limitando el cambio a Unidad 2 y sus pruebas; no se modifica el contenido de Unidad 1 ni de Unidades 3–6.
- Países e idiomas ahora separa las columnas País, Gentilicio e Idioma, con explicación breve de cada una y controles TTS independientes.
- Artículos y concordancia presenta reglas concisas en viñetas antes de dos tablas independientes (definidos e indefinidos), sin notas explicativas dentro de las celdas.
- Artículos y adjetivos presenta reglas detalladas en viñetas antes de la tabla; los ejemplos mantienen la traducción solo en español y sin aclaraciones parentéticas.
- Edad y procedencia tiene una introducción específica sobre «avere», «essere» y el trato formal; se quitaron las aclaraciones «(formal)» de las traducciones.
- Browser E2E ampliado para verificar las etiquetas país/gentilicio/idioma, TTS por celda, reglas en viñetas antes de tablas y ausencia de aclaraciones parentéticas.
- Validaciones automatizadas y publicación Render pendientes; no declarar listo para prueba humana hasta confirmar CI/E2E y preview actualizado.


### Diagnóstico de preview sin cambios — 25-11-2026
- El usuario informa que Render Preview sigue mostrando la versión anterior. La revisión confirma que el HEAD de `feature/mobile-bottom-navigation` es `d9565981cf49ec77faa861e39b8edca2f1bea15c`, pero el servicio Render mantiene auto-deploy desactivado; por tanto, un commit en GitHub no actualiza el preview por sí solo.
- El código de Unidad 2 y los ajustes solicitados sí están presentes en `src/app.js` en esa rama (incluye las columnas País/Gentilicio/Idioma y las reglas previas a las tablas). No se debe concluir que faltan en el código por el hecho de no verse aún en Render.
- La ejecución `npm run check` + `npm test` aprobó en Actions [45661774198](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45661774198). Browser E2E falló en [45661774152](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45661774152), específicamente en `tests/browser/e2e.js:122`: una aserción de Unidad 1 exige cursiva en todas las introducciones italianas. Es una aserción de prueba que debe revisarse; no demuestra por sí sola un defecto del contenido de Unidad 2.
- No se debe publicar ni declarar listo para preview hasta corregir/ajustar la aserción sin debilitar la cobertura, volver a ejecutar Browser E2E y confirmar en Render que el deploy LIVE corresponde al HEAD validado.
- La conexión actual a Render no permitió consultar el servicio ni disparar un deploy; no se ha realizado publicación en esta revisión.


### Revisión adicional: Unidad 2 sigue sin reflejar los últimos ajustes — 25-11-2026
- Se verificó el servicio Render canónico `adaptive-language-tutor-preview-5b3d`: está configurado con la rama correcta `feature/mobile-bottom-navigation`, pero `autoDeploy=no`; por ello no publica los commits nuevos automáticamente.
- El último deploy LIVE del servicio es `dep-dc3daucipgvc738c5k10`, que sirve el commit `19627135bf04bcb7c0a83330f007ebee04a0f8de`. No contiene la revisión de claridad posterior que se registró en el código de la rama.
- El HEAD documental actual es `769118182623ab0004517a2e8ddca15c2bb92d6e`; su commit padre de código es `d9565981cf49ec77faa861e39b8edca2f1bea15c`. La rama contiene los cambios de Unidad 2, pero no deben publicarse todavía: Browser E2E falló en el run [45661774152](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45661774152), en `tests/browser/e2e.js:122`, porque la aserción de Unidad 1 exige cursiva en todas las introducciones y no coincide con el contenido real. Tests unitarios/check sí aprobaron en el run [45661774198](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45661774198).
- Se confirma así la causa de que el usuario siga viendo lo mismo: Render continúa sirviendo el commit anterior y el despliegue manual está bloqueado prudentemente hasta corregir la prueba E2E sin debilitar la cobertura.
- Próximo paso obligatorio: corregir la aserción de Unidad 1 para que valide los términos italianos que realmente deben ir en cursiva, conservar intacto su contenido, ejecutar de nuevo CI y Browser E2E, y solo entonces desplegar manualmente el commit validado y verificarlo LIVE.
- No listo para preview ni para prueba humana. Unidad 1 y Unidades 3–6 quedan fuera del alcance de edición.


### E2E corregido y auto-despliegue Render habilitado — 25-11-2026
- Se corrigió la aserción heredada de Unidad 1 que exigía cursiva en todas las introducciones aunque el contenido real no usa ese formato en cada subtema. La cobertura ahora verifica expresiones italianas objetivo en las tablas y conserva la comprobación explícita de pronunciación independiente de variantes del primer subtema. No se modificó el contenido de Unidad 1.
- Se ajustó la comprobación de Países e idiomas de Unidad 2: los encabezados País/Gentilicio/Idioma se validan directamente en el encabezado semántico de la tabla, sin exigir que aparezcan duplicados en el texto plano del cuerpo. La prueba sigue exigiendo tres columnas, pronunciación independiente y encabezados exactos.
- Validación sobre el commit de código/pruebas `9d4744a01935347b99948044ec7d65ac4e6c2ad7`: Tests `npm run check` + `npm test` aprobados en [run 45674658722](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45674658722); Browser E2E aprobado en [run 45674659254](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45674659254).
- Render Blueprint existente `exs-dbus1io8v5cc73a0tjsg` conserva el recurso actual `srv-dbus3hnf3r2c739j9ir0`, la rama `feature/mobile-bottom-navigation` y el servicio/URL actuales; no se creó un servicio adicional.
- Se aprobó el único cambio de infraestructura del plan: `autoDeployTrigger: checksPass` (antes `off`). Render confirma `autoDeploy=yes`, `autoDeployTrigger=checksPass`; el Blueprint quedó con `autoSync=true` y estado `in_sync`.
- A partir de ahora, los pushes a la rama activa sincronizan el Blueprint automáticamente y Render despliega cuando los checks de GitHub pasan. Los cambios con checks fallidos no deben publicarse. Las variables de entorno existentes se preservan.
- El servicio todavía sirve el deploy LIVE anterior `dep-dc3daucipgvc738c5k10` / commit `19627135bf04bcb7c0a83330f007ebee04a0f8de` al momento de esta anotación; el próximo push documental generará la primera ejecución bajo la nueva política automática. Verificar deploy LIVE con el nuevo HEAD antes de declarar el preview actualizado.
- El código de Unidad 2 no se modificó en esta corrección de pruebas/infraestructura. Unidad 1 y Unidades 3–6 permanecen fuera del alcance de edición.
- Pendiente: confirmar el primer auto-deploy LIVE del nuevo HEAD y realizar prueba humana Android de los cuatro subtemas de Unidad 2.


### Primer deploy con auto-despliegue habilitado — 25-11-2026
- Render confirmó `autoDeploy=yes`, `autoDeployTrigger=checksPass`, Blueprint `autoSync=true`, rama `feature/mobile-bottom-navigation`; se conserva el servicio existente y sus variables de entorno.
- Los checks del commit `4bb81c7814867c5ddd0b9e0347839ab724307224` finalizaron correctamente: Tests [45674813867](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45674813867) y Browser E2E [45674813911](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45674813911).
- Aunque la configuración automática ya estaba activa, Render no inició un deploy al detectar esos pushes. Para no dejar el preview desactualizado, se lanzó un deploy de recuperación manual del HEAD validado: `dep-dc3iga0u01pc73eobuog`, estado LIVE, commit `4bb81c7814867c5ddd0b9e0347839ab724307224`.
- Se comprobó que el servicio sigue con autoDeploy habilitado después del deploy manual. La política está configurada para futuros pushes, pero la ejecución automática aún requiere una comprobación adicional con un próximo cambio de código; si vuelve a no dispararse, revisar webhook/integración GitHub-Render antes de declarar la automatización plenamente verificada.
- Preview LIVE actual: https://adaptive-language-tutor-preview-5b3d.onrender.com. Prueba humana Android de Unidad 2 pendiente.


### Auto-deploy en cada commit — 25-11-2026
- Se cambió el disparador del servicio de `checksPass` a `commit` para ajustarse a la solicitud de publicar automáticamente cada push a `feature/mobile-bottom-navigation`. Render confirma `autoDeploy=yes`, `autoDeployTrigger=commit`; Blueprint `autoSync=true`.
- Motivo: aunque los checks de GitHub estaban aprobados, Render no inició automáticamente los despliegues de los commits anteriores; se necesitó un deploy manual de recuperación. El modo `commit` evita depender de la detección de checks CI por Render.
- Esta modalidad publica cada commit sin esperar el resultado de CI. Mantener CI activo y evitar pushes de cambios incompletos.
- Prueba de automatización: el siguiente commit posterior a esta configuración debe generar un deploy automático. Verificar su trigger y commit antes de declarar la automatización comprobada.
- Preview actualmente LIVE: commit `4bb81c7814867c5ddd0b9e0347839ab724307224`, deploy `dep-dc3iga0u01pc73eobuog`.


### Verificación de webhook auto-deploy — 25-11-2026
- Se activó el modo Render `On Commit`: `autoDeploy=yes`, `autoDeployTrigger=commit`; Blueprint `autoSync=true`. Se mantiene la rama correcta y el servicio existente.
- Se hizo un nuevo push posterior a la activación (`1fac8472ef9e6ed19c7c0ad001e0a77eef216939`), pero no apareció un nuevo deploy automático ni evento de auto-deploy. Por tanto, la configuración está activa en Render, pero el disparo automático aún no está funcionando/verificado.
- El preview sigue LIVE en `dep-dc3iga0u01pc73eobuog`, commit `4bb81c7814867c5ddd0b9e0347839ab724307224`; los cambios posteriores son solo documentación/configuración, no alteran el código de la app.
- Diagnóstico pendiente: confirmar en Render que el repositorio está conectado mediante la integración GitHub (no como URL pública de repositorio). La documentación de Render indica que los auto-deploys requieren un Git provider conectado; servicios configurados solo con una URL pública del repositorio requieren deploy manual.
- No declarar auto-deploy plenamente operativo hasta observar un deploy cuyo `trigger` sea automático tras un push nuevo. No se modificó código funcional de Unidad 1 ni Unidades 3–6.


### Checkpoint confirmado — base Unidad 2 antes de nuevo rediseño de tablas — 25-11-2026
- El usuario confirma guardar el checkpoint funcional previo a los siguientes ajustes didácticos y visuales.
- Punto de retorno funcional publicado: commit `19627135bf04bcb7c0a83330f007ebee04a0f8de`; Render Preview LIVE en deploy `dep-dc3daucipgvc738c5k10` según la verificación previa. Este checkpoint no incluye los cambios solicitados en esta nueva revisión.
- Alcance siguiente: solo Unidad 2, sin modificar contenido de Unidad 1 ni Unidades 3–6.
- Países e idiomas: añadir traducción española del país entre paréntesis en la primera columna; evaluar más ejemplos sin saturar la tabla.
- Mantener tipografía de párrafos uniforme, también cuando el texto se presenta en viñetas.
- Artículos y concordancia: reemplazar explicaciones extensas por dos tablas de reglas (definidos e indefinidos), con género en filas y singular/plural en columnas; ajustar ancho de encabezados al texto; mantener ejemplos en una única fila compacta debajo de los encabezados.
- Artículos y adjetivos: aplicar el mismo criterio de síntesis visual mediante reglas estructuradas y tabla compacta.
- Antes de implementar, presentar y revisar en conversación el esquema visual de interfaz; el esquema se ha presentado como propuesta inicial y queda sujeto a aprobación/ajustes del usuario.
- Auto-render: sigue siendo un pendiente operativo separado. Aunque el Blueprint/servicio se configuró previamente con autoSync y auto-deploy, no se ha demostrado un disparo automático tras push. No declarar automatización lista hasta verificarla con un deploy automático real.
- Prueba humana Android sigue pendiente.


### Verificación posterior del auto-deploy y checkpoint documental — 25-11-2026
- El checkpoint documental de este nuevo ciclo quedó guardado en el commit `ce18e012b0322c3032f0916609e538bc32ae062f`; el checkpoint funcional de Unidad 2 permanece en `19627135bf04bcb7c0a83330f007ebee04a0f8de`.
- CI del commit documental aprobado: Tests [45685124705](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45685124705) y Browser E2E [45685124945](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45685124945).
- Tras el push del commit `ce18e012...`, Render no creó un deploy nuevo. La lista de deploys sigue mostrando como LIVE el deploy manual `dep-dc3iga0u01pc73eobuog`, asociado a `4bb81c7814867c5ddd0b9e0347839ab724307224`; no existe evidencia de trigger automático para el nuevo push.
- Configuración consultada: servicio `srv-dbus3hnf3r2c739j9ir0`, rama `feature/mobile-bottom-navigation`, `autoDeploy=yes`, `autoDeployTrigger=commit`; Blueprint `exs-dbus1io8v5cc73a0tjsg`, `autoSync=true`, estado `in_sync`. Esta configuración por sí sola no demuestra que el webhook GitHub–Render esté operativo.
- El panel de herramientas Render disponible permite consultar servicio/Blueprint y disparar deploys manuales, pero no cambiar la integración Git provider/repositorio del servicio existente. No se creó un servicio duplicado ni se hizo un deploy manual para ocultar el fallo automático.
- Acción pendiente necesaria en Render Dashboard: revisar Settings → Repository y conectar el servicio mediante la integración GitHub del repositorio, no como URL pública/clone source. Después, hacer un push de prueba y verificar que el nuevo deploy tenga trigger automático. Hasta entonces, auto-render permanece NO operativo/verificado; el preview sigue en el último deploy LIVE manual.


### Ajustes de propuesta visual Unidad 2 — 26-11-2026
- El usuario aclara que el ejemplo anterior de países duplicó el nombre español en ambas partes. La forma correcta es el nombre italiano primero y su traducción española entre paréntesis: `Germania (Alemania)`, `Spagna (España)`, `Francia (Francia)`. Evaluar ejemplos adicionales sin convertir el subtema en un listado demasiado largo.
- Artículos y concordancia: explicar brevemente cada forma antes de las tablas. Definidos: `il` ante consonante ordinaria; `lo` ante s impura y grupos/sonidos como z, gn, ps, x; `l’` ante vocal. Femenino: `la` ante consonante y `l’` ante vocal. Indefinidos: `un` masculino ante consonante ordinaria o vocal (sin apóstrofo); `uno` ante s impura y grupos como z, gn, ps, x; `una` femenino ante consonante y `un’` ante vocal. Verificar ejemplos/reglas finales con el contenido existente antes de implementación.
- Conservar ejemplos en formato compacto de una sola fila bajo encabezados.
- Artículos y adjetivos: mantener el enfoque de reglas breves y tabla compacta ya propuesto.
- Tipografía: párrafos y viñetas deben conservar el mismo tamaño. Ajustar ancho de encabezados/celdas al contenido y al viewport móvil.
- Estos son criterios de propuesta; aún no se modifica el contenido de Unidad 2 hasta cerrar la revisión visual. Unidad 1 y Unidades 3–6 permanecen fuera de alcance.
- Se intentará comprobar el auto-render mediante un push documental posterior a esta nota. Si no aparece deploy automático, registrar el intento como fallido y mantener como pendiente la conexión GitHub–Render; no reemplazarlo con deploy manual ni declararlo resuelto.


### Intento de auto-render tras push documental — 26-11-2026
- Se hizo push del commit documental `8b0aeda865ba5b32be70a0650f9dfda247839dbe` para probar el disparo automático sin cambiar el código de la app.
- Consulta posterior a Render: no se creó un deploy nuevo. El último sigue siendo el deploy manual `dep-dc3iga0u01pc73eobuog`, commit `4bb81c7814867c5ddd0b9e0347839ab724307224`, trigger `api`. El intento de auto-render no tuvo éxito.
- El servicio aún reporta `autoDeploy=yes`, `autoDeployTrigger=commit`, rama correcta; no obstante, la integración de eventos GitHub–Render no está operativa/verificada. No disparar deploy manual como sustituto de la prueba solicitada.
- Para resolverlo se requiere revisar/reconectar la integración GitHub en Render Dashboard → servicio → Settings → Repository y luego repetir un push de prueba. Esta acción de conexión no está disponible en las herramientas actuales.
- El commit `8b0aeda...` solo actualiza documentación; no contiene cambios funcionales de la app ni modifica el contenido de Unidad 2.


### Nueva propuesta visual de artículos — 26-11-2026
- El usuario solicita que las tablas de artículos definidos e indefinidos tengan exactamente tres columnas: **Singular** (formas masculina y femenina identificadas entre paréntesis), **Plural** y **Sustantivo / regla de uso**.
- Cada tabla debe presentar las formas en filas separadas por género cuando facilite la lectura móvil; la tercera columna resume los contextos de uso (por ejemplo, consonante ordinaria, vocal o grupos consonánticos específicos). No repetir una explicación extensa fuera de la tabla.
- Para el subtema de países, recuperar el ejemplo/formato anterior que el usuario aprobó, evitando la muestra que rechazó. La propuesta se presenta primero en conversación; todavía no se implementa contenido ni código.
- Preparar nuevas propuestas visuales mobile-first y esperar aprobación antes de implementar.


### Aclaración de alcance de la propuesta visual — 26-11-2026
- El usuario aprueba la propuesta A para las tablas de artículos definidos e indefinidos (tres columnas: Singular, Plural, Sustantivo/regla).
- Países e idiomas queda aprobado sin cambios; la objeción sobre el ejemplo correspondía al subtema **Artículos y adjetivos**, no a Países e idiomas.
- Preparar y mostrar una nueva propuesta visual de Artículos y adjetivos retomando el ejemplo anterior que el usuario prefería. No implementar código ni contenido hasta que esta propuesta quede aprobada.


### Criterio visual y contenido de Unidad 2 — aclaración del usuario — 26-11-2026
- La estética de cada subtema conserva la base ya implementada: fondo claro, tamaños tipográficos existentes, palabras extranjeras destacadas y controles TTS individuales.
- Las capturas de referencia indican únicamente la disposición y estructura de las tablas; no son una instrucción para copiar el fondo oscuro ni el estilo tipográfico de la captura.
- Países e idiomas: tres columnas País / Gentilicio / Idioma; conservar nombre italiano con traducción española entre paréntesis, y TTS para las formas italianas.
- Artículos definidos e indefinidos: tablas separadas de tres columnas Singular / Plural / Sustantivo-regla; género identificado entre paréntesis en Singular. Reglas breves antes de las tablas.
- Artículos y adjetivos: mantener la base visual de teoría y destacar las formas italianas con TTS; la tabla debe exponer claramente singular y plural con las variantes de género.
- El ajuste visual no autoriza cambiar el tema global ni el diseño de los demás subtemas.

- Ajuste de implementación: las etiquetas de género y el guion de plural de indefinidos no se envían a TTS; solo las formas italianas conservan lectura individual.

- 26-11-2026: el usuario confirmó que el preview continúa igual. La versión desplegada sigue desactualizada porque el auto-deploy GitHub–Render no ha funcionado. Render devuelve un único workspace disponible (`My Workspace`, `tea-dbus0u5g1s2s73coteeg`); antes de consultar/modificar deploys se requiere confirmación explícita del usuario para operar en ese workspace. No se disparó deploy manual ni se afirmó que los cambios estén visibles.

- 26-11-2026: usuario autorizó operar en `My Workspace`. Se identificó el servicio correcto `adaptive-language-tutor-preview-5b3d` (rama `feature/mobile-bottom-navigation`) y se inició deploy manual `dep-dc40tbec6qcc73c63qo0` del commit `2932e1b5f783540fb0fe368c77fdefedc55b7510`; estado al último chequeo: `build_in_progress`. Aún no confirmado como live ni verificado en navegador; no afirmar que el preview ya cambió.


### Ajustes posteriores al checkpoint visual — 26-11-2026
- Usuario confirmó el despliegue anterior como correcto y validó el checkpoint visual de esa versión.
- Solicita: eliminar nota final de Países e idiomas; en Artículos y concordancia quitar la lista introductoria y conservar solo la frase general de concordancia; aclarar la regla de lo/uno sin puntos suspensivos ambiguos; uniformar tamaño de párrafos/listas en todos los subtemas; distribuir las columnas según contenido, con columna central de artículos más estrecha que la columna final.
- Implementación registrada en commits `5cb188b`, `0934272`, `ba5fec3`, `cbdf4d4`, `bb706a3`, `83a0539`. Cambios funcionales y E2E actualizados. Validación automatizada y nuevo despliegue de esta revisión aún pendientes; no confundir con el checkpoint validado anterior.

- Deploy de esta revisión: `dep-dc416g7f3r2c73a044u0`, commit `828034a732b0770b9eb8c63718d15e335083f67a`; iniciado en Render tras los cambios y confirmado aún `build_in_progress` en la última consulta. No declarado live. E2E/npm check no ejecutados y preview aún no inspeccionado.


### Checkpoint confirmado y propuesta visual pendiente — 26-11-2026
- El usuario confirmó como correcto el despliegue y validó el checkpoint de la revisión anterior.
- Siguiente cambio solicitado para «Artículos y adjetivos»: conservar el primer punto introductorio como párrafo normal; transformar los dos puntos restantes en un esquema visual de reglas (presentar propuesta en chat y esperar aprobación antes de editar código).
- La propuesta visual debe expresar: (a) adjetivos terminados en -o: femenino -a; plural -i masculino y -e femenino; (b) adjetivos terminados en -e: misma forma en singular masculino/femenino y plural -i.
- Ejemplos: reemplazar los párrafos alternados actuales por el formato de ejemplos aplicado en otros subtemas, basado en tabla «Pronombre | Ejemplo aplicado», con frase italiana destacada + TTS y traducción española debajo. Mostrar esquema en chat y esperar aprobación antes de implementar.
- No se modificó código en esta etapa. Mantener intactos fondo claro, tipografía común, resaltado de italiano y TTS.


### Segunda propuesta visual de Artículos y adjetivos — 26-11-2026
- El usuario rechaza la propuesta anterior y solicita una nueva distribución antes de implementar.
- Reglas: tabla compacta con columnas **Terminación | Femenino | Plural**. Para `-o`, mostrar femenino `-a` y plural `-i` masculino / `-e` femenino. Para `-e`, dejar la columna Femenino sin transformación (celda vacía o raya) y mostrar plural `-i` para ambos géneros.
- Ejemplos: sustituir la columna/categoría «Pronombre» por **Terminación**. Relacionar `-o` con `Un ragazzo italiano`, `-a` con `Una ragazza italiana` y `-e → -i` con `Due ragazze interessanti`; conservar traducción española y TTS individual.
- Esta es una propuesta visual en conversación, no una aprobación ni una implementación. Mantener intactos código y contenido hasta confirmación explícita del usuario.


### Implementación aprobada: formato compacto de adjetivos y criterio reutilizable — 26-11-2026
- El usuario aprueba la segunda propuesta visual de «Artículos y adjetivos» y solicita aplicarla.
- Se conserva el primer punto como párrafo introductorio; las dos reglas se presentan en una tabla sencilla **Terminación | Femenino | Plural**: `-o | -a | -i (masculino) / -e (femenino)` y `-e | — | -i (masculino y femenino)`.
- Los ejemplos se muestran en una tabla **Terminación | Ejemplo aplicado**, con `-o`, `-a` y `-e → -i`; cada frase italiana mantiene TTS individual y traducción española.
- Criterio visual reutilizable para los siguientes subtemas/tablas/ejemplos: priorizar tablas sencillas frente a párrafos o listas extensas; definir columnas según los elementos más relevantes y su peso informativo; usar encabezados breves, distribución proporcional al contenido y ejemplos agrupados por categoría/terminación (no por pronombres cuando no corresponda). Mantener introducciones breves solo cuando aporten contexto.
- Mantener el estilo base existente: fondo claro, tipografía actual, términos italianos destacados y controles TTS individuales. No extender automáticamente este cambio a subtemas ya aprobados sin una solicitud de revisión.
- Se actualizó la cobertura Browser E2E para comprobar encabezados, reglas, terminaciones, traducciones y tres controles TTS. Validación y publicación quedan sujetas al resultado real de CI/Render.


### Corrección de aserción E2E preexistente — 26-11-2026
- La primera ejecución Browser E2E tras el nuevo formato falló antes de llegar a «Artículos y adjetivos»: la aserción de Países e idiomas buscaba l’Italia, aunque la tabla vigente y aprobada muestra Italia (Italia) sin artículo.
- Se corrigió únicamente el término esperado por la prueba a (Italia); se conserva además la comprobación de italiano. No se cambió contenido de la lección.
- Reejecutar Browser E2E sobre el HEAD actualizado. El fallo inicial no se atribuye al cambio de adjetivos; no desplegar hasta que E2E apruebe.


### Ajuste de E2E: pronunciación individual en Países e idiomas — 26-11-2026
- La segunda ejecución Browser E2E avanzó más allá de la primera aserción, pero detectó que el país italiano se valida como botón independiente. El comportamiento implementado enlaza el propio término `.theory-target-word` como control pulsable y retira el botón adyacente para evitar duplicarlo.
- Se actualizó la prueba para comprobar que el término italiano sea individualmente pulsable (`.theory-target-tap[role=button]`), manteniendo la exigencia de TTS en gentilicio e idioma. No se modificó el código funcional de países ni la propuesta de adjetivos.
- Repetir Tests y Browser E2E; despliegue pendiente hasta aprobación de ambos.


### Alineación E2E de TTS en gentilicios e idiomas — 26-11-2026
- Browser E2E detectó otra expectativa antigua: las celdas de gentilicio/idioma comprueban botones TTS separados, pero el enlazado de teoría transforma cada término breve en control pulsable y elimina el botón adyacente para evitar duplicación.
- Se actualizó la prueba para verificar los controles individuales `.theory-target-tap[role=button]` en ambos campos. No se alteró el contenido ni la funcionalidad de audio.
- Repetir E2E sobre el HEAD actualizado; despliegue sigue bloqueado hasta su aprobación.


### Alineación adicional de E2E para Artículos y concordancia — 26-11-2026
- Browser E2E del commit `747be438` llegó a la revisión de Unidad 2 y falló porque la prueba aún esperaba ejemplos antiguos (`gli studenti`, `un’amica`) que no forman parte del formato de reglas aprobado.
- Se actualizaron las expectativas para comprobar las formas y reglas presentes en las tablas actuales (`lo`, `gli`, grupos consonánticos y `un’` femenino), sin modificar el contenido ni el código funcional de la lección.
- Commit de ajuste E2E: `89014ec9224d1efdfa34c5bd61e89e670467e727`. Repetir CI y Browser E2E; no desplegar hasta que ambos aprueben.


### Validación automatizada del formato de adjetivos — 26-11-2026
- Se ajustó Browser E2E para normalizar los espacios que el navegador representa como tabulaciones/saltos de línea en las celdas de tablas y para validar por separado la forma italiana y la etiqueta de género.
- La pronunciación de los tres ejemplos de «Artículos y adjetivos» se valida mediante los términos italianos pulsables `.theory-target-tap[role=button]`, que es el control real generado por `bindTheoryTargetText`; no se exige un botón TTS adyacente duplicado.
- Código funcional de las lecciones sin cambios en esta corrección; se modificaron únicamente aserciones E2E.
- Commit de pruebas validado: `d5fad1e451802c9d0913c601b4cea7b45ab96a17`.
- Tests aprobados: [45822259293](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45822259293). Browser E2E aprobado: [45822259276](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45822259276).
- Render Preview continúa LIVE en el commit documental anterior `828034a732b0770b9eb8c63718d15e335083f67a`; no se generó un deploy tras los pushes validados. La configuración reporta `autoDeploy=yes`, `autoDeployTrigger=commit`, pero el webhook GitHub–Render sigue sin disparar. No declarar el preview actualizado ni solicitar prueba humana hasta que Render sirva el commit validado y se compruebe la versión publicada.
- Pendiente operativo: reconectar el repositorio mediante GitHub Integration en Render Dashboard → servicio → Settings → Repository, o resolver la integración de eventos. Después verificar un deploy con el HEAD validado y revisar el preview móvil.


### Preview Render actualizado para prueba humana — 26-11-2026
- Tras verificar que Tests y Browser E2E aprobaron en el commit `213164e852da005275d95012d11a3584dfa63d71`, se solicitó el despliegue manual porque el auto-deploy no había actualizado el servicio pese a tener autoDeploy habilitado.
- Render confirmó el deploy `dep-dc42l05g1s2s73d516g0` como `live`; el build terminó correctamente, la aplicación inició con `npm start` y Render registró «Your service is live».
- Commit servido: `213164e852da005275d95012d11a3584dfa63d71`. Preview: https://adaptive-language-tutor-preview-5b3d.onrender.com
- La versión ya está disponible para prueba humana. Si el navegador mantiene recursos antiguos, recargar la página sin caché antes de evaluar.
- Se mantiene pendiente investigar por qué los eventos de auto-deploy no actualizaron el servicio automáticamente; el despliegue manual resolvió esta publicación.


### Checkpoint confirmado y revisión de adjetivos — 26-11-2026
- El usuario confirmó el checkpoint anterior de Unidad 2; se conserva como base aprobada antes de continuar.
- En «Artículos y adjetivos» se añade, antes de los ejemplos, una tabla sencilla de vocabulario con seis adjetivos frecuentes (bello, buono, grande, nuovo, piccolo, interessante), traducción española y pronunciación individual.
- Las tres tablas del subtema (regla, vocabulario y ejemplos) comparten ancho exterior y tamaño tipográfico uniforme; sus columnas internas mantienen proporciones adaptadas al contenido.
- Browser E2E verifica el vocabulario, sus seis controles TTS y la uniformidad de dimensiones/tipografía.
- Commits de implementación y pruebas: `5d0a1d0`, `79ca84f`, `49a05f6`; HEAD actual `49a05f632ca3847567cb2d18b949b5d5a62141ca`.
- Estado de esta revisión: pendiente de Tests, Browser E2E y publicación/verificación Render. El checkpoint anterior sigue confirmado; esta ampliación no se considera validada hasta completar las pruebas.


### Diagnóstico y correcciones de Browser E2E — adjetivos — 26-11-2026
- Tests generales aprobaron en HEAD `fbdbdd5` (run [45826167381](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826167381)).
- Primera E2E detectó que el verificador esperaba la tabla de ejemplos en la segunda posición; con el nuevo vocabulario intermedio, los encabezados correctos ahora se comprueban como regla → vocabulario → ejemplos.
- Segunda E2E detectó que la normalización de espacios de la aserción nueva estaba escapada incorrectamente y Playwright devolvía tabulaciones entre celdas. Se corrigió para normalizar cualquier espacio en blanco antes de comparar las seis filas.
- No se modificó contenido funcional en estas dos correcciones; ambas afectan solo al test Browser E2E. Commit de normalización: `d490b8f72ea452e1e020beb140ceb5c4740c9333`.
- Nueva ejecución Tests y Browser E2E pendiente sobre el HEAD actualizado. Render sigue sirviendo el commit previo `e781482`; no desplegar hasta que E2E apruebe.


### Validación automatizada de adjetivos — 26-11-2026
- Se corrigió el ancho exterior de la tabla de ejemplos para igualarlo con las tablas de reglas y vocabulario, retirando el padding interior del contenedor de ejemplos en este subtema.
- Se reforzó la cascada CSS para mantener 13px en todas las celdas de cuerpo de las tres tablas, sin heredar el tamaño de las tablas bilingües generales.
- Tests CI aprobados: [45826567300](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826567300). Browser E2E aprobado: [45826567302](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826567302), HEAD validado `990430b17264f20fb60ba633d1b64746f8a56339`.
- Render aún no publica la revisión: último deploy LIVE observado `e781482dba287f8ac812bd6aff1abacee5b95988`. Se debe actualizar y verificar Preview antes de solicitar prueba humana.


### Render Preview LIVE — ajuste de adjetivos — 26-11-2026
- Deploy `dep-dc430l3l550s7381s230` LIVE con build exitoso y aplicación iniciada mediante `npm start`; commit servido `89aa6ccd2380f8a1000d89876be791fd591e2ad4`.
- Tests aprobados: [45826853426](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826853426). Browser E2E aprobado: [45826852955](https://github.com/asotomayorb/adaptive-language-tutor/actions/runs/45826852955).
- Preview listo para prueba humana: https://adaptive-language-tutor-preview-5b3d.onrender.com. Validación manual pendiente: comprobar visualmente las tres tablas y probar TTS de los seis adjetivos en Android.


### Corrección de cortes de palabras y legibilidad de tablas — 26-11-2026
- Se elimina el ajuste CSS que podía partir palabras en cualquier punto dentro de las tablas de adjetivos. Las explicaciones y celdas de tablas de Teoría ahora permiten saltos solo entre palabras; se desactivan la partición arbitraria y la separación silábica automática.
- Las tablas de regla, vocabulario y ejemplos conservan el mismo ancho exterior y tipografía de cuerpo uniforme, aumentada de 13px a 17px en escritorio y 15px en móvil. Los encabezados mantienen jerarquía propia (13px escritorio / 12px móvil).
- Se amplía la primera columna de la tabla de reglas para acomodar términos completos sin cortes ni desbordamiento.
- Browser E2E actualizado para comprobar tamaño uniforme, estilos de ajuste de línea y ausencia de división de palabras. La validación automatizada y la publicación Render quedan pendientes; no solicitar prueba humana hasta completarlas.
- Commits: CSS `8cf9645`; E2E `0775396`.

- Corrección de cascada posterior: el selector de alta especificidad que aún fijaba 13px fue actualizado para respetar 17px en escritorio y 15px en móvil, incluidos los términos italianos destacados. Commit CSS final: `c3f704d`.
- Estado de validación: pendiente de ejecución automatizada en GitHub Actions y de publicación/verificación en Render. La prueba humana queda pendiente hasta confirmar ambos.


### Confirmación de cuenta Render — 26-11-2026
- El usuario confirmó reutilizar la cuenta Render previamente utilizada para el preview `adaptive-language-tutor-preview-5b3d.onrender.com` (cuenta conectada «Render»).
- Render solicita seleccionar explícitamente el workspace antes de consultar o modificar servicios. La cuenta muestra un único workspace disponible: `My Workspace` (`tea-dbus0u5g1s2s73coteeg`). Se solicita confirmación del usuario antes de operar sobre ese workspace.
- No se disparó ningún deploy en esta etapa.


### Despliegue del ajuste de legibilidad — 26-11-2026
- El usuario confirmó el uso del workspace Render `My Workspace` para actualizar el preview existente.
- Se identificó el servicio `adaptive-language-tutor-preview-5b3d`, asociado a la rama `feature/mobile-bottom-navigation` y al repositorio correcto.
- Se inició el deploy manual `dep-dc446sm1egvs73f9mrs0`, que toma el HEAD de la rama en el commit `b27534a3dfa7d5741a19cd0064aa57089c18ed29` (incluye el CSS de legibilidad y la cobertura E2E añadida en los commits anteriores).
- Último estado consultado: `update_in_progress`; todavía no hay confirmación LIVE ni verificación visual de la página publicada. No solicitar prueba humana ni declarar el preview listo hasta comprobarlo.
- GitHub no reporta status checks ni workflow runs asociados directamente al commit CSS `c3f704d8914c7dec69e1193e4b966936da9f953c`; la validación automatizada de esta revisión sigue sin confirmación.
- El preview anterior permanece en el último deploy LIVE `dep-dc430l3l550s7381s230` mientras el nuevo deploy no finalice.
