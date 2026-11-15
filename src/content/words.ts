/**
 * Banco de palabras.
 *
 * Cada palabra apunta a una fotografía por su clave (`imagen`). Las palabras
 * cuya foto no está registrada en src/content/images.ts quedan ocultas
 * automáticamente (ver catalog.ts): nunca se muestra una palabra sin imagen
 * verificada.
 *
 * `contiene` se ha rellenado mirando cada fotografía seleccionada.
 */
import type { Article, CategoryId, Level, Word } from '@/types/content';

type Extra = Pick<Word, 'grupoConfusion' | 'contiene'>;

function n(
  categoria: CategoryId,
  imagen: string,
  palabra: string,
  articulo: Article,
  nivel: Level,
  silabas: number,
  fonemaInicial: string,
  descripcion: string,
  frases: string[],
  extra: Extra = {},
): Word {
  return {
    id: `${categoria}_${imagen}`,
    palabra,
    categoria,
    tipo: 'sustantivo',
    articulo,
    imagen,
    nivel,
    silabas,
    fonemaInicial,
    descripcion,
    frases,
    ...extra,
  };
}

function v(
  imagen: string,
  palabra: string,
  gerundio: string,
  nivel: Level,
  silabas: number,
  fonemaInicial: string,
  descripcion: string,
  frases: string[],
  extra: Extra = {},
): Word {
  return {
    id: `acciones_${imagen}`,
    palabra,
    categoria: 'acciones',
    tipo: 'verbo',
    gerundio,
    imagen,
    nivel,
    silabas,
    fonemaInicial,
    descripcion,
    frases,
    ...extra,
  };
}

export const WORDS: Word[] = [
  // ── Animales ──────────────────────────────────────────────
  n('animales', 'perro', 'perro', 'el', 1, 2, 'p', 'Animal de compañía que ladra.', ['El perro mueve la cola.', 'El perro ladra.']),
  n('animales', 'gato', 'gato', 'el', 1, 2, 'g', 'Animal de compañía que maúlla.', ['El gato bebe leche.', 'El gato dice miau.']),
  n('animales', 'caballo', 'caballo', 'el', 1, 3, 'k', 'Animal grande que galopa y relincha.', ['El caballo corre por el campo.']),
  n('animales', 'vaca', 'vaca', 'la', 1, 2, 'b', 'Animal de granja que nos da leche.', ['La vaca come hierba.', 'La vaca dice mu.']),
  n('animales', 'oveja', 'oveja', 'la', 1, 3, 'o', 'Animal de granja con lana.', ['La oveja tiene lana.']),
  n('animales', 'cerdo', 'cerdo', 'el', 1, 2, 'z', 'Animal de granja de color rosado.', ['El cerdo se mete en el barro.']),
  n('animales', 'gallina', 'gallina', 'la', 1, 3, 'g', 'Ave de granja que pone huevos.', ['La gallina pone huevos.']),
  n('animales', 'conejo', 'conejo', 'el', 1, 3, 'k', 'Animal pequeño de orejas largas.', ['El conejo come zanahorias.']),
  n('animales', 'elefante', 'elefante', 'el', 2, 4, 'e', 'Animal muy grande con trompa.', ['El elefante tiene una trompa larga.']),
  n('animales', 'mariposa', 'mariposa', 'la', 2, 4, 'm', 'Insecto con alas de colores.', ['La mariposa vuela entre las flores.']),

  // ── Alimentos ─────────────────────────────────────────────
  n('alimentos', 'manzana', 'manzana', 'la', 1, 3, 'm', 'Fruta redonda, roja, verde o amarilla.', ['Me como una manzana.']),
  n('alimentos', 'platano', 'plátano', 'el', 1, 3, 'p', 'Fruta alargada y amarilla.', ['El plátano es amarillo.']),
  n('alimentos', 'naranja', 'naranja', 'la', 1, 3, 'n', 'Fruta redonda con la que se hace zumo.', ['Hago zumo de naranja.']),
  n('alimentos', 'fresa', 'fresa', 'la', 1, 2, 'f', 'Fruta pequeña, roja y dulce.', ['La fresa es roja.']),
  n('alimentos', 'pan', 'pan', 'el', 1, 1, 'p', 'Alimento hecho con harina que se hornea.', ['Compro pan en la panadería.']),
  n('alimentos', 'huevo', 'huevo', 'el', 1, 2, 'u', 'Alimento que ponen las gallinas.', ['Me como un huevo frito.']),
  n('alimentos', 'queso', 'queso', 'el', 1, 2, 'k', 'Alimento que se hace con leche.', ['El ratón come queso.']),
  n('alimentos', 'leche', 'leche', 'la', 1, 2, 'l', 'Bebida blanca que nos da la vaca.', ['Bebo un vaso de leche.'], {
    grupoConfusion: 'vaso_leche',
  }),
  n('alimentos', 'tomate', 'tomate', 'el', 2, 3, 't', 'Hortaliza roja que se come en ensalada.', ['Pongo tomate en la ensalada.']),
  n('alimentos', 'zanahoria', 'zanahoria', 'la', 2, 4, 'z', 'Hortaliza naranja y alargada.', ['El conejo come zanahoria.']),

  // ── Ropa ──────────────────────────────────────────────────
  n('ropa', 'camiseta', 'camiseta', 'la', 1, 4, 'k', 'Prenda de manga corta para el tronco.', ['Me pongo la camiseta.']),
  n('ropa', 'pantalon', 'pantalón', 'el', 1, 3, 'p', 'Prenda que cubre las piernas.', ['El pantalón es azul.']),
  n('ropa', 'zapatos', 'zapatos', 'los', 1, 3, 'z', 'Calzado para caminar.', ['Me ato los zapatos.'], { grupoConfusion: 'calzado' }),
  n('ropa', 'calcetines', 'calcetines', 'los', 2, 4, 'k', 'Prenda que cubre los pies.', ['Me pongo los calcetines.']),
  n('ropa', 'gorro', 'gorro', 'el', 1, 2, 'g', 'Prenda que abriga la cabeza.', ['En invierno llevo gorro.'], { grupoConfusion: 'abrigo_cabeza' }),
  n('ropa', 'bufanda', 'bufanda', 'la', 2, 3, 'b', 'Prenda que abriga el cuello.', ['La bufanda abriga el cuello.']),
  n('ropa', 'chaqueta', 'chaqueta', 'la', 2, 3, 'ch', 'Prenda de abrigo con mangas.', ['Me pongo la chaqueta porque hace frío.']),
  n('ropa', 'vestido', 'vestido', 'el', 2, 3, 'b', 'Prenda de una pieza que cubre el cuerpo.', ['El vestido es largo.']),
  n('ropa', 'guantes', 'guantes', 'los', 2, 2, 'g', 'Prenda que abriga las manos.', ['Los guantes abrigan las manos.']),
  n('ropa', 'botas', 'botas', 'las', 1, 2, 'b', 'Calzado alto que cubre el tobillo.', ['Me pongo las botas para la lluvia.'], {
    grupoConfusion: 'calzado',
  }),

  // ── Casa ──────────────────────────────────────────────────
  n('casa', 'silla', 'silla', 'la', 1, 2, 's', 'Mueble para sentarse.', ['Me siento en la silla.'], { grupoConfusion: 'mesa_silla' }),
  n('casa', 'mesa', 'mesa', 'la', 1, 2, 'm', 'Mueble con una tabla y patas.', ['Pongo el plato en la mesa.'], {
    grupoConfusion: 'mesa_silla',
    contiene: ['casa_silla'],
  }),
  n('casa', 'cama', 'cama', 'la', 1, 2, 'k', 'Mueble para dormir.', ['Me voy a la cama a dormir.']),
  n('casa', 'cuchara', 'cuchara', 'la', 1, 3, 'k', 'Cubierto para tomar la sopa.', ['Como la sopa con la cuchara.'], { grupoConfusion: 'cubiertos' }),
  n('casa', 'tenedor', 'tenedor', 'el', 2, 3, 't', 'Cubierto con dientes para pinchar.', ['Pincho con el tenedor.'], { grupoConfusion: 'cubiertos' }),
  n('casa', 'vaso', 'vaso', 'el', 1, 2, 'b', 'Recipiente para beber.', ['Bebo agua en un vaso.'], { grupoConfusion: 'vaso_leche' }),
  n('casa', 'plato', 'plato', 'el', 1, 2, 'p', 'Recipiente donde se sirve la comida.', ['La comida está en el plato.'], {
    contiene: ['casa_tenedor'],
  }),
  n('casa', 'llave', 'llave', 'la', 1, 2, 'll', 'Objeto para abrir y cerrar puertas.', ['Abro la puerta con la llave.']),
  n('casa', 'cepillo_dientes', 'cepillo de dientes', 'el', 3, 6, 'z', 'Cepillo para lavarse los dientes.', ['Me lavo los dientes con el cepillo.']),
  n('casa', 'lampara', 'lámpara', 'la', 2, 3, 'l', 'Objeto que da luz.', ['Enciendo la lámpara.']),

  // ── Transporte ────────────────────────────────────────────
  n('transporte', 'coche', 'coche', 'el', 1, 2, 'k', 'Vehículo de cuatro ruedas.', ['Vamos en coche al colegio.']),
  n('transporte', 'autobus', 'autobús', 'el', 1, 3, 'a', 'Vehículo grande para muchas personas.', ['Espero el autobús en la parada.']),
  n('transporte', 'tren', 'tren', 'el', 1, 1, 't', 'Vehículo que va por las vías.', ['El tren va por las vías.']),
  n('transporte', 'avion', 'avión', 'el', 1, 2, 'a', 'Vehículo que vuela.', ['El avión vuela por el cielo.']),
  n('transporte', 'barco', 'barco', 'el', 1, 2, 'b', 'Vehículo que navega por el agua.', ['El barco navega por el mar.']),
  n('transporte', 'bicicleta', 'bicicleta', 'la', 2, 4, 'b', 'Vehículo de dos ruedas con pedales.', ['Monto en bicicleta.']),
  n('transporte', 'moto', 'moto', 'la', 1, 2, 'm', 'Vehículo de dos ruedas con motor.', ['La moto hace mucho ruido.']),
  n('transporte', 'camion', 'camión', 'el', 2, 2, 'k', 'Vehículo grande para llevar carga.', ['El camión lleva cajas.']),
  n('transporte', 'helicoptero', 'helicóptero', 'el', 3, 5, 'e', 'Vehículo que vuela con hélices.', ['El helicóptero vuela alto.']),
  n('transporte', 'tractor', 'tractor', 'el', 2, 2, 't', 'Vehículo para trabajar en el campo.', ['El tractor trabaja en el campo.']),

  // ── Acciones ──────────────────────────────────────────────
  v('comer', 'comer', 'comiendo', 1, 2, 'k', 'Tomar alimentos.', ['Como fruta todos los días.']),
  v('beber', 'beber', 'bebiendo', 1, 2, 'b', 'Tomar un líquido.', ['Bebo agua cuando tengo sed.'], {
    contiene: ['animales_caballo'],
  }),
  v('dormir', 'dormir', 'durmiendo', 1, 2, 'd', 'Descansar con los ojos cerrados.', ['Por la noche duermo en mi cama.'], {
    contiene: ['animales_gato'],
  }),
  v('correr', 'correr', 'corriendo', 1, 2, 'k', 'Moverse deprisa con las piernas.', ['Corro en el parque.'], {
    contiene: ['animales_perro'],
  }),
  v('leer', 'leer', 'leyendo', 2, 2, 'l', 'Mirar y entender lo que está escrito.', ['Leo un cuento antes de dormir.']),
  v('escribir', 'escribir', 'escribiendo', 2, 3, 'e', 'Poner letras en un papel.', ['Escribo mi nombre.']),
  v('lavarse_manos', 'lavarse las manos', 'lavándose las manos', 2, 6, 'l', 'Limpiarse las manos con agua y jabón.', [
    'Me lavo las manos antes de comer.',
  ]),
  v('saltar', 'saltar', 'saltando', 1, 2, 's', 'Despegar los pies del suelo con impulso.', ['Salto muy alto.']),
  v('nadar', 'nadar', 'nadando', 2, 2, 'n', 'Moverse dentro del agua.', ['En verano nado en la piscina.']),
  v('cortar', 'cortar', 'cortando', 2, 2, 'k', 'Separar algo en trozos.', ['Corto el pan con cuidado.'], {
    contiene: ['alimentos_pan'],
  }),
];
