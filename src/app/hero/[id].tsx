import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollScreen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { Button, IconButton } from '../../components/ui/Button';
import { HeroAvatar } from '../../components/ui/HeroAvatar';
import { Tag } from '../../components/ui/Tag';
import { Toast, type ToastData } from '../../components/ui/Toast';
import { useCollection } from '../../providers/CollectionProvider';
import { GAME } from '../../game/config';
import { getHeroDetails, HAS_OFFICIAL_TOKEN } from '../../data/api';
import {
  alignmentInfo,
  colors,
  publisherColor,
  radii,
  spacing,
  withAlpha,
} from '../../theme';
import { overallRating, QUALITIES } from '../../game/qualities';
import type { Hero } from '../../game/types';

export default function HeroDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const heroId = Number(params.id);
  const {
    heroById,
    deckCount,
    isInDeck,
    toggleDeckHero,
    hasOfficialToken,
  } = useCollection();
  const hero = Number.isInteger(heroId) ? heroById.get(heroId) ?? null : null;

  const [official, setOfficial] = useState<{ heroId: number; hero: Hero } | null>(
    null,
  );
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ heroId: number; message: string } | null>(
    null,
  );
  const [toast, setToast] = useState<ToastData | null>(null);

  const refreshOfficial = useCallback(
    async (targetHero: Hero) => {
      if (!hasOfficialToken) return;
      setRefreshingId(targetHero.id);
      const result = await getHeroDetails(targetHero);
      setOfficial({ heroId: targetHero.id, hero: result.hero });
      setNotice(
        result.error ? { heroId: targetHero.id, message: result.error } : null,
      );
      setRefreshingId(null);
    },
    [hasOfficialToken],
  );

  useEffect(() => {
    if (!hero || !hasOfficialToken) return;
    const timer = setTimeout(() => {
      void refreshOfficial(hero);
    }, 0);
    return () => clearTimeout(timer);
  }, [hasOfficialToken, hero, refreshOfficial]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!hero) {
    return (
      <ScrollScreen contentContainerStyle={styles.missing} accent="gold">
        <View style={styles.missingIcon}>
          <MaterialCommunityIcons
            name="account-question-outline"
            size={36}
            color={colors.textDim}
          />
        </View>
        <AppText variant="title" size={40} align="center">
          Héroe no encontrado
        </AppText>
        <AppText variant="body" color={colors.textMuted} align="center">
          Puede que la colección todavía se esté cargando o que la ficha ya no
          esté disponible.
        </AppText>
        <Button
          label="Volver"
          onPress={goBack}
          icon="chevron-left"
          size="md"
          style={styles.missingButton}
        />
      </ScrollScreen>
    );
  }

  const current =
    official && official.heroId === hero.id ? official.hero : hero;
  const currentNotice =
    notice && notice.heroId === hero.id ? notice.message : null;
  const refreshing = refreshingId === hero.id;
  const inDeck = isInDeck(hero.id);
  const deckFull = deckCount >= GAME.deckSize;
  const alignment = alignmentInfo(current.alignment);
  const rating = overallRating(current);

  const handleToggleDeck = () => {
    const result = toggleDeckHero(hero.id);
    if (!result.ok) {
      setToast({
        text:
          result.reason === 'full'
            ? `Mazo completo (${GAME.deckSize}). Quita otro héroe primero.`
            : 'Ese héroe ya no está disponible.',
        tone: 'error',
      });
      return;
    }
    setToast({
      text: result.added
        ? `${hero.name} añadido al mazo.`
        : `${hero.name} fuera del mazo.`,
      tone: result.added ? 'success' : 'info',
    });
  };

  return (
    <>
      <ScrollScreen contentContainerStyle={styles.content} accent="cyan">
        <View style={styles.topBar}>
          <IconButton icon="chevron-left" label="Volver" onPress={goBack} />
          <View style={styles.topBarText}>
            <AppText variant="label" size={8} color={colors.textDim}>
              Ficha de héroe
            </AppText>
            <AppText variant="caption" size={10} color={colors.textMuted}>
              {current.publisher}
            </AppText>
          </View>
          <IconButton
            icon={inDeck ? 'check' : 'plus'}
            label={inDeck ? 'Quitar del mazo' : 'Añadir al mazo'}
            color={inDeck ? colors.accent : colors.text}
            borderColor={inDeck ? withAlpha(colors.accent, 0.5) : colors.border}
            onPress={handleToggleDeck}
          />
        </View>

        <View style={styles.heroImage}>
          <HeroAvatar
            hero={current}
            style={StyleSheet.absoluteFill}
            initialsSize={78}
            priority="high"
          />
          <LinearGradient
            colors={['rgba(5,9,18,0)', 'rgba(5,9,18,0.35)', 'rgba(5,9,18,0.98)']}
            locations={[0.3, 0.62, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.imageTop}>
            <Tag
              label={current.publisher.replace(' Comics', '')}
              color={publisherColor(current.publisher)}
              size="xs"
            />
            <Tag label={alignment.label} color={alignment.color} size="xs" />
          </View>

          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={13}
              color={colors.gold}
            />
            <AppText variant="score" size={20} color={colors.gold}>
              {rating}
            </AppText>
            <AppText variant="label" size={7} color={colors.textDim}>
              media
            </AppText>
          </View>

          <View style={styles.nameBlock}>
            <AppText variant="display" size={48} style={styles.heroName}>
              {current.name}
            </AppText>
            {current.fullName ? (
              <AppText
                variant="subheading"
                color="rgba(244,247,255,0.78)"
                numberOfLines={1}
              >
                {current.fullName}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.deckAction}>
          <Button
            label={
              inDeck
                ? 'Quitar del mazo'
                : deckFull
                  ? 'Mazo completo'
                  : 'Añadir al mazo'
            }
            onPress={handleToggleDeck}
            icon={inDeck ? 'close' : deckFull ? 'lock-outline' : 'plus'}
            variant={inDeck ? 'danger' : 'primary'}
            size="lg"
            fullWidth
          />
          <AppText
            variant="caption"
            size={10}
            color={inDeck ? colors.accent : colors.textDim}
            align="center"
          >
            {inDeck
              ? `En tu mazo · ${deckCount}/${GAME.deckSize}`
              : deckFull
                ? `Tu mazo ya tiene ${GAME.deckSize} héroes`
                : `${deckCount}/${GAME.deckSize} héroes en tu mazo`}
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading" size={20}>
              Cualidades
            </AppText>
            <AppText variant="caption" size={10} color={colors.textDim}>
              {QUALITIES.filter((quality) => quality.active).length} activas
            </AppText>
          </View>

          <View style={styles.statsCard}>
            {QUALITIES.map((quality, index) => (
              <QualityRow
                key={`${hero.id}-${quality.id}`}
                label={quality.label}
                short={quality.short}
                icon={quality.icon}
                color={quality.color}
                description={quality.description}
                value={current.stats[quality.id]}
                active={quality.active}
                index={index}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" size={20}>
            Biografía
          </AppText>
          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-clock"
              label="Primera aparición"
              value={current.firstAppearance}
            />
            <InfoRow
              icon="briefcase-outline"
              label="Ocupación"
              value={current.occupation}
            />
            <InfoRow icon="map-marker-outline" label="Base" value={current.base} />
            <InfoRow
              icon="account-multiple-outline"
              label="Afiliaciones"
              value={current.groupAffiliation}
            />
          </View>

          {current.aliases.length > 0 ? (
            <View style={styles.aliases}>
              <AppText variant="label" size={9} color={colors.textDim}>
                Alias
              </AppText>
              <View style={styles.aliasWrap}>
                {current.aliases.map((alias) => (
                  <Tag
                    key={alias}
                    label={alias}
                    color={colors.textMuted}
                    size="xs"
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <AppText variant="heading" size={20}>
            Aspecto
          </AppText>
          <View style={styles.appearanceGrid}>
            <AppearanceCell label="Género" value={current.appearance.gender} />
            <AppearanceCell label="Raza" value={current.appearance.race} />
            <AppearanceCell label="Altura" value={current.appearance.height} />
            <AppearanceCell label="Peso" value={current.appearance.weight} />
            <AppearanceCell label="Ojos" value={current.appearance.eyeColor} />
            <AppearanceCell label="Pelo" value={current.appearance.hairColor} />
          </View>
        </View>

        <View style={styles.sourcePanel}>
          <View style={styles.sourceHeader}>
            <MaterialCommunityIcons
              name={hasOfficialToken ? 'cloud-check-outline' : 'information-outline'}
              size={15}
              color={hasOfficialToken ? colors.green : colors.textDim}
            />
            <AppText variant="label" size={8} color={colors.textDim}>
              {hasOfficialToken ? 'Ficha oficial' : 'Datos del catálogo'}
            </AppText>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : hasOfficialToken ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Actualizar ficha oficial"
                onPress={() => {
                  void refreshOfficial(hero);
                }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.refreshLink,
                  pressed ? { opacity: 0.65 } : null,
                ]}
              >
                <MaterialCommunityIcons
                  name="reload"
                  size={12}
                  color={colors.accent}
                />
                <AppText variant="label" size={7} color={colors.accent}>
                  Actualizar
                </AppText>
              </Pressable>
            ) : null}
          </View>
          <AppText
            variant="caption"
            size={10}
            color={currentNotice ? colors.red : colors.textDim}
          >
            {currentNotice ??
              (hasOfficialToken
                ? 'Los datos se refrescan contra Superhero API. Los retratos vienen del catálogo público.'
                : 'Configura EXPO_PUBLIC_SUPERHERO_API_TOKEN para refrescar fichas contra la API oficial.')}
          </AppText>
          {HAS_OFFICIAL_TOKEN ? null : (
            <AppText variant="caption" size={9} color={colors.textDim}>
              El juego funciona sin conexión con el catálogo incluido.
            </AppText>
          )}
        </View>
      </ScrollScreen>

      <Toast data={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function QualityRow({
  label,
  short,
  icon,
  color,
  description,
  value,
  active,
  index,
}: {
  label: string;
  short: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  description: string;
  value: number;
  active: boolean;
  index: number;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      delay: 90 + index * 55,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [index, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.max(2, Math.min(100, value))}%`],
  });

  return (
    <View style={[styles.statRow, !active ? styles.statRowInactive : null]}>
      <View
        style={[
          styles.statIcon,
          { backgroundColor: withAlpha(color, 0.12), borderColor: withAlpha(color, 0.25) },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={17} color={color} />
      </View>
      <View style={styles.statMain}>
        <View style={styles.statTop}>
          <View style={styles.statTitle}>
            <AppText variant="subheading" size={15} color={colors.text}>
              {label}
            </AppText>
            <AppText variant="label" size={7} color={color}>
              {short}
            </AppText>
            {!active ? (
              <AppText variant="label" size={7} color={colors.textDim}>
                Próximamente
              </AppText>
            ) : null}
          </View>
          <AppText variant="score" size={20} color={active ? color : colors.textDim}>
            {value}
          </AppText>
        </View>
        <View style={styles.statTrack}>
          <Animated.View
            style={[
              styles.statFill,
              { width, backgroundColor: active ? color : colors.textDim },
            ]}
          />
        </View>
        <AppText variant="caption" size={9.5} color={colors.textDim}>
          {description}
        </AppText>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.textDim} />
      <View style={styles.infoText}>
        <AppText variant="label" size={7} color={colors.textDim}>
          {label}
        </AppText>
        <AppText variant="caption" size={12} color={colors.text}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function AppearanceCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.appearanceCell}>
      <AppText variant="label" size={7} color={colors.textDim}>
        {label}
      </AppText>
      <AppText variant="caption" size={12} color={colors.text} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topBarText: {
    flex: 1,
    alignItems: 'center',
    gap: 0,
  },
  heroImage: {
    height: 342,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.18),
    backgroundColor: colors.bgSoft,
  },
  imageTop: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(4,8,16,0.72)',
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
  },
  nameBlock: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    gap: 0,
  },
  heroName: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  deckAction: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  statRowInactive: {
    opacity: 0.55,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMain: {
    flex: 1,
    gap: 3,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  statTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    gap: 1,
  },
  aliases: {
    gap: spacing.xs,
    marginTop: 2,
  },
  aliasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  appearanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  appearanceCell: {
    width: '31.5%',
    minWidth: 100,
    flexGrow: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  sourcePanel: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  missingIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
});
