/**
 * Textos legibles para los identificadores guardados en los registros
 * (palabras, frases, categorías, funciones…). Si el contenido ha cambiado y
 * el identificador ya no existe, se muestra tal cual: el registro no se pierde.
 */
import { getActivity } from '@/activities/catalog';
import { getCategory, getSentences, getWord } from '@/content/catalog';
import { FUNCTIONS } from '@/content/semantics';
import { SENTENCES } from '@/content/sentences';
import { WORDS } from '@/content/words';
import type { Difficulty } from '@/types/settings';
import type { ManualScore } from './types';

export function labelFor(id: string): string {
  const w = getWord(id) ?? WORDS.find((x) => x.id === id);
  if (w) return w.palabra;
  const c = getCategory(id);
  if (c) return c.nombre;
  const s = getSentences().find((x) => x.id === id) ?? SENTENCES.find((x) => x.id === id);
  if (s) return `«${s.texto}»`;
  const f = FUNCTIONS.find((x) => x.id === id);
  if (f) return `para ${f.para}`;
  if (id === 'si') return 'sí empieza';
  if (id === 'no') return 'no empieza';
  return `«${id}»`;
}

export function activityLabel(activityId: string, modalidad?: string): string {
  const a = getActivity(activityId);
  if (!a) return activityId;
  const m = a.modalidades.find((x) => x.id === modalidad);
  return m && a.modalidades.length > 1 ? `${a.nombre} · ${m.nombre}` : a.nombre;
}

export const MANUAL_LABELS: Record<ManualScore, string> = {
  correcto: 'Correcto',
  'con-ayuda': 'Correcto con ayuda',
  incorrecto: 'Incorrecto',
  'no-realizado': 'No realizado',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

/** Fecha y hora en formato DD/MM/AAAA HH:MM. */
export function formatDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return 'menos de 1 minuto';
  return min === 1 ? '1 minuto' : `${min} minutos`;
}
