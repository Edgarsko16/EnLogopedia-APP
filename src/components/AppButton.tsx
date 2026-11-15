import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export type IconName = ComponentProps<typeof Ionicons>['name'];
type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: Variant;
  disabled?: boolean;
  /** Texto para lector de pantalla si difiere de la etiqueta visible. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Para botones tipo interruptor (mostrar/ocultar texto). */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

const palette: Record<Variant, { bg: string; fg: string; border: string; pressed: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, pressed: colors.primaryPressed },
  secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary, pressed: colors.surfaceAlt },
  ghost: { bg: 'transparent', fg: colors.text, border: colors.border, pressed: colors.surfaceAlt },
  success: { bg: colors.successBg, fg: colors.success, border: colors.success, pressed: '#CDEBD6' },
  danger: { bg: colors.errorBg, fg: colors.error, border: colors.error, pressed: '#F5D3CC' },
};

/**
 * Botón accesible: siempre con texto visible (los iconos solo acompañan),
 * objetivo táctil mínimo de 48 dp y estados pulsado/desactivado visibles.
 */
export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  accessibilityLabel,
  accessibilityHint,
  selected,
  style,
  compact,
}: AppButtonProps) {
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected }}
      hitSlop={4}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: pressed ? p.pressed : p.bg, borderColor: p.border },
        focused && styles.focused,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={22} color={p.fg} importantForAccessibility="no" /> : null}
        <AppText weight="600" color={p.fg} align="center">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compact: { paddingHorizontal: spacing.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  disabled: { opacity: 0.45 },
});
