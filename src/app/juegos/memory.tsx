import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useEffect, useReducer, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { OptionSelector } from '@/components/OptionSelector';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { getWord, getWordsFor } from '@/content/catalog';
import {
  canFlip,
  columnsFor,
  createMemoryState,
  matchedPairs,
  MEMORY_LEVELS,
  memoryReducer,
  type MemoryLevel,
} from '@/games/memory/memoryLogic';
import { useCategoryParam } from '@/hooks/useCategoryParam';
import { useProgress } from '@/hooks/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, radius, spacing } from '@/theme';
import type { Difficulty } from '@/types/settings';
import { sample } from '@/utils/random';

/** Tiempo que permanecen visibles dos cartas distintas antes de ocultarse. */
const MISMATCH_DELAY_MS = 1200;

const DEFAULT_LEVEL: Record<Difficulty, MemoryLevel> = { facil: 4, media: 6, dificil: 8 };

export default function MemoryScreen() {
  const { categoria, category } = useCategoryParam();
  const run = useActivityRun();
  const { progress, recordMemory } = useProgress();
  const { speak } = useSpeech();
  const { width } = useWindowDimensions();
  const pool = getWordsFor(categoria);

  const available = MEMORY_LEVELS.filter((l) => l <= pool.length);
  const preferred = DEFAULT_LEVEL[run.difficulty];
  const [level, setLevel] = useState<MemoryLevel>(
    available.includes(preferred) ? preferred : (available[available.length - 1] ?? 4),
  );
  const [playing, setPlaying] = useState(false);
  /** Número de partida: hace única la clave de cada intento registrado. */
  const [gameNo, setGameNo] = useState(0);
  const [state, dispatch] = useReducer(memoryReducer, [], createMemoryState);

  // Oculta las dos cartas que no coinciden tras una pausa.
  useEffect(() => {
    if (!state.locked) return;
    const t = setTimeout(() => dispatch({ type: 'RESOLVE' }), MISMATCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.locked]);

  // Guarda el mejor resultado al terminar.
  useEffect(() => {
    if (playing && state.finished) {
      recordMemory(state.cards.length / 2, state.attempts);
      speak('¡Enhorabuena! Has encontrado todas las parejas.');
    }
  }, [playing, state.finished, state.attempts, state.cards.length, recordMemory, speak]);

  const start = () => {
    dispatch({ type: 'NEW_GAME', wordIds: sample(pool, level).map((w) => w.id) });
    setGameNo((n) => n + 1);
    setPlaying(true);
  };

  const title = category ? `Memory: ${category.nombre}` : 'Memory';

  if (available.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
      <SessionBar />
        <AppText>Se necesitan al menos 4 fotografías distintas para jugar.</AppText>
      </Screen>
    );
  }

  if (!playing) {
    const best = progress.memoryMejores[String(level)];
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
      <SessionBar />
        <AppText size="large">Da la vuelta a dos cartas. Si son iguales, ¡has encontrado una pareja!</AppText>
        <OptionSelector
          label="Número de parejas"
          value={level}
          onChange={setLevel}
          options={MEMORY_LEVELS.map((l) => ({ value: l, label: String(l), disabled: l > pool.length }))}
        />
        {best != null ? <AppText color={colors.textMuted}>Tu mejor resultado con {level} parejas: {best} intentos.</AppText> : null}
        <AppButton label="Empezar" icon="play" onPress={start} />
      </Screen>
    );
  }

  const cols = columnsFor(state.cards.length, width >= 700);
  const cardWidth = `${100 / cols - 2}%` as const;

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <SessionBar />
      <AppText color={colors.textMuted} accessibilityLiveRegion="polite">
        Parejas: {matchedPairs(state)} de {state.cards.length / 2} · Intentos: {state.attempts}
      </AppText>

      <View style={styles.grid}>
        {state.cards.map((card, i) => {
          const word = getWord(card.wordId);
          const visible = card.status !== 'hidden';
          const label = visible
            ? `${word?.palabra ?? ''}${card.status === 'matched' ? ', pareja encontrada' : ''}`
            : `Carta ${i + 1}, boca abajo`;
          return (
            <Pressable
              key={card.uid}
              onPress={() => {
                if (!canFlip(state, card.uid)) return;
                // Segunda carta del turno: se registra el intento de pareja (elemento = 1.ª carta, respuesta = 2.ª).
                const first = state.selected.length === 1 ? state.cards.find((c) => c.uid === state.selected[0]) : undefined;
                if (first) run.record(`${gameNo}:${state.attempts}`, first.wordId, card.wordId, first.wordId === card.wordId);
                dispatch({ type: 'FLIP', uid: card.uid });
                if (word) speak(word.palabra);
              }}
              disabled={!canFlip(state, card.uid)}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                styles.card,
                { width: cardWidth },
                card.status === 'matched' && styles.matched,
                pressed && styles.pressed,
                focused && card.status === 'hidden' && styles.focused,
              ]}
            >
              {visible && word ? (
                <Photo imageKey={word.imagen} label={null} aspectRatio={1} />
              ) : (
                <View style={styles.back}>
                  <Ionicons name="help" size={36} color={colors.onPrimary} importantForAccessibility="no" />
                </View>
              )}
              {card.status === 'matched' ? (
                <View style={styles.badge}>
                  <Ionicons name="checkmark" size={20} color={colors.onPrimary} importantForAccessibility="no" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {state.finished ? (
        <>
          <Feedback kind="success" message={`¡Enhorabuena! Todas las parejas en ${state.attempts} intentos.`} />
          <AppButton label="Jugar otra vez" icon="refresh" onPress={start} />
          <AppButton label="Cambiar número de parejas" variant="secondary" onPress={() => setPlaying(false)} />
        </>
      ) : (
        <AppButton label="Reiniciar" icon="refresh" variant="ghost" onPress={start} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  card: {
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: 3,
    maxWidth: 220,
  },
  matched: { borderColor: colors.success, backgroundColor: colors.successBg },
  pressed: { borderColor: colors.primary },
  focused: { borderColor: colors.focus },
  back: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.cardBack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
