import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius, shadows, spacing } from '@/theme';
import type { IconName } from './AppButton';
import { AppText } from './AppText';

interface MenuCardProps {
  title: string;
  description?: string;
  icon: IconName;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  /** Contenido extra bajo la descripción (etiquetas, avisos). */
  footer?: ReactNode;
  /** Variante destacada (acción principal de la pantalla). */
  emphasis?: boolean;
}

/** Tarjeta grande de menú (inicio, áreas, listas de actividades). */
export function MenuCard({ title, description, icon, onPress, color = colors.primary, disabled, footer, emphasis }: MenuCardProps) {
  const fg = emphasis ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.card,
        emphasis && styles.emphasis,
        pressed && (emphasis ? styles.emphasisPressed : styles.pressed),
        focused && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: emphasis ? 'rgba(255,255,255,0.16)' : color }]}>
        <Ionicons name={icon} size={28} color={colors.onPrimary} importantForAccessibility="no" />
      </View>
      <View style={styles.texts}>
        <AppText size="large" weight="700" color={fg}>
          {title}
        </AppText>
        {description ? <AppText color={emphasis ? colors.onPrimary : colors.textMuted}>{description}</AppText> : null}
        {footer}
      </View>
      <Ionicons name="chevron-forward" size={24} color={emphasis ? colors.onPrimary : colors.textMuted} importantForAccessibility="no" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH + 24,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
  },
  emphasis: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadows.raised },
  emphasisPressed: { backgroundColor: colors.primaryPressed },
  pressed: { backgroundColor: colors.surfaceAlt },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  disabled: { opacity: 0.45 },
  iconBox: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
});
