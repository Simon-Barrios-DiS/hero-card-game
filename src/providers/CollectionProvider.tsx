import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { GAME } from '../game/config';
import { buildDefaultDeck } from '../game/deck';
import { shuffle } from '../game/random';
import { SEED_HEROES } from '../data/seedHeroes';
import { fetchCatalog, HAS_OFFICIAL_TOKEN } from '../data/api';
import {
  emptyRecord,
  loadCatalogCache,
  loadPreferences,
  saveCatalogCache,
  savePreferences,
} from '../data/storage';
import type { Hero, MatchRecord } from '../game/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type CatalogSource = 'seed' | 'cache' | 'network';

export type ToggleDeckResult =
  | { ok: true; added: boolean }
  | { ok: false; reason: 'full' | 'not-found' };

interface CollectionContextValue {
  heroes: Hero[];
  heroById: Map<number, Hero>;
  loadingCatalog: boolean;
  catalogError: string | null;
  catalogSource: CatalogSource;
  lastUpdated: number | null;
  refreshCatalog: () => Promise<void>;
  preferencesReady: boolean;
  deckIds: number[];
  deckHeroes: Hero[];
  deckCount: number;
  isInDeck: (heroId: number) => boolean;
  toggleDeckHero: (heroId: number) => ToggleDeckResult;
  fillDeck: () => void;
  record: MatchRecord;
  registerMatch: (result: 'win' | 'loss' | 'draw') => void;
  hasOfficialToken: boolean;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [remoteHeroes, setRemoteHeroes] = useState<Hero[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('seed');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [deckIds, setDeckIds] = useState<number[]>([]);
  const [record, setRecord] = useState<MatchRecord>(emptyRecord);
  const [preferencesReady, setPreferencesReady] = useState(false);

  const loadRemoteCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const heroes = await fetchCatalog();
      setRemoteHeroes(heroes);
      setCatalogSource('network');
      setLastUpdated(Date.now());
      await saveCatalogCache(heroes);
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? 'La descarga tardó demasiado.'
          : error instanceof Error
            ? error.message
            : 'No se pudo descargar el catálogo.';
      setCatalogError(message);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const [storedPreferences, cachedCatalog] = await Promise.all([
        loadPreferences(),
        loadCatalogCache(),
      ]);
      if (!active) return;

      if (storedPreferences) {
        setDeckIds(storedPreferences.deckIds);
        setRecord(storedPreferences.record);
      } else {
        setDeckIds(buildDefaultDeck(SEED_HEROES, GAME.deckSize));
      }

      if (cachedCatalog) {
        setRemoteHeroes(cachedCatalog.heroes);
        setLastUpdated(cachedCatalog.updatedAt);
        setCatalogSource('cache');
      }

      setPreferencesReady(true);

      const cacheIsFresh =
        cachedCatalog !== null &&
        cachedCatalog.heroes.length >= 100 &&
        Date.now() - cachedCatalog.updatedAt < CACHE_TTL_MS;

      if (!cacheIsFresh) {
        void loadRemoteCatalog();
      }
    })();

    return () => {
      active = false;
    };
  }, [loadRemoteCatalog]);

  useEffect(() => {
    if (!preferencesReady) return;
    void savePreferences({ deckIds, record });
  }, [deckIds, record, preferencesReady]);

  const heroes = useMemo(() => {
    const byId = new Map<number, Hero>(remoteHeroes.map((hero) => [hero.id, hero]));
    // La selección curada siempre gana: nombres y editoriales limpios.
    for (const seed of SEED_HEROES) byId.set(seed.id, seed);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [remoteHeroes]);

  const heroById = useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero])),
    [heroes],
  );

  const deckHeroes = useMemo(() => {
    const seen = new Set<number>();
    const result: Hero[] = [];
    for (const id of deckIds) {
      const hero = heroById.get(id);
      if (!hero || seen.has(hero.id)) continue;
      seen.add(hero.id);
      result.push(hero);
    }
    return result.slice(0, GAME.deckSize);
  }, [deckIds, heroById]);

  const isInDeck = useCallback(
    (heroId: number) => deckIds.includes(heroId),
    [deckIds],
  );

  const toggleDeckHero = useCallback(
    (heroId: number): ToggleDeckResult => {
      if (!heroById.has(heroId)) return { ok: false, reason: 'not-found' };

      if (deckIds.includes(heroId)) {
        setDeckIds((previous) => previous.filter((id) => id !== heroId));
        return { ok: true, added: false };
      }

      if (deckIds.length >= GAME.deckSize) {
        return { ok: false, reason: 'full' };
      }

      setDeckIds((previous) =>
        previous.includes(heroId) ? previous : [...previous, heroId],
      );
      return { ok: true, added: true };
    },
    [deckIds, heroById],
  );

  const fillDeck = useCallback(() => {
    setDeckIds((previous) => {
      const selected = new Set(previous);
      const next = [...previous];
      for (const hero of shuffle(heroes)) {
        if (next.length >= GAME.deckSize) break;
        if (selected.has(hero.id)) continue;
        selected.add(hero.id);
        next.push(hero.id);
      }
      return next;
    });
  }, [heroes]);

  const registerMatch = useCallback((result: 'win' | 'loss' | 'draw') => {
    setRecord((previous) => ({
      wins: previous.wins + (result === 'win' ? 1 : 0),
      losses: previous.losses + (result === 'loss' ? 1 : 0),
      draws: previous.draws + (result === 'draw' ? 1 : 0),
      matches: previous.matches + 1,
    }));
  }, []);

  const refreshCatalog = useCallback(async () => {
    await loadRemoteCatalog();
  }, [loadRemoteCatalog]);

  const value = useMemo<CollectionContextValue>(
    () => ({
      heroes,
      heroById,
      loadingCatalog,
      catalogError,
      catalogSource,
      lastUpdated,
      refreshCatalog,
      preferencesReady,
      deckIds,
      deckHeroes,
      deckCount: deckHeroes.length,
      isInDeck,
      toggleDeckHero,
      fillDeck,
      record,
      registerMatch,
      hasOfficialToken: HAS_OFFICIAL_TOKEN,
    }),
    [
      heroes,
      heroById,
      loadingCatalog,
      catalogError,
      catalogSource,
      lastUpdated,
      refreshCatalog,
      preferencesReady,
      deckIds,
      deckHeroes,
      isInDeck,
      toggleDeckHero,
      fillDeck,
      record,
      registerMatch,
    ],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextValue {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection debe usarse dentro de CollectionProvider.');
  }
  return context;
}
