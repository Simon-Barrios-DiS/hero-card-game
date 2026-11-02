import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, spacing, withAlpha } from '../theme';
import { GAME } from '../game/config';
import { QUALITIES } from '../game/qualities';
import { AppText } from './ui/AppText';
import { Button, IconButton } from './ui/Button';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
  target?: number;
}

const STEPS = [
  'Cada combate recibes una mano nueva de 5 héroes.',
  'En el tablero hay 5 duelos, cada uno con una cualidad distinta.',
  'Tú y el rival colocan una carta por turno en un duelo libre.',
  'Al revelar, gana el duelo quien tenga el número más alto en esa cualidad.',
  'Gana el combate quien se lleve 3 de los 5 duelos.',
];

export function RulesModal({ visible, onClose, target = GAME.combatsToWinMatch }: RulesModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Cerrar reglas"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <SafeAreaView edges={['bottom']} style={styles.safe}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <AppText variant="title" size={34} color={colors.text}>
                  Cómo jugar
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  Duelos de cualidades · primero a {target} combates
                </AppText>
              </View>
              <IconButton
                icon="close"
                label="Cerrar"
                size={36}
                onPress={onClose}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.objective}>
                <View style={styles.objectiveIcon}>
                  <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.gold} />
                </View>
                <View style={styles.objectiveText}>
                  <AppText variant="label" size={10} color={colors.gold}>
                    Objetivo
                  </AppText>
                  <AppText variant="subheading" color={colors.text}>
                    Gana {target} combates antes que tu rival.
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    Cada combate se decide en 5 duelos. Necesitas 3 victorias.
                  </AppText>
                </View>
              </View>

              <AppText variant="heading" size={20} style={styles.sectionTitle}>
                El combate
              </AppText>
              <View style={styles.steps}>
                {STEPS.map((step, index) => (
                  <View key={step} style={styles.step}>
                    <View style={styles.stepNumber}>
                      <AppText variant="stat" size={13} color={colors.accent}>
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText variant="body" color={colors.textMuted} style={styles.stepText}>
                      {step}
                    </AppText>
                  </View>
                ))}
              </View>

              <AppText variant="heading" size={20} style={styles.sectionTitle}>
                Las cualidades
              </AppText>
              <View style={styles.qualities}>
                {QUALITIES.map((quality) => (
                  <View
                    key={quality.id}
                    style={[
                      styles.qualityRow,
                      !quality.active ? styles.qualityInactive : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.qualityIcon,
                        { backgroundColor: withAlpha(quality.color, 0.12) },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={quality.icon}
                        size={17}
                        color={quality.color}
                      />
                    </View>
                    <View style={styles.qualityText}>
                      <View style={styles.qualityTitleRow}>
                        <AppText variant="subheading" color={colors.text}>
                          {quality.label}
                        </AppText>
                        <AppText variant="label" size={8} color={quality.color}>
                          {quality.short}
                        </AppText>
                        {!quality.active ? (
                          <AppText variant="label" size={8} color={colors.textDim}>
                            Próximamente
                          </AppText>
                        ) : null}
                      </View>
                      <AppText variant="caption" color={colors.textMuted}>
                        {quality.description}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.bonus}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={15}
                  color={colors.gold}
                />
                <AppText variant="caption" color={colors.textMuted} style={styles.tipText}>
                  Bonus de formación: si tus 5 cartas comparten editorial y
                  alineación moral, cada una suma +5 en todos los duelos. Ese
                  valor puede superar 100.
                </AppText>
              </View>

              <View style={styles.tip}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={15} color={colors.gold} />
                <AppText variant="caption" color={colors.textMuted} style={styles.tipText}>
                  Los empates no suman. Si ningún jugador llega a 3 duelos, el combate
                  queda nulo y se reparte una mano nueva.
                </AppText>
              </View>

              <Button
                label="Entendido"
                onPress={onClose}
                fullWidth
                size="lg"
                icon="sword-cross"
                style={styles.closeButton}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,5,10,0.72)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  safe: {
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerText: {
    gap: 1,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  objective: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.25),
    backgroundColor: withAlpha(colors.gold, 0.06),
    marginTop: spacing.xs,
  },
  objectiveIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
  },
  objectiveText: {
    flex: 1,
    gap: 1,
  },
  sectionTitle: {
    marginTop: spacing.sm,
  },
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.3),
    backgroundColor: withAlpha(colors.accent, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepText: {
    flex: 1,
  },
  qualities: {
    gap: spacing.sm,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  qualityInactive: {
    opacity: 0.55,
  },
  qualityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityText: {
    flex: 1,
    gap: 1,
  },
  qualityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bonus: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: withAlpha(colors.gold, 0.06),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.25),
  },
  tipText: {
    flex: 1,
  },
  closeButton: {
    marginTop: spacing.xs,
  },
});
