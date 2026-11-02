import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Hero, MatchRecord } from '../game/types';

const KEYS = {
  preferences: '@hero-card-game/preferences/v1',
  catalog: '@hero-card-game/catalog/v1',
} as const;

export const emptyRecord = (): MatchRecord => ({
  wins: 0,
  losses: 0,
  draws: 0,
  matches: 0,
});

export interface StoredPreferences {
  deckIds: number[];
  record: MatchRecord;
  /** Versión del formato de mazo; las anteriores se migran al cargar. */
  deckVersion: number;
}

export interface CachedCatalog {
  updatedAt: number;
  heroes: Hero[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const safeNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function parseRecord(value: unknown): MatchRecord {
  const raw = isRecord(value) ? value : {};
  return {
    wins: Math.max(0, safeNumber(raw.wins)),
    losses: Math.max(0, safeNumber(raw.losses)),
    draws: Math.max(0, safeNumber(raw.draws)),
    matches: Math.max(0, safeNumber(raw.matches)),
  };
}

export async function loadPreferences(): Promise<StoredPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.preferences);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const deckIds = Array.isArray(parsed.deckIds)
      ? parsed.deckIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    return {
      deckIds: Array.from(new Set(deckIds)),
      record: parseRecord(parsed.record),
      deckVersion: safeNumber(parsed.deckVersion, 1),
    };
  } catch {
    return null;
  }
}

export async function savePreferences(preferences: StoredPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.preferences, JSON.stringify(preferences));
  } catch {
    // Persistir es una mejora, nunca debe romper la partida.
  }
}

export async function loadCatalogCache(): Promise<CachedCatalog | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.catalog);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.heroes)) return null;

    const heroes = parsed.heroes.filter(
      (hero): hero is Hero =>
        isRecord(hero) &&
        typeof hero.id === 'number' &&
        typeof hero.name === 'string' &&
        typeof hero.imageUrl === 'string',
    );

    if (heroes.length === 0) return null;

    return {
      updatedAt: safeNumber(parsed.updatedAt, 0),
      heroes,
    };
  } catch {
    return null;
  }
}

export async function saveCatalogCache(heroes: Hero[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      KEYS.catalog,
      JSON.stringify({ updatedAt: Date.now(), heroes }),
    );
  } catch {
    // El catálogo puede volver a descargarse.
  }
}

export async function clearStoredData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.preferences, KEYS.catalog]);
  } catch {
    // Sin consecuencia para el juego.
  }
}
