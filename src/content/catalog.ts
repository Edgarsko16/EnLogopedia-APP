/**
 * Punto único de acceso al contenido. Las pantallas y los juegos nunca leen
 * WORDS o SENTENCES directamente: pasan por aquí, que filtra lo que no tiene
 * fotografía verificada.
 */
import type { Category, CategoryId, Sentence, Word } from '@/types/content';
import { CATEGORIES } from './categories';
import { hasImage } from './images';
import type { PhonologyOptions } from '@/games/fonologia/fonologiaLogic';
import { PHONEMES, WORD_PHONOLOGY, type Phoneme } from './phonology';
import { ASSOCIATIONS, FUNCTIONS, type Association, type FunctionRelation } from './semantics';
import { SENTENCES } from './sentences';
import { WORDS } from './words';

const AVAILABLE_WORDS: Word[] = WORDS.filter((w) => hasImage(w.imagen));
const BY_ID = new Map(AVAILABLE_WORDS.map((w) => [w.id, w]));

export function getAllWords(): Word[] {
  return AVAILABLE_WORDS;
}

export function getWord(id: string): Word | undefined {
  return BY_ID.get(id);
}

export function getWordsByCategory(categoria: CategoryId): Word[] {
  return AVAILABLE_WORDS.filter((w) => w.categoria === categoria);
}

/** Palabras de una categoría o, si no se indica, de todas. */
export function getWordsFor(categoria?: CategoryId): Word[] {
  return categoria ? getWordsByCategory(categoria) : AVAILABLE_WORDS;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && CATEGORIES.some((c) => c.id === value);
}

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Solo las categorías con al menos una palabra disponible. */
export function getCategories(): Category[] {
  return CATEGORIES.filter((c) => getWordsByCategory(c.id).length > 0);
}

/** Imagen de portada: la indicada si existe, si no la primera palabra disponible. */
export function getCategoryCover(category: Category): string | undefined {
  return (getWord(category.portada) ?? getWordsByCategory(category.id)[0])?.imagen;
}

/** Frases cuya fotografía está disponible. */
export function getSentences(categoria?: CategoryId): Sentence[] {
  return SENTENCES.filter((s) => {
    const w = getWord(s.palabraId);
    return !!w && (!categoria || w.categoria === categoria);
  });
}

/**
 * Dos palabras son confundibles si comparten grupo de confusión o si una
 * aparece en la foto de la otra (p. ej. la foto de "dormir" muestra un gato).
 * Se usa para no presentar dos respuestas válidas a la vez.
 */
export function areConfusable(a: Word, b: Word): boolean {
  if (a.id === b.id) return true;
  if (a.grupoConfusion && a.grupoConfusion === b.grupoConfusion) return true;
  if (a.contiene?.includes(b.id) || b.contiene?.includes(a.id)) return true;
  return false;
}

// ─── Relaciones semánticas ─────────────────────────────────────────────────

/** Funciones con, al menos, una palabra con foto (solo se conservan esas palabras). */
export function getFunctions(): FunctionRelation[] {
  return FUNCTIONS.map((f) => ({ ...f, palabras: f.palabras.filter((id) => BY_ID.has(id)) })).filter(
    (f) => f.palabras.length > 0,
  );
}

/**
 * Asociaciones cuyas dos palabras tienen foto y NO son confundibles entre sí.
 * Si la respuesta aparece en la foto de la pista (el plato lleva un tenedor),
 * el ejercicio se resolvería por coincidencia visual y no por la relación.
 */
export function getAssociations(): Association[] {
  return ASSOCIATIONS.filter((x) => {
    const a = BY_ID.get(x.a);
    const b = BY_ID.get(x.b);
    return !!a && !!b && !areConfusable(a, b);
  });
}

// ─── Fonología ─────────────────────────────────────────────────────────────

/** Opciones para la lógica de fonología con los datos reales del banco. */
export function getPhonologyOptions(seseo: boolean): PhonologyOptions {
  return { seseo, info: WORD_PHONOLOGY, phonemes: PHONEMES, byId: getWord };
}

export function getPhoneme(id: string): Phoneme | undefined {
  return PHONEMES.find((p) => p.id === id);
}
