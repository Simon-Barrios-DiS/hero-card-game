import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, spacing, withAlpha } from '../../theme';
import { AppText } from './AppText';

export interface ToastData {
  text: string;
  tone?: 'info' | 'success' | 'error';
}

interface ToastProps {
  data: ToastData | null;
  onDismiss: () => void;
}

const TONE = {
  info: { color: colors.accent, icon: 'information-outline' as const },
  success: { color: colors.green, icon: 'check-circle-outline' as const },
  error: { color: colors.red, icon: 'alert-circle-outline' as const },
};

export function Toast({ data, onDismiss }: ToastProps) {
  const [animation] = useState(() => new Animated.Value(0));
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!data) return;

    animation.setValue(0);
    Animated.spring(animation, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        dismissRef.current();
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, [data, animation]);

  if (!data) return null;

  const tone = TONE[data.tone ?? 'info'];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          { borderColor: withAlpha(tone.color, 0.45) },
        ]}
      >
        <MaterialCommunityIcons name={tone.icon} size={18} color={tone.color} />
        <AppText variant="subheading" color={colors.text} style={styles.text}>
          {data.text}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    zIndex: 80,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 480,
  },
  text: {
    flexShrink: 1,
  },
});
