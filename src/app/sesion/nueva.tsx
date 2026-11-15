import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ACTIVITIES,
  activitiesForArea,
  AREAS,
  availabilityOf,
  getActivity,
  isActivityUsable,
  objectivesForArea,
} from '@/activities/catalog';
import type { ActivityDef, AreaId, ObjectiveId } from '@/activities/types';
import { AppButton, type IconName } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { OptionSelector } from '@/components/OptionSelector';
import { Screen } from '@/components/Screen';
import { Card, SectionHeader, Tag } from '@/components/ui';
import { getCategories, getAllWords, getPhonologyOptions } from '@/content/catalog';
import { availablePhonemes, phonemeLabel } from '@/games/fonologia/fonologiaLogic';
import { useSettings } from '@/hooks/SettingsContext';
import { activityLabel, DIFFICULTY_LABELS } from '@/sessions/labels';
import { currentHref } from '@/sessions/navigation';
import { useSessions } from '@/sessions/SessionsContext';
import { suggestSession } from '@/sessions/suggest';
import type { PlanItem, SuggestionRequest } from '@/sessions/types';
import { colors, radius, spacing } from '@/theme';
import type { CategoryId } from '@/types/content';
import type { Difficulty } from '@/types/settings';

type Mode = 'libre' | 'sugerida';
type Row = PlanItem & { key: string };

const DIFFICULTIES: Difficulty[] = ['facil', 'media', 'dificil'];
let rowCounter = 0;
const rowKey = () => `r${++rowCounter}`;

/** Preparación de una sesión: perfil, actividades (libres o sugeridas), configuración y orden. */
export default function NewSessionScreen() {
  const { perfil } = useLocalSearchParams<{ perfil?: string }>();
  const { settings } = useSettings();
  const { profiles, active, startSession, finish, resume } = useSessions();
  const [profileId, setProfileId] = useState<string>(profiles.some((p) => p.id === perfil) ? String(perfil) : '');
  const [mode, setMode] = useState<Mode>('libre');
  const [rows, setRows] = useState<Row[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [request, setRequest] = useState<SuggestionRequest>({ area: 'lenguaje', objetivo: 'todos', dificultad: settings.difficulty, duracion: 20 });
  const [confirmFinish, setConfirmFinish] = useState(false);

  const usable = useMemo(() => ACTIVITIES.filter((a) => isActivityUsable(a, settings.seseo)), [settings.seseo]);
  const areasWithActivities = AREAS.filter((a) => activitiesForArea(a.id).some((x) => usable.includes(x)));
  const phonemes = useMemo(() => availablePhonemes(getAllWords(), getPhonologyOptions(settings.seseo)), [settings.seseo]);

  const defaultRow = (a: ActivityDef): Row => {
    const modalidad = a.modalidades.find((m) => m.valoracion !== 'ninguna')?.id ?? a.modalidades[0].id;
    const params: PlanItem['params'] = {};
    if (a.parametros.categoria === 'obligatorio') params.categoria = getCategories()[0]?.id;
    if (a.parametros.fonema) params.fonema = phonemes.find((p) => p.usable > 0)?.phoneme.id ?? phonemes[0]?.phoneme.id;
    return { key: rowKey(), activityId: a.id, modalidad, dificultad: settings.difficulty, params };
  };

  const update = (key: string, patch: Partial<PlanItem>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const copy = [...r];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const availability = rows.map((r) => availabilityOf(r.activityId, r.modalidad, r.params, settings.seseo));
  const canStart = rows.length > 0 && availability.every((a) => a.disponible) && !active;

  const start = () => {
    const plan: PlanItem[] = rows.map(({ key: _k, ...p }) => p);
    const s = startSession(plan, profileId || null, mode, mode === 'sugerida' ? request : undefined);
    router.replace(currentHref(s));
  };

  return (
    <Screen>
      {active ? (
        <Card style={styles.warn}>
          <AppText weight="700">Hay una sesión sin terminar</AppText>
          <AppText>Para empezar una nueva, continúa la anterior o finalízala (sus resultados se guardan).</AppText>
          {confirmFinish ? (
            <View style={styles.row}>
              <AppButton
                label="Sí, finalizarla"
                variant="danger"
                style={styles.flex}
                onPress={() => {
                  finish();
                  setConfirmFinish(false);
                }}
              />
              <AppButton label="Cancelar" variant="ghost" style={styles.flex} onPress={() => setConfirmFinish(false)} />
            </View>
          ) : (
            <View style={styles.row}>
              <AppButton
                label="Continuar la sesión"
                icon="play"
                style={styles.flex}
                onPress={() => {
                  const s = active.status === 'pausada' ? resume() : active;
                  if (s) router.replace(currentHref(s));
                }}
              />
              <AppButton label="Finalizarla" icon="stop" variant="secondary" style={styles.flex} onPress={() => setConfirmFinish(true)} />
            </View>
          )}
        </Card>
      ) : null}

      <SectionHeader title="1. Perfil" subtitle="Opcional: sirve para ordenar el historial." />
      <OptionSelector<string>
        label="Perfil de la sesión"
        value={profileId}
        onChange={setProfileId}
        options={[{ value: '', label: 'Sin perfil' }, ...profiles.map((p) => ({ value: p.id, label: p.alias }))]}
      />
      <AppButton label="Gestionar perfiles" icon="people" variant="ghost" compact onPress={() => router.push('/perfiles')} />

      <SectionHeader title="2. Actividades" />
      <OptionSelector<Mode>
        label="Tipo de sesión"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setAvisos([]);
        }}
        options={[
          { value: 'libre', label: 'Elegir actividades' },
          { value: 'sugerida', label: 'Sesión sugerida' },
        ]}
      />

      {mode === 'sugerida' ? (
        <Card>
          <OptionSelector<AreaId>
            label="Área"
            value={request.area}
            onChange={(area) => setRequest((r) => ({ ...r, area, objetivo: 'todos' }))}
            options={areasWithActivities.map((a) => ({ value: a.id, label: a.nombre }))}
          />
          <OptionSelector<ObjectiveId | 'todos'>
            label="Objetivo"
            value={request.objetivo}
            onChange={(objetivo) => setRequest((r) => ({ ...r, objetivo }))}
            options={[{ value: 'todos', label: 'Todos' }, ...objectivesForArea(request.area).map((o) => ({ value: o.id, label: o.nombre }))]}
          />
          <OptionSelector<Difficulty>
            label="Dificultad"
            value={request.dificultad}
            onChange={(dificultad) => setRequest((r) => ({ ...r, dificultad }))}
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
          />
          <OptionSelector<number>
            label="Duración orientativa"
            value={request.duracion}
            onChange={(d) => setRequest((r) => ({ ...r, duracion: d as SuggestionRequest['duracion'] }))}
            options={[15, 20, 30].map((d) => ({ value: d, label: `${d} min` }))}
          />
          <AppButton
            label="Proponer actividades"
            icon="sparkles"
            onPress={() => {
              const s = suggestSession(request, settings.seseo);
              setRows(s.plan.map((p) => ({ ...p, key: rowKey() })));
              setAvisos([
                ...s.avisos,
                `Propuesta de unos ${s.minutos} minutos basada en reglas sencillas. Revísala y ajústala: no es un programa terapéutico validado.`,
              ]);
            }}
          />
        </Card>
      ) : (
        <Card>
          <AppText weight="600">Añadir actividad</AppText>
          <View style={styles.row}>
            {usable.map((a) => (
              <AppButton
                key={a.id}
                label={a.nombre}
                icon={a.icono as IconName}
                variant="secondary"
                compact
                onPress={() => setRows((r) => [...r, defaultRow(a)])}
                accessibilityLabel={`Añadir ${a.nombre}`}
              />
            ))}
          </View>
        </Card>
      )}

      {avisos.map((a) => (
        <Feedback key={a} kind="info" message={a} />
      ))}

      {rows.length > 0 ? <SectionHeader title="3. Orden y configuración" subtitle={`${rows.length} actividades`} /> : null}
      {rows.map((r, i) => {
        const a = getActivity(r.activityId)!;
        const av = availability[i];
        const usablePhonemes = phonemes.filter((p) => (r.modalidad === 'escuchar' ? p.total > 0 : p.usable > 0));
        return (
          <Card key={r.key}>
            <View style={styles.head}>
              <AppText size="large" weight="700" color={colors.navy} style={styles.flex}>
                {i + 1}. {activityLabel(r.activityId, r.modalidad)}
              </AppText>
              {!av.disponible ? <Tag label="Sin contenido" tone="error" /> : null}
            </View>
            {a.modalidades.length > 1 ? (
              <OptionSelector<string>
                label="Modalidad"
                value={r.modalidad}
                onChange={(modalidad) => update(r.key, { modalidad })}
                options={a.modalidades.map((m) => ({ value: m.id, label: m.nombre }))}
              />
            ) : null}
            <OptionSelector<Difficulty>
              label="Dificultad"
              value={r.dificultad}
              onChange={(dificultad) => update(r.key, { dificultad })}
              options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
            />
            {a.parametros.categoria ? (
              <OptionSelector<string>
                label="Categoría"
                value={r.params.categoria ?? ''}
                onChange={(c) => update(r.key, { params: { ...r.params, categoria: (c || undefined) as CategoryId | undefined } })}
                options={[
                  ...(a.parametros.categoria === 'opcional' ? [{ value: '', label: 'Todas' }] : []),
                  ...getCategories().map((c) => ({ value: c.id, label: c.nombre })),
                ]}
              />
            ) : null}
            {a.parametros.fonema ? (
              <OptionSelector<string>
                label="Fonema inicial"
                value={r.params.fonema ?? ''}
                onChange={(fonema) => update(r.key, { params: { ...r.params, fonema } })}
                options={usablePhonemes.map((p) => ({ value: p.phoneme.id, label: phonemeLabel(p.phoneme) }))}
              />
            ) : null}
            {av.motivo ? <Feedback kind={av.disponible ? 'info' : 'retry'} message={av.motivo} /> : null}
            <View style={styles.row}>
              <AppButton label="Subir" icon="arrow-up" variant="ghost" compact disabled={i === 0} onPress={() => move(i, -1)} accessibilityLabel={`Subir ${a.nombre}`} />
              <AppButton label="Bajar" icon="arrow-down" variant="ghost" compact disabled={i === rows.length - 1} onPress={() => move(i, 1)} accessibilityLabel={`Bajar ${a.nombre}`} />
              <AppButton label="Quitar" icon="close" variant="danger" compact onPress={() => setRows((x) => x.filter((y) => y.key !== r.key))} accessibilityLabel={`Quitar ${a.nombre}`} />
            </View>
          </Card>
        );
      })}

      {rows.length > 0 ? (
        <AppButton label="Iniciar sesión" icon="play" onPress={start} disabled={!canStart} accessibilityHint="Abre la primera actividad de la sesión" />
      ) : (
        <AppText color={colors.textMuted}>Añade al menos una actividad para empezar.</AppText>
      )}
      {rows.length > 0 && !canStart && !active ? (
        <AppText size="small" color={colors.error}>
          Revisa las actividades marcadas «Sin contenido».
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  flex: { flex: 1, minWidth: 160 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  warn: { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.lg },
});
