import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { getArea } from '@/activities/catalog';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { Screen } from '@/components/Screen';
import { Card, SectionHeader, Tag } from '@/components/ui';
import { activityLabel, formatDateTime, labelFor } from '@/sessions/labels';
import { MIN_ROUNDS_FOR_RATE, profileStats, type ProfileStats } from '@/sessions/results';
import { useSessions } from '@/sessions/SessionsContext';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { plural } from '@/utils/text';

/** Seguimiento de un perfil: sesiones, áreas, actividades frecuentes y elementos a reforzar. */
export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, index, getSession, renameProfile, deleteProfile } = useSessions();
  const profile = profiles.find((p) => p.id === id);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [alias, setAlias] = useState(profile?.alias ?? '');
  const [message, setMessage] = useState<{ kind: 'retry' | 'success'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ids = index.filter((m) => m.profileId === id).map((m) => m.id).join(',');

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = [];
      for (const sid of ids ? ids.split(',') : []) {
        const s = await getSession(sid);
        if (s) list.push(s);
      }
      if (alive) setStats(profileStats(list));
    })();
    return () => {
      alive = false;
    };
  }, [ids, getSession]);

  if (!profile) {
    return (
      <Screen>
        <AppText>Este perfil no existe o se ha eliminado.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: profile.alias }} />
      <View style={styles.row}>
        <AppButton
          label="Nueva sesión con este perfil"
          icon="play"
          style={styles.flex}
          onPress={() => router.push({ pathname: '/sesion/nueva', params: { perfil: profile.id } })}
        />
        <AppButton
          label="Ver historial"
          icon="time"
          variant="secondary"
          style={styles.flex}
          onPress={() => router.push({ pathname: '/historial', params: { perfil: profile.id } })}
        />
      </View>

      <SectionHeader title="Seguimiento" subtitle="Orientativo: no sustituye a la valoración profesional." />
      {!stats ? (
        <AppText color={colors.textMuted}>Cargando…</AppText>
      ) : stats.sesiones === 0 ? (
        <AppText color={colors.textMuted}>Todavía no hay sesiones finalizadas con este perfil.</AppText>
      ) : (
        <>
          <Card>
            <AppText>
              {plural(stats.sesiones, 'sesión finalizada', 'sesiones finalizadas')}
              {stats.ultima ? ` · última: ${formatDateTime(stats.ultima)}` : ''}
            </AppText>
            <View style={styles.tags}>
              {stats.areas.map((a) => (
                <Tag key={a} label={getArea(a)?.nombre ?? a} tone="primary" />
              ))}
            </View>
          </Card>
          <Card>
            <AppText weight="700" color={colors.navy}>
              Actividades más frecuentes
            </AppText>
            {stats.frecuentes.slice(0, 5).map((f) => (
              <AppText key={f.activityId}>
                • {activityLabel(f.activityId)}: {plural(f.veces, 'vez', 'veces')}
              </AppText>
            ))}
          </Card>
          <Card>
            <AppText weight="700" color={colors.navy}>
              Elementos con dificultad repetida
            </AppText>
            <AppText size="small" color={colors.textMuted}>
              Trabajados al menos 2 veces con errores en la mitad o más, o con 2 o más valoraciones «con ayuda» o «incorrecto».
            </AppText>
            {stats.dificultades.length === 0 ? (
              <AppText>Ninguno por ahora.</AppText>
            ) : (
              stats.dificultades.slice(0, 12).map((d) => (
                <AppText key={d.elemento}>
                  • {labelFor(d.elemento)}
                  {d.exposiciones > 0 ? ` · errores en ${d.rondasConError} de ${d.exposiciones} rondas` : ''}
                  {d.manualDificultad > 0 ? ` · ${d.manualDificultad} con ayuda o incorrectas` : ''}
                </AppText>
              ))
            )}
          </Card>
          <Card>
            <AppText weight="700" color={colors.navy}>
              Actividades a reforzar
            </AppText>
            <AppText size="small" color={colors.textMuted}>
              Menos del 60 % a la primera con al menos {MIN_ROUNDS_FOR_RATE} rondas, o la mitad o más de valoraciones con ayuda o incorrectas.
            </AppText>
            {stats.reforzar.length === 0 ? (
              <AppText>Ninguna por ahora.</AppText>
            ) : (
              stats.reforzar.map((r) => (
                <AppText key={`${r.activityId}-${r.modalidad}`}>
                  • {activityLabel(r.activityId, r.modalidad)}
                  {r.tasa !== null ? ` · ${r.tasa} % a la primera (${r.rondas} rondas)` : ''}
                  {r.manualTotal > 0 ? ` · ${r.manualDificultad} de ${r.manualTotal} con ayuda o incorrectas` : ''}
                </AppText>
              ))
            )}
          </Card>
        </>
      )}

      <SectionHeader title="Cambiar alias" />
      <View style={styles.row}>
        <TextInput
          value={alias}
          onChangeText={(t) => {
            setAlias(t);
            setMessage(null);
          }}
          accessibilityLabel="Nuevo alias"
          maxLength={30}
          autoCorrect={false}
          style={styles.input}
        />
        <AppButton
          label="Guardar"
          icon="save"
          disabled={!alias.trim() || alias.trim() === profile.alias}
          onPress={() => {
            const err = renameProfile(profile.id, alias);
            setMessage(err ? { kind: 'retry', text: err } : { kind: 'success', text: 'Alias actualizado.' });
          }}
        />
      </View>
      {message ? <Feedback kind={message.kind} message={message.text} /> : null}

      <SectionHeader title="Eliminar perfil" />
      {confirmDelete ? (
        <Card style={styles.danger}>
          <AppText weight="700">
            Se eliminarán el perfil «{profile.alias}» y sus {plural(index.filter((m) => m.profileId === id).length, 'sesión', 'sesiones')}. No se puede deshacer.
          </AppText>
          <View style={styles.row}>
            <AppButton
              label="Sí, eliminar todo"
              variant="danger"
              style={styles.flex}
              onPress={async () => {
                await deleteProfile(profile.id);
                router.replace('/perfiles');
              }}
            />
            <AppButton label="Cancelar" variant="ghost" style={styles.flex} onPress={() => setConfirmDelete(false)} />
          </View>
        </Card>
      ) : (
        <AppButton label="Eliminar perfil y sus registros" icon="trash" variant="danger" onPress={() => setConfirmDelete(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  flex: { flex: 1, minWidth: 180 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  input: {
    flex: 1,
    minWidth: 200,
    minHeight: MIN_TOUCH,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  danger: { backgroundColor: colors.errorBg, borderColor: colors.error },
});
