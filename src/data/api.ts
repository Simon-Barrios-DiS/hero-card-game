import type { Hero, HeroDetailResult } from '../game/types';

/**
 * Capa de datos de Superhero API.
 *
 * - La API oficial (superheroapi.com) necesita un token personal y no ofrece
 *   un endpoint para listar todo el catálogo.
 * - El listado completo se obtiene del espejo público del mismo dataset
 *   (akabab/superhero-api), que además sirve los retratos por CDN.
 * - Si hay token, la ficha de cada héroe se refresca contra la API oficial.
 */
const MIRROR_API = 'https://akabab.github.io/superhero-api/api';
const OFFICIAL_API = 'https://superheroapi.com/api';
const IMAGE_CDN = 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md';

export const OFFICIAL_TOKEN = (
  process.env.EXPO_PUBLIC_SUPERHERO_API_TOKEN ?? ''
).trim();
export const HAS_OFFICIAL_TOKEN = OFFICIAL_TOKEN.length > 0;

export const DATA_ATTRIBUTION =
  'Datos y retratos: Superhero API · espejo público akabab/superhero-api';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const cleanString = (value: unknown, fallback = '—'): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const text = String(value).trim();
  if (!text || text === '-' || text === 'No alter egos found.') return fallback;
  return text;
};

const cleanOptional = (value: unknown): string =>
  cleanString(value, '');

const cleanList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanOptional(item))
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const toStat = (value: unknown): number => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const normalizePublisher = (value: unknown): string => {
  const text = cleanOptional(value);
  if (/marvel/i.test(text)) return 'Marvel Comics';
  if (/\bdc\b/i.test(text)) return 'DC Comics';
  return text || 'Independiente';
};

const normalizeAlignment = (value: unknown): string => {
  const text = cleanOptional(value).toLowerCase();
  if (text.includes('good')) return 'good';
  if (text.includes('bad')) return 'bad';
  return 'neutral';
};

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function joinMeasure(value: unknown): string {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => cleanOptional(item))
      .filter(Boolean)
      .slice(0, 2);
    return items.length > 0 ? items.join(' / ') : '—';
  }
  return cleanString(value);
}

function normalizeHero(rawValue: unknown): Hero | null {
  const raw = asRecord(rawValue);
  const id = Number(raw.id);
  const name = cleanOptional(raw.name);
  if (!Number.isInteger(id) || id <= 0 || !name) return null;

  const powerstats = asRecord(raw.powerstats);
  const biography = asRecord(raw.biography);
  const appearance = asRecord(raw.appearance);
  const work = asRecord(raw.work);
  const connections = asRecord(raw.connections);
  const images = asRecord(raw.images);
  const officialImage = asRecord(raw.image);

  const imageUrl =
    cleanOptional(images.md) ||
    cleanOptional(officialImage.url) ||
    `${IMAGE_CDN}/${id}-${slugify(name)}.jpg`;

  return {
    id,
    name,
    fullName: cleanOptional(biography.fullName),
    publisher: normalizePublisher(biography.publisher),
    alignment: normalizeAlignment(biography.alignment),
    imageUrl,
    stats: {
      intelligence: toStat(powerstats.intelligence),
      strength: toStat(powerstats.strength),
      speed: toStat(powerstats.speed),
      durability: toStat(powerstats.durability),
      power: toStat(powerstats.power),
      combat: toStat(powerstats.combat),
    },
    firstAppearance: cleanString(biography.firstAppearance),
    aliases: cleanList(biography.aliases),
    occupation: cleanString(work.occupation),
    base: cleanString(work.base),
    groupAffiliation: cleanString(connections.groupAffiliation),
    appearance: {
      gender: cleanString(appearance.gender),
      race: cleanString(appearance.race),
      height: joinMeasure(appearance.height),
      weight: joinMeasure(appearance.weight),
      eyeColor: cleanString(appearance.eyeColor),
      hairColor: cleanString(appearance.hairColor),
    },
  };
}

async function fetchJson(url: string, timeoutMs = 25000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`La API respondió HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

let catalogInFlight: Promise<Hero[]> | null = null;

/** Descarga el catálogo completo. Las llamadas simultáneas comparten petición. */
export function fetchCatalog(): Promise<Hero[]> {
  if (!catalogInFlight) {
    catalogInFlight = requestCatalog().finally(() => {
      catalogInFlight = null;
    });
  }
  return catalogInFlight;
}

async function requestCatalog(): Promise<Hero[]> {
  const payload = await fetchJson(`${MIRROR_API}/all.json`);
  if (!Array.isArray(payload)) {
    throw new Error('El catálogo recibido no tiene el formato esperado.');
  }

  const seen = new Set<number>();
  const heroes: Hero[] = [];

  for (const item of payload) {
    const hero = normalizeHero(item);
    if (!hero || seen.has(hero.id)) continue;
    seen.add(hero.id);
    heroes.push(hero);
  }

  if (heroes.length < 20) {
    throw new Error('El catálogo llegó incompleto.');
  }

  return heroes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Refresca una ficha contra la API oficial si hay token configurado.
 * Nunca rompe la partida: ante cualquier fallo devuelve el héroe del catálogo.
 */
export async function getHeroDetails(hero: Hero): Promise<HeroDetailResult> {
  if (!HAS_OFFICIAL_TOKEN) {
    return { hero, source: 'catalog' };
  }

  try {
    const payload = await fetchJson(
      `${OFFICIAL_API}/${encodeURIComponent(OFFICIAL_TOKEN)}/${hero.id}`,
      15000,
    );
    const raw = asRecord(payload);
    if (raw.response === 'error') {
      throw new Error(cleanOptional(raw.error) || 'La API oficial devolvió un error.');
    }

    const official = normalizeHero(raw);
    if (!official) throw new Error('La API oficial no devolvió datos válidos.');

    return {
      // Los retratos oficiales no están disponibles actualmente; conservamos
      // el del catálogo para que la carta siempre tenga imagen.
      hero: { ...official, imageUrl: hero.imageUrl },
      source: 'official-api',
    };
  } catch (error) {
    return {
      hero,
      source: 'catalog',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
