import { DEFAULT_SETTINGS, type Difficulty, type Settings, type TextScale } from '@/types/settings';
import { readJson, STORAGE_KEYS, writeJson } from './keyValue';

const DIFFICULTIES: Difficulty[] = ['facil', 'media', 'dificil'];
const TEXT_SCALES: TextScale[] = [1, 1.2, 1.4];

/**
 * Combina lo guardado con los valores por defecto y descarta valores no válidos.
 * Así, si en una versión futura se añade una preferencia, los datos antiguos siguen sirviendo.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    audioEnabled: bool(s.audioEnabled, DEFAULT_SETTINGS.audioEnabled),
    showWords: bool(s.showWords, DEFAULT_SETTINGS.showWords),
    animationsEnabled: bool(s.animationsEnabled, DEFAULT_SETTINGS.animationsEnabled),
    seseo: bool(s.seseo, DEFAULT_SETTINGS.seseo),
    feedbackVoice: bool(s.feedbackVoice, DEFAULT_SETTINGS.feedbackVoice),
    difficulty: DIFFICULTIES.includes(s.difficulty as Difficulty)
      ? (s.difficulty as Difficulty)
      : DEFAULT_SETTINGS.difficulty,
    textScale: TEXT_SCALES.includes(s.textScale as TextScale)
      ? (s.textScale as TextScale)
      : DEFAULT_SETTINGS.textScale,
    speechRate:
      typeof s.speechRate === 'number' && s.speechRate >= 0.5 && s.speechRate <= 1.5
        ? s.speechRate
        : DEFAULT_SETTINGS.speechRate,
  };
}

export async function loadSettings(): Promise<Settings> {
  return sanitizeSettings(await readJson<unknown>(STORAGE_KEYS.settings, null));
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  return writeJson(STORAGE_KEYS.settings, settings);
}
