import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { ObservationsForm } from '@/components/ObservationsForm';
import { Screen } from '@/components/Screen';
import { SessionSummaryView } from '@/components/SessionSummaryView';
import { Card, SectionHeader } from '@/components/ui';
import { currentHref } from '@/sessions/navigation';
import { useSessions } from '@/sessions/SessionsContext';
import type { Session } from '@/sessions/types';
import { colors, spacing } from '@/theme';

/** Detalle de una sesión del historial: resumen, errores, observaciones y eliminación. */
export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession, saveObservations, deleteSession, profiles, active, resume } = useSessions();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [confirm, setConfirm] = useState(false);

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
        <AppText color={colors.textMuted}>Cargando…</AppText>
      </Screen>
    );
  }
  if (!session) {
    return (
      <Screen>
        <AppText>No se ha encontrado la sesión (puede haberse eliminado).</AppText>
      </Screen>
    );
  }
  const alias = profiles.find((p) => p.id === session.profileId)?.alias;
  const isActive = active?.id === session.id;

  return (
    <Screen>
      {isActive ? (
        <AppButton
          label="Continuar esta sesión"
          icon="play"
          onPress={() => {
            const s = active.status === 'pausada' ? resume() : active;
            if (s) router.replace(currentHref(s));
          }}
        />
      ) : null}
      <SessionSummaryView session={session} profileAlias={alias} />
      <SectionHeader title="Observaciones" />
      <ObservationsForm
        initial={session.observaciones}
        onSave={async (obs) => {
          const s = await saveObservations(session.id, obs);
          if (s) setSession(s);
        }}
      />
      <SectionHeader title="Eliminar sesión" />
      {confirm ? (
        <Card style={styles.danger}>
          <AppText weight="700">Se eliminará esta sesión y todos sus resultados. No se puede deshacer.</AppText>
          <View style={styles.row}>
            <AppButton
              label="Sí, eliminar"
              variant="danger"
              style={styles.flex}
              onPress={async () => {
                await deleteSession(session.id);
                router.back();
              }}
            />
            <AppButton label="Cancelar" variant="ghost" style={styles.flex} onPress={() => setConfirm(false)} />
          </View>
        </Card>
      ) : (
        <AppButton label="Eliminar sesión" icon="trash" variant="danger" onPress={() => setConfirm(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1, minWidth: 160 },
  danger: { backgroundColor: colors.errorBg, borderColor: colors.error },
});
