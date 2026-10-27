import { GAME } from './config';
import { ACTIVE_QUALITIES, getStat } from './qualities';
import { shuffle, type Rng } from './random';
import type {
  CombatSummary,
  DuelResult,
  HandCard,
  Hero,
  MatchState,
  PlayerId,
  QualityId,
} from './types';

export type GameErrorCode =
  | 'INVALID_PHASE'
  | 'INVALID_TURN'
  | 'INVALID_SLOT'
  | 'SLOT_TAKEN'
  | 'CARD_NOT_FOUND'
  | 'DECK_TOO_SMALL'
  | 'BAD_CONFIGURATION'
  | 'INVALID_TARGET';

export class GameError extends Error {
  readonly code: GameErrorCode;

  constructor(code: GameErrorCode, message: string) {
    super(message);
    this.name = 'GameError';
    this.code = code;
  }
}

export const otherPlayer = (player: PlayerId): PlayerId =>
  player === 'player' ? 'opponent' : 'player';

const emptyPlacements = (): (HandCard | null)[] =>
  Array.from({ length: GAME.duelCount }, () => null);

/** Baraja el mazo y reparte la mano del combate. */
function dealHand(
  deck: readonly Hero[],
  player: PlayerId,
  combatNumber: number,
  rng: Rng,
): HandCard[] {
  return shuffle(deck, rng)
    .slice(0, GAME.handSize)
    .map((hero) => ({
      uid: `c${combatNumber}-${player}-${hero.id}`,
      hero,
    }));
}

function drawQualities(rng: Rng): QualityId[] {
  if (ACTIVE_QUALITIES.length < GAME.duelCount) {
    throw new GameError(
      'BAD_CONFIGURATION',
      `Hay ${ACTIVE_QUALITIES.length} cualidades activas y se necesitan ${GAME.duelCount}.`,
    );
  }
  return shuffle(ACTIVE_QUALITIES, rng).slice(0, GAME.duelCount);
}

function normalizeDeck(deck: readonly Hero[], label: string): Hero[] {
  const seen = new Set<number>();
  const unique = deck.filter((hero) => {
    if (!hero || typeof hero.id !== 'number' || seen.has(hero.id)) return false;
    seen.add(hero.id);
    return true;
  });

  if (unique.length < GAME.handSize) {
    throw new GameError(
      'DECK_TOO_SMALL',
      `El mazo de ${label} necesita al menos ${GAME.handSize} héroes distintos (tiene ${unique.length}).`,
    );
  }
  return unique;
}

export interface CreateMatchOptions {
  playerDeck: readonly Hero[];
  opponentDeck: readonly Hero[];
  target?: number;
  startingPlayer?: PlayerId;
  rng?: Rng;
}

/**
 * Crea una partida completa con el primer combate ya repartido.
 */
export function createMatch({
  playerDeck,
  opponentDeck,
  target = GAME.combatsToWinMatch,
  startingPlayer = 'player',
  rng = Math.random,
}: CreateMatchOptions): MatchState {
  if (GAME.handSize !== GAME.duelCount) {
    throw new GameError(
      'BAD_CONFIGURATION',
      'handSize y duelCount deben coincidir: cada carta se coloca en un duelo.',
    );
  }
  if (!Number.isInteger(target) || target < 1) {
    throw new GameError('INVALID_TARGET', 'El objetivo de combates debe ser un entero positivo.');
  }

  const decks: Record<PlayerId, Hero[]> = {
    player: normalizeDeck(playerDeck, 'jugador'),
    opponent: normalizeDeck(opponentDeck, 'rival'),
  };

  return {
    phase: 'placing',
    target,
    combatNumber: 1,
    qualities: drawQualities(rng),
    turn: startingPlayer,
    startingPlayer,
    decks,
    hands: {
      player: dealHand(decks.player, 'player', 1, rng),
      opponent: dealHand(decks.opponent, 'opponent', 1, rng),
    },
    placements: {
      player: emptyPlacements(),
      opponent: emptyPlacements(),
    },
    duelWins: { player: 0, opponent: 0 },
    combatWins: { player: 0, opponent: 0 },
    results: null,
    combatWinner: null,
    winner: null,
    totalPlacements: 0,
    history: [],
  };
}

export function getEmptySlots(state: MatchState, player: PlayerId): number[] {
  return state.placements[player]
    .map((card, index) => (card ? -1 : index))
    .filter((index) => index >= 0);
}

export function canPlaceCard(
  state: MatchState,
  player: PlayerId,
  cardUid: string,
  slotIndex: number,
): boolean {
  return (
    state.phase === 'placing' &&
    state.turn === player &&
    Number.isInteger(slotIndex) &&
    slotIndex >= 0 &&
    slotIndex < GAME.duelCount &&
    state.placements[player][slotIndex] === null &&
    state.hands[player].some((card) => card.uid === cardUid)
  );
}

/**
 * Coloca una carta de la mano en un hueco libre. Devuelve un estado nuevo.
 * Es una función pura: no modifica el estado recibido.
 */
export function placeCard(
  state: MatchState,
  player: PlayerId,
  cardUid: string,
  slotIndex: number,
): MatchState {
  if (state.phase !== 'placing') {
    throw new GameError('INVALID_PHASE', 'Ahora no se pueden colocar cartas.');
  }
  if (state.turn !== player) {
    throw new GameError('INVALID_TURN', 'No es el turno de este jugador.');
  }
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >= GAME.duelCount
  ) {
    throw new GameError('INVALID_SLOT', 'El duelo indicado no existe.');
  }
  if (state.placements[player][slotIndex] !== null) {
    throw new GameError('SLOT_TAKEN', 'Ya has colocado una carta en ese duelo.');
  }

  const handIndex = state.hands[player].findIndex((card) => card.uid === cardUid);
  if (handIndex < 0) {
    throw new GameError('CARD_NOT_FOUND', 'Esa carta ya no está en la mano.');
  }

  const card = state.hands[player][handIndex];
  const placements = {
    ...state.placements,
    [player]: state.placements[player].map((existing, index) =>
      index === slotIndex ? card : existing,
    ),
  };
  const hands = {
    ...state.hands,
    [player]: state.hands[player].filter((item) => item.uid !== cardUid),
  };

  const totalPlacements = state.totalPlacements + 1;
  const allPlaced =
    placements.player.every(Boolean) && placements.opponent.every(Boolean);
  const nextPlayer = otherPlayer(player);

  return {
    ...state,
    placements,
    hands,
    totalPlacements,
    phase: allPlaced ? 'revealing' : 'placing',
    turn: nextPlayer,
  };
}

/**
 * Compara los 5 duelos. Se lleva el combate quien gane al menos
 * `GAME.duelsToWinCombat` duelos; con empates, un combate puede quedar nulo.
 */
export function revealCombat(state: MatchState): MatchState {
  if (state.phase !== 'revealing') {
    throw new GameError('INVALID_PHASE', 'Todavía no se puede revelar el combate.');
  }

  const results: DuelResult[] = state.qualities.map((quality, slotIndex) => {
    const playerCard = state.placements.player[slotIndex];
    const opponentCard = state.placements.opponent[slotIndex];
    if (!playerCard || !opponentCard) {
      throw new GameError('INVALID_PHASE', 'Faltan cartas por colocar en el tablero.');
    }

    const playerValue = getStat(playerCard.hero, quality);
    const opponentValue = getStat(opponentCard.hero, quality);
    const winner: DuelResult['winner'] =
      playerValue === opponentValue
        ? 'draw'
        : playerValue > opponentValue
          ? 'player'
          : 'opponent';

    return {
      slotIndex,
      quality,
      playerCard,
      opponentCard,
      playerValue,
      opponentValue,
      winner,
    };
  });

  const duelWins: Record<PlayerId, number> = {
    player: results.filter((result) => result.winner === 'player').length,
    opponent: results.filter((result) => result.winner === 'opponent').length,
  };

  let combatWinner: CombatSummary['winner'] = 'draw';
  if (duelWins.player >= GAME.duelsToWinCombat) combatWinner = 'player';
  else if (duelWins.opponent >= GAME.duelsToWinCombat) combatWinner = 'opponent';

  const combatWins: Record<PlayerId, number> = {
    player: state.combatWins.player + (combatWinner === 'player' ? 1 : 0),
    opponent: state.combatWins.opponent + (combatWinner === 'opponent' ? 1 : 0),
  };

  let winner: PlayerId | null = null;
  if (combatWins.player >= state.target) winner = 'player';
  else if (combatWins.opponent >= state.target) winner = 'opponent';

  const summary: CombatSummary = {
    combatNumber: state.combatNumber,
    qualities: state.qualities,
    results,
    duelWins,
    winner: combatWinner,
  };

  return {
    ...state,
    results,
    duelWins,
    combatWinner,
    combatWins,
    winner,
    phase: winner ? 'matchOver' : 'combatResult',
    history: [...state.history, summary],
  };
}

/**
 * Reparte el siguiente combate. Alterna quién empieza para compensar la
 * ventaja de colocar primero.
 */
export function nextCombat(state: MatchState, rng: Rng = Math.random): MatchState {
  if (state.phase !== 'combatResult') {
    throw new GameError('INVALID_PHASE', 'El combate actual todavía no ha terminado.');
  }

  const combatNumber = state.combatNumber + 1;
  const startingPlayer = otherPlayer(state.startingPlayer);

  return {
    ...state,
    phase: 'placing',
    combatNumber,
    qualities: drawQualities(rng),
    startingPlayer,
    turn: startingPlayer,
    hands: {
      player: dealHand(state.decks.player, 'player', combatNumber, rng),
      opponent: dealHand(state.decks.opponent, 'opponent', combatNumber, rng),
    },
    placements: {
      player: emptyPlacements(),
      opponent: emptyPlacements(),
    },
    duelWins: { player: 0, opponent: 0 },
    results: null,
    combatWinner: null,
    totalPlacements: 0,
  };
}

export function visibleDuelWins(
  state: MatchState,
  revealedCount: number,
): Record<PlayerId, number> {
  if (!state.results) {
    return { player: 0, opponent: 0 };
  }
  return state.results.slice(0, revealedCount).reduce(
    (acc, result) => {
      if (result.winner !== 'draw') acc[result.winner] += 1;
      return acc;
    },
    { player: 0, opponent: 0 } as Record<PlayerId, number>,
  );
}
