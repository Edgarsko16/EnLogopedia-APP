/**
 * Cálculo de resultados de sesiones y de seguimiento por perfil.
 *
 * Principios:
 *  - Respuestas automáticas y valoraciones manuales se cuentan por separado.
 *  - Solo se da porcentaje con un mínimo de rondas (MIN_ROUNDS_FOR_RATE).
 *  - Lo que aquí se marca como «a reforzar» es una pista para el profesional,
 *    no una interpretación clínica.
 */
import { getActivity } from '@/activities/catalog';
import type { ActivityId, AreaId, ObjectiveId } from '@/activities/types';
import type { ManualScore, Session, SessionItem } from './types';

export const MIN_ROUNDS_FOR_RATE = 5;

export interface Failure {
  elemento: string;
  /** Respuestas incorrectas elegidas para ese elemento. */
  respuestas: string[];
}

export interface ItemSummary {
  uid: string;
  activityId: ActivityId;
  modalidad: string;
  dificultad: SessionItem['dificultad'];
  estado: SessionItem['estado'];
  objetivos: ObjectiveId[];
  /** Respuestas automáticas */
  rondas: number;
  aciertosPrimera: number;
  resueltasTrasError: number;
  errores: number;
  fallos: Failure[];
  /** Porcentaje de aciertos a la primera, o null si hay pocas rondas. */
  tasa: number | null;
  /** Valoraciones manuales */
  manual: Record<ManualScore, number>;
  manualTotal: number;
  /** Elementos valorados como incorrectos o con ayuda. */
  manualDificultades: { elemento: string; valoracion: ManualScore }[];
}

const emptyManual = (): Record<ManualScore, number> => ({ correcto: 0, 'con-ayuda': 0, incorrecto: 0, 'no-realizado': 0 });

export function summarizeItem(it: SessionItem): ItemSummary {
  const activity = getActivity(it.activityId);
  const objetivos = activity?.modalidades.find((m) => m.id === it.modalidad)?.objetivos ?? [];
  const byRound = new Map<string, typeof it.attempts>();
  for (const a of it.attempts) byRound.set(a.ronda, [...(byRound.get(a.ronda) ?? []), a]);
  let aciertosPrimera = 0;
  let resueltasTrasError = 0;
  for (const list of byRound.values()) {
    const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at));
    if (sorted[0]?.correcta) aciertosPrimera++;
    else if (sorted.some((x) => x.correcta)) resueltasTrasError++;
  }
  const failures = new Map<string, Set<string>>();
  for (const a of it.attempts.filter((x) => !x.correcta)) {
    failures.set(a.elemento, (failures.get(a.elemento) ?? new Set()).add(a.respuesta));
  }
  const manual = emptyManual();
  for (const m of it.manual) manual[m.valoracion]++;
  const rondas = byRound.size;
  return {
    uid: it.uid,
    activityId: it.activityId,
    modalidad: it.modalidad,
    dificultad: it.dificultad,
    estado: it.estado,
    objetivos,
    rondas,
    aciertosPrimera,
    resueltasTrasError,
    errores: it.attempts.filter((a) => !a.correcta).length,
    fallos: [...failures.entries()].map(([elemento, r]) => ({ elemento, respuestas: [...r] })),
    tasa: rondas >= MIN_ROUNDS_FOR_RATE ? Math.round((aciertosPrimera / rondas) * 100) : null,
    manual,
    manualTotal: it.manual.length,
    manualDificultades: it.manual
      .filter((m) => m.valoracion === 'incorrecto' || m.valoracion === 'con-ayuda')
      .map((m) => ({ elemento: m.elemento, valoracion: m.valoracion })),
  };
}

export interface SessionSummary {
  items: ItemSummary[];
  realizadas: ItemSummary[];
  saltadas: ItemSummary[];
  objetivos: ObjectiveId[];
  auto: { rondas: number; aciertosPrimera: number; resueltasTrasError: number; errores: number };
  manual: Record<ManualScore, number>;
  manualTotal: number;
}

export function summarizeSession(s: Session): SessionSummary {
  const items = s.items.map(summarizeItem);
  const realizadas = items.filter((i) => i.estado === 'completada' || i.rondas > 0 || i.manualTotal > 0);
  const manual = emptyManual();
  for (const i of items) for (const k of Object.keys(manual) as ManualScore[]) manual[k] += i.manual[k];
  return {
    items,
    realizadas,
    saltadas: items.filter((i) => i.estado === 'saltada' && i.rondas === 0 && i.manualTotal === 0),
    objetivos: [...new Set(realizadas.flatMap((i) => i.objetivos))],
    auto: {
      rondas: items.reduce((n, i) => n + i.rondas, 0),
      aciertosPrimera: items.reduce((n, i) => n + i.aciertosPrimera, 0),
      resueltasTrasError: items.reduce((n, i) => n + i.resueltasTrasError, 0),
      errores: items.reduce((n, i) => n + i.errores, 0),
    },
    manual,
    manualTotal: items.reduce((n, i) => n + i.manualTotal, 0),
  };
}

// ─── Seguimiento por perfil ─────────────────────────────────────────────────

export interface ElementDifficulty {
  elemento: string;
  /** Rondas en que se trabajó el elemento (automáticas). */
  exposiciones: number;
  /** Rondas con al menos un error. */
  rondasConError: number;
  /** Valoraciones manuales «incorrecto» o «con ayuda». */
  manualDificultad: number;
  manualTotal: number;
}

export interface ActivityToReinforce {
  activityId: ActivityId;
  modalidad: string;
  rondas: number;
  tasa: number | null;
  manualDificultad: number;
  manualTotal: number;
}

export interface ProfileStats {
  sesiones: number;
  ultima?: string;
  areas: AreaId[];
  frecuentes: { activityId: ActivityId; veces: number }[];
  dificultades: ElementDifficulty[];
  reforzar: ActivityToReinforce[];
}

/**
 * Agrega las sesiones FINALIZADAS de un perfil.
 * Un elemento se considera «con dificultad» si se trabajó al menos 2 veces y
 * falló en la mitad o más, o si tuvo 2 o más valoraciones manuales negativas.
 */
export function profileStats(sessions: readonly Session[]): ProfileStats {
  const done = sessions.filter((s) => s.status === 'finalizada');
  const areas = new Set<AreaId>();
  const freq = new Map<ActivityId, number>();
  const elements = new Map<string, ElementDifficulty>();
  const byActivity = new Map<string, ActivityToReinforce & { aciertos: number }>();
  const el = (id: string) => {
    let e = elements.get(id);
    if (!e) elements.set(id, (e = { elemento: id, exposiciones: 0, rondasConError: 0, manualDificultad: 0, manualTotal: 0 }));
    return e;
  };

  for (const s of done) {
    for (const it of s.items) {
      if (it.attempts.length === 0 && it.manual.length === 0) continue;
      getActivity(it.activityId)?.areas.forEach((a) => areas.add(a));
      freq.set(it.activityId, (freq.get(it.activityId) ?? 0) + 1);
      const sum = summarizeItem(it);
      // Exposiciones y errores por elemento, ronda a ronda.
      const rounds = new Map<string, { elemento: string; error: boolean }>();
      for (const a of it.attempts) {
        const key = `${a.ronda}|${a.elemento}`;
        const r = rounds.get(key) ?? { elemento: a.elemento, error: false };
        if (!a.correcta) r.error = true;
        rounds.set(key, r);
      }
      for (const r of rounds.values()) {
        const e = el(r.elemento);
        e.exposiciones++;
        if (r.error) e.rondasConError++;
      }
      for (const m of it.manual) {
        const e = el(m.elemento);
        if (m.valoracion === 'no-realizado') continue;
        e.manualTotal++;
        if (m.valoracion === 'incorrecto' || m.valoracion === 'con-ayuda') e.manualDificultad++;
      }
      const key = `${it.activityId}|${it.modalidad}`;
      const acc = byActivity.get(key) ?? { activityId: it.activityId, modalidad: it.modalidad, rondas: 0, aciertos: 0, tasa: null, manualDificultad: 0, manualTotal: 0 };
      acc.rondas += sum.rondas;
      acc.aciertos += sum.aciertosPrimera;
      acc.manualDificultad += sum.manual['con-ayuda'] + sum.manual.incorrecto;
      acc.manualTotal += sum.manualTotal - sum.manual['no-realizado'];
      byActivity.set(key, acc);
    }
  }

  const dificultades = [...elements.values()]
    .filter((e) => (e.exposiciones >= 2 && e.rondasConError / e.exposiciones >= 0.5) || e.manualDificultad >= 2)
    .sort((a, b) => b.rondasConError + b.manualDificultad - (a.rondasConError + a.manualDificultad));

  const reforzar = [...byActivity.values()]
    .map(({ aciertos, ...a }) => ({ ...a, tasa: a.rondas >= MIN_ROUNDS_FOR_RATE ? Math.round((aciertos / a.rondas) * 100) : null }))
    .filter(
      (a) =>
        (a.tasa !== null && a.tasa < 60) ||
        (a.manualTotal >= MIN_ROUNDS_FOR_RATE && a.manualDificultad / a.manualTotal >= 0.5),
    );

  const sortedDone = [...done].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    sesiones: done.length,
    ultima: sortedDone[0]?.createdAt,
    areas: [...areas],
    frecuentes: [...freq.entries()].map(([activityId, veces]) => ({ activityId, veces })).sort((a, b) => b.veces - a.veces),
    dificultades,
    reforzar,
  };
}
