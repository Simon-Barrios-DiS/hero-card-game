import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, spacing, withAlpha } from '../../theme';
import { QUALITY_BY_ID } from '../../game/qualities';
import type { DuelResult, PlayerId } from '../../game/types';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

interface CombatSummaryProps {
  visible: boolean;
  results: DuelResult[];
  duelWins: Record<PlayerId, number>;
  combatWinner: PlayerId | 'draw' | null;
  combatWins: Record<PlayerId, number>;
  target: number;
  matchOver: boolean;
  onNext: () => void;
}

export function CombatSummary({
  visible,
  results,
  duelWins,
  combatWinner,
  combatWins,
  target,
  matchOver,
  onNext,
}: CombatSummaryProps) {
  const [entry] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      entry.setValue(0);
      return;
    }
    const animation = Animated.spring(entry, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entry, visible]);

  if (!visible) return null;

  const outcome =
    combatWinner === 'player'
      ? { title: '¡Combate ganado!', color: colors.green, icon: 'trophy-variant' as const }
      : combatWinner === 'opponent'
        ? { title: 'Combate perdido', color: colors.red, icon: 'skull-outline' as const }
        : { title: 'Combate empatado', color: colors.gold, icon: 'handshake-outline' as const };

  return (
    <Animated.View
      style={[
        styles.panel,
        {
          opacity: entry,
          transform: [
            {
              translateY: entry.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
          borderColor: withAlpha(outcome.color, 0.38),
          backgroundColor: withAlpha(outcome.color, 0.07),
        },
      ]}
    >
      <View style={styles.recap}>
        {results.map((result) => {
          const quality = QUALITY_BY_ID[result.quality];
          const won = result.winner === 'player';
          const lost = result.winner === 'opponent';
          return (
            <View
              key={result.slotIndex}
              style={[
                styles.recapItem,
                {
                  borderColor: withAlpha(
                    won ? colors.green : lost ? colors.red : colors.gold,
                    0.35,
                  ),
                  backgroundColor: withAlpha(
                    won ? colors.green : lost ? colors.red : colors.gold,
                    0.08,
                  ),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={won ? 'check' : lost ? 'close' : 'minus'}
                size={9}
                color={won ? colors.green : lost ? colors.red : colors.gold}
              />
              <AppText variant="label" size={7} color={quality.color}>
                {quality.short}
              </AppText>
            </View>
          );
        })}
      </View>

      <View style={styles.main}>
        <View style={[styles.iconWrap, { borderColor: withAlpha(outcome.color, 0.4) }]}>
          <MaterialCommunityIcons name={outcome.icon} size={20} color={outcome.color} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="title" size={25} color={outcome.color}>
            {outcome.title}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Duelos {duelWins.player} — {duelWins.opponent} · Partida {combatWins.player} —{' '}
            {combatWins.opponent} (a {target})
          </AppText>
        </View>
      </View>

      {!matchOver ? (
        <Button
          label="Siguiente combate"
          onPress={onNext}
          iconRight="arrow-right"
          fullWidth
          size="md"
          style={styles.button}
        />
      ) : (
        <AppText variant="label" size={9} color={colors.textDim} style={styles.endNote}>
          Partida terminada
        </AppText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recap: {
    flexDirection: 'row',
    gap: 4,
  },
  recapItem: {
    flex: 1,
    minHeight: 20,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  button: {
    marginTop: 2,
  },
  endNote: {
    textAlign: 'center',
    letterSpacing: 1.2,
    paddingVertical: 4,
  },
});
