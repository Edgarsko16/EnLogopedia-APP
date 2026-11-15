/**
 * Lógica del juego "Frases y acciones", modalidad "ordena las palabras".
 *
 * Las palabras se representan como fichas con id propio, para que una frase
 * con palabras repetidas ("el niño y el perro") funcione bien.
 */
import type { Sentence } from '@/types/content';
import { normalize } from '@/utils/text';
import { shuffle, type Rng } from '@/utils/random';

export interface WordChip {
  id: string;
  text: string;
}

export function chipsFor(sentence: Sentence): WordChip[] {
  return sentence.tokens.map((text, i) => ({ id: `${sentence.id}-${i}`, text }));
}

/**
 * Baraja las fichas asegurando que no queden ya en el orden correcto
 * (si la frase tiene más de una palabra distinta).
 */
export function scrambledChips(sentence: Sentence, rng?: Rng): WordChip[] {
  const chips = chipsFor(sentence);
  const distinct = new Set(sentence.tokens.map(normalize)).size;
  if (distinct < 2) return chips;
  for (let i = 0; i < 20; i++) {
    const s = shuffle(chips, rng);
    if (!isCorrectOrder(sentence, s.map((c) => c.text))) return s;
  }
  // Último recurso determinista: rotar una posición.
  return [...chips.slice(1), chips[0]];
}

/**
 * Valida la frase construida comparando palabra a palabra, sin distinguir
 * mayúsculas ni tildes (lo que se evalúa es el orden, no la ortografía).
 */
export function isCorrectOrder(sentence: Sentence, built: readonly string[]): boolean {
  if (built.length !== sentence.tokens.length) return false;
  return sentence.tokens.every((t, i) => normalize(t) === normalize(built[i]));
}

/** Cuántas palabras iniciales están ya bien colocadas (para dar pistas). */
export function correctPrefixLength(sentence: Sentence, built: readonly string[]): number {
  let n = 0;
  while (n < built.length && n < sentence.tokens.length && normalize(built[n]) === normalize(sentence.tokens[n])) n++;
  return n;
}

// ─── Modalidad "¿Qué frase es?" ─────────────────────────────────────────────

export interface ChoiceRound {
  sentence: Sentence;
  /** Frases mostradas como opciones (incluye la correcta), ya barajadas. */
  options: Sentence[];
}

/**
 * Construye una ronda de elección: la frase de la foto y `count - 1` frases
 * de OTRAS fotos (nunca de la misma, para que solo haya una respuesta válida).
 */
export function buildChoiceRound(
  sentence: Sentence,
  pool: readonly Sentence[],
  count = 3,
  rng?: Rng,
): ChoiceRound {
  const others = shuffle(
    pool.filter((s) => s.palabraId !== sentence.palabraId),
    rng,
  );
  const distractors: Sentence[] = [];
  for (const s of others) {
    if (distractors.length >= count - 1) break;
    if (distractors.some((d) => d.palabraId === s.palabraId)) continue;
    distractors.push(s);
  }
  return { sentence, options: shuffle([sentence, ...distractors], rng) };
}

// ─── Modalidad "Completa la frase" ──────────────────────────────────────────

export interface GapRound {
  sentence: Sentence;
  /** Fichas antes y después del hueco, para pintarlas. */
  before: string[];
  after: string[];
  answer: string;
  /** Opciones barajadas (incluye la correcta). */
  options: string[];
}

/** Construye la ronda de completar, o null si la frase no tiene hueco definido. */
export function buildGapRound(sentence: Sentence, maxOptions = 3, rng?: Rng): GapRound | null {
  const gap = sentence.hueco;
  if (!gap || gap.indice < 0 || gap.indice >= sentence.tokens.length) return null;
  const answer = sentence.tokens[gap.indice];
  const distractors = shuffle(
    gap.distractores.filter((d) => normalize(d) !== normalize(answer)),
    rng,
  ).slice(0, Math.max(1, maxOptions - 1));
  return {
    sentence,
    before: sentence.tokens.slice(0, gap.indice),
    after: sentence.tokens.slice(gap.indice + 1),
    answer,
    options: shuffle([answer, ...distractors], rng),
  };
}

export function isGapAnswer(round: GapRound, option: string): boolean {
  return normalize(round.answer) === normalize(option);
}

/** Filtra frases por nivel según la dificultad (si quedan menos de `min`, se usan todas). */
export function sentencesForDifficulty(sentences: readonly Sentence[], difficulty: 'facil' | 'media' | 'dificil', min = 4): Sentence[] {
  const maxLevel = difficulty === 'facil' ? 1 : difficulty === 'media' ? 2 : 3;
  const filtered = sentences.filter((s) => s.nivel <= maxLevel);
  return filtered.length >= min ? filtered : [...sentences];
}

/**
 * Fichas para "Construye la frase". En dificultad alta se añade una ficha
 * de más (un distractor del hueco) que no debe usarse.
 */
export function buildChips(sentence: Sentence, withExtra: boolean, rng?: Rng): WordChip[] {
  const chips = scrambledChips(sentence, rng);
  const extra = withExtra ? sentence.hueco?.distractores[0] : undefined;
  if (!extra) return chips;
  return shuffle([...chips, { id: `${sentence.id}-extra`, text: extra }], rng);
}
