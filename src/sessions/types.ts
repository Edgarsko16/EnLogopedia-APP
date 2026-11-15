/**
 * Modelo de datos de perfiles, sesiones y resultados.
 *
 * Privacidad: un perfil es solo un alias no identificativo y fechas. No se
 * guarda ningún dato clínico ni identificativo. Todo vive en el dispositivo.
 */
import type { ActivityId, ActivityParams, AreaId, ObjectiveId } from '@/activities/types';
import type { Difficulty } from '@/types/settings';

export interface Profile {
  /** Identificador interno aleatorio (no derivado del alias). */
  id: string;
  /** Alias o código no identificativo: «Usuario 01», «Caso A». */
  alias: string;
  createdAt: string;
  lastActivityAt?: string;
}

/** Valoración manual del profesional en ejercicios orales. */
export type ManualScore = 'correcto' | 'con-ayuda' | 'incorrecto' | 'no-realizado';

/** Una respuesta objetiva: qué se trabajaba (elemento) y qué se eligió (respuesta). */
export interface AttemptRecord {
  id: string;
  at: string;
  /** Clave de la ronda dentro de la actividad (evita contar dos veces la misma interacción). */
  ronda: string;
  /** Elemento trabajado: id de palabra, frase, función… */
  elemento: string;
  /** Respuesta elegida: id de palabra, categoría, texto… */
  respuesta: string;
  correcta: boolean;
}

export interface ManualRecord {
  id: string;
  at: string;
  ronda: string;
  elemento: string;
  valoracion: ManualScore;
}

export type ItemStatus = 'pendiente' | 'en-curso' | 'completada' | 'saltada';

/** Actividad planificada dentro de una sesión. */
export interface PlanItem {
  activityId: ActivityId;
  modalidad: string;
  dificultad: Difficulty;
  params: ActivityParams;
}

export interface SessionItem extends PlanItem {
  uid: string;
  estado: ItemStatus;
  attempts: AttemptRecord[];
  manual: ManualRecord[];
  startedAt?: string;
  endedAt?: string;
}

export type SessionStatus = 'en-curso' | 'pausada' | 'finalizada';

export interface Observations {
  dificultades: string;
  apoyos: string;
  reforzar: string;
}

export interface SuggestionRequest {
  area: AreaId;
  objetivo: ObjectiveId | 'todos';
  dificultad: Difficulty;
  duracion: 15 | 20 | 30;
}

export interface Session {
  version: 1;
  id: string;
  profileId: string | null;
  origen: 'libre' | 'sugerida';
  sugerencia?: SuggestionRequest;
  createdAt: string;
  status: SessionStatus;
  items: SessionItem[];
  currentIndex: number;
  /** Tiempo activo acumulado (sin contar pausas), en milisegundos. */
  activeMs: number;
  /** Momento en que se reanudó por última vez (si está en curso). */
  lastResumedAt?: string;
  endedAt?: string;
  observaciones?: Observations;
}

/** Datos ligeros de una sesión para listados (se guardan en un índice aparte). */
export interface SessionMeta {
  id: string;
  profileId: string | null;
  createdAt: string;
  endedAt?: string;
  status: SessionStatus;
  activityIds: ActivityId[];
  activeMs: number;
}

export const EMPTY_OBSERVATIONS: Observations = { dificultades: '', apoyos: '', reforzar: '' };
