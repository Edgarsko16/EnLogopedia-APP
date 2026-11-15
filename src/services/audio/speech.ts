import * as Speech from 'expo-speech';

/**
 * Servicio de síntesis de voz.
 *
 * Usa el motor de texto a voz del propio dispositivo (gratuito y sin conexión
 * si el dispositivo tiene instalada la voz en español). Si el usuario tiene
 * otro idioma por defecto, pedimos "es-ES" explícitamente.
 *
 * Toda la app habla a través de este módulo; así, cambiar de motor en el
 * futuro (p. ej. audios grabados por una logopeda) solo afecta a este archivo.
 */
const LANGUAGE = 'es-ES';

export interface SpeakOptions {
  rate?: number;
  onDone?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  const clean = text.trim();
  if (!clean) return;
  // Detiene lo anterior para no encolar locuciones si se pulsa varias veces.
  Speech.stop();
  Speech.speak(clean, {
    language: LANGUAGE,
    rate: options.rate ?? 0.9,
    pitch: 1,
    onDone: options.onDone,
    onError: () => options.onDone?.(),
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
