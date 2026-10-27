import { Platform } from 'react-native';

export const colors = {
  bg: '#070B16',
  bgDeep: '#04070F',
  bgSoft: '#0B1222',
  surface: '#0F1729',
  surfaceAlt: '#141E35',
  surfaceRaised: '#1A2743',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#F4F7FF',
  textMuted: '#9AA8C7',
  textDim: '#7C8AA9',
  accent: '#38E1FF',
  accentDeep: '#0B8CFF',
  accentSoft: 'rgba(56, 225, 255, 0.14)',
  magenta: '#FF3D6E',
  magentaSoft: 'rgba(255, 61, 110, 0.14)',
  gold: '#FFD166',
  goldSoft: 'rgba(255, 209, 102, 0.14)',
  green: '#32E6A3',
  greenSoft: 'rgba(50, 230, 163, 0.14)',
  red: '#FF5A5F',
  redSoft: 'rgba(255, 90, 95, 0.14)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(4, 8, 16, 0.82)',
  scrim: 'rgba(3, 6, 13, 0.66)',
} as const;

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'system-ui',
});

const systemMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'system-ui',
});

export const fonts = {
  display: 'Bangers_400Regular',
  condensed: 'BarlowCondensed_500Medium',
  condensedSemi: 'BarlowCondensed_600SemiBold',
  condensedBold: 'BarlowCondensed_700Bold',
  condensedBlack: 'BarlowCondensed_900Black',
  body: systemFont,
  bodyMedium: systemMedium,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
  xxxl: 44,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const layout = {
  maxWidth: 640,
  screenPadding: 18,
  tabBarHeight: 58,
} as const;

export const publisherColors: Record<string, string> = {
  'Marvel Comics': '#ED1D24',
  'DC Comics': '#2E7DFF',
};

export function publisherColor(publisher: string): string {
  if (/marvel/i.test(publisher)) return publisherColors['Marvel Comics'];
  if (/\bdc\b/i.test(publisher)) return publisherColors['DC Comics'];
  return colors.textDim;
}

export function alignmentInfo(alignment: string): { label: string; color: string } {
  const value = alignment.toLowerCase();
  if (value === 'good') return { label: 'Héroe', color: colors.green };
  if (value === 'bad') return { label: 'Villano', color: colors.red };
  return { label: 'Neutral', color: colors.gold };
}

/** Convierte #RRGGBB en rgba() para poder usar transparencias. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const red = parseInt(clean.slice(0, 2), 16);
  const green = parseInt(clean.slice(2, 4), 16);
  const blue = parseInt(clean.slice(4, 6), 16);
  if ([red, green, blue].some((channel) => Number.isNaN(channel))) return hex;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export const avatarTints = [
  '#16233D',
  '#231A3B',
  '#103128',
  '#321D1A',
  '#1B2A35',
  '#2B2030',
] as const;

export function avatarTint(id: number): string {
  return avatarTints[Math.abs(id) % avatarTints.length];
}

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
    },
    android: { elevation: 8 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
    },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
  }),
} as const;
