import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors, MIN_TOUCH, spacing } from '@/theme';
import { AppText } from './AppText';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Fila de interruptor. Toda la fila es pulsable, no solo el Switch. */
export function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      style={styles.row}
    >
      <View style={styles.texts}>
        <AppText weight="600">{label}</AppText>
        {description ? (
          <AppText size="small" color={colors.textMuted}>
            {description}
          </AppText>
        ) : null}
      </View>
      <AppText size="small" color={colors.textMuted} importantForAccessibility="no">
        {value ? 'Sí' : 'No'}
      </AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, paddingVertical: spacing.sm },
  texts: { flex: 1, gap: 2 },
});
