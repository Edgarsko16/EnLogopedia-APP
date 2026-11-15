import { StyleSheet, View } from 'react-native';
import { getObjective } from '@/activities/catalog';
import { activityLabel, DIFFICULTY_LABELS, formatDateTime, formatDuration, labelFor, MANUAL_LABELS } from '@/sessions/labels';
import { MIN_ROUNDS_FOR_RATE, summarizeSession } from '@/sessions/results';
import { activeDuration } from '@/sessions/sessionLogic';
import type { ManualScore, Session } from '@/sessions/types';
import { colors, spacing } from '@/theme';
import { plural } from '@/utils/text';
import { AppText } from './AppText';
import { Card, SectionHeader, Tag } from './ui';

/**
 * Resumen de una sesión. Separa respuestas automáticas y valoraciones del
 * profesional, y solo muestra porcentajes con suficientes rondas.
 */
export function SessionSummaryView({ session, profileAlias }: { session: Session; profileAlias?: string }) {
  const sum = summarizeSession(session);
  const duration = activeDuration(session);

  return (
    <View style={styles.wrap}>
      <Card>
        <AppText size="large" weight="800" color={colors.navy}>
          {formatDateTime(session.createdAt)}
        </AppText>
        <AppText>Perfil: {profileAlias ?? 'Sesión sin perfil'}</AppText>
        <AppText>Duración activa: {duration > 0 ? formatDuration(duration) : 'no disponible'}</AppText>
        <AppText>
          Actividades realizadas: {sum.realizadas.length} de {sum.items.length}
          {sum.saltadas.length > 0 ? ` (${sum.saltadas.length} saltadas)` : ''}
        </AppText>
        {sum.objetivos.length > 0 ? (
          <View style={styles.tags}>
            {sum.objetivos.map((o) => (
              <Tag key={o} label={getObjective(o)?.nombre ?? o} tone="primary" />
            ))}
          </View>
        ) : null}
      </Card>

      {sum.auto.rondas > 0 ? (
        <Card>
          <AppText weight="700" color={colors.navy}>
            Respuestas automáticas (actividades con respuesta objetiva)
          </AppText>
          <AppText>
            {plural(sum.auto.rondas, 'ronda')}: {sum.auto.aciertosPrimera} a la primera, {sum.auto.resueltasTrasError} resueltas tras algún error.
          </AppText>
          <AppText>Respuestas incorrectas elegidas: {sum.auto.errores}.</AppText>
        </Card>
      ) : null}

      {sum.manualTotal > 0 ? (
        <Card>
          <AppText weight="700" color={colors.navy}>
            Valoraciones del profesional (respuestas orales)
          </AppText>
          {(Object.keys(MANUAL_LABELS) as ManualScore[]).map((k) => (
            <AppText key={k}>
              {MANUAL_LABELS[k]}: {sum.manual[k]}
            </AppText>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="Por actividad" />
      {sum.items.map((it, i) => (
        <Card key={it.uid}>
          <View style={styles.head}>
            <AppText weight="700" style={styles.flex}>
              {i + 1}. {activityLabel(it.activityId, it.modalidad)}
            </AppText>
            <Tag
              label={it.estado === 'saltada' && it.rondas === 0 && it.manualTotal === 0 ? 'Saltada' : 'Realizada'}
              tone={it.estado === 'saltada' && it.rondas === 0 && it.manualTotal === 0 ? 'neutral' : 'success'}
            />
          </View>
          <AppText size="small" color={colors.textMuted}>
            Dificultad: {DIFFICULTY_LABELS[it.dificultad]}
          </AppText>
          {it.rondas > 0 ? (
            <AppText>
              {plural(it.rondas, 'ronda')} · {it.aciertosPrimera} a la primera · {plural(it.errores, 'respuesta incorrecta', 'respuestas incorrectas')}
              {it.tasa !== null ? ` · ${it.tasa} % a la primera` : ''}
            </AppText>
          ) : null}
          {it.rondas > 0 && it.tasa === null ? (
            <AppText size="small" color={colors.textMuted}>
              Sin porcentaje: hacen falta al menos {MIN_ROUNDS_FOR_RATE} rondas para que sea orientativo.
            </AppText>
          ) : null}
          {it.manualTotal > 0 ? (
            <AppText>
              {(Object.keys(MANUAL_LABELS) as ManualScore[])
                .filter((k) => it.manual[k] > 0)
                .map((k) => `${MANUAL_LABELS[k]}: ${it.manual[k]}`)
                .join(' · ')}
            </AppText>
          ) : null}
          {it.fallos.length > 0 ? (
            <View style={styles.list}>
              <AppText size="small" weight="700" color={colors.error}>
                Elementos con errores
              </AppText>
              {it.fallos.map((f) => (
                <AppText key={f.elemento} size="small">
                  • {labelFor(f.elemento)}: eligió {f.respuestas.map(labelFor).join(', ')}
                </AppText>
              ))}
            </View>
          ) : null}
          {it.manualDificultades.length > 0 ? (
            <View style={styles.list}>
              <AppText size="small" weight="700" color={colors.warning}>
                Elementos con ayuda o incorrectos
              </AppText>
              {it.manualDificultades.map((m, k) => (
                <AppText key={`${m.elemento}-${k}`} size="small">
                  • {labelFor(m.elemento)}: {MANUAL_LABELS[m.valoracion].toLowerCase()}
                </AppText>
              ))}
            </View>
          ) : null}
        </Card>
      ))}

      {session.observaciones ? (
        <Card soft>
          <AppText weight="700" color={colors.navy}>
            Observaciones
          </AppText>
          {session.observaciones.dificultades ? <AppText>Dificultades: {session.observaciones.dificultades}</AppText> : null}
          {session.observaciones.apoyos ? <AppText>Apoyos: {session.observaciones.apoyos}</AppText> : null}
          {session.observaciones.reforzar ? <AppText>A reforzar: {session.observaciones.reforzar}</AppText> : null}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  list: { gap: 2, marginTop: spacing.xs },
});
