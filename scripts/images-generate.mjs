/**
 * Regenera src/content/images.ts, src/content/credits.ts y
 * docs/licencias-imagenes.csv a partir de assets/images/registro.json.
 * No usa la red ni modifica el registro.
 *
 * Uso: node scripts/images-generate.mjs
 */
import { generateOutputs, loadRegistry } from './lib/registro.mjs';

const entries = await loadRegistry();
const { verified, total, problems } = await generateOutputs(entries);
console.log(`${verified} imágenes verificadas en la app (de ${total} en el registro).`);
const pending = entries.filter((e) => e.estado === 'pendiente').map((e) => e.clave);
if (pending.length) console.log(`Pendientes de revisión (no aparecen en la app): ${pending.join(', ')}`);
if (problems.length) {
  console.log('\nPROBLEMAS (estas entradas no se incluyen en la app):\n- ' + problems.join('\n- '));
  process.exitCode = 1;
}
