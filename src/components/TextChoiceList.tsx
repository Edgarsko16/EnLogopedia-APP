import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

export interface TextOption {
  id: string;
  text: string;
}

interface TextChoiceListProps {
  options: TextOption[];
  answerId: string;
  onSolved: (firstTry: boolean) => void;
  onWrong?: (option: TextOption) => void;
  /** Muestra un botón para escuchar cada opción (si la voz está activa). */
  listenButtons?: boolean;
}

/**
 * Lista de opciones de texto (una correcta). Las fallidas quedan marcadas con
 * ✗ y desactivadas; la correcta, con ✓. Cambia la `key` para una ronda nueva.
 */
export function TextChoiceList({ options, answerId, onSolved, onWrong, listenButtons = true }: TextChoiceListProps) {
  const { speak, enabled } = useSpeech();
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const choose = (o: TextOption) => {
    if (solved || wrong.includes(o.id)) return;
    if (o.id === answerId) {
      setSolved(true);
      onSolved(wrong.length === 0);
    } else {
      setWrong((w) => [...w, o.id]);
      onWrong?.(o);
    }
  };

  return (
    <View style={styles.list}>
      {options.map((o) => {
        const isWrong = wrong.includes(o.id);
        const isRight = solved && o.id === answerId;
        const disabled = solved || isWrong;
        return (
          <View key={o.id} style={styles.row}>
            <Pressable
              onPress={() => choose(o)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`${o.text}${isWrong ? ', incorrecta' : ''}${isRight ? ', correcta' : ''}`}
              accessibilityState={{ disabled, selected: isRight }}
              style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                styles.option,
                pressed && styles.pressed,
                focused && !disabled && styles.focused,
                isRight && styles.right,
                isWrong && styles.wrong,
              ]}
            >
              <AppText size="large" weight="600" color={isWrong ? colors.error : isRight ? colors.success : colors.text}>
                {isWrong ? '✗ ' : isRight ? '✓ ' : ''}
                {o.text}
              </AppText>
            </Pressable>
            {listenButtons && enabled ? (
              <AppButton label="Oír" icon="volume-medium" variant="ghost" compact onPress={() => speak(o.text)} accessibilityLabel={`Escuchar: ${o.text}`} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH + 8,
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  right: { borderColor: colors.success, backgroundColor: colors.successBg },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorBg },
});
