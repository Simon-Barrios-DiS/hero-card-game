/**
 * Tipos centrales del juego. Mantenerlos libres de dependencias de React
 * permite reutilizar el motor en tests, simulaciones o una futura API.
 */

export type PlayerId = 'player' | 'opponent';

export type QualityId =
  | 'intelligence'
  | 'strength'
  | 'speed'
  | 'durability'
  | 'combat'
  /** Presente en los datos de la API, todavía no se juega. */
  | 'power';

export type HeroStats = Record<QualityId, number>;

export interface HeroAppearance {
  gender: string;
  race: string;
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;
}

export interface Hero {
  id: number;
  name: string;
  fullName: string;
  publisher: string;
  alignment: string;
  imageUrl: string;
  stats: HeroStats;
  firstAppearance: string;
  aliases: string[];
  occupation: string;
  base: string;
  groupAffiliation: string;
  appearance: HeroAppearance;
}

/** Carta dentro de una mano. El uid evita colisiones entre combates. */
export interface HandCard {
  uid: string;
  hero: Hero;
}

export type DuelWinner = PlayerId | 'draw';

export interface DuelResult {
  slotIndex: number;
  quality: QualityId;
  playerCard: HandCard;
  opponentCard: HandCard;
  playerValue: number;
  opponentValue: number;
  winner: DuelWinner;
}

export interface CombatSummary {
  combatNumber: number;
  qualities: QualityId[];
  results: DuelResult[];
  duelWins: Record<PlayerId, number>;
  winner: DuelWinner;
}

export type MatchPhase =
  | 'placing'
  | 'revealing'
  | 'combatResult'
  | 'matchOver';

export interface MatchState {
  phase: MatchPhase;
  /** Combates que hay que ganar para llevarse la partida. */
  target: number;
  /** Número de combate actual, empieza en 1. */
  combatNumber: number;
  qualities: QualityId[];
  turn: PlayerId;
  startingPlayer: PlayerId;
  decks: Record<PlayerId, Hero[]>;
  hands: Record<PlayerId, HandCard[]>;
  placements: Record<PlayerId, (HandCard | null)[]>;
  /** Duelos ganados en el combate actual. */
  duelWins: Record<PlayerId, number>;
  /** Combates ganados en toda la partida. */
  combatWins: Record<PlayerId, number>;
  results: DuelResult[] | null;
  combatWinner: DuelWinner | null;
  winner: PlayerId | null;
  totalPlacements: number;
  history: CombatSummary[];
}

export interface MatchRecord {
  wins: number;
  losses: number;
  draws: number;
  matches: number;
}

export interface HeroDetailResult {
  hero: Hero;
  source: 'catalog' | 'official-api';
  error?: string;
}
