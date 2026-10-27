/** Utilidades de azar. Se inyecta el RNG para poder simular partidas. */

export type Rng = () => number;

/** PRNG rápido y determinista para tests y simulaciones. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(maxExclusive: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * maxExclusive);
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function sample<T>(items: readonly T[], count: number, rng: Rng = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, Math.min(count, items.length)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Elige un elemento con pesos (los pesos negativos se ignoran). */
export function weightedPick<T>(
  items: readonly T[],
  weight: (item: T) => number,
  rng: Rng = Math.random,
): T | null {
  if (items.length === 0) return null;
  const weights = items.map((item) => Math.max(0, weight(item)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return items[randomInt(items.length, rng)];

  let ticket = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    ticket -= weights[i];
    if (ticket <= 0) return items[i];
  }
  return items[items.length - 1];
}
