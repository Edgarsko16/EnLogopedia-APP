# EnLogopedia

Herramienta de apoyo para logopedas en sesión presencial: preparar sesiones con perfiles por alias, ejecutar actividades, registrar resultados y consultar el historial. Arquitectura de sesiones, almacenamiento, privacidad y sistema de diseño: [docs/fase3-sesiones.md](docs/fase3-sesiones.md).

Aplicación de ejercicios de logopedia con fotografías reales: vocabulario por categorías, denominación, «Busca la imagen», memory, frases (elegir, completar y construir), semántica (categorizar, ¿cuál no pertenece?, asociaciones y funciones) y fonología por fonema inicial. Hecha con Expo SDK 58, React Native, TypeScript y Expo Router. Funciona sin conexión y guarda las preferencias y el progreso solo en el dispositivo.

## Puesta en marcha

```bash
npm install
npx expo start --web
```

Para el móvil Android: `npx expo start`, instala **Expo Go** desde Google Play y escanea el código QR (el ordenador y el móvil deben estar en la misma red wifi). Si la red no lo permite, usa `npx expo start --tunnel`.

## Comprobaciones

```bash
npx tsc --noEmit   # tipos
npm test           # pruebas unitarias (Jest)
npx expo-doctor    # dependencias y configuración
```

## Estructura

- `src/app/`: pantallas (Expo Router). Cada archivo es una ruta.
- `src/activities/`: catálogo de áreas, objetivos y actividades (metadatos y disponibilidad).
- `src/sessions/`: perfiles, sesiones, registro de resultados, generador de sesiones sugeridas y almacenamiento local.
- `src/components/`: componentes de interfaz accesibles reutilizables.
- `src/content/`: banco de palabras, categorías, frases y registro de imágenes. `catalog.ts` es el único punto de acceso y oculta lo que no tiene foto verificada.
- `src/games/`: lógica pura de cada juego (sin interfaz, probada con Jest) y registro de juegos. Incluye `semantica/` y `fonologia/`.
- `src/content/semantics.ts` y `src/content/phonology.ts`: relaciones semánticas e inventario de fonemas, sobre los identificadores del banco de palabras.
- `src/content/brand.ts` y `assets/brand/`: identidad visual (logo).
- `src/hooks/`, `src/storage/`, `src/services/`: preferencias, progreso, almacenamiento local y voz.
- `scripts/`: herramientas para buscar, seleccionar y descargar fotografías de Wikimedia Commons con licencia verificada.
- `docs/licencias-imagenes.csv`: procedencia, autoría y licencia de cada imagen.

## Imágenes y licencias

Todas las fotografías proceden de Wikimedia Commons con licencias que permiten uso comercial (CC0, dominio público, CC BY y CC BY-SA). La licencia se comprueba automáticamente en el momento de la descarga y cada imagen se ha revisado a mano. La pantalla «Créditos de las imágenes» muestra la atribución exigida. Las imágenes CC BY-SA obligan a compartir con la misma licencia las imágenes modificadas (no el código de la app); antes de comercializar conviene una revisión legal, ya que esta información es orientativa.

El registro de imágenes es `assets/images/registro.json` (origen y estado de revisión de cada foto). A partir de él se generan `src/content/images.ts`, `src/content/credits.ts` y `docs/licencias-imagenes.csv`. Para fotos de Commons:

1. Añadir el concepto y sus búsquedas a un `conceptos.json` y ejecutar `node scripts/commons-search.mjs <conceptos.json> <carpeta>`.
2. Revisar las hojas `sheet-N.png` y anotar la elección en `scripts/elecciones-imagenes.json`.
3. `node scripts/build-selection.mjs` y después `node scripts/commons-download.mjs` (incremental: no borra ni pisa nada).

Para fotos propias o encargadas, ver [docs/fotos-propias.md](docs/fotos-propias.md).
