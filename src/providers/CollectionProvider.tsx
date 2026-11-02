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
import {
  buildFilledDeck,
  checkDeckAdd,
  countDeckTiers,
  deckPower as calculateDeckPower,
  isDeckComplete,
  type DeckBlockReason,
  type DeckCheck,
  type DeckCounts,
} from '../game/deckRules';
import {
  CARDS_PER_PACK,
  EMPTY_TUTORIAL,
  PACK_OFFERS,
  createStarterPlan,
  drawPacks,
  updateTutorial,
  type PackOffer,
  type PackPurchaseResult,
  type TutorialState,
} from '../game/shop';
import { SEED_HEROES } from '../data/seedHeroes';
import { fetchCatalog, HAS_OFFICIAL_TOKEN } from '../data/api';
import {
  emptyRecord,
  loadCatalogCache,
  saveCatalogCache,
} from '../data/storage';
import { useAuth } from './AuthProvider';
import type { Hero, MatchRecord } from '../game/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Catálogo local: la selección curada siempre gana sobre el remoto. */
function mergeCatalog(remote: readonly Hero[]): Hero[] {
  const byId = new Map<number, Hero>();
  for (const hero of remote) byId.set(hero.id, hero);
  for (const hero of SEED_HEROES) byId.set(hero.id, hero);
  return [...byId.values()];
}

export type CatalogSource = 'seed' | 'cache' | 'network';

export type ToggleDeckResult =
  | { ok: true; added: boolean }
  | { ok: false; reason: DeckBlockReason };

export interface FillDeckResult {
  deckSize: number;
  complete: boolean;
}

interface CollectionContextValue {
  heroes: Hero[];
  heroById: Map<number, Hero>;
  loadingCatalog: boolean;
  catalogError: string | null;
  catalogSource: CatalogSource;
  lastUpdated: number | null;
  refreshCatalog: () => Promise<void>;
  catalogReady: boolean;
  tokens: number;
  tutorial: TutorialState;
  ownedCount: number;
  isOwned: (heroId: number) => boolean;
  deckIds: number[];
  deckHeroes: Hero[];
  deckCount: number;
  deckCounts: DeckCounts;
  deckPower: number;
  deckComplete: boolean;
  isInDeck: (heroId: number) => boolean;
  canAddToDeck: (heroId: number) => DeckCheck;
  toggleDeckHero: (heroId: number) => ToggleDeckResult;
  fillDeck: () => FillDeckResult;
  clearDeck: () => void;
  buyPacks: (offerId: PackOffer['id']) => PackPurchaseResult;
  record: MatchRecord;
  registerMatch: (result: 'win' | 'loss' | 'draw', combatsWon?: number) => number;
  hasOfficialToken: boolean;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { currentUser, updateCurrentUser } = useAuth();
  const [remoteHeroes, setRemoteHeroes] = useState<Hero[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('seed');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [catalogReady, setCatalogReady] = useState(false);

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
      const cachedCatalog = await loadCatalogCache();
      if (!active) return;

      if (cachedCatalog) {
        setRemoteHeroes(cachedCatalog.heroes);
        setLastUpdated(cachedCatalog.updatedAt);
        setCatalogSource('cache');
      }

      setCatalogReady(true);

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

  const heroes = useMemo(
    () => mergeCatalog(remoteHeroes).sort((a, b) => a.name.localeCompare(b.name)),
    [remoteHeroes],
  );

  const heroById = useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero])),
    [heroes],
  );

  const deckIds = useMemo(
    () => currentUser?.deckIds ?? [],
    [currentUser?.deckIds],
  );
  const record = currentUser?.record ?? emptyRecord();
  const tokens = currentUser?.tokens ?? 0;
  const tutorial = currentUser?.tutorial ?? EMPTY_TUTORIAL;
  const ownsAllCards = currentUser?.ownsAllCards ?? false;

  const ownedIdSet = useMemo(
    () => new Set(currentUser?.ownedHeroIds ?? []),
    [currentUser?.ownedHeroIds],
  );

  const isOwned = useCallback(
    (heroId: number) => ownsAllCards || ownedIdSet.has(heroId),
    [ownsAllCards, ownedIdSet],
  );

  const ownedHeroes = useMemo(
    () => heroes.filter((hero) => isOwned(hero.id)),
    [heroes, isOwned],
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

  const deckCounts = useMemo(() => countDeckTiers(deckHeroes), [deckHeroes]);
  const deckPower = useMemo(() => calculateDeckPower(deckHeroes), [deckHeroes]);
  const deckComplete = useMemo(() => isDeckComplete(deckHeroes), [deckHeroes]);

  const isInDeck = useCallback(
    (heroId: number) => deckIds.includes(heroId),
    [deckIds],
  );

  const commitDeckIds = useCallback(
    (updater: (previous: number[]) => number[]) => {
      updateCurrentUser((user) => ({
        ...user,
        deckIds: updater(user.deckIds ?? []),
      }));
    },
    [updateCurrentUser],
  );

  const canAddToDeck = useCallback(
    (heroId: number): DeckCheck => {
      const hero = heroById.get(heroId);
      if (!hero) return { ok: false, reason: 'not-found' };
      if (!isOwned(heroId)) return { ok: false, reason: 'not-owned' };
      return checkDeckAdd(deckHeroes, hero);
    },
    [deckHeroes, heroById, isOwned],
  );

  const toggleDeckHero = useCallback(
    (heroId: number): ToggleDeckResult => {
      if (deckIds.includes(heroId)) {
        commitDeckIds((previous) => previous.filter((id) => id !== heroId));
        return { ok: true, added: false };
      }

      const check = canAddToDeck(heroId);
      if (!check.ok) return check;

      commitDeckIds((previous) =>
        previous.includes(heroId) ? previous : [...previous, heroId],
      );
      return { ok: true, added: true };
    },
    [canAddToDeck, commitDeckIds, deckIds],
  );

  const fillDeck = useCallback((): FillDeckResult => {
    const selected = deckIds
      .map((id) => heroById.get(id))
      .filter((hero): hero is Hero => Boolean(hero));
    const next = buildFilledDeck(selected, ownedHeroes);
    commitDeckIds(() => next.map((hero) => hero.id));
    return { deckSize: next.length, complete: isDeckComplete(next) };
  }, [commitDeckIds, deckIds, heroById, ownedHeroes]);

  const clearDeck = useCallback(() => commitDeckIds(() => []), [commitDeckIds]);

  const registerMatch = useCallback(
    (result: 'win' | 'loss' | 'draw', combatsWon = 0): number => {
      const earned =
        Math.max(0, Math.floor(combatsWon)) * GAME.tokensPerCombatWin;
      updateCurrentUser((user) => ({
        ...user,
        tokens: Math.max(0, user.tokens + earned),
        record: {
          wins: user.record.wins + (result === 'win' ? 1 : 0),
          losses: user.record.losses + (result === 'loss' ? 1 : 0),
          draws: user.record.draws + (result === 'draw' ? 1 : 0),
          matches: user.record.matches + 1,
        },
      }));
      return earned;
    },
    [updateCurrentUser],
  );

  const buyPacks = useCallback(
    (offerId: PackOffer['id']): PackPurchaseResult => {
      if (!currentUser) {
        return { ok: false, error: 'Inicia sesión para comprar.' };
      }

      const offer = PACK_OFFERS.find((item) => item.id === offerId);
      if (!offer) {
        return { ok: false, error: 'Ese sobre no existe.' };
      }
      if (!catalogReady || heroes.length < CARDS_PER_PACK) {
        return { ok: false, error: 'El catálogo todavía se está cargando.' };
      }
      if (currentUser.tokens < offer.price) {
        return { ok: false, error: 'No tienes tokens suficientes.' };
      }

      const tutorialState = currentUser.tutorial;
      if (!tutorialState.completed) {
        if (offer.packs !== 1 && offer.packs !== 5) {
          return {
            ok: false,
            error: 'Completa el tutorial: compra 1 sobre y el pack de 5.',
          };
        }
        if (offer.packs === 1 && tutorialState.singleBought) {
          return {
            ok: false,
            error: 'Ya compraste el sobre del tutorial. Ahora toca el pack de 5.',
          };
        }
        if (offer.packs === 5 && tutorialState.fiveBought) {
          return {
            ok: false,
            error: 'Ya compraste el pack de 5. Ahora toca el sobre.',
          };
        }
      }

      const fresh =
        !currentUser.ownsAllCards &&
        (currentUser.ownedHeroIds?.length ?? 0) === 0;
      const starterPlan =
        fresh && (currentUser.starterPlan?.length ?? 0) === 0
          ? createStarterPlan(heroes)
          : currentUser.starterPlan ?? [];

      const draw = drawPacks({
        catalog: heroes,
        packs: offer.packs,
        ownedHeroIds: currentUser.ownedHeroIds ?? [],
        ownsAllCards: currentUser.ownsAllCards,
        starterPlan,
      });
      const nextTokens =
        currentUser.tokens - offer.price + draw.refund;
      const nextTutorial = updateTutorial(
        currentUser.tutorial,
        offer.packs,
      );

      updateCurrentUser((user) => ({
        ...user,
        tokens: nextTokens,
        ownedHeroIds: draw.ownedHeroIds,
        starterPlan: draw.starterPlan,
        tutorial: nextTutorial,
      }));

      return {
        ok: true,
        offer,
        cards: draw.cards,
        newCount: draw.newCount,
        duplicateCount: draw.duplicateCount,
        refund: draw.refund,
        spent: offer.price,
        tokens: nextTokens,
        tutorial: nextTutorial,
      };
    },
    [catalogReady, currentUser, heroes, updateCurrentUser],
  );

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
      catalogReady,
      tokens,
      tutorial,
      ownedCount: ownedHeroes.length,
      isOwned,
      deckIds,
      deckHeroes,
      deckCount: deckHeroes.length,
      deckCounts,
      deckPower,
      deckComplete,
      isInDeck,
      canAddToDeck,
      toggleDeckHero,
      fillDeck,
      clearDeck,
      buyPacks,
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
      catalogReady,
      tokens,
      tutorial,
      ownedHeroes.length,
      isOwned,
      deckIds,
      deckHeroes,
      deckCounts,
      deckPower,
      deckComplete,
      isInDeck,
      canAddToDeck,
      toggleDeckHero,
      fillDeck,
      clearDeck,
      buyPacks,
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
