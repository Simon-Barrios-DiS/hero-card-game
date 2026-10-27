import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, withAlpha } from '../theme';
import { AppText } from './ui/AppText';

interface ScoreBarProps {
  combatNumber: number;
  target: number;
  playerWins: number;
  opponentWins: number;
}

function Segments({
  filled,
  color,
  count,
  align = 'start',
}: {
  filled: number;
  color: string;
  count: number;
  align?: 'start' | 'end';
}) {
  return (
    <View
      style={[
        styles.segments,
        align === 'end' ? styles.segmentsEnd : null,
      ]}
    >
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor:
                index < filled ? color : 'rgba(255,255,255,0.075)',
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ScoreBar({
  combatNumber,
  target,
  playerWins,
  opponentWins,
}: ScoreBarProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Combate ${combatNumber}. Tú ${playerWins}, rival ${opponentWins}. Primero en llegar a ${target}.`}
      style={styles.container}
    >
      <View style={styles.header}>
        <AppText variant="label" size={10} color={colors.textMuted}>
          Combate {combatNumber}
        </AppText>
        <View style={styles.targetPill}>
          <AppText variant="label" size={8} color={colors.gold} style={styles.targetText}>
            Primero a {target}
          </AppText>
        </View>
      </View>

      <View style={styles.row}>
        <AppText variant="label" size={10} color={colors.accent} style={styles.sideLabel}>
          Tú
        </AppText>
        <Segments
          filled={Math.min(target, playerWins)}
          color={colors.accent}
          count={target}
        />
        <AppText variant="score" size={19} color={colors.text} style={styles.score}>
          {playerWins}
        </AppText>

        <AppText variant="stat" size={12} color={colors.textDim}>
          ·
        </AppText>

        <AppText variant="score" size={19} color={colors.text} style={styles.score}>
          {opponentWins}
        </AppText>
        <Segments
          filled={Math.min(target, opponentWins)}
          color={colors.magenta}
          count={target}
          align="end"
        />
        <AppText
          variant="label"
          size={10}
          color={colors.magenta}
          style={[styles.sideLabel, styles.rightLabel]}
        >
          Rival
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.3),
    backgroundColor: withAlpha(colors.gold, 0.08),
  },
  targetText: {
    letterSpacing: 0.9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sideLabel: {
    width: 24,
    letterSpacing: 0.8,
  },
  rightLabel: {
    textAlign: 'right',
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    height: 10,
  },
  segmentsEnd: {
    justifyContent: 'flex-end',
  },
  segment: {
    flex: 1,
    maxWidth: 24,
    height: '100%',
    borderRadius: 2,
  },
  score: {
    minWidth: 20,
    textAlign: 'center',
  },
});
