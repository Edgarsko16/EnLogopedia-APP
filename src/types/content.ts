/**
 * Tipos del banco de contenido.
 *
 * Una palabra (Word) es la unidad reutilizable: el mismo objeto alimenta
 * el vocabulario, la denominación, el memory, "Busca la imagen" y las frases.
 * Ningún juego guarda copias de palabras; solo referencia su `id`.
 */

export const CATEGORY_IDS = [
  'animales',
  'alimentos',
  'ropa',
  'casa',
  'transporte',
  'acciones',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/** Nivel orientativo de dificultad léxica (frecuencia, longitud, abstracción). */
export type Level = 1 | 2 | 3;

export type WordKind = 'sustantivo' | 'verbo';

/** Artículo determinado que acompaña a la palabra en instrucciones ("Busca el perro"). */
export type Article = 'el' | 'la' | 'los' | 'las';

export interface Word {
  /** Identificador estable, con prefijo de categoría: "animales_perro". */
  id: string;
  /** Forma escrita y locutada: "perro", "cepillo de dientes", "comer". */
  palabra: string;
  categoria: CategoryId;
  tipo: WordKind;
  /** Solo para sustantivos. */
  articulo?: Article;
  /** Solo para verbos: forma en gerundio para instrucciones ("durmiendo"). */
  gerundio?: string;
  /** Clave de la fotografía en el registro de imágenes (src/content/images.ts). */
  imagen: string;
  nivel: Level;
  silabas: number;
  /** Fonema inicial en notación sencilla (no AFI estricto): "p", "ch", "rr"... */
  fonemaInicial: string;
  descripcion: string;
  /** Frases modelo generales sobre el concepto (no ligadas a la foto). */
  frases: string[];
  /**
   * Grupo de confusión: palabras del mismo grupo no aparecen juntas como
   * distractores (p. ej. "zapatos" y "botas" son ambos calzado).
   */
  grupoConfusion?: string;
  /**
   * Identificadores de otras palabras que aparecen visiblemente en la foto
   * (p. ej. la foto de "dormir" muestra un gato). Evita respuestas ambiguas.
   */
  contiene?: string[];
}

export interface Category {
  id: CategoryId;
  nombre: string;
  descripcion: string;
  /** Id de la palabra cuya foto representa a la categoría. */
  portada: string;
  /** Color de acento de la categoría (decorativo, nunca única señal). */
  color: string;
  icono: string;
}

/**
 * Frase ligada a una fotografía concreta. Solo se crean frases que
 * describen lo que se ve realmente en la imagen (revisado a mano).
 */
export interface Sentence {
  id: string;
  /** Id de la palabra (normalmente una acción) cuya foto ilustra la frase. */
  palabraId: string;
  texto: string;
  /** Palabras en orden correcto para el juego de ordenar. */
  tokens: string[];
  nivel: Level;
  /**
   * Para "Completa la frase": posición del token que se oculta y opciones
   * incorrectas. Los distractores se escriben a mano mirando la foto: deben
   * concordar gramaticalmente y NO describir lo que se ve.
   */
  hueco?: SentenceGap;
}

export interface SentenceGap {
  indice: number;
  distractores: string[];
}

/** Atribución de una fotografía (se genera a partir de docs/licencias-imagenes.csv). */
export interface ImageCredit {
  archivo: string;
  concepto: string;
  autor: string;
  fuente: string;
  url: string;
  licencia: string;
  urlLicencia: string;
  /** commons, propia o encargada (ver assets/images/registro.json). */
  origen: ImageOrigin;
  observaciones: string;
}

export type ImageOrigin = 'commons' | 'propia' | 'encargada';
