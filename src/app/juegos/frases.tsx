import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { Instruction } from '@/components/Instruction';
import { OptionSelector } from '@/components/OptionSelector';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { TextChoiceList } from '@/components/TextChoiceList';
import { getSentences, getWord } from '@/content/catalog';
import {
  buildChoiceRound,
  correctPrefixLength,
  isCorrectOrder,
  buildChips,
  buildGapRound,
  sentencesForDifficulty,
  type GapRound,
  type ChoiceRound,
  type WordChip,
} from '@/games/frases/frasesLogic';
import { useProgress } from '@/hooks/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';
import type { Sentence } from '@/types/content';
import { shuffle } from '@/utils/random';

type Mode = 'elegir' | 'completar' | 'construir';
const MODES: Mode[] = ['elegir', 'completar', 'construir'];

/** Registra una respuesta de la ronda actual (elemento = frase, respuesta = lo elegido). */
type Rec = (elemento: string, respuesta: string, correcta: boolean) => void;

/**
 * Frases y acciones, tres modalidades sobre las mismas frases ligadas a fotos:
 *  - ¿Qué frase es?: elegir la frase que describe la foto.
 *  - Completa la frase: elegir la palabra que falta.
 *  - Construye la frase: ordenar las palabras (en difícil, con una ficha de más).
 * La dificultad (de la sesión o de Ajustes) limita el nivel de las frases.
 */
export default function SentencesScreen() {
  const run = useActivityRun();
  const all = useMemo(() => getSentences(), []);
  const poolFor = (m: Mode) =>
    sentencesForDifficulty(m === 'completar' ? all.filter((x) => x.hueco) : all, run.difficulty);
  const initialMode: Mode = MODES.includes(run.modalidad as Mode) ? (run.modalidad as Mode) : 'elegir';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [order, setOrder] = useState<Sentence[]>(() => shuffle(poolFor(initialMode)));
  const [index, setIndex] = useState(0);
  /** Contador de rondas (siempre crece): clave única para registrar respuestas. */
  const [turn, setTurn] = useState(0);

  if (all.length < 2 || order.length === 0) {
    return (
      <Screen>
        <AppText>Todavía no hay suficientes frases con fotografía verificada.</AppText>
      </Screen>
    );
  }

  const sentence = order[index % order.length];
  const record: Rec = (elemento, respuesta, correcta) => run.record(`${mode}-${turn}`, elemento, respuesta, correcta);
  const goNext = () => {
    setTurn((t) => t + 1);
    if (index + 1 >= order.length) {
      setOrder(shuffle(poolFor(mode)));
      setIndex(0);
    } else setIndex(index + 1);
  };
  const changeMode = (m: Mode) => {
    setTurn((t) => t + 1);
    setMode(m);
    setOrder(shuffle(poolFor(m)));
    setIndex(0);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Frases y acciones' }} />
      <SessionBar />
      <OptionSelector<Mode>
        label="Modalidad"
        value={mode}
        onChange={changeMode}
        options={[
          { value: 'elegir', label: '¿Qué frase es?' },
          { value: 'completar', label: 'Completa la frase' },
          { value: 'construir', label: 'Construye la frase' },
        ]}
      />
      <AppText color={colors.textMuted}>
        Frase {(index % order.length) + 1} de {order.length}
      </AppText>
      {mode === 'elegir' ? (
        <ChooseSentence key={`e-${sentence.id}-${index}`} sentence={sentence} pool={all} onNext={goNext} record={record} />
      ) : mode === 'completar' ? (
        <CompleteSentence key={`c-${sentence.id}-${index}`} sentence={sentence} onNext={goNext} record={record} difficulty={run.difficulty} />
      ) : (
        <OrderSentence
          key={`o-${sentence.id}-${index}`}
          sentence={sentence}
          withExtra={run.difficulty === 'dificil'}
          onNext={goNext}
          record={record}
        />
      )}
    </Screen>
  );
}

// ─── Modalidad 2: completar la frase ────────────────────────────────────────

function CompleteSentence({
  sentence,
  onNext,
  record,
  difficulty,
}: {
  sentence: Sentence;
  onNext: () => void;
  record: Rec;
  difficulty: 'facil' | 'media' | 'dificil';
}) {
  const { recordResult } = useProgress();
  const { speak } = useSpeech();
  const [round] = useState<GapRound | null>(() => buildGapRound(sentence, difficulty === 'facil' ? 2 : 3));
  const [result, setResult] = useState<'none' | 'wrong' | 'solved'>('none');
  const word = getWord(sentence.palabraId);
  if (!word || !round) return null;

  const blank = result === 'solved' ? round.answer : '____';
  const display = [...round.before, blank, ...round.after].join(' ') + '.';
  return (
    <>
      <Instruction text="Mira la foto. ¿Qué palabra falta?" />
      <Photo imageKey={word.imagen} label={null} hiddenLabel="Fotografía de la frase" fit="contain" aspectRatio={16 / 10} />
      <View style={styles.gapBox} accessible accessibilityLabel={`Frase: ${[...round.before, 'hueco', ...round.after].join(' ')}`}>
        <AppText size="title" weight="700" align="center">
          {display}
        </AppText>
      </View>
      <TextChoiceList
        options={round.options.map((o) => ({ id: o, text: o }))}
        answerId={round.answer}
        listenButtons={false}
        onSolved={(firstTry) => {
          setResult('solved');
          record(sentence.id, round.answer, true);
          recordResult('frases', word.id, firstTry);
          speak(sentence.texto);
        }}
        onWrong={(o) => {
          setResult('wrong');
          record(sentence.id, o.text, false);
        }}
      />
      {result === 'solved' ? (
        <>
          <Feedback kind="success" message={`¡Muy bien! «${sentence.texto}»`} />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={onNext} />
        </>
      ) : result === 'wrong' ? (
        <Feedback kind="retry" message="Esa palabra no describe la foto. ¡Prueba otra vez!" />
      ) : null}
    </>
  );
}

// ─── Modalidad 1: elegir la frase que describe la foto ──────────────────────

function ChooseSentence({ sentence, pool, onNext, record }: { sentence: Sentence; pool: Sentence[]; onNext: () => void; record: Rec }) {
  const { recordResult } = useProgress();
  const { speak, enabled } = useSpeech();
  const [round] = useState<ChoiceRound>(() => buildChoiceRound(sentence, pool, 3));
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const word = getWord(sentence.palabraId);
  if (!word) return null;

  const choose = (s: Sentence) => {
    if (solved || wrong.includes(s.id)) return;
    record(sentence.id, s.id, s.id === sentence.id);
    if (s.id === sentence.id) {
      setSolved(true);
      recordResult('frases', word.id, wrong.length === 0);
      speak(s.texto);
    } else {
      setWrong((w) => [...w, s.id]);
    }
  };

  return (
    <>
      <Instruction text="Mira la foto. ¿Qué frase la describe?" />
      <Photo imageKey={word.imagen} label={null} hiddenLabel="Fotografía de una acción" fit="contain" />
      <View style={styles.options}>
        {round.options.map((s) => {
          const isWrong = wrong.includes(s.id);
          const isRight = solved && s.id === sentence.id;
          return (
            <View key={s.id} style={styles.optionRow}>
              <Pressable
                onPress={() => choose(s)}
                disabled={solved || isWrong}
                accessibilityRole="button"
                accessibilityLabel={`${s.texto}${isWrong ? ', incorrecta' : ''}${isRight ? ', correcta' : ''}`}
                accessibilityState={{ disabled: solved || isWrong, selected: isRight }}
                style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                  styles.sentenceOption,
                  pressed && styles.pressed,
                  focused && !solved && !isWrong && styles.focused,
                  isRight && styles.right,
                  isWrong && styles.wrong,
                ]}
              >
                <AppText size="large" weight="600" color={isWrong ? colors.error : isRight ? colors.success : colors.text}>
                  {isWrong ? '✗ ' : isRight ? '✓ ' : ''}
                  {s.texto}
                </AppText>
              </Pressable>
              {enabled ? (
                <AppButton label="Oír" icon="volume-medium" variant="ghost" compact onPress={() => speak(s.texto)} accessibilityLabel={`Escuchar: ${s.texto}`} />
              ) : null}
            </View>
          );
        })}
      </View>
      {solved ? (
        <>
          <Feedback kind="success" message="¡Correcto!" />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={onNext} />
        </>
      ) : wrong.length > 0 ? (
        <Feedback kind="retry" message="Esa frase no describe la foto. ¡Prueba otra vez!" />
      ) : null}
    </>
  );
}

// ─── Modalidad 3: construir la frase ordenando palabras ──────────────────────────────────────

function OrderSentence({
  sentence,
  withExtra,
  onNext,
  record,
}: {
  sentence: Sentence;
  withExtra: boolean;
  onNext: () => void;
  record: Rec;
}) {
  const { recordResult } = useProgress();
  const { speak } = useSpeech();
  const [available, setAvailable] = useState<WordChip[]>(() => buildChips(sentence, withExtra));
  const [built, setBuilt] = useState<WordChip[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [failed, setFailed] = useState(false);
  const word = getWord(sentence.palabraId);
  if (!word) return null;

  const texts = built.map((c) => c.text);
  const complete = built.length === sentence.tokens.length;
  const hasExtra = withExtra && available.length + built.length > sentence.tokens.length;

  const add = (chip: WordChip) => {
    setAvailable((a) => a.filter((c) => c.id !== chip.id));
    setBuilt((b) => [...b, chip]);
    setChecked(null);
  };
  const remove = (chip: WordChip) => {
    setBuilt((b) => b.filter((c) => c.id !== chip.id));
    setAvailable((a) => [...a, chip]);
    setChecked(null);
  };
  const check = () => {
    const ok = isCorrectOrder(sentence, texts);
    record(sentence.id, texts.join(' '), ok);
    setChecked(ok);
    if (ok) {
      recordResult('frases', word.id, !failed);
      speak(sentence.texto);
    } else setFailed(true);
  };
  const hint = correctPrefixLength(sentence, texts);

  return (
    <>
      <Instruction
        text={
          hasExtra
            ? 'Toca las palabras en orden para formar la frase de la foto. Sobra una palabra.'
            : 'Toca las palabras en orden para formar la frase de la foto.'
        }
      />
      <Photo imageKey={word.imagen} label={null} hiddenLabel="Fotografía de una acción" fit="contain" aspectRatio={16 / 10} />

      <View style={styles.builtBox} accessibilityLabel={`Tu frase: ${texts.join(' ') || 'vacía'}`}>
        {built.length === 0 ? (
          <AppText color={colors.textMuted}>Tu frase aparecerá aquí.</AppText>
        ) : (
          built.map((chip) => (
            <Chip key={chip.id} text={chip.text} onPress={() => remove(chip)} hint="Toca para quitarla" placed />
          ))
        )}
      </View>

      <View style={styles.chips}>
        {available.map((chip) => (
          <Chip key={chip.id} text={chip.text} onPress={() => add(chip)} hint="Toca para añadirla a la frase" />
        ))}
      </View>

      {checked === true ? (
        <>
          <Feedback kind="success" message={`¡Muy bien! «${sentence.texto}»`} />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={onNext} />
        </>
      ) : (
        <>
          {checked === false ? (
            <Feedback
              kind="retry"
              message={`Casi. ${hint > 0 ? `Las ${hint} primeras palabras están bien. ` : ''}Quita palabras tocándolas y prueba otra vez.`}
            />
          ) : null}
          <AppButton label="Comprobar" icon="checkmark" onPress={check} disabled={!complete} />
        </>
      )}
    </>
  );
}

function Chip({ text, onPress, hint, placed }: { text: string; onPress: () => void; hint: string; placed?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint={hint}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.chip,
        pressed && styles.pressed,
        placed && styles.chipPlaced,
        focused && styles.focused,
      ]}
    >
      <AppText size="large" weight="700" color={placed ? colors.onPrimary : colors.primary}>
        {text}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sentenceOption: {
    flex: 1,
    minHeight: MIN_TOUCH + 8,
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  right: { borderColor: colors.success, backgroundColor: colors.successBg },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorBg },
  gapBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  builtBox: {
    minHeight: MIN_TOUCH + 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  chipPlaced: { backgroundColor: colors.primary },
});
