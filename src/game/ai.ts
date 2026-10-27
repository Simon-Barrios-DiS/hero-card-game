import { GAME } from './config';
import { getEmptySlots, otherPlayer } from './engine';
import { getStat } from './qualities';
import { clamp, type Rng } from './random';
import type { MatchState, PlayerId } from './types';

export interface AiMove {
  cardUid: string;
  slotIndex: number;
}

/**
 * Probabilidad estimada de que un valor supere a una carta desconocida.
 * La distribución real de powerstats se concentra en valores bajos, por eso
 * el punto medio está en ~47.
 */
function estimateWinProbability(value: number): number {
  return clamp(1 / (1 + Math.exp(-(value - 47) / 16)), 0.05, 0.95);
}

/** Probabilidad de ganar al menos `needed` duelos. */
export function probabilityAtLeast(pValues: readonly number[], needed: number): number {
  const dp = new Array<number>(pValues.length + 1).fill(0);
  dp[0] = 1;
  let maxWins = 0;

  for (const p of pValues) {
    for (let wins = maxWins; wins >= 0; wins -= 1) {
      const previous = dp[wins];
      dp[wins] = previous * (1 - p);
      dp[wins + 1] += previous * p;
    }
    maxWins += 1;
  }

  let result = 0;
  for (let wins = needed; wins <= pValues.length; wins += 1) result += dp[wins];
  return clamp(result, 0, 1);
}

function permutations(count: number): number[][] {
  if (count <= 1) return [Array.from({ length: count }, (_, i) => i)];
  const result: number[][] = [];
  const current: number[] = [];
  const used = new Array<boolean>(count).fill(false);

  const walk = () => {
    if (current.length === count) {
      result.push(current.slice());
      return;
    }
    for (let i = 0; i < count; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      current.push(i);
      walk();
      current.pop();
      used[i] = false;
    }
  };

  walk();
  return result;
}

/**
 * Elige la jugada del rival.
 *
 * Estrategia: evalúa todas las asignaciones posibles de sus cartas restantes
 * a los huecos libres y maximiza la probabilidad de llevarse el combate
 * (no solo la suma de duelos). Luego juega la pareja más valiosa del plan,
 * dando prioridad a los duelos que ya puede ganar con seguridad.
 *
 * Es deliberadamente imperfecto (ruido + heurística) para que se pueda
 * ajustar la dificultad más adelante.
 */
export function chooseAiMove(
  state: MatchState,
  ai: PlayerId = 'opponent',
  rng: Rng = Math.random,
): AiMove | null {
  if (state.phase !== 'placing' || state.turn !== ai) return null;

  const human = otherPlayer(ai);
  const cards = state.hands[ai];
  const slots = getEmptySlots(state, ai);
  if (cards.length === 0 || slots.length === 0) return null;

  const count = Math.min(cards.length, slots.length);
  const planSlots = slots.slice(0, count);
  const planCards = cards.slice(0, count);

  // Ruido fijo por pareja carta/hueco: hace que la IA no sea perfecta y que
  // dos partidas con las mismas cartas no se jueguen igual.
  const noise: number[][] = planCards.map(() =>
    planSlots.map(() => (rng() - 0.5) * 0.06),
  );

  const pairProbability = (cardIndex: number, slotIndex: number): number => {
    const card = planCards[cardIndex];
    const quality = state.qualities[slotIndex];
    const value = getStat(card.hero, quality);
    const opponentCard = state.placements[human][slotIndex];

    let p: number;
    if (opponentCard) {
      const opponentValue = getStat(opponentCard.hero, quality);
      p = value > opponentValue ? 1 : value === opponentValue ? 0.5 : 0;
    } else {
      p = estimateWinProbability(value);
    }
    return clamp(p + noise[cardIndex][slotIndex], 0.01, 0.99);
  };

  // Probabilidad de cada duelo que no depende de la asignación que probamos.
  const baseProbabilities: number[] = state.qualities.map((quality, slotIndex) => {
    const aiCard = state.placements[ai][slotIndex];
    const humanCard = state.placements[human][slotIndex];
    if (aiCard && humanCard) {
      const aiValue = getStat(aiCard.hero, quality);
      const humanValue = getStat(humanCard.hero, quality);
      return aiValue > humanValue ? 1 : aiValue === humanValue ? 0.5 : 0;
    }
    if (aiCard) {
      // La carta del humano todavía no está colocada.
      return estimateWinProbability(getStat(aiCard.hero, quality));
    }
    return 0; // lo rellena el plan
  });

  let bestScore = -Infinity;
  let bestPermutation: number[] = Array.from({ length: count }, (_, i) => i);

  for (const permutation of permutations(count)) {
    const probabilities = baseProbabilities.slice();
    let expectedWins = 0;

    for (let i = 0; i < count; i += 1) {
      const p = pairProbability(permutation[i], planSlots[i]);
      probabilities[planSlots[i]] = p;
      expectedWins += p;
    }

    const combatProbability = probabilityAtLeast(probabilities, GAME.duelsToWinCombat);
    const score = combatProbability * 8 + expectedWins * 0.35;

    if (score > bestScore) {
      bestScore = score;
      bestPermutation = permutation;
    }
  }

  // De la mejor asignación, jugar la pareja más segura/valiosa ahora.
  let chosenCard = planCards[bestPermutation[0]];
  let chosenSlot = planSlots[0];
  let chosenScore = -Infinity;

  for (let i = 0; i < count; i += 1) {
    const card = planCards[bestPermutation[i]];
    const slotIndex = planSlots[i];
    const value = getStat(card.hero, state.qualities[slotIndex]);
    const opponentCard = state.placements[human][slotIndex];
    const guaranteed =
      opponentCard !== null &&
      value > getStat(opponentCard.hero, state.qualities[slotIndex]);
    const p = pairProbability(bestPermutation[i], slotIndex);
    const moveScore = (guaranteed ? 2 : 0) + p + (value / GAME.maxStat) * 0.05;

    if (moveScore > chosenScore) {
      chosenScore = moveScore;
      chosenCard = card;
      chosenSlot = slotIndex;
    }
  }

  return { cardUid: chosenCard.uid, slotIndex: chosenSlot };
}
