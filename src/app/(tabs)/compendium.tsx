import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { Button, IconButton } from '../../components/ui/Button';
import { HeroAvatar } from '../../components/ui/HeroAvatar';
import { HeroCard } from '../../components/HeroCard';
import { Toast, type ToastData } from '../../components/ui/Toast';
import { useCollection } from '../../providers/CollectionProvider';
import { GAME } from '../../game/config';
import { overallRating } from '../../game/qualities';
import { DATA_ATTRIBUTION } from '../../data/api';
import { colors, fonts, layout, radii, spacing, withAlpha } from '../../theme';
import type { Hero } from '../../game/types';

type PublisherFilter = 'all' | 'marvel' | 'dc' | 'other';
type SortMode = 'name' | 'rating';

const PUBLISHER_FILTERS: { id: PublisherFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'marvel', label: 'Marvel' },
  { id: 'dc', label: 'DC' },
  { id: 'other', label: 'Otros' },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function CompendiumScreen() {
  const {
    heroes,
    deckHeroes,
    deckCount,
    deckIds,
    isInDeck,
    toggleDeckHero,
    fillDeck,
    loadingCatalog,
    catalogError,
    catalogSource,
    refreshCatalog,
  } = useCollection();

  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [publisher, setPublisher] = useState<PublisherFilter>('all');
  const [sort, setSort] = useState<SortMode>('name');
  const [toast, setToast] = useState<ToastData | null>(null);

  const contentWidth = Math.min(width, layout.maxWidth) - layout.screenPadding * 2;
  const columns = contentWidth >= 540 ? 3 : 2;
  const gap = 10;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  const deckFull = deckCount >= GAME.deckSize;

  const filtered = useMemo(() => {
    const term = normalize(query);
    const list = heroes.filter((hero) => {
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

    return list.sort((a, b) =>
      sort === 'rating'
        ? overallRating(b) - overallRating(a) || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
  }, [heroes, publisher, query, sort]);

  const notify = (text: string, tone: ToastData['tone'] = 'info') => {
    setToast({ text, tone });
  };

  const handleToggle = (hero: Hero) => {
    const result = toggleDeckHero(hero.id);
    if (!result.ok) {
      if (result.reason === 'full') {
        notify(`Mazo completo (${GAME.deckSize}). Quita un héroe para añadir otro.`, 'error');
      } else {
        notify('Ese héroe ya no está disponible.', 'error');
      }
      return;
    }
    notify(
      result.added ? `${hero.name} añadido al mazo.` : `${hero.name} fuera del mazo.`,
      result.added ? 'success' : 'info',
    );
  };

  const handleFill = () => {
    fillDeck();
    notify('Mazo completado con héroes aleatorios.', 'success');
  };

  const sourceLabel =
    catalogSource === 'network'
      ? 'Catálogo actualizado'
      : catalogSource === 'cache'
        ? 'Catálogo en caché'
        : 'Catálogo local';

  return (
    <>
      <Screen accent="gold">
        <FlatList
          key={`grid-${columns}`}
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
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
                    COMPENDIO
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {heroes.length} héroes · elige hasta {GAME.deckSize} para tu mazo
                  </AppText>
                </View>
                <View style={styles.deckCountBadge}>
                  <AppText variant="score" size={24} color={colors.accent}>
                    {deckCount}
                  </AppText>
                  <AppText variant="caption" size={10} color={colors.textDim}>
                    /{GAME.deckSize}
                  </AppText>
                </View>
              </View>

              <View style={styles.deckPanel}>
                <View style={styles.deckPanelTop}>
                  <AppText variant="label" size={9} color={colors.textMuted}>
                    Tu mazo
                  </AppText>
                  <AppText
                    variant="caption"
                    size={10}
                    color={deckFull ? colors.green : colors.textDim}
                  >
                    {deckFull
                      ? 'Completo'
                      : `${GAME.deckSize - deckCount} ${
                          GAME.deckSize - deckCount === 1 ? 'hueco libre' : 'huecos libres'
                        }`}
                  </AppText>
                </View>

                <View style={styles.deckTrack}>
                  <View
                    style={[
                      styles.deckFill,
                      {
                        width: `${Math.min(100, (deckCount / GAME.deckSize) * 100)}%`,
                        backgroundColor: deckFull ? colors.green : colors.accent,
                      },
                    ]}
                  />
                </View>

                <View style={styles.deckBottom}>
                  <View style={styles.deckAvatars}>
                    {deckHeroes.slice(0, 8).map((hero) => (
                      <View key={hero.id} style={styles.deckAvatar}>
                        <HeroAvatar
                          hero={hero}
                          style={styles.deckAvatarImage}
                          borderRadius={13}
                          initialsSize={10}
                        />
                      </View>
                    ))}
                    {deckCount === 0 ? (
                      <AppText variant="caption" size={10} color={colors.textDim}>
                        Sin héroes todavía
                      </AppText>
                    ) : null}
                  </View>

                  <Button
                    label={deckFull ? 'Mazo lleno' : 'Completar'}
                    onPress={handleFill}
                    disabled={deckFull}
                    icon="shuffle-variant"
                    variant="ghost"
                    size="sm"
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
                {PUBLISHER_FILTERS.map((filter) => {
                  const active = publisher === filter.id;
                  return (
                    <FilterChip
                      key={filter.id}
                      label={filter.label}
                      active={active}
                      onPress={() => setPublisher(filter.id)}
                    />
                  );
                })}
              </View>

              <View style={styles.toolbar}>
                <AppText variant="label" size={8} color={colors.textDim}>
                  {filtered.length} resultados
                </AppText>
                <View style={styles.sortRow}>
                  <SortChip
                    label="A-Z"
                    active={sort === 'name'}
                    onPress={() => setSort('name')}
                  />
                  <SortChip
                    label="Poder"
                    active={sort === 'rating'}
                    onPress={() => setSort('rating')}
                  />
                </View>
              </View>

              <View style={styles.syncRow}>
                <View
                  style={[
                    styles.syncDot,
                    {
                      backgroundColor: catalogError
                        ? colors.red
                        : catalogSource === 'network'
                          ? colors.green
                          : colors.gold,
                    },
                  ]}
                />
                <AppText
                  variant="caption"
                  size={10}
                  color={catalogError ? colors.red : colors.textDim}
                  style={styles.syncText}
                  numberOfLines={2}
                >
                  {catalogError ?? sourceLabel}
                </AppText>
                {loadingCatalog ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <IconButton
                    icon="reload"
                    label="Actualizar catálogo"
                    size={30}
                    onPress={() => {
                      void refreshCatalog();
                    }}
                  />
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <HeroCard
              hero={item}
              width={cardWidth}
              onPress={() => router.push(`/hero/${item.id}`)}
              onToggleDeck={() => handleToggle(item)}
              inDeck={isInDeck(item.id)}
              deckFull={deckFull}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="card-text-outline"
                size={34}
                color={colors.textDim}
              />
              <AppText variant="subheading" color={colors.textMuted}>
                Sin resultados
              </AppText>
              <AppText variant="caption" color={colors.textDim} align="center">
                Prueba con otro nombre o cambia el filtro de editorial.
              </AppText>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <AppText variant="caption" size={10} color={colors.textDim} align="center">
                {DATA_ATTRIBUTION}
              </AppText>
              <AppText variant="caption" size={9} color={colors.textDim} align="center">
                {deckIds.length} héroes guardados en tu mazo
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
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? withAlpha(colors.accent, 0.14) : 'rgba(255,255,255,0.025)',
          borderColor: active ? withAlpha(colors.accent, 0.5) : colors.border,
        },
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <AppText
        variant="label"
        size={9}
        color={active ? colors.accent : colors.textMuted}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sortChip,
        active ? styles.sortChipActive : null,
        pressed ? { opacity: 0.7 } : null,
      ]}
    >
      <AppText
        variant="label"
        size={8}
        color={active ? colors.gold : colors.textDim}
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
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  deckCountBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.25),
    backgroundColor: withAlpha(colors.accent, 0.06),
  },
  deckPanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  deckPanelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  deckBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  deckAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minHeight: 30,
  },
  deckAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    marginRight: -7,
    backgroundColor: colors.bgSoft,
  },
  deckAvatarImage: {
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
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  sortChipActive: {
    backgroundColor: withAlpha(colors.gold, 0.12),
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 2,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    flex: 1,
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
    gap: 2,
  },
});
