import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import type { IconName } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { MenuCard } from '@/components/MenuCard';
import { Screen } from '@/components/Screen';
import { getCategory, getSentences, getWordsByCategory } from '@/content/catalog';
import { gamesForCategory } from '@/games/registry';
import { colors, spacing } from '@/theme';
import { plural } from '@/utils/text';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = getCategory(String(id));

  if (!category) {
    return (
      <Screen>
        <AppText>No se ha encontrado esta categoría.</AppText>
      </Screen>
    );
  }

  const words = getWordsByCategory(category.id);
  const games = gamesForCategory(category.id, words.length).filter(
    (g) => g.id !== 'frases' || getSentences(category.id).length > 0,
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: category.nombre }} />
      <View style={styles.header}>
        <AppText size="title" weight="800" accessibilityRole="header">
          {category.nombre}
        </AppText>
        <AppText color={colors.textMuted}>
          {category.descripcion} {plural(words.length, 'palabra')}.
        </AppText>
      </View>

      <MenuCard
        title="Ver vocabulario"
        description="Mira cada foto, escucha y repite la palabra."
        icon="images"
        color={category.color}
        onPress={() => router.push({ pathname: '/vocabulario/[categoria]', params: { categoria: category.id } })}
      />
      {games.map((g) => (
        <MenuCard
          key={g.id}
          title={g.titulo}
          description={g.descripcion}
          icon={g.icono as IconName}
          onPress={() => router.push(g.ruta(category.id))}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
});
