import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { activitiesForArea, activityHref, getArea, getObjective, isActivityUsable } from '@/activities/catalog';
import { activityObjectives, type ActivityDef } from '@/activities/types';
import type { IconName } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { MenuCard } from '@/components/MenuCard';
import { Screen } from '@/components/Screen';
import { Card, SectionHeader, Tag } from '@/components/ui';
import { useSettings } from '@/hooks/SettingsContext';
import { colors, spacing } from '@/theme';

/** Destino al abrir una actividad fuera de sesión (algunas piden antes un parámetro). */
function openActivity(a: ActivityDef) {
  if (a.id === 'vocabulario') router.push('/categorias');
  else if (a.id === 'fonologia') router.push('/fonologia');
  else if (a.id === 'frases') router.push('/juegos/frases');
  else router.push(activityHref(a.id));
}

export default function AreaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  const area = getArea(String(id));
  if (!area) {
    return (
      <Screen>
        <AppText>No se ha encontrado esta área.</AppText>
      </Screen>
    );
  }
  const activities = activitiesForArea(area.id).filter((a) => isActivityUsable(a, settings.seseo));

  return (
    <Screen>
      <Stack.Screen options={{ title: area.nombre }} />
      <AppText size="large" color={colors.textMuted}>
        {area.descripcion}
      </AppText>
      {activities.map((a) => (
        <MenuCard
          key={a.id}
          title={a.nombre}
          description={a.descripcion}
          icon={a.icono as IconName}
          onPress={() => openActivity(a)}
          footer={
            <View style={styles.tags}>
              {activityObjectives(a).map((o) => (
                <Tag key={o} label={getObjective(o)?.nombre ?? o} tone="primary" />
              ))}
            </View>
          }
        />
      ))}
      {area.previstas.length > 0 ? (
        <>
          <SectionHeader title="Próximamente en esta área" />
          <Card style={styles.future}>
            <AppText size="small" color={colors.textMuted}>
              {area.previstas.join(' · ')}
            </AppText>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  future: { boxShadow: undefined, backgroundColor: colors.background },
});
