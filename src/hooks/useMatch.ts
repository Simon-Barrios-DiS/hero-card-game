import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { GAME } from '../game/config';
import { chooseAiMove } from '../game/ai';
import {
  createMatch,
  GameError,
  nextCombat,
  placeCard,
  revealCombat,
} from '../game/engine';
import type { Hero, MatchState, PlayerId } from '../game/types';

type MatchAction =
  | { type: 'place'; player: PlayerId; cardUid: string; slotIndex: number }
  | { type: 'reveal' }
  | { type: 'next' }
  | { type: 'restart'; state: MatchState };

function reducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'place':
      return placeCard(state, action.player, action.cardUid, action.slotIndex);
    case 'reveal':
      return revealCombat(state);
    case 'next':
      return nextCombat(state);
    case 'restart':
      return action.state;
    default:
      return state;
  }
}

export interface UseMatchOptions {
  playerDeck: Hero[];
  opponentDeck: Hero[];
  target: number;
  onMatchEnd?: (winner: PlayerId) => void;
}

export interface UseMatchResult {
  state: MatchState;
  selectedCardUid: string | null;
  selectCard: (uid: string | null) => void;
  placeSelected: (slotIndex: number) => boolean;
  clearSelection: () => void;
  revealedCount: number;
  showSummary: boolean;
  visibleWins: Record<PlayerId, number>;
  displayedCombatWins: Record<PlayerId, number>;
  playerCanPlace: boolean;
  isAiThinking: boolean;
  error: string | null;
  next: () => void;
  restart: () => void;
}

/**
 * Orquesta una partida: turnos de la IA, revelado escalonado y avance de
 * combates. El motor sigue siendo puro; aquí solo viven los tiempos de UI.
 */
export function useMatch({
  playerDeck,
  opponentDeck,
  target,
  onMatchEnd,
}: UseMatchOptions): UseMatchResult {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createMatch({ playerDeck, opponentDeck, target }),
  );
  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onMatchEndRef = useRef(onMatchEnd);
  const recordedStateRef = useRef<MatchState | null>(null);

  useEffect(() => {
    onMatchEndRef.current = onMatchEnd;
  }, [onMatchEnd]);

  const isAiThinking = state.phase === 'placing' && state.turn === 'opponent';
  const playerCanPlace = state.phase === 'placing' && state.turn === 'player';

  // Turno de la IA. Depende del estado completo para decidir con las cartas
  // que ya están sobre la mesa; el cleanup evita jugadas duplicadas.
  useEffect(() => {
    if (!isAiThinking) return;

    const delay = GAME.aiDelayMs + Math.random() * 320;
    const timer = setTimeout(() => {
      try {
        const move = chooseAiMove(state, 'opponent');
        if (move) {
          dispatch({
            type: 'place',
            player: 'opponent',
            cardUid: move.cardUid,
            slotIndex: move.slotIndex,
          });
        }
      } catch (cause) {
        setError(
          cause instanceof GameError
            ? cause.message
            : 'El rival no pudo colocar su carta.',
        );
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isAiThinking, state]);

  // Al completarse el tablero, se revela automáticamente tras una pausa.
  useEffect(() => {
    if (state.phase !== 'revealing') return;
    const timer = setTimeout(() => {
      try {
        dispatch({ type: 'reveal' });
      } catch (cause) {
        setError(
          cause instanceof GameError ? cause.message : 'No se pudo revelar el combate.',
        );
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [state.phase, state.combatNumber]);

  // Revelado escalonado de los 5 duelos.
  useEffect(() => {
    if (!state.results) return;
    if (state.phase !== 'combatResult' && state.phase !== 'matchOver') return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let index = 1; index <= GAME.duelCount; index += 1) {
      timers.push(setTimeout(() => setRevealedCount(index), index * 190));
    }
    timers.push(
      setTimeout(() => setShowSummary(true), GAME.duelCount * 190 + 620),
    );

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [state.results, state.phase]);

  // Registrar la partida una sola vez.
  useEffect(() => {
    if (!state.winner) return;
    if (recordedStateRef.current === state) return;
    recordedStateRef.current = state;
    onMatchEndRef.current?.(state.winner);
  }, [state]);

  const selectCard = useCallback((uid: string | null) => {
    setSelectedCardUid(uid);
  }, []);

  const clearSelection = useCallback(() => setSelectedCardUid(null), []);

  const placeSelected = useCallback(
    (slotIndex: number): boolean => {
      if (!selectedCardUid || !playerCanPlace) return false;
      try {
        dispatch({
          type: 'place',
          player: 'player',
          cardUid: selectedCardUid,
          slotIndex,
        });
        setSelectedCardUid(null);
        setError(null);
        return true;
      } catch (cause) {
        setError(
          cause instanceof GameError ? cause.message : 'No se pudo colocar la carta.',
        );
        return false;
      }
    },
    [playerCanPlace, selectedCardUid],
  );

  const next = useCallback(() => {
    if (state.phase !== 'combatResult') return;
    setSelectedCardUid(null);
    setRevealedCount(0);
    setShowSummary(false);
    setError(null);
    dispatch({ type: 'next' });
  }, [state.phase]);

  const restart = useCallback(() => {
    setSelectedCardUid(null);
    setRevealedCount(0);
    setShowSummary(false);
    setError(null);
    dispatch({
      type: 'restart',
      state: createMatch({ playerDeck, opponentDeck, target }),
    });
  }, [opponentDeck, playerDeck, target]);

  const visibleWins = useMemo<Record<PlayerId, number>>(() => {
    if (!state.results) return { player: 0, opponent: 0 };
    return state.results.slice(0, revealedCount).reduce(
      (acc, result) => {
        if (result.winner !== 'draw') acc[result.winner] += 1;
        return acc;
      },
      { player: 0, opponent: 0 } as Record<PlayerId, number>,
    );
  }, [state.results, revealedCount]);

  // Durante la revelación el marcador de la partida no debe "cantar" el
  // resultado antes de que termine la animación.
  const displayedCombatWins = useMemo<Record<PlayerId, number>>(() => {
    const pending = !showSummary && (state.phase === 'combatResult' || state.phase === 'matchOver');
    if (!pending || !state.combatWinner || state.combatWinner === 'draw') {
      return state.combatWins;
    }
    return {
      ...state.combatWins,
      [state.combatWinner]: state.combatWins[state.combatWinner] - 1,
    };
  }, [showSummary, state.combatWinner, state.combatWins, state.phase]);

  return {
    state,
    selectedCardUid,
    selectCard,
    placeSelected,
    clearSelection,
    revealedCount,
    showSummary,
    visibleWins,
    displayedCombatWins,
    playerCanPlace,
    isAiThinking,
    error,
    next,
    restart,
  };
}
