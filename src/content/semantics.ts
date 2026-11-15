/**
 * Relaciones semánticas entre palabras del banco.
 *
 * No se duplican palabras: todo se expresa con identificadores de WORDS.
 * Las relaciones cuya palabra no tiene foto verificada se ignoran solas
 * (ver getFunctions/getAssociations en catalog.ts), igual que el resto del
 * contenido. Para ampliar basta con añadir entradas; las pruebas comprueban
 * que los identificadores existen.
 */

/**
 * Función o uso: "¿Qué usamos para…?" / "¿Para qué sirve…?".
 * Varias palabras pueden compartir función (tenedor y cuchara sirven para
 * comer); por eso cada función lista TODAS las palabras válidas y el juego
 * nunca usa como distractor otra palabra de la misma función.
 */
export interface FunctionRelation {
  id: string;
  /** Completa "¿Qué usamos para …?": "dormir", "abrir la puerta". */
  para: string;
  /** Palabras que cumplen esta función. */
  palabras: string[];
  /**
   * Palabras que, sin ser la respuesta prevista, podrían defenderse como
   * válidas (el plato también se usa con la sopa). Nunca se usan como
   * distractores de esta función, ni esta función como opción falsa para ellas.
   */
  noDistractores?: string[];
}

export type AssociationType = 'produce' | 'come' | 'va-con' | 'se-usa-para' | 'lugar';

/**
 * Asociación habitual entre dos palabras: la gallina y el huevo, la mesa y
 * la silla. Es simétrica a efectos de juego, pero `a` es la palabra que se
 * muestra como pista y `b` la respuesta.
 */
export interface Association {
  id: string;
  a: string;
  b: string;
  tipo: AssociationType;
  /** Frase que explica la relación tras responder: "La gallina pone huevos." */
  explicacion: string;
  /** Palabras que también podrían defenderse como pareja de `a` (el queso también viene de la vaca). */
  noDistractores?: string[];
}

export const FUNCTIONS: FunctionRelation[] = [
  { id: 'dormir', para: 'dormir', palabras: ['casa_cama'] },
  { id: 'sentarse', para: 'sentarnos', palabras: ['casa_silla'], noDistractores: ['casa_cama', 'casa_mesa'] },
  { id: 'abrir', para: 'abrir la puerta', palabras: ['casa_llave'] },
  { id: 'dientes', para: 'lavarnos los dientes', palabras: ['casa_cepillo_dientes'] },
  { id: 'luz', para: 'tener luz', palabras: ['casa_lampara'] },
  { id: 'sopa', para: 'tomar la sopa', palabras: ['casa_cuchara'], noDistractores: ['casa_plato', 'casa_vaso', 'alimentos_leche'] },
  { id: 'pinchar', para: 'pinchar la comida', palabras: ['casa_tenedor'] },
  { id: 'servir', para: 'servir la comida', palabras: ['casa_plato'], noDistractores: ['casa_mesa', 'casa_cuchara', 'casa_tenedor'] },
  { id: 'beber', para: 'beber agua', palabras: ['casa_vaso'], noDistractores: ['alimentos_leche'] },
  { id: 'manos-frio', para: 'abrigar las manos', palabras: ['ropa_guantes'], noDistractores: ['ropa_bufanda', 'ropa_gorro', 'ropa_chaqueta'] },
  { id: 'cabeza-frio', para: 'abrigar la cabeza', palabras: ['ropa_gorro'] },
  { id: 'cuello-frio', para: 'abrigar el cuello', palabras: ['ropa_bufanda'] },
  { id: 'pies', para: 'cubrir los pies al caminar', palabras: ['ropa_zapatos', 'ropa_botas', 'ropa_calcetines'] },
  { id: 'volar', para: 'viajar por el aire', palabras: ['transporte_avion', 'transporte_helicoptero'] },
  { id: 'navegar', para: 'viajar por el mar', palabras: ['transporte_barco'] },
  { id: 'vias', para: 'viajar por las vías', palabras: ['transporte_tren'] },
  { id: 'pedalear', para: 'pedalear', palabras: ['transporte_bicicleta'] },
  { id: 'campo', para: 'trabajar en el campo', palabras: ['transporte_tractor'], noDistractores: ['transporte_camion'] },
  { id: 'carga', para: 'llevar mucha carga', palabras: ['transporte_camion'], noDistractores: ['transporte_tren', 'transporte_barco', 'transporte_avion', 'transporte_tractor', 'transporte_helicoptero'] },
];

export const ASSOCIATIONS: Association[] = [
  { id: 'gallina-huevo', a: 'animales_gallina', b: 'alimentos_huevo', tipo: 'produce', explicacion: 'La gallina pone huevos.' },
  { id: 'vaca-leche', a: 'animales_vaca', b: 'alimentos_leche', tipo: 'produce', explicacion: 'La vaca nos da leche.', noDistractores: ['alimentos_queso'] },
  { id: 'conejo-zanahoria', a: 'animales_conejo', b: 'alimentos_zanahoria', tipo: 'come', explicacion: 'Al conejo le gusta comer zanahorias.', noDistractores: ['alimentos_manzana', 'alimentos_fresa', 'alimentos_platano', 'alimentos_tomate', 'alimentos_naranja', 'alimentos_pan'] },
  { id: 'cama-dormir', a: 'casa_cama', b: 'acciones_dormir', tipo: 'se-usa-para', explicacion: 'En la cama dormimos.' },
  { id: 'mesa-silla', a: 'casa_mesa', b: 'casa_silla', tipo: 'va-con', explicacion: 'Las sillas van con la mesa.', noDistractores: ['casa_plato', 'casa_cuchara', 'casa_tenedor'] },
  { id: 'plato-tenedor', a: 'casa_plato', b: 'casa_tenedor', tipo: 'va-con', explicacion: 'Comemos del plato con el tenedor.', noDistractores: ['casa_cuchara', 'casa_mesa', 'alimentos_pan'] },
  { id: 'pan-cortar', a: 'alimentos_pan', b: 'acciones_cortar', tipo: 'se-usa-para', explicacion: 'El pan se corta en rebanadas.' },
  { id: 'zapatos-calcetines', a: 'ropa_zapatos', b: 'ropa_calcetines', tipo: 'va-con', explicacion: 'Primero los calcetines y después los zapatos.', noDistractores: ['ropa_botas'] },
  { id: 'vaso-beber', a: 'casa_vaso', b: 'acciones_beber', tipo: 'se-usa-para', explicacion: 'En el vaso bebemos.', noDistractores: ['alimentos_leche'] },
];
