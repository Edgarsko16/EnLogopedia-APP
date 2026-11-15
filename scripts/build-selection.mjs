/**
 * Herramienta de desarrollo: genera scripts/seleccion-imagenes.json a partir
 * de las elecciones hechas tras revisar a ojo las hojas de contactos.
 *
 * Uso: node scripts/build-selection.mjs
 *
 * Cada elección indica la ronda de búsqueda (carpeta de candidates.json), el
 * índice de la candidata (el número amarillo de la hoja) y una observación
 * sobre lo que muestra la foto. Los títulos se copian de candidates.json, por
 * lo que no hay riesgo de errores al teclearlos.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RONDAS = {
  r1: path.join(ROOT, 'scripts', 'candidatas', 'candidates.json'),
  r2: path.join(ROOT, 'scripts', 'candidatas', 'ronda2', 'candidates.json'),
  r3: path.join(ROOT, 'scripts', 'candidatas', 'ronda3', 'candidates.json'),
};

const choices = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts', 'elecciones-imagenes.json'), 'utf8'));
const cache = {};
const selection = [];
for (const c of choices) {
  cache[c.ronda] ??= JSON.parse(await fs.readFile(RONDAS[c.ronda], 'utf8'));
  const cand = cache[c.ronda][c.concepto]?.[c.indice];
  if (!cand) throw new Error(`No existe la candidata ${c.ronda}/${c.concepto}/${c.indice}`);
  selection.push({
    // `archivo` permite usar una candidata buscada para otro concepto
    // (p. ej. una foto encontrada al buscar "leer" que ilustra "escribir").
    archivo: c.archivo ?? c.concepto,
    concepto: c.nombre,
    categoria: c.categoria,
    title: cand.title,
    observaciones: c.observaciones,
  });
}
await fs.writeFile(path.join(ROOT, 'scripts', 'seleccion-imagenes.json'), JSON.stringify(selection, null, 2) + '\n');
console.log(`${selection.length} imágenes en scripts/seleccion-imagenes.json`);
