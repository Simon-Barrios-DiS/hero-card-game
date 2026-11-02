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
import { IconButton } from '../../components/ui/Button';
import { SortBar } from '../../components/ui/SortBar';
import { HeroCard } from '../../components/HeroCard';
import { useCollection } from '../../providers/CollectionProvider';
import { nextHeroSort, sortHeroes, type HeroSort } from '../../game/sorting';
import { DATA_ATTRIBUTION } from '../../data/api';
import { colors, fonts, layout, radii, spacing, withAlpha } from '../../theme';

type PublisherFilter = 'all' | 'marvel' | 'dc' | 'other';

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
    ownedCount,
    isOwned,
    loadingCatalog,
    catalogError,
    catalogSource,
    refreshCatalog,
  } = useCollection();

  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [publisher, setPublisher] = useState<PublisherFilter>('all');
  const [sort, setSort] = useState<HeroSort>({ key: 'name', direction: 'asc' });

  const contentWidth = Math.min(width, layout.maxWidth) - layout.screenPadding * 2;
  const columns = contentWidth >= 540 ? 3 : 2;
  const gap = 10;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

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

    return sortHeroes(list, sort);
  }, [heroes, publisher, query, sort]);

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
          extraData={ownedCount}
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
                    {heroes.length} héroes · {ownedCount} en tu colección
                  </AppText>
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

              <SortBar
                sort={sort}
                onChange={(key) => setSort((previous) => nextHeroSort(previous, key))}
                resultLabel={`${filtered.length} resultados`}
              />

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
              owned={isOwned(item.id)}
              onPress={() => router.push(`/hero/${item.id}`)}
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
            </View>
          }
        />
      </Screen>
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
