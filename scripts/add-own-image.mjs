/**
 * Da de alta una fotografía propia o encargada en el registro, con estado
 * "pendiente": NO aparece en la app hasta que se revise con
 * `node scripts/images-review.mjs verificar <clave>`.
 *
 * Uso:
 *   node scripts/add-own-image.mjs <ruta-de-la-foto> --clave camiseta --categoria ropa
 *        --concepto camiseta --autor "Nombre Apellido" --licencia "Cesión de derechos de uso comercial a …"
 *        [--origen propia|encargada] [--fuente "Fotografía propia"] [--url-licencia URL]
 *        [--observaciones "Camiseta azul lisa sobre fondo blanco."] [--reemplazar]
 *
 * - La foto se convierte a WebP (lado mayor 1024 px) en assets/images/palabras/<categoria>/<clave>.webp.
 * - Nunca sobrescribe una foto o entrada existente salvo con --reemplazar, y
 *   nunca reemplaza una foto de Commons verificada (hay que rechazarla antes).
 * - La autoría y la licencia son obligatorias: no se inventan. Para fotos
 *   encargadas, indica el documento de cesión de derechos en --licencia.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { CATEGORIAS, IMAGES_DIR, ORIGENES, generateOutputs, loadRegistry, parseArgs, saveRegistry, today, validateEntry } from './lib/registro.mjs';

const args = parseArgs(process.argv.slice(2));
const source = args._[0];
const fail = (msg) => {
  console.error(`Error: ${msg}`);
  process.exit(1);
};

if (!source) fail('indica la ruta de la foto. Ejemplo: node scripts/add-own-image.mjs fotos/camiseta.jpg --clave camiseta --categoria ropa --concepto camiseta --autor "…" --licencia "…"');
for (const k of ['clave', 'categoria', 'concepto', 'autor', 'licencia']) if (typeof args[k] !== 'string' || !args[k].trim()) fail(`falta --${k}`);
const origen = typeof args.origen === 'string' ? args.origen : 'propia';
if (!ORIGENES.includes(origen) || origen === 'commons') fail('--origen debe ser "propia" o "encargada" (las de Commons se añaden con commons-download.mjs)');
if (!CATEGORIAS.includes(args.categoria)) fail(`categoría no válida. Usa una de: ${CATEGORIAS.join(', ')}`);
await fs.stat(source).catch(() => fail(`no existe el archivo ${source}`));

const entries = await loadRegistry();
const existing = entries.find((e) => e.clave === args.clave);
if (existing && !args.reemplazar) fail(`ya existe la clave "${args.clave}" (${existing.origen}, ${existing.estado}). Usa --reemplazar si de verdad quieres sustituirla.`);
if (existing && existing.origen === 'commons' && existing.estado === 'verificada')
  fail(`"${args.clave}" es una foto de Commons verificada. Recházala antes con: node scripts/images-review.mjs rechazar ${args.clave} "motivo"`);

const archivo = `${args.categoria}/${args.clave}.webp`;
const entry = {
  clave: args.clave,
  categoria: args.categoria,
  concepto: args.concepto,
  archivo,
  origen,
  estado: 'pendiente',
  autor: args.autor,
  fuente: typeof args.fuente === 'string' ? args.fuente : origen === 'propia' ? 'Fotografía propia' : 'Fotografía encargada',
  url: '',
  licencia: args.licencia,
  urlLicencia: typeof args['url-licencia'] === 'string' ? args['url-licencia'] : '',
  fechaConsulta: today(),
  observaciones: typeof args.observaciones === 'string' ? args.observaciones : '',
};
const problems = validateEntry(entry);
if (problems.length) fail(problems.join('; '));

const target = path.join(IMAGES_DIR, archivo);
await fs.mkdir(path.dirname(target), { recursive: true });
// Si se reemplaza una foto rechazada, se guarda una copia de la anterior en vez de borrarla.
if (existing) {
  const old = path.join(IMAGES_DIR, existing.archivo);
  if (await fs.stat(old).then(() => true, () => false)) await fs.rename(old, `${old}.anterior-${Date.now()}`);
}
await sharp(source).rotate().resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);

const next = existing ? entries.map((e) => (e.clave === entry.clave ? entry : e)) : [...entries, entry];
await saveRegistry(next);
await generateOutputs(next);
console.log(`Añadida "${entry.clave}" como PENDIENTE (${archivo}).`);
console.log('Revisa la foto (concepto claro, sin marcas ni personas reconocibles) y, si es correcta:');
console.log(`  node scripts/images-review.mjs verificar ${entry.clave}`);
