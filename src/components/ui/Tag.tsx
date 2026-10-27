import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, spacing, withAlpha } from '../../theme';
import { AppText } from './AppText';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface TagProps {
  label: string;
  color?: string;
  background?: string;
  icon?: IconName;
  size?: 'xs' | 'sm';
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}

export function Tag({
  label,
  color = colors.textMuted,
  background,
  icon,
  size = 'sm',
  style,
  numberOfLines = 1,
}: TagProps) {
  const compact = size === 'xs';
  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: background ?? withAlpha(color, 0.13),
          borderColor: withAlpha(color, 0.28),
          paddingHorizontal: compact ? 6 : 8,
          paddingVertical: compact ? 2 : 3,
          borderRadius: radii.pill,
        },
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons name={icon} size={compact ? 9 : 11} color={color} />
      ) : null}
      <AppText
        variant="label"
        size={compact ? 8 : 9}
        color={color}
        numberOfLines={numberOfLines}
        style={{ letterSpacing: compact ? 0.8 : 1 }}
      >
        {label}
      </AppText>
    </View>
  );
}

interface StatBarProps {
  value: number;
  color: string;
  height?: number;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatBar({
  value,
  color,
  height = 6,
  trackColor = 'rgba(255,255,255,0.07)',
  style,
}: StatBarProps) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={{
          width: `${safe}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

interface QualityChipProps {
  color: string;
  short: string;
  label: string;
  icon: IconName;
  size?: 'sm' | 'md';
}

export function QualityChip({ color, short, label, icon, size = 'sm' }: QualityChipProps) {
  const big = size === 'md';
  return (
    <View
      style={[
        styles.qualityChip,
        {
          backgroundColor: withAlpha(color, 0.12),
          borderColor: withAlpha(color, 0.3),
          paddingHorizontal: big ? 10 : 7,
          paddingVertical: big ? 6 : 3,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={big ? 15 : 11} color={color} />
      <AppText
        variant="label"
        size={big ? 11 : 9}
        color={color}
        style={{ letterSpacing: 1 }}
      >
        {big ? label : short}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  qualityChip: {
    borderWidth: 1,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
});
