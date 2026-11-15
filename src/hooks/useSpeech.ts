import { useCallback, useEffect } from 'react';
import { speak as speakService, stopSpeaking } from '@/services/audio/speech';
import { useSettings } from './SettingsContext';

/**
 * Hook de voz que respeta las preferencias: si el audio está desactivado,
 * `speak` no hace nada. Al salir de la pantalla se corta cualquier locución.
 */
export function useSpeech() {
  const { settings } = useSettings();
  const enabled = settings.audioEnabled;

  useEffect(() => stopSpeaking, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled) return;
      speakService(text, { rate: settings.speechRate });
    },
    [enabled, settings.speechRate],
  );

  /** Frases de refuerzo («Prueba otra vez»): se pueden silenciar en Ajustes sin quitar la voz. */
  const speakFeedback = useCallback(
    (text: string) => {
      if (settings.feedbackVoice) speak(text);
    },
    [settings.feedbackVoice, speak],
  );

  return { speak, speakFeedback, stop: stopSpeaking, enabled };
}
