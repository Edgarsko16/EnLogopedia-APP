import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useSettings } from '@/hooks/SettingsContext';
import type { Difficulty } from '@/types/settings';
import { currentItem } from './sessionLogic';
import { useSessions } from './SessionsContext';
import type { ManualScore, SessionItem } from './types';

export interface ActivityRun {
  /** true si la pantalla se ha abierto como actividad actual de una sesión en curso. */
  inSession: boolean;
  item?: SessionItem;
  /** Dificultad configurada en la sesión o, fuera de sesión, la de Ajustes. */
  difficulty: Difficulty;
  /** Modalidad inicial: la de la sesión o el parámetro ?modo= de la ruta. */
  modalidad?: string;
  /** Registra una respuesta objetiva (no hace nada fuera de sesión). */
  record: (ronda: string, elemento: string, respuesta: string, correcta: boolean) => void;
  /** Registra una valoración manual (no hace nada fuera de sesión). */
  recordManual: (ronda: string, elemento: string, valoracion: ManualScore) => void;
}

/**
 * Conecta una pantalla de actividad con la sesión activa.
 * Las pantallas siguen funcionando igual fuera de una sesión.
 */
export function useActivityRun(): ActivityRun {
  const { sesion, modo } = useLocalSearchParams<{ sesion?: string; modo?: string }>();
  const { active, record: rec, recordManual: recM } = useSessions();
  const { settings } = useSettings();
  const item = active ? currentItem(active) : undefined;
  const inSession = !!active && active.status === 'en-curso' && !!sesion && item?.uid === sesion;
  const uid = inSession ? item!.uid : undefined;

  const record = useCallback(
    (ronda: string, elemento: string, respuesta: string, correcta: boolean) => {
      if (uid) rec(uid, { ronda, elemento, respuesta, correcta });
    },
    [uid, rec],
  );
  const recordManual = useCallback(
    (ronda: string, elemento: string, valoracion: ManualScore) => {
      if (uid) recM(uid, { ronda, elemento, valoracion });
    },
    [uid, recM],
  );

  return {
    inSession,
    item: inSession ? item : undefined,
    difficulty: inSession ? item!.dificultad : settings.difficulty,
    modalidad: inSession ? item!.modalidad : typeof modo === 'string' ? modo : undefined,
    record,
    recordManual,
  };
}
