# Cómo añadir una fotografía propia o encargada

Las fotos de la app se registran en `assets/images/registro.json`, que es la única fuente de verdad. Los archivos `src/content/images.ts`, `src/content/credits.ts` y `docs/licencias-imagenes.csv` se generan a partir de él: no los edites a mano.

Cada entrada tiene un **origen** (`commons`, `propia` o `encargada`) y un **estado** (`pendiente`, `verificada` o `rechazada`). Solo las verificadas aparecen en la app; el CSV recoge todas, también las rechazadas con su motivo.

## Requisitos de la foto

- El concepto se ve con claridad y ocupa buena parte del encuadre; fondo neutro si es posible.
- Sin marcas ni logotipos legibles, sin personas reconocibles (para acciones, mejor solo manos) y sin otros objetos del vocabulario que puedan generar dos respuestas.
- Si sale otro objeto del vocabulario, anótalo en el campo `contiene` de la palabra en `src/content/words.ts`.
- Autoría y licencia por escrito. Si la foto es encargada, debe existir un documento de cesión de derechos de uso comercial; indícalo en la licencia. No se registran fotos sin autoría ni licencia conocidas.

## Pasos

1. Dar de alta la foto (queda **pendiente**, todavía no sale en la app):

   ```bash
   node scripts/add-own-image.mjs ruta/camiseta.jpg --clave camiseta --categoria ropa --concepto camiseta --autor "Nombre Apellido" --licencia "Cesión de derechos de uso comercial a Inventia (contrato 2026-03)" --origen encargada --observaciones "Camiseta azul lisa sobre fondo blanco."
   ```

   - `--clave` debe coincidir con el campo `imagen` de la palabra en `src/content/words.ts` (camiseta, pantalon, calcetines, gorro, bufanda, chaqueta, vestido, vaso, leer…).
   - La foto se convierte a WebP (lado mayor 1024 px) y se guarda en `assets/images/palabras/<categoria>/<clave>.webp`.
   - El script no sobrescribe claves existentes salvo con `--reemplazar`, y nunca una foto de Commons verificada (habría que rechazarla antes). Si reemplaza, conserva el archivo anterior con el sufijo `.anterior-<fecha>`.

2. Revisar la foto a tamaño real y, si cumple los requisitos, verificarla:

   ```bash
   node scripts/images-review.mjs verificar camiseta
   ```

   La palabra aparece en la app automáticamente (el catálogo solo muestra palabras con foto verificada).

3. Si no sirve, rechazarla (se conserva la constancia en el registro y el CSV):

   ```bash
   node scripts/images-review.mjs rechazar camiseta "Se ve la etiqueta de la marca"
   ```

4. Comprobar que todo sigue bien:

   ```bash
   npx tsc --noEmit
   npm test
   ```

## Otras órdenes útiles

- `node scripts/images-review.mjs listar` (o `listar pendiente`): estado de todas las imágenes.
- `node scripts/images-generate.mjs`: regenera los archivos derivados sin tocar el registro ni usar la red.
- `node scripts/commons-download.mjs`: añade o actualiza fotos de Commons de `scripts/seleccion-imagenes.json` de forma incremental. Nunca borra entradas, nunca toca fotos propias o encargadas y no recupera fotos rechazadas salvo con `--forzar`.
