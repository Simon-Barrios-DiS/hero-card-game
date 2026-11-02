import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { fonts } from '../../theme';
import type { Rarity } from '../../game/rarity';

/** Dorado para SSR, plateado para SR. */
export const RARITY_COLORS: Record<
  Rarity,
  { color: string; backgroundColor: string; softColor: string }
> = {
  SSR: {
    color: '#FFD166',
    backgroundColor: 'rgba(48, 36, 8, 0.92)',
    softColor: 'rgba(255, 209, 102, 0.16)',
  },
  SR: {
    color: '#CBD5E1',
    backgroundColor: 'rgba(26, 35, 50, 0.92)',
    softColor: 'rgba(203, 213, 225, 0.14)',
  },
};

type BadgeSize = 'xs' | 'sm' | 'md';

const SIZES: Record<
  BadgeSize,
  {
    fontSize: number;
    paddingHorizontal: number;
    paddingVertical: number;
    letterSpacing: number;
  }
> = {
  xs: { fontSize: 7, paddingHorizontal: 3, paddingVertical: 1, letterSpacing: 0.4 },
  sm: { fontSize: 9, paddingHorizontal: 4, paddingVertical: 1.5, letterSpacing: 0.6 },
  md: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 0.8 },
};

interface RarityBadgeProps {
  rarity: Rarity;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
}

/**
 * Etiqueta de rareza de la carta. Se coloca encima del arte: arriba a la
 * izquierda en las cartas de combate y arriba a la derecha en el compendio.
 */
export function RarityBadge({ rarity, size = 'sm', style }: RarityBadgeProps) {
  const palette = RARITY_COLORS[rarity];
  const dims = SIZES[size];

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.color,
          paddingHorizontal: dims.paddingHorizontal,
          paddingVertical: dims.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: palette.color,
            fontSize: dims.fontSize,
            lineHeight: dims.fontSize + 1,
            letterSpacing: dims.letterSpacing,
          },
        ]}
      >
        {rarity}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.condensedBlack,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
