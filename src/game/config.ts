/**
 * Constantes de diseño del juego.
 *
 * Todo lo que se pueda querer balancear más adelante vive aquí.
 * Las cualidades y sus valores (0-100) vienen del dataset de Superhero API.
 */
export const GAME = {
  /** Cartas que recibe cada jugador al inicio de cada combate. */
  handSize: 5,
  /** Número de duelos (y de huecos) por combate. */
  duelCount: 5,
  /** Duelos que hay que ganar para llevarse un combate. */
  duelsToWinCombat: 3,
  /** Combates que hay que ganar para llevarse una partida clásica. */
  combatsToWinMatch: 10,
  /** Combates para la partida rápida (útil para probar). */
  quickMatchTarget: 3,
  /** Tokens que se ganan por cada ronda (combate) ganada. */
  tokensPerCombatWin: 5,
  /** Tokens iniciales de una cuenta nueva. */
  startingTokens: 50,
  /** Héroes distintos que puede tener un mazo: 1 SSR + 9 SR + 20 comunes. */
  deckSize: 30,
  /** Mínimo de cartas para poder jugar: el mazo debe estar completo. */
  minDeckSize: 30,
  /** Valor máximo de una cualidad. */
  maxStat: 100,
  /** Milisegundos de espera del rival para que sus jugadas se vean. */
  aiDelayMs: 850,
} as const;

export const MATCH_TARGETS = [GAME.quickMatchTarget, GAME.combatsToWinMatch] as const;
export type MatchTarget = (typeof MATCH_TARGETS)[number];

export const isMatchTarget = (value: unknown): value is MatchTarget =>
  MATCH_TARGETS.includes(Number(value) as MatchTarget);
