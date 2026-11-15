import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { MenuCard } from '@/components/MenuCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme';

/** Menú de ejercicios de semántica (relaciones de significado entre palabras). */
export default function SemanticsMenuScreen() {
  return (
    <Screen>
      <AppText size="large" color={colors.textMuted}>
        Ejercicios para trabajar el significado de las palabras y cómo se relacionan entre sí.
      </AppText>
      <MenuCard
        title="Categorizar"
        description="¿A qué grupo pertenece cada foto? Trabaja la organización del vocabulario."
        icon="file-tray-stacked"
        onPress={() => router.push('/semantica/categorizar')}
      />
      <MenuCard
        title="¿Cuál no pertenece?"
        description="Encuentra la foto que no es del mismo grupo que las demás."
        icon="remove-circle"
        color={colors.accent}
        onPress={() => router.push('/semantica/intruso')}
      />
      <MenuCard
        title="Asociaciones"
        description="¿Qué va con…? Une cada foto con la que se relaciona."
        icon="git-compare"
        onPress={() => router.push('/semantica/asociaciones')}
      />
      <MenuCard
        title="Funciones"
        description="¿Para qué sirve? ¿Qué usamos para…? Trabaja el uso de los objetos."
        icon="construct"
        color={colors.accent}
        onPress={() => router.push('/semantica/funciones')}
      />
    </Screen>
  );
}
