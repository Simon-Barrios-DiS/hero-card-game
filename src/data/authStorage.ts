import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_TUTORIAL, type TutorialState } from '../game/shop';
import { emptyRecord } from './storage';
import type { MatchRecord } from '../game/types';

const ACCOUNTS_KEY = '@hero-card-game/accounts/v2';

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  tokens: number;
  ownsAllCards: boolean;
  ownedHeroIds: number[];
  deckIds: number[];
  record: MatchRecord;
  tutorial: TutorialState;
  /** Cartas reservadas para el set inicial de una cuenta nueva. */
  starterPlan: number[];
  createdAt: number;
}

export interface AccountStore {
  users: StoredUser[];
  currentUserId: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const safeNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function parseIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
}

function parseRecord(value: unknown): MatchRecord {
  if (!isRecord(value)) return emptyRecord();
  return {
    wins: Math.max(0, safeNumber(value.wins)),
    losses: Math.max(0, safeNumber(value.losses)),
    draws: Math.max(0, safeNumber(value.draws)),
    matches: Math.max(0, safeNumber(value.matches)),
  };
}

function parseTutorial(value: unknown): TutorialState {
  if (!isRecord(value)) return { ...EMPTY_TUTORIAL };
  const singleBought = value.singleBought === true;
  const fiveBought = value.fiveBought === true;
  return {
    singleBought,
    fiveBought,
    completed: singleBought && fiveBought,
  };
}

function parseUser(value: unknown): StoredUser | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const username = typeof value.username === 'string' ? value.username.trim() : '';
  const passwordHash =
    typeof value.passwordHash === 'string' ? value.passwordHash : '';
  const passwordSalt =
    typeof value.passwordSalt === 'string' ? value.passwordSalt : '';
  if (!id || !username || !passwordHash || !passwordSalt) return null;

  return {
    id,
    username,
    passwordHash,
    passwordSalt,
    tokens: Math.max(0, Math.floor(safeNumber(value.tokens, 0))),
    ownsAllCards: value.ownsAllCards === true,
    ownedHeroIds: parseIdList(value.ownedHeroIds),
    deckIds: parseIdList(value.deckIds),
    record: parseRecord(value.record),
    tutorial: parseTutorial(value.tutorial),
    starterPlan: parseIdList(value.starterPlan),
    createdAt: safeNumber(value.createdAt, Date.now()),
  };
}

export async function loadAccountStore(): Promise<AccountStore | null> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.users)) return null;

    const users = parsed.users
      .map(parseUser)
      .filter((user): user is StoredUser => Boolean(user));
    if (users.length === 0) return null;

    const currentUserId =
      typeof parsed.currentUserId === 'string' &&
      users.some((user) => user.id === parsed.currentUserId)
        ? parsed.currentUserId
        : null;

    return { users, currentUserId };
  } catch {
    return null;
  }
}

export async function saveAccountStore(store: AccountStore): Promise<void> {
  try {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(store));
  } catch {
    // Guardar cuentas es una mejora: nunca debe romper la sesión actual.
  }
}
