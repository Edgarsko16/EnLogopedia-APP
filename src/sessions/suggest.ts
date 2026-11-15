/**
 * Generador de sesiones sugeridas basado en reglas (sin IA ni servicios externos).
 *
 * 1. Toma las actividades del área elegida con alguna modalidad que trabaje
 *    el objetivo (o todas las del área si el objetivo es «todos»).
 * 2. Descarta las configuraciones sin contenido suficiente (availabilityOf).
 * 3. Va añadiendo actividades distintas, alternando, hasta cubrir la duración
 *    orientativa. Solo repite actividad si no hay más opciones, y lo avisa.
 *
 * Es una propuesta editable para el profesional, no un programa terapéutico.
 */
import { activitiesForArea, availabilityOf, getCategoryForSuggestion, phonemesForActivities } from '@/activities/catalog';
import type { ActivityDef, ActivityParams } from '@/activities/types';
import { shuffle, type Rng } from '@/utils/random';
import type { PlanItem, SuggestionRequest } from './types';

export interface Suggestion {
  plan: PlanItem[];
  /** Minutos orientativos que suman las actividades propuestas. */
  minutos: number;
  avisos: string[];
}

interface Candidate {
  activity: ActivityDef;
  modalidad: string;
  params: ActivityParams;
}

export function candidatesFor(req: SuggestionRequest, seseo = false, rng?: Rng): Candidate[] {
  const out: Candidate[] = [];
  for (const activity of activitiesForArea(req.area)) {
    if (activity.estado !== 'disponible') continue;
    for (const m of activity.modalidades) {
      if (req.objetivo !== 'todos' && !m.objetivos.includes(req.objetivo)) continue;
      // Las actividades de solo repaso (sin respuesta) no se proponen como trabajo principal.
      if (m.valoracion === 'ninguna') continue;
      const params: ActivityParams = {};
      if (activity.parametros.fonema) {
        const phonemes = shuffle(phonemesForActivities(seseo), rng);
        const ok = phonemes.find((f) => availabilityOf(activity.id, m.id, { fonema: f }, seseo).disponible);
        if (!ok) continue;
        params.fonema = ok;
      }
      if (activity.parametros.categoria === 'obligatorio') params.categoria = getCategoryForSuggestion(rng);
      if (!availabilityOf(activity.id, m.id, params, seseo).disponible) continue;
      out.push({ activity, modalidad: m.id, params });
    }
  }
  return out;
}

export function suggestSession(req: SuggestionRequest, seseo = false, rng?: Rng): Suggestion {
  const avisos: string[] = [];
  const candidates = shuffle(candidatesFor(req, seseo, rng), rng);
  if (candidates.length === 0) {
    return { plan: [], minutos: 0, avisos: ['No hay actividades disponibles para este objetivo con el contenido actual.'] };
  }
  // Primero una de cada actividad distinta; después, el resto de modalidades.
  const firstOfEach: Candidate[] = [];
  const rest: Candidate[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.activity.id)) rest.push(c);
    else {
      seen.add(c.activity.id);
      firstOfEach.push(c);
    }
  }
  const ordered = [...firstOfEach, ...rest];

  const plan: PlanItem[] = [];
  let minutos = 0;
  let i = 0;
  let repeated = false;
  while (minutos < req.duracion && plan.length < 8) {
    const c = ordered[i % ordered.length];
    if (i >= ordered.length) repeated = true;
    plan.push({ activityId: c.activity.id, modalidad: c.modalidad, dificultad: req.dificultad, params: { ...c.params } });
    minutos += c.activity.duracionMin;
    i++;
  }
  const distinct = new Set(plan.map((p) => p.activityId)).size;
  if (distinct < 3) {
    avisos.push(
      `Solo hay ${distinct === 1 ? 'una actividad disponible' : `${distinct} actividades disponibles`} para este objetivo; amplía con otras áreas u objetivos si lo necesitas.`,
    );
  }
  if (repeated) avisos.push('Algunas actividades se repiten para cubrir la duración elegida.');
  return { plan, minutos, avisos };
}
