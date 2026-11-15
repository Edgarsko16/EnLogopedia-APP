import { Image, type ImageContentFit } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { getImageSource } from '@/content/images';
import { colors, radius } from '@/theme';

interface PhotoProps {
  /** Clave de la imagen en el registro (Word.imagen). */
  imageKey: string;
  /**
   * Etiqueta para lectores de pantalla. Pasa `null` para no revelar el
   * contenido (p. ej. en denominación antes de descubrir la respuesta).
   */
  label: string | null;
  /** Texto alternativo neutro cuando `label` es null. */
  hiddenLabel?: string;
  fit?: ImageContentFit;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
  /** Animación de aparición (se desactiva si se reduce el movimiento). */
  transition?: number;
}

/**
 * Fotografía del banco de contenido. Las imágenes van empaquetadas en la app
 * (require estático), por lo que funcionan sin conexión.
 */
export function Photo({
  imageKey,
  label,
  hiddenLabel = 'Fotografía',
  fit = 'cover',
  aspectRatio = 4 / 3,
  style,
  transition = 0,
}: PhotoProps) {
  return (
    <View
      style={[styles.frame, { aspectRatio }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label ?? hiddenLabel}
    >
      <Image
        source={getImageSource(imageKey)}
        style={StyleSheet.absoluteFill}
        contentFit={fit}
        transition={transition}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    // En pantallas anchas (tableta, web) la foto no crece sin límite: así los
    // botones del ejercicio siguen visibles sin desplazarse.
    maxWidth: 640,
    alignSelf: 'center',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
});
