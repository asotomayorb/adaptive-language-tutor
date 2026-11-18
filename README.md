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

La aplicación tiene exactamente **cuatro secciones principales**:

1. **Ruta** — recorrido de aprendizaje guiado, con estructura de historia/progresión por etapas. Es la pantalla inicial. Nombre visible recomendado: “Ruta”; puede describirse internamente como “modo historia”. No crear una sección adicional llamada Inicio.
2. **Ejercicios** — práctica independiente con dos modalidades: **Global** y **Repaso**.
3. **Teoría** — explicaciones y material de consulta organizados por idioma, nivel y tema; debe poder consultarse sin iniciar una sesión.
4. **Estadísticas** — historial y métricas del aprendizaje.

Reglas de navegación:
- Barra inferior fija, optimizada para móvil, con **solo iconos**: sin texto visible bajo los iconos.
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

- Idiomas locales iniciales: portugués brasileño (`pt-BR`) e inglés (`en`).
- Permitir idioma personalizado mediante nombre y locale válido (por ejemplo, francés `fr-FR`) con tutor IA cuando exista proveedor compatible.
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

