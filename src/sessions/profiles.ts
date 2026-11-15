/**
 * Perfiles locales mediante alias. Funciones puras (sin almacenamiento).
 *
 * El alias debe ser un código no identificativo. Se bloquean patrones que
 * parecen datos personales evidentes (DNI/NIE, teléfono, correo, fechas) y
 * se avisa si parece un nombre propio. No es un filtro infalible: el aviso
 * en pantalla recuerda al profesional que use códigos.
 */
import type { Profile } from './types';

export const ALIAS_MAX = 30;

export type AliasCheck = { ok: true; warning?: string } | { ok: false; error: string };

const normalizeAlias = (a: string) => a.trim().replace(/\s+/g, ' ');
const sameAlias = (a: string, b: string) =>
  normalizeAlias(a).toLocaleLowerCase('es-ES') === normalizeAlias(b).toLocaleLowerCase('es-ES');

export function checkAlias(alias: string, existing: readonly Profile[], ignoreId?: string): AliasCheck {
  const a = normalizeAlias(alias);
  if (!a) return { ok: false, error: 'Escribe un alias, por ejemplo «Usuario 01».' };
  if (a.length > ALIAS_MAX) return { ok: false, error: `El alias no puede superar ${ALIAS_MAX} caracteres.` };
  if (/\b\d{8}\s?[A-Za-z]\b|\b[XYZxyz]\d{7}[A-Za-z]\b/.test(a)) return { ok: false, error: 'Parece un DNI o NIE. Usa un código no identificativo.' };
  if (/@/.test(a)) return { ok: false, error: 'Parece un correo electrónico. Usa un código no identificativo.' };
  if (/(\d[\s.-]?){9,}/.test(a)) return { ok: false, error: 'Parece un número de teléfono. Usa un código no identificativo.' };
  if (/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/.test(a)) return { ok: false, error: 'Parece una fecha. No incluyas fechas de nacimiento.' };
  if (existing.some((p) => p.id !== ignoreId && sameAlias(p.alias, a))) return { ok: false, error: 'Ya existe un perfil con ese alias.' };
  // Dos o más palabras que empiezan por mayúscula y sin números: posible nombre y apellido.
  if (/^\p{Lu}\p{Ll}+(\s+\p{Lu}\p{Ll}+)+$/u.test(a)) {
    return { ok: true, warning: 'Parece un nombre propio. Es preferible un código como «Usuario 01» o «Caso A».' };
  }
  return { ok: true };
}

/** Identificador aleatorio interno. No es criptográfico: solo evita colisiones locales. */
export function newId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createProfile(existing: readonly Profile[], alias: string, now = new Date()): { profiles: Profile[]; profile: Profile } | { error: string } {
  const check = checkAlias(alias, existing);
  if (!check.ok) return { error: check.error };
  const profile: Profile = { id: newId('p_'), alias: normalizeAlias(alias), createdAt: now.toISOString() };
  return { profiles: [...existing, profile], profile };
}

export function renameProfile(existing: readonly Profile[], id: string, alias: string): { profiles: Profile[] } | { error: string } {
  if (!existing.some((p) => p.id === id)) return { error: 'El perfil no existe.' };
  const check = checkAlias(alias, existing, id);
  if (!check.ok) return { error: check.error };
  return { profiles: existing.map((p) => (p.id === id ? { ...p, alias: normalizeAlias(alias) } : p)) };
}

export function touchProfile(existing: readonly Profile[], id: string | null, now = new Date()): Profile[] {
  if (!id) return [...existing];
  return existing.map((p) => (p.id === id ? { ...p, lastActivityAt: now.toISOString() } : p));
}

export function sortProfiles(profiles: readonly Profile[]): Profile[] {
  return [...profiles].sort((a, b) => a.alias.localeCompare(b.alias, 'es', { numeric: true }));
}
