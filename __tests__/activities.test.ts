import { ACTIVITIES, activitiesForArea, activityHref, AREAS, availabilityOf, isActivityUsable, OBJECTIVES, phonemesForActivities } from '@/activities/catalog';

describe('catálogo de actividades', () => {
  it('identificadores únicos, áreas y objetivos existentes', () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const areas = new Set(AREAS.map((a) => a.id));
    const objectives = new Set(OBJECTIVES.map((o) => o.id));
    for (const a of ACTIVITIES) {
      expect(a.areas.length).toBeGreaterThan(0);
      for (const ar of a.areas) expect(areas.has(ar)).toBe(true);
      for (const m of a.modalidades) for (const o of m.objetivos) expect(objectives.has(o)).toBe(true);
    }
  });

  it('una actividad puede estar en varias áreas sin duplicarse', () => {
    const busca = ACTIVITIES.filter((a) => a.id === 'busca');
    expect(busca).toHaveLength(1);
    expect(activitiesForArea('lenguaje').map((a) => a.id)).toContain('busca');
    expect(activitiesForArea('cognitivas').map((a) => a.id)).toContain('busca');
  });

  it('las áreas futuras no tienen actividades y sí líneas previstas', () => {
    for (const id of ['audicion', 'lectoescritura', 'comunicacion'] as const) {
      expect(activitiesForArea(id)).toHaveLength(0);
      expect(AREAS.find((a) => a.id === id)!.previstas.length).toBeGreaterThan(0);
    }
  });

  it('todas las actividades existentes son utilizables con el banco actual', () => {
    for (const a of ACTIVITIES) expect({ id: a.id, ok: isActivityUsable(a) }).toEqual({ id: a.id, ok: true });
  });

  it('la disponibilidad detecta la falta de contenido', () => {
    expect(availabilityOf('vocabulario').disponible).toBe(false); // sin categoría
    expect(availabilityOf('memory', undefined, { categoria: 'ropa' }).disponible).toBe(false); // 3 fotos
    expect(availabilityOf('fonologia', 'identificar', { fonema: 'u' }).disponible).toBe(false); // solo «huevo», dudosa
    expect(availabilityOf('fonologia', 'escuchar', { fonema: 'u' }).disponible).toBe(true);
    expect(phonemesForActivities(false)).not.toContain('u');
  });

  it('construye rutas con modalidad, parámetros y elemento de sesión', () => {
    expect(activityHref('fonologia', { modalidad: 'clasificar', params: { fonema: 'k' }, sesion: 'abc' })).toEqual({
      pathname: '/fonologia/[fonema]',
      params: { modo: 'clasificar', sesion: 'abc', fonema: 'k' },
    });
  });
});
