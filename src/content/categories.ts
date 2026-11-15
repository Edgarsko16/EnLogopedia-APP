import type { Category } from '@/types/content';

/**
 * Categorías del banco de vocabulario.
 *
 * Colores de acento: todos con contraste >= 4,5:1 frente a texto blanco
 * (comprobado en __tests__/theme.test.ts). El color nunca es la única señal:
 * cada tarjeta muestra siempre el nombre de la categoría.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'animales',
    nombre: 'Animales',
    descripcion: 'Animales de la granja, de casa y del mundo.',
    portada: 'animales_perro',
    color: '#8A4B12',
    icono: 'paw',
  },
  {
    id: 'alimentos',
    nombre: 'Alimentos',
    descripcion: 'Frutas, verduras y comida de todos los días.',
    portada: 'alimentos_manzana',
    color: '#A3321F',
    icono: 'nutrition',
  },
  {
    id: 'ropa',
    nombre: 'Ropa',
    descripcion: 'Prendas de vestir y calzado.',
    portada: 'ropa_botas',
    color: '#5B3F8C',
    icono: 'shirt',
  },
  {
    id: 'casa',
    nombre: 'Casa',
    descripcion: 'Muebles y objetos que usamos en casa.',
    portada: 'casa_silla',
    color: '#2F5D8A',
    icono: 'home',
  },
  {
    id: 'transporte',
    nombre: 'Transporte',
    descripcion: 'Vehículos por tierra, mar y aire.',
    portada: 'transporte_autobus',
    color: '#1F6B4F',
    icono: 'bus',
  },
  {
    id: 'acciones',
    nombre: 'Acciones',
    descripcion: 'Verbos de la vida diaria para formar frases.',
    portada: 'acciones_dormir',
    color: '#8C2F5B',
    icono: 'walk',
  },
];
