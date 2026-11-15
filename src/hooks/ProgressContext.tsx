import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addMemoryBest,
  addResult,
  loadProgress,
  resetProgress as clearStoredProgress,
  saveProgress,
} from '@/storage/progressStorage';
import type { GameId } from '@/types/games';
import { EMPTY_PROGRESS, type Progress } from '@/types/progress';

interface ProgressContextValue {
  progress: Progress;
  recordResult: (game: GameId, wordId: string, correct: boolean) => void;
  recordMemory: (pairs: number, attempts: number) => void;
  resetProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Guarda en el dispositivo un progreso básico (aciertos por palabra y juego). */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);

  useEffect(() => {
    let active = true;
    loadProgress().then((p) => active && setProgress(p));
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = fn(prev);
      if (next !== prev) void saveProgress(next);
      return next;
    });
  }, []);

  const recordResult = useCallback(
    (game: GameId, wordId: string, correct: boolean) => commit((p) => addResult(p, game, wordId, correct)),
    [commit],
  );

  const recordMemory = useCallback(
    (pairs: number, attempts: number) => commit((p) => addMemoryBest(p, pairs, attempts)),
    [commit],
  );

  const resetProgress = useCallback(async () => {
    await clearStoredProgress();
    setProgress({ ...EMPTY_PROGRESS, porJuego: {}, memoryMejores: {} });
  }, []);

  const value = useMemo(
    () => ({ progress, recordResult, recordMemory, resetProgress }),
    [progress, recordResult, recordMemory, resetProgress],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress debe usarse dentro de <ProgressProvider>');
  return ctx;
}
