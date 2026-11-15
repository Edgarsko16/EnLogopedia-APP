import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { EMPTY_OBSERVATIONS, type Observations } from '@/sessions/types';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { Feedback } from './Feedback';

const FIELDS: { key: keyof Observations; label: string; placeholder: string }[] = [
  { key: 'dificultades', label: 'Dificultades observadas', placeholder: 'Ej.: confunde cuchara y tenedor' },
  { key: 'apoyos', label: 'Apoyos empleados', placeholder: 'Ej.: pista del primer sonido' },
  { key: 'reforzar', label: 'Objetivos para reforzar', placeholder: 'Ej.: categorías de alimentos' },
];

export const OBS_MAX = 500;

/** Observaciones breves y opcionales de la sesión. Se pueden editar o eliminar. */
export function ObservationsForm({
  initial,
  onSave,
}: {
  initial?: Observations;
  onSave: (obs: Observations | null) => Promise<void> | void;
}) {
  const [obs, setObs] = useState<Observations>(initial ?? EMPTY_OBSERVATIONS);
  const [saved, setSaved] = useState<string | null>(null);
  const hasAny = !!(initial && (initial.dificultades || initial.apoyos || initial.reforzar));

  return (
    <View style={styles.wrap}>
      <Feedback kind="info" message="No escribas nombres, diagnósticos ni otros datos que permitan identificar a la persona." />
      {FIELDS.map((f) => (
        <View key={f.key} style={styles.field}>
          <AppText weight="600" nativeID={`obs-${f.key}`}>
            {f.label}
          </AppText>
          <TextInput
            value={obs[f.key]}
            onChangeText={(t) => {
              setObs((o) => ({ ...o, [f.key]: t }));
              setSaved(null);
            }}
            placeholder={f.placeholder}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={f.label}
            accessibilityLabelledBy={`obs-${f.key}`}
            multiline
            maxLength={OBS_MAX}
            style={styles.input}
          />
        </View>
      ))}
      <View style={styles.row}>
        <AppButton
          label="Guardar observaciones"
          icon="save"
          style={styles.flex}
          onPress={async () => {
            await onSave(obs);
            setSaved('Observaciones guardadas.');
          }}
        />
        {hasAny ? (
          <AppButton
            label="Eliminar"
            icon="trash"
            variant="danger"
            onPress={async () => {
              setObs(EMPTY_OBSERVATIONS);
              await onSave(null);
              setSaved('Observaciones eliminadas.');
            }}
          />
        ) : null}
      </View>
      {saved ? <Feedback kind="success" message={saved} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH + 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1, minWidth: 180 },
});
