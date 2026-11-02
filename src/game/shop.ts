import { buildFilledDeck } from './deckRules';
import { heroRarity } from './rarity';
import { sample, shuffle, type Rng } from './random';
import type { Hero } from './types';

export const CARDS_PER_PACK = 5;

export type PackOfferId = 'pack1' | 'pack3' | 'pack5' | 'pack10';

export interface PackOffer {
  id: PackOfferId;
  packs: number;
  price: number;
  label: string;
}

/** Precios pedidos: 1 sobre = 10, 3 = 20, 5 = 40, 10 = 70 tokens. */
export const PACK_OFFERS: PackOffer[] = [
  { id: 'pack1', packs: 1, price: 10, label: '1 sobre' },
  { id: 'pack3', packs: 3, price: 20, label: '3 sobres' },
  { id: 'pack5', packs: 5, price: 40, label: '5 sobres' },
  { id: 'pack10', packs: 10, price: 70, label: '10 sobres' },
];

export interface TutorialState {
  singleBought: boolean;
  fiveBought: boolean;
  completed: boolean;
}

export const EMPTY_TUTORIAL: TutorialState = {
  singleBought: false,
  fiveBought: false,
  completed: false,
};

export const COMPLETED_TUTORIAL: TutorialState = {
  singleBought: true,
  fiveBought: true,
  completed: true,
};

/** El tutorial pide comprar 1 sobre y el pack de 5, en cualquier orden. */
export function updateTutorial(
  current: TutorialState,
  packs: number,
): TutorialState {
  const singleBought = current.singleBought || packs === 1;
  const fiveBought = current.fiveBought || packs >= 5;
  return {
    singleBought,
    fiveBought,
    completed: singleBought && fiveBought,
  };
}

/** Valor de un héroe repetido según su rareza. */
export function duplicateRefund(hero: Hero): number {
  const rarity = heroRarity(hero);
  if (rarity === 'SSR') return 10;
  if (rarity === 'SR') return 5;
  return 3;
}

export interface PackCardResult {
  hero: Hero;
  duplicate: boolean;
  refund: number;
}

export interface DrawPacksOptions {
  catalog: readonly Hero[];
  packs: number;
  ownedHeroIds: readonly number[];
  ownsAllCards: boolean;
  starterPlan: readonly number[];
  rng?: Rng;
}

export interface PackDrawResult {
  cards: PackCardResult[];
  newCount: number;
  duplicateCount: number;
  refund: number;
  ownedHeroIds: number[];
  starterPlan: number[];
}

/**
 * Los primeros 6 sobres de una cuenta nueva forman un set inicial válido
 * (1 SSR + 9 SR + 20 comunes). Así el tutorial deja una colección jugable.
 */
export function createStarterPlan(
  catalog: readonly Hero[],
  rng: Rng = Math.random,
): number[] {
  return shuffle(
    buildFilledDeck([], catalog, rng).map((hero) => hero.id),
    rng,
  );
}

/**
 * Abre los sobres. Cada sobre reparte 5 héroes distintos. Las cartas del plan
 * inicial se consumen primero y el resto se sortea del catálogo.
 */
export function drawPacks({
  catalog,
  packs,
  ownedHeroIds,
  ownsAllCards,
  starterPlan,
  rng = Math.random,
}: DrawPacksOptions): PackDrawResult {
  const byId = new Map<number, Hero>();
  for (const hero of catalog) byId.set(hero.id, hero);

  const owned = new Set<number>(ownedHeroIds);
  const plan = starterPlan.slice();
  const cards: PackCardResult[] = [];
  let newCount = 0;
  let duplicateCount = 0;
  let refund = 0;

  for (let packIndex = 0; packIndex < packs; packIndex += 1) {
    const packHeroes: Hero[] = [];
    const packIds = new Set<number>();

    while (packHeroes.length < CARDS_PER_PACK && plan.length > 0) {
      const heroId = plan.shift();
      if (heroId === undefined || packIds.has(heroId)) continue;
      const hero = byId.get(heroId);
      if (!hero) continue;
      packIds.add(hero.id);
      packHeroes.push(hero);
    }

    const missing = CARDS_PER_PACK - packHeroes.length;
    if (missing > 0) {
      const reserved = new Set(plan);
      const pool = catalog.filter(
        (hero) => !packIds.has(hero.id) && !reserved.has(hero.id),
      );
      for (const hero of sample(pool, missing, rng)) {
        packIds.add(hero.id);
        packHeroes.push(hero);
      }
    }

    for (const hero of packHeroes) {
      const duplicate = ownsAllCards || owned.has(hero.id);
      const value = duplicate ? duplicateRefund(hero) : 0;
      if (duplicate) {
        duplicateCount += 1;
      } else {
        owned.add(hero.id);
        newCount += 1;
      }
      refund += value;
      cards.push({ hero, duplicate, refund: value });
    }
  }

  return {
    cards,
    newCount,
    duplicateCount,
    refund,
    ownedHeroIds: ownsAllCards ? [...ownedHeroIds] : [...owned],
    starterPlan: ownsAllCards ? [] : plan,
  };
}

export interface PackPurchaseSuccess {
  ok: true;
  offer: PackOffer;
  cards: PackCardResult[];
  newCount: number;
  duplicateCount: number;
  refund: number;
  spent: number;
  tokens: number;
  tutorial: TutorialState;
}

export interface PackPurchaseFailure {
  ok: false;
  error: string;
}

export type PackPurchaseResult = PackPurchaseSuccess | PackPurchaseFailure;
