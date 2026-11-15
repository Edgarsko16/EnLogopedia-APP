import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { activitiesForArea, AREAS, isActivityUsable } from '@/activities/catalog';
import type { IconName } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { MenuCard } from '@/components/MenuCard';
import { Screen } from '@/components/Screen';
import { Card, SectionHeader, Tag } from '@/components/ui';
import { useSettings } from '@/hooks/SettingsContext';
import { colors, spacing } from '@/theme';
import { plural } from '@/utils/text';

/** Áreas de intervención. Las que aún no tienen actividades no son navegables. */
export default function AreasScreen() {
  const { settings } = useSettings();
  const withCount = AREAS.map((area) => ({
    area,
    count: activitiesForArea(area.id).filter((a) => isActivityUsable(a, settings.seseo)).length,
  }));
  const active = withCount.filter((x) => x.count > 0);
  const future = withCount.filter((x) => x.count === 0);

  return (
    <Screen>
      <AppText size="large" color={colors.textMuted}>
        Actividades agrupadas por área. Una misma actividad puede aparecer en varias áreas.
      </AppText>
      {active.map(({ area, count }) => (
        <MenuCard
          key={area.id}
          title={area.nombre}
          description={`${area.descripcion} ${plural(count, 'actividad', 'actividades')}.`}
          icon={area.icono as IconName}
          onPress={() => router.push({ pathname: '/areas/[id]', params: { id: area.id } })}
        />
      ))}

      {future.length > 0 ? <SectionHeader title="Próximamente" subtitle="Áreas preparadas que se ampliarán en próximas versiones." /> : null}
      {future.map(({ area }) => (
        <Card key={area.id} style={styles.future}>
          <View style={styles.futureHead}>
            <AppText size="large" weight="700" color={colors.textMuted}>
              {area.nombre}
            </AppText>
            <Tag label="Próximamente" />
          </View>
          {area.previstas.length > 0 ? (
            <AppText size="small" color={colors.textMuted}>
              Previsto: {area.previstas.join(', ').toLowerCase()}.
            </AppText>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  future: { boxShadow: undefined, backgroundColor: colors.background },
  futureHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
});
