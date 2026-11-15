/**
 * Piezas básicas del sistema de diseño: tarjeta, etiqueta, barra de progreso
 * y cabecera de sección. Centralizan estilos que antes se repetían en cada
 * pantalla.
 */
import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';
import { AppText } from './AppText';

export function Card({ children, style, soft }: { children: ReactNode; style?: StyleProp<ViewStyle>; soft?: boolean }) {
  return <View style={[styles.card, soft && styles.cardSoft, style]}>{children}</View>;
}

export type TagTone = 'neutral' | 'primary' | 'success' | 'error' | 'warning';

const tagTone: Record<TagTone, { fg: string; bg: string }> = {
  neutral: { fg: colors.textMuted, bg: colors.background },
  primary: { fg: colors.primary, bg: colors.primarySoft },
  success: { fg: colors.success, bg: colors.successBg },
  error: { fg: colors.error, bg: colors.errorBg },
  warning: { fg: colors.warning, bg: colors.warningBg },
};

/** Etiqueta pequeña (área, estado, «Próximamente»…). El texto siempre es visible. */
export function Tag({ label, tone = 'neutral' }: { label: string; tone?: TagTone }) {
  const t = tagTone[tone];
  return (
    <View style={[styles.tag, { backgroundColor: t.bg, borderColor: t.fg }]}>
      <AppText size="small" weight="600" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

/** Barra de progreso accesible: el valor se anuncia como texto, no solo con la barra. */
export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={styles.progressWrap}
    >
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <AppText size="small" color={colors.textMuted} importantForAccessibility="no">
        {label}
      </AppText>
    </View>
  );
}

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTexts}>
        <AppText size="large" weight="800" color={colors.navy} accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? <AppText color={colors.textMuted}>{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardSoft: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, boxShadow: undefined },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  progressWrap: { gap: spacing.xs },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.borderSoft, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  section: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  sectionTexts: { flex: 1, gap: 2 },
});
