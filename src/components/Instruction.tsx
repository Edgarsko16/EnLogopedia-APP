import { StyleSheet, View } from 'react-native';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, radius, spacing } from '@/theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

interface InstructionProps {
  text: string;
  /** Texto que se locuta, si difiere del visible. */
  spokenText?: string;
}

/** Instrucción del ejercicio con botón para escucharla (si el audio está activo). */
export function Instruction({ text, spokenText }: InstructionProps) {
  const { speak, enabled } = useSpeech();
  return (
    <View style={styles.box}>
      <AppText size="large" weight="700" color={colors.navy} style={styles.text} accessibilityRole="header">
        {text}
      </AppText>
      {enabled ? (
        <AppButton
          label="Escuchar"
          icon="volume-high"
          variant="secondary"
          compact
          onPress={() => speak(spokenText ?? text)}
          accessibilityLabel="Escuchar la instrucción"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  text: { flex: 1, minWidth: 160 },
});
