/**
 * Persistencia local de perfiles y sesiones (AsyncStorage).
 *
 * Esquema (versión 1):
 *   @enlogopedia/profiles/v1          Profile[]
 *   @enlogopedia/sessions/index/v1    SessionMeta[]   (listados rápidos)
 *   @enlogopedia/session/v1/<id>      Session          (una clave por sesión)
 *
 * Cada sesión va en su propia clave para que ningún valor crezca sin límite
 * (Android limita el tamaño de cada registro). El índice se puede reconstruir
 * a partir de las sesiones si se corrompe (rebuildIndex).
 *
 * Nada sale del dispositivo. Los datos NO están cifrados: dependen de la
 * protección del propio dispositivo (bloqueo de pantalla, cifrado del sistema).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readJson, writeJson } from '@/storage/keyValue';
import { toMeta } from './sessionLogic';
import type { Profile, Session, SessionMeta } from './types';

export const SESSION_KEYS = {
  profiles: '@enlogopedia/profiles/v1',
  index: '@enlogopedia/sessions/index/v1',
  sessionPrefix: '@enlogopedia/session/v1/',
} as const;

const sessionKey = (id: string) => `${SESSION_KEYS.sessionPrefix}${id}`;

function isProfile(p: unknown): p is Profile {
  const x = p as Profile;
  return !!x && typeof x.id === 'string' && typeof x.alias === 'string' && typeof x.createdAt === 'string';
}

export async function loadProfiles(): Promise<Profile[]> {
  const raw = await readJson<unknown>(SESSION_KEYS.profiles, []);
  return Array.isArray(raw) ? raw.filter(isProfile) : [];
}

export async function saveProfiles(profiles: Profile[]): Promise<boolean> {
  return writeJson(SESSION_KEYS.profiles, profiles);
}

export async function loadIndex(): Promise<SessionMeta[]> {
  const raw = await readJson<unknown>(SESSION_KEYS.index, []);
  return Array.isArray(raw) ? (raw as SessionMeta[]).filter((m) => m && typeof m.id === 'string') : [];
}

export async function loadSession(id: string): Promise<Session | null> {
  const s = await readJson<Session | null>(sessionKey(id), null);
  return s && s.version === 1 && s.id === id ? s : null;
}

/** Guarda la sesión y actualiza su entrada en el índice. */
export async function saveSession(s: Session): Promise<boolean> {
  const ok = await writeJson(sessionKey(s.id), s);
  if (!ok) return false;
  const index = await loadIndex();
  const meta = toMeta(s);
  const next = index.some((m) => m.id === s.id) ? index.map((m) => (m.id === s.id ? meta : m)) : [...index, meta];
  return writeJson(SESSION_KEYS.index, next);
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(sessionKey(id));
  } catch {
    // Si falla, la sesión queda huérfana pero fuera del índice: no se muestra.
  }
  const index = await loadIndex();
  await writeJson(
    SESSION_KEYS.index,
    index.filter((m) => m.id !== id),
  );
}

/** Elimina un perfil y TODAS sus sesiones. */
export async function deleteProfileCascade(profileId: string): Promise<void> {
  const index = await loadIndex();
  for (const m of index.filter((x) => x.profileId === profileId)) await deleteSession(m.id);
  const profiles = await loadProfiles();
  await saveProfiles(profiles.filter((p) => p.id !== profileId));
}

export async function loadSessions(ids: string[]): Promise<Session[]> {
  const out: Session[] = [];
  for (const id of ids) {
    const s = await loadSession(id);
    if (s) out.push(s);
  }
  return out;
}

/** Reconstruye el índice leyendo todas las claves de sesión (recuperación ante corrupción). */
export async function rebuildIndex(): Promise<SessionMeta[]> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(SESSION_KEYS.sessionPrefix));
  const sessions = await loadSessions(keys.map((k) => k.slice(SESSION_KEYS.sessionPrefix.length)));
  const index = sessions.map(toMeta);
  await writeJson(SESSION_KEYS.index, index);
  return index;
}

/**
 * Exporta todos los datos de perfiles y sesiones como texto JSON (copia de
 * seguridad local que el profesional puede guardar por su cuenta).
 */
export async function exportAll(): Promise<string> {
  const profiles = await loadProfiles();
  const index = await loadIndex();
  const sessions = await loadSessions(index.map((m) => m.id));
  return JSON.stringify({ formato: 'enlogopedia-copia', version: 1, exportadoEl: new Date().toISOString(), profiles, sessions }, null, 2);
}
