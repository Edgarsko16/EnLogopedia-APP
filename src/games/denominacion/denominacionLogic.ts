/**
 * Lógica de la denominación: el usuario nombra oralmente la foto y el adulto
 * (o el propio usuario) marca si lo ha conseguido. No hay reconocimiento de voz.
 */
import type { Word } from '@/types/content';
import { shuffle, type Rng } from '@/utils/random';

export type NamingMark = 'conseguida' | 'pendiente';

export interface NamingSession {
  /** Ids de palabras en el orden de la sesión. */
  order: string[];
  index: number;
  revealed: boolean;
  marks: Record<string, NamingMark>;
}

export function createNamingSession(words: readonly Word[], rng?: Rng): NamingSession {
  return { order: shuffle(words.map((w) => w.id), rng), index: 0, revealed: false, marks: {} };
}

export function currentWordId(s: NamingSession): string | undefined {
  return s.order[s.index];
}

export function reveal(s: NamingSession): NamingSession {
  return { ...s, revealed: true };
}

export function mark(s: NamingSession, value: NamingMark): NamingSession {
  const id = currentWordId(s);
  if (!id) return s;
  return { ...s, marks: { ...s.marks, [id]: value } };
}

export function next(s: NamingSession): NamingSession {
  return { ...s, index: Math.min(s.index + 1, s.order.length), revealed: false };
}

export function isFinished(s: NamingSession): boolean {
  return s.index >= s.order.length;
}

/** Nueva ronda solo con las palabras marcadas como pendientes (o sin marcar). */
export function retryPending(s: NamingSession, rng?: Rng): NamingSession {
  const pending = s.order.filter((id) => s.marks[id] !== 'conseguida');
  return { order: shuffle(pending, rng), index: 0, revealed: false, marks: {} };
}

export function summary(s: NamingSession): { conseguidas: number; pendientes: number; total: number } {
  const values = s.order.map((id) => s.marks[id]);
  const conseguidas = values.filter((v) => v === 'conseguida').length;
  return { conseguidas, pendientes: s.order.length - conseguidas, total: s.order.length };
}

/** Número máximo de fotos por sesión, para sesiones cortas y abarcables. */
export const SESSION_LENGTH = 10;

/**
 * Filtra por nivel léxico según la dificultad elegida. Si el filtro deja
 * menos de `min` palabras, se usan todas (mejor practicar que bloquear).
 */
export function wordsForDifficulty(words: readonly Word[], difficulty: 'facil' | 'media' | 'dificil', min = 4): Word[] {
  const maxLevel = difficulty === 'facil' ? 1 : difficulty === 'media' ? 2 : 3;
  const filtered = words.filter((w) => w.nivel <= maxLevel);
  return filtered.length >= min ? filtered : [...words];
}
