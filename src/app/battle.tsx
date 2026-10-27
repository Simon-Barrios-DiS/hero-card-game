import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Screen } from '../components/ui/Screen';
import { AppText } from '../components/ui/AppText';
import { Button, IconButton } from '../components/ui/Button';
import { ScoreBar } from '../components/ScoreBar';
import { DuelLane } from '../components/DuelLane';
import { RulesModal } from '../components/RulesModal';
import { Toast, type ToastData } from '../components/ui/Toast';
import { HandTray } from '../components/game/HandTray';
import { CombatSummary } from '../components/game/CombatSummary';
import { MatchOverlay } from '../components/game/MatchOverlay';
import { useCollection } from '../providers/CollectionProvider';
import { GAME, isMatchTarget } from '../game/config';
import { buildOpponentDeck, resolvePlayerDeck } from '../game/deck';
import { useMatch } from '../hooks/useMatch';
import { hapticImpact } from '../utils/feedback';
import { colors, radii, spacing, withAlpha } from '../theme';

export default function BattleRoute() {
  const params = useLocalSearchParams<{ target?: string }>();
  const target = isMatchTarget(params.target)
    ? Number(params.target)
    : GAME.combatsToWinMatch;

  const { preferencesReady, deckCount, heroes } = useCollection();

  if (!preferencesReady) {
    return (
      <BattleGuard
        icon="cards-playing-outline"
        title="Preparando la partida"
        message="Cargando tu mazo y la colección de héroes…"
        loading
      />
    );
  }

  if (deckCount < GAME.minDeckSize || heroes.length < GAME.handSize) {
    return (
      <BattleGuard
        icon="alert-circle-outline"
        title="Mazo incompleto"
        message={`Necesitas al menos ${GAME.minDeckSize} héroes para combatir.`}
        actionLabel="Ir al compendio"
        onAction={() => router.replace('/compendium')}
      />
    );
  }

  return <BattleSession target={target} />;
}

function BattleSession({ target }: { target: number }) {
  const { heroes, deckHeroes, registerMatch } = useCollection();
  const [rulesVisible, setRulesVisible] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // El mazo se congela al entrar: aunque el catálogo remoto termine de
  // cargar, la partida en curso no cambia de cartas.
  const [playerDeck] = useState(() =>
    resolvePlayerDeck(
      heroes,
      deckHeroes.map((hero) => hero.id),
    ),
  );
  const [opponentDeck] = useState(() =>
    buildOpponentDeck(heroes, playerDeck),
  );

  const match = useMatch({
    playerDeck,
    opponentDeck,
    target,
    onMatchEnd: (winner) => {
      registerMatch(winner === 'player' ? 'win' : 'loss');
    },
  });

  const { state } = match;
  const phase = state.phase;
  const playerCard = useMemo(
    () =>
      match.selectedCardUid
        ? state.hands.player.find((card) => card.uid === match.selectedCardUid) ?? null
        : null,
    [match.selectedCardUid, state.hands.player],
  );

  const notify = (text: string, tone: ToastData['tone'] = 'info') => {
    setToast({ text, tone });
  };

  useEffect(() => {
    const message = match.error;
    if (!message) return;
    const timer = setTimeout(() => {
      setToast({ text: message, tone: 'error' });
    }, 0);
    return () => clearTimeout(timer);
  }, [match.error]);

  const handleLanePress = (slotIndex: number) => {
    if (!match.playerCanPlace) return;
    if (!match.selectedCardUid) {
      notify('Primero elige una carta de tu mano.', 'info');
      return;
    }
    if (match.placeSelected(slotIndex)) {
      hapticImpact();
    } else {
      notify('No puedes colocar la carta en ese duelo.', 'error');
    }
  };

  const status = getStatus(match, playerCard?.hero.name, target);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} accent="magenta">
      <View style={styles.root}>
        <View style={styles.header}>
          <IconButton
            icon="chevron-left"
            label="Salir de la partida"
            onPress={() => router.back()}
          />
          <View style={styles.headerCenter}>
            <AppText variant="label" size={8} color={colors.textDim}>
              Partida a {target}
            </AppText>
            <AppText variant="heading" size={19} color={colors.text}>
              Duelo de cualidades
            </AppText>
          </View>
          <IconButton
            icon="help-circle-outline"
            label="Cómo jugar"
            onPress={() => setRulesVisible(true)}
          />
        </View>

        <ScoreBar
          combatNumber={state.combatNumber}
          target={target}
          playerWins={match.displayedCombatWins.player}
          opponentWins={match.displayedCombatWins.opponent}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.banner,
              {
                borderColor: withAlpha(status.color, 0.28),
                backgroundColor: withAlpha(status.color, 0.07),
              },
            ]}
          >
            <View style={[styles.bannerIcon, { borderColor: withAlpha(status.color, 0.4) }]}>
              {status.spinner ? (
                <ActivityIndicator size="small" color={status.color} />
              ) : (
                <MaterialCommunityIcons
                  name={status.icon}
                  size={16}
                  color={status.color}
                />
              )}
            </View>
            <View style={styles.bannerText}>
              <AppText variant="label" size={10} color={status.color}>
                {status.title}
              </AppText>
              <AppText variant="caption" size={11} color={colors.textMuted} numberOfLines={2}>
                {status.subtitle}
              </AppText>
            </View>
            {phase === 'placing' ? (
              <View style={styles.turnPill}>
                <View
                  style={[
                    styles.turnDot,
                    {
                      backgroundColor:
                        state.turn === 'player' ? colors.accent : colors.magenta,
                    },
                  ]}
                />
                <AppText variant="label" size={7} color={colors.textMuted}>
                  {state.turn === 'player' ? 'Tú' : 'Rival'}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.board}>
            {state.qualities.map((qualityId, slotIndex) => {
              const playerCardInSlot = state.placements.player[slotIndex];
              const opponentCardInSlot = state.placements.opponent[slotIndex];
              const revealed = Boolean(state.results) && match.revealedCount > slotIndex;
              const result = state.results?.[slotIndex] ?? null;

              return (
                <DuelLane
                  key={`${state.combatNumber}-${slotIndex}-${qualityId}`}
                  slotIndex={slotIndex}
                  qualityId={qualityId}
                  opponentCard={opponentCardInSlot}
                  playerCard={playerCardInSlot}
                  revealed={revealed}
                  result={result}
                  interactive={match.playerCanPlace && !playerCardInSlot}
                  highlighted={
                    match.playerCanPlace &&
                    Boolean(match.selectedCardUid) &&
                    !playerCardInSlot
                  }
                  onPress={() => handleLanePress(slotIndex)}
                />
              );
            })}
          </View>

          {phase !== 'placing' && !state.results ? (
            <View style={styles.revealNote}>
              <MaterialCommunityIcons
                name="cards-outline"
                size={14}
                color={colors.accent}
              />
              <AppText variant="caption" size={11} color={colors.textMuted}>
                Las cartas están en la mesa. Revelando duelos…
              </AppText>
            </View>
          ) : null}

          {match.showSummary && state.results && state.combatWinner ? (
            <CombatSummary
              visible
              results={state.results}
              duelWins={state.duelWins}
              combatWinner={state.combatWinner}
              combatWins={state.combatWins}
              target={target}
              matchOver={phase === 'matchOver'}
              onNext={match.next}
            />
          ) : null}

          <HandTray
            cards={state.hands.player}
            selectedUid={match.selectedCardUid}
            disabled={!match.playerCanPlace}
            onSelect={match.selectCard}
            emptyText={
              phase === 'placing'
                ? 'Mano vacía'
                : 'Cartas jugadas · revelando duelos'
            }
          />
        </ScrollView>
      </View>

      <MatchOverlay
        visible={phase === 'matchOver' && match.showSummary && Boolean(state.winner)}
        winner={state.winner ?? 'player'}
        combatWins={state.combatWins}
        target={target}
        onRematch={match.restart}
        onExit={() => router.replace('/')}
      />

      <Toast data={toast} onDismiss={() => setToast(null)} />
      <RulesModal
        visible={rulesVisible}
        onClose={() => setRulesVisible(false)}
        target={target}
      />
    </Screen>
  );
}

function getStatus(
  match: ReturnType<typeof useMatch>,
  selectedHeroName: string | undefined,
  target: number,
): {
  title: string;
  subtitle: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  spinner?: boolean;
} {
  const { state } = match;

  if (state.phase === 'placing') {
    if (state.turn === 'opponent') {
      return {
        title: 'El rival está pensando',
        subtitle: 'Colocando una carta en uno de los duelos libres.',
        color: colors.magenta,
        icon: 'cards-playing-outline',
        spinner: true,
      };
    }
    if (match.selectedCardUid && selectedHeroName) {
      return {
        title: 'Elige un duelo libre',
        subtitle: `${selectedHeroName} espera tu orden. Toca uno de los huecos.`,
        color: colors.accent,
        icon: 'cursor-default-click-outline',
      };
    }
    return {
      title: 'Tu turno',
      subtitle: 'Elige una carta de tu mano y colócala en un duelo libre.',
      color: colors.accent,
      icon: 'gesture-tap',
    };
  }

  if (state.phase === 'revealing') {
    return {
      title: 'Revelando duelos',
      subtitle: 'La cualidad de cada duelo decide qué héroe se impone.',
      color: colors.gold,
      icon: 'eye-outline',
    };
  }

  if (state.combatWinner === 'player') {
    return {
      title: state.phase === 'matchOver' ? 'Partida ganada' : 'Combate ganado',
      subtitle:
        state.phase === 'matchOver'
          ? `Has llegado a ${target} combates y te llevas la partida.`
          : `Te llevas el combate ${state.combatNumber}.`,
      color: colors.green,
      icon: 'trophy-variant',
    };
  }

  if (state.combatWinner === 'opponent') {
    return {
      title: state.phase === 'matchOver' ? 'Partida perdida' : 'Combate perdido',
      subtitle:
        state.phase === 'matchOver'
          ? `El rival ha llegado a ${target} combates.`
          : 'El rival suma este combate. La partida continúa.',
      color: colors.red,
      icon: 'skull-outline',
    };
  }

  return {
    title: 'Combate nulo',
    subtitle: 'Nadie llegó a tres duelos. Se reparte una mano nueva.',
    color: colors.gold,
    icon: 'handshake-outline',
  };
}

function BattleGuard({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  loading = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} accent="gold">
      <View style={styles.guard}>
        <View style={styles.guardIcon}>
          {loading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <MaterialCommunityIcons name={icon} size={30} color={colors.gold} />
          )}
        </View>
        <AppText variant="title" size={38} align="center">
          {title}
        </AppText>
        <AppText variant="body" color={colors.textMuted} align="center">
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Button
            label={actionLabel}
            onPress={onAction}
            icon="view-grid-outline"
            size="md"
            style={styles.guardButton}
          />
        ) : null}
        <Button
          label="Volver"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon="chevron-left"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  bannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  bannerText: {
    flex: 1,
    gap: 0,
  },
  turnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  turnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  board: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'stretch',
  },
  revealNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  guard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  guardIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.4),
    backgroundColor: withAlpha(colors.gold, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  guardButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
});
