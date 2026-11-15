/**
 * Lógica de fonología por fonema.
 *
 * Primera versión: posición INICIAL. La API ya recibe la posición para que
 * añadir medial/final sea cuestión de completar datos (WordPhonology.fonemas)
 * y `phonemeAt`, sin cambiar las pantallas.
 *
 * Criterios para evitar respuestas dudosas en Identificar y Clasificar:
 *  - Solo sustantivos: una foto de acción se nombra a menudo por lo que
 *    aparece (la foto de "dormir" es un gato), no por el verbo.
 *  - Se excluyen las palabras marcadas como dudosas (WordPhonology.duda).
 *  - Se excluyen las fotos que contienen otra palabra del banco con un
 *    fonema inicial distinto al de la propia palabra (el niño podría
 *    nombrar el objeto secundario: en la foto del plato hay un tenedor).
 */
import type { Phoneme, PhonemePosition, WordPhonology } from '@/content/phonology';
import type { Word } from '@/types/content';
import { sample, shuffle, type Rng } from '@/utils/random';

export interface PhonologyOptions {
  seseo: boolean;
  /** Información fonológica por palabra (WORD_PHONOLOGY). */
  info: Record<string, WordPhonology>;
  /** Inventario de fonemas (PHONEMES). */
  phonemes: readonly Phoneme[];
  /** Busca una palabra por id (para revisar `contiene`). */
  byId: (id: string) => Word | undefined;
}

/** Fonema en una posición. Solo 'inicial' está implementada; el resto devuelve undefined. */
export function phonemeAt(word: Word, position: PhonemePosition, opts: Pick<PhonologyOptions, 'seseo' | 'phonemes'>): string | undefined {
  if (position !== 'inicial') return undefined;
  const id = word.fonemaInicial;
  if (!opts.seseo) return id;
  return opts.phonemes.find((p) => p.id === id)?.conSeseo ?? id;
}

/** ¿Se puede usar esta palabra en ejercicios de discriminación (identificar/clasificar)? */
export function isUsableForDiscrimination(word: Word, opts: PhonologyOptions): boolean {
  if (word.tipo !== 'sustantivo') return false;
  if (opts.info[word.id]?.duda) return false;
  const own = phonemeAt(word, 'inicial', opts);
  return (word.contiene ?? []).every((id) => {
    const other = opts.byId(id);
    return !other || phonemeAt(other, 'inicial', opts) === own;
  });
}

/** Palabras (todas, para el repaso) cuyo fonema inicial es `phonemeId`. */
export function wordsWithPhoneme(pool: readonly Word[], phonemeId: string, opts: PhonologyOptions): Word[] {
  return pool.filter((w) => phonemeAt(w, 'inicial', opts) === phonemeId);
}

export interface PhonemeAvailability {
  phoneme: Phoneme;
  /** Palabras con foto que empiezan por este fonema (incluye dudosas y verbos). */
  total: number;
  /** Las que se pueden usar en identificar/clasificar. */
  usable: number;
}

/** Fonemas que aparecen en el banco actual, en el orden del inventario. */
export function availablePhonemes(pool: readonly Word[], opts: PhonologyOptions): PhonemeAvailability[] {
  return opts.phonemes
    .map((phoneme) => {
      const words = wordsWithPhoneme(pool, phoneme.id, opts);
      return { phoneme, total: words.length, usable: words.filter((w) => isUsableForDiscrimination(w, opts)).length };
    })
    .filter((a) => a.total > 0);
}

export interface IdentifyRound {
  options: Word[];
  answerId: string;
}

/**
 * "¿Cuál empieza por /x/?": una palabra con el fonema y `count - 1` sin él.
 * Todas utilizables para discriminación.
 */
export function buildIdentifyRound(
  pool: readonly Word[],
  phonemeId: string,
  count: number,
  opts: PhonologyOptions,
  rng?: Rng,
): IdentifyRound | null {
  const usable = pool.filter((w) => isUsableForDiscrimination(w, opts));
  const target = sample(usable.filter((w) => phonemeAt(w, 'inicial', opts) === phonemeId), 1, rng)[0];
  if (!target) return null;
  const distractors = sample(
    usable.filter((w) => phonemeAt(w, 'inicial', opts) !== phonemeId),
    count - 1,
    rng,
  );
  if (distractors.length < 1) return null;
  return { answerId: target.id, options: shuffle([target, ...distractors], rng) };
}

/**
 * "Clasificar": mezcla de palabras que empiezan por el fonema y que no.
 * Intenta repartir mitad y mitad (limitado por las disponibles).
 */
export function buildClassifySession(
  pool: readonly Word[],
  phonemeId: string,
  size: number,
  opts: PhonologyOptions,
  rng?: Rng,
): Word[] {
  const usable = pool.filter((w) => isUsableForDiscrimination(w, opts));
  const yes = usable.filter((w) => phonemeAt(w, 'inicial', opts) === phonemeId);
  const no = usable.filter((w) => phonemeAt(w, 'inicial', opts) !== phonemeId);
  const nYes = Math.min(yes.length, Math.ceil(size / 2));
  const nNo = Math.min(no.length, size - nYes);
  return shuffle([...sample(yes, nYes, rng), ...sample(no, nNo, rng)], rng);
}

/** Etiqueta para mostrar un fonema: "/θ/ (z, ce, ci)". */
export function phonemeLabel(p: Phoneme): string {
  return `/${p.ipa}/`;
}
