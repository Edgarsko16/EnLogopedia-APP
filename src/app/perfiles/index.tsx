import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { MenuCard } from '@/components/MenuCard';
import { Screen } from '@/components/Screen';
import { Card, SectionHeader } from '@/components/ui';
import { checkAlias } from '@/sessions/profiles';
import { formatDateTime } from '@/sessions/labels';
import { useSessions } from '@/sessions/SessionsContext';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { plural } from '@/utils/text';

/** Perfiles locales mediante alias no identificativos. */
export default function ProfilesScreen() {
  const { profiles, index, createProfile, ready } = useSessions();
  const [alias, setAlias] = useState('');
  const [message, setMessage] = useState<{ kind: 'retry' | 'info' | 'success'; text: string } | null>(null);
  const check = alias.trim() ? checkAlias(alias, profiles) : null;

  const create = () => {
    const r = createProfile(alias);
    if (!r.ok) {
      setMessage({ kind: 'retry', text: r.error });
      return;
    }
    setAlias('');
    setMessage({ kind: 'success', text: `Perfil «${r.profile.alias}» creado.` });
  };

  return (
    <Screen>
      <Card soft>
        <AppText weight="700" color={colors.navy}>
          Usa códigos, no nombres
        </AppText>
        <AppText>
          Los perfiles solo sirven para ordenar el historial. Escribe un alias no identificativo como «Usuario 01» o «Caso A».
          No introduzcas nombres, fechas de nacimiento, diagnósticos ni otros datos personales. Todo se guarda solo en este
          dispositivo.
        </AppText>
      </Card>

      <SectionHeader title="Nuevo perfil" />
      <View style={styles.row}>
        <TextInput
          value={alias}
          onChangeText={(t) => {
            setAlias(t);
            setMessage(null);
          }}
          placeholder="Alias, por ejemplo «Usuario 01»"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Alias del nuevo perfil"
          maxLength={30}
          autoCorrect={false}
          autoComplete="off"
          onSubmitEditing={create}
          style={styles.input}
        />
        <AppButton label="Crear" icon="add" onPress={create} disabled={!alias.trim() || (check !== null && !check.ok)} />
      </View>
      {check && !check.ok ? <Feedback kind="retry" message={check.error} /> : null}
      {check && check.ok && check.warning ? <Feedback kind="info" message={check.warning} /> : null}
      {message ? <Feedback kind={message.kind} message={message.text} /> : null}

      <SectionHeader title="Perfiles" subtitle={ready ? plural(profiles.length, 'perfil', 'perfiles') : 'Cargando…'} />
      {profiles.length === 0 && ready ? <AppText color={colors.textMuted}>Todavía no hay perfiles.</AppText> : null}
      {profiles.map((p) => {
        const n = index.filter((m) => m.profileId === p.id && m.status === 'finalizada').length;
        return (
          <MenuCard
            key={p.id}
            title={p.alias}
            description={`${plural(n, 'sesión', 'sesiones')}${p.lastActivityAt ? ` · última: ${formatDateTime(p.lastActivityAt)}` : ''}`}
            icon="person-circle"
            onPress={() => router.push({ pathname: '/perfiles/[id]', params: { id: p.id } })}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
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
});
