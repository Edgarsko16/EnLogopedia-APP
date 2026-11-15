import type { CategoryId } from '@/types/content';
import type { Difficulty } from '@/types/settings';

export type AreaId = 'lenguaje' | 'habla' | 'audicion' | 'lectoescritura' | 'cognitivas' | 'comunicacion';

export interface Area {
  id: AreaId;
  nombre: string;
  descripcion: string;
  icono: string;
  /** Líneas de trabajo previstas que aún no tienen actividades (se muestran como «próximamente»). */
  previstas: string[];
}

export type ObjectiveId =
  | 'vocabulario-receptivo'
  | 'vocabulario-expresivo'
  | 'categorizacion'
  | 'relaciones-semanticas'
  | 'comprension-frases'
  | 'construccion-frases'
  | 'fonema-inicial'
  | 'memoria-visual'
  | 'atencion';

export interface Objective {
  id: ObjectiveId;
  nombre: string;
}

/**
 * Cómo se registran los resultados:
 *  - automatica: respuestas objetivas (aciertos y errores con los elementos elegidos).
 *  - manual: el profesional valora (correcto, con ayuda, incorrecto, no realizado).
 *  - ninguna: actividad de repaso sin respuesta (vocabulario, escuchar y ver).
 */
export type Valoracion = 'automatica' | 'manual' | 'ninguna';

export interface Modality {
  id: string;
  nombre: string;
  objetivos: ObjectiveId[];
  valoracion: Valoracion;
}

/** Parámetros de una actividad concreta dentro de una sesión. */
export interface ActivityParams {
  categoria?: CategoryId;
  fonema?: string;
}

export interface Availability {
  disponible: boolean;
  /** Motivo si no está disponible, o advertencia si lo está con poco contenido. */
  motivo?: string;
}

export type ActivityId =
  | 'vocabulario'
  | 'denominacion'
  | 'busca'
  | 'memory'
  | 'frases'
  | 'categorizar'
  | 'intruso'
  | 'asociaciones'
  | 'funciones'
  | 'fonologia';

export interface ActivityDef {
  id: ActivityId;
  nombre: string;
  descripcion: string;
  icono: string;
  areas: AreaId[];
  modalidades: Modality[];
  niveles: Difficulty[];
  /** Parámetros que la actividad necesita o admite. */
  parametros: { categoria?: 'opcional' | 'obligatorio'; fonema?: 'obligatorio' };
  /** Duración orientativa de una ronda de trabajo, en minutos (para sugerir sesiones). */
  duracionMin: number;
  /** Requisitos de contenido, en lenguaje sencillo (documentación). */
  requisitos: string;
  estado: 'disponible' | 'proximamente';
}

/** Todos los objetivos de una actividad (unión de sus modalidades). */
export function activityObjectives(a: ActivityDef): ObjectiveId[] {
  return [...new Set(a.modalidades.flatMap((m) => m.objetivos))];
}
