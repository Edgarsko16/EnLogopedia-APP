/**
 * Herramienta de desarrollo: busca fotografías candidatas en Wikimedia Commons
 * con licencia compatible con uso comercial y genera una hoja de contactos
 * (contact sheet) para revisarlas visualmente.
 *
 * Uso:
 *   node scripts/commons-search.mjs <conceptos.json> <carpeta-salida>
 *
 * <conceptos.json> es un array de objetos: { "id": "perro", "queries": ["dog"] }
 *
 * Salida en <carpeta-salida>:
 *   candidates.json  -> metadatos y licencia de cada candidata
 *   sheet-<n>.png    -> hojas de contactos numeradas para revisar a ojo
 *
 * IMPORTANTE: esta herramienta solo preselecciona. Una persona debe revisar
 * cada imagen (concepto claro, sin marcas, sin personas reconocibles) antes
 * de incorporarla con scripts/commons-download.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia pide un User-Agent descriptivo; usamos uno genérico del proyecto.
const UA = 'EnLogopediaPrototype/0.1 (offline educational app; image licence verification)';

// Licencias aceptadas (campo extmetadata.License). Todas permiten uso comercial.
const ALLOWED = [/^cc0$/, /^pd$/, /^cc-by-\d(\.\d)?$/, /^cc-by-sa-\d(\.\d)?$/];
const PER_CONCEPT = 6;
const MIN_WIDTH = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const strip = (html = '') =>
  String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(800); // ritmo respetuoso con la API pública
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    console.warn(`HTTP ${res.status}, reintentando...`);
    await sleep(5000 * (attempt + 1));
  }
  throw new Error(`Fallo en la API: ${url}`);
}

async function search(query) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: '25',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '320',
  });
  const pages = data?.query?.pages ?? [];
  return pages.sort((a, b) => a.index - b.index);
}

function toCandidate(page) {
  const ii = page.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  const license = (m.License?.value ?? '').toLowerCase();
  if (!ALLOWED.some((re) => re.test(license))) return null;
  if (!/image\/(jpeg|png)/.test(ii.mime)) return null;
  if (ii.width < MIN_WIDTH) return null;
  return {
    title: page.title,
    width: ii.width,
    height: ii.height,
    thumb: ii.thumburl,
    descriptionUrl: ii.descriptionurl,
    license,
    licenseShortName: strip(m.LicenseShortName?.value),
    licenseUrl: strip(m.LicenseUrl?.value),
    artist: strip(m.Artist?.value),
    credit: strip(m.Credit?.value),
    restrictions: strip(m.Restrictions?.value),
    description: strip(m.ImageDescription?.value).slice(0, 200),
  };
}

async function main() {
  const [conceptsFile, outDir] = process.argv.slice(2);
  if (!conceptsFile || !outDir) {
    console.error('Uso: node scripts/commons-search.mjs <conceptos.json> <carpeta-salida>');
    process.exit(1);
  }
  const concepts = JSON.parse(await fs.readFile(conceptsFile, 'utf8'));
  await fs.mkdir(outDir, { recursive: true });
  // Reanudación: si ya existe candidates.json se reutilizan los conceptos hechos.
  const cacheFile = path.join(outDir, 'candidates.json');
  const result = JSON.parse(await fs.readFile(cacheFile, 'utf8').catch(() => '{}'));

  for (const concept of concepts) {
    if (result[concept.id]?.length) continue;
    const seen = new Set();
    const list = [];
    for (const q of concept.queries) {
      // Primero imágenes de calidad contrastada, luego búsqueda general.
      for (const variant of [`${q} incategory:Quality_images`, q]) {
        if (list.length >= PER_CONCEPT) break;
        for (const page of await search(variant)) {
          if (seen.has(page.title)) continue;
          seen.add(page.title);
          const c = toCandidate(page);
          if (c) list.push(c);
          if (list.length >= PER_CONCEPT) break;
        }
      }
    }
    result[concept.id] = list;
    console.log(`${concept.id}: ${list.length} candidatas`);
    await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
  }
  await buildSheets(result, outDir);
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Construye hojas de contactos de 5 conceptos x 6 candidatas. */
async function buildSheets(result, outDir) {
  const W = 260, H = 195, LABEL = 120, ROWS_PER_SHEET = 5;
  const ids = Object.keys(result);
  for (let s = 0; s * ROWS_PER_SHEET < ids.length; s++) {
    const rows = ids.slice(s * ROWS_PER_SHEET, (s + 1) * ROWS_PER_SHEET);
    const composites = [];
    for (const [r, id] of rows.entries()) {
      composites.push({ input: label(id, LABEL, H, 18), left: 0, top: r * H });
      for (const [i, c] of result[id].entries()) {
        try {
          await sleep(300);
          const img = await sharp(await fetchBuffer(c.thumb)).resize(W - 6, H - 6, { fit: 'contain', background: '#222' }).png().toBuffer();
          composites.push({ input: img, left: LABEL + i * W + 3, top: r * H + 3 });
          composites.push({ input: label(String(i), 30, 26, 20, '#ff0'), left: LABEL + i * W + 4, top: r * H + 4 });
        } catch (e) {
          console.warn('No se pudo descargar miniatura', c.title, e.message);
        }
      }
    }
    await sharp({ create: { width: LABEL + PER_CONCEPT * W, height: rows.length * H, channels: 3, background: '#111' } })
      .composite(composites)
      .png()
      .toFile(path.join(outDir, `sheet-${s}.png`));
  }
}

function label(text, w, h, size, color = '#fff') {
  const safe = text.replace(/[<>&]/g, '');
  return Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#000" opacity="0.7"/>` +
      `<text x="4" y="${size + 2}" font-size="${size}" font-family="Arial" fill="${color}">${safe}</text></svg>`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
