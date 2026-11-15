export type Difficulty = 'facil' | 'media' | 'dificil';

/** Multiplicador del tamaño de texto propio de la app (se suma al del sistema). */
export type TextScale = 1 | 1.2 | 1.4;

export interface Settings {
  /** Síntesis de voz activada. */
  audioEnabled: boolean;
  /** Mostrar la palabra escrita por defecto en vocabulario. */
  showWords: boolean;
  difficulty: Difficulty;
  textScale: TextScale;
  /** Animaciones no esenciales (se desactivan también si el sistema pide reducir movimiento). */
  animationsEnabled: boolean;
  /** Velocidad de la voz: 1 es normal. */
  speechRate: number;
  /**
   * Pronunciación con seseo (Canarias, Andalucía, América): z/ce/ci suenan /s/.
   * Afecta a los ejercicios de fonología.
   */
  seseo: boolean;
  /** Locutar frases de refuerzo tras fallar («Prueba otra vez»). */
  feedbackVoice: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  audioEnabled: true,
  showWords: true,
  difficulty: 'facil',
  textScale: 1,
  animationsEnabled: true,
  speechRate: 0.9,
  seseo: false,
  feedbackVoice: true,
};
