/**
 * Utilidades de aleatoriedad.
 *
 * Todas aceptan un generador `rng` opcional (por defecto Math.random) para
 * que las pruebas puedan usar una semilla fija y obtener resultados repetibles.
 */
export type Rng = () => number;

/** Generador pseudoaleatorio con semilla (mulberry32). Útil en pruebas. */
export function seededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Devuelve una copia barajada (Fisher-Yates). No modifica el array original. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Toma `count` elementos distintos al azar. Si no hay suficientes, devuelve todos barajados. */
export function sample<T>(items: readonly T[], count: number, rng: Rng = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, count));
}

/** Entero aleatorio en [0, max). */
export function randomIndex(max: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * max);
}
