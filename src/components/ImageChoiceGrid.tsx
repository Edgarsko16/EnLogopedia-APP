import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, radius, spacing } from '@/theme';
import type { Word } from '@/types/content';
import { capitalize } from '@/utils/text';
import { AppText } from './AppText';
import { Photo } from './Photo';

interface ImageChoiceGridProps {
  options: Word[];
  answerId: string;
  /** Se llama una vez, al acertar; `firstTry` indica si fue sin fallos. */
  onSolved: (firstTry: boolean) => void;
  onWrong?: (word: Word) => void;
  /** Muestra el nombre bajo cada foto (útil en semántica; no en "busca"). */
  showLabels?: boolean;
  /** Locuta el nombre de la imagen al pulsarla. */
  speakOnPress?: boolean;
}

/**
 * Rejilla para elegir una imagen entre varias. Gestiona fallos (la opción
 * fallida queda marcada y desactivada) y el acierto. Para una ronda nueva,
 * el componente padre debe cambiar su `key`.
 */
export function ImageChoiceGrid({ options, answerId, onSolved, onWrong, showLabels, speakOnPress }: ImageChoiceGridProps) {
  const { width } = useWindowDimensions();
  const { speak } = useSpeech();
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const columns = options.length <= 4 ? 2 : width >= 700 ? 3 : 2;
  const itemWidth = `${100 / columns - 2}%` as const;

  const choose = (w: Word) => {
    if (solved || wrong.includes(w.id)) return;
    if (speakOnPress) speak(w.palabra);
    if (w.id === answerId) {
      setSolved(true);
      onSolved(wrong.length === 0);
    } else {
      setWrong((x) => [...x, w.id]);
      onWrong?.(w);
    }
  };

  return (
    <View style={styles.grid}>
      {options.map((w) => {
        const isWrong = wrong.includes(w.id);
        const isRight = solved && w.id === answerId;
        const disabled = solved || isWrong;
        return (
          <Pressable
            key={w.id}
            onPress={() => choose(w)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${w.palabra}${isWrong ? ', incorrecta' : ''}${isRight ? ', correcta' : ''}`}
            accessibilityState={{ disabled, selected: isRight }}
            style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
              styles.option,
              { width: itemWidth },
              pressed && styles.pressed,
              focused && !disabled && styles.focused,
              isRight && styles.right,
              isWrong && styles.wrong,
            ]}
          >
            <Photo imageKey={w.imagen} label={null} aspectRatio={1} style={isWrong ? styles.dim : undefined} />
            {showLabels ? (
              <AppText weight="600" align="center" style={styles.label}>
                {capitalize(w.palabra)}
              </AppText>
            ) : null}
            {isRight || isWrong ? (
              <View style={[styles.badge, { backgroundColor: isRight ? colors.success : colors.error }]}>
                <Ionicons name={isRight ? 'checkmark' : 'close'} size={28} color={colors.onPrimary} importantForAccessibility="no" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  option: {
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: 4,
    maxWidth: 300,
  },
  pressed: { borderColor: colors.primary },
  focused: { borderColor: colors.focus },
  right: { borderColor: colors.success, backgroundColor: colors.successBg },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorBg },
  dim: { opacity: 0.45 },
  label: { paddingVertical: spacing.xs },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
