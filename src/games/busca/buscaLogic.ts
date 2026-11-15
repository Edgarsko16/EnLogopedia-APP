/**
 * Lógica de "Busca la imagen".
 *
 * Una ronda tiene una palabra objetivo y varios distractores. Reglas:
 *  - El objetivo aparece exactamente una vez, en una posición aleatoria.
 *  - Ningún distractor puede confundirse con el objetivo ni con otro
 *    distractor (ver `areConfusable`).
 *  - La dificultad sube al encadenar aciertos: 2 -> 3 -> 4 -> 6 imágenes.
 */
import { areConfusable } from '@/content/catalog';
import type { Word } from '@/types/content';
import type { Difficulty } from '@/types/settings';
import { randomIndex, shuffle, type Rng } from '@/utils/random';

export const GRID_SIZES = [2, 3, 4, 6] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/** Aciertos seguidos necesarios para pasar al siguiente tamaño de cuadrícula. */
export const STREAK_TO_LEVEL_UP = 3;

export function initialGridSize(difficulty: Difficulty): GridSize {
  return difficulty === 'facil' ? 2 : difficulty === 'media' ? 3 : 4;
}

export interface BuscaRound {
  target: Word;
  /** Opciones en el orden en que se muestran (incluye el objetivo). */
  options: Word[];
  targetIndex: number;
}

/** Elige distractores compatibles entre sí y con el objetivo. */
export function pickDistractors(target: Word, pool: readonly Word[], count: number, rng?: Rng): Word[] {
  const chosen: Word[] = [];
  for (const candidate of shuffle(pool, rng)) {
    if (chosen.length >= count) break;
    if (candidate.id === target.id) continue;
    if (areConfusable(candidate, target)) continue;
    if (chosen.some((c) => areConfusable(c, candidate))) continue;
    chosen.push(candidate);
  }
  return chosen;
}

/**
 * Construye una ronda. Si el banco no tiene suficientes palabras compatibles,
 * la cuadrícula se reduce (nunca se rellena con opciones ambiguas).
 * Devuelve null si no es posible ni siquiera una ronda de 2.
 */
export function buildRound(
  target: Word,
  pool: readonly Word[],
  size: number,
  rng?: Rng,
): BuscaRound | null {
  const distractors = pickDistractors(target, pool, size - 1, rng);
  if (distractors.length < 1) return null;
  const options = shuffle(distractors, rng);
  const targetIndex = randomIndex(options.length + 1, rng);
  options.splice(targetIndex, 0, target);
  return { target, options, targetIndex };
}

/** Comprueba si la opción pulsada es la correcta. */
export function isCorrectChoice(round: BuscaRound, wordId: string): boolean {
  return round.target.id === wordId;
}

/** Calcula el siguiente tamaño de cuadrícula según la racha de aciertos. */
export function nextGridSize(current: GridSize, streak: number): GridSize {
  if (streak < STREAK_TO_LEVEL_UP) return current;
  const i = GRID_SIZES.indexOf(current);
  return GRID_SIZES[Math.min(i + 1, GRID_SIZES.length - 1)];
}

/** Texto de la instrucción: "Busca el perro" / "Busca quién está durmiendo". */
export function instructionFor(word: Word): string {
  if (word.tipo === 'verbo') return word.gerundio ? `Busca quién está ${word.gerundio}` : `Busca: ${word.palabra}`;
  return `Busca ${word.articulo ? `${word.articulo} ` : ''}${word.palabra}`;
}
