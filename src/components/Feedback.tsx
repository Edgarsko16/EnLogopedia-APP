import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export type FeedbackKind = 'success' | 'retry' | 'info';

interface FeedbackProps {
  kind: FeedbackKind;
  message: string;
}

const config = {
  success: { icon: 'checkmark-circle', fg: colors.success, bg: colors.successBg },
  retry: { icon: 'refresh-circle', fg: colors.error, bg: colors.errorBg },
  info: { icon: 'information-circle', fg: colors.primary, bg: colors.surfaceAlt },
} as const;

/**
 * Mensaje de retroalimentación. Combina icono + texto + color (nunca solo
 * color) y se anuncia al lector de pantalla. No reproduce sonidos.
 */
export function Feedback({ kind, message }: FeedbackProps) {
  const c = config[kind];

  // En Android lo anuncia accessibilityLiveRegion; en iOS hay que pedirlo.
  useEffect(() => {
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      style={[styles.box, { backgroundColor: c.bg, borderColor: c.fg }]}
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={message}
    >
      <Ionicons name={c.icon} size={28} color={c.fg} importantForAccessibility="no" />
      <AppText weight="600" color={c.fg} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  text: { flex: 1 },
});
