import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActivity } from '@/activities/catalog';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { MenuCard } from '@/components/MenuCard';
import { Card, SectionHeader, Tag } from '@/components/ui';
import { BRAND } from '@/content/brand';
import { formatDateTime } from '@/sessions/labels';
import { currentHref } from '@/sessions/navigation';
import { useSessions } from '@/sessions/SessionsContext';
import { colors, CONTENT_MAX_WIDTH, spacing } from '@/theme';
import { plural } from '@/utils/text';

/** Portada profesional: sesión, actividades, perfiles e historial. */
export default function HomeScreen() {
  const { active, profiles, index, resume, ready } = useSessions();
  const finished = index.filter((m) => m.status === 'finalizada').length;
  const activeAlias = active ? (profiles.find((p) => p.id === active.profileId)?.alias ?? 'sin perfil') : '';
  const activeItem = active ? active.items[active.currentIndex] : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BrandLogo height={120} asHeader />
          <View style={styles.headerText}>
            <AppText size="large" weight="600" color={colors.navy}>
              {BRAND.lema}
            </AppText>
          </View>
        </View>

        {active && ready ? (
          <MenuCard
            emphasis
            title="Continuar sesión"
            description={`${activeAlias} · empezada el ${formatDateTime(active.createdAt)} · actividad ${Math.min(active.currentIndex + 1, active.items.length)} de ${active.items.length}${activeItem ? `: ${getActivity(activeItem.activityId)?.nombre}` : ''}`}
            icon="play-circle"
            onPress={() => {
              const s = active.status === 'pausada' ? resume() : active;
              if (s) router.push(currentHref(s));
            }}
          />
        ) : null}
        <MenuCard
          emphasis={!active}
          title="Nueva sesión"
          description="Elige perfil y actividades, o pide una propuesta por área y objetivo."
          icon="add-circle"
          onPress={() => router.push('/sesion/nueva')}
        />

        <View style={styles.grid}>
          <View style={styles.cell}>
            <MenuCard title="Actividades por áreas" description="Usa cualquier ejercicio sin crear una sesión." icon="apps" onPress={() => router.push('/areas')} />
          </View>
          <View style={styles.cell}>
            <MenuCard
              title="Perfiles"
              description={ready ? plural(profiles.length, 'perfil', 'perfiles') : ' '}
              icon="people"
              color={colors.turquoiseDark}
              onPress={() => router.push('/perfiles')}
            />
          </View>
          <View style={styles.cell}>
            <MenuCard
              title="Historial"
              description={ready ? plural(finished, 'sesión finalizada', 'sesiones finalizadas') : ' '}
              icon="time"
              color={colors.turquoiseDark}
              onPress={() => router.push('/historial')}
            />
          </View>
          <View style={styles.cell}>
            <MenuCard title="Ajustes" description="Voz, texto, dificultad, seseo y animaciones." icon="settings" color={colors.textMuted} onPress={() => router.push('/ajustes')} />
          </View>
        </View>

        <SectionHeader title="Acceso rápido" />
        <View style={styles.quick}>
          {[
            { label: 'Vocabulario', href: '/categorias' as const },
            { label: 'Juegos', href: '/juegos' as const },
            { label: 'Semántica', href: '/semantica' as const },
            { label: 'Fonema inicial', href: '/fonologia' as const },
          ].map((q) => (
            <AppButton key={q.label} label={q.label} icon="arrow-forward" variant="secondary" style={styles.quickCell} onPress={() => router.push(q.href)} />
          ))}
        </View>

        <Card soft>
          <View style={styles.privacy}>
            <Tag label="Sin conexión" tone="primary" />
            <AppText size="small" color={colors.text} style={styles.flex}>
              Todo se guarda solo en este dispositivo. Usa alias no identificativos en los perfiles.
            </AppText>
          </View>
        </Card>
        <MenuCard title="Créditos de las imágenes" icon="information-circle" color={colors.textMuted} onPress={() => router.push('/creditos')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap', paddingVertical: spacing.sm },
  headerText: { flex: 1, minWidth: 200, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flexBasis: 300, flexGrow: 1 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickCell: { flexBasis: 160, flexGrow: 1 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 180 },
});
