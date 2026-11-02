import { GAME } from './config';
import { heroPower } from './qualities';
import { shuffle, type Rng } from './random';
import type { Hero } from './types';

export function uniqueHeroes(heroes: readonly Hero[]): Hero[] {
  const seen = new Set<number>();
  return heroes.filter((hero) => {
    if (seen.has(hero.id)) return false;
    seen.add(hero.id);
    return true;
  });
}

/**
 * Resuelve las cartas del mazo del jugador a partir de los ids guardados.
 * Si algún héroe ya no está disponible (por ejemplo, sin conexión y sin
 * caché), completa con el catálogo local para que la partida sea jugable.
 */
export function resolvePlayerDeck(
  catalog: readonly Hero[],
  deckIds: readonly number[],
  rng: Rng = Math.random,
): Hero[] {
  const byId = new Map(catalog.map((hero) => [hero.id, hero]));
  const seen = new Set<number>();
  const selected: Hero[] = [];

  for (const id of deckIds) {
    const hero = byId.get(id);
    if (hero && !seen.has(hero.id)) {
      seen.add(hero.id);
      selected.push(hero);
    }
  }

  if (selected.length >= GAME.minDeckSize) return selected.slice(0, GAME.deckSize);

  for (const hero of shuffle(uniqueHeroes(catalog), rng)) {
    if (selected.length >= GAME.deckSize) break;
    if (seen.has(hero.id)) continue;
    seen.add(hero.id);
    selected.push(hero);
  }

  return selected;
}

/**
 * Mazo del rival: aleatorio pero con un poder total parecido al del jugador.
 * Es una primera aproximación; el balance fino se hará más adelante.
 */
export function buildOpponentDeck(
  catalog: readonly Hero[],
  playerDeck: readonly Hero[],
  size: number = GAME.deckSize,
  rng: Rng = Math.random,
): Hero[] {
  const playerIds = new Set(playerDeck.map((hero) => hero.id));
  const available = uniqueHeroes(catalog).filter((hero) => !playerIds.has(hero.id));
  const pool = available.length >= size ? available : uniqueHeroes(catalog);

  const playerAverage =
    playerDeck.length > 0
      ? playerDeck.reduce((sum, hero) => sum + heroPower(hero), 0) / playerDeck.length
      : 250;
  const targetPower = playerAverage * (0.95 + rng() * 0.1);

  const shuffled = shuffle(pool, rng);
  const ranked = shuffled
    .map((hero) => ({
      hero,
      distance: Math.abs(heroPower(hero) - targetPower) + rng() * 35,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(size, GAME.minDeckSize))
    .map((entry) => entry.hero);

  return ranked.slice(0, size);
}
