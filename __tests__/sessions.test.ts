import AsyncStorage from '@react-native-async-storage/async-storage';
import { availabilityOf, getActivity } from '@/activities/catalog';
import { checkAlias, createProfile, renameProfile } from '@/sessions/profiles';
import { profileStats, summarizeItem, summarizeSession } from '@/sessions/results';
import {
  activeDuration,
  addAttempt,
  createSession,
  currentItem,
  finishSession,
  moveTo,
  pauseSession,
  resumeSession,
  setManual,
  setObservations,
} from '@/sessions/sessionLogic';
import {
  deleteProfileCascade,
  deleteSession,
  loadIndex,
  loadProfiles,
  loadSession,
  rebuildIndex,
  saveProfiles,
  saveSession,
  SESSION_KEYS,
} from '@/sessions/storage';
import { suggestSession } from '@/sessions/suggest';
import type { PlanItem, Profile, Session } from '@/sessions/types';
import { seededRng } from '@/utils/random';

/** Crea un perfil y falla la prueba si hay error. */
function mk(list: Profile[], alias: string): { profiles: Profile[]; profile: Profile } {
  const r = createProfile(list, alias);
  if ('error' in r) throw new Error(r.error);
  return r;
}

const t = (min: number) => new Date(Date.UTC(2026, 10, 15, 10, min));
const plan: PlanItem[] = [
  { activityId: 'busca', modalidad: 'buscar', dificultad: 'facil', params: {} },
  { activityId: 'denominacion', modalidad: 'nombrar', dificultad: 'media', params: { categoria: 'animales' } },
  { activityId: 'memory', modalidad: 'parejas', dificultad: 'facil', params: {} },
];

describe('perfiles', () => {
  it('crea perfiles con alias no identificativos y evita duplicados', () => {
    const r1 = createProfile([], 'Usuario 01');
    if ('error' in r1) throw new Error(r1.error);
    expect(r1.profile.alias).toBe('Usuario 01');
    expect(r1.profile.id).not.toContain('Usuario');
    const r2 = createProfile(r1.profiles, '  usuario   01 ');
    expect('error' in r2 && r2.error).toMatch(/Ya existe/);
  });

  it('bloquea patrones de datos personales evidentes y avisa de posibles nombres', () => {
    expect(checkAlias('12345678Z', []).ok).toBe(false);
    expect(checkAlias('ana@correo.es', []).ok).toBe(false);
    expect(checkAlias('600 123 456', []).ok).toBe(false);
    expect(checkAlias('03/04/2019', []).ok).toBe(false);
    expect(checkAlias('', []).ok).toBe(false);
    const name = checkAlias('Lucía Pérez', []);
    expect(name.ok && name.warning).toBeTruthy();
    expect(checkAlias('Caso A', [])).toEqual({ ok: true });
  });

  it('cambia el alias respetando la unicidad', () => {
    const a = mk([], 'Caso A');
    const b = mk(a.profiles, 'Caso B');
    expect('error' in renameProfile(b.profiles, b.profile.id, 'caso a')).toBe(true);
    const ok = renameProfile(b.profiles, b.profile.id, 'Caso C');
    expect('profiles' in ok && ok.profiles.find((p) => p.id === b.profile.id)!.alias).toBe('Caso C');
  });
});

describe('sesión: registro de intentos', () => {
  it('registra intentos solo en la actividad actual y sin duplicar', () => {
    let s = createSession(plan, 'p1', 'libre', t(0));
    const [first, second] = s.items;
    s = addAttempt(s, first.uid, { ronda: '1', elemento: 'casa_cuchara', respuesta: 'casa_tenedor', correcta: false }, t(1));
    s = addAttempt(s, first.uid, { ronda: '1', elemento: 'casa_cuchara', respuesta: 'casa_tenedor', correcta: false }, t(1)); // repetido
    s = addAttempt(s, first.uid, { ronda: '1', elemento: 'casa_cuchara', respuesta: 'casa_cuchara', correcta: true }, t(2));
    s = addAttempt(s, second.uid, { ronda: '1', elemento: 'x', respuesta: 'y', correcta: true }, t(2)); // no es la actual
    expect(s.items[0].attempts).toHaveLength(2);
    expect(s.items[1].attempts).toHaveLength(0);
  });

  it('no registra con la sesión pausada', () => {
    let s = pauseSession(createSession(plan, null, 'libre', t(0)), t(5));
    s = addAttempt(s, s.items[0].uid, { ronda: '1', elemento: 'a', respuesta: 'a', correcta: true });
    expect(s.items[0].attempts).toHaveLength(0);
  });

  it('calcula aciertos a la primera, errores y elementos fallados con la respuesta elegida', () => {
    let s = createSession(plan, null, 'libre', t(0));
    const uid = s.items[0].uid;
    s = addAttempt(s, uid, { ronda: '1', elemento: 'casa_cuchara', respuesta: 'casa_tenedor', correcta: false }, t(1));
    s = addAttempt(s, uid, { ronda: '1', elemento: 'casa_cuchara', respuesta: 'casa_cuchara', correcta: true }, t(2));
    s = addAttempt(s, uid, { ronda: '2', elemento: 'animales_perro', respuesta: 'animales_perro', correcta: true }, t(3));
    const sum = summarizeItem(s.items[0]);
    expect(sum).toMatchObject({ rondas: 2, aciertosPrimera: 1, resueltasTrasError: 1, errores: 1, tasa: null });
    expect(sum.fallos).toEqual([{ elemento: 'casa_cuchara', respuestas: ['casa_tenedor'] }]);
  });

  it('solo da porcentaje con suficientes rondas', () => {
    let s = createSession(plan, null, 'libre', t(0));
    const uid = s.items[0].uid;
    for (let i = 0; i < 5; i++) s = addAttempt(s, uid, { ronda: String(i), elemento: `e${i}`, respuesta: i < 4 ? `e${i}` : 'x', correcta: i < 4 }, t(i));
    expect(summarizeItem(s.items[0]).tasa).toBe(80);
  });

  it('separa las valoraciones manuales y sustituye la valoración de una misma ronda', () => {
    let s = moveTo(createSession(plan, null, 'libre', t(0)), 1, t(1));
    const uid = s.items[1].uid;
    s = setManual(s, uid, { ronda: '0', elemento: 'animales_gato', valoracion: 'incorrecto' }, t(2));
    s = setManual(s, uid, { ronda: '0', elemento: 'animales_gato', valoracion: 'con-ayuda' }, t(3));
    s = setManual(s, uid, { ronda: '1', elemento: 'animales_perro', valoracion: 'correcto' }, t(4));
    const sum = summarizeSession(s);
    expect(sum.manual).toEqual({ correcto: 1, 'con-ayuda': 1, incorrecto: 0, 'no-realizado': 0 });
    expect(sum.auto.rondas).toBe(0);
  });
});

describe('sesión: navegación, pausa y finalización', () => {
  it('saltar una actividad sin respuestas no genera errores', () => {
    let s = createSession(plan, null, 'libre', t(0));
    s = moveTo(s, 1, t(1));
    expect(s.items[0].estado).toBe('saltada');
    expect(currentItem(s)!.activityId).toBe('denominacion');
    s = finishSession(s, t(2));
    const sum = summarizeSession(s);
    expect(sum.auto.errores).toBe(0);
    expect(sum.saltadas.map((i) => i.activityId)).toEqual(['busca', 'denominacion', 'memory']);
  });

  it('la duración activa no cuenta las pausas', () => {
    let s = createSession(plan, null, 'libre', t(0));
    s = pauseSession(s, t(10)); // 10 min activos
    s = resumeSession(s, t(30)); // 20 min de pausa
    s = finishSession(s, t(35)); // 5 min más
    expect(activeDuration(s)).toBe(15 * 60 * 1000);
    expect(s.status).toBe('finalizada');
  });

  it('las observaciones vacías se eliminan', () => {
    const s = createSession(plan, null, 'libre', t(0));
    expect(setObservations(s, { dificultades: ' ', apoyos: '', reforzar: '' }).observaciones).toBeUndefined();
    expect(setObservations(s, { dificultades: 'Confunde cubiertos', apoyos: '', reforzar: '' }).observaciones?.dificultades).toBe('Confunde cubiertos');
  });
});

describe('seguimiento por perfil', () => {
  it('detecta elementos con dificultad repetida y actividades a reforzar', () => {
    const sessions: Session[] = [];
    for (let k = 0; k < 2; k++) {
      let s = createSession([plan[0]], 'p1', 'libre', t(k * 60));
      const uid = s.items[0].uid;
      s = addAttempt(s, uid, { ronda: 'r', elemento: 'casa_cuchara', respuesta: 'casa_tenedor', correcta: false }, t(k * 60 + 1));
      s = addAttempt(s, uid, { ronda: 'r', elemento: 'casa_cuchara', respuesta: 'casa_cuchara', correcta: true }, t(k * 60 + 2));
      for (let i = 0; i < 4; i++) s = addAttempt(s, uid, { ronda: `x${i}`, elemento: `e${i}`, respuesta: 'z', correcta: false }, t(k * 60 + 3 + i));
      sessions.push(finishSession(s, t(k * 60 + 10)));
    }
    const st = profileStats(sessions);
    expect(st.sesiones).toBe(2);
    expect(st.areas).toEqual(expect.arrayContaining(['lenguaje', 'cognitivas']));
    expect(st.dificultades.find((d) => d.elemento === 'casa_cuchara')).toMatchObject({ exposiciones: 2, rondasConError: 2 });
    expect(st.reforzar[0]).toMatchObject({ activityId: 'busca', tasa: 0 });
  });

  it('no tiene en cuenta sesiones sin finalizar', () => {
    expect(profileStats([createSession(plan, 'p1', 'libre')]).sesiones).toBe(0);
  });
});

describe('sesión sugerida', () => {
  it('propone solo actividades disponibles del área y objetivo', () => {
    for (let seed = 0; seed < 10; seed++) {
      const r = suggestSession({ area: 'lenguaje', objetivo: 'relaciones-semanticas', dificultad: 'media', duracion: 20 }, false, seededRng(seed));
      expect(r.plan.length).toBeGreaterThan(0);
      for (const p of r.plan) {
        const a = getActivity(p.activityId)!;
        expect(a.areas).toContain('lenguaje');
        expect(a.modalidades.find((m) => m.id === p.modalidad)!.objetivos).toContain('relaciones-semanticas');
        expect(availabilityOf(p.activityId, p.modalidad, p.params).disponible).toBe(true);
      }
      expect(r.minutos).toBeGreaterThanOrEqual(20);
    }
  });

  it('avisa cuando hay pocas actividades para el objetivo', () => {
    const r = suggestSession({ area: 'habla', objetivo: 'fonema-inicial', dificultad: 'facil', duracion: 30 }, false, seededRng(1));
    expect(r.avisos.length).toBeGreaterThan(0);
    for (const p of r.plan) expect(p.params.fonema).toBeTruthy();
  });

  it('las áreas sin actividades no generan propuestas', () => {
    const r = suggestSession({ area: 'audicion', objetivo: 'todos', dificultad: 'facil', duracion: 15 });
    expect(r.plan).toHaveLength(0);
    expect(r.avisos[0]).toMatch(/No hay actividades/);
  });
});

describe('almacenamiento local', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persiste perfiles y sesiones, y reanuda una sesión interrumpida', async () => {
    const r = mk([], 'Perfil 03');
    await saveProfiles(r.profiles);
    let s = createSession(plan, r.profile.id, 'libre', t(0));
    s = addAttempt(s, s.items[0].uid, { ronda: '1', elemento: 'a', respuesta: 'a', correcta: true }, t(1));
    s = pauseSession(s, t(2));
    await saveSession(s);

    expect((await loadProfiles())[0].alias).toBe('Perfil 03');
    const index = await loadIndex();
    expect(index).toHaveLength(1);
    expect(index[0]).toMatchObject({ id: s.id, profileId: r.profile.id, status: 'pausada' });
    const loaded = (await loadSession(s.id))!;
    expect(loaded.items[0].attempts).toHaveLength(1);
    const resumed = resumeSession(loaded, t(10));
    expect(resumed.status).toBe('en-curso');
    expect(currentItem(resumed)!.uid).toBe(s.items[0].uid);
  });

  it('eliminar un perfil borra sus sesiones y conserva las demás', async () => {
    const a = mk([], 'Caso A');
    const b = mk(a.profiles, 'Caso B');
    await saveProfiles(b.profiles);
    const sa = createSession(plan, a.profile.id, 'libre');
    const sb = createSession(plan, b.profile.id, 'libre');
    const anon = createSession(plan, null, 'libre');
    for (const s of [sa, sb, anon]) await saveSession(s);
    await deleteProfileCascade(a.profile.id);
    expect((await loadProfiles()).map((p) => p.id)).toEqual([b.profile.id]);
    expect((await loadIndex()).map((m) => m.id).sort()).toEqual([sb.id, anon.id].sort());
    expect(await loadSession(sa.id)).toBeNull();
  });

  it('elimina una sesión y reconstruye el índice si se pierde', async () => {
    const s1 = createSession(plan, null, 'libre');
    const s2 = createSession(plan, null, 'libre');
    await saveSession(s1);
    await saveSession(s2);
    await deleteSession(s1.id);
    expect((await loadIndex()).map((m) => m.id)).toEqual([s2.id]);
    await AsyncStorage.removeItem(SESSION_KEYS.index);
    expect((await rebuildIndex()).map((m) => m.id)).toEqual([s2.id]);
  });
});
