import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { BRAND } from '@/content/brand';
import { colors } from '@/theme';
import { AppText } from './AppText';

interface BrandLogoProps {
  /** Altura del logo en píxeles independientes del dispositivo. */
  height?: number;
  /** Anunciarlo como encabezado principal de la pantalla (portada). */
  asHeader?: boolean;
}

/**
 * Logo de la app. Si todavía no hay archivo de logo (BRAND.LOGO es null),
 * muestra el nombre como rótulo de texto en el mismo espacio. Para lectores
 * de pantalla es siempre una imagen con el nombre de la app.
 */
export function BrandLogo({ height = 56, asHeader }: BrandLogoProps) {
  const role = asHeader ? 'header' : 'image';
  if (BRAND.LOGO != null) {
    return (
      <View accessible accessibilityRole={role} accessibilityLabel={BRAND.nombre} style={{ height, aspectRatio: BRAND.LOGO_ASPECT_RATIO }}>
        <Image source={BRAND.LOGO} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
      </View>
    );
  }
  return (
    <View accessible accessibilityRole={role} accessibilityLabel={BRAND.nombre} style={[styles.wordmark, { minHeight: height }]}>
      <AppText size="display" weight="800" color={colors.primary} importantForAccessibility="no">
        {BRAND.nombre}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { justifyContent: 'center' },
});
