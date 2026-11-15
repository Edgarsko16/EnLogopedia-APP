import type { GameId } from '@/types/games';
import { EMPTY_PROGRESS, type Progress } from '@/types/progress';
import { readJson, removeKey, STORAGE_KEYS, writeJson } from './keyValue';

export async function loadProgress(): Promise<Progress> {
  const data = await readJson<Progress | null>(STORAGE_KEYS.progress, null);
  if (!data || data.version !== 1) return { ...EMPTY_PROGRESS, porJuego: {}, memoryMejores: {} };
  return {
    version: 1,
    porJuego: data.porJuego ?? {},
    memoryMejores: data.memoryMejores ?? {},
  };
}

/** Función pura: devuelve un progreso nuevo con el resultado añadido. */
export function addResult(
  progress: Progress,
  game: GameId,
  wordId: string,
  correct: boolean,
  now: Date = new Date(),
): Progress {
  const gameResults = { ...(progress.porJuego[game] ?? {}) };
  const prev = gameResults[wordId] ?? { aciertos: 0, intentos: 0, ultimaVez: '' };
  gameResults[wordId] = {
    aciertos: prev.aciertos + (correct ? 1 : 0),
    intentos: prev.intentos + 1,
    ultimaVez: now.toISOString(),
  };
  return { ...progress, porJuego: { ...progress.porJuego, [game]: gameResults } };
}

/** Función pura: guarda el mejor resultado (menos intentos) de memory. */
export function addMemoryBest(progress: Progress, pairs: number, attempts: number): Progress {
  const key = String(pairs);
  const prev = progress.memoryMejores[key];
  if (prev != null && prev <= attempts) return progress;
  return { ...progress, memoryMejores: { ...progress.memoryMejores, [key]: attempts } };
}

export async function saveProgress(progress: Progress): Promise<boolean> {
  return writeJson(STORAGE_KEYS.progress, progress);
}

export async function resetProgress(): Promise<void> {
  await removeKey(STORAGE_KEYS.progress);
}
