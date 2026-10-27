import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Hero, QualityId } from './types';
import { GAME } from './config';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface Quality {
  id: QualityId;
  label: string;
  short: string;
  description: string;
  color: string;
  softColor: string;
  icon: IconName;
  /** Si es false, la cualidad existe en los datos pero no se juega todavía. */
  active: boolean;
}

/**
 * Para añadir una cualidad nueva al juego basta con:
 *  1. Añadir su clave a QualityId y a HeroStats (si no existe ya).
 *  2. Añadirla aquí y poner active: true.
 *
 * El motor reparte `GAME.duelCount` cualidades distintas al azar en cada
 * combate, así que con 6 activas se jugarían 5 de 6 por combate.
 */
export const QUALITIES: Quality[] = [
  {
    id: 'intelligence',
    label: 'Inteligencia',
    short: 'INT',
    description: 'Estrategia, astucia y poder mental.',
    color: '#6FA8FF',
    softColor: 'rgba(111, 168, 255, 0.16)',
    icon: 'brain',
    active: true,
  },
  {
    id: 'strength',
    label: 'Fuerza',
    short: 'FUE',
    description: 'Potencia física y capacidad de golpe.',
    color: '#FF7A59',
    softColor: 'rgba(255, 122, 89, 0.16)',
    icon: 'arm-flex',
    active: true,
  },
  {
    id: 'speed',
    label: 'Velocidad',
    short: 'VEL',
    description: 'Reflejos, agilidad y desplazamiento.',
    color: '#2EE6A8',
    softColor: 'rgba(46, 230, 168, 0.16)',
    icon: 'lightning-bolt',
    active: true,
  },
  {
    id: 'durability',
    label: 'Resistencia',
    short: 'RES',
    description: 'Aguante, defensa y capacidad de recibir daño.',
    color: '#FFC857',
    softColor: 'rgba(255, 200, 87, 0.16)',
    icon: 'shield-half-full',
    active: true,
  },
  {
    id: 'combat',
    label: 'Combate',
    short: 'CBT',
    description: 'Técnica, experiencia y dominio de la pelea.',
    color: '#FF4D8D',
    softColor: 'rgba(255, 77, 141, 0.16)',
    icon: 'sword-cross',
    active: true,
  },
  {
    id: 'power',
    label: 'Poder',
    short: 'POD',
    description: 'Energía y habilidades especiales. Próximamente.',
    color: '#A78BFA',
    softColor: 'rgba(167, 139, 250, 0.16)',
    icon: 'flare',
    active: false,
  },
];

export const QUALITY_BY_ID: Record<QualityId, Quality> = QUALITIES.reduce(
  (acc, quality) => {
    acc[quality.id] = quality;
    return acc;
  },
  {} as Record<QualityId, Quality>,
);

/** Cualidades que se pueden sortear en un combate. */
export const ACTIVE_QUALITIES: QualityId[] = QUALITIES.filter((q) => q.active).map(
  (q) => q.id,
);

/** Cualidades que puntúan en la carta (las activas). */
export const SCORED_QUALITIES: Quality[] = QUALITIES.filter((q) => q.active);

export function getStat(hero: Hero, quality: QualityId): number {
  return Math.max(0, Math.min(GAME.maxStat, Number(hero.stats[quality]) || 0));
}

/** Media de las cualidades que se juegan, redondeada. */
export function overallRating(hero: Hero): number {
  if (SCORED_QUALITIES.length === 0) return 0;
  const total = SCORED_QUALITIES.reduce((sum, q) => sum + getStat(hero, q.id), 0);
  return Math.round(total / SCORED_QUALITIES.length);
}

/** Suma de todas las cualidades. Sirve para emparejar mazos. */
export function heroPower(hero: Hero): number {
  return SCORED_QUALITIES.reduce((sum, q) => sum + getStat(hero, q.id), 0);
}
