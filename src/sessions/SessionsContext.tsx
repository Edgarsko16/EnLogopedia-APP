import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createProfile as createProfilePure, renameProfile as renameProfilePure, sortProfiles, touchProfile } from './profiles';
import {
  addAttempt,
  createSession,
  finishSession,
  moveTo,
  pauseSession,
  resumeSession,
  setManual,
  setObservations,
} from './sessionLogic';
import * as store from './storage';
import type { ManualScore, Observations, PlanItem, Profile, Session, SessionMeta, SuggestionRequest } from './types';

interface SessionsContextValue {
  ready: boolean;
  profiles: Profile[];
  index: SessionMeta[];
  /** Sesión sin finalizar (en curso o pausada), si existe. Solo puede haber una. */
  active: Session | null;
  createProfile: (alias: string) => { ok: true; profile: Profile } | { ok: false; error: string };
  renameProfile: (id: string, alias: string) => string | null;
  deleteProfile: (id: string) => Promise<void>;
  startSession: (plan: PlanItem[], profileId: string | null, origen: Session['origen'], sugerencia?: SuggestionRequest) => Session;
  record: (uid: string, rec: { ronda: string; elemento: string; respuesta: string; correcta: boolean }) => void;
  recordManual: (uid: string, rec: { ronda: string; elemento: string; valoracion: ManualScore }) => void;
  goTo: (index: number) => Session | null;
  pause: () => void;
  resume: () => Session | null;
  finish: () => Session | null;
  saveObservations: (sessionId: string, obs: Observations | null) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<void>;
  getSession: (id: string) => Promise<Session | null>;
}

const SessionsContext = createContext<SessionsContextValue | null>(null);

/**
 * Estado global de perfiles y sesiones. Persiste cada cambio en el
 * dispositivo (src/sessions/storage.ts). Las escrituras van en cola para que
 * dos guardados seguidos no se pisen al actualizar el índice.
 */
export function SessionsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState<SessionMeta[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const activeRef = useRef<Session | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const enqueue = useCallback((job: () => Promise<unknown>) => {
    queue.current = queue.current.then(job).catch(() => undefined);
    return queue.current;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, idx] = await Promise.all([store.loadProfiles(), store.loadIndex()]);
      const unfinished = [...idx].filter((m) => m.status !== 'finalizada').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const s = unfinished ? await store.loadSession(unfinished.id) : null;
      if (!alive) return;
      setProfiles(p);
      setIndex(idx);
      // Una sesión que estaba «en curso» al cerrar la app se recupera como pausada.
      const recovered = s && s.status === 'en-curso' ? pauseSession(s) : s;
      activeRef.current = recovered;
      setActive(recovered);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Aplica un cambio a la sesión activa y lo guarda. */
  const updateActive = useCallback(
    (fn: (s: Session) => Session): Session | null => {
      const cur = activeRef.current;
      if (!cur) return null;
      const next = fn(cur);
      if (next === cur) return cur;
      const keep = next.status === 'finalizada' ? null : next;
      activeRef.current = keep;
      setActive(keep);
      void enqueue(async () => {
        await store.saveSession(next);
        setIndex(await store.loadIndex());
      });
      return next;
    },
    [enqueue],
  );

  const persistProfiles = useCallback(
    (list: Profile[]) => {
      setProfiles(list);
      void enqueue(() => store.saveProfiles(list));
    },
    [enqueue],
  );

  const value = useMemo<SessionsContextValue>(
    () => ({
      ready,
      profiles: sortProfiles(profiles),
      index,
      active,
      createProfile: (alias) => {
        const r = createProfilePure(profiles, alias);
        if ('error' in r) return { ok: false, error: r.error };
        persistProfiles(r.profiles);
        return { ok: true, profile: r.profile };
      },
      renameProfile: (id, alias) => {
        const r = renameProfilePure(profiles, id, alias);
        if ('error' in r) return r.error;
        persistProfiles(r.profiles);
        return null;
      },
      deleteProfile: async (id) => {
        if (activeRef.current?.profileId === id) {
          activeRef.current = null;
          setActive(null);
        }
        setProfiles((p) => p.filter((x) => x.id !== id));
        await enqueue(async () => {
          await store.deleteProfileCascade(id);
          setIndex(await store.loadIndex());
        });
      },
      startSession: (plan, profileId, origen, sugerencia) => {
        const s = createSession(plan, profileId, origen, new Date(), sugerencia);
        activeRef.current = s;
        setActive(s);
        void enqueue(async () => {
          await store.saveSession(s);
          setIndex(await store.loadIndex());
        });
        return s;
      },
      record: (uid, rec) => {
        updateActive((s) => addAttempt(s, uid, rec));
      },
      recordManual: (uid, rec) => {
        updateActive((s) => setManual(s, uid, rec));
      },
      goTo: (i) => updateActive((s) => moveTo(s, i)),
      pause: () => {
        updateActive((s) => pauseSession(s));
      },
      resume: () => updateActive((s) => resumeSession(s)),
      finish: () => {
        const done = updateActive((s) => finishSession(s));
        if (done) persistProfiles(touchProfile(profiles, done.profileId));
        return done;
      },
      saveObservations: async (sessionId, obs) => {
        const s = activeRef.current?.id === sessionId ? activeRef.current : await store.loadSession(sessionId);
        if (!s) return null;
        const next = setObservations(s, obs);
        if (activeRef.current?.id === sessionId) {
          activeRef.current = next;
          setActive(next);
        }
        await enqueue(() => store.saveSession(next));
        return next;
      },
      deleteSession: async (id) => {
        if (activeRef.current?.id === id) {
          activeRef.current = null;
          setActive(null);
        }
        await enqueue(async () => {
          await store.deleteSession(id);
          setIndex(await store.loadIndex());
        });
      },
      getSession: async (id) => {
        if (activeRef.current?.id === id) return activeRef.current;
        await queue.current;
        return store.loadSession(id);
      },
    }),
    [ready, profiles, index, active, enqueue, updateActive, persistProfiles],
  );

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

export function useSessions(): SessionsContextValue {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error('useSessions debe usarse dentro de <SessionsProvider>');
  return ctx;
}
