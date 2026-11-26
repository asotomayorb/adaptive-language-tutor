# Adaptive Language Tutor

Aplicación móvil-first para aprender idiomas mediante contenido progresivo, práctica, teoría contextual y seguimiento del aprendizaje.

> **Especificación vigente del producto.** Este documento consolida las decisiones actuales y reemplaza las notas históricas contradictorias. Antes de modificar código, leer este README y `PROJECT_STATUS.md`. Si una nueva instrucción cambia una regla, actualizar aquí la regla vigente y registrar el cambio en la bitácora. No reintroducir comportamientos antiguos que contradigan esta especificación.

## 1. Estado y entorno de trabajo

- Repositorio: [asotomayorb/adaptive-language-tutor](https://github.com/asotomayorb/adaptive-language-tutor).
- Rama activa: `feature/mobile-bottom-navigation`.
- Repositorio GitHub: https://github.com/asotomayorb/adaptive-language-tutor
- Rama de trabajo: `feature/mobile-bottom-navigation` — https://github.com/asotomayorb/adaptive-language-tutor/tree/feature/mobile-bottom-navigation
- README vigente: https://github.com/asotomayorb/adaptive-language-tutor/blob/feature/mobile-bottom-navigation/README.md
- Archivos principales: [app](https://github.com/asotomayorb/adaptive-language-tutor/blob/feature/mobile-bottom-navigation/src/app.js), [estilos](https://github.com/asotomayorb/adaptive-language-tutor/blob/feature/mobile-bottom-navigation/src/styles.css), [backend](https://github.com/asotomayorb/adaptive-language-tutor/blob/feature/mobile-bottom-navigation/server/index.js), [pruebas](https://github.com/asotomayorb/adaptive-language-tutor/tree/feature/mobile-bottom-navigation/tests).
- Rama de checkpoints: [recovery/intermediate-theory-content](https://github.com/asotomayorb/adaptive-language-tutor/tree/recovery/intermediate-theory-content). Debe conservarse como espacio para guardar checkpoints; no es la rama activa de desarrollo ni fuente de despliegue.
- Preview Render: https://adaptive-language-tutor-preview-5b3d.onrender.com/
- Servicio Render: `adaptive-language-tutor-preview-5b3d` (ID `srv-dbus3hnf3r2c739j9ir0`). En el Dashboard: workspace **My Workspace** → servicio **adaptive-language-tutor-preview-5b3d**. El enlace anterior es la aplicación publicada; el Dashboard es el lugar para revisar deploys, estado y configuración.
- Render se utiliza para el preview; el estado LIVE debe verificarse antes de afirmar que una revisión está publicada.
- El proyecto original de Replit permanece intacto. No modificarlo ni sincronizarlo sin autorización expresa.
- La rama `recovery/intermediate-theory-content` se conserva expresamente para guardar checkpoints. No eliminarla ni usarla como rama activa de desarrollo o fuente directa de Render. Al recuperar cambios, revisar diff y pruebas.
- El estado técnico comprobado, los commits y las pruebas se registran en [PROJECT_STATUS.md](PROJECT_STATUS.md). Las comprobaciones manuales pendientes se registran en [HUMAN_TEST_PLAN.md](HUMAN_TEST_PLAN.md).
- La aprobación visual/funcional del usuario para Unidades 1 y 2 de Teoría es el checkpoint de producto actual. No implica que los demás módulos estén terminados ni que las validaciones de cada cambio futuro estén aprobadas.

## 2. Alcance vigente de la aplicación

La interfaz de trabajo actual prioriza Teoría y Estadísticas. Ruta y Entrenamiento conservan sus implementaciones en el repositorio, pero están temporalmente bloqueados desde la navegación.

La app abre directamente en Teoría; no hay pantalla de bienvenida ni sección de Configuración.

### Navegación inferior

La barra fija contiene cinco posiciones, en este orden:

1. Ruta — icono de mapa; bloqueada temporalmente.
2. Entrenamiento — icono de pesas; bloqueada temporalmente.
3. Idiomas — selector central elevado y destacado, con globo y bandera del idioma activo.
4. Teoría — disponible.
5. Estadísticas — disponible.

Reglas:
- La barra ocupa una sola fila en móvil. Los accesos de sección usan solo iconos, sin etiquetas debajo.
- El selector central de idioma es visualmente mayor y destacado; no cuenta como una sección de contenido.
- No mostrar la barra inferior en actividades a pantalla completa.
- Ruta y Entrenamiento no deben abrirse desde la interfaz mientras estén bloqueados; no borrar sus módulos internos.
- El selector de idioma abre un diálogo/mosaico. En el alcance actual solo Italiano está disponible. Al confirmar o cancelar, regresar a la sección disponible actual.
- No añadir una sección Configuración.

### Cabecera y controles globales

- Los títulos de sección se mantienen centrados, salvo las jerarquías y rótulos internos definidos para Teoría.
- En pantallas principales se conserva el control global de audio. El estado apagado debe distinguirse claramente del activo.
- En el detalle de Teoría, la cabecera interna reúne retorno, título «Teoría» y audio; no duplicar una cabecera global.
- Los controles icon-only requieren nombre accesible, foco visible y área táctil suficiente.
- No mostrar estados internos de IA, mensajes de relleno ni subtítulos redundantes.

## 3. Idioma y audio

- Idioma activo: italiano, locale `it-IT`.
- El selector actual ofrece Italiano como única opción habilitada. No habilitar idiomas adicionales ni cambiar el catálogo sin una solicitud explícita.
- Mantener el locale objetivo consistente en contenido, controles TTS y actividad.
- En Teoría, la lectura automática está desactivada. El usuario activa la pronunciación manual del fragmento italiano.
- Palabras y frases italianas breves se pueden pronunciar tocando directamente el texto subrayado; no llevan icono Play. Los fragmentos largos pueden usar un control Play individual. Cada control reproduce únicamente su fragmento y usa `it-IT`.
- No reproducir traducciones españolas como si fueran italiano ni sustituir la voz objetivo por una voz española.
- Al retroceder o cambiar de sección, detener audio y cancelar reproducciones pendientes.
- En otros módulos, cada fragmento de audio debe declarar su locale explícitamente. Las consignas auxiliares en español usan `es-CL`; el contenido objetivo usa el locale del idioma elegido.
- Si no hay una voz compatible, no asignar la voz de otro idioma. En Android/Chrome, gestionar la carga de voces y validar el sonido real en dispositivo; una llamada TTS sin error no demuestra que se haya oído.

## 4. Teoría: jerarquía y navegación

Teoría es una sección independiente de consulta. Abrirla no inicia ejercicios ni una sesión IA.

### Jerarquía de contenido

La navegación vigente es:

**Etapa → Unidad → Subtema → Contenido del subtema**

- Gramática, Vocabulario y Expresiones son categorías de subtemas, no niveles de navegación.
- A1 se titula «Principiante». La jerarquía conserva seis unidades, en este orden:
  1. Primeros contactos
  2. Datos personales y entorno
  3. Rutinas y tiempo
  4. Comida y compras
  5. Viajes y orientación
  6. Números y cantidades
- En la lista, las unidades se numeran con números arábigos. Los subtemas no se numeran.
- Los subtemas se agrupan bajo su unidad y llevan un icono de categoría: Gramática, Vocabulario o Expresiones.
- Solo una unidad puede estar expandida a la vez. Al abrir otra, la anterior se colapsa. Tocar la unidad abierta la colapsa.
- La lista conserva las ramas abiertas, sin tarjetas altas ni conectores duplicados. Las unidades tienen un acento azul y una línea/borde lateral; los subtemas mantienen sangría e icono de categoría.
- El encabezado de Teoría permanece fijo al desplazarse por la lista. La etapa y las unidades se desplazan normalmente.
- Los títulos de etapa, unidad y subtema mantienen una jerarquía tipográfica consistente; las filas son compactas, legibles y con área táctil adecuada.

### Detalle de subtema

- La cabecera interna contiene retorno a la izquierda, «Teoría» centrado y audio a la derecha.
- Debajo se presenta la ruta breve Etapa > Unidad, seguida de categoría e icono, y luego el título del subtema con su contador de posición alineado a la derecha cuando corresponda.
- El bloque superior del detalle permanece fijo durante el desplazamiento; el contenido se desplaza debajo y no debe quedar oculto.
- La flecha de retorno es el único control de regreso del detalle. Devuelve al árbol y conserva expandida la unidad de origen.
- La navegación Anterior/Siguiente permanece disponible al final del contenido, con área táctil suficiente.
- El detalle no debe mostrar encabezados o controles de audio duplicados.

## 5. Teoría: reglas editoriales, contenido y presentación

### Criterios comunes

- El contenido debe ser real, correcto y pertinente al idioma objetivo. No mostrar textos genéricos como si fueran material desarrollado.
- Cada subtema tiene una introducción breve solo cuando aporta contexto. Evitar redundancias, duplicación de reglas y párrafos extensos que puedan convertirse en una tabla o lista más clara.
- Explicar las reglas antes de la tabla correspondiente, nunca dentro de las celdas. Los ejemplos trabajados aparecen después de las reglas.
- Una regla por línea o elemento. Usar listas, subtítulos, tablas breves y sangría para expresar relaciones; una subregla se anida bajo su regla principal. Las excepciones forman un bloque separado y explican el caso, no son ejemplos sueltos.
- Mantener separado el contenido de tiempos verbales distintos. Una excepción del pasado no se coloca en el futuro, aunque el mismo verbo sea irregular en ambos.
- Los ejemplos corresponden al idioma activo y llevan traducción española cuando sea útil.
- En títulos de subtemas, los términos italianos se muestran en cursiva, entre comillas angulares y con traducción española entre paréntesis cuando corresponda. Los encabezados de tablas no heredan ese formato.
- No modificar contenido ya aprobado por una tarea de estilo que no lo incluya expresamente.

### Tablas y ejemplos

- Las tablas deben ser sencillas, de ancho exterior coherente dentro del subtema, y con columnas proporcionadas al contenido. No imponer anchos idénticos si perjudican la lectura.
- El cuerpo de texto de las tablas debe mantener el tamaño uniforme establecido para Teoría: 17 px en escritorio y 15 px en móvil. Los encabezados conservan jerarquía propia.
- No dividir palabras en puntos arbitrarios ni usar separación silábica automática. El texto debe saltar entre palabras; evitar desbordamiento y desplazamiento horizontal de la página.
- Las tablas pueden desplazarse dentro de su propio contenedor solo cuando sea necesario y sin comprimir el texto hasta volverlo ilegible.
- Priorizar encabezados breves y columnas que reflejen las categorías relevantes. Usar tablas compactas frente a párrafos o listas extensas cuando la comparación sea más clara.
- Agrupar ejemplos por forma, terminación o categoría gramatical pertinente; no usar pronombres como eje si no representan la regla.
- Cada frase o variante italiana separada por «/», guion u otro separador debe tener pronunciación individual. Los controles no deben incluir etiquetas de género, traducciones ni puntuación auxiliar.
- Las capturas de referencia aportan estructura, no instrucciones para copiar fondos oscuros o tipografía ajena. Conservar la estética clara y tipografía base de la app.

### Subtemas desarrollados

Unidad 1 conserva cuatro subtemas desarrollados:
- Saludos y despedidas.
- Decir el nombre.
- Cómo estás.
- Pronombres y ser/estar.

Unidad 2 conserva cuatro subtemas desarrollados:
- Países e idiomas: tabla País / Gentilicio / Idioma. Mostrar el nombre italiano seguido de la traducción española entre paréntesis; pronunciar las formas italianas individualmente.
- Artículos y concordancia: reglas breves antes de tablas separadas para artículos definidos e indefinidos. Las tablas usan las columnas Singular / Plural / Sustantivo-regla; identificar el género en Singular. Explicar las formas de uso de manera clara y concisa.
- Artículos y adjetivos: conservar el párrafo introductorio breve, tabla de reglas Terminación / Femenino / Plural y tabla de ejemplos Terminación / Ejemplo aplicado. Para adjetivos en -o: femenino -a; plural -i masculino y -e femenino. Para adjetivos en -e: misma forma en singular masculino/femenino y plural -i. Las frases italianas llevan TTS individual y traducción española.
- Edad y procedencia: explicar el uso de `avere`, `essere di` y `venire da`, además del trato formal/informal cuando corresponda; evitar aclaraciones parentéticas redundantes en las traducciones.

Unidad 1 debe permanecer intacta durante cambios limitados a Unidad 2. Las Unidades 3–6 conservan sus títulos y jerarquía, pero su contenido desarrollado está pendiente; no inventar que ya está completo.

## 6. Estética general

- Mobile-first, limpia, clara y minimalista. Evitar desplazamiento horizontal de página.
- Fondo claro, tipografía común y tamaños legibles; no copiar el tema oscuro de capturas de referencia.
- El texto italiano se distingue visualmente del español y conserva sus controles TTS individuales.
- Los colores de jerarquía deben comunicar nivel/unidad/categoría sin crear tarjetas pesadas ni decoraciones innecesarias.
- Mantener espaciado suficiente entre unidades y subtemas sin huecos excesivos; no reducir áreas táctiles para compactar.
- Evitar textos cortados, palabras partidas, encabezados duplicados, controles repetidos y estilos contradictorios.
- En propuestas de interfaz solicitadas por el usuario, mostrar pantallas visuales con aspecto de app, no tablas comparativas ni diagramas ASCII. Representar cada sección/subsección afectada y sus estados relevantes; para alternativas A/B, mostrar la misma pantalla en cada variante. No introducir mockups si no fueron solicitados.

## 7. Estadísticas

- Estadísticas es la única sección disponible para métricas, historial y evolución.
- Mostrar únicamente datos reales guardados; sin sesiones, usar estado vacío y no datos ficticios.
- La tabla comparativa por idioma puede mostrar sesiones, palabras, precisión y progreso de Ruta cuando esos datos existan.
- Los gráficos deben priorizar el viewport móvil, usar el ancho disponible y evitar scroll horizontal de la página.
- No duplicar métricas en Teoría ni en pantallas de Ruta/Entrenamiento.

## 8. Requisitos conservados para Ruta y Entrenamiento

Estos módulos permanecen temporalmente inaccesibles desde la navegación. Las siguientes reglas documentan su comportamiento previsto/implementado en el repositorio para evitar regresiones al reactivarlos; antes de habilitarlos, revisar el código y el estado técnico real.

### Ruta
- Ruta es el recorrido principal, no una sección adicional llamada «Modo historia».
- La jerarquía de aprendizaje usa unidades secuenciales y contenido definido por idioma, nivel y objetivo comunicativo; no muestra selectores de Entrenamiento ni métricas.
- El diseño pedagógico vigente contempla unidades con vocabulario/reglas y aplicación contextual, y calificación por estrellas según respuestas puntuables. Los umbrales y el contenido deben coincidir con el código validado y no alterarse sin una decisión explícita.
- El progreso confirmado de Ruta se guarda por idioma/unidad y permite reanudar desde la última respuesta guardada.
- Reiniciar Ruta requiere confirmación y afecta solo el progreso de Ruta del idioma activo; no borrar historial de Entrenamiento, vocabulario ni estadísticas generales.
- El resumen debe mostrar una calificación visible y una salida funcional: iniciar la unidad siguiente si está desbloqueada, repetir la actual si corresponde o volver al mapa. No desbloquear si falta una actividad integradora requerida.
- «Reforzar» solo incluye palabras/frases incorrectas con pronunciación y traducción; si no hay elementos pendientes, omitir el bloque.

### Entrenamiento
- La sección conserva los modos Ejercicios, Comprensión lectora y Repaso, en ese orden, cuando se reactive.
- La configuración de Ejercicios se mantiene dentro de la sección; Repaso inicia directamente. Comprensión lectora es una sesión separada y sus preguntas dependen del pasaje.
- En sesiones a pantalla completa, ocultar navegación inferior y conservar únicamente los controles de sesión definidos para el flujo activo. Cerrar una sesión de Ejercicios incompleta requiere confirmación y descarta su estado temporal; no borrar historial anterior.
- Las actividades deben tener respuestas cerradas y evaluables. Si una pregunta admite varias respuestas, declarar y probar las variantes aceptadas.
- Feedback correcto/incorrecto inmediato; avance explícito mediante Continuar. No mostrar respuestas antes de que corresponda ni avanzar automáticamente sin la acción del usuario.
- Las ayudas se limitan a los tipos de actividad que las admiten; no mostrar controles de pista/respuesta en selección múltiple.
- Comprensión lectora reproduce el pasaje con controles propios y locale objetivo. Todas sus preguntas dependen del texto; no mezclar preguntas generales en esa sesión. No repetir preguntas dentro de una sesión; si se agota el banco, finalizar.
- Repaso procesa tarjetas pendientes del idioma activo, persiste cada respuesta y permite reanudar la cola restante. Las incorrectas siguen pendientes para una pasada posterior, sin bucle infinito en la misma sesión. No mezclar tarjetas de patrones con palabras/frases.
- Separar el estado temporal de sesión del progreso histórico guardado. Cancelar solicitudes obsoletas al cambiar de actividad; errores o demoras de IA no deben bloquear la navegación. La IA es respaldo; usar contenido local cuando exista y sea suficiente.

## 9. Privacidad de contenido y derechos

- El contenido didáctico debe ser original, de dominio público verificado o contar con licencia compatible con el uso previsto.
- Registrar fuente, autoría, licencia, atribución requerida y fecha de verificación cuando corresponda.
- No reutilizar material protegido solo porque esté accesible públicamente. Noticias futuras deben enlazar fuentes y resumir hechos con redacción original, sin reproducir artículos.

## 10. Arquitectura y comandos

- Frontend: `index.html`, `src/app.js`, `src/styles.css`.
- Backend/API: `server/index.js`; adaptadores IA: `server/provider.js`; prompts/esquemas: `server/prompts.js`.
- Cliente IA: `src/core/tutor-client.js`; pedagogía, contenido y progreso local: `src/core/`, `src/content/`.
- Pruebas: `tests/`. Runtime: Node.js 20.6 o superior.

Instalación y ejecución local:

```bash
npm ci
npm start
```

La app queda en `http://localhost:3000`. Desarrollo: `npm run dev`. Validación: `npm run check`, `npm test` y `npm run test:e2e`. Los smoke tests reales requieren variables privadas configuradas. Nunca subir claves API al repositorio.

## 11. Protocolo de implementación y validación

Antes de modificar código:
1. Leer este README y revisar la rama/HEAD real.
2. Revisar `PROJECT_STATUS.md`, las pruebas relacionadas y el alcance autorizado.
3. Identificar pantallas, contenido, persistencia y flujos afectados.
4. Si hay una decisión visual sin aprobar, presentar el esquema solicitado y esperar confirmación antes de implementar.
5. No afirmar que algo está implementado, probado o publicado sin evidencia.

Después de cada cambio:
1. Actualizar este README si cambió una regla, decisión o alcance.
2. Registrar en `PROJECT_STATUS.md` el cambio técnico, commit, pruebas y pendientes reales.
3. Actualizar `HUMAN_TEST_PLAN.md` si cambió una interacción o vista visible.
4. Ejecutar `npm run check`, `npm test` y Browser E2E cuando corresponda a la interfaz/navegación.
5. Confirmar que las pruebas corresponden al HEAD exacto; un build correcto no equivale a validación funcional.
6. Verificar el deploy LIVE de Render y su commit antes de afirmar que el preview está actualizado.
7. Solicitar prueba humana solo cuando la versión publicada corresponda al cambio validado; la prueba Android visual, táctil y auditiva no se sustituye por E2E.
8. Revisar que no reaparezcan Configuración, etiquetas bajo iconos, módulos bloqueados, encabezados duplicados, tablas ilegibles, cortes arbitrarios de palabras o audio con locale incorrecto.

## 12. Registro breve de decisiones vigentes

- **26-11-2026:** el usuario confirma que el aspecto y funcionamiento de Teoría en Unidades 1 y 2 es correcto. Se toma como checkpoint de producto antes de continuar con código.
- **26-11-2026:** el cuerpo de texto de las tablas de Teoría usa 17 px en escritorio y 15 px en móvil; encabezados con jerarquía propia y palabras sin cortes arbitrarios.
- **26-11-2026:** tablas y ejemplos deben tener columnas proporcionadas al contenido, encabezados breves, reglas antes de tablas y TTS individual por variante italiana.
- **25-11-2026:** se conserva A1 con seis unidades; Unidad 1 intacta y cuatro subtemas desarrollados en Unidad 2. Unidades 3–6 mantienen títulos, con contenido pendiente.
- **26-11-2026:** se confirma conservar `recovery/intermediate-theory-content` como rama destinada a guardar checkpoints; no eliminarla ni usarla para desarrollo cotidiano o despliegue. Rama activa: `feature/mobile-bottom-navigation`; Render canónico asociado a esta rama.
- **21-11-2026:** la app abre en Teoría; Ruta y Entrenamiento están temporalmente bloqueados; Italiano es la única opción de idioma habilitada.

### Historial resumido

- Se consolidaron las reglas de navegación, jerarquía de Teoría, estética, contenido, audio y validación que antes estaban repetidas en entradas cronológicas.
- Las decisiones históricas incompatibles se consideran reemplazadas por las reglas vigentes de este documento.
- Los detalles de commits, ejecuciones CI, deploys y diagnósticos de versiones anteriores se conservan en el historial de Git y en `PROJECT_STATUS.md`; no duplicarlos aquí salvo que sean necesarios para el estado actual.
