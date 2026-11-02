import { overallRating } from './qualities';
import type { Hero } from './types';

export type Rarity = 'SSR' | 'SR';

/**
 * Umbrales de rareza sobre la media (redondeada) de las cualidades que
 * puntúan, que es el mismo número que se muestra como valor de la carta.
 */
export const RARITY_THRESHOLDS = {
  ssr: 96,
  sr: 80,
} as const;

/** Rareza de un héroe, o null si su media no llega a SR. */
export function heroRarity(hero: Hero): Rarity | null {
  const rating = overallRating(hero);
  if (rating >= RARITY_THRESHOLDS.ssr) return 'SSR';
  if (rating >= RARITY_THRESHOLDS.sr) return 'SR';
  return null;
}
