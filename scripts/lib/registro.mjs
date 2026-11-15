/**
 * Registro de imágenes: fuente única de verdad sobre qué fotos tiene la app,
 * de dónde vienen y si están revisadas.
 *
 *   assets/images/registro.json   (se edita con los scripts o a mano)
 *
 * A partir de él se GENERAN (no editar a mano):
 *   src/content/images.ts         solo imágenes con estado "verificada"
 *   src/content/credits.ts        créditos que muestra la app
 *   docs/licencias-imagenes.csv   registro legible para revisión legal
 *
 * Ningún script borra entradas del registro: como mucho cambian su estado.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REGISTRY_FILE = path.join(ROOT, 'assets', 'images', 'registro.json');
export const IMAGES_DIR = path.join(ROOT, 'assets', 'images', 'palabras');

export const ORIGENES = ['commons', 'propia', 'encargada'];
export const ESTADOS = ['verificada', 'pendiente', 'rechazada'];
export const CATEGORIAS = ['animales', 'alimentos', 'ropa', 'casa', 'transporte', 'acciones'];

/** Fecha de hoy en formato DD/MM/AAAA. */
export const today = () => new Date().toISOString().slice(0, 10).split('-').reverse().join('/');

/**
 * @typedef {Object} RegistryEntry
 * @property {string} clave         Clave de la imagen (Word.imagen): "perro", "cepillo_dientes".
 * @property {string} categoria
 * @property {string} concepto      Nombre legible: "cepillo de dientes".
 * @property {string} archivo       Ruta relativa a assets/images/palabras: "casa/silla.webp".
 * @property {'commons'|'propia'|'encargada'} origen
 * @property {'verificada'|'pendiente'|'rechazada'} estado
 * @property {string} autor
 * @property {string} fuente        "Wikimedia Commons", "Fotografía propia", nombre del estudio…
 * @property {string} url           Página de origen (vacía si es propia).
 * @property {string} licencia      "CC BY-SA 4.0", "Propiedad de …, cesión de uso comercial", …
 * @property {string} urlLicencia
 * @property {string} fechaConsulta DD/MM/AAAA de la última comprobación de licencia o alta.
 * @property {string} observaciones Qué muestra la foto y avisos de revisión.
 * @property {string} [commonsTitle] Título exacto en Commons ("File:…"), solo origen commons.
 * @property {string} [motivoRechazo]
 */

export async function loadRegistry() {
  const raw = await fs.readFile(REGISTRY_FILE, 'utf8').catch(() => '[]');
  return /** @type {RegistryEntry[]} */ (JSON.parse(raw));
}

export async function saveRegistry(entries) {
  const sorted = [...entries].sort((a, b) => (a.categoria + a.clave).localeCompare(b.categoria + b.clave));
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

/** Devuelve la lista de problemas de una entrada (vacía si es correcta). */
export function validateEntry(e) {
  const p = [];
  if (!/^[a-z0-9_]+$/.test(e.clave ?? '')) p.push('clave vacía o con caracteres no válidos (solo a-z, 0-9 y _)');
  if (!CATEGORIAS.includes(e.categoria)) p.push(`categoría desconocida: ${e.categoria}`);
  if (!ORIGENES.includes(e.origen)) p.push(`origen no válido: ${e.origen}`);
  if (!ESTADOS.includes(e.estado)) p.push(`estado no válido: ${e.estado}`);
  if (e.archivo !== `${e.categoria}/${e.clave}.webp`) p.push(`archivo debería ser ${e.categoria}/${e.clave}.webp`);
  if (e.estado === 'verificada') {
    for (const k of ['autor', 'fuente', 'licencia', 'concepto']) if (!String(e[k] ?? '').trim()) p.push(`falta ${k}`);
    if (e.origen === 'commons' && !/^https:\/\/commons\.wikimedia\.org\//.test(e.url ?? '')) p.push('falta la URL de Commons');
  }
  return p;
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const PROCESS_NOTE = 'Imagen redimensionada y convertida a WebP para la app.';

/** Regenera images.ts, credits.ts y el CSV a partir del registro. */
export async function generateOutputs(entries) {
  const problems = [];
  for (const e of entries) for (const p of validateEntry(e)) problems.push(`${e.clave}: ${p}`);
  const verified = [];
  for (const e of entries.filter((x) => x.estado === 'verificada')) {
    const exists = await fs.stat(path.join(IMAGES_DIR, e.archivo)).then(() => true, () => false);
    if (!exists) problems.push(`${e.clave}: no existe el archivo ${e.archivo}`);
    else if (validateEntry(e).length === 0) verified.push(e);
  }
  verified.sort((a, b) => (a.categoria + a.clave).localeCompare(b.categoria + b.clave));

  // 1) images.ts (solo verificadas: lo pendiente o rechazado nunca llega a la app)
  const images = [
    '// ARCHIVO GENERADO por scripts/images-generate.mjs a partir de assets/images/registro.json.',
    '// No editar a mano. require() devuelve un identificador numérico de recurso empaquetado por Metro.',
    '',
    'export const IMAGES = {',
    ...verified.map((e) => `  ${e.clave}: require('../../assets/images/palabras/${e.archivo}'),`),
    '} as const satisfies Record<string, number>;',
    '',
    'export type ImageKey = keyof typeof IMAGES;',
    '',
    'export function hasImage(key: string): key is ImageKey {',
    '  return Object.prototype.hasOwnProperty.call(IMAGES, key);',
    '}',
    '',
    'export function getImageSource(key: string): number | undefined {',
    '  return hasImage(key) ? IMAGES[key] : undefined;',
    '}',
    '',
  ].join('\n');
  await fs.writeFile(path.join(ROOT, 'src', 'content', 'images.ts'), images, 'utf8');

  // 2) credits.ts
  const credits = verified.map((e) => ({
    archivo: e.archivo,
    concepto: e.concepto,
    autor: e.autor,
    fuente: e.fuente,
    url: e.url ?? '',
    licencia: e.licencia,
    urlLicencia: e.urlLicencia ?? '',
    origen: e.origen,
    observaciones: `${e.observaciones ?? ''} ${PROCESS_NOTE}`.trim(),
  }));
  await fs.writeFile(
    path.join(ROOT, 'src', 'content', 'credits.ts'),
    [
      '// ARCHIVO GENERADO por scripts/images-generate.mjs a partir de assets/images/registro.json. No editar a mano.',
      "import type { ImageCredit } from '@/types/content';",
      '',
      `export const IMAGE_CREDITS: ImageCredit[] = ${JSON.stringify(credits, null, 2)};`,
      '',
    ].join('\n'),
    'utf8',
  );

  // 3) CSV con TODAS las entradas (también pendientes y rechazadas), para auditoría.
  const header = ['archivo', 'concepto', 'origen', 'estado', 'autor', 'fuente', 'url_origen', 'licencia', 'url_licencia', 'fecha_consulta', 'observaciones'];
  const sortedAll = [...entries].sort((a, b) => (a.categoria + a.clave).localeCompare(b.categoria + b.clave));
  const csv = [
    header.join(','),
    ...sortedAll.map((e) =>
      [
        e.archivo,
        e.concepto,
        e.origen,
        e.estado,
        e.autor,
        e.fuente,
        e.url,
        e.licencia,
        e.urlLicencia,
        e.fechaConsulta,
        [e.observaciones, e.motivoRechazo && `Motivo de rechazo: ${e.motivoRechazo}`, PROCESS_NOTE].filter(Boolean).join(' '),
      ]
        .map(csvCell)
        .join(','),
    ),
  ].join('\n');
  await fs.mkdir(path.join(ROOT, 'docs'), { recursive: true });
  await fs.writeFile(path.join(ROOT, 'docs', 'licencias-imagenes.csv'), '﻿' + csv + '\n', 'utf8');

  return { verified: verified.length, total: entries.length, problems };
}

/** Lee argumentos "--clave valor" y posicionales. */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else {
        args[key] = next;
        i++;
      }
    } else args._.push(a);
  }
  return args;
}
