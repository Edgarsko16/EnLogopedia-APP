import type { GameId } from './games';

/** Resultado acumulado de una palabra en un juego. */
export interface WordResult {
  aciertos: number;
  intentos: number;
  /** Marca de tiempo ISO de la última vez que se practicó. */
  ultimaVez: string;
}

export interface Progress {
  version: 1;
  /** Resultados por juego y por palabra. */
  porJuego: Partial<Record<GameId, Record<string, WordResult>>>;
  /** Mejor número de intentos en memory por número de parejas. */
  memoryMejores: Record<string, number>;
}

export const EMPTY_PROGRESS: Progress = {
  version: 1,
  porJuego: {},
  memoryMejores: {},
};
