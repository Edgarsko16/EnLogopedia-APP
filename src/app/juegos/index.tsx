import { router } from 'expo-router';
import type { IconName } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { MenuCard } from '@/components/MenuCard';
import { Screen } from '@/components/Screen';
import { getSentences } from '@/content/catalog';
import { GAMES } from '@/games/registry';
import { colors } from '@/theme';

export default function GamesScreen() {
  const games = GAMES.filter((g) => g.id !== 'frases' || getSentences().length > 0);
  return (
    <Screen>
      <AppText size="large" color={colors.textMuted}>
        Desde aquí se juega con todas las categorías. Para practicar una sola, entra en Vocabulario y elige la categoría.
      </AppText>
      {games.map((g) => (
        <MenuCard
          key={g.id}
          title={g.titulo}
          description={`${g.descripcion} Trabaja: ${g.objetivos.join(', ').toLowerCase()}.`}
          icon={g.icono as IconName}
          onPress={() => router.push(g.ruta())}
        />
      ))}
    </Screen>
  );
}
