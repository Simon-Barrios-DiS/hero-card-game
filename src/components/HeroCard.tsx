import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  alignmentInfo,
  colors,
  fonts,
  publisherColor,
  radii,
  shadows,
  spacing,
  withAlpha,
} from '../theme';
import { overallRating, SCORED_QUALITIES } from '../game/qualities';
import { heroRarity } from '../game/rarity';
import type { Hero } from '../game/types';
import { hapticSelect } from '../utils/feedback';
import { AppText } from './ui/AppText';
import { HeroAvatar } from './ui/HeroAvatar';
import { RarityBadge } from './ui/RarityBadge';
import { Tag } from './ui/Tag';

interface HeroCardProps {
  hero: Hero;
  width: number;
  onPress?: () => void;
  onToggleDeck?: () => void;
  inDeck?: boolean;
  /** La rareza del héroe ya no tiene hueco en el mazo. */
  deckBlocked?: boolean;
  /** Si es false, la carta aparece gris y bloqueada. */
  owned?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function HeroCard({
  hero,
  width,
  onPress,
  onToggleDeck,
  inDeck = false,
  deckBlocked = false,
  owned = true,
  style,
}: HeroCardProps) {
  const imageHeight = Math.round(width * 1.04);
  const alignment = alignmentInfo(hero.alignment);
  const rating = overallRating(hero);
  const rarity = heroRarity(hero);
  const showDeckButton = typeof onToggleDeck === 'function';
  const deckIsBlocked = deckBlocked || !owned;

  const handlePress = () => {
    if (!onPress) return;
    hapticSelect();
    onPress();
  };

  const handleToggle = () => {
    if (!onToggleDeck) return;
    hapticSelect();
    onToggleDeck();
  };

  return (
    <View
      style={[
        styles.wrapper,
        { width },
        inDeck ? styles.wrapperInDeck : null,
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${hero.name}. Poder ${rating}. ${SCORED_QUALITIES.map(
          (quality) => `${quality.label} ${hero.stats[quality.id]}`,
        ).join('. ')}${owned ? '' : '. No lo tienes'}`}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: inDeck
              ? withAlpha(colors.accent, 0.55)
              : owned
                ? colors.border
                : withAlpha(colors.textDim, 0.3),
          },
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={[styles.imageArea, { height: imageHeight }]}>
          <HeroAvatar
            hero={hero}
            style={[styles.avatar, owned ? null : styles.unownedAvatar]}
            borderRadius={0}
            initialsSize={52}
          />

          {owned ? null : <View pointerEvents="none" style={styles.unownedTint} />}

          <LinearGradient
            colors={['rgba(7,11,22,0)', 'rgba(7,11,22,0.55)', 'rgba(7,11,22,0.97)']}
            locations={[0.35, 0.7, 1]}
            style={styles.imageGradient}
          />

          <View style={styles.topRow}>
            <Tag
              label={hero.publisher.replace(' Comics', '')}
              color={publisherColor(hero.publisher)}
              size="xs"
            />
          </View>

          {rarity ? (
            <RarityBadge
              rarity={rarity}
              size="md"
              style={[styles.rarityBadge, showDeckButton ? styles.rarityBadgeWithDeck : null]}
            />
          ) : null}

          <View style={styles.nameBlock}>
            <AppText
              variant="title"
              size={Math.max(19, Math.min(24, width * 0.13))}
              numberOfLines={2}
              style={styles.heroName}
            >
              {hero.name}
            </AppText>
            {hero.fullName ? (
              <AppText variant="caption" numberOfLines={1} style={styles.fullName}>
                {hero.fullName}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.stats}>
          {SCORED_QUALITIES.map((quality) => (
            <View key={quality.id} style={styles.statCell}>
              <MaterialCommunityIcons
                name={quality.icon}
                size={11}
                color={quality.color}
              />
              <AppText
                variant="label"
                size={9}
                color={colors.textMuted}
                style={styles.statLabel}
                numberOfLines={1}
              >
                {quality.short}
              </AppText>
              <AppText
                variant="stat"
                size={13}
                color={colors.text}
                style={styles.statValue}
              >
                {hero.stats[quality.id]}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          {owned ? (
            <Tag label={alignment.label} color={alignment.color} size="xs" />
          ) : (
            <Tag label="No lo tienes" color={colors.textMuted} size="xs" />
          )}
          <View style={styles.rating}>
            <MaterialCommunityIcons name="star-four-points" size={11} color={colors.gold} />
            <AppText variant="stat" size={13} color={colors.gold}>
              {rating}
            </AppText>
          </View>
        </View>
      </Pressable>

      {showDeckButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            inDeck
              ? `Quitar ${hero.name} del mazo`
              : !owned
                ? `No tienes ${hero.name}`
                : deckIsBlocked
                  ? `${hero.name} no tiene hueco en el mazo`
                  : `Añadir ${hero.name} al mazo`
          }
          onPress={handleToggle}
          hitSlop={6}
          style={({ pressed }) => [
            styles.deckButton,
            {
              backgroundColor: inDeck ? colors.accent : 'rgba(5,9,18,0.82)',
              borderColor: inDeck ? colors.accent : 'rgba(255,255,255,0.22)',
            },
            pressed ? { opacity: 0.75, transform: [{ scale: 0.94 }] } : null,
          ]}
        >
          <MaterialCommunityIcons
            name={inDeck ? 'check' : deckIsBlocked ? 'lock-outline' : 'plus'}
            size={16}
            color={
              inDeck
                ? colors.bgDeep
                : deckIsBlocked
                  ? colors.textDim
                  : colors.text
            }
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  wrapperInDeck: {
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  imageArea: {
    width: '100%',
    position: 'relative',
    backgroundColor: colors.bgSoft,
  },
  avatar: {
    ...StyleSheet.absoluteFill,
  },
  unownedAvatar: {
    opacity: 0.4,
  },
  unownedTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(110, 122, 145, 0.3)',
  },
  imageGradient: {
    ...StyleSheet.absoluteFill,
  },
  topRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameBlock: {
    position: 'absolute',
    left: spacing.sm + 2,
    right: spacing.sm,
    bottom: spacing.sm,
  },
  heroName: {
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  fullName: {
    marginTop: -1,
    color: 'rgba(244,247,255,0.72)',
    fontFamily: fonts.condensedSemi,
    letterSpacing: 0.2,
  },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.055)',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 0.3,
  },
  statValue: {
    fontFamily: fonts.condensedBlack,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deckButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  rarityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 4,
  },
  rarityBadgeWithDeck: {
    right: 46,
  },
});
