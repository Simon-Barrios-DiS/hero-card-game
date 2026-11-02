import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, spacing, withAlpha } from '../../theme';
import {
  HERO_SORT_OPTIONS,
  sortDirectionText,
  type HeroSort,
  type HeroSortKey,
} from '../../game/sorting';
import { AppText } from './AppText';

interface SortBarProps {
  sort: HeroSort;
  onChange: (key: HeroSortKey) => void;
  resultLabel: string;
}

/**
 * Fila de ordenación compartida por compendio y mazo. Cada opción ordena de
 * mayor a menor (o A-Z) y, al pulsarla de nuevo, invierte la dirección.
 */
export function SortBar({ sort, onChange, resultLabel }: SortBarProps) {
  const activeLabel =
    HERO_SORT_OPTIONS.find((option) => option.key === sort.key)?.label ?? '';
  const activeDirection = sortDirectionText(sort.key, sort.direction);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label" size={8} color={colors.textDim}>
          {resultLabel}
        </AppText>
        <AppText variant="caption" size={9} color={colors.textDim}>
          {activeLabel} · {activeDirection}
        </AppText>
      </View>

      <View style={styles.row}>
        {HERO_SORT_OPTIONS.map((option) => {
          const active = option.key === sort.key;
          const direction = sortDirectionText(option.key, sort.direction);

          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={
                active
                  ? `Ordenar por ${option.label}, ${direction}`
                  : `Ordenar por ${option.label}`
              }
              onPress={() => onChange(option.key)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <AppText
                variant="label"
                size={8}
                color={active ? colors.gold : colors.textDim}
              >
                {option.label}
              </AppText>
              {active ? (
                <MaterialCommunityIcons
                  name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={11}
                  color={colors.gold}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  chipActive: {
    borderColor: withAlpha(colors.gold, 0.45),
    backgroundColor: withAlpha(colors.gold, 0.1),
  },
  pressed: {
    opacity: 0.75,
  },
});
