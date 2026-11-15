/**
 * Sistema de diseño de EnLogopedia.
 *
 * Paleta inspirada en el logo (oído con ondas en azules):
 *  - azul noche  #172E69  (texto del logotipo, cabeceras, máxima jerarquía)
 *  - azul        #2456A6  (acción principal)
 *  - turquesa    #259AC9  (ondas del logo; SOLO decorativo: 3,2:1 con blanco)
 *  - turquesa oscuro #1A6F93 (versión accesible para fondos con texto blanco)
 *  - azul claro  #EAF4FA  (superficies suaves, seleccionado)
 *  - fondo       #F8FAFD
 *
 * Contrastes (WCAG 2.2 AA) comprobados en __tests__/theme.test.ts:
 * texto normal >= 4,5:1; componentes y bordes de controles >= 3:1.
 */
export const colors = {
  // Marca
  navy: '#172E69',
  primary: '#2456A6',
  primaryPressed: '#1B4486',
  primarySoft: '#EAF4FA',
  turquoise: '#259AC9',
  turquoiseDark: '#1A6F93',

  // Superficies
  background: '#F8FAFD',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF4FA',
  cardBack: '#172E69',
  overlay: 'rgba(23, 46, 105, 0.55)',

  // Texto
  text: '#14254F',
  textMuted: '#4A5878',
  onPrimary: '#FFFFFF',

  // Bordes y foco
  border: '#6B7A99',
  borderSoft: '#D6E1EE',
  focus: '#C25400',

  // Estados
  accent: '#1A6F93',
  success: '#1E6B36',
  successBg: '#E4F4EA',
  error: '#A1281B',
  errorBg: '#FCEBE8',
  warning: '#7A5200',
  warningBg: '#FFF4D6',
  disabled: '#8E9AB2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * Sombras suaves con el azul de la marca. `boxShadow` funciona en web y en la
 * nueva arquitectura de React Native (iOS y Android).
 */
export const shadows = {
  none: {},
  card: { boxShadow: '0px 2px 10px rgba(23, 46, 105, 0.08)' },
  raised: { boxShadow: '0px 6px 20px rgba(23, 46, 105, 0.14)' },
} as const;

/** Tamaño mínimo de objetivo táctil. WCAG 2.2 pide 24 px; Android recomienda 48 dp. */
export const MIN_TOUCH = 48;
/** Objetivo táctil cómodo para controles de respuesta durante la sesión. */
export const COMFORT_TOUCH = 56;

export const fontSize = {
  small: 14,
  body: 17,
  large: 20,
  title: 26,
  display: 34,
  word: 40,
} as const;

export type FontSizeKey = keyof typeof fontSize;

export const fontWeight = {
  regular: '400',
  medium: '600',
  bold: '700',
  heavy: '800',
} as const;

/** Ancho máximo del contenido en tabletas y web, para que la lectura sea cómoda. */
export const CONTENT_MAX_WIDTH = 960;
