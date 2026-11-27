# Plan de prueba humana — Adaptive Language Tutor

**Alcance vigente — 26-11-2026:** aplicación español (`es-CL`) → italiano (`it-IT`). La UI activa contiene Teoría y Estadísticas. Unidades 1 y 2 tienen contenido desarrollado; Unidades 3–6 conservan títulos y jerarquía, con contenido vacío hasta su reconstrucción. Ruta, Entrenamiento y tutor IA permanecen en espera, sin formar parte de la aceptación visual actual.

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

## 3. Teoría — Unidades 1 y 2

- [ ] Unidad 1 conserva sus cuatro subtemas y contenido aprobado sin regresiones.
- [ ] Unidad 2 conserva sus cuatro subtemas: Países e idiomas, Artículos y concordancia, Artículos y adjetivos, Edad y procedencia.
- [ ] Las tablas mantienen tamaño de texto de 15 px en móvil y 17 px en escritorio.
- [ ] Las palabras no se cortan arbitrariamente; el texto salta entre palabras y no provoca scroll horizontal de página.
- [ ] Los encabezados, columnas, traducciones y ejemplos mantienen la jerarquía definida en PRODUCT_SPEC.md.
- [ ] Cada fragmento italiano tiene pronunciación individual en locale `it-IT`.
- [ ] En Países e idiomas no aparecen botones Play; tocar cada forma italiana reproduce solo esa forma.
- [ ] En formas separadas por /, guion o raya, cada variante se pronuncia por separado y el separador original sigue visible.
- [ ] La traducción española entre paréntesis aparece solo en la primera columna (País); Gentilicio e Idioma no repiten traducciones.
- [ ] Las tres columnas de Países e idiomas tienen el mismo ancho; las celdas de cada fila mantienen altura y alineación uniformes.

- [ ] El español se presenta como idioma de explicación y traducción, nunca se reproduce con voz italiana.

## 4. Teoría — Unidades 3 a 6

- [ ] Se mantienen los títulos y subtemas previstos de las seis unidades.
- [ ] Al abrir cualquier subtema de Unidades 3–6, se muestra su título, categoría y ruta de navegación.
- [ ] El cuerpo del subtema permanece completamente vacío: sin párrafos, tablas, ejemplos, texto de relleno ni datos residuales.
- [ ] La navegación Anterior/Siguiente funciona sin introducir contenido no desarrollado.
- [ ] Ningún cambio de estilo o navegación modifica el contenido de Unidades 1 y 2.

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

**Criterio de salida:** no declarar aceptada una versión si falla una prueba de navegación, contenido, persistencia o pronunciación de las Unidades 1 y 2, o si aparece contenido dentro de Unidades 3–6.
