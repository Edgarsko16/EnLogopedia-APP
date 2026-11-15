/**
 * Herramienta de desarrollo: incorpora al registro las fotografías de
 * Wikimedia Commons elegidas en scripts/seleccion-imagenes.json.
 *
 * Modo INCREMENTAL (desde la fase 2):
 *  - Solo añade o actualiza las entradas de la selección; nunca borra otras.
 *  - Nunca toca fotos propias o encargadas (origen distinto de "commons").
 *  - No resucita fotos rechazadas (salvo con --forzar).
 *  - Vuelve a comprobar la licencia en Commons en cada ejecución; si ya no
 *    es compatible, avisa y deja la entrada como estaba.
 *  - Solo descarga si el archivo no existe o si cambia la foto elegida
 *    (la anterior se conserva con el sufijo .anterior-<fecha>).
 *
 * Después regenera images.ts, credits.ts y el CSV (scripts/lib/registro.mjs).
 *
 * Uso:
 *   node scripts/commons-download.mjs [scripts/seleccion-imagenes.json] [--forzar]
 *
 * La selección es un array de { archivo, concepto, categoria, title, observaciones },
 * normalmente generado con scripts/build-selection.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { IMAGES_DIR, ROOT, generateOutputs, loadRegistry, parseArgs, saveRegistry, today } from './lib/registro.mjs';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'EnLogopediaPrototype/0.1 (offline educational app; image licence verification)';
const ALLOWED = [/^cc0$/, /^pd$/, /^cc-by-\d(\.\d)?$/, /^cc-by-sa-\d(\.\d)?$/];
const MAX_SIDE = 1024;
const QUALITY = 76;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (html = '') => String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function getJson(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let i = 0; i < 6; i++) {
    await sleep(900);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    await sleep(5000 * (i + 1));
  }
  throw new Error(`Fallo en la API: ${url}`);
}

async function getBuffer(url) {
  for (let i = 0; i < 6; i++) {
    await sleep(600);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    await sleep(5000 * (i + 1));
  }
  throw new Error(`No se pudo descargar ${url}`);
}

async function fileInfo(title) {
  const data = await getJson({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(MAX_SIDE * 1.25),
  });
  const ii = data?.query?.pages?.[0]?.imageinfo?.[0];
  if (!ii) throw new Error(`No existe en Commons: ${title}`);
  const m = ii.extmetadata ?? {};
  return {
    url: ii.thumburl ?? ii.url,
    descriptionUrl: ii.descriptionurl,
    license: (m.License?.value ?? '').toLowerCase(),
    licenseShortName: strip(m.LicenseShortName?.value),
    licenseUrl: strip(m.LicenseUrl?.value),
    artist: strip(m.Artist?.value) || strip(m.Credit?.value) || 'Autor no indicado',
    restrictions: strip(m.Restrictions?.value),
  };
}

function licenseUrlFallback(info) {
  if (info.licenseUrl) return info.licenseUrl;
  if (info.license === 'cc0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (info.license === 'pd') return 'https://commons.wikimedia.org/wiki/Commons:Licensing#Public_domain';
  return '';
}

const args = parseArgs(process.argv.slice(2));
const selectionFile = args._[0] ?? path.join(ROOT, 'scripts', 'seleccion-imagenes.json');
const selection = JSON.parse(await fs.readFile(selectionFile, 'utf8'));
const entries = await loadRegistry();
const report = { nuevas: [], actualizadas: [], omitidas: [], rechazadasLicencia: [] };

for (const item of selection) {
  const existing = entries.find((e) => e.clave === item.archivo);
  if (existing && existing.origen !== 'commons') {
    report.omitidas.push(`${item.archivo}: es una foto ${existing.origen}; no se toca`);
    continue;
  }
  if (existing?.estado === 'rechazada' && existing.commonsTitle === item.title && !args.forzar) {
    report.omitidas.push(`${item.archivo}: está rechazada (${existing.motivoRechazo ?? 'sin motivo'}); usa --forzar para reincorporarla`);
    continue;
  }

  const info = await fileInfo(item.title);
  if (!ALLOWED.some((re) => re.test(info.license))) {
    report.rechazadasLicencia.push(`${item.archivo}: licencia no admitida (${info.license || 'desconocida'})`);
    continue;
  }

  const archivo = `${item.categoria}/${item.archivo}.webp`;
  const target = path.join(IMAGES_DIR, archivo);
  const exists = await fs.stat(target).then(() => true, () => false);
  const changedPhoto = existing && existing.commonsTitle !== item.title;
  if (exists && changedPhoto) await fs.rename(target, `${target}.anterior-${Date.now()}`);
  if (!exists || changedPhoto) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await sharp(await getBuffer(info.url))
      .rotate()
      .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);
  }

  const restrictions = info.restrictions ? ` Restricciones indicadas en Commons: ${info.restrictions}.` : '';
  const entry = {
    clave: item.archivo,
    categoria: item.categoria,
    concepto: item.concepto,
    archivo,
    origen: 'commons',
    // Una entrada existente conserva su estado; una nueva entra como verificada
    // porque la selección se ha hecho revisando las hojas de contactos a mano.
    estado: existing && !changedPhoto ? existing.estado : 'verificada',
    autor: info.artist,
    fuente: 'Wikimedia Commons',
    url: info.descriptionUrl,
    licencia: info.licenseShortName || info.license,
    urlLicencia: licenseUrlFallback(info),
    fechaConsulta: today(),
    observaciones: `${item.observaciones ?? ''}${restrictions}`.trim(),
    commonsTitle: item.title,
  };
  if (existing) Object.assign(existing, entry);
  else entries.push(entry);
  (existing ? report.actualizadas : report.nuevas).push(item.archivo);
  console.log(`OK ${archivo}  [${entry.licencia}]`);
}

await saveRegistry(entries);
const { verified, problems } = await generateOutputs(entries);
console.log(`\nNuevas: ${report.nuevas.length}. Actualizadas: ${report.actualizadas.length}. Imágenes en la app: ${verified}.`);
if (report.omitidas.length) console.log('OMITIDAS:\n- ' + report.omitidas.join('\n- '));
if (report.rechazadasLicencia.length) console.log('LICENCIA NO ADMITIDA:\n- ' + report.rechazadasLicencia.join('\n- '));
if (problems.length) console.log('PROBLEMAS:\n- ' + problems.join('\n- '));
