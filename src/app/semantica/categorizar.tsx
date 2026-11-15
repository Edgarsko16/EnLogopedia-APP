import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { IconName } from '@/components/AppButton';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { Instruction } from '@/components/Instruction';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { getAllWords, getCategory, getWord } from '@/content/catalog';
import { buildCategorizeSession, pickCategories } from '@/games/semantica/semanticaLogic';
import { useProgress } from '@/hooks/ProgressContext';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import type { CategoryId, Word } from '@/types/content';
import { capitalize, withArticle } from '@/utils/text';

interface Session {
  categories: CategoryId[];
  items: Word[];
}

function newSession(numCategories: number): Session {
  const words = getAllWords();
  const perCategory = numCategories === 2 ? 4 : 3;
  const categories = pickCategories(words, numCategories, perCategory, Math.random);
  return { categories, items: buildCategorizeSession(words, categories, perCategory, getWord) };
}

/**
 * Categorizar: aparece una foto y se elige su grupo entre 2 o 3 categorías.
 * Se excluyen fotos ambiguas (p. ej. "dormir" muestra un gato: no sale si
 * también está en juego la categoría Animales).
 */
export default function CategorizeScreen() {
  const { settings } = useSettings();
  const { recordResult } = useProgress();
  const { speak, speakFeedback } = useSpeech();
  const run = useActivityRun();
  const numCategories = run.difficulty === 'facil' ? 2 : 3;
  const [session, setSession] = useState<Session>(() => newSession(numCategories));
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<CategoryId[]>([]);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  /** Pasada (sube al reiniciar): clave única para registrar respuestas. */
  const [pass, setPass] = useState(0);

  const restart = () => {
    setPass((p) => p + 1);
    setSession(newSession(numCategories));
    setIndex(0);
    setWrong([]);
    setSolved(false);
    setScore(0);
  };

  if (session.items.length === 0) {
    return (
      <Screen>
      <SessionBar />
        <AppText>No hay suficientes fotografías para este ejercicio.</AppText>
      </Screen>
    );
  }

  if (index >= session.items.length) {
    return (
      <Screen>
      <SessionBar />
        <Feedback kind="success" message={`¡Terminado! ${score} de ${session.items.length} a la primera.`} />
        <AppButton label="Jugar otra vez" icon="refresh" onPress={restart} />
      </Screen>
    );
  }

  const word = session.items[index];
  const choose = (c: CategoryId) => {
    if (solved || wrong.includes(c)) return;
    run.record(`${pass}-${index}`, word.id, c, c === word.categoria);
    if (c === word.categoria) {
      const firstTry = wrong.length === 0;
      setSolved(true);
      if (firstTry) setScore((s) => s + 1);
      recordResult('semantica', word.id, firstTry);
      speak(`¡Bien! ${capitalize(withArticle(word))} va en ${getCategory(c)?.nombre ?? ''}.`);
    } else {
      setWrong((w) => [...w, c]);
      speakFeedback('Prueba otra vez');
    }
  };
  const next = () => {
    setIndex((i) => i + 1);
    setWrong([]);
    setSolved(false);
  };
  const category = getCategory(word.categoria);

  return (
    <Screen>
      <SessionBar />
      <AppText color={colors.textMuted} accessibilityLiveRegion="polite">
        Foto {index + 1} de {session.items.length}
      </AppText>
      <Instruction text="¿En qué grupo va esta foto?" />
      <Photo key={word.id} imageKey={word.imagen} label={word.palabra} fit="contain" aspectRatio={16 / 10} />
      {settings.showWords ? (
        <AppText size="title" weight="800" align="center">
          {capitalize(word.palabra)}
        </AppText>
      ) : null}

      <View style={styles.bins} accessibilityRole="radiogroup" accessibilityLabel="Grupos">
        {session.categories.map((id) => {
          const c = getCategory(id)!;
          const isWrong = wrong.includes(id);
          const isRight = solved && id === word.categoria;
          const disabled = solved || isWrong;
          return (
            <Pressable
              key={id}
              onPress={() => choose(id)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`${c.nombre}${isWrong ? ', incorrecto' : ''}${isRight ? ', correcto' : ''}`}
              accessibilityState={{ disabled }}
              style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                styles.bin,
                { backgroundColor: c.color },
                pressed && styles.pressed,
                focused && !disabled && styles.focused,
                isWrong && styles.binWrong,
                isRight && styles.binRight,
              ]}
            >
              <Ionicons name={(isWrong ? 'close-circle' : isRight ? 'checkmark-circle' : c.icono) as IconName} size={28} color={colors.onPrimary} importantForAccessibility="no" />
              <AppText size="large" weight="700" color={colors.onPrimary}>
                {c.nombre}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {solved ? (
        <>
          <Feedback kind="success" message={`¡Correcto! ${capitalize(withArticle(word))} es de ${category?.nombre.toLowerCase()}.`} />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={next} />
        </>
      ) : wrong.length > 0 ? (
        <Feedback kind="retry" message="Ese no es su grupo. ¡Prueba otra vez!" />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bins: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bin: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: MIN_TOUCH + 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  pressed: { opacity: 0.85 },
  focused: { borderColor: colors.focus },
  binWrong: { opacity: 0.5 },
  binRight: { borderColor: colors.success },
});
