import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, withAlpha } from '../../theme';
import type { PlayerId } from '../../game/types';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

interface MatchOverlayProps {
  visible: boolean;
  winner: PlayerId;
  combatWins: Record<PlayerId, number>;
  target: number;
  tokensEarned?: number;
  onRematch: () => void;
  onExit: () => void;
}

export function MatchOverlay({
  visible,
  winner,
  combatWins,
  target,
  tokensEarned = 0,
  onRematch,
  onExit,
}: MatchOverlayProps) {
  const [entry] = useState(() => new Animated.Value(0));
  const won = winner === 'player';
  const accent = won ? colors.gold : colors.magenta;

  useEffect(() => {
    if (!visible) {
      entry.setValue(0);
      return;
    }
    const animation = Animated.spring(entry, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entry, visible]);

  if (!visible) return null;

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={styles.scrim} />
      <Animated.View
        style={[
          styles.panel,
          {
            opacity: entry,
            transform: [
              {
                scale: entry.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
            borderColor: withAlpha(accent, 0.45),
          },
        ]}
      >
        <LinearGradient
          colors={[withAlpha(accent, 0.2), 'rgba(7,11,22,0)']}
          style={styles.panelGlow}
        />

        <View style={styles.stars}>
          {[0, 1, 2].map((index) => (
            <MaterialCommunityIcons
              key={index}
              name="star-four-points"
              size={index === 1 ? 14 : 9}
              color={withAlpha(accent, index === 1 ? 0.8 : 0.4)}
            />
          ))}
        </View>

        <View style={[styles.iconWrap, { borderColor: withAlpha(accent, 0.45) }]}>
          <MaterialCommunityIcons
            name={won ? 'trophy-variant' : 'skull-outline'}
            size={42}
            color={accent}
          />
        </View>

        <AppText variant="title" size={54} color={accent} style={styles.title}>
          {won ? '¡Victoria!' : 'Derrota'}
        </AppText>

        <AppText variant="subheading" color={colors.textMuted} align="center">
          {won
            ? `Has ganado ${target} combates.`
            : `El rival ha llegado a ${target} combates.`}
        </AppText>

        <View style={styles.scoreRow}>
          <View style={styles.scoreSide}>
            <AppText variant="label" size={9} color={colors.accent}>
              Tú
            </AppText>
            <AppText variant="display" size={44} color={won ? colors.accent : colors.textMuted}>
              {combatWins.player}
            </AppText>
          </View>
          <View style={styles.scoreDivider}>
            <AppText variant="stat" size={12} color={colors.textDim}>
              VS
            </AppText>
          </View>
          <View style={styles.scoreSide}>
            <AppText variant="label" size={9} color={colors.magenta}>
              Rival
            </AppText>
            <AppText
              variant="display"
              size={44}
              color={!won ? colors.magenta : colors.textMuted}
            >
              {combatWins.opponent}
            </AppText>
          </View>
        </View>

        {tokensEarned > 0 ? (
          <View style={styles.tokens}>
            <MaterialCommunityIcons
              name="diamond-stone"
              size={13}
              color={colors.gold}
            />
            <AppText variant="caption" size={11} color={colors.gold}>
              +{tokensEarned} tokens por rondas ganadas
            </AppText>
          </View>
        ) : null}

        <View style={styles.buttons}>
          <Button
            label="Revancha"
            onPress={onRematch}
            fullWidth
            size="lg"
            icon="refresh"
          />
          <Button
            label="Volver al inicio"
            onPress={onExit}
            fullWidth
            size="md"
            variant="ghost"
            icon="home-outline"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 120,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2,5,11,0.88)',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radii.xxl,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  panelGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  iconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 2,
  },
  title: {
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
  scoreSide: {
    alignItems: 'center',
    minWidth: 76,
  },
  scoreDivider: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.28),
    backgroundColor: withAlpha(colors.gold, 0.08),
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
