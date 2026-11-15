import { useState } from 'react';
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
import { TextChoiceList } from '@/components/TextChoiceList';
import { areConfusable, getAllWords, getFunctions, getWord } from '@/content/catalog';
import {
  buildFunctionImageRound,
  buildFunctionTextRound,
  objectWords,
  wordsWithFunction,
  type FunctionImageRound,
  type FunctionTextRound,
} from '@/games/semantica/semanticaLogic';
import { useProgress } from '@/hooks/ProgressContext';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors } from '@/theme';
import { sample } from '@/utils/random';
import { capitalize, withArticle } from '@/utils/text';

type Mode = 'usamos' | 'sirve';

/**
 * Funciones, en dos sentidos:
 *  - "¿Qué usamos para…?": se lee/escucha el uso y se elige la foto.
 *  - "¿Para qué sirve…?": se ve la foto y se elige el uso entre textos.
 */
export default function FunctionsScreen() {
  const { settings } = useSettings();
  const { recordResult } = useProgress();
  const { speak } = useSpeech();
  const run = useActivityRun();
  const [mode, setMode] = useState<Mode>(run.modalidad === 'sirve' ? 'sirve' : 'usamos');
  const [roundNo, setRoundNo] = useState(1);
  const count = run.difficulty === 'facil' ? 2 : 3;
  const ronda = `${mode}-${roundNo}`;
  const fns = getFunctions();

  const makeImage = (): FunctionImageRound | null => {
    const fn = sample(fns, 1)[0];
    return fn ? buildFunctionImageRound(fn, objectWords(getAllWords()), getWord, areConfusable, count + 1) : null;
  };
  const makeText = (): FunctionTextRound | null => {
    const w = sample(wordsWithFunction(getAllWords(), fns), 1)[0];
    return w ? buildFunctionTextRound(w, fns, count + 1) : null;
  };

  const [imageRound, setImageRound] = useState(makeImage);
  const [textRound, setTextRound] = useState(makeText);
  const [result, setResult] = useState<'none' | 'wrong' | 'solved'>('none');

  const next = () => {
    if (mode === 'usamos') setImageRound(makeImage());
    else setTextRound(makeText());
    setRoundNo((n) => n + 1);
    setResult('none');
  };

  const onSolved = (wordId: string, respuesta: string, message: string) => (firstTry: boolean) => {
    setResult('solved');
    run.record(ronda, wordId, respuesta, true);
    recordResult('semantica', wordId, firstTry);
    speak(message);
  };

  let body: React.ReactNode = <AppText>No hay suficientes fotografías para este ejercicio.</AppText>;
  let success = '';

  if (mode === 'usamos' && imageRound) {
    const answer = getWord(imageRound.answerId)!;
    success = `Usamos ${withArticle(answer)} para ${imageRound.fn.para}.`;
    body = (
      <>
        <Instruction text={`¿Qué usamos para ${imageRound.fn.para}?`} />
        <ImageChoiceGrid
          key={`u-${roundNo}`}
          options={imageRound.options}
          answerId={imageRound.answerId}
          showLabels={settings.showWords}
          onSolved={onSolved(answer.id, answer.id, success)}
          onWrong={(w) => {
            setResult('wrong');
            run.record(ronda, answer.id, w.id, false);
          }}
        />
      </>
    );
  } else if (mode === 'sirve' && textRound) {
    const answer = textRound.options.find((f) => f.id === textRound.answerId)!;
    success = `${capitalize(withArticle(textRound.word))} sirve para ${answer.para}.`;
    body = (
      <>
        <Instruction text={`¿Para qué sirve ${withArticle(textRound.word)}?`} />
        <Photo key={textRound.word.id} imageKey={textRound.word.imagen} label={textRound.word.palabra} fit="contain" aspectRatio={16 / 10} />
        <TextChoiceList
          key={`s-${roundNo}`}
          options={textRound.options.map((f) => ({ id: f.id, text: `Para ${f.para}` }))}
          answerId={textRound.answerId}
          onSolved={onSolved(textRound.word.id, textRound.answerId, success)}
          onWrong={(o) => {
            setResult('wrong');
            run.record(ronda, textRound.word.id, o.id, false);
          }}
        />
      </>
    );
  }

  return (
    <Screen>
      <SessionBar />
      <OptionSelector<Mode>
        label="Modalidad"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setResult('none');
          setRoundNo((n) => n + 1);
        }}
        options={[
          { value: 'usamos', label: '¿Qué usamos para…?' },
          { value: 'sirve', label: '¿Para qué sirve?' },
        ]}
      />
      <AppText color={colors.textMuted}>Ronda {roundNo}</AppText>
      {body}
      {result === 'solved' ? (
        <>
          <Feedback kind="success" message={`¡Muy bien! ${success}`} />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={next} />
        </>
      ) : result === 'wrong' ? (
        <Feedback kind="retry" message="Esa no es. ¡Prueba otra vez!" />
      ) : null}
    </Screen>
  );
}
