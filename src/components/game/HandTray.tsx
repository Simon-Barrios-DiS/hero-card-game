import React, { useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors, spacing } from '../../theme';
import type { HandCard as HandCardModel } from '../../game/types';
import { AppText } from '../ui/AppText';
import { HandCard, HAND_CARD_WIDTH } from '../HandCard';

interface HandTrayProps {
  cards: HandCardModel[];
  selectedUid: string | null;
  disabled: boolean;
  onSelect: (uid: string | null) => void;
  /** Texto que se muestra cuando la mano ya está vacía. */
  emptyText?: string;
}

const GAP = 10;

export function HandTray({
  cards,
  selectedUid,
  disabled,
  onSelect,
  emptyText = 'Sin cartas en mano',
}: HandTrayProps) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const selectedIndex = cards.findIndex((card) => card.uid === selectedUid);

  const handleSelect = useCallback(
    (uid: string) => {
      const next = selectedUid === uid ? null : uid;
      onSelect(next);

      const index = cards.findIndex((card) => card.uid === uid);
      if (index >= 0 && next) {
        scrollRef.current?.scrollTo({
          x: Math.max(0, index * (HAND_CARD_WIDTH + GAP) - 70),
          animated: true,
        });
      }
    },
    [cards, onSelect, selectedUid],
  );

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="label" size={10} color={colors.textMuted}>
            Tu mano
          </AppText>
          <View style={styles.countBadge}>
            <AppText variant="stat" size={11} color={colors.accent}>
              {cards.length}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" size={11} color={colors.textDim}>
          {cards.length === 0
            ? emptyText
            : selectedUid
              ? 'Toca un duelo libre'
              : 'Toca una carta para elegir'}
        </AppText>
      </View>

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="label" size={9} color={colors.textDim} style={styles.emptyLabel}>
            {emptyText}
          </AppText>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
          scrollEnabled={cards.length * (HAND_CARD_WIDTH + GAP) > 300}
        >
          {cards.map((card, index) => (
            <HandCard
              key={card.uid}
              card={card}
              index={index}
              selected={card.uid === selectedUid}
              disabled={disabled}
              onPress={() => handleSelect(card.uid)}
            />
          ))}
        </ScrollView>
      )}

      {selectedIndex >= 0 ? (
        <View pointerEvents="none" style={styles.selectionLine} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countBadge: {
    minWidth: 18,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 1,
    gap: GAP,
  },
  empty: {
    height: 96,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  emptyLabel: {
    letterSpacing: 1.4,
  },
  selectionLine: {
    height: 2,
    width: 44,
    alignSelf: 'center',
    marginTop: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
});
