import { useLocalSearchParams } from 'expo-router';
import { getCategory, isCategoryId } from '@/content/catalog';
import type { Category, CategoryId } from '@/types/content';

/**
 * Lee el parámetro `categoria` de la URL (p. ej. /juegos/busca?categoria=animales).
 * Si falta o no es válido, devuelve undefined: el juego usa todas las categorías.
 */
export function useCategoryParam(): { categoria?: CategoryId; category?: Category } {
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  if (!isCategoryId(categoria)) return {};
  return { categoria, category: getCategory(categoria) };
}
