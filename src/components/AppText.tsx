import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useSettings } from '@/hooks/SettingsContext';
import { colors, fontSize, type FontSizeKey } from '@/theme';

interface AppTextProps extends TextProps {
  size?: FontSizeKey;
  weight?: TextStyle['fontWeight'];
  color?: string;
  align?: TextStyle['textAlign'];
}

/**
 * Texto de la app. Aplica el tamaño elegido en Ajustes, y además respeta el
 * tamaño de letra del sistema (allowFontScaling), con un tope para que la
 * maquetación no se rompa con tamaños extremos.
 */
export function AppText({ size = 'body', weight, color = colors.text, align, style, ...rest }: AppTextProps) {
  const { settings } = useSettings();
  const base = fontSize[size] * settings.textScale;
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.8}
      style={[styles.base, { fontSize: base, lineHeight: Math.round(base * 1.35), color, fontWeight: weight, textAlign: align }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
