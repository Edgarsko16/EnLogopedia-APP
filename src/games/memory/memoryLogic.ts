/**
 * Lógica del juego de memory (emparejar fotografías iguales).
 *
 * Es un "reducer": una función pura (estado, acción) => nuevo estado.
 * La pantalla solo despacha acciones; toda la regla del juego vive aquí,
 * así se puede probar sin interfaz.
 *
 * Flujo:
 *  1. FLIP de la primera carta  -> queda revelada.
 *  2. FLIP de la segunda carta  -> se cuenta un intento.
 *     - Si coinciden: ambas pasan a "matched".
 *     - Si no: el tablero se bloquea (locked) hasta que llega RESOLVE.
 *  3. RESOLVE (tras una breve pausa) oculta las dos cartas y desbloquea.
 */
import { shuffle, type Rng } from '@/utils/random';

export const MEMORY_LEVELS = [4, 6, 8, 12] as const;
export type MemoryLevel = (typeof MEMORY_LEVELS)[number];

export type CardStatus = 'hidden' | 'revealed' | 'matched';

export interface MemoryCard {
  /** Id único de la carta en el tablero. */
  uid: string;
  /** Id de la palabra: dos cartas con el mismo wordId forman pareja. */
  wordId: string;
  status: CardStatus;
}

export interface MemoryState {
  cards: MemoryCard[];
  /** uids de las cartas reveladas en el turno actual (0, 1 o 2). */
  selected: string[];
  attempts: number;
  /** Bloqueado mientras se muestran dos cartas que no coinciden. */
  locked: boolean;
  finished: boolean;
}

export type MemoryAction =
  | { type: 'FLIP'; uid: string }
  | { type: 'RESOLVE' }
  | { type: 'NEW_GAME'; wordIds: string[]; rng?: Rng };

/** Crea un tablero con dos cartas por palabra, barajadas. */
export function createDeck(wordIds: readonly string[], rng?: Rng): MemoryCard[] {
  const unique = [...new Set(wordIds)];
  const cards = unique.flatMap((wordId) => [
    { uid: `${wordId}#a`, wordId, status: 'hidden' as const },
    { uid: `${wordId}#b`, wordId, status: 'hidden' as const },
  ]);
  return shuffle(cards, rng);
}

export function createMemoryState(wordIds: readonly string[], rng?: Rng): MemoryState {
  return { cards: createDeck(wordIds, rng), selected: [], attempts: 0, locked: false, finished: false };
}

/** ¿Se puede pulsar esta carta ahora mismo? */
export function canFlip(state: MemoryState, uid: string): boolean {
  if (state.locked || state.finished) return false;
  const card = state.cards.find((c) => c.uid === uid);
  return !!card && card.status === 'hidden' && state.selected.length < 2;
}

export function memoryReducer(state: MemoryState, action: MemoryAction): MemoryState {
  switch (action.type) {
    case 'NEW_GAME':
      return createMemoryState(action.wordIds, action.rng);

    case 'FLIP': {
      if (!canFlip(state, action.uid)) return state;
      const cards = state.cards.map((c) => (c.uid === action.uid ? { ...c, status: 'revealed' as const } : c));
      const selected = [...state.selected, action.uid];
      if (selected.length < 2) return { ...state, cards, selected };

      const [a, b] = selected.map((uid) => cards.find((c) => c.uid === uid)!);
      const attempts = state.attempts + 1;
      if (a.wordId === b.wordId) {
        const matched = cards.map((c) =>
          c.uid === a.uid || c.uid === b.uid ? { ...c, status: 'matched' as const } : c,
        );
        return {
          cards: matched,
          selected: [],
          attempts,
          locked: false,
          finished: matched.every((c) => c.status === 'matched'),
        };
      }
      return { ...state, cards, selected, attempts, locked: true };
    }

    case 'RESOLVE': {
      if (!state.locked) return state;
      const cards = state.cards.map((c) =>
        state.selected.includes(c.uid) && c.status === 'revealed' ? { ...c, status: 'hidden' as const } : c,
      );
      return { ...state, cards, selected: [], locked: false };
    }

    default:
      return state;
  }
}

export function matchedPairs(state: MemoryState): number {
  return state.cards.filter((c) => c.status === 'matched').length / 2;
}

/** Número de columnas recomendado para el tablero según el número de cartas. */
export function columnsFor(cardCount: number, wide: boolean): number {
  if (wide) return cardCount <= 8 ? 4 : cardCount <= 16 ? 6 : 8;
  if (cardCount <= 8) return 2;
  if (cardCount <= 12) return 3;
  return 4;
}
