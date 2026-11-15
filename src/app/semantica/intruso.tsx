import { useState } from 'react';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { ImageChoiceGrid } from '@/components/ImageChoiceGrid';
import { Instruction } from '@/components/Instruction';
import { Screen } from '@/components/Screen';
import { SessionBar } from '@/components/SessionBar';
import { useActivityRun } from '@/sessions/useActivityRun';
import { areConfusable, getAllWords, getCategory } from '@/content/catalog';
import { buildOddOneOutRound, type OddOneOutRound } from '@/games/semantica/semanticaLogic';
import { useProgress } from '@/hooks/ProgressContext';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { colors } from '@/theme';
import { capitalize, withArticle } from '@/utils/text';

/** "¿Cuál no pertenece?": varias fotos de un grupo y una intrusa de otro. */
export default function OddOneOutScreen() {
  const { settings } = useSettings();
  const { recordResult } = useProgress();
  const { speak } = useSpeech();
  const run = useActivityRun();
  const groupSize = run.difficulty === 'dificil' ? 4 : 3;
  const make = () => buildOddOneOutRound(getAllWords(), areConfusable, groupSize);
  const [round, setRound] = useState<OddOneOutRound | null>(make);
  const [roundNo, setRoundNo] = useState(1);
  const [result, setResult] = useState<'none' | 'wrong' | 'solved'>('none');

  if (!round) {
    return (
      <Screen>
      <SessionBar />
        <AppText>No hay suficientes fotografías para este ejercicio.</AppText>
      </Screen>
    );
  }

  const odd = round.options.find((w) => w.id === round.answerId)!;
  const group = getCategory(round.grupo)!;
  const oddCategory = getCategory(odd.categoria)!;
  const explanation = `Las demás son de ${group.nombre.toLowerCase()}; ${withArticle(odd)} es de ${oddCategory.nombre.toLowerCase()}.`;

  return (
    <Screen>
      <SessionBar />
      <AppText color={colors.textMuted}>Ronda {roundNo}</AppText>
      <Instruction text="¿Cuál no pertenece al grupo?" />
      <ImageChoiceGrid
        key={roundNo}
        options={round.options}
        answerId={round.answerId}
        showLabels={settings.showWords}
        onSolved={(firstTry) => {
          setResult('solved');
          run.record(String(roundNo), odd.id, odd.id, true);
          recordResult('semantica', odd.id, firstTry);
          speak(`¡Muy bien! ${explanation}`);
        }}
        onWrong={(w) => {
          setResult('wrong');
          run.record(String(roundNo), odd.id, w.id, false);
        }}
      />
      {result === 'solved' ? (
        <>
          <Feedback kind="success" message={`¡Muy bien! ${capitalize(explanation)}`} />
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
        <Feedback kind="retry" message="Esa sí es del grupo. Fíjate en qué tienen en común las demás." />
      ) : null}
    </Screen>
  );
}
