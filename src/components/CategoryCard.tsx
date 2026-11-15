import { Pressable, StyleSheet, View } from 'react-native';
import type { Category } from '@/types/content';
import { colors, radius, shadows, spacing } from '@/theme';
import { plural } from '@/utils/text';
import { AppText } from './AppText';
import { Photo } from './Photo';

interface CategoryCardProps {
  category: Category;
  coverImage: string;
  wordCount: number;
  onPress: () => void;
}

/** Tarjeta de categoría con foto de portada, nombre y número de palabras. */
export function CategoryCard({ category, coverImage, wordCount, onPress }: CategoryCardProps) {
  const count = plural(wordCount, 'palabra');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.nombre}, ${count}`}
      accessibilityHint="Abre los ejercicios de esta categoría"
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.card,
        pressed && styles.pressed,
        focused && styles.focused,
      ]}
    >
      <Photo imageKey={coverImage} label={null} aspectRatio={16 / 10} style={styles.photo} />
      <View style={[styles.footer, { backgroundColor: category.color }]}>
        <AppText size="large" weight="700" color={colors.onPrimary}>
          {category.nombre}
        </AppText>
        <AppText color={colors.onPrimary}>{count}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 150,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  photo: { borderRadius: 0 },
  footer: { padding: spacing.sm + 4, gap: 2 },
});
