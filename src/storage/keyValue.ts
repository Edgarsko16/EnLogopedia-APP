import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Envoltorio mínimo sobre AsyncStorage que guarda y lee JSON.
 * Nunca lanza excepciones: si el almacenamiento falla, devuelve el valor por
 * defecto, para que la app siga siendo usable.
 */
export const STORAGE_KEYS = {
  settings: '@enlogopedia/settings/v1',
  progress: '@enlogopedia/progress/v1',
} as const;

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignorado a propósito: borrar algo inexistente no es un error para el usuario.
  }
}
