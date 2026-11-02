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
import { buildFilledDeck } from '../game/deckRules';
import {
  COMPLETED_TUTORIAL,
  EMPTY_TUTORIAL,
  type TutorialState,
} from '../game/shop';
import { SEED_HEROES } from '../data/seedHeroes';
import { emptyRecord, loadPreferences } from '../data/storage';
import {
  loadAccountStore,
  saveAccountStore,
  type StoredUser,
} from '../data/authStorage';
import { createSalt, hashPassword } from '../utils/password';
import type { MatchRecord } from '../game/types';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,16}$/;
const MIN_PASSWORD_LENGTH = 6;

export type AuthResult =
  | { ok: true; user: StoredUser }
  | { ok: false; error: string };

interface AuthContextValue {
  ready: boolean;
  currentUser: StoredUser | null;
  login: (username: string, password: string) => AuthResult;
  register: (username: string, password: string) => AuthResult;
  logout: () => void;
  updateCurrentUser: (updater: (user: StoredUser) => StoredUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

interface NewUserOptions {
  id: string;
  username: string;
  password: string;
  tokens?: number;
  ownsAllCards?: boolean;
  deckIds?: number[];
  record?: MatchRecord;
  tutorial?: TutorialState;
}

function createUser({
  id,
  username,
  password,
  tokens = GAME.startingTokens,
  ownsAllCards = false,
  deckIds = [],
  record = emptyRecord(),
  tutorial = { ...EMPTY_TUTORIAL },
}: NewUserOptions): StoredUser {
  const passwordSalt = createSalt();
  return {
    id,
    username,
    passwordHash: hashPassword(password, passwordSalt),
    passwordSalt,
    tokens,
    ownsAllCards,
    ownedHeroIds: [],
    deckIds,
    record,
    tutorial,
    starterPlan: [],
    createdAt: Date.now(),
  };
}

async function buildSeedUsers(): Promise<StoredUser[]> {
  const legacy = await loadPreferences();
  const legacyDeck =
    legacy && legacy.deckIds.length > 0
      ? legacy.deckIds.slice(0, GAME.deckSize)
      : buildFilledDeck([], SEED_HEROES).map((hero) => hero.id);

  return [
    createUser({
      id: 'user_coleccion',
      username: 'coleccion',
      password: 'coleccion123',
      tokens: 1000,
      ownsAllCards: true,
      deckIds: legacyDeck,
      record: legacy?.record,
      tutorial: { ...COMPLETED_TUTORIAL },
    }),
    createUser({
      id: 'user_novato',
      username: 'novato',
      password: 'novato123',
    }),
  ];
}

function createUserId(): string {
  return `user_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const stored = await loadAccountStore();
      if (!active) return;

      if (stored) {
        setUsers(stored.users);
        setCurrentUserId(stored.currentUserId);
      } else {
        const seeded = await buildSeedUsers();
        if (!active) return;
        setUsers(seeded);
        setCurrentUserId(null);
      }

      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveAccountStore({ users, currentUserId });
  }, [users, currentUserId, ready]);

  const login = useCallback(
    (username: string, password: string): AuthResult => {
      const key = normalizeUsername(username);
      const user = users.find(
        (item) => normalizeUsername(item.username) === key,
      );
      if (!user) {
        return { ok: false, error: 'Usuario o contraseña incorrectos.' };
      }
      const hash = hashPassword(password, user.passwordSalt);
      if (hash !== user.passwordHash) {
        return { ok: false, error: 'Usuario o contraseña incorrectos.' };
      }
      setCurrentUserId(user.id);
      return { ok: true, user };
    },
    [users],
  );

  const register = useCallback(
    (username: string, password: string): AuthResult => {
      const cleanUsername = username.trim();
      if (!USERNAME_PATTERN.test(cleanUsername)) {
        return {
          ok: false,
          error: 'El usuario debe tener 3-16 letras, números o guiones bajos.',
        };
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        return {
          ok: false,
          error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        };
      }
      const key = normalizeUsername(cleanUsername);
      if (users.some((user) => normalizeUsername(user.username) === key)) {
        return { ok: false, error: 'Ese usuario ya existe.' };
      }

      const user = createUser({
        id: createUserId(),
        username: cleanUsername,
        password,
      });
      setUsers((previous) => [...previous, user]);
      setCurrentUserId(user.id);
      return { ok: true, user };
    },
    [users],
  );

  const logout = useCallback(() => setCurrentUserId(null), []);

  const updateCurrentUser = useCallback(
    (updater: (user: StoredUser) => StoredUser) => {
      if (!currentUserId) return;
      setUsers((previous) =>
        previous.map((user) =>
          user.id === currentUserId ? updater(user) : user,
        ),
      );
    },
    [currentUserId],
  );

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      currentUser,
      login,
      register,
      logout,
      updateCurrentUser,
    }),
    [ready, currentUser, login, register, logout, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}
