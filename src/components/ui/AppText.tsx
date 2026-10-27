import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '../../theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyBold'
  | 'label'
  | 'caption'
  | 'stat'
  | 'score';

const VARIANT_STYLES: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 58,
    lineHeight: 56,
    letterSpacing: 0.8,
    color: colors.text,
    includeFontPadding: false,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 38,
    letterSpacing: 0.6,
    color: colors.text,
    includeFontPadding: false,
  },
  heading: {
    fontFamily: fonts.condensedBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.5,
    color: colors.text,
  },
  subheading: {
    fontFamily: fonts.condensedSemi,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.3,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  bodyBold: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  label: {
    fontFamily: fonts.condensedBold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text,
  },
  caption: {
    fontFamily: fonts.condensed,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  stat: {
    fontFamily: fonts.condensedBold,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  score: {
    fontFamily: fonts.condensedBlack,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  size?: number;
  align?: TextStyle['textAlign'];
  tabular?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  size,
  align,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        VARIANT_STYLES[variant],
        color ? { color } : null,
        size !== undefined ? { fontSize: size } : null,
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
