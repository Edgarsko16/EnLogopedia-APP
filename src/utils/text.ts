/** Normaliza texto para comparar respuestas: minúsculas, sin tildes ni signos. */
export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pone en mayúscula la primera letra. */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('es-ES') + text.slice(1);
}

/** Plural sencillo para contadores: "1 palabra", "3 palabras". */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** "el perro", "la cama"; si no hay artículo (verbos), solo la palabra. */
export function withArticle(word: { palabra: string; articulo?: string }): string {
  return word.articulo ? `${word.articulo} ${word.palabra}` : word.palabra;
}
