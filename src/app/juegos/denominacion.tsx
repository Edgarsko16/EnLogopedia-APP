import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { Instruction } from '@/components/Instruction';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import type { ManualScore } from '@/sessions/types';
import { getWord, getWordsFor } from '@/content/catalog';
import {
  createNamingSession,
  currentWordId,
  isFinished,
  mark,
  next,
  retryPending,
  reveal,
  SESSION_LENGTH,
  summary,
  wordsForDifficulty,
  type NamingMark,
  type NamingSession,
} from '@/games/denominacion/denominacionLogic';
import { useCategoryParam } from '@/hooks/useCategoryParam';
import { useProgress } from '@/hooks/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, spacing } from '@/theme';
import { sample } from '@/utils/random';
import { capitalize, plural } from '@/utils/text';

/**
 * Denominación: se muestra la foto, la persona la nombra en voz alta y
 * después se descubre la palabra. Un adulto (o la propia persona) marca si
 * lo ha conseguido. No hay reconocimiento de voz.
 */
export default function NamingScreen() {
  const { categoria, category } = useCategoryParam();
  const run = useActivityRun();
  const { recordResult } = useProgress();
  const { speak, enabled } = useSpeech();

  const newSession = (): NamingSession => {
    const pool = wordsForDifficulty(getWordsFor(categoria), run.difficulty);
    return createNamingSession(sample(pool, SESSION_LENGTH));
  };
  const [session, setSession] = useState<NamingSession>(newSession);
  /** Id de la palabra para la que se ha pedido pista (se reinicia al cambiar de foto). */
  const [hintFor, setHintFor] = useState<string | null>(null);
  /** Pasada actual (sube al repasar o empezar otra ronda): hace única la clave de cada valoración. */
  const [pass, setPass] = useState(0);

  const title = category ? `Denominación: ${category.nombre}` : 'Denominación';

  if (session.order.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
      <SessionBar />
        <AppText>No hay fotografías disponibles para este ejercicio.</AppText>
      </Screen>
    );
  }

  if (isFinished(session)) {
    const s = summary(session);
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
      <SessionBar />
        <Feedback kind="success" message={`¡Ronda terminada! ${plural(s.conseguidas, 'palabra conseguida', 'palabras conseguidas')} de ${s.total}.`} />
        {s.pendientes > 0 ? (
          <AppButton
            label={`Repasar las ${s.pendientes} pendientes`}
            icon="refresh"
            onPress={() => {
              setPass((p) => p + 1);
              setSession((prev) => retryPending(prev));
            }}
          />
        ) : null}
        <AppButton
          label="Otra ronda"
          icon="shuffle"
          variant="secondary"
          onPress={() => {
            setPass((p) => p + 1);
            setSession(newSession());
          }}
        />
      </Screen>
    );
  }

  const word = getWord(currentWordId(session) ?? '');
  if (!word) return null;

  /**
   * Valoración del profesional. «Correcto» cuenta como conseguida; el resto
   * queda pendiente para el repaso. En sesión se guarda la valoración exacta.
   */
  const onScore = (score: ManualScore) => {
    const value: NamingMark = score === 'correcto' ? 'conseguida' : 'pendiente';
    run.recordManual(`${pass}-${session.index}`, word.id, score);
    if (score !== 'no-realizado') recordResult('denominacion', word.id, score === 'correcto');
    setSession((prev) => next(mark(prev, value)));
  };
  const label = word.articulo ? `${word.articulo} ${word.palabra}` : word.palabra;

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <SessionBar />
      <AppText color={colors.textMuted} accessibilityLiveRegion="polite">
        Foto {session.index + 1} de {session.order.length}
      </AppText>
      <Instruction text="¿Qué es? Dilo en voz alta." spokenText="¿Qué es? Dilo en voz alta." />

      <Photo
        key={word.id}
        imageKey={word.imagen}
        label={session.revealed ? word.palabra : null}
        hiddenLabel="Fotografía para nombrar"
        fit="contain"
      />

      {session.revealed ? (
        <View style={styles.answer}>
          <AppText size="word" weight="800" align="center" accessibilityLiveRegion="polite">
            {capitalize(word.palabra)}
          </AppText>
          {enabled ? (
            <AppButton label="Escuchar" icon="volume-high" variant="secondary" onPress={() => speak(label)} />
          ) : null}
          <AppText weight="600" align="center">
            Valoración del profesional
          </AppText>
          <View style={styles.row}>
            <AppButton label="Correcto" icon="checkmark" variant="success" onPress={() => onScore('correcto')} style={styles.flex} />
            <AppButton label="Con ayuda" icon="hand-left" variant="secondary" onPress={() => onScore('con-ayuda')} style={styles.flex} />
          </View>
          <View style={styles.row}>
            <AppButton label="Incorrecto" icon="close" variant="danger" onPress={() => onScore('incorrecto')} style={styles.flex} />
            <AppButton label="No realizado" icon="remove" variant="ghost" onPress={() => onScore('no-realizado')} style={styles.flex} />
          </View>
        </View>
      ) : (
        <View style={styles.answer}>
          {hintFor === word.id ? (
            <Feedback kind="info" message={`Pista: empieza por «${word.palabra.charAt(0).toLocaleUpperCase('es-ES')}».`} />
          ) : null}
          <View style={styles.row}>
            <AppButton
              label="Pista"
              icon="bulb"
              variant="ghost"
              onPress={() => setHintFor(word.id)}
              disabled={hintFor === word.id}
              style={styles.flex}
            />
            <AppButton
              label="Descubrir"
              icon="eye"
              onPress={() => {
                setSession(reveal);
                speak(label);
              }}
              style={styles.flex}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  answer: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 140 },
});
