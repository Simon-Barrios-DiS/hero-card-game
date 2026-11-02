import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, fonts, radii, shadows, withAlpha } from '../theme';
import type { DuelResult, HandCard, Hero, QualityId } from '../game/types';
import { QUALITY_BY_ID, SCORED_QUALITIES } from '../game/qualities';
import { heroRarity } from '../game/rarity';
import { AppText } from './ui/AppText';
import { HeroAvatar } from './ui/HeroAvatar';
import { RARITY_COLORS, RarityBadge } from './ui/RarityBadge';

interface DuelLaneProps {
  slotIndex: number;
  qualityId: QualityId;
  opponentCard: HandCard | null;
  playerCard: HandCard | null;
  revealed: boolean;
  result: DuelResult | null;
  /** Se puede tocar (turno del jugador, duelo libre y fase de colocación). */
  interactive: boolean;
  /** Hay una carta seleccionada y este hueco está libre. */
  highlighted: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function DuelLane({
  slotIndex,
  qualityId,
  opponentCard,
  playerCard,
  revealed,
  result,
  interactive,
  highlighted,
  onPress,
  style,
}: DuelLaneProps) {
  const quality = QUALITY_BY_ID[qualityId];

  const outcomeColor =
    result && revealed
      ? result.winner === 'player'
        ? colors.green
        : result.winner === 'opponent'
          ? colors.red
          : colors.gold
      : null;

  const borderColor = outcomeColor
    ? withAlpha(outcomeColor, 0.55)
    : highlighted
      ? withAlpha(colors.accent, 0.65)
      : withAlpha(quality.color, 0.2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={laneLabel(slotIndex, quality.label, opponentCard, playerCard, revealed, result)}
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.lane,
        {
          borderColor,
          borderStyle: highlighted && !outcomeColor ? 'dashed' : 'solid',
          backgroundColor: outcomeColor
            ? withAlpha(outcomeColor, 0.06)
            : colors.surface,
        },
        highlighted && !outcomeColor ? styles.highlighted : null,
        pressed && interactive ? { opacity: 0.88 } : null,
        style,
      ]}
    >
      <View style={[styles.qualityHeader, { backgroundColor: withAlpha(quality.color, 0.12) }]}>
        <View style={[styles.qualityAccent, { backgroundColor: quality.color }]} />
        <MaterialCommunityIcons name={quality.icon} size={11} color={quality.color} />
        <AppText variant="label" size={9} color={quality.color} style={styles.qualityText}>
          {quality.short}
        </AppText>
        <AppText variant="label" size={7} color={colors.textDim} style={styles.slotText}>
          {slotIndex + 1}
        </AppText>
      </View>

      <View style={styles.slotArea}>
        {opponentCard ? (
          <OpponentCard
            card={opponentCard}
            qualityColor={quality.color}
            qualityId={qualityId}
            revealed={revealed}
            bonus={revealed ? result?.opponentBonus ?? 0 : 0}
          />
        ) : (
          <EmptySlot label="RIVAL" color={quality.color} />
        )}
      </View>

      <View style={styles.vsRow}>
        <View style={styles.vsLine} />
        <AppText variant="label" size={7} color={colors.textDim}>
          VS
        </AppText>
        <View style={styles.vsLine} />
      </View>

      <View style={styles.slotArea}>
        {playerCard ? (
          <PlayerCard
            card={playerCard}
            qualityId={qualityId}
            bonus={revealed ? result?.playerBonus ?? 0 : 0}
          />
        ) : (
          <EmptySlot
            label="TÚ"
            color={quality.color}
            highlighted={highlighted}
            interactive={interactive}
          />
        )}
      </View>

      <View style={styles.footer}>
        {result && revealed ? (
          <View style={styles.resultRow}>
            <MaterialCommunityIcons
              name={
                result.winner === 'player'
                  ? 'check-circle'
                  : result.winner === 'opponent'
                    ? 'close-circle'
                    : 'minus-circle'
              }
              size={10}
              color={outcomeColor ?? colors.textMuted}
            />
            <AppText variant="label" size={8} color={outcomeColor ?? colors.textMuted}>
              {result.winner === 'player'
                ? 'GANA'
                : result.winner === 'opponent'
                  ? 'PIERDE'
                  : 'TABLAS'}
            </AppText>
          </View>
        ) : playerCard ? (
          <AppText variant="label" size={8} color={colors.textDim}>
            LISTA
          </AppText>
        ) : (
          <AppText variant="label" size={8} color={colors.textDim}>
            DUELO {slotIndex + 1}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

function OpponentCard({
  card,
  qualityColor,
  qualityId,
  revealed,
  bonus,
}: {
  card: HandCard;
  qualityColor: string;
  qualityId: QualityId;
  revealed: boolean;
  bonus: number;
}) {
  const [progress] = useState(() => new Animated.Value(revealed ? 1 : 0));
  const rarity = revealed ? heroRarity(card.hero) : null;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: revealed ? 1 : 0,
      duration: revealed ? 380 : 120,
      useNativeDriver: true,
    }).start();
  }, [progress, revealed]);

  const backOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.6],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const faceOpacity = progress.interpolate({
    inputRange: [0.4, 0.75, 1],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.94, 1],
  });

  return (
    <Animated.View
      style={[
        styles.miniCard,
        { transform: [{ scale }] },
        rarity
          ? { borderWidth: 1.5, borderColor: RARITY_COLORS[rarity].color }
          : null,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backOpacity }]}>
        <CardBack qualityColor={qualityColor} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: faceOpacity }]}>
        <HeroAvatar hero={card.hero} style={styles.face} borderRadius={7} initialsSize={22} />
        <MiniStats hero={card.hero} qualityId={qualityId} bonus={bonus} />
        {rarity ? <RarityBadge rarity={rarity} size="xs" style={styles.rarityBadge} /> : null}
        {bonus > 0 ? <BonusBadge bonus={bonus} /> : null}
      </Animated.View>

      <Animated.View
        style={[styles.revealPulse, { opacity: faceOpacity, borderColor: qualityColor }]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

function PlayerCard({
  card,
  qualityId,
  bonus,
}: {
  card: HandCard;
  qualityId: QualityId;
  bonus: number;
}) {
  const [entry] = useState(() => new Animated.Value(0));
  const rarity = heroRarity(card.hero);

  useEffect(() => {
    Animated.spring(entry, {
      toValue: 1,
      friction: 7,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [entry]);

  return (
    <Animated.View
      style={[
        styles.miniCard,
        rarity
          ? { borderWidth: 1.5, borderColor: RARITY_COLORS[rarity].color }
          : null,
        {
          opacity: entry,
          transform: [
            { scale: entry.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          ],
        },
      ]}
    >
      <HeroAvatar hero={card.hero} style={styles.face} borderRadius={7} initialsSize={22} />
      <MiniStats hero={card.hero} qualityId={qualityId} bonus={bonus} />
      {rarity ? <RarityBadge rarity={rarity} size="xs" style={styles.rarityBadge} /> : null}
      {bonus > 0 ? <BonusBadge bonus={bonus} /> : null}
    </Animated.View>
  );
}

/**
 * Los cinco stats siempre visibles sobre la carta colocada.
 * La cualidad del duelo se resalta para comparar de un vistazo.
 */
function MiniStats({
  hero,
  qualityId,
  bonus = 0,
}: {
  hero: Hero;
  qualityId: QualityId;
  bonus?: number;
}) {
  return (
    <View style={styles.miniStats} pointerEvents="none">
      {SCORED_QUALITIES.map((quality) => {
        const active = quality.id === qualityId;
        return (
          <View
            key={quality.id}
            style={[
              styles.miniStatRow,
              active ? { backgroundColor: withAlpha(quality.color, 0.2) } : null,
            ]}
          >
            <AppText
              variant="label"
              size={7}
              color={active ? quality.color : colors.textMuted}
              style={styles.miniStatShort}
            >
              {quality.short}
            </AppText>
            <AppText
              variant="stat"
              size={9.5}
              color={active ? quality.color : colors.text}
              style={styles.miniStatValue}
            >
              {hero.stats[quality.id] + bonus}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function BonusBadge({ bonus }: { bonus: number }) {
  return (
    <View style={styles.bonusBadge} pointerEvents="none">
      <MaterialCommunityIcons
        name="account-group-outline"
        size={8}
        color={colors.gold}
      />
      <AppText variant="label" size={7} color={colors.gold}>
        +{bonus}
      </AppText>
    </View>
  );
}

function CardBack({ qualityColor }: { qualityColor: string }) {
  return (
    <View style={[styles.back, { borderColor: withAlpha(qualityColor, 0.32) }]}>
      <LinearGradient
        colors={['#1B2846', '#101A30', '#0A1222']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.backStripe, { backgroundColor: withAlpha(qualityColor, 0.16) }]} />
      <View style={[styles.backDiamond, { borderColor: withAlpha(qualityColor, 0.5) }]}>
        <AppText variant="display" size={17} color={withAlpha(qualityColor, 0.9)} style={styles.backQuestion}>
          ?
        </AppText>
      </View>
      <AppText variant="label" size={6} color={colors.textDim} style={styles.backLabel}>
        RIVAL
      </AppText>
    </View>
  );
}

function EmptySlot({
  label,
  color,
  highlighted = false,
  interactive = false,
}: {
  label: string;
  color: string;
  highlighted?: boolean;
  interactive?: boolean;
}) {
  return (
    <View
      style={[
        styles.emptySlot,
        {
          borderColor: highlighted
            ? withAlpha(colors.accent, 0.7)
            : withAlpha(color, 0.18),
          backgroundColor: highlighted
            ? withAlpha(colors.accent, 0.08)
            : 'rgba(255,255,255,0.015)',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={highlighted ? 'plus' : 'cards-outline'}
        size={13}
        color={highlighted ? colors.accent : withAlpha(color, 0.55)}
      />
      <AppText
        variant="label"
        size={7}
        color={highlighted ? colors.accent : colors.textDim}
      >
        {label}
      </AppText>
      {interactive && highlighted ? (
        <AppText variant="caption" size={7} color={colors.accent} numberOfLines={1}>
          toca
        </AppText>
      ) : null}
    </View>
  );
}

function statLine(card: HandCard): string {
  return SCORED_QUALITIES.map(
    (quality) => `${quality.short} ${card.hero.stats[quality.id]}`,
  ).join(', ');
}

function laneLabel(
  slotIndex: number,
  quality: string,
  opponentCard: HandCard | null,
  playerCard: HandCard | null,
  revealed: boolean,
  result: DuelResult | null,
): string {
  const opponent = opponentCard
    ? revealed
      ? `rival ${opponentCard.hero.name} (${statLine(opponentCard)})`
      : 'rival oculto'
    : 'hueco del rival vacío';
  const player = playerCard
    ? `tu carta ${playerCard.hero.name} (${statLine(playerCard)})`
    : 'tu hueco libre';
  const outcome =
    result && revealed
      ? result.winner === 'player'
        ? 'Ganas el duelo'
        : result.winner === 'opponent'
          ? 'Pierdes el duelo'
          : 'Empate'
      : '';
  return `Duelo ${slotIndex + 1}, ${quality}. ${opponent}. ${player}. ${outcome}`;
}

const styles = StyleSheet.create({
  lane: {
    flex: 1,
    height: 254,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  highlighted: {
    borderWidth: 1.5,
    ...shadows.glow,
  },
  qualityHeader: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    position: 'relative',
  },
  qualityAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
  },
  qualityText: {
    letterSpacing: 0.4,
  },
  slotText: {
    marginLeft: 'auto',
    fontSize: 7,
  },
  slotArea: {
    height: 96,
    paddingHorizontal: 5,
    paddingTop: 4,
  },
  vsRow: {
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
  },
  vsLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniCard: {
    flex: 1,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: colors.bgSoft,
  },
  rarityBadge: {
    position: 'absolute',
    top: 3,
    left: 3,
    zIndex: 5,
  },
  bonusBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.45),
    backgroundColor: 'rgba(24, 18, 4, 0.9)',
  },
  face: {
    ...StyleSheet.absoluteFill,
  },
  back: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backStripe: {
    position: 'absolute',
    width: '160%',
    height: 9,
    transform: [{ rotate: '-24deg' }],
  },
  backDiamond: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(4,8,16,0.5)',
  },
  backLabel: {
    position: 'absolute',
    bottom: 2,
    fontSize: 6,
    letterSpacing: 0.8,
  },
  backQuestion: {
    transform: [{ rotate: '-45deg' }],
  },
  revealPulse: {
    ...StyleSheet.absoluteFill,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  emptySlot: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: 1,
  },
  miniStats: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 2,
    paddingVertical: 2,
    backgroundColor: 'rgba(5,9,18,0.84)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  miniStatRow: {
    height: 9.5,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  miniStatShort: {
    width: 16,
    fontSize: 7,
    lineHeight: 9,
    letterSpacing: 0.2,
  },
  miniStatValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.condensedBlack,
    fontSize: 9.5,
    lineHeight: 9.5,
  },
});
