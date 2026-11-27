# Plan de prueba humana — Adaptive Language Tutor

**Alcance vigente — 27-11-2026:** aplicación español (`es-CL`) → italiano (`it-IT`). La UI activa contiene Teoría y Estadísticas. Unidades 1–3 tienen contenido desarrollado; Unidades 4–6 conservan títulos y jerarquía, con cuerpos vacíos. Ruta, Entrenamiento y tutor IA permanecen en espera, sin formar parte de la aceptación visual actual.

## 1. Preparación

1. Usar la rama `feature/mobile-bottom-navigation`.
2. Confirmar que Render Preview está LIVE y corresponde al último commit funcional.
3. Ejecutar `npm run check`, `npm test` y `npm run test:e2e` en CI.
4. Abrir [Render Preview](https://adaptive-language-tutor-preview-5b3d.onrender.com/) en Android y escritorio.

## 2. Idioma y navegación

- [ ] El selector ofrece únicamente Italiano.
- [ ] La bandera visible es 🇮🇹 y el alcance se identifica como Español → Italiano.
- [ ] No aparecen selectores de idioma personalizado ni catálogos de otras lenguas.
- [ ] La navegación inferior mantiene las secciones y estados establecidos en PRODUCT_SPEC.md.
- [ ] Al cambiar de pantalla o volver desde un detalle, se conserva la navegación prevista y se detiene el audio anterior.

## 3. Teoría — Unidades 1 a 3

- [ ] Unidades 1 y 2 conservan sus ocho subtemas y contenido aprobado sin regresiones.
- [ ] Unidad 3 presenta sus nueve subtemas desarrollados: Familia, Profesiones, Rutinas y lugares, Días y fechas, Presente habitual, Pasado (passato prossimo), Futuro simple, Rutinas diarias y La hora.
- [ ] Todos los subtemas desarrollados usan la misma estructura: introducción breve, bloques de referencia agrupados y ejemplos aplicados cuando corresponda.
- [ ] Las tablas mantienen tamaño de texto de 15 px en móvil y 17 px en escritorio.
- [ ] Las columnas se adaptan al contenido; el texto salta entre palabras, no se parte arbitrariamente y no provoca scroll horizontal de página.
- [ ] Los encabezados, columnas, traducciones y ejemplos mantienen la jerarquía definida en PRODUCT_SPEC.md.
- [ ] Todo fragmento italiano es pronunciable al tocar el propio texto y utiliza locale `it-IT`; no aparecen botones Play ni iconos de altavoz en Teoría. En prosa y títulos las expresiones italianas están en negrita y cursiva sin comillas angulares; en tablas, en negrita sin cursiva.
- [ ] En formas separadas por /, guion o raya, cada variante se pronuncia por separado y se ve un solo separador «/» (nunca «//»); guiones y rayas originales se conservan.
- [ ] La traducción española aparece en su columna/contexto de explicación y nunca se reproduce con voz italiana.
- [ ] En Países e idiomas, la traducción española entre paréntesis aparece solo junto al país; gentilicio e idioma no repiten traducciones.
- [ ] La navegación Anterior/Siguiente y el retorno mantienen el subtema y la unidad correctos. Al llegar al final de un tema, queda un margen visible suficiente antes de los botones; el último texto no queda cubierto por ellos.

## 4. Teoría — Unidades 4 a 6

- [ ] Se mantienen los títulos y subtemas previstos.
- [ ] Al abrir cualquier subtema, se muestra su título, categoría y ruta de navegación.
- [ ] El cuerpo permanece completamente vacío: sin párrafos, tablas, ejemplos, texto de relleno ni datos residuales.
- [ ] La navegación Anterior/Siguiente no introduce contenido no desarrollado.
- [ ] Ningún cambio de estilo o navegación modifica las Unidades 1–3.

## 5. Estadísticas y persistencia

- [ ] Sin sesiones italianas, se muestra un estado vacío real, sin datos ficticios.
- [ ] Las estadísticas visibles corresponden únicamente a Italiano.
- [ ] Los registros históricos de idiomas retirados no se muestran como idiomas disponibles ni contaminan las métricas actuales.
- [ ] Recargar la página conserva la selección, el audio y los datos italianos guardados.
- [ ] Los registros antiguos no italianos se mantienen en almacenamiento local sin mostrarse; no se borran automáticamente durante esta limpieza.

## 6. Validación técnica y módulos en espera

- [ ] `/api/health` responde correctamente.
- [ ] `/.env`, `/package.json`, `/server/provider.js` y `/tests/api.test.js` no son accesibles desde el servidor estático.
- [ ] Se mantienen las cabeceras de seguridad definidas en el backend.
- [ ] Si se modifica o reactiva Ruta, Entrenamiento o tutor IA, comprobar que el origen sea español y el destino italiano; estas pruebas no son criterio de aceptación de la UI activa mientras sigan bloqueados.

## 7. Registro de resultados

| Campo | Resultado |
|---|---|
| Commit probado | |
| Deploy LIVE de Render | |
| Dispositivo y navegador | |
| Escenario | |
| Resultado (aprobado / fallido) | |
| Pasos para reproducir | |
| Captura o log sin datos personales | |
| Severidad | |

**Criterio de salida:** no declarar aceptada una versión si falla una prueba de navegación, contenido, persistencia o pronunciación de las Unidades 1–3, o si aparece contenido dentro de Unidades 4–6.
