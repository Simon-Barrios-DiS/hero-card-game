import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  colors,
  fonts,
  publisherColor,
  radii,
  withAlpha,
} from '../theme';
import { overallRating, SCORED_QUALITIES } from '../game/qualities';
import { heroRarity } from '../game/rarity';
import type { HandCard as HandCardModel } from '../game/types';
import { hapticSelect } from '../utils/feedback';
import { AppText } from './ui/AppText';
import { HeroAvatar } from './ui/HeroAvatar';
import { RARITY_COLORS, RarityBadge } from './ui/RarityBadge';

interface HandCardProps {
  card: HandCardModel;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export const HAND_CARD_WIDTH = 112;
export const HAND_CARD_HEIGHT = 176;

export function HandCard({
  card,
  selected = false,
  disabled = false,
  onPress,
  index = 0,
  style,
}: HandCardProps) {
  const [entry] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.spring(entry, {
      toValue: 1,
      delay: index * 55,
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entry, index]);

  const { hero } = card;
  const rating = overallRating(hero);
  const rarity = heroRarity(hero);
  const rarityColor = rarity ? RARITY_COLORS[rarity].color : null;

  const handlePress = () => {
    if (disabled || !onPress) return;
    hapticSelect();
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.entry,
        {
          opacity: entry,
          transform: [
            {
              translateY: entry.interpolate({
                inputRange: [0, 1],
                outputRange: [26, 0],
              }),
            },
            {
              scale: entry.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${hero.name}. ${SCORED_QUALITIES.map(
          (quality) => `${quality.label} ${hero.stats[quality.id]}`,
        ).join('. ')}`}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: selected
              ? colors.accent
              : rarityColor ??
                (disabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.13)'),
            borderWidth: selected || rarityColor ? 1.5 : 1,
          },
          selected ? styles.selected : null,
          disabled ? styles.disabled : null,
          pressed && !disabled ? styles.pressed : null,
        ]}
      >
        <View style={styles.image}>
          <HeroAvatar hero={hero} style={styles.avatar} borderRadius={0} initialsSize={34} />
          <View style={styles.cardMarks}>
            {rarity ? <RarityBadge rarity={rarity} size="sm" /> : null}
            {selected ? (
              <View style={styles.selectedMark}>
                <MaterialCommunityIcons name="check-bold" size={9} color={colors.bgDeep} />
              </View>
            ) : null}
          </View>
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star-four-points" size={9} color={colors.gold} />
            <AppText variant="stat" size={11} color={colors.gold}>
              {rating}
            </AppText>
          </View>
          <View style={[styles.publisherBar, { backgroundColor: publisherColor(hero.publisher) }]} />
        </View>

        <View style={styles.nameStrip}>
          <AppText
            variant="label"
            size={11}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={styles.name}
          >
            {hero.name}
          </AppText>
        </View>

        <View style={styles.stats}>
          {SCORED_QUALITIES.map((quality) => {
            const value = hero.stats[quality.id];
            return (
              <View key={quality.id} style={styles.statRow}>
                <MaterialCommunityIcons
                  name={quality.icon}
                  size={9}
                  color={quality.color}
                />
                <AppText
                  variant="label"
                  size={7.5}
                  color={colors.textMuted}
                  style={styles.statShort}
                >
                  {quality.short}
                </AppText>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(0, Math.min(100, value))}%`,
                        backgroundColor: quality.color,
                      },
                    ]}
                  />
                </View>
                <AppText variant="stat" size={10.5} style={styles.statValue}>
                  {value}
                </AppText>
              </View>
            );
          })}
        </View>

      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  entry: {
    width: HAND_CARD_WIDTH,
    height: HAND_CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  selected: {
    transform: [{ translateY: -9 }],
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  disabled: {
    opacity: 0.68,
  },
  pressed: {
    opacity: 0.9,
  },
  image: {
    height: 72,
    backgroundColor: colors.bgSoft,
    position: 'relative',
  },
  avatar: {
    ...StyleSheet.absoluteFill,
  },
  ratingBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(4,8,16,0.78)',
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
  },
  cardMarks: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 4,
  },
  publisherBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
  nameStrip: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  name: {
    fontFamily: fonts.condensedBold,
    letterSpacing: 0.6,
  },
  stats: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statShort: {
    width: 19,
    letterSpacing: 0.2,
    lineHeight: 9,
  },
  barTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  statValue: {
    width: 20,
    textAlign: 'right',
    fontFamily: fonts.condensedBlack,
    lineHeight: 12,
  },
  selectedMark: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
