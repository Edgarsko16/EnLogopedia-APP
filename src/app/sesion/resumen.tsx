import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { ObservationsForm } from '@/components/ObservationsForm';
import { Screen } from '@/components/Screen';
import { SessionSummaryView } from '@/components/SessionSummaryView';
import { SectionHeader } from '@/components/ui';
import { useSessions } from '@/sessions/SessionsContext';
import type { Session } from '@/sessions/types';
import { colors, spacing } from '@/theme';

/** Resumen al terminar una sesión, con observaciones opcionales. */
export default function SessionEndScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession, saveObservations, profiles } = useSessions();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getSession(String(id)).then((s) => alive && setSession(s));
    return () => {
      alive = false;
    };
  }, [id, getSession]);

  if (session === undefined) {
    return (
      <Screen>
        <AppText color={colors.textMuted}>Cargando resumen…</AppText>
      </Screen>
    );
  }
  if (!session) {
    return (
      <Screen>
        <AppText>No se ha encontrado la sesión.</AppText>
      </Screen>
    );
  }
  const alias = profiles.find((p) => p.id === session.profileId)?.alias;

  return (
    <Screen>
      <AppText size="title" weight="800" color={colors.navy} accessibilityRole="header">
        {session.status === 'finalizada' ? 'Sesión finalizada' : 'Resumen provisional'}
      </AppText>
      <SessionSummaryView session={session} profileAlias={alias} />
      <SectionHeader title="Observaciones" subtitle="Opcionales. Puedes editarlas después desde el historial." />
      <ObservationsForm
        initial={session.observaciones}
        onSave={async (obs) => {
          const s = await saveObservations(session.id, obs);
          if (s) setSession(s);
        }}
      />
      <View style={styles.row}>
        <AppButton label="Ir al inicio" icon="home" style={styles.flex} onPress={() => router.replace('/')} />
        <AppButton label="Ver historial" icon="time" variant="secondary" style={styles.flex} onPress={() => router.replace('/historial')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1, minWidth: 160 },
});
