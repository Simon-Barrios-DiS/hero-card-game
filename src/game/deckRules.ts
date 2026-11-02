import { GAME } from './config';
import { overallRating } from './qualities';
import { heroRarity } from './rarity';
import { sample, type Rng } from './random';
import type { Hero } from './types';

/**
 * Reglas de composición del mazo: 30 héroes repartidos en tres tramos de
 * rareza. Sirven tanto para validar la edición como para rellenar el mazo al
 * azar sin romper las cuotas.
 */
export type DeckTier = 'SSR' | 'SR' | 'regular';

/** Versión del formato de mazo guardado. Las anteriores se migran al cargar. */
export const DECK_SCHEMA_VERSION = 2;

export const DECK_LIMITS: Record<DeckTier, number> = {
  SSR: 1,
  SR: 9,
  regular: 20,
} as const;

export const DECK_TIERS: DeckTier[] = ['SSR', 'SR', 'regular'];

export interface DeckCounts {
  SSR: number;
  SR: number;
  regular: number;
  total: number;
}

export type DeckBlockReason =
  | 'full'
  | 'ssr-limit'
  | 'sr-limit'
  | 'regular-limit'
  | 'duplicate'
  | 'not-owned'
  | 'not-found';

export type DeckCheck = { ok: true } | { ok: false; reason: DeckBlockReason };

const TIER_REASON: Record<DeckTier, DeckBlockReason> = {
  SSR: 'ssr-limit',
  SR: 'sr-limit',
  regular: 'regular-limit',
};

export const DECK_BLOCK_MESSAGES: Record<DeckBlockReason, string> = {
  full: `Mazo completo (${GAME.deckSize}).`,
  'ssr-limit': `Solo puedes tener ${DECK_LIMITS.SSR} SSR en el mazo.`,
  'sr-limit': `Ya tienes ${DECK_LIMITS.SR} SR. Quita uno para añadir otro.`,
  'regular-limit': `Ya tienes ${DECK_LIMITS.regular} cartas comunes.`,
  duplicate: 'Ese héroe ya está en el mazo.',
  'not-owned': 'No tienes este héroe. Consíguelo en la tienda.',
  'not-found': 'Ese héroe ya no está disponible.',
};

/** Tramo de rareza que ocupa la carta dentro del mazo. */
export function deckTierOf(hero: Hero): DeckTier {
  return heroRarity(hero) ?? 'regular';
}

export function countDeckTiers(heroes: readonly Hero[]): DeckCounts {
  const counts: DeckCounts = { SSR: 0, SR: 0, regular: 0, total: 0 };
  for (const hero of heroes) {
    counts[deckTierOf(hero)] += 1;
    counts.total += 1;
  }
  return counts;
}

/** Suma de los promedios (valor mostrado en la carta) de todo el mazo. */
export function deckPower(heroes: readonly Hero[]): number {
  return heroes.reduce((sum, hero) => sum + overallRating(hero), 0);
}

export function isDeckComplete(heroes: readonly Hero[]): boolean {
  if (heroes.length !== GAME.deckSize) return false;
  const counts = countDeckTiers(heroes);
  return DECK_TIERS.every((tier) => counts[tier] === DECK_LIMITS[tier]);
}

export function checkDeckAdd(
  deckHeroes: readonly Hero[],
  hero: Hero,
): DeckCheck {
  if (deckHeroes.some((item) => item.id === hero.id)) {
    return { ok: false, reason: 'duplicate' };
  }
  if (deckHeroes.length >= GAME.deckSize) {
    return { ok: false, reason: 'full' };
  }
  const tier = deckTierOf(hero);
  const counts = countDeckTiers(deckHeroes);
  if (counts[tier] >= DECK_LIMITS[tier]) {
    return { ok: false, reason: TIER_REASON[tier] };
  }
  return { ok: true };
}

/**
 * Devuelve un mazo de 30 cartas respetando las cuotas. Conserva las cartas
 * recibidas que encajan y completa cada tramo con héroes aleatorios del
 * catálogo. Si el mazo recibido tiene exceso de alguna rareza, se recorta.
 */
export function buildFilledDeck(
  selectedHeroes: readonly Hero[],
  catalog: readonly Hero[],
  rng: Rng = Math.random,
): Hero[] {
  const byId = new Map<number, Hero>();
  for (const hero of catalog) byId.set(hero.id, hero);

  const seen = new Set<number>();
  const counts: Record<DeckTier, number> = { SSR: 0, SR: 0, regular: 0 };
  const result: Hero[] = [];

  for (const candidate of selectedHeroes) {
    const hero = byId.get(candidate.id);
    if (!hero || seen.has(hero.id)) continue;
    seen.add(hero.id);
    const tier = deckTierOf(hero);
    if (counts[tier] >= DECK_LIMITS[tier]) continue;
    counts[tier] += 1;
    result.push(hero);
  }

  for (const tier of DECK_TIERS) {
    const missing = DECK_LIMITS[tier] - counts[tier];
    if (missing <= 0) continue;
    const pool = catalog.filter(
      (hero) => !seen.has(hero.id) && deckTierOf(hero) === tier,
    );
    for (const hero of sample(pool, missing, rng)) {
      seen.add(hero.id);
      result.push(hero);
    }
  }

  return result;
}

/** Mazo completo generado al azar. */
export function buildRandomDeck(
  catalog: readonly Hero[],
  rng: Rng = Math.random,
): Hero[] {
  return buildFilledDeck([], catalog, rng);
}
