/**
 * Lógica de los ejercicios de semántica: categorizar, "¿cuál no pertenece?",
 * asociaciones y funciones.
 *
 * Funciones puras (sin interfaz) que reciben el banco de palabras y las
 * relaciones como parámetros, para poder probarlas con datos de ejemplo.
 *
 * Regla común: nunca puede haber más de una respuesta válida. Por eso se
 * descartan las palabras confundibles (`areConfusable`: mismo grupo de
 * confusión o una aparece en la foto de la otra, como el gato en "dormir").
 */
import type { Association, FunctionRelation } from '@/content/semantics';
import type { CategoryId, Word } from '@/types/content';
import { sample, shuffle, type Rng } from '@/utils/random';

export type Confusable = (a: Word, b: Word) => boolean;

/** Ronda de elegir una imagen entre varias. */
export interface ImageChoiceRound {
  options: Word[];
  answerId: string;
}

// ─── Categorizar ────────────────────────────────────────────────────────────

/** Una palabra es ambigua para categorizar si su foto contiene una palabra de otra categoría en juego. */
export function isAmbiguousForCategories(word: Word, categories: readonly CategoryId[], byId: (id: string) => Word | undefined): boolean {
  return (word.contiene ?? []).some((id) => {
    const other = byId(id);
    return !!other && other.categoria !== word.categoria && categories.includes(other.categoria);
  });
}

/**
 * Prepara una sesión de categorizar: `perCategory` palabras de cada categoría,
 * barajadas, sin palabras ambiguas.
 */
export function buildCategorizeSession(
  pool: readonly Word[],
  categories: readonly CategoryId[],
  perCategory: number,
  byId: (id: string) => Word | undefined,
  rng?: Rng,
): Word[] {
  const items = categories.flatMap((c) =>
    sample(
      pool.filter((w) => w.categoria === c && !isAmbiguousForCategories(w, categories, byId)),
      perCategory,
      rng,
    ),
  );
  return shuffle(items, rng);
}

/** Elige `count` categorías distintas con al menos `min` palabras cada una. */
export function pickCategories(pool: readonly Word[], count: number, min: number, rng?: Rng): CategoryId[] {
  const counts = new Map<CategoryId, number>();
  for (const w of pool) counts.set(w.categoria, (counts.get(w.categoria) ?? 0) + 1);
  const eligible = [...counts.entries()].filter(([, n]) => n >= min).map(([c]) => c);
  return sample(eligible, count, rng);
}

// ─── ¿Cuál no pertenece? ────────────────────────────────────────────────────

export interface OddOneOutRound extends ImageChoiceRound {
  /** Categoría a la que pertenecen las demás imágenes. */
  grupo: CategoryId;
}

/**
 * Tres (o `groupSize`) palabras de una misma categoría y una intrusa de otra.
 * La intrusa no puede ser confundible con ninguna del grupo, y las del grupo
 * no pueden ser confundibles entre sí (si no, la respuesta sería discutible).
 */
export function buildOddOneOutRound(
  pool: readonly Word[],
  confusable: Confusable,
  groupSize = 3,
  rng?: Rng,
): OddOneOutRound | null {
  for (const grupo of pickCategories(pool, 6, groupSize, rng)) {
    const group: Word[] = [];
    for (const w of shuffle(pool.filter((x) => x.categoria === grupo), rng)) {
      if (group.length >= groupSize) break;
      if (!group.some((g) => confusable(g, w))) group.push(w);
    }
    if (group.length < groupSize) continue;
    const odd = shuffle(pool.filter((w) => w.categoria !== grupo), rng).find(
      (w) => !group.some((g) => confusable(g, w)),
    );
    if (!odd) continue;
    return { grupo, answerId: odd.id, options: shuffle([...group, odd], rng) };
  }
  return null;
}

// ─── Asociaciones ───────────────────────────────────────────────────────────

export interface AssociationRound extends ImageChoiceRound {
  association: Association;
  cue: Word;
}

/**
 * Muestra la palabra `a` y pide elegir su pareja `b` entre varias imágenes.
 * Los distractores no pueden ser otra pareja válida de `a` en ninguna
 * asociación, ni confundibles con la pista o con la respuesta.
 */
export function buildAssociationRound(
  association: Association,
  all: readonly Association[],
  pool: readonly Word[],
  byId: (id: string) => Word | undefined,
  confusable: Confusable,
  count = 3,
  rng?: Rng,
): AssociationRound | null {
  const cue = byId(association.a);
  const answer = byId(association.b);
  if (!cue || !answer) return null;
  const partners = new Set(
    all.flatMap((x) => (x.a === cue.id ? [x.b] : x.b === cue.id ? [x.a] : [])),
  );
  const distractors: Word[] = [];
  for (const w of shuffle(pool, rng)) {
    if (distractors.length >= count - 1) break;
    if (w.id === cue.id || w.id === answer.id || partners.has(w.id)) continue;
    if (association.noDistractores?.includes(w.id)) continue;
    if (confusable(w, cue) || confusable(w, answer)) continue;
    if (distractors.some((d) => confusable(d, w))) continue;
    distractors.push(w);
  }
  if (distractors.length < 1) return null;
  return { association, cue, answerId: answer.id, options: shuffle([answer, ...distractors], rng) };
}

// ─── Funciones ──────────────────────────────────────────────────────────────

export interface FunctionImageRound extends ImageChoiceRound {
  fn: FunctionRelation;
}

/**
 * "¿Qué usamos para …?": una imagen correcta y distractores que NO cumplen
 * esa función ni contienen en su foto un objeto que la cumpla (el plato lleva
 * un tenedor encima: no sirve de distractor para "pinchar la comida").
 */
export function buildFunctionImageRound(
  fn: FunctionRelation,
  pool: readonly Word[],
  byId: (id: string) => Word | undefined,
  confusable: Confusable,
  count = 3,
  rng?: Rng,
): FunctionImageRound | null {
  const answer = byId(sample(fn.palabras, 1, rng)[0] ?? '');
  if (!answer) return null;
  const valid = fn.palabras.map(byId).filter((w): w is Word => !!w);
  const distractors: Word[] = [];
  for (const w of shuffle(pool, rng)) {
    if (distractors.length >= count - 1) break;
    if (fn.palabras.includes(w.id) || fn.noDistractores?.includes(w.id)) continue;
    if (valid.some((v) => confusable(v, w))) continue;
    if (distractors.some((d) => confusable(d, w))) continue;
    distractors.push(w);
  }
  if (distractors.length < 1) return null;
  return { fn, answerId: answer.id, options: shuffle([answer, ...distractors], rng) };
}

export interface FunctionTextRound {
  word: Word;
  /** Textos de función mostrados (incluye el correcto). */
  options: FunctionRelation[];
  answerId: string;
}

/** "¿Para qué sirve…?": elegir el uso correcto entre varios textos. */
export function buildFunctionTextRound(
  word: Word,
  functions: readonly FunctionRelation[],
  count = 3,
  rng?: Rng,
): FunctionTextRound | null {
  const own = functions.filter((f) => f.palabras.includes(word.id));
  if (own.length === 0) return null;
  const answer = sample(own, 1, rng)[0];
  const others = sample(
    functions.filter((f) => !f.palabras.includes(word.id) && !f.noDistractores?.includes(word.id)),
    count - 1,
    rng,
  );
  if (others.length < 1) return null;
  return { word, answerId: answer.id, options: shuffle([answer, ...others], rng) };
}

/** Palabras del banco que tienen alguna función definida (para "¿Para qué sirve?"). */
export function wordsWithFunction(pool: readonly Word[], functions: readonly FunctionRelation[]): Word[] {
  const ids = new Set(functions.flatMap((f) => f.palabras));
  return pool.filter((w) => ids.has(w.id));
}

/** Objetos (no animales ni acciones): distractores razonables para "¿Qué usamos para…?". */
export function objectWords(pool: readonly Word[]): Word[] {
  return pool.filter((w) => w.categoria !== 'animales' && w.categoria !== 'acciones');
}
