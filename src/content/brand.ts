/**
 * Identidad de marca de la app.
 *
 * Archivos (assets/brand/):
 *  - image-png.png: archivo original del logo (500 × 500, fondo transparente). No se modifica.
 *  - logo.png: copia idéntica del original, con el nombre acordado.
 *  - logo-app.png: copia SIN márgenes transparentes (351 × 288), generada con sharp.trim()
 *    a partir de logo.png. Es la que usa la app y la pantalla de bienvenida.
 *
 * Para cambiar el logo: sustituye logo.png, vuelve a generar logo-app.png
 * (ver assets/brand/README.md) y ajusta LOGO_ASPECT_RATIO = ancho / alto.
 */
export const BRAND = {
  nombre: 'EnLogopedia',
  lema: 'Herramienta de apoyo a la intervención logopédica',
  /** require() del logo, o null si no hubiera archivo (se mostraría el nombre como texto). */
  LOGO: require('../../assets/brand/logo-app.png') as number | null,
  /** Proporción ancho/alto de logo-app.png (351 / 288), para no deformarlo ni recortarlo. */
  LOGO_ASPECT_RATIO: 351 / 288,
};
