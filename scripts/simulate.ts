/**
 * Simulación de partidas sin interfaz para validar el motor y la IA.
 * Ejecutar con: npm run simulate
 */
import {
  createMatch,
  nextCombat,
  placeCard,
  revealCombat,
  visibleDuelWins,
} from '../src/game/engine';
import { chooseAiMove } from '../src/game/ai';
import { GAME } from '../src/game/config';
import { SEED_HEROES } from '../src/data/seedHeroes';
import { mulberry32, sample } from '../src/game/random';
import type { MatchState, PlayerId } from '../src/game/types';

const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function pickRandomMove(state: MatchState, player: PlayerId, rng: () => number) {
  const slots = state.placements[player]
    .map((card, index) => (card ? -1 : index))
    .filter((index) => index >= 0);
  const cards = state.hands[player];
  const card = cards[Math.floor(rng() * cards.length)];
  const slot = slots[Math.floor(rng() * slots.length)];
  return { cardUid: card.uid, slotIndex: slot };
}

function simulateMatch(
  target: number,
  seed: number,
  playerStyle: 'ai' | 'random',
): { combats: number; winner: PlayerId | 'draw'; duelTally: number[] } {
  const rng = mulberry32(seed);
  const deckA = sample(SEED_HEROES, GAME.deckSize, rng);
  const deckB = sample(SEED_HEROES, GAME.deckSize, rng);
  let state = createMatch({
    playerDeck: deckA,
    opponentDeck: deckB,
    target,
    rng,
  });

  let guard = 0;
  const duelTally: number[] = [];

  while (state.phase !== 'matchOver') {
    guard += 1;
    if (guard > 2000) throw new Error('La partida no terminó (posible bucle).');

    if (state.phase === 'placing') {
      const player = state.turn;
      const move =
        player === 'player' && playerStyle === 'random'
          ? pickRandomMove(state, player, rng)
          : chooseAiMove(state, player, rng);
      check(Boolean(move), `Sin jugada para ${player} en el combate ${state.combatNumber}.`);
      if (!move) break;

      state = placeCard(state, player, move.cardUid, move.slotIndex);

      if (state.phase === 'revealing') {
        check(state.hands.player.length === 0, 'La mano del jugador no quedó vacía.');
        check(state.hands.opponent.length === 0, 'La mano del rival no quedó vacía.');
        check(
          state.totalPlacements === GAME.duelCount * 2,
          `Colocaciones inesperadas: ${state.totalPlacements}.`,
        );

        const before = { ...state.combatWins };
        state = revealCombat(state);
        duelTally.push(state.results?.filter((r) => r.winner === 'player').length ?? 0);

        check(state.results?.length === GAME.duelCount, 'El número de resultados no es 5.');
        check(
          state.combatWinner === 'draw' ||
            (state.combatWinner !== null &&
              state.combatWins[state.combatWinner] ===
                before[state.combatWinner] + 1),
          'El marcador de combates no se actualizó bien.',
        );

        const wins =
          (state.results?.filter((r) => r.winner === 'player').length ?? 0) +
          (state.results?.filter((r) => r.winner === 'opponent').length ?? 0);
        check(
          state.results?.length !== 5 ||
            (state.results.filter((r) => r.winner === 'draw').length ===
              GAME.duelCount - wins),
          'Los empates no cuadran.',
        );
      }
    } else if (state.phase === 'combatResult') {
      check(
        state.combatWins.player < target && state.combatWins.opponent < target,
        'Se siguió jugando después de alcanzar el objetivo.',
      );
      state = nextCombat(state, rng);
    } else {
      break;
    }
  }

  check(state.winner !== null, 'La partida terminó sin ganador.');
  if (state.winner) {
    check(
      state.combatWins[state.winner] >= target,
      'El ganador no alcanzó el objetivo.',
    );
    check(
      state.combatWins[state.winner === 'player' ? 'opponent' : 'player'] < target,
      'El rival también alcanzó el objetivo.',
    );
  }

  const visible = visibleDuelWins(state, GAME.duelCount);
  check(
    visible.player === state.duelWins.player &&
      visible.opponent === state.duelWins.opponent,
    'El marcador visible de duelos no coincide.',
  );

  return {
    combats: state.history.length,
    winner: state.winner ?? 'draw',
    duelTally,
  };
}

const runs = Number(process.argv[2] ?? 250);
const results = { player: 0, opponent: 0, draw: 0 };
const combatCounts: number[] = [];
const duelTally: number[] = [];

for (let i = 0; i < runs; i += 1) {
  const target = i % 2 === 0 ? GAME.quickMatchTarget : GAME.combatsToWinMatch;
  const style = i % 3 === 0 ? 'random' : 'ai';
  try {
    const result = simulateMatch(target, 1000 + i, style);
    results[result.winner] += 1;
    combatCounts.push(result.combats);
    duelTally.push(...result.duelTally);
  } catch (error) {
    errors.push(`Partida ${i}: ${(error as Error).message}`);
  }
}

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

console.log(`Partidas simuladas: ${runs}`);
console.log(
  `Victorias: jugador ${results.player} · rival ${results.opponent} · empates ${results.draw}`,
);
console.log(`Combates por partida (media): ${average(combatCounts).toFixed(2)}`);
console.log(`Duelos ganados por combate (media): ${average(duelTally).toFixed(2)} / 5`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(es):`);
  for (const error of errors.slice(0, 20)) console.error(` - ${error}`);
  process.exit(1);
}
console.log('\nMotor e IA: OK');
