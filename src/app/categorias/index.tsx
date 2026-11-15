import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { CategoryCard } from '@/components/CategoryCard';
import { Screen } from '@/components/Screen';
import { getCategories, getCategoryCover, getWordsByCategory } from '@/content/catalog';
import { colors, spacing } from '@/theme';

export default function CategoriesScreen() {
  const categories = getCategories();
  return (
    <Screen>
      <AppText size="large" color={colors.textMuted}>
        Elige una categoría para ver sus palabras o jugar con ellas.
      </AppText>
      {categories.length === 0 ? (
        <AppText>Todavía no hay fotografías verificadas en el catálogo.</AppText>
      ) : (
        <View style={styles.grid}>
          {categories.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              coverImage={getCategoryCover(c) ?? ''}
              wordCount={getWordsByCategory(c.id).length}
              onPress={() => router.push({ pathname: '/categorias/[id]', params: { id: c.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
