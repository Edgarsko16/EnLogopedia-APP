import { colors } from '@/theme';

/** Contraste WCAG entre dos colores hexadecimales (#RRGGBB). */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('contrastes del sistema de diseño', () => {
  const text: [string, string, string][] = [
    ['texto / fondo', colors.text, colors.background],
    ['texto / superficie', colors.text, colors.surface],
    ['texto / azul claro', colors.text, colors.primarySoft],
    ['texto secundario / fondo', colors.textMuted, colors.background],
    ['texto secundario / azul claro', colors.textMuted, colors.primarySoft],
    ['blanco / azul principal', colors.onPrimary, colors.primary],
    ['blanco / azul pulsado', colors.onPrimary, colors.primaryPressed],
    ['blanco / azul noche', colors.onPrimary, colors.navy],
    ['blanco / turquesa oscuro', colors.onPrimary, colors.turquoiseDark],
    ['azul principal / superficie', colors.primary, colors.surface],
    ['azul principal / azul claro', colors.primary, colors.primarySoft],
    ['azul noche / fondo', colors.navy, colors.background],
    ['correcto / fondo correcto', colors.success, colors.successBg],
    ['error / fondo error', colors.error, colors.errorBg],
    ['aviso / fondo aviso', colors.warning, colors.warningBg],
  ];

  it.each(text)('texto %s >= 4,5:1', (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  const components: [string, string, string][] = [
    ['borde de control / superficie', colors.border, colors.surface],
    ['foco / superficie', colors.focus, colors.surface],
    ['foco / fondo', colors.focus, colors.background],
    ['turquesa decorativo / superficie', colors.turquoise, colors.surface],
  ];

  it.each(components)('componente %s >= 3:1', (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
