import { useState } from 'react';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { ImageChoiceGrid } from '@/components/ImageChoiceGrid';
import { Instruction } from '@/components/Instruction';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { areConfusable, getAllWords, getAssociations, getWord } from '@/content/catalog';
import { buildAssociationRound, type AssociationRound } from '@/games/semantica/semanticaLogic';
import { useProgress } from '@/hooks/ProgressContext';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors } from '@/theme';
import type { Association } from '@/content/semantics';
import { shuffle } from '@/utils/random';
import { withArticle } from '@/utils/text';

/** Asociaciones: se muestra una foto y se elige la que se relaciona con ella. */
export default function AssociationsScreen() {
  const { settings } = useSettings();
  const { recordResult } = useProgress();
  const { speak } = useSpeech();
  const all = getAssociations();
  const run = useActivityRun();
  const count = run.difficulty === 'facil' ? 2 : run.difficulty === 'media' ? 3 : 4;
  /** Contador de rondas (siempre crece): clave única para registrar respuestas. */
  const [turn, setTurn] = useState(0);

  const [order, setOrder] = useState<Association[]>(() => shuffle(all));
  const [index, setIndex] = useState(0);
  const build = (a: Association | undefined) =>
    a ? buildAssociationRound(a, all, getAllWords(), getWord, areConfusable, count) : null;
  const [round, setRound] = useState<AssociationRound | null>(() => build(order[0]));
  const [result, setResult] = useState<'none' | 'wrong' | 'solved'>('none');

  if (!round) {
    return (
      <Screen>
      <SessionBar />
        <AppText>No hay asociaciones disponibles con las fotografías actuales.</AppText>
      </Screen>
    );
  }

  const prompt = `¿Qué va con ${withArticle(round.cue)}?`;
  const next = () => {
    setTurn((t) => t + 1);
    let o = order;
    let i = index + 1;
    if (i >= order.length) {
      o = shuffle(all);
      i = 0;
      setOrder(o);
    }
    setIndex(i);
    setRound(build(o[i]));
    setResult('none');
  };

  return (
    <Screen>
      <SessionBar />
      <AppText color={colors.textMuted}>
        Asociación {index + 1} de {order.length}
      </AppText>
      <Instruction text={prompt} />
      <Photo key={round.cue.id} imageKey={round.cue.imagen} label={round.cue.palabra} fit="contain" aspectRatio={16 / 9} />
      <ImageChoiceGrid
        key={`${round.association.id}-${index}`}
        options={round.options}
        answerId={round.answerId}
        showLabels={settings.showWords}
        onSolved={(firstTry) => {
          setResult('solved');
          run.record(String(turn), round.cue.id, round.answerId, true);
          recordResult('semantica', round.cue.id, firstTry);
          speak(round.association.explicacion);
        }}
        onWrong={(w) => {
          setResult('wrong');
          run.record(String(turn), round.cue.id, w.id, false);
        }}
      />
      {result === 'solved' ? (
        <>
          <Feedback kind="success" message={`¡Correcto! ${round.association.explicacion}`} />
          <AppButton label="Siguiente" icon="arrow-forward" onPress={next} />
        </>
      ) : result === 'wrong' ? (
        <Feedback kind="retry" message="No se relacionan tanto. ¡Prueba otra vez!" />
      ) : null}
    </Screen>
  );
}
