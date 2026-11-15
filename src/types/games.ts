import type { Href } from 'expo-router';
import type { CategoryId } from './content';

export type GameId = 'vocabulario' | 'denominacion' | 'memory' | 'busca' | 'frases' | 'semantica' | 'fonologia';

/** Metadatos de un juego/ejercicio para listarlo en menús. */
export interface GameInfo {
  id: GameId;
  titulo: string;
  descripcion: string;
  /** Qué se trabaja, en lenguaje sencillo para familias y profesionales. */
  objetivos: string[];
  icono: string;
  /** Construye la ruta del juego, opcionalmente filtrado por categoría. */
  ruta: (categoria?: CategoryId) => Href;
  /** Si se define, el juego solo admite estas categorías. */
  categorias?: CategoryId[];
}
