/**
 * Datos de fonología.
 *
 * - PHONEMES: inventario de fonemas del español usados por el banco. El `id`
 *   es el valor que se guarda en `Word.fonemaInicial` (notación sencilla, no
 *   AFI estricto, para que sea legible por familias); `ipa` es el símbolo AFI.
 * - WORD_PHONOLOGY: información fonológica adicional por palabra (grupos
 *   consonánticos, notas, dudas). Se separa de words.ts para que ampliar la
 *   fonología no obligue a tocar el banco de vocabulario.
 *
 * Preparado para crecer: `PhonemePosition` ya contempla medial y final, y
 * WordPhonology admite una transcripción completa (`fonemas`) y sílabas. En
 * esta versión solo se usa la posición inicial (ver fonologiaLogic.ts).
 */

export type PhonemePosition = 'inicial' | 'medial' | 'final';

export interface Phoneme {
  id: string;
  /** Símbolo AFI. */
  ipa: string;
  /** Letras con que se escribe: "c (ca, co, cu), qu, k". */
  grafias: string;
  tipo: 'vocal' | 'consonante';
  /**
   * Palabra de ejemplo para la instrucción ("empieza como «pato»"). Se
   * eligen palabras que NO están en el banco, para que no coincidan con
   * ninguna foto del ejercicio.
   */
  ejemplo: string;
  /** Si con seseo se pronuncia como otro fonema (θ → s). */
  conSeseo?: string;
}

export const PHONEMES: Phoneme[] = [
  { id: 'a', ipa: 'a', grafias: 'a, ha', tipo: 'vocal', ejemplo: 'agua' },
  { id: 'e', ipa: 'e', grafias: 'e, he', tipo: 'vocal', ejemplo: 'espejo' },
  { id: 'i', ipa: 'i', grafias: 'i, hi', tipo: 'vocal', ejemplo: 'isla' },
  { id: 'o', ipa: 'o', grafias: 'o, ho', tipo: 'vocal', ejemplo: 'ojo' },
  { id: 'u', ipa: 'u', grafias: 'u, hu', tipo: 'vocal', ejemplo: 'uva' },
  { id: 'p', ipa: 'p', grafias: 'p', tipo: 'consonante', ejemplo: 'pato' },
  { id: 'b', ipa: 'b', grafias: 'b, v', tipo: 'consonante', ejemplo: 'boca' },
  { id: 'm', ipa: 'm', grafias: 'm', tipo: 'consonante', ejemplo: 'mano' },
  { id: 'f', ipa: 'f', grafias: 'f', tipo: 'consonante', ejemplo: 'foca' },
  { id: 't', ipa: 't', grafias: 't', tipo: 'consonante', ejemplo: 'taza' },
  { id: 'd', ipa: 'd', grafias: 'd', tipo: 'consonante', ejemplo: 'dedo' },
  { id: 'n', ipa: 'n', grafias: 'n', tipo: 'consonante', ejemplo: 'nube' },
  { id: 'l', ipa: 'l', grafias: 'l', tipo: 'consonante', ejemplo: 'luna' },
  { id: 's', ipa: 's', grafias: 's', tipo: 'consonante', ejemplo: 'sol' },
  { id: 'z', ipa: 'θ', grafias: 'z, ce, ci', tipo: 'consonante', ejemplo: 'zumo', conSeseo: 's' },
  { id: 'k', ipa: 'k', grafias: 'c (ca, co, cu), qu, k', tipo: 'consonante', ejemplo: 'casa' },
  { id: 'g', ipa: 'g', grafias: 'g (ga, go, gu), gu (gue, gui)', tipo: 'consonante', ejemplo: 'gafas' },
  { id: 'ch', ipa: 'tʃ', grafias: 'ch', tipo: 'consonante', ejemplo: 'chupete' },
  { id: 'll', ipa: 'ʝ', grafias: 'll, y', tipo: 'consonante', ejemplo: 'yogur' },
  { id: 'j', ipa: 'x', grafias: 'j, g (ge, gi)', tipo: 'consonante', ejemplo: 'jirafa' },
  { id: 'rr', ipa: 'r', grafias: 'r inicial, rr', tipo: 'consonante', ejemplo: 'ratón' },
  { id: 'ñ', ipa: 'ɲ', grafias: 'ñ', tipo: 'consonante', ejemplo: 'ñu' },
];

export interface WordPhonology {
  /** Grupo consonántico inicial ("pl", "fr", "tr"): el fonema inicial sigue siendo el primero. */
  grupoInicial?: string;
  /** Explicación para el profesional (se muestra en "Escuchar y ver"). */
  nota?: string;
  /**
   * Palabra dudosa para ejercicios de discriminación: se muestra en el repaso
   * con su nota, pero NO se usa en "Identificar" ni en "Clasificar".
   */
  duda?: boolean;
  /** Reservado: transcripción fonológica completa, para posición medial y final. */
  fonemas?: string[];
  /** Reservado: división silábica ("ca-ba-llo"), para trabajo silábico. */
  silabas?: string[];
}

/** Información adicional por id de palabra. Revisada palabra a palabra sobre el banco real. */
export const WORD_PHONOLOGY: Record<string, WordPhonology> = {
  alimentos_platano: { grupoInicial: 'pl', nota: 'Empieza por el grupo consonántico pl-.' },
  casa_plato: { grupoInicial: 'pl', nota: 'Empieza por el grupo consonántico pl-.' },
  alimentos_fresa: { grupoInicial: 'fr', nota: 'Empieza por el grupo consonántico fr-.' },
  transporte_tren: { grupoInicial: 'tr', nota: 'Empieza por el grupo consonántico tr-.' },
  transporte_tractor: { grupoInicial: 'tr', nota: 'Empieza por el grupo consonántico tr-.' },
  transporte_autobus: { nota: 'Empieza por el diptongo au-.' },
  alimentos_huevo: {
    duda: true,
    nota: 'Se escribe con hue- y se pronuncia /we/; en habla espontánea es frecuente [gwe] o [bwe]. No se usa en identificar ni clasificar.',
  },
  transporte_helicoptero: { nota: 'La h no suena: empieza por /e/.' },
  ropa_guantes: { nota: 'Empieza por /g/ seguido de /w/ (gua-).' },
  casa_llave: { nota: 'Con yeísmo (la mayoría de hablantes) ll y y suenan igual: /ʝ/.' },
  animales_vaca: { nota: 'Se escribe con v pero suena /b/.' },
  ropa_vestido: { nota: 'Se escribe con v pero suena /b/.' },
  casa_vaso: { nota: 'Se escribe con v pero suena /b/.' },
  animales_cerdo: { nota: 'Con seseo (Canarias, Andalucía, América) empieza por /s/.' },
  alimentos_zanahoria: { nota: 'Con seseo (Canarias, Andalucía, América) empieza por /s/.' },
  ropa_zapatos: { nota: 'Con seseo (Canarias, Andalucía, América) empieza por /s/.' },
  casa_cepillo_dientes: {
    duda: true,
    nota: 'Palabra compuesta ("cepillo de dientes"); con seseo empieza por /s/. No se usa en identificar ni clasificar.',
  },
  ropa_calcetines: { nota: 'Empieza por /k/ (ca-).' },
};
