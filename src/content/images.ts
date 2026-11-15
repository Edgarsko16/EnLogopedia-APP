// ARCHIVO GENERADO por scripts/images-generate.mjs a partir de assets/images/registro.json.
// No editar a mano. require() devuelve un identificador numérico de recurso empaquetado por Metro.

export const IMAGES = {
  beber: require('../../assets/images/palabras/acciones/beber.webp'),
  comer: require('../../assets/images/palabras/acciones/comer.webp'),
  correr: require('../../assets/images/palabras/acciones/correr.webp'),
  cortar: require('../../assets/images/palabras/acciones/cortar.webp'),
  dormir: require('../../assets/images/palabras/acciones/dormir.webp'),
  escribir: require('../../assets/images/palabras/acciones/escribir.webp'),
  lavarse_manos: require('../../assets/images/palabras/acciones/lavarse_manos.webp'),
  nadar: require('../../assets/images/palabras/acciones/nadar.webp'),
  saltar: require('../../assets/images/palabras/acciones/saltar.webp'),
  fresa: require('../../assets/images/palabras/alimentos/fresa.webp'),
  huevo: require('../../assets/images/palabras/alimentos/huevo.webp'),
  leche: require('../../assets/images/palabras/alimentos/leche.webp'),
  manzana: require('../../assets/images/palabras/alimentos/manzana.webp'),
  naranja: require('../../assets/images/palabras/alimentos/naranja.webp'),
  pan: require('../../assets/images/palabras/alimentos/pan.webp'),
  platano: require('../../assets/images/palabras/alimentos/platano.webp'),
  queso: require('../../assets/images/palabras/alimentos/queso.webp'),
  tomate: require('../../assets/images/palabras/alimentos/tomate.webp'),
  zanahoria: require('../../assets/images/palabras/alimentos/zanahoria.webp'),
  caballo: require('../../assets/images/palabras/animales/caballo.webp'),
  cerdo: require('../../assets/images/palabras/animales/cerdo.webp'),
  conejo: require('../../assets/images/palabras/animales/conejo.webp'),
  elefante: require('../../assets/images/palabras/animales/elefante.webp'),
  gallina: require('../../assets/images/palabras/animales/gallina.webp'),
  gato: require('../../assets/images/palabras/animales/gato.webp'),
  mariposa: require('../../assets/images/palabras/animales/mariposa.webp'),
  oveja: require('../../assets/images/palabras/animales/oveja.webp'),
  perro: require('../../assets/images/palabras/animales/perro.webp'),
  vaca: require('../../assets/images/palabras/animales/vaca.webp'),
  cama: require('../../assets/images/palabras/casa/cama.webp'),
  cepillo_dientes: require('../../assets/images/palabras/casa/cepillo_dientes.webp'),
  cuchara: require('../../assets/images/palabras/casa/cuchara.webp'),
  lampara: require('../../assets/images/palabras/casa/lampara.webp'),
  llave: require('../../assets/images/palabras/casa/llave.webp'),
  mesa: require('../../assets/images/palabras/casa/mesa.webp'),
  plato: require('../../assets/images/palabras/casa/plato.webp'),
  silla: require('../../assets/images/palabras/casa/silla.webp'),
  tenedor: require('../../assets/images/palabras/casa/tenedor.webp'),
  botas: require('../../assets/images/palabras/ropa/botas.webp'),
  guantes: require('../../assets/images/palabras/ropa/guantes.webp'),
  zapatos: require('../../assets/images/palabras/ropa/zapatos.webp'),
  autobus: require('../../assets/images/palabras/transporte/autobus.webp'),
  avion: require('../../assets/images/palabras/transporte/avion.webp'),
  barco: require('../../assets/images/palabras/transporte/barco.webp'),
  bicicleta: require('../../assets/images/palabras/transporte/bicicleta.webp'),
  camion: require('../../assets/images/palabras/transporte/camion.webp'),
  coche: require('../../assets/images/palabras/transporte/coche.webp'),
  helicoptero: require('../../assets/images/palabras/transporte/helicoptero.webp'),
  moto: require('../../assets/images/palabras/transporte/moto.webp'),
  tractor: require('../../assets/images/palabras/transporte/tractor.webp'),
  tren: require('../../assets/images/palabras/transporte/tren.webp'),
} as const satisfies Record<string, number>;

export type ImageKey = keyof typeof IMAGES;

export function hasImage(key: string): key is ImageKey {
  return Object.prototype.hasOwnProperty.call(IMAGES, key);
}

export function getImageSource(key: string): number | undefined {
  return hasImage(key) ? IMAGES[key] : undefined;
}
