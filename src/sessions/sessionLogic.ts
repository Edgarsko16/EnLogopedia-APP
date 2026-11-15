/**
 * Lógica de sesiones: funciones puras (estado → nuevo estado).
 *
 * Reglas:
 *  - Solo se registran respuestas en una sesión EN CURSO y en la actividad actual.
 *  - Una misma interacción (ronda + elemento + respuesta) se registra una sola vez,
 *    aunque la pantalla se vuelva a pintar o se pulse dos veces.
 *  - Saltar una actividad no genera errores: queda como «saltada».
 *  - El tiempo activo se acumula al pausar o finalizar (no cuenta las pausas).
 */
import { newId } from './profiles';
import type { AttemptRecord, ManualRecord, ManualScore, Observations, PlanItem, Session, SessionItem, SessionMeta, SuggestionRequest } from './types';

const iso = (d: Date) => d.toISOString();

export function createSession(
  plan: readonly PlanItem[],
  profileId: string | null,
  origen: Session['origen'],
  now = new Date(),
  sugerencia?: SuggestionRequest,
): Session {
  const items: SessionItem[] = plan.map((p, i) => ({
    ...p,
    params: { ...p.params },
    uid: newId('i_'),
    estado: i === 0 ? 'en-curso' : 'pendiente',
    attempts: [],
    manual: [],
    startedAt: i === 0 ? iso(now) : undefined,
  }));
  return {
    version: 1,
    id: newId('s_'),
    profileId,
    origen,
    sugerencia,
    createdAt: iso(now),
    status: 'en-curso',
    items,
    currentIndex: 0,
    activeMs: 0,
    lastResumedAt: iso(now),
  };
}

export function currentItem(s: Session): SessionItem | undefined {
  return s.items[s.currentIndex];
}

function updateItem(s: Session, uid: string, fn: (it: SessionItem) => SessionItem): Session {
  return { ...s, items: s.items.map((it) => (it.uid === uid ? fn(it) : it)) };
}

/** ¿Se puede registrar ahora en este elemento de sesión? */
export function canRecord(s: Session, uid: string): boolean {
  return s.status === 'en-curso' && currentItem(s)?.uid === uid;
}

export function addAttempt(
  s: Session,
  uid: string,
  rec: { ronda: string; elemento: string; respuesta: string; correcta: boolean },
  now = new Date(),
): Session {
  if (!canRecord(s, uid)) return s;
  const item = currentItem(s)!;
  const dup = item.attempts.some((a) => a.ronda === rec.ronda && a.elemento === rec.elemento && a.respuesta === rec.respuesta);
  if (dup) return s;
  const attempt: AttemptRecord = { id: newId('a_'), at: iso(now), ...rec };
  return updateItem(s, uid, (it) => ({ ...it, attempts: [...it.attempts, attempt] }));
}

/** Valoración manual: una por ronda y elemento (si se repite, se sustituye la anterior). */
export function setManual(
  s: Session,
  uid: string,
  rec: { ronda: string; elemento: string; valoracion: ManualScore },
  now = new Date(),
): Session {
  if (!canRecord(s, uid)) return s;
  const entry: ManualRecord = { id: newId('m_'), at: iso(now), ...rec };
  return updateItem(s, uid, (it) => ({
    ...it,
    manual: [...it.manual.filter((m) => !(m.ronda === rec.ronda && m.elemento === rec.elemento)), entry],
  }));
}

function hasResults(it: SessionItem): boolean {
  return it.attempts.length > 0 || it.manual.length > 0;
}

/**
 * Cierra la actividad actual y pasa a `target` (por defecto, la siguiente).
 * Si no tiene resultados se marca como saltada; si los tiene, como completada.
 */
export function moveTo(s: Session, target = s.currentIndex + 1, now = new Date()): Session {
  if (s.status === 'finalizada') return s;
  const cur = currentItem(s);
  let next = s;
  if (cur && cur.estado === 'en-curso') {
    next = updateItem(next, cur.uid, (it) => ({ ...it, estado: hasResults(it) ? 'completada' : 'saltada', endedAt: iso(now) }));
  }
  if (target < 0 || target >= s.items.length) return { ...next, currentIndex: Math.min(Math.max(target, 0), s.items.length) };
  const t = next.items[target];
  next = updateItem(next, t.uid, (it) => ({
    ...it,
    // Volver a una actividad ya hecha permite seguir registrando en ella.
    estado: 'en-curso',
    startedAt: it.startedAt ?? iso(now),
  }));
  return { ...next, currentIndex: target };
}

/** ¿Queda alguna actividad después de la actual? */
export function hasNext(s: Session): boolean {
  return s.currentIndex + 1 < s.items.length;
}

function accumulate(s: Session, now: Date): number {
  if (s.status !== 'en-curso' || !s.lastResumedAt) return s.activeMs;
  return s.activeMs + Math.max(0, now.getTime() - new Date(s.lastResumedAt).getTime());
}

export function pauseSession(s: Session, now = new Date()): Session {
  if (s.status !== 'en-curso') return s;
  return { ...s, status: 'pausada', activeMs: accumulate(s, now), lastResumedAt: undefined };
}

export function resumeSession(s: Session, now = new Date()): Session {
  if (s.status !== 'pausada') return s;
  return { ...s, status: 'en-curso', lastResumedAt: iso(now) };
}

export function finishSession(s: Session, now = new Date()): Session {
  if (s.status === 'finalizada') return s;
  const activeMs = accumulate(s, now);
  let next: Session = { ...s, activeMs, lastResumedAt: undefined };
  const cur = currentItem(next);
  if (cur && cur.estado === 'en-curso') {
    next = updateItem(next, cur.uid, (it) => ({ ...it, estado: hasResults(it) ? 'completada' : 'saltada', endedAt: iso(now) }));
  }
  // Las actividades nunca empezadas quedan como saltadas (no cuentan como errores).
  next = { ...next, items: next.items.map((it) => (it.estado === 'pendiente' ? { ...it, estado: 'saltada' } : it)) };
  return { ...next, status: 'finalizada', endedAt: iso(now) };
}

/** Observaciones opcionales; si todas están vacías se eliminan. */
export function setObservations(s: Session, obs: Observations | null): Session {
  const clean = obs && { dificultades: obs.dificultades.trim(), apoyos: obs.apoyos.trim(), reforzar: obs.reforzar.trim() };
  if (!clean || (!clean.dificultades && !clean.apoyos && !clean.reforzar)) {
    const { observaciones: _omit, ...rest } = s;
    return rest;
  }
  return { ...s, observaciones: clean };
}

/** Duración activa en ms (incluye el tramo en curso). */
export function activeDuration(s: Session, now = new Date()): number {
  return accumulate(s, now);
}

export function toMeta(s: Session): SessionMeta {
  return {
    id: s.id,
    profileId: s.profileId,
    createdAt: s.createdAt,
    endedAt: s.endedAt,
    status: s.status,
    activityIds: s.items.map((i) => i.activityId),
    activeMs: s.activeMs,
  };
}
