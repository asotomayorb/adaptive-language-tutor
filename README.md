# Adaptive Language Tutor

Aplicación modular de aprendizaje de idiomas basada en conversación adaptativa.

## Alcance inicial
- Configuración de idioma, duración, nivel y tema.
- Flujo de práctica guiada.
- Pistas y retroalimentación.
- Registro de vocabulario y errores durante la sesión.
- Modo de repaso y resumen final.

## Ejecutar
Abrir `index.html` en un navegador moderno. No requiere compilación.

## Estructura
- `index.html`: estructura de la aplicación.
- `src/app.js`: estado y flujo pedagógico.
- `src/styles.css`: interfaz adaptable.

## Estado y limitaciones
Esta versión inicial es un prototipo funcional de interfaz. Usa ejercicios de demostración limitados, no está conectada a un modelo de IA y la evaluación de texto libre es exacta, no semántica. El diagnóstico es preliminar.

## Próximos hitos
1. Validar y completar el flujo pedagógico.
2. Separar motor pedagógico y contenidos específicos de cada idioma.
3. Incorporar integración de IA mediante backend seguro.
4. Persistir perfiles y progreso con repetición espaciada.
5. Añadir pruebas automatizadas y despliegue.
   
**Seguridad:** las claves de API nunca deben guardarse en el frontend ni en el repositorio.
