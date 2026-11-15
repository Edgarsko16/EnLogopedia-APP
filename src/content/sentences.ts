import type { Level, Sentence } from '@/types/content';

/**
 * Frases ligadas a fotografías concretas.
 *
 * Cada frase se ha escrito mirando la foto seleccionada (ver la columna
 * "observaciones" de docs/licencias-imagenes.csv): describe solo lo que se
 * ve. Si se cambia una foto, hay que revisar sus frases. Una prueba
 * automática comprueba que las palabras del vocabulario que menciona una
 * frase son la propia palabra de la foto o están en su campo `contiene`.
 *
 * El sujeto de cada frase es distinto (ardilla, gato, perro...), de modo que
 * en "¿Qué frase es?" solo una opción describe la foto mostrada.
 *
 * `hueco` (para "Completa la frase"): [posición del token oculto, distractores].
 * Los distractores concuerdan en número y persona y NO describen la foto.
 */
const s = (
  id: string,
  palabraId: string,
  texto: string,
  nivel: Level,
  hueco?: [number, string[]],
): Sentence => ({
  id,
  palabraId,
  texto,
  // Fichas para "Construye la frase": palabras sin el punto final.
  tokens: texto.replace(/[.!?¡¿]/g, '').split(/\s+/).filter(Boolean),
  nivel,
  ...(hueco ? { hueco: { indice: hueco[0], distractores: hueco[1] } } : {}),
});

export const SENTENCES: Sentence[] = [
  // Acciones
  s('comer-1', 'acciones_comer', 'La ardilla come.', 1, [2, ['nada', 'vuela']]),
  s('comer-2', 'acciones_comer', 'La ardilla come sentada en una roca.', 2, [2, ['nada', 'vuela']]),
  s('dormir-1', 'acciones_dormir', 'El gato duerme.', 1, [2, ['corre', 'nada']]),
  s('dormir-2', 'acciones_dormir', 'El gato duerme en el suelo de madera.', 2, [2, ['salta', 'corre']]),
  s('correr-1', 'acciones_correr', 'El perro corre.', 1, [2, ['duerme', 'nada']]),
  s('correr-2', 'acciones_correr', 'El perro corre por la hierba.', 2, [2, ['duerme', 'vuela']]),
  s('saltar-1', 'acciones_saltar', 'El delfín salta.', 1, [2, ['duerme', 'corre']]),
  s('saltar-2', 'acciones_saltar', 'El delfín salta fuera del agua.', 2, [2, ['duerme', 'corre']]),
  s('nadar-1', 'acciones_nadar', 'El pato nada.', 1, [2, ['corre', 'duerme']]),
  s('nadar-2', 'acciones_nadar', 'El pato nada en el agua.', 2, [2, ['corre', 'salta']]),
  s('beber-1', 'acciones_beber', 'El caballo bebe agua.', 1, [2, ['corta', 'lava']]),
  s('beber-2', 'acciones_beber', 'El caballo bebe agua del arroyo.', 2, [2, ['corta', 'lava']]),
  s('escribir-1', 'acciones_escribir', 'Escribe en un cuaderno.', 1, [0, ['Corta', 'Nada']]),
  s('escribir-2', 'acciones_escribir', 'Escribe con un bolígrafo en el cuaderno.', 2, [0, ['Come', 'Duerme']]),
  s('lavarse-1', 'acciones_lavarse_manos', 'Se lava las manos.', 1, [1, ['pinta', 'corta']]),
  s('lavarse-2', 'acciones_lavarse_manos', 'Se lava las manos con agua y jabón.', 2, [1, ['pinta', 'corta']]),
  s('cortar-1', 'acciones_cortar', 'Corta el pan.', 1, [0, ['Lava', 'Pinta']]),
  s('cortar-2', 'acciones_cortar', 'Corta el pan con un cuchillo.', 2, [0, ['Lava', 'Pinta']]),

  // Otras fotos que muestran una acción clara
  s('vaca-1', 'animales_vaca', 'Las vacas comen hierba.', 1, [2, ['beben', 'duermen']]),
  s('mariposa-1', 'animales_mariposa', 'La mariposa está en una flor.', 2, [5, ['mesa', 'cama']]),
  s('avion-1', 'transporte_avion', 'El avión vuela.', 1, [2, ['nada', 'duerme']]),
  s('barco-1', 'transporte_barco', 'El barco navega por el mar.', 2, [2, ['vuela', 'duerme']]),
  s('helicoptero-1', 'transporte_helicoptero', 'El helicóptero vuela entre montañas.', 3, [2, ['nada', 'navega']]),
  s('tren-1', 'transporte_tren', 'El tren va por la vía.', 2, [4, ['nube', 'mesa']]),
];
