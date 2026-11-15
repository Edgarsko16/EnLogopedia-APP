/**
 * Registro de juegos: una sola lista que alimenta los menús (inicio, lista de
 * juegos y ejercicios de cada categoría). Añadir un juego = añadir una entrada.
 */
import type { Href } from 'expo-router';
import type { CategoryId } from '@/types/content';
import type { GameInfo } from '@/types/games';

const withCategory = (pathname: string, categoria?: CategoryId): Href =>
  (categoria ? { pathname, params: { categoria } } : pathname) as Href;

export const GAMES: GameInfo[] = [
  {
    id: 'denominacion',
    titulo: 'Denominación',
    descripcion: 'Mira la foto y di su nombre en voz alta.',
    objetivos: ['Acceso al léxico', 'Expresión oral', 'Memoria semántica'],
    icono: 'chatbubble-ellipses',
    ruta: (c) => withCategory('/juegos/denominacion', c),
  },
  {
    id: 'busca',
    titulo: 'Busca la imagen',
    descripcion: 'Escucha la palabra y toca la foto correcta.',
    objetivos: ['Comprensión auditiva', 'Discriminación visual', 'Atención'],
    icono: 'search',
    ruta: (c) => withCategory('/juegos/busca', c),
  },
  {
    id: 'memory',
    titulo: 'Memory',
    descripcion: 'Encuentra las parejas de fotos iguales.',
    objetivos: ['Memoria visual', 'Atención sostenida', 'Vocabulario'],
    icono: 'grid',
    ruta: (c) => withCategory('/juegos/memory', c),
  },
  {
    id: 'frases',
    titulo: 'Frases y acciones',
    descripcion: 'Elige, completa o construye la frase de la foto.',
    objetivos: ['Estructura de la frase', 'Verbos de acción', 'Comprensión lectora'],
    icono: 'reorder-four',
    ruta: () => '/juegos/frases' as Href,
    categorias: ['acciones'],
  },
];

/** Palabras mínimas que necesita cada juego (memory: 4 parejas; busca: 2 imágenes). */
export const MIN_WORDS: Partial<Record<GameInfo['id'], number>> = { memory: 4, busca: 2, denominacion: 1 };

/** Juegos disponibles en una categoría según sus restricciones y su número de palabras. */
export function gamesForCategory(categoria: CategoryId, wordCount = Infinity): GameInfo[] {
  return GAMES.filter(
    (g) => (!g.categorias || g.categorias.includes(categoria)) && wordCount >= (MIN_WORDS[g.id] ?? 1),
  );
}
