/**
 * Revisión de imágenes del registro.
 *
 * Uso:
 *   node scripts/images-review.mjs listar [pendiente|verificada|rechazada]
 *   node scripts/images-review.mjs verificar <clave> [--observaciones "texto"]
 *   node scripts/images-review.mjs rechazar <clave> "motivo"
 *
 * Verificar: la foto pasa a aparecer en la app (si sus datos están completos).
 * Rechazar: la foto deja de aparecer en la app, pero la entrada y el archivo
 * se conservan con el motivo, para que quede constancia en el CSV.
 */
import { ESTADOS, generateOutputs, loadRegistry, parseArgs, saveRegistry, today, validateEntry } from './lib/registro.mjs';

const args = parseArgs(process.argv.slice(2));
const [command, clave, motivo] = args._;
const entries = await loadRegistry();

if (!command || command === 'listar') {
  const filter = clave && ESTADOS.includes(clave) ? clave : null;
  for (const e of entries.filter((x) => !filter || x.estado === filter)) {
    console.log(`${e.estado.padEnd(10)} ${e.origen.padEnd(9)} ${e.archivo.padEnd(32)} ${e.licencia}`);
  }
  const by = (s) => entries.filter((e) => e.estado === s).length;
  console.log(`\nTotal ${entries.length}: ${by('verificada')} verificadas, ${by('pendiente')} pendientes, ${by('rechazada')} rechazadas.`);
  process.exit(0);
}

const entry = entries.find((e) => e.clave === clave);
if (!entry) {
  console.error(`No existe la clave "${clave}". Usa "listar" para ver las disponibles.`);
  process.exit(1);
}

if (command === 'verificar') {
  const candidate = { ...entry, estado: 'verificada' };
  if (typeof args.observaciones === 'string') candidate.observaciones = args.observaciones;
  const problems = validateEntry(candidate);
  if (problems.length) {
    console.error(`No se puede verificar "${clave}": ${problems.join('; ')}`);
    process.exit(1);
  }
  delete candidate.motivoRechazo;
  candidate.fechaConsulta = today();
  Object.assign(entry, candidate);
} else if (command === 'rechazar') {
  if (!motivo) {
    console.error('Indica el motivo: node scripts/images-review.mjs rechazar <clave> "motivo"');
    process.exit(1);
  }
  entry.estado = 'rechazada';
  entry.motivoRechazo = motivo;
} else {
  console.error(`Orden desconocida: ${command}`);
  process.exit(1);
}

await saveRegistry(entries);
const { verified, problems } = await generateOutputs(entries);
console.log(`"${clave}" ahora está ${entry.estado}. Imágenes en la app: ${verified}.`);
if (problems.length) console.log('Avisos:\n- ' + problems.join('\n- '));
