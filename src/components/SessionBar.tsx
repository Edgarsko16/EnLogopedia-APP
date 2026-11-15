import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activityHref, getActivity } from '@/activities/catalog';
import { useActivityRun } from '@/sessions/useActivityRun';
import { useSessions } from '@/sessions/SessionsContext';
import { colors, radius, spacing } from '@/theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { ProgressBar } from './ui';

/**
 * Barra de sesión: solo aparece si la pantalla es la actividad actual de una
 * sesión en curso. Oculta la cabecera de navegación para dejar más espacio
 * y ofrece pausa, siguiente actividad y finalizar.
 */
export function SessionBar() {
  const run = useActivityRun();
  const { active, goTo, pause, finish } = useSessions();
  const [confirm, setConfirm] = useState(false);
  const insets = useSafeAreaInsets();
  if (!run.inSession || !active || !run.item) return null;

  const total = active.items.length;
  const pos = active.currentIndex + 1;
  const activity = getActivity(run.item.activityId);
  const modality = activity?.modalidades.find((m) => m.id === run.item!.modalidad);
  const isLast = pos >= total;

  const goNext = () => {
    if (isLast) {
      const done = finish();
      router.replace({ pathname: '/sesion/resumen', params: { id: done?.id ?? active.id } });
      return;
    }
    const s = goTo(active.currentIndex + 1);
    const next = s?.items[s.currentIndex];
    if (s && next) router.replace(activityHref(next.activityId, { modalidad: next.modalidad, params: next.params, sesion: next.uid }));
  };

  return (
    <View style={[styles.bar, { marginTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText size="small" weight="700" color={colors.primary}>
            SESIÓN · ACTIVIDAD {pos} DE {total}
          </AppText>
          <AppText size="large" weight="800" color={colors.navy} accessibilityRole="header">
            {activity?.nombre}
            {modality && activity && activity.modalidades.length > 1 ? ` · ${modality.nombre}` : ''}
          </AppText>
        </View>
      </View>
      <ProgressBar value={active.currentIndex} max={total} label={`Actividad ${pos} de ${total}`} />
      {confirm ? (
        <View style={styles.confirm}>
          <AppText weight="600">¿Finalizar la sesión? Las actividades no empezadas quedarán como saltadas.</AppText>
          <View style={styles.row}>
            <AppButton
              label="Sí, finalizar"
              variant="danger"
              compact
              style={styles.flex}
              onPress={() => {
                const done = finish();
                router.replace({ pathname: '/sesion/resumen', params: { id: done?.id ?? active.id } });
              }}
            />
            <AppButton label="Seguir" variant="ghost" compact style={styles.flex} onPress={() => setConfirm(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <AppButton
            label="Pausa"
            icon="pause"
            variant="ghost"
            compact
            accessibilityHint="Guarda la sesión para continuarla después"
            onPress={() => {
              pause();
              router.replace('/');
            }}
          />
          <AppButton
            label={isLast ? 'Terminar' : 'Siguiente actividad'}
            icon={isLast ? 'flag' : 'play-skip-forward'}
            variant="secondary"
            compact
            style={styles.flex}
            accessibilityHint={isLast ? 'Finaliza la sesión y muestra el resumen' : 'Pasa a la siguiente actividad de la sesión'}
            onPress={goNext}
          />
          {!isLast ? <AppButton label="Finalizar" icon="stop" variant="ghost" compact onPress={() => setConfirm(true)} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 120 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  confirm: { gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.warningBg, borderRadius: radius.md },
});
