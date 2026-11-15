/// <reference types="node" />
// Tipos de Node (fs, path) para comprobar los archivos de imagen en disco.
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES } from '@/content/categories';
import { areConfusable, getAllWords, getCategories, getSentences, getWord, getWordsByCategory } from '@/content/catalog';
import { IMAGE_CREDITS } from '@/content/credits';
import { SENTENCES } from '@/content/sentences';
import { WORDS } from '@/content/words';
import { gamesForCategory } from '@/games/registry';
import { normalize } from '@/utils/text';

const ROOT = path.resolve(__dirname, '..');

/** Contraste WCAG entre dos colores hexadecimales. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('banco de contenido', () => {
  it('los identificadores de palabra son únicos', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
  });

  it('todas las imágenes registradas existen en disco y tienen crédito', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/content/images.ts'), 'utf8');
    const files = [...source.matchAll(/require\('\.\.\/\.\.\/(assets\/[^']+)'\)/g)].map((m) => m[1]);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(fs.existsSync(path.join(ROOT, f))).toBe(true);
    const credited = new Set(IMAGE_CREDITS.map((c) => `assets/images/palabras/${c.archivo}`));
    for (const f of files) expect(credited.has(f)).toBe(true);
  });

  it('cada crédito tiene autor y licencia, y las de Commons su enlace de origen', () => {
    for (const c of IMAGE_CREDITS) {
      expect(c.autor.trim()).not.toBe('');
      expect(c.licencia.trim()).not.toBe('');
      if (c.origen === 'commons') expect(c.url).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it('el registro de imágenes es válido y la app solo incluye las verificadas', () => {
    const registry: { clave: string; estado: string; origen: string; archivo: string; autor: string; licencia: string }[] =
      JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/images/registro.json'), 'utf8'));
    const keys = registry.map((e) => e.clave);
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of registry) {
      expect(['verificada', 'pendiente', 'rechazada']).toContain(e.estado);
      expect(['commons', 'propia', 'encargada']).toContain(e.origen);
    }
    const verified = registry.filter((e) => e.estado === 'verificada').map((e) => e.archivo).sort();
    expect(IMAGE_CREDITS.map((c) => c.archivo).sort()).toEqual(verified);
  });

  it('solo se exponen palabras con imagen y cada categoría visible tiene contenido', () => {
    expect(getAllWords().length).toBeGreaterThan(0);
    for (const c of getCategories()) expect(getWordsByCategory(c.id).length).toBeGreaterThanOrEqual(2);
  });

  it('memory solo se ofrece en categorías con al menos 4 palabras', () => {
    for (const c of getCategories()) {
      const n = getWordsByCategory(c.id).length;
      expect(gamesForCategory(c.id, n).some((g) => g.id === 'memory')).toBe(n >= 4);
    }
  });

  it('zapatos y botas, y leche y vaso, son confundibles', () => {
    const w = (id: string) => WORDS.find((x) => x.id === id)!;
    expect(areConfusable(w('ropa_zapatos'), w('ropa_botas'))).toBe(true);
    expect(areConfusable(w('alimentos_leche'), w('casa_vaso'))).toBe(true);
    expect(areConfusable(w('animales_perro'), w('transporte_coche'))).toBe(false);
  });

  it('las referencias "contiene" apuntan a palabras existentes', () => {
    const ids = new Set(WORDS.map((w) => w.id));
    for (const w of WORDS) for (const c of w.contiene ?? []) expect(ids.has(c)).toBe(true);
  });

  it('las frases referencian palabras con foto y sus fichas reconstruyen el texto', () => {
    for (const s of SENTENCES) {
      expect(getWord(s.palabraId)).toBeDefined();
      expect(normalize(s.tokens.join(' '))).toBe(normalize(s.texto));
    }
    expect(getSentences().length).toBe(SENTENCES.length);
  });

  it('los colores de categoría cumplen 4,5:1 con texto blanco', () => {
    for (const c of CATEGORIES) expect(contrast(c.color, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
