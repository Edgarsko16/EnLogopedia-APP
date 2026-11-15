/**
 * Catálogo de áreas, objetivos y actividades.
 *
 * Es la única fuente para los menús por áreas, la preparación de sesiones y
 * el generador de sesiones sugeridas. Las actividades son las pantallas que
 * ya existen (src/app/juegos, semantica, fonologia, vocabulario): aquí solo
 * se describen y se enlazan, no se duplican.
 *
 * Para añadir una actividad: implementar su pantalla, añadir su entrada en
 * ACTIVITIES, su ruta en activityHref() y su comprobación en availabilityOf().
 */
import type { Href } from 'expo-router';
import {
  areConfusable,
  getAllWords,
  getAssociations,
  getCategories,
  getFunctions,
  getPhonologyOptions,
  getSentences,
  getWordsFor,
} from '@/content/catalog';
import { availablePhonemes } from '@/games/fonologia/fonologiaLogic';
import { MEMORY_LEVELS } from '@/games/memory/memoryLogic';
import { buildOddOneOutRound } from '@/games/semantica/semanticaLogic';
import type { CategoryId } from '@/types/content';
import type { ActivityDef, ActivityId, ActivityParams, Area, AreaId, Availability, Objective, ObjectiveId } from './types';

export const AREAS: Area[] = [
  {
    id: 'lenguaje',
    nombre: 'Lenguaje',
    descripcion: 'Vocabulario, semántica y frases.',
    icono: 'chatbubbles',
    previstas: [],
  },
  {
    id: 'habla',
    nombre: 'Habla y fonología',
    descripcion: 'Trabajo por fonemas.',
    icono: 'mic',
    previstas: ['Fonema medial y final', 'Sílabas', 'Pares mínimos', 'Articulación'],
  },
  {
    id: 'audicion',
    nombre: 'Audición',
    descripcion: 'Escucha y procesamiento auditivo.',
    icono: 'ear',
    previstas: ['Detección', 'Discriminación', 'Identificación', 'Memoria auditiva', 'Comprensión auditiva'],
  },
  {
    id: 'lectoescritura',
    nombre: 'Lectoescritura',
    descripcion: 'Lectura y escritura.',
    icono: 'book',
    previstas: ['Conciencia fonológica', 'Asociación fonema-grafema', 'Lectura', 'Comprensión lectora', 'Escritura'],
  },
  {
    id: 'cognitivas',
    nombre: 'Funciones cognitivas',
    descripcion: 'Memoria, atención y categorización.',
    icono: 'bulb',
    previstas: [],
  },
  {
    id: 'comunicacion',
    nombre: 'Comunicación',
    descripcion: 'Comunicación funcional y pragmática.',
    icono: 'people',
    previstas: ['Comunicación funcional', 'Pragmática', 'Apoyos comunicativos'],
  },
];

export const OBJECTIVES: Objective[] = [
  { id: 'vocabulario-receptivo', nombre: 'Comprensión de vocabulario' },
  { id: 'vocabulario-expresivo', nombre: 'Denominación y acceso al léxico' },
  { id: 'categorizacion', nombre: 'Categorización semántica' },
  { id: 'relaciones-semanticas', nombre: 'Relaciones semánticas (asociaciones y funciones)' },
  { id: 'comprension-frases', nombre: 'Comprensión de frases' },
  { id: 'construccion-frases', nombre: 'Construcción de frases' },
  { id: 'fonema-inicial', nombre: 'Conciencia del fonema inicial' },
  { id: 'memoria-visual', nombre: 'Memoria visual' },
  { id: 'atencion', nombre: 'Atención y discriminación visual' },
];

const ALL_LEVELS: ActivityDef['niveles'] = ['facil', 'media', 'dificil'];

export const ACTIVITIES: ActivityDef[] = [
  {
    id: 'vocabulario',
    nombre: 'Vocabulario',
    descripcion: 'Ver cada foto, escuchar la palabra y sus frases modelo.',
    icono: 'images',
    areas: ['lenguaje'],
    modalidades: [{ id: 'ver', nombre: 'Ver y escuchar', objetivos: ['vocabulario-receptivo', 'vocabulario-expresivo'], valoracion: 'ninguna' }],
    niveles: ALL_LEVELS,
    parametros: { categoria: 'obligatorio' },
    duracionMin: 5,
    requisitos: 'Al menos una palabra con foto en la categoría.',
    estado: 'disponible',
  },
  {
    id: 'denominacion',
    nombre: 'Denominación',
    descripcion: 'Nombrar la foto en voz alta; el profesional valora la respuesta.',
    icono: 'chatbubble-ellipses',
    areas: ['lenguaje'],
    modalidades: [{ id: 'nombrar', nombre: 'Nombrar', objetivos: ['vocabulario-expresivo'], valoracion: 'manual' }],
    niveles: ALL_LEVELS,
    parametros: { categoria: 'opcional' },
    duracionMin: 7,
    requisitos: 'Al menos una palabra con foto.',
    estado: 'disponible',
  },
  {
    id: 'busca',
    nombre: 'Busca la imagen',
    descripcion: 'Escuchar la palabra y tocar la foto correcta.',
    icono: 'search',
    areas: ['lenguaje', 'cognitivas'],
    modalidades: [{ id: 'buscar', nombre: 'Buscar', objetivos: ['vocabulario-receptivo', 'atencion'], valoracion: 'automatica' }],
    niveles: ALL_LEVELS,
    parametros: { categoria: 'opcional' },
    duracionMin: 5,
    requisitos: 'Al menos dos palabras con foto no confundibles entre sí.',
    estado: 'disponible',
  },
  {
    id: 'memory',
    nombre: 'Memory',
    descripcion: 'Encontrar parejas de fotos iguales.',
    icono: 'grid',
    areas: ['cognitivas'],
    modalidades: [{ id: 'parejas', nombre: 'Parejas', objetivos: ['memoria-visual', 'atencion'], valoracion: 'automatica' }],
    niveles: ALL_LEVELS,
    parametros: { categoria: 'opcional' },
    duracionMin: 5,
    requisitos: 'Al menos 4 palabras con foto (4 parejas).',
    estado: 'disponible',
  },
  {
    id: 'frases',
    nombre: 'Frases',
    descripcion: 'Elegir, completar o construir la frase que describe la foto.',
    icono: 'reorder-four',
    areas: ['lenguaje'],
    modalidades: [
      { id: 'elegir', nombre: '¿Qué frase es?', objetivos: ['comprension-frases'], valoracion: 'automatica' },
      { id: 'completar', nombre: 'Completa la frase', objetivos: ['comprension-frases', 'construccion-frases'], valoracion: 'automatica' },
      { id: 'construir', nombre: 'Construye la frase', objetivos: ['construccion-frases'], valoracion: 'automatica' },
    ],
    niveles: ALL_LEVELS,
    parametros: {},
    duracionMin: 6,
    requisitos: 'Al menos dos frases ligadas a fotos verificadas.',
    estado: 'disponible',
  },
  {
    id: 'categorizar',
    nombre: 'Categorizar',
    descripcion: 'Decidir a qué grupo pertenece cada foto.',
    icono: 'file-tray-stacked',
    areas: ['lenguaje', 'cognitivas'],
    modalidades: [{ id: 'grupos', nombre: 'Por grupos', objetivos: ['categorizacion'], valoracion: 'automatica' }],
    niveles: ALL_LEVELS,
    parametros: {},
    duracionMin: 5,
    requisitos: 'Al menos dos categorías con 4 fotos cada una.',
    estado: 'disponible',
  },
  {
    id: 'intruso',
    nombre: '¿Cuál no pertenece?',
    descripcion: 'Encontrar la foto que no es del mismo grupo.',
    icono: 'remove-circle',
    areas: ['lenguaje', 'cognitivas'],
    modalidades: [{ id: 'intruso', nombre: 'Intruso', objetivos: ['categorizacion', 'atencion'], valoracion: 'automatica' }],
    niveles: ALL_LEVELS,
    parametros: {},
    duracionMin: 5,
    requisitos: 'Una categoría con 3 o 4 fotos no confundibles y otra categoría distinta.',
    estado: 'disponible',
  },
  {
    id: 'asociaciones',
    nombre: 'Asociaciones',
    descripcion: '¿Qué va con…? Unir cada foto con la que se relaciona.',
    icono: 'git-compare',
    areas: ['lenguaje'],
    modalidades: [{ id: 'asociar', nombre: 'Asociar', objetivos: ['relaciones-semanticas'], valoracion: 'automatica' }],
    niveles: ALL_LEVELS,
    parametros: {},
    duracionMin: 4,
    requisitos: 'Asociaciones cuyas dos palabras tienen foto y no aparecen una en la foto de la otra.',
    estado: 'disponible',
  },
  {
    id: 'funciones',
    nombre: 'Funciones',
    descripcion: '¿Para qué sirve? ¿Qué usamos para…?',
    icono: 'construct',
    areas: ['lenguaje'],
    modalidades: [
      { id: 'usamos', nombre: '¿Qué usamos para…?', objetivos: ['relaciones-semanticas'], valoracion: 'automatica' },
      { id: 'sirve', nombre: '¿Para qué sirve?', objetivos: ['relaciones-semanticas'], valoracion: 'automatica' },
    ],
    niveles: ALL_LEVELS,
    parametros: {},
    duracionMin: 5,
    requisitos: 'Funciones con al menos una palabra con foto.',
    estado: 'disponible',
  },
  {
    id: 'fonologia',
    nombre: 'Fonema inicial',
    descripcion: 'Repasar, identificar y clasificar palabras por su primer sonido.',
    icono: 'mic',
    areas: ['habla'],
    modalidades: [
      { id: 'escuchar', nombre: 'Escuchar y ver', objetivos: ['fonema-inicial'], valoracion: 'ninguna' },
      { id: 'identificar', nombre: 'Identificar', objetivos: ['fonema-inicial'], valoracion: 'automatica' },
      { id: 'clasificar', nombre: 'Clasificar', objetivos: ['fonema-inicial'], valoracion: 'automatica' },
    ],
    niveles: ALL_LEVELS,
    parametros: { fonema: 'obligatorio' },
    duracionMin: 5,
    requisitos: 'Un fonema con palabras utilizables (sustantivos sin dudas fonológicas).',
    estado: 'disponible',
  },
];

export function getActivity(id: string): ActivityDef | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

export function getArea(id: string): Area | undefined {
  return AREAS.find((a) => a.id === id);
}

export function getObjective(id: string): Objective | undefined {
  return OBJECTIVES.find((o) => o.id === id);
}

export function activitiesForArea(area: AreaId): ActivityDef[] {
  return ACTIVITIES.filter((a) => a.areas.includes(area));
}

/** Fonemas con palabras utilizables en identificar/clasificar (para elegir parámetro). */
export function phonemesForActivities(seseo: boolean): string[] {
  return availablePhonemes(getAllWords(), getPhonologyOptions(seseo))
    .filter((a) => a.usable > 0)
    .map((a) => a.phoneme.id);
}

/**
 * ¿Hay contenido suficiente para esta actividad, modalidad y parámetros?
 * Se calcula con el banco real, así nunca se propone una actividad vacía.
 */
export function availabilityOf(
  id: ActivityId,
  modalidad?: string,
  params: ActivityParams = {},
  seseo = false,
): Availability {
  const words = getWordsFor(params.categoria);
  switch (id) {
    case 'vocabulario':
      if (!params.categoria) return { disponible: false, motivo: 'Elige una categoría.' };
      return words.length > 0 ? { disponible: true } : { disponible: false, motivo: 'La categoría no tiene fotos.' };
    case 'denominacion':
      return words.length > 0 ? { disponible: true } : { disponible: false, motivo: 'No hay fotos.' };
    case 'busca':
      return words.length >= 2 ? { disponible: true } : { disponible: false, motivo: 'Hacen falta al menos 2 fotos.' };
    case 'memory':
      return words.length >= MEMORY_LEVELS[0]
        ? { disponible: true }
        : { disponible: false, motivo: `Hacen falta al menos ${MEMORY_LEVELS[0]} fotos.` };
    case 'frases': {
      const sentences = getSentences();
      if (modalidad === 'completar') {
        const n = sentences.filter((s) => s.hueco).length;
        return n >= 2 ? { disponible: true } : { disponible: false, motivo: 'No hay frases con hueco.' };
      }
      return sentences.length >= 2 ? { disponible: true } : { disponible: false, motivo: 'Hacen falta al menos 2 frases.' };
    }
    case 'categorizar': {
      const big = getCategories().filter((c) => getWordsFor(c.id).length >= 4);
      return big.length >= 2 ? { disponible: true } : { disponible: false, motivo: 'Hacen falta dos categorías con 4 fotos.' };
    }
    case 'intruso':
      return buildOddOneOutRound(getAllWords(), areConfusable, 3)
        ? { disponible: true }
        : { disponible: false, motivo: 'No hay grupos suficientes.' };
    case 'asociaciones': {
      const n = getAssociations().length;
      if (n === 0) return { disponible: false, motivo: 'No hay asociaciones con foto.' };
      return n < 6 ? { disponible: true, motivo: `Solo hay ${n} asociaciones; se repetirán pronto.` } : { disponible: true };
    }
    case 'funciones':
      return getFunctions().length >= 2 ? { disponible: true } : { disponible: false, motivo: 'No hay funciones suficientes.' };
    case 'fonologia': {
      if (!params.fonema) return { disponible: false, motivo: 'Elige un fonema.' };
      const all = availablePhonemes(getAllWords(), getPhonologyOptions(seseo)).find((a) => a.phoneme.id === params.fonema);
      if (!all) return { disponible: false, motivo: 'No hay palabras con ese fonema.' };
      if (modalidad !== 'escuchar' && all.usable === 0)
        return { disponible: false, motivo: 'Ese fonema solo tiene palabras dudosas o acciones; usa «Escuchar y ver».' };
      if (modalidad !== 'escuchar' && all.usable < 3) return { disponible: true, motivo: `Solo ${all.usable} palabras utilizables con ese fonema.` };
      return { disponible: true };
    }
    default:
      return { disponible: false, motivo: 'Actividad desconocida.' };
  }
}

/** ¿Tiene la actividad alguna configuración disponible? (para mostrarla en menús). */
export function isActivityUsable(a: ActivityDef, seseo = false): boolean {
  if (a.estado !== 'disponible') return false;
  if (a.id === 'vocabulario') return getCategories().length > 0;
  if (a.id === 'fonologia') return phonemesForActivities(seseo).length > 0;
  return a.modalidades.some((m) => availabilityOf(a.id, m.id, {}, seseo).disponible);
}

/**
 * Ruta de la pantalla de la actividad. `sesion` es el identificador del
 * elemento de sesión (uid): la pantalla lo usa para mostrar la barra de
 * sesión y registrar resultados.
 */
export function activityHref(
  id: ActivityId,
  opts: { modalidad?: string; params?: ActivityParams; sesion?: string } = {},
): Href {
  const q: Record<string, string> = {};
  if (opts.modalidad) q.modo = opts.modalidad;
  if (opts.params?.categoria) q.categoria = opts.params.categoria;
  if (opts.sesion) q.sesion = opts.sesion;
  const route = (pathname: string, extra: Record<string, string> = {}) =>
    ({ pathname, params: { ...q, ...extra } }) as Href;
  switch (id) {
    case 'vocabulario':
      return route('/vocabulario/[categoria]', { categoria: opts.params?.categoria ?? 'animales' });
    case 'denominacion':
      return route('/juegos/denominacion');
    case 'busca':
      return route('/juegos/busca');
    case 'memory':
      return route('/juegos/memory');
    case 'frases':
      return route('/juegos/frases');
    case 'categorizar':
      return route('/semantica/categorizar');
    case 'intruso':
      return route('/semantica/intruso');
    case 'asociaciones':
      return route('/semantica/asociaciones');
    case 'funciones':
      return route('/semantica/funciones');
    case 'fonologia':
      return route('/fonologia/[fonema]', { fonema: opts.params?.fonema ?? 'k' });
  }
}

/** Objetivos que tienen al menos una actividad del área. */
export function objectivesForArea(area: AreaId): Objective[] {
  const ids = new Set<ObjectiveId>(activitiesForArea(area).flatMap((a) => a.modalidades.flatMap((m) => m.objetivos)));
  return OBJECTIVES.filter((o) => ids.has(o.id));
}

/** Categoría al azar con fotos, para actividades que la necesitan en una sesión sugerida. */
export function getCategoryForSuggestion(rng: () => number = Math.random): CategoryId {
  const cats = getCategories().filter((c) => getWordsFor(c.id).length >= 4);
  const list = cats.length > 0 ? cats : getCategories();
  return list[Math.floor(rng() * list.length)].id;
}
