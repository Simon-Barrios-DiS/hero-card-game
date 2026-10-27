import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, fonts, radii, spacing } from '../../theme';
import { hapticTap } from '../../utils/feedback';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 38, md: 48, lg: 56 };
const FONT_SIZES: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 };
const PADDING: Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 };

const GRADIENTS: Partial<Record<ButtonVariant, readonly [string, string, ...string[]]>> = {
  primary: [colors.accent, '#1E9BFF'],
  danger: [colors.magenta, '#C81E4A'],
  gold: [colors.gold, '#FFAA33'],
};

function contentColor(variant: ButtonVariant): string {
  return variant === 'primary' || variant === 'gold' ? '#04121F' : colors.text;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const textColor = contentColor(variant);
  const gradient = GRADIENTS[variant];

  const handlePress = () => {
    if (isDisabled) return;
    hapticTap();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHTS[size],
          paddingHorizontal: PADDING[size],
          backgroundColor:
            variant === 'secondary'
              ? colors.surfaceAlt
              : variant === 'ghost'
                ? 'rgba(255,255,255,0.03)'
                : 'transparent',
          borderColor:
            variant === 'secondary'
              ? 'rgba(56,225,255,0.42)'
              : variant === 'ghost'
                ? colors.borderStrong
                : 'rgba(255,255,255,0.16)',
        },
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={HEIGHTS[size] * 0.4} color={textColor} />
          ) : null}
          <AppText
            variant="label"
            size={FONT_SIZES[size]}
            color={textColor}
            style={styles.label}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {iconRight ? (
            <MaterialCommunityIcons
              name={iconRight}
              size={HEIGHTS[size] * 0.38}
              color={textColor}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  borderColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 40,
  color = colors.text,
  borderColor = colors.border,
  backgroundColor = 'rgba(12, 20, 36, 0.7)',
  style,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        hapticTap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          backgroundColor,
        },
        disabled ? styles.disabled : null,
        pressed && !disabled ? { opacity: 0.72, transform: [{ scale: 0.96 }] } : null,
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.48} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.condensedBold,
    letterSpacing: 1.6,
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
