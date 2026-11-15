# Continuar el desarrollo de EnLogopedia

Copia este archivo como contexto en una nueva sesión de Claude Code abierta en esta carpeta. Lee también `AGENTS.md` (reglas de Expo), `README.md`, `docs/fase3-sesiones.md` (sesiones, perfiles, almacenamiento y diseño), `docs/fotos-propias.md` y `assets/brand/README.md`. No hagas commits ni publicaciones sin pedirlo.

## Estado actual (15/11/2026, fase 3)

EnLogopedia es una herramienta para el profesional en sesión presencial. Funciona sin conexión en web y en Android con Expo Go; esto último aún no se ha probado en un dispositivo real. Tiene 51 palabras con foto verificada en 6 categorías.

### Comprobación inicial (antes de la fase 3)

- TypeScript sin errores, una vez copiado `logo.png`: `brand.ts` lo pedía y el archivo estaba como `image-png.png`.
- 61 pruebas superadas.
- Expo Doctor 20/20.

### Hecho en la fase 3

- **3A. Identidad y diseño**
  - Logo integrado sin deformar: `logo-app.png`, recortado y con su proporción real. El original se conserva intacto.
  - Nombre unificado como «EnLogopedia» en `app.json` (también metadatos web) y en la app.
  - Pantalla de bienvenida con `expo-splash-screen` (logo sobre `#F8FAFD`).
  - Sistema de diseño centralizado con la paleta del logo y contrastes probados.
  - Componentes `Card`, `Tag`, `ProgressBar`, `SectionHeader` y `MenuCard` con variante destacada.
  - Portada profesional nueva.
  - El icono de la app queda **pendiente**: solo hay borradores sin conectar (ver «Problemas»).
- **3B. Áreas**
  - Catálogo de actividades con metadatos, áreas y objetivos en `src/activities/`.
  - Pantallas `/areas` y `/areas/[id]`.
  - Las áreas Audición, Lectoescritura y Comunicación se muestran como «Próximamente», sin enlaces a pantallas vacías.
  - Las rutas antiguas siguen funcionando.
- **3C. Perfiles**
  - Alias no identificativos con validación (bloquea DNI, teléfono, correo y fechas; avisa si parece un nombre propio).
  - Crear, cambiar alias y eliminar en cascada con confirmación.
  - Pantallas `/perfiles` y `/perfiles/[id]`, esta última con seguimiento.
- **3D. Sesiones**
  - Sesión libre: perfil o sin perfil, varias actividades, modalidad, dificultad, categoría o fonema, y orden.
  - Sesión sugerida: generador por reglas según área, objetivo, dificultad y duración. Avisa de sus límites y la propuesta es editable.
  - Modo actividad con barra de sesión: progreso, pausa, siguiente actividad y finalizar.
  - Reanudación tras pausa o cierre de la app.
  - Las 10 actividades leen la dificultad y la modalidad de la sesión.
- **3E. Resultados e historial**
  - Registro automático por elemento (qué se trabajaba y qué se eligió), sin duplicados.
  - Valoración manual en Denominación: correcto, con ayuda, incorrecto, no realizado.
  - Observaciones editables y eliminables, con aviso de privacidad.
  - Resumen que separa respuestas automáticas y valoraciones manuales; sin porcentaje con menos de 5 rondas.
  - Historial con filtro por perfil, detalle y eliminación.
  - Exportación de copia en JSON desde Ajustes.
- **Otros**
  - Ajuste «Voz de refuerzo tras fallar».
  - Corregidos los plurales de los resúmenes.

### Comprobaciones finales (15/11/2026)

- `npx tsc --noEmit`: sin errores.
- `npm test`: 9 suites, **105 pruebas** superadas. Las nuevas cubren:
  - `sessions.test.ts`: perfiles, registro sin duplicados, saltos, pausa y duración, observaciones, seguimiento, sugerencias, persistencia, borrado en cascada y reconstrucción del índice.
  - `activities.test.ts`: catálogo y disponibilidad.
  - `theme.test.ts`: contrastes.
- `npx expo-doctor`: 20/20.
- **Probado a mano en web**:
  - Portada y aviso de alias con forma de nombre.
  - Creación del perfil «Usuario 01».
  - Sesión libre con Busca la imagen y Denominación: respuesta incorrecta y correcta, doble toque sin registro duplicado, siguiente actividad, valoraciones manuales y pausa.
  - Recarga completa de la página y continuar sesión.
  - Terminar, resumen, observaciones, historial y vista de perfil.
  - Propuesta de sesión sugerida.
  - Pantalla de áreas, una actividad fuera de sesión y Ajustes.
  - Sin errores en consola.
- **No probado**:
  - Android real (TalkBack, voz, margen superior de la barra de sesión, icono y pantalla de bienvenida en una compilación).
  - Exportación de copia en Android.
  - Uso en tablet física.
- Datos de prueba: en el almacenamiento del navegador de la vista previa quedan el perfil «Usuario 01» y una sesión. Se pueden borrar desde la app (Perfiles → Eliminar perfil).

### Problemas y limitaciones conocidas

1. **Icono de la app**: el logo mide 500 px y el oído, unos 220 px. No sirve para un icono de 1024 px ni para la zona segura del icono adaptativo sin quedar borroso. Hay borradores en `assets/brand/propuestas/`, sin conectar. Hace falta el logo en vectorial o en alta resolución.
2. El texto incrustado en el logo dice «Enlogopedia» y el nombre oficial es «EnLogopedia».
3. Al **reanudar** una sesión, la actividad actual vuelve a empezar su ronda interna (por ejemplo, Denominación empieza otra vez desde la foto 1). Los resultados ya registrados se conservan.
4. No hay **restauración** desde la copia exportada (solo exportación). Los datos no están cifrados por la app: dependen del cifrado y el bloqueo del dispositivo.
5. En sesión se puede cambiar la modalidad desde la propia actividad (frases, funciones, fonología). Lo registrado sigue asociado a la modalidad planificada.
6. Memory registra cada turno de dos cartas como una ronda: el resumen muestra intentos y errores, no «aciertos a la primera» en sentido estricto.
7. Pocas asociaciones activas (4) y fonemas con pocas palabras: limitan la variedad de las sesiones sugeridas. El generador lo avisa.
8. Siguen sin foto: camiseta, pantalón, calcetines, gorro, bufanda, chaqueta, vestido, vaso y leer. Las fotos del cepillo de dientes y la llave muestran marcas.

### Pendiente, por prioridad

1. Probar en Android real el flujo completo (ver `docs/fase3-sesiones.md`, apartado 10).
2. Logo en alta resolución o vectorial → icono y versión adaptativa de Android.
3. Restaurar una copia exportada (con validación y sin sobrescribir sin confirmación).
4. Guardar el estado interno de la actividad para reanudar exactamente donde se dejó.
5. Fotos propias para ropa, vaso y leer (`scripts/add-own-image.mjs`).
6. Contenido de las áreas futuras (audición, lectoescritura, comunicación) y fonema medial y final.
7. Revisión legal de licencias CC BY-SA y de protección de datos antes de comercializar (la información aquí es orientativa).
8. Configurar `npx expo lint`.
