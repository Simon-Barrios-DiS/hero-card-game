import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  /** Añade un halo de color al fondo. */
  accent?: 'cyan' | 'magenta' | 'gold' | 'none';
}

export function Screen({
  children,
  edges = ['top', 'left', 'right'],
  style,
  accent = 'cyan',
}: ScreenProps) {
  const accentColor =
    accent === 'magenta'
      ? colors.magenta
      : accent === 'gold'
        ? colors.gold
        : colors.accent;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgSoft, colors.bg, colors.bgDeep]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        style={[
          styles.glow,
          styles.glowTop,
          { backgroundColor: accentColor, opacity: accent === 'none' ? 0 : 0.09 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          styles.glowBottom,
          { backgroundColor: colors.magenta, opacity: accent === 'none' ? 0 : 0.06 },
        ]}
      />
      <View pointerEvents="none" style={styles.grid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View key={index} style={styles.gridLine} />
        ))}
      </View>

      <LinearGradient
        colors={[colors.accent, colors.magenta]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topLine}
      />

      <SafeAreaView edges={edges} style={styles.safe}>
        <View style={[styles.container, style]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

/** Variante con scroll vertical, para pantallas con contenido variable. */
export function ScrollScreen({
  children,
  edges = ['top', 'left', 'right'],
  accent = 'cyan',
  contentContainerStyle,
  style,
}: ScreenProps & {
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Screen edges={edges} accent={accent} style={style}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
    zIndex: 10,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTop: {
    width: 360,
    height: 360,
    top: -190,
    right: -120,
  },
  glowBottom: {
    width: 300,
    height: 300,
    bottom: -190,
    left: -130,
  },
  grid: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-evenly',
    opacity: 0.5,
  },
  gridLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.025)',
    marginHorizontal: -20,
  },
});
