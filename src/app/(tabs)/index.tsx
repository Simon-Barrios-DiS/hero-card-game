import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollScreen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { Button, IconButton } from '../../components/ui/Button';
import { HeroAvatar } from '../../components/ui/HeroAvatar';
import { Toast, type ToastData } from '../../components/ui/Toast';
import { RulesModal } from '../../components/RulesModal';
import { useCollection } from '../../providers/CollectionProvider';
import { useAuth } from '../../providers/AuthProvider';
import { GAME } from '../../game/config';
import { DATA_ATTRIBUTION } from '../../data/api';
import { colors, radii, spacing, withAlpha } from '../../theme';
import type { Hero } from '../../game/types';

export default function HomeScreen() {
  const {
    heroes,
    deckHeroes,
    deckCount,
    deckComplete,
    catalogReady,
    tokens,
    ownedCount,
    isOwned,
    fillDeck,
    record,
  } = useCollection();
  const { currentUser, logout } = useAuth();
  const [rulesVisible, setRulesVisible] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const deckReady = deckComplete;
  const ownedHeroes = useMemo(
    () => heroes.filter((hero) => isOwned(hero.id)),
    [heroes, isOwned],
  );
  const featured = useMemo<Hero[]>(() => {
    if (deckHeroes.length > 0) return deckHeroes.slice(0, 3);
    return ownedHeroes.slice(0, 3);
  }, [deckHeroes, ownedHeroes]);

  const notify = (text: string, tone: ToastData['tone'] = 'info') => {
    setToast({ text, tone });
  };

  const play = (target: number) => {
    if (!deckReady) {
      notify('Completa tu mazo para empezar.', 'error');
      return;
    }
    router.push({ pathname: '/battle', params: { target: String(target) } });
  };

  const handleFillDeck = () => {
    const result = fillDeck();
    if (result.deckSize === 0) {
      notify('Compra sobres en la tienda para conseguir héroes.', 'error');
      return;
    }
    notify(
      result.complete
        ? 'Mazo completado.'
        : `Mazo rellenado: ${result.deckSize}/${GAME.deckSize}. Faltan héroes.`,
      result.complete ? 'success' : 'info',
    );
  };

  const deckPct = Math.min(100, (deckCount / GAME.deckSize) * 100);

  return (
    <>
      <ScrollScreen contentContainerStyle={styles.content} accent="cyan">
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <MaterialCommunityIcons
              name="cards-playing-outline"
              size={20}
              color={colors.accent}
            />
          </View>
          <View style={styles.brandText}>
            <AppText variant="label" size={10} color={colors.accent}>
              Universo de superhéroes
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {currentUser ? `@${currentUser.username}` : 'Duelos de cualidades'}
            </AppText>
          </View>
          <View style={styles.brandActions}>
            <View style={styles.tokenPill}>
              <MaterialCommunityIcons
                name="diamond-stone"
                size={12}
                color={colors.gold}
              />
              <AppText variant="stat" size={12} color={colors.gold}>
                {tokens}
              </AppText>
            </View>
            <IconButton
              icon="help-circle-outline"
              label="Cómo jugar"
              onPress={() => setRulesVisible(true)}
            />
            <IconButton
              icon="logout"
              label="Cerrar sesión"
              onPress={logout}
            />
          </View>
        </View>

        <View style={styles.intro}>
          <AppText variant="display" size={52} style={styles.title}>
            HERO CARD GAME
          </AppText>
          <AppText variant="subheading" color={colors.textMuted} style={styles.tagline}>
            Cinco cualidades. Cinco duelos. Una leyenda.
          </AppText>
        </View>

        <FeaturedStack heroes={featured} />

        <View style={[styles.deckPanel, !deckReady ? styles.deckPanelWarning : null]}>
          <View style={styles.deckHeader}>
            <View style={styles.deckHeaderText}>
              <AppText variant="label" size={10} color={colors.textMuted}>
                Tu mazo
              </AppText>
              <AppText
                variant="caption"
                color={deckReady ? colors.green : colors.gold}
              >
                {catalogReady
                  ? deckReady
                    ? 'Listo para combatir'
                    : `Faltan ${Math.max(0, GAME.deckSize - deckCount)} cartas`
                  : 'Cargando catálogo…'}
              </AppText>
            </View>
            <View style={styles.deckCount}>
              <AppText variant="score" size={28} color={colors.text}>
                {deckCount}
              </AppText>
              <AppText variant="stat" size={13} color={colors.textDim}>
                /{GAME.deckSize}
              </AppText>
            </View>
          </View>

          <View style={styles.deckTrack}>
            <View
              style={[
                styles.deckFill,
                {
                  width: `${deckPct}%`,
                  backgroundColor: deckReady ? colors.accent : colors.gold,
                },
              ]}
            />
          </View>

          <View style={styles.deckFooter}>
            <View style={styles.avatarStrip}>
              {deckHeroes.slice(0, 6).map((hero) => (
                <View key={hero.id} style={styles.avatarChip}>
                  <HeroAvatar
                    hero={hero}
                    style={styles.avatar}
                    borderRadius={16}
                    initialsSize={11}
                  />
                </View>
              ))}
              {deckCount > 6 ? (
                <View style={styles.moreChip}>
                  <AppText variant="stat" size={10} color={colors.textMuted}>
                    +{deckCount - 6}
                  </AppText>
                </View>
              ) : null}
              {deckCount === 0 ? (
                <AppText variant="caption" color={colors.textDim}>
                  Compra sobres en la tienda.
                </AppText>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar mazo"
              onPress={() => router.push('/deck')}
              style={({ pressed }) => [
                styles.editButton,
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <AppText variant="label" size={9} color={colors.accent}>
                Editar
              </AppText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={14}
                color={colors.accent}
              />
            </Pressable>
          </View>
        </View>

        {!catalogReady ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <AppText variant="caption" color={colors.textMuted}>
              Preparando tu colección…
            </AppText>
          </View>
        ) : (
          <View style={styles.actions}>
            {deckReady ? (
              <>
                <Button
                  label={`Jugar clásico · a ${GAME.combatsToWinMatch}`}
                  onPress={() => play(GAME.combatsToWinMatch)}
                  icon="play"
                  size="lg"
                  fullWidth
                />
                <Button
                  label={`Partida rápida · a ${GAME.quickMatchTarget}`}
                  onPress={() => play(GAME.quickMatchTarget)}
                  icon="flash"
                  variant="secondary"
                  size="md"
                  fullWidth
                />
              </>
            ) : ownedCount === 0 ? (
              <>
                <Button
                  label="Comprar sobres"
                  onPress={() => router.push('/shop')}
                  icon="storefront-outline"
                  variant="gold"
                  size="lg"
                  fullWidth
                />
                <Button
                  label="Elegir mis héroes"
                  onPress={() => router.push('/deck')}
                  icon="cards-outline"
                  variant="secondary"
                  size="md"
                  fullWidth
                />
              </>
            ) : (
              <>
                <Button
                  label="Completar mazo"
                  onPress={handleFillDeck}
                  icon="shuffle-variant"
                  variant="gold"
                  size="lg"
                  fullWidth
                />
                <Button
                  label="Elegir mis héroes"
                  onPress={() => router.push('/deck')}
                  icon="cards-outline"
                  variant="secondary"
                  size="md"
                  fullWidth
                />
              </>
            )}
          </View>
        )}

        <View style={styles.linkRow}>
          <LinkTile
            icon="view-grid-outline"
            title="Compendio"
            subtitle={`${heroes.length} héroes`}
            onPress={() => router.push('/compendium')}
          />
          <LinkTile
            icon="help-circle-outline"
            title="Reglas"
            subtitle="Cómo se juega"
            onPress={() => setRulesVisible(true)}
          />
        </View>

        <View style={styles.recordPanel}>
          <View style={styles.recordHeader}>
            <View style={styles.recordTitle}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={14}
                color={colors.gold}
              />
              <AppText variant="label" size={9} color={colors.textMuted}>
                Historial
              </AppText>
            </View>
            <AppText variant="caption" size={11} color={colors.textDim}>
              {record.matches === 0
                ? 'Sin partidas todavía'
                : `${record.matches} ${record.matches === 1 ? 'partida' : 'partidas'}`}
            </AppText>
          </View>
          <View style={styles.recordStats}>
            <RecordStat label="Victorias" value={record.wins} color={colors.green} />
            <View style={styles.recordDivider} />
            <RecordStat label="Derrotas" value={record.losses} color={colors.red} />
            <View style={styles.recordDivider} />
            <RecordStat label="Tablas" value={record.draws} color={colors.gold} />
          </View>
        </View>

        <View style={styles.footerNote}>
          <AppText variant="caption" size={10} color={colors.textDim} align="center">
            {DATA_ATTRIBUTION}
          </AppText>
          <AppText variant="caption" size={9} color={colors.textDim} align="center">
            Beta 1.0 · Solo local/offline
          </AppText>
        </View>
      </ScrollScreen>

      <Toast data={toast} onDismiss={() => setToast(null)} />
      <RulesModal
        visible={rulesVisible}
        onClose={() => setRulesVisible(false)}
        target={GAME.combatsToWinMatch}
      />
    </>
  );
}

function FeaturedStack({ heroes }: { heroes: Hero[] }) {
  if (heroes.length === 0) {
    return (
      <View style={styles.stackPlaceholder}>
        <MaterialCommunityIcons
          name="cards-outline"
          size={36}
          color={colors.textDim}
        />
      </View>
    );
  }

  const [main, left, right] = heroes;

  return (
    <View style={styles.stack}>
      <View pointerEvents="none" style={styles.stackGlow} />
      {left ? (
        <FeaturedCard hero={left} style={styles.cardLeft} />
      ) : null}
      {right ? (
        <FeaturedCard hero={right} style={styles.cardRight} />
      ) : null}
      <FeaturedCard hero={main} style={styles.cardMain} main />
    </View>
  );
}

function FeaturedCard({
  hero,
  style,
  main = false,
}: {
  hero: Hero;
  style?: StyleProp<ViewStyle>;
  main?: boolean;
}) {
  return (
    <View style={[styles.featuredCard, main ? styles.featuredCardMain : null, style]}>
      <HeroAvatar
        hero={hero}
        style={StyleSheet.absoluteFill}
        initialsSize={main ? 46 : 34}
      />
      <LinearGradient
        colors={['rgba(5,9,18,0)', 'rgba(5,9,18,0.55)', 'rgba(5,9,18,0.97)']}
        locations={[0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {main ? (
        <View style={styles.mainBadge}>
          <MaterialCommunityIcons
            name="star-four-points"
            size={10}
            color={colors.gold}
          />
          <AppText variant="label" size={7} color={colors.gold}>
            Tu carta
          </AppText>
        </View>
      ) : null}
      <AppText
        variant="title"
        size={main ? 24 : 19}
        numberOfLines={2}
        style={styles.featuredName}
      >
        {hero.name}
      </AppText>
    </View>
  );
}

function LinkTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkTile,
        pressed ? { opacity: 0.82, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View style={styles.linkIcon}>
        <MaterialCommunityIcons name={icon} size={17} color={colors.accent} />
      </View>
      <View style={styles.linkText}>
        <AppText variant="label" size={9} color={colors.text}>
          {title}
        </AppText>
        <AppText variant="caption" size={10} color={colors.textDim}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

function RecordStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.recordStat}>
      <AppText variant="score" size={22} color={color}>
        {value}
      </AppText>
      <AppText variant="label" size={7.5} color={colors.textDim}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.3),
    backgroundColor: withAlpha(colors.accent, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    flex: 1,
    gap: 1,
  },
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.3),
    backgroundColor: withAlpha(colors.gold, 0.07),
  },
  intro: {
    gap: 2,
    marginTop: 2,
  },
  title: {
    color: colors.text,
    textShadowColor: withAlpha(colors.accent, 0.35),
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 14,
  },
  tagline: {
    marginTop: -2,
  },
  stack: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    height: 228,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  stackGlow: {
    position: 'absolute',
    bottom: -18,
    width: 260,
    height: 90,
    borderRadius: 130,
    backgroundColor: withAlpha(colors.accent, 0.12),
  },
  stackPlaceholder: {
    height: 190,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCard: {
    position: 'absolute',
    width: 122,
    height: 166,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.16),
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 9,
  },
  featuredCardMain: {
    width: 142,
    height: 196,
    borderColor: withAlpha(colors.accent, 0.55),
    zIndex: 3,
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
  },
  cardLeft: {
    left: 18,
    bottom: 4,
    transform: [{ rotate: '-11deg' }],
    zIndex: 1,
    opacity: 0.94,
  },
  cardRight: {
    right: 18,
    bottom: 4,
    transform: [{ rotate: '11deg' }],
    zIndex: 1,
    opacity: 0.94,
  },
  cardMain: {
    bottom: 0,
    zIndex: 3,
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(4,8,16,0.78)',
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
  },
  featuredName: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  deckPanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.22),
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  deckPanelWarning: {
    borderColor: withAlpha(colors.gold, 0.4),
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckHeaderText: {
    flex: 1,
    gap: 1,
  },
  deckCount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  deckTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  deckFill: {
    height: '100%',
    borderRadius: 3,
  },
  deckFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  avatarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingLeft: 4,
  },
  avatarChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    marginRight: -8,
    backgroundColor: colors.bgSoft,
  },
  avatar: {
    flex: 1,
  },
  moreChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: -2,
  },
  linkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  linkTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.accent, 0.08),
  },
  linkText: {
    flex: 1,
    gap: 1,
  },
  recordPanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  footerNote: {
    alignItems: 'center',
    gap: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recordStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  recordDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
});
