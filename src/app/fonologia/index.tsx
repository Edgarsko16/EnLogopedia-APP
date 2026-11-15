import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { Screen } from '@/components/Screen';
import { getAllWords, getPhonologyOptions } from '@/content/catalog';
import { availablePhonemes, phonemeLabel, type PhonemeAvailability } from '@/games/fonologia/fonologiaLogic';
import { useSettings } from '@/hooks/SettingsContext';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import { plural } from '@/utils/text';

/** Selección de fonema: solo se ofrecen los que aparecen en el banco actual. */
export default function PhonologyScreen() {
  const { settings } = useSettings();
  const list = availablePhonemes(getAllWords(), getPhonologyOptions(settings.seseo));
  const vowels = list.filter((a) => a.phoneme.tipo === 'vocal');
  const consonants = list.filter((a) => a.phoneme.tipo === 'consonante');

  return (
    <Screen>
      <AppText size="large" color={colors.textMuted}>
        Elige un sonido para trabajar las palabras que empiezan por él: escucharlas, identificarlas y clasificarlas.
      </AppText>
      <Feedback
        kind="info"
        message={
          settings.seseo
            ? 'Pronunciación con seseo activada: z, ce y ci se cuentan como /s/. Puedes cambiarlo en Ajustes.'
            : 'Pronunciación sin seseo: z, ce y ci son /θ/. Si en tu zona se sesea (Canarias, Andalucía…), actívalo en Ajustes.'
        }
      />
      <Section title="Consonantes" items={consonants} />
      <Section title="Vocales" items={vowels} />
      <AppText size="small" color={colors.textMuted}>
        Por ahora se trabaja el sonido inicial. El número indica cuántas palabras con foto empiezan por ese sonido.
      </AppText>
    </Screen>
  );
}

function Section({ title, items }: { title: string; items: PhonemeAvailability[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <AppText size="large" weight="700" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.grid}>
        {items.map(({ phoneme, total }) => (
          <Pressable
            key={phoneme.id}
            onPress={() => router.push({ pathname: '/fonologia/[fonema]', params: { fonema: phoneme.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Sonido ${phoneme.grafias}, ${plural(total, 'palabra')}`}
            style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
              styles.tile,
              pressed && styles.pressed,
              focused && styles.focused,
            ]}
          >
            <AppText size="title" weight="800" color={colors.primary}>
              {phonemeLabel(phoneme)}
            </AppText>
            <AppText size="small" color={colors.text} align="center">
              {phoneme.grafias}
            </AppText>
            <AppText size="small" color={colors.textMuted}>
              {plural(total, 'palabra')}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    minWidth: 104,
    minHeight: MIN_TOUCH + 40,
    flexGrow: 1,
    flexBasis: 104,
    maxWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  focused: { borderColor: colors.focus, borderWidth: 3 },
});
