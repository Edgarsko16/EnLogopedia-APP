import type { Href } from 'expo-router';
import { activityHref } from '@/activities/catalog';
import { currentItem } from './sessionLogic';
import type { Session } from './types';

/** Ruta de la actividad actual de una sesión (o del resumen si ya no quedan). */
export function currentHref(s: Session): Href {
  const it = currentItem(s);
  if (!it) return { pathname: '/sesion/resumen', params: { id: s.id } } as Href;
  return activityHref(it.activityId, { modalidad: it.modalidad, params: it.params, sesion: it.uid });
}
