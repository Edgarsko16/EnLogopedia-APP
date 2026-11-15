import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { Instruction } from '@/components/Instruction';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { getWordsFor } from '@/content/catalog';
import {
  buildRound,
  initialGridSize,
  instructionFor,
  isCorrectChoice,
  nextGridSize,
  type BuscaRound,
  type GridSize,
} from '@/games/busca/buscaLogic';
import { useCategoryParam } from '@/hooks/useCategoryParam';
import { useProgress } from '@/hooks/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, radius, spacing } from '@/theme';
import type { Word } from '@/types/content';
import { sample } from '@/utils/random';

function makeRound(pool: Word[], size: number, previousId?: string): BuscaRound | null {
  const candidates = pool.length > 1 ? pool.filter((w) => w.id !== previousId) : pool;
  const target = sample(candidates, 1)[0];
  return target ? buildRound(target, pool, size) : null;
}

export default function FindImageScreen() {
  const { categoria, category } = useCategoryParam();
  const run = useActivityRun();
  const { recordResult } = useProgress();
  const { speak, speakFeedback } = useSpeech();
  const { width } = useWindowDimensions();
  const pool = getWordsFor(categoria);

  const [gridSize, setGridSize] = useState<GridSize>(() => initialGridSize(run.difficulty));
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ aciertos: 0, rondas: 0 });
  const [round, setRound] = useState<BuscaRound | null>(() => makeRound(pool, gridSize));
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const instruction = round ? instructionFor(round.target) : '';

  // Locuta la instrucción al empezar cada ronda.
  useEffect(() => {
    if (instruction) speak(instruction);
  }, [instruction, speak]);

  const newRound = useCallback(
    (size: GridSize) => {
      setRound((prev) => makeRound(pool, size, prev?.target.id));
      setWrong([]);
      setSolved(false);
    },
    [pool],
  );

  const title = category ? `Busca: ${category.nombre}` : 'Busca la imagen';

  if (!round) {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
      <SessionBar />
        <AppText>No hay suficientes fotografías distintas para este juego.</AppText>
      </Screen>
    );
  }

  const choose = (word: Word) => {
    if (solved || wrong.includes(word.id)) return;
    const firstTry = wrong.length === 0;
    // Ronda = nº de rondas resueltas antes de esta (único dentro de la actividad).
    run.record(String(score.rondas), round.target.id, word.id, isCorrectChoice(round, word.id));
    if (isCorrectChoice(round, word.id)) {
      setSolved(true);
      setScore((s) => ({ aciertos: s.aciertos + (firstTry ? 1 : 0), rondas: s.rondas + 1 }));
      setStreak((s) => (firstTry ? s + 1 : 0));
      recordResult('busca', round.target.id, firstTry);
      speak(`¡Muy bien! ${word.articulo ? `${word.articulo} ` : ''}${word.palabra}`);
    } else {
      setWrong((w) => [...w, word.id]);
      setStreak(0);
      speakFeedback('Prueba otra vez');
    }
  };

  const goNext = () => {
    const size = nextGridSize(gridSize, streak);
    if (size !== gridSize) setStreak(0);
    setGridSize(size);
    newRound(size);
  };

  const columns = round.options.length <= 2 ? 2 : round.options.length <= 4 ? 2 : width >= 700 ? 3 : 2;
  const itemWidth = `${100 / columns - 2}%` as const;

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <SessionBar />
      <AppText color={colors.textMuted}>
        Aciertos a la primera: {score.aciertos} de {score.rondas} · {round.options.length} imágenes
      </AppText>
      <Instruction text={instruction} />

      <View style={styles.grid}>
        {round.options.map((w) => {
          const isWrong = wrong.includes(w.id);
          const isRight = solved && w.id === round.target.id;
          return (
            <Pressable
              key={w.id}
              onPress={() => choose(w)}
              disabled={solved || isWrong}
              accessibilityRole="button"
              accessibilityLabel={w.palabra}
              accessibilityState={{ disabled: solved || isWrong, selected: isRight }}
              style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                styles.option,
                { width: itemWidth },
                pressed && styles.pressed,
                focused && !solved && !isWrong && styles.focused,
                isRight && styles.right,
                isWrong && styles.wrong,
              ]}
            >
              <Photo imageKey={w.imagen} label={null} aspectRatio={1} style={isWrong ? styles.dim : undefined} />
              {isRight || isWrong ? (
                <View style={[styles.badge, { backgroundColor: isRight ? colors.success : colors.error }]}>
                  <Ionicons name={isRight ? 'checkmark' : 'close'} size={28} color={colors.onPrimary} importantForAccessibility="no" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {solved ? (
        <>
          <Feedback kind="success" message={`¡Muy bien! Era ${round.target.articulo ? `${round.target.articulo} ` : ''}${round.target.palabra}.`} />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={goNext} />
        </>
      ) : wrong.length > 0 ? (
        <Feedback kind="retry" message="Esa no es. ¡Prueba otra vez!" />
      ) : null}
    </Screen>
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
  },
  pressed: { borderColor: colors.primary },
  focused: { borderColor: colors.focus },
  right: { borderColor: colors.success, backgroundColor: colors.successBg },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorBg },
  dim: { opacity: 0.45 },
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
