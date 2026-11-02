import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollScreen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { HeroAvatar } from '../../components/ui/HeroAvatar';
import { Tag } from '../../components/ui/Tag';
import { Toast, type ToastData } from '../../components/ui/Toast';
import { useCollection } from '../../providers/CollectionProvider';
import {
  PACK_OFFERS,
  type PackOffer,
  type PackPurchaseSuccess,
} from '../../game/shop';
import { colors, radii, spacing, withAlpha } from '../../theme';

export default function ShopScreen() {
  const { tokens, tutorial, buyPacks, catalogReady } = useCollection();
  const [lastPurchase, setLastPurchase] = useState<PackPurchaseSuccess | null>(
    null,
  );
  const [toast, setToast] = useState<ToastData | null>(null);
  const buyingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const tutorialPending = !tutorial.completed;

  const offerLocked = (offer: PackOffer): boolean => {
    if (!catalogReady || tokens < offer.price) return true;
    if (!tutorialPending) return false;
    if (offer.packs === 1) return tutorial.singleBought;
    if (offer.packs === 5) return tutorial.fiveBought;
    return true;
  };

  const offerHint = (offer: PackOffer): string | null => {
    if (!catalogReady) return 'Cargando catálogo…';
    if (tutorialPending) {
      if (offer.packs !== 1 && offer.packs !== 5) {
        return 'Se activa al completar el tutorial.';
      }
      if (offer.packs === 1 && tutorial.singleBought) {
        return 'Sobre del tutorial ya comprado.';
      }
      if (offer.packs === 5 && tutorial.fiveBought) {
        return 'Pack del tutorial ya comprado.';
      }
    }
    if (tokens < offer.price) {
      return `Te faltan ${offer.price - tokens} tokens.`;
    }
    return null;
  };

  const handleBuy = (offer: PackOffer) => {
    if (buyingRef.current) return;
    buyingRef.current = true;
    const result = buyPacks(offer.id);

    if (result.ok) {
      setLastPurchase(result);
      setToast({
        text:
          result.duplicateCount > 0
            ? `${result.newCount} nuevas · +${result.refund} tokens por repetidas.`
            : `${result.newCount} cartas nuevas.`,
        tone: 'success',
      });
    } else {
      setToast({ text: result.error, tone: 'error' });
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      buyingRef.current = false;
    }, 450);
  };

  const newHeroes = lastPurchase
    ? lastPurchase.cards.filter((card) => !card.duplicate)
    : [];

  return (
    <>
      <ScrollScreen contentContainerStyle={styles.content} accent="gold">
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText variant="display" size={42}>
              TIENDA
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Sobres de héroes
            </AppText>
          </View>

          <View style={styles.tokenPill}>
            <MaterialCommunityIcons
              name="diamond-stone"
              size={15}
              color={colors.gold}
            />
            <AppText variant="score" size={22} color={colors.gold}>
              {tokens}
            </AppText>
            <AppText variant="caption" size={9} color={colors.textDim}>
              tokens
            </AppText>
          </View>
        </View>

        {tutorialPending ? (
          <View style={styles.tutorial}>
            <View style={styles.tutorialHeader}>
              <MaterialCommunityIcons
                name="compass-outline"
                size={15}
                color={colors.accent}
              />
              <AppText variant="label" size={9} color={colors.text}>
                Primeros pasos
              </AppText>
            </View>
            <TutorialRow label="Compra 1 sobre" done={tutorial.singleBought} />
            <TutorialRow
              label="Compra el pack de 5"
              done={tutorial.fiveBought}
            />
            <AppText variant="caption" size={9} color={colors.textDim}>
              Cada sobre trae 5 héroes. Los repetidos se convierten en tokens.
            </AppText>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="heading" size={20}>
            Sobres
          </AppText>
          <AppText variant="caption" size={10} color={colors.textDim}>
            5 cartas por sobre
          </AppText>
        </View>

        <View style={styles.offers}>
          {PACK_OFFERS.map((offer) => {
            const locked = offerLocked(offer);
            const hint = offerHint(offer);
            return (
              <View key={offer.id} style={styles.offer}>
                <View style={styles.offerInfo}>
                  <View style={styles.offerTitleRow}>
                    <AppText variant="subheading" size={17}>
                      {offer.label}
                    </AppText>
                    {tutorialPending &&
                    (offer.packs === 1 || offer.packs === 5) ? (
                      <Tag label="Tutorial" color={colors.gold} size="xs" />
                    ) : null}
                  </View>
                  <AppText variant="caption" size={10} color={colors.textDim}>
                    {offer.packs * 5} héroes · {offer.price} tokens
                  </AppText>
                  {hint ? (
                    <AppText variant="caption" size={9} color={colors.textDim}>
                      {hint}
                    </AppText>
                  ) : null}
                </View>
                <Button
                  label={`${offer.price} tokens`}
                  onPress={() => handleBuy(offer)}
                  icon="diamond-stone"
                  variant={locked ? 'ghost' : 'gold'}
                  size="sm"
                  disabled={locked || !catalogReady}
                />
              </View>
            );
          })}
        </View>

        {lastPurchase ? (
          <View style={styles.result}>
            <View style={styles.resultHeader}>
              <AppText variant="label" size={9} color={colors.textMuted}>
                Última compra
              </AppText>
              <AppText variant="caption" size={10} color={colors.textDim}>
                {lastPurchase.offer.label}
              </AppText>
            </View>

            <View style={styles.resultStats}>
              <ResultStat
                label="Nuevas"
                value={lastPurchase.newCount}
                color={colors.green}
              />
              <ResultStat
                label="Repetidas"
                value={lastPurchase.duplicateCount}
                color={colors.textMuted}
              />
              <ResultStat
                label="Tokens"
                value={`+${lastPurchase.refund}`}
                color={colors.gold}
              />
            </View>

            {newHeroes.length > 0 ? (
              <View style={styles.newHeroes}>
                {newHeroes.slice(0, 8).map(({ hero }) => (
                  <View key={hero.id} style={styles.newHero}>
                    <HeroAvatar
                      hero={hero}
                      style={styles.newHeroAvatar}
                      borderRadius={14}
                      initialsSize={10}
                    />
                    <AppText
                      variant="caption"
                      size={9}
                      color={colors.textMuted}
                      numberOfLines={1}
                    >
                      {hero.name}
                    </AppText>
                  </View>
                ))}
                {newHeroes.length > 8 ? (
                  <AppText variant="caption" size={9} color={colors.textDim}>
                    +{newHeroes.length - 8} más
                  </AppText>
                ) : null}
              </View>
            ) : (
              <AppText variant="caption" size={10} color={colors.textDim}>
                Todo repetido: +{lastPurchase.refund} tokens.
              </AppText>
            )}

            <AppText variant="caption" size={9} color={colors.textDim}>
              Saldo: {lastPurchase.tokens} tokens
            </AppText>
          </View>
        ) : null}

        <View style={styles.note}>
          {catalogReady ? null : (
            <ActivityIndicator size="small" color={colors.accent} />
          )}
          <AppText variant="caption" size={10} color={colors.textDim}>
            Gana 5 tokens por ronda ganada.
          </AppText>
        </View>
        <AppText variant="caption" size={9} color={colors.textDim} align="center">
          Repetidos: SSR +10 · SR +5 · comunes +3 tokens.
        </AppText>
      </ScrollScreen>

      <Toast data={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function TutorialRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.tutorialRow}>
      <MaterialCommunityIcons
        name={done ? 'check-circle' : 'circle-outline'}
        size={14}
        color={done ? colors.green : colors.textDim}
      />
      <AppText
        variant="caption"
        size={11}
        color={done ? colors.textMuted : colors.text}
      >
        {label}
      </AppText>
    </View>
  );
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <View style={styles.resultStat}>
      <AppText variant="score" size={20} color={color}>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
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
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
    backgroundColor: withAlpha(colors.gold, 0.08),
  },
  tutorial: {
    gap: spacing.xs + 2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.24),
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  tutorialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  offers: {
    gap: spacing.sm,
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  offerInfo: {
    flex: 1,
    gap: 2,
  },
  offerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  result: {
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.22),
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  newHeroes: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  newHero: {
    width: 52,
    alignItems: 'center',
    gap: 3,
  },
  newHeroAvatar: {
    width: 30,
    height: 30,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
