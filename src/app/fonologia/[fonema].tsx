import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { ImageChoiceGrid } from '@/components/ImageChoiceGrid';
import { Instruction } from '@/components/Instruction';
import { OptionSelector } from '@/components/OptionSelector';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { WORD_PHONOLOGY, type Phoneme } from '@/content/phonology';
import { getAllWords, getPhoneme, getPhonologyOptions } from '@/content/catalog';
import {
  buildClassifySession,
  buildIdentifyRound,
  isUsableForDiscrimination,
  phonemeAt,
  phonemeLabel,
  wordsWithPhoneme,
  type IdentifyRound,
  type PhonologyOptions,
} from '@/games/fonologia/fonologiaLogic';
import { useProgress } from '@/hooks/ProgressContext';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import type { Word } from '@/types/content';
import { capitalize } from '@/utils/text';

type Mode = 'escuchar' | 'identificar' | 'clasificar';
const MODES: Mode[] = ['escuchar', 'identificar', 'clasificar'];

export default function PhonemeScreen() {
  const { fonema } = useLocalSearchParams<{ fonema: string }>();
  const { settings } = useSettings();
  const run = useActivityRun();
  const [mode, setMode] = useState<Mode>(MODES.includes(run.modalidad as Mode) ? (run.modalidad as Mode) : 'escuchar');
  const phoneme = getPhoneme(String(fonema));
  const opts = getPhonologyOptions(settings.seseo);

  if (!phoneme) {
    return (
      <Screen>
        <AppText>No se ha encontrado este sonido.</AppText>
      </Screen>
    );
  }

  const words = getAllWords();
  const usable = wordsWithPhoneme(words, phoneme.id, opts).filter((w) => isUsableForDiscrimination(w, opts));

  return (
    <Screen>
      <Stack.Screen options={{ title: `Sonido ${phonemeLabel(phoneme)}` }} />
      <SessionBar />
      <View style={styles.header}>
        <AppText size="display" weight="800" color={colors.primary} accessibilityRole="header">
          {phonemeLabel(phoneme)}
        </AppText>
        <AppText color={colors.textMuted} style={styles.flex}>
          Se escribe: {phoneme.grafias}. Ejemplo: «{phoneme.ejemplo}».
        </AppText>
      </View>
      <OptionSelector<Mode>
        label="Modalidad"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'escuchar', label: 'Escuchar y ver' },
          { value: 'identificar', label: 'Identificar', disabled: usable.length === 0 },
          { value: 'clasificar', label: 'Clasificar', disabled: usable.length === 0 },
        ]}
      />
      {usable.length === 0 ? (
        <AppText size="small" color={colors.textMuted}>
          Las palabras de este sonido son dudosas o son acciones, así que solo se ofrece el repaso.
        </AppText>
      ) : null}
      {mode === 'escuchar' ? (
        <Review phoneme={phoneme} opts={opts} />
      ) : mode === 'identificar' ? (
        <Identify phoneme={phoneme} opts={opts} />
      ) : (
        <Classify phoneme={phoneme} opts={opts} />
      )}
    </Screen>
  );
}

/** Número de letras iniciales que representan el fonema, para resaltarlas. */
function initialGraphemeLength(word: string): number {
  const w = word.toLocaleLowerCase('es-ES');
  if (/^(ch|ll|qu|rr)/.test(w)) return 2;
  if (/^h[aeiouáéíóú]/.test(w)) return 2;
  return 1;
}

// ─── Escuchar y ver ─────────────────────────────────────────────────────────

function Review({ phoneme, opts }: { phoneme: Phoneme; opts: PhonologyOptions }) {
  const { speak, enabled } = useSpeech();
  const list = wordsWithPhoneme(getAllWords(), phoneme.id, opts);
  return (
    <>
      <Instruction text={`Palabras que empiezan por ${phonemeLabel(phoneme)}. Toca una foto para oírla.`} />
      <View style={styles.reviewGrid}>
        {list.map((w) => {
          const n = initialGraphemeLength(w.palabra);
          const info = WORD_PHONOLOGY[w.id];
          return (
            <Pressable
              key={w.id}
              onPress={() => speak(w.palabra)}
              disabled={!enabled}
              accessibilityRole="button"
              accessibilityLabel={`${w.palabra}${info?.nota ? `. ${info.nota}` : ''}`}
              style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                styles.card,
                pressed && styles.pressed,
                focused && styles.focused,
              ]}
            >
              <Photo imageKey={w.imagen} label={null} aspectRatio={4 / 3} />
              <AppText size="large" align="center">
                <AppText size="large" weight="800" color={colors.accent}>
                  {capitalize(w.palabra.slice(0, n))}
                </AppText>
                {w.palabra.slice(n)}
              </AppText>
              {info?.nota ? (
                <AppText size="small" color={colors.textMuted} align="center">
                  {info.duda ? '⚠ ' : ''}
                  {info.nota}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

// ─── Identificar ────────────────────────────────────────────────────────────

function Identify({ phoneme, opts }: { phoneme: Phoneme; opts: PhonologyOptions }) {
  const { recordResult } = useProgress();
  const { speak } = useSpeech();
  const run = useActivityRun();
  const count = run.difficulty === 'facil' ? 2 : run.difficulty === 'media' ? 3 : 4;
  const make = () => buildIdentifyRound(getAllWords(), phoneme.id, count, opts);
  const [round, setRound] = useState<IdentifyRound | null>(make);
  const [roundNo, setRoundNo] = useState(1);
  const [result, setResult] = useState<'none' | 'wrong' | 'solved'>('none');
  if (!round) return <AppText>No hay suficientes palabras para este ejercicio.</AppText>;

  const answer = round.options.find((w) => w.id === round.answerId)!;
  const prompt = `¿Cuál empieza por ${phonemeLabel(phoneme)}, como «${phoneme.ejemplo}»?`;
  return (
    <>
      <Instruction text={prompt} spokenText={`¿Qué foto empieza igual que ${phoneme.ejemplo}?`} />
      <ImageChoiceGrid
        key={roundNo}
        options={round.options}
        answerId={round.answerId}
        speakOnPress={false}
        onSolved={(firstTry) => {
          setResult('solved');
          run.record(String(roundNo), answer.id, answer.id, true);
          recordResult('fonologia', answer.id, firstTry);
          speak(`¡Sí! ${answer.palabra}, como ${phoneme.ejemplo}.`);
        }}
        onWrong={(w) => {
          setResult('wrong');
          run.record(String(roundNo), answer.id, w.id, false);
          speak(w.palabra);
        }}
      />
      {result === 'solved' ? (
        <>
          <Feedback kind="success" message={`¡Muy bien! «${capitalize(answer.palabra)}» empieza por ${phonemeLabel(phoneme)}.`} />
          <AppButton
            label="Siguiente"
            icon="arrow-forward"
            onPress={() => {
              setRound(make());
              setRoundNo((n) => n + 1);
              setResult('none');
            }}
          />
        </>
      ) : result === 'wrong' ? (
        <Feedback kind="retry" message="Esa empieza por otro sonido. Dila en voz alta y prueba otra vez." />
      ) : null}
    </>
  );
}

// ─── Clasificar ─────────────────────────────────────────────────────────────

function Classify({ phoneme, opts }: { phoneme: Phoneme; opts: PhonologyOptions }) {
  const { recordResult } = useProgress();
  const { speak, enabled } = useSpeech();
  const run = useActivityRun();
  /** Pasada (sube al volver a jugar): clave única para registrar respuestas. */
  const [pass, setPass] = useState(0);
  const make = () => buildClassifySession(getAllWords(), phoneme.id, 8, opts);
  const [items, setItems] = useState<Word[]>(make);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<boolean | null>(null);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  const label = phonemeLabel(phoneme);

  if (index >= items.length) {
    return (
      <>
        <Feedback kind="success" message={`¡Terminado! ${score} de ${items.length} a la primera.`} />
        <AppButton
          label="Jugar otra vez"
          icon="refresh"
          onPress={() => {
            setPass((p) => p + 1);
            setItems(make());
            setIndex(0);
            setScore(0);
            setWrong(null);
            setSolved(false);
          }}
        />
      </>
    );
  }

  const word = items[index];
  const starts = phonemeAt(word, 'inicial', opts) === phoneme.id;
  const choose = (answer: boolean) => {
    if (solved || wrong === answer) return;
    run.record(`${pass}-${index}`, word.id, answer ? 'si' : 'no', answer === starts);
    if (answer === starts) {
      setSolved(true);
      if (wrong === null) setScore((s) => s + 1);
      recordResult('fonologia', word.id, wrong === null);
      speak(word.palabra);
    } else {
      setWrong(answer);
    }
  };

  return (
    <>
      <AppText color={colors.textMuted} accessibilityLiveRegion="polite">
        Foto {index + 1} de {items.length}
      </AppText>
      <Instruction text={`Di el nombre de la foto. ¿Empieza por ${label}?`} spokenText={`Di el nombre de la foto. ¿Empieza igual que ${phoneme.ejemplo}?`} />
      <Photo key={word.id} imageKey={word.imagen} label={solved ? word.palabra : null} hiddenLabel="Foto para clasificar" fit="contain" aspectRatio={16 / 10} />
      {enabled ? (
        <AppButton label="Escuchar el nombre" icon="volume-high" variant="secondary" onPress={() => speak(word.palabra)} />
      ) : null}
      <View style={styles.row}>
        <ClassifyButton label={`Sí, empieza por ${label}`} onPress={() => choose(true)} state={solved && starts ? 'right' : wrong === true ? 'wrong' : 'idle'} disabled={solved || wrong === true} />
        <ClassifyButton label={`No empieza por ${label}`} onPress={() => choose(false)} state={solved && !starts ? 'right' : wrong === false ? 'wrong' : 'idle'} disabled={solved || wrong === false} />
      </View>
      {solved ? (
        <>
          <Feedback
            kind="success"
            message={`¡Correcto! «${capitalize(word.palabra)}» ${starts ? 'sí' : 'no'} empieza por ${label}.`}
          />
          <AppButton
            label="Siguiente"
            icon="arrow-forward"
            onPress={() => {
              setIndex((i) => i + 1);
              setWrong(null);
              setSolved(false);
            }}
          />
        </>
      ) : wrong !== null ? (
        <Feedback kind="retry" message="Dila despacio, fíjate en el primer sonido y prueba otra vez." />
      ) : null}
    </>
  );
}

function ClassifyButton({ label, onPress, state, disabled }: { label: string; onPress: () => void; state: 'idle' | 'right' | 'wrong'; disabled: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}${state === 'wrong' ? ', incorrecto' : state === 'right' ? ', correcto' : ''}`}
      accessibilityState={{ disabled }}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.classify,
        pressed && styles.pressed,
        focused && !disabled && styles.focused,
        state === 'right' && styles.right,
        state === 'wrong' && styles.wrong,
      ]}
    >
      <AppText size="large" weight="700" align="center" color={state === 'wrong' ? colors.error : state === 'right' ? colors.success : colors.primary}>
        {state === 'wrong' ? '✗ ' : state === 'right' ? '✓ ' : ''}
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 160 },
  reviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    flexBasis: 160,
    flexGrow: 1,
    maxWidth: 260,
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  classify: {
    flex: 1,
    minWidth: 150,
    minHeight: MIN_TOUCH + 16,
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  right: { borderColor: colors.success, backgroundColor: colors.successBg },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorBg },
});
