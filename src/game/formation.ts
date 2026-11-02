import { GAME } from './config';
import type { HandCard, Hero } from './types';

/** Puntos extra por alinear las cinco cartas de la ronda. */
export const FORMATION_BONUS = 5;

type HeroOrigin = 'marvel' | 'dc' | 'other';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Mismo criterio que los filtros del compendio: Marvel, DC u otros. */
function originOf(hero: Hero): HeroOrigin {
  if (/marvel/i.test(hero.publisher)) return 'marvel';
  if (/\bdc\b/i.test(hero.publisher)) return 'dc';
  return 'other';
}

/**
 * La mano completa (las 5 cartas colocadas) comparte origen editorial y
 * alineación moral. En ese caso todas las cartas suman el bonus en cada duelo.
 */
export function hasFormationBonus(
  cards: readonly (HandCard | null)[],
): boolean {
  if (cards.length !== GAME.duelCount) return false;

  const heroes: Hero[] = [];
  for (const card of cards) {
    if (!card) return false;
    heroes.push(card.hero);
  }

  const origin = originOf(heroes[0]);
  const alignment = normalize(heroes[0].alignment);

  return heroes.every(
    (hero) =>
      originOf(hero) === origin &&
      normalize(hero.alignment) === alignment,
  );
}

export function formationBonus(cards: readonly (HandCard | null)[]): number {
  return hasFormationBonus(cards) ? FORMATION_BONUS : 0;
}
