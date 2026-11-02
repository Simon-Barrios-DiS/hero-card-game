import { getStat, overallRating, SCORED_QUALITIES } from './qualities';
import type { Hero } from './types';

export type HeroSortDirection = 'asc' | 'desc';

/** Cualidades activas que se pueden usar para ordenar. */
export type HeroSortKey =
  | 'name'
  | 'rating'
  | 'intelligence'
  | 'strength'
  | 'speed'
  | 'durability'
  | 'combat';

export interface HeroSort {
  key: HeroSortKey;
  direction: HeroSortDirection;
}

export interface HeroSortOption {
  key: HeroSortKey;
  label: string;
}

export const HERO_SORT_OPTIONS: HeroSortOption[] = [
  { key: 'name', label: 'A-Z' },
  { key: 'rating', label: 'Poder' },
  ...SCORED_QUALITIES.map((quality) => ({
    key: quality.id as HeroSortKey,
    label: quality.short,
  })),
];

/** Los valores numéricos empiezan de mayor a menor; el nombre, de A a Z. */
export function defaultSortDirection(key: HeroSortKey): HeroSortDirection {
  return key === 'name' ? 'asc' : 'desc';
}

/** Al pulsar la opción activa se invierte la dirección. */
export function nextHeroSort(current: HeroSort, key: HeroSortKey): HeroSort {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
  }
  return { key, direction: defaultSortDirection(key) };
}

export function sortDirectionText(
  key: HeroSortKey,
  direction: HeroSortDirection,
): string {
  if (key === 'name') {
    return direction === 'asc' ? 'A → Z' : 'Z → A';
  }
  return direction === 'desc' ? 'mayor → menor' : 'menor → mayor';
}

export function sortHeroes(
  heroes: readonly Hero[],
  sort: HeroSort,
): Hero[] {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...heroes].sort((a, b) => {
    let diff = 0;
    if (sort.key === 'name') {
      diff = a.name.localeCompare(b.name);
    } else if (sort.key === 'rating') {
      diff = overallRating(a) - overallRating(b);
    } else {
      diff = getStat(a, sort.key) - getStat(b, sort.key);
    }

    if (diff !== 0) return diff * factor;
    return a.name.localeCompare(b.name);
  });
}
