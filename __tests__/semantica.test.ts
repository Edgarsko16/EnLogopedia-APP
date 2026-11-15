import { areConfusable, getAllWords, getAssociations, getFunctions, getWord } from '@/content/catalog';
import { ASSOCIATIONS, FUNCTIONS } from '@/content/semantics';
import { WORDS } from '@/content/words';
import {
  buildAssociationRound,
  buildCategorizeSession,
  buildFunctionImageRound,
  buildFunctionTextRound,
  buildOddOneOutRound,
  isAmbiguousForCategories,
  objectWords,
  wordsWithFunction,
} from '@/games/semantica/semanticaLogic';
import { seededRng } from '@/utils/random';

const words = getAllWords();
const SEEDS = Array.from({ length: 60 }, (_, i) => i);

describe('datos semánticos', () => {
  const ids = new Set(WORDS.map((w) => w.id));

  it('todas las relaciones apuntan a palabras existentes', () => {
    for (const f of FUNCTIONS) for (const id of [...f.palabras, ...(f.noDistractores ?? [])]) expect(ids.has(id)).toBe(true);
    for (const a of ASSOCIATIONS) for (const id of a.noDistractores ?? []) expect(ids.has(id)).toBe(true);
    for (const a of ASSOCIATIONS) {
      expect(ids.has(a.a)).toBe(true);
      expect(ids.has(a.b)).toBe(true);
    }
  });

  it('hay contenido suficiente con las fotos actuales', () => {
    expect(getFunctions().length).toBeGreaterThanOrEqual(4);
    expect(getAssociations().length).toBeGreaterThanOrEqual(4);
  });
});

describe('categorizar', () => {
  it('descarta fotos que contienen palabras de otra categoría en juego', () => {
    const dormir = getWord('acciones_dormir')!; // la foto muestra un gato
    expect(isAmbiguousForCategories(dormir, ['acciones', 'animales'], getWord)).toBe(true);
    expect(isAmbiguousForCategories(dormir, ['acciones', 'transporte'], getWord)).toBe(false);
  });

  it('la sesión solo contiene palabras de las categorías elegidas y sin ambigüedad', () => {
    for (const seed of SEEDS) {
      const items = buildCategorizeSession(words, ['acciones', 'animales'], 4, getWord, seededRng(seed));
      expect(items.length).toBeGreaterThan(0);
      for (const w of items) {
        expect(['acciones', 'animales']).toContain(w.categoria);
        expect(isAmbiguousForCategories(w, ['acciones', 'animales'], getWord)).toBe(false);
      }
    }
  });
});

describe('¿cuál no pertenece?', () => {
  it('hay exactamente una intrusa y no es confundible con el grupo', () => {
    for (const seed of SEEDS) {
      const r = buildOddOneOutRound(words, areConfusable, 3, seededRng(seed))!;
      expect(r).not.toBeNull();
      const odd = r.options.filter((w) => w.categoria !== r.grupo);
      expect(odd).toHaveLength(1);
      expect(odd[0].id).toBe(r.answerId);
      const group = r.options.filter((w) => w.categoria === r.grupo);
      for (const g of group) expect(areConfusable(g, odd[0])).toBe(false);
    }
  });
});

describe('asociaciones', () => {
  it('excluye parejas que se resolverían por la foto (la respuesta aparece en la pista)', () => {
    const ids = getAssociations().map((a) => a.id);
    expect(ids).not.toContain('plato-tenedor');
    expect(ids).not.toContain('mesa-silla');
    for (const a of getAssociations()) expect(areConfusable(getWord(a.a)!, getWord(a.b)!)).toBe(false);
  });

  it('la única opción asociada a la pista es la respuesta', () => {
    const all = getAssociations();
    for (const a of all) {
      for (const seed of SEEDS.slice(0, 20)) {
        const r = buildAssociationRound(a, all, words, getWord, areConfusable, 3, seededRng(seed))!;
        expect(r.options.filter((w) => w.id === a.b)).toHaveLength(1);
        const partners = all.filter((x) => x.a === a.a || x.b === a.a).map((x) => (x.a === a.a ? x.b : x.a));
        const valid = r.options.filter((w) => partners.includes(w.id));
        expect(valid.map((w) => w.id)).toEqual([a.b]);
        expect(r.options.some((w) => w.id === a.a)).toBe(false);
        expect(r.options.some((w) => a.noDistractores?.includes(w.id))).toBe(false);
      }
    }
  });
});

describe('funciones', () => {
  const fns = getFunctions();

  it('«¿Qué usamos para…?» solo tiene una imagen que cumple la función', () => {
    for (const f of fns) {
      for (const seed of SEEDS.slice(0, 20)) {
        const r = buildFunctionImageRound(f, objectWords(words), getWord, areConfusable, 3, seededRng(seed))!;
        expect(r).not.toBeNull();
        const valid = r.options.filter((w) => f.palabras.includes(w.id));
        expect(valid).toHaveLength(1);
        expect(r.options.some((w) => f.noDistractores?.includes(w.id))).toBe(false);
        // Ningún distractor contiene en su foto un objeto que cumpla la función.
        for (const w of r.options) if (w.id !== r.answerId) expect(f.palabras.some((p) => w.contiene?.includes(p))).toBe(false);
      }
    }
  });

  it('el plato (que lleva un tenedor en la foto) no es distractor de «pinchar la comida»', () => {
    const pinchar = fns.find((f) => f.id === 'pinchar')!;
    for (const seed of SEEDS) {
      const r = buildFunctionImageRound(pinchar, objectWords(words), getWord, areConfusable, 4, seededRng(seed))!;
      expect(r.options.map((w) => w.id)).not.toContain('casa_plato');
    }
  });

  it('«¿Para qué sirve…?» tiene una única función correcta', () => {
    for (const w of wordsWithFunction(words, fns)) {
      const r = buildFunctionTextRound(w, fns, 3, seededRng(1))!;
      const correct = r.options.filter((f) => f.palabras.includes(w.id) || f.noDistractores?.includes(w.id));
      expect(correct).toHaveLength(1);
      expect(correct[0].id).toBe(r.answerId);
    }
  });
});
