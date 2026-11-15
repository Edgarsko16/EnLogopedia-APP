import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { getCategory, getWordsByCategory, isCategoryId } from '@/content/catalog';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, radius, spacing } from '@/theme';
import { capitalize } from '@/utils/text';

/** Visor de vocabulario: una foto grande, la palabra, su audio y frases modelo. */
export default function VocabularyScreen() {
  const { categoria } = useLocalSearchParams<{ categoria: string }>();
  const { settings } = useSettings();
  const { speak, enabled } = useSpeech();
  const [index, setIndex] = useState(0);
  const [showWord, setShowWord] = useState(settings.showWords);

  useEffect(() => setShowWord(settings.showWords), [settings.showWords]);

  if (!isCategoryId(categoria)) {
    return (
      <Screen>
        <AppText>No se ha encontrado esta categoría.</AppText>
      </Screen>
    );
  }
  const category = getCategory(categoria)!;
  const words = getWordsByCategory(categoria);
  const word = words[index];

  if (!word) {
    return (
      <Screen>
        <AppText>Esta categoría aún no tiene palabras con fotografía verificada.</AppText>
      </Screen>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + words.length) % words.length);
  const label = word.articulo ? `${word.articulo} ${word.palabra}` : word.palabra;

  return (
    <Screen>
      <Stack.Screen options={{ title: category.nombre }} />
      <SessionBar />
      <AppText color={colors.textMuted} accessibilityLiveRegion="polite">
        Palabra {index + 1} de {words.length}
      </AppText>

      <Photo key={word.id} imageKey={word.imagen} label={word.palabra} fit="contain" aspectRatio={4 / 3} transition={150} />

      <View style={styles.wordBox}>
        {showWord ? (
          <AppText size="word" weight="800" align="center" accessibilityRole="header">
            {capitalize(word.palabra)}
          </AppText>
        ) : (
          <AppText size="large" color={colors.textMuted} align="center">
            Palabra oculta: ¿sabes cómo se llama?
          </AppText>
        )}
        {showWord ? (
          <AppText color={colors.textMuted} align="center">
            {word.descripcion}
          </AppText>
        ) : null}
      </View>

      <View style={styles.row}>
        {enabled ? (
          <AppButton
            label="Escuchar"
            icon="volume-high"
            onPress={() => speak(label)}
            accessibilityLabel={`Escuchar la palabra ${showWord ? word.palabra : ''}`.trim()}
            style={styles.flex}
          />
        ) : null}
        <AppButton
          label={showWord ? 'Ocultar palabra' : 'Mostrar palabra'}
          icon={showWord ? 'eye-off' : 'eye'}
          variant="secondary"
          selected={showWord}
          onPress={() => setShowWord((s) => !s)}
          style={styles.flex}
        />
      </View>

      {showWord && word.frases.length > 0 ? (
        <View style={styles.sentences}>
          <AppText weight="700">Frases para practicar</AppText>
          {word.frases.map((f) => (
            <View key={f} style={styles.sentenceRow}>
              <AppText style={styles.flex}>{f}</AppText>
              {enabled ? (
                <AppButton label="Oír" icon="volume-medium" variant="ghost" compact onPress={() => speak(f)} accessibilityLabel={`Escuchar: ${f}`} />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.row}>
        <AppButton label="Anterior" icon="arrow-back" variant="ghost" onPress={() => go(-1)} style={styles.flex} />
        <AppButton label="Siguiente" icon="arrow-forward" onPress={() => go(1)} style={styles.flex} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wordBox: { gap: spacing.xs, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 140 },
  sentences: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sentenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
