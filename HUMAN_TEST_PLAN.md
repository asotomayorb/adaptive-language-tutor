# Plan de prueba humana — Adaptive Language Tutor

**Objetivo:** validar la experiencia completa antes de declarar la aplicación lista para pruebas más amplias. Ejecutar con datos ficticios; nunca introducir información personal.

## 1. Preparación

1. Clonar el repositorio y usar la rama `feature/ai-tutor-pedagogy`.
2. Ejecutar `npm ci` y `npm run check`.
3. Para probar el modo local, iniciar con `npm run dev` sin credenciales IA.
4. Para probar el tutor real, configurar un archivo local `.env` con `AI_PROVIDER`, `AI_API_KEY` y `AI_MODEL`; no subirlo a Git.
5. Iniciar la aplicación y comprobar que el estado de salud indica si el proveedor está configurado.

## 2. Modo local sin proveedor IA

- [ ] La aplicación permite comenzar una sesión sin conexión a Gemini.
- [ ] Portugués brasileño e inglés cargan actividades y opciones coherentes.
- [ ] Las respuestas correctas, incorrectas y escritas actualizan el progreso.
- [ ] Las pistas no revelan directamente la respuesta.
- [ ] El resumen refleja turnos, precisión, rachas y vocabulario.
- [ ] El repaso programado conserva la respuesta esperada y puede calificarse.
- [ ] Desactivar el audio no impide completar ninguna actividad.

## 3. Tutor IA y multilingüismo

Probar al menos dos idiomas con proveedor real:

- [ ] Portugués brasileño: locale `pt-BR`.
- [ ] Francés personalizado: locale `fr-FR`.
- [ ] Inglés del catálogo local: locale `en`; evaluar naturalidad, corrección, vocabulario y situaciones reales.
- [ ] Verificar que el idioma y locale elegidos llegan al tutor y se conservan en el resumen.
- [ ] Completar una sesión de al menos tres respuestas.
- [ ] Probar respuestas correctas, parciales, incorrectas y conversacionales.
- [ ] Comprobar que el tutor evalúa la respuesta anterior antes de proponer la siguiente actividad.
- [ ] Confirmar que la sesión no termina antes de la duración configurada.
- [ ] Solicitar pistas y comprobar que no se crea una actividad nueva ni se incrementa el turno.
- [ ] Provocar un error transitorio de red/proveedor y comprobar que el reintento no envía solicitudes duplicadas.
- [ ] Ante un error del proveedor, comprobar que la interfaz muestra un mensaje genérico sin detalles técnicos internos ni contenido de la respuesta upstream.
- [ ] Finalizar la sesión, revisar el resumen, recargar la página y confirmar persistencia.
- [ ] Exportar el progreso y comprobar que el archivo JSON se descarga y contiene la sesión.

## 4. Audio y pronunciación

Realizar estas comprobaciones en un navegador de escritorio y en un teléfono real:

- [ ] El audio automático comienza tras una acción explícita del usuario.
- [ ] El control global activa y desactiva la lectura; el estado se conserva al recargar.
- [ ] Desactivar el audio cancela la locución en curso.
- [ ] Solicitar una pista o enviar una respuesta mientras hay audio en curso detiene inmediatamente la locución anterior, sin esperar la respuesta del servidor.
- [ ] Si una solicitud IA falla, no continúa reproduciéndose audio de la actividad anterior.
- [ ] Reactivar el audio lee los fragmentos visibles del idioma objetivo, también en el panel de resumen.
- [ ] Al cambiar entre resumen, lección y otras vistas, reactivar el audio no debe leer fragmentos de paneles ocultos.
- [ ] La primera pista IA pronuncia automáticamente los fragmentos del idioma objetivo incluidos en la pista; la pista adicional también los reproduce.
- [ ] En los ejercicios locales, las pistas y explicaciones pronuncian únicamente los fragmentos del idioma objetivo anotados para ese contenido, sin leer la frase explicativa completa en español.
- [ ] Si solo existe una voz genérica del idioma (por ejemplo, `pt` sin variante regional), comprobar que se utiliza como fallback antes de recurrir a la voz predeterminada.
- [ ] Los fragmentos de portugués usan `pt-BR`; los de francés usan `fr-FR`.
- [ ] Los fragmentos del catálogo inglés usan locale `en` y seleccionan una voz inglesa compatible instalada en el dispositivo.
- [ ] Los botones individuales reproducen solo su fragmento y permiten repetirlo.
- [ ] El vocabulario del resumen se lee en el idioma objetivo y puede repetirse manualmente.
- [ ] Cambiar de turno, iniciar otra sesión o entrar al repaso detiene la locución anterior.
- [ ] Al avanzar entre tarjetas del repaso espaciado, no continúa la pronunciación de la tarjeta anterior.
- [ ] Si el sistema no tiene una voz compatible, la práctica escrita sigue funcionando y la interfaz informa el fallback.
- [ ] Comprobar que no se pronuncian por error las explicaciones auxiliares en español como si fueran texto objetivo.

**Importante:** la disponibilidad y calidad de las voces dependen del navegador y del sistema operativo. Las pruebas simuladas de CI no sustituyen esta comprobación auditiva.

## 5. Persistencia, repaso y exportación

- [ ] Cerrar una sesión y confirmar que aparece en el historial.
- [ ] Recargar y comprobar que sesiones, vocabulario, patrones y tarjetas siguen presentes.
- [ ] Calificar una tarjeta de repaso y confirmar que cambia su programación.
- [ ] Verificar que una conversación libre sin respuesta única no se convierte en una tarjeta imposible de calificar.
- [ ] Exportar progreso y comprobar que el JSON se puede abrir y contiene datos coherentes.

## 6. Seguridad básica

- [ ] Solicitar `/.env`, `/package.json`, `/server/provider.js` y `/tests/api.test.js`; todas deben devolver 404.
- [ ] Confirmar las cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- [ ] Confirmar que no aparecen claves API, respuestas completas del alumno ni historiales privados en la consola del servidor.
- [ ] Probar mensajes largos y solicitudes repetidas sin que la aplicación se bloquee.

## 7. Registro de resultados

Para cada escenario registrar:

| Campo | Resultado |
|---|---|
| Dispositivo y navegador | |
| Idioma y locale | |
| Escenario | |
| Resultado (aprobado / fallido) | |
| Pasos para reproducir | |
| Captura o log sin datos personales | |
| Severidad (bloqueante / alta / media / baja) | |

**Criterio de salida:** no declarar lista para prueba humana amplia mientras falle un flujo principal, no se confirme persistencia/exportación, o la lectura del idioma objetivo no se haya escuchado y verificado en al menos un dispositivo real.
