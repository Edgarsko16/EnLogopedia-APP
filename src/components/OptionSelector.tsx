import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export interface Option<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface OptionSelectorProps<T> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Selector de una opción entre varias (tipo "radio"). La opción activa se
 * distingue por fondo, borde y marca de texto, no solo por color.
 */
export function OptionSelector<T extends string | number>({ label, options, value, onChange }: OptionSelectorProps<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText weight="600">{label}</AppText>
      <View style={styles.row}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              disabled={o.disabled}
              accessibilityRole="radio"
              accessibilityLabel={o.label}
              accessibilityState={{ checked: selected, disabled: !!o.disabled }}
              style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                styles.option,
                pressed && !selected && styles.pressed,
                selected && styles.selected,
                focused && styles.focused,
                o.disabled && styles.disabled,
              ]}
            >
              <AppText weight={selected ? '700' : '400'} color={selected ? colors.onPrimary : colors.text}>
                {selected ? `✓ ${o.label}` : o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.surfaceAlt },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  disabled: { opacity: 0.4 },
});
