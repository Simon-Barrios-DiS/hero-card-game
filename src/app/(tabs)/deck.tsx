import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { SortBar } from '../../components/ui/SortBar';
import { HeroCard } from '../../components/HeroCard';
import { Toast, type ToastData } from '../../components/ui/Toast';
import { RARITY_COLORS } from '../../components/ui/RarityBadge';
import { useCollection } from '../../providers/CollectionProvider';
import { GAME } from '../../game/config';
import {
  DECK_BLOCK_MESSAGES,
  DECK_LIMITS,
  DECK_TIERS,
  deckTierOf,
  type DeckTier,
} from '../../game/deckRules';
import { nextHeroSort, sortHeroes, type HeroSort } from '../../game/sorting';
import { colors, fonts, layout, radii, spacing, withAlpha } from '../../theme';

type PublisherFilter = 'all' | 'marvel' | 'dc' | 'other';
type RarityFilter = 'all' | DeckTier;
type ScopeFilter = 'all' | 'owned' | 'deck';

const PUBLISHER_FILTERS: { id: PublisherFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'marvel', label: 'Marvel' },
  { id: 'dc', label: 'DC' },
  { id: 'other', label: 'Otros' },
];

const RARITY_FILTERS: { id: RarityFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'SSR', label: 'SSR' },
  { id: 'SR', label: 'SR' },
  { id: 'regular', label: 'Comunes' },
];

const TIER_INFO: Record<DeckTier, { label: string; color: string }> = {
  SSR: { label: 'SSR', color: RARITY_COLORS.SSR.color },
  SR: { label: 'SR', color: RARITY_COLORS.SR.color },
  regular: { label: 'Comunes', color: colors.textMuted },
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function DeckScreen() {
  const {
    heroes,
    deckIds,
    deckCount,
    deckCounts,
    deckPower,
    deckComplete,
    catalogReady,
    ownedCount,
    isOwned,
    isInDeck,
    canAddToDeck,
    toggleDeckHero,
    fillDeck,
    clearDeck,
  } = useCollection();

  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [publisher, setPublisher] = useState<PublisherFilter>('all');
  const [rarity, setRarity] = useState<RarityFilter>('all');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [sort, setSort] = useState<HeroSort>({ key: 'rating', direction: 'desc' });
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const contentWidth = Math.min(width, layout.maxWidth) - layout.screenPadding * 2;
  const columns = contentWidth >= 540 ? 3 : 2;
  const gap = 10;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  const missing = Math.max(0, GAME.deckSize - deckCount);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  const filtered = useMemo(() => {
    const term = normalize(query);
    const list = heroes.filter((hero) => {
      if (scope === 'deck' && !isInDeck(hero.id)) return false;
      if (scope === 'owned' && !isOwned(hero.id)) return false;
      if (rarity !== 'all' && deckTierOf(hero) !== rarity) return false;
      if (publisher !== 'all') {
        const isMarvel = /marvel/i.test(hero.publisher);
        const isDc = /\bdc\b/i.test(hero.publisher);
        if (publisher === 'marvel' && !isMarvel) return false;
        if (publisher === 'dc' && !isDc) return false;
        if (publisher === 'other' && (isMarvel || isDc)) return false;
      }
      if (!term) return true;
      const haystack = [hero.name, hero.fullName, hero.publisher, ...hero.aliases]
        .join(' ')
        .toLowerCase();
      return normalize(haystack).includes(term);
    });

    return sortHeroes(list, sort);
  }, [heroes, isInDeck, isOwned, publisher, query, rarity, scope, sort]);

  const notify = (text: string, tone: ToastData['tone'] = 'info') => {
    setToast({ text, tone });
  };

  const handleToggle = (hero: (typeof heroes)[number]) => {
    const result = toggleDeckHero(hero.id);
    if (!result.ok) {
      notify(DECK_BLOCK_MESSAGES[result.reason], 'error');
      return;
    }
    setConfirmClear(false);
    notify(
      result.added ? `${hero.name} añadido al mazo.` : `${hero.name} fuera del mazo.`,
      result.added ? 'success' : 'info',
    );
  };

  const handleFill = () => {
    if (deckComplete || !catalogReady) return;
    const result = fillDeck();
    setConfirmClear(false);
    if (result.deckSize === 0) {
      notify('No tienes héroes. Compra sobres en la tienda.', 'error');
      return;
    }
    if (result.complete) {
      notify('Mazo completado al azar.', 'success');
      return;
    }
    notify(
      `Mazo rellenado: ${result.deckSize}/${GAME.deckSize}. Consigue más héroes en la tienda.`,
      'info',
    );
  };

  const handleClear = () => {
    if (deckCount === 0 || !catalogReady) return;
    if (!confirmClear) {
      setConfirmClear(true);
      notify('Toca confirmar para vaciar el mazo.', 'info');
      return;
    }
    clearDeck();
    setConfirmClear(false);
    notify('Mazo vaciado.', 'info');
  };

  const statusText = !catalogReady
    ? 'Cargando catálogo…'
    : deckComplete
      ? 'Listo para combatir'
      : `Faltan ${missing} ${missing === 1 ? 'carta' : 'cartas'}`;

  const ownedEmpty = scope === 'owned' && ownedCount === 0;
  const emptyTitle =
    scope === 'deck'
      ? 'Tu mazo está vacío'
      : ownedEmpty
        ? 'Aún no tienes héroes'
        : 'Sin resultados';
  const emptyText =
    scope === 'deck'
      ? 'Añade héroes desde la lista o llena el mazo al azar.'
      : ownedEmpty
        ? 'Compra sobres en la tienda para empezar tu colección.'
        : 'Prueba con otro nombre o cambia los filtros.';

  return (
    <>
      <Screen accent="gold">
        <FlatList
          key={`deck-grid-${columns}`}
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
          extraData={`${deckIds.join('|')}-${ownedCount}`}
          columnWrapperStyle={{
            paddingHorizontal: layout.screenPadding,
            gap,
            marginBottom: 12,
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleText}>
                  <AppText variant="display" size={42}>
                    MAZO
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {GAME.deckSize} héroes · 1 SSR · 9 SR · 20 comunes
                  </AppText>
                  <AppText variant="caption" size={10} color={colors.textDim}>
                    {ownedCount} en tu colección
                  </AppText>
                </View>
              </View>

              <View style={styles.deckPanel}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderText}>
                    <AppText variant="label" size={10} color={colors.textMuted}>
                      Tu mazo
                    </AppText>
                    <AppText
                      variant="caption"
                      color={deckComplete ? colors.green : colors.gold}
                    >
                      {deckCount}/{GAME.deckSize} · {statusText}
                    </AppText>
                  </View>
                  <View style={styles.powerBox}>
                    <AppText variant="label" size={7.5} color={colors.textDim}>
                      Poder
                    </AppText>
                    <AppText variant="score" size={26} color={colors.gold}>
                      {deckPower}
                    </AppText>
                    <AppText variant="caption" size={8} color={colors.textDim}>
                      suma de promedios
                    </AppText>
                  </View>
                </View>

                <View style={styles.deckTrack}>
                  <View
                    style={[
                      styles.deckFill,
                      {
                        width: `${Math.min(100, (deckCount / GAME.deckSize) * 100)}%`,
                        backgroundColor: deckComplete ? colors.green : colors.gold,
                      },
                    ]}
                  />
                </View>

                <View style={styles.tierRow}>
                  {DECK_TIERS.map((tier) => {
                    const info = TIER_INFO[tier];
                    const count = deckCounts[tier];
                    const limit = DECK_LIMITS[tier];
                    const filled = count >= limit;
                    return (
                      <View
                        key={tier}
                        style={[
                          styles.tierCell,
                          {
                            borderColor: withAlpha(info.color, 0.3),
                            backgroundColor: withAlpha(info.color, 0.05),
                          },
                        ]}
                      >
                        <AppText variant="label" size={8} color={info.color}>
                          {info.label}
                        </AppText>
                        <AppText
                          variant="stat"
                          size={13}
                          color={filled ? colors.green : colors.text}
                        >
                          {count}/{limit}
                        </AppText>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.deckActions}>
                  <Button
                    label={confirmClear ? 'Confirmar' : 'Vaciar'}
                    onPress={handleClear}
                    icon={confirmClear ? 'delete-forever' : 'delete-outline'}
                    variant={confirmClear ? 'danger' : 'ghost'}
                    size="sm"
                    disabled={deckCount === 0 || !catalogReady}
                    style={styles.deckActionButton}
                  />
                  <Button
                    label={deckComplete ? 'Mazo completo' : 'Llenar al azar'}
                    onPress={handleFill}
                    icon={deckComplete ? 'check' : 'shuffle-variant'}
                    variant={deckComplete ? 'ghost' : 'gold'}
                    size="sm"
                    disabled={deckComplete || !catalogReady}
                    style={styles.deckActionButton}
                  />
                </View>
              </View>

              <View style={styles.searchBox}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={18}
                  color={colors.textDim}
                />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar héroe, alias o editorial…"
                  placeholderTextColor={colors.textDim}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {query.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar búsqueda"
                    onPress={() => setQuery('')}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.filters}>
                {PUBLISHER_FILTERS.map((filter) => (
                  <FilterChip
                    key={filter.id}
                    label={filter.label}
                    active={publisher === filter.id}
                    onPress={() => setPublisher(filter.id)}
                  />
                ))}
              </View>

              <View style={styles.filters}>
                {RARITY_FILTERS.map((filter) => (
                  <FilterChip
                    key={filter.id}
                    label={filter.label}
                    active={rarity === filter.id}
                    onPress={() => setRarity(filter.id)}
                    color={
                      filter.id === 'SSR'
                        ? RARITY_COLORS.SSR.color
                        : filter.id === 'SR'
                          ? RARITY_COLORS.SR.color
                          : null
                    }
                  />
                ))}
                <View style={styles.filterDivider} />
                <FilterChip
                  label="Solo míos"
                  active={scope === 'owned'}
                  onPress={() =>
                    setScope((previous) => (previous === 'owned' ? 'all' : 'owned'))
                  }
                />
                <FilterChip
                  label="En el mazo"
                  active={scope === 'deck'}
                  onPress={() =>
                    setScope((previous) => (previous === 'deck' ? 'all' : 'deck'))
                  }
                />
              </View>

              <SortBar
                sort={sort}
                onChange={(key) => setSort((previous) => nextHeroSort(previous, key))}
                resultLabel={`${filtered.length} resultados`}
              />
            </View>
          }
          renderItem={({ item }) => {
            const inDeck = isInDeck(item.id);
            const owned = isOwned(item.id);
            const check = inDeck ? null : canAddToDeck(item.id);
            return (
              <HeroCard
                hero={item}
                width={cardWidth}
                inDeck={inDeck}
                owned={owned}
                deckBlocked={Boolean(check && !check.ok)}
                onPress={() => handleToggle(item)}
                onToggleDeck={() => handleToggle(item)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name={scope === 'deck' ? 'cards-outline' : 'card-search-outline'}
                size={34}
                color={colors.textDim}
              />
              <AppText variant="subheading" color={colors.textMuted}>
                {emptyTitle}
              </AppText>
              <AppText variant="caption" color={colors.textDim} align="center">
                {emptyText}
              </AppText>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <AppText variant="caption" size={10} color={colors.textDim} align="center">
                El poder del mazo es la suma de los promedios de sus cartas.
              </AppText>
            </View>
          }
        />
      </Screen>

      <Toast data={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string | null;
}) {
  const activeColor = color ?? colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? withAlpha(activeColor, 0.14)
            : 'rgba(255,255,255,0.025)',
          borderColor: active ? withAlpha(activeColor, 0.5) : colors.border,
        },
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <AppText
        variant="label"
        size={9}
        color={active ? activeColor : colors.textMuted}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  deckPanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.28),
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  deckHeaderText: {
    flex: 1,
    gap: 1,
  },
  powerBox: {
    alignItems: 'flex-end',
    minWidth: 96,
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
  tierRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tierCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deckActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deckActionButton: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontFamily: fonts.condensed,
    fontSize: 15,
    letterSpacing: 0.3,
    paddingVertical: 0,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: colors.borderStrong,
    marginHorizontal: 2,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: 40,
    paddingVertical: spacing.xxl,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
  },
});
