import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollScreen } from '../ui/Screen';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { useAuth } from '../../providers/AuthProvider';
import { colors, fonts, radii, spacing, withAlpha } from '../../theme';

type AuthMode = 'login' | 'register';

export function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    if (mode === 'register' && password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    const result =
      mode === 'login'
        ? login(username, password)
        : register(username, password);
    if (!result.ok) setError(result.error);
  };

  return (
    <ScrollScreen
      contentContainerStyle={styles.content}
      accent="cyan"
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.brand}>
        <View style={styles.mark}>
          <MaterialCommunityIcons
            name="cards-playing-outline"
            size={26}
            color={colors.accent}
          />
        </View>
        <AppText variant="display" size={40} align="center">
          HERO CARD GAME
        </AppText>
        <AppText variant="caption" color={colors.textMuted} align="center">
          Beta 1.0 · Solo local/offline · usuario y contraseña
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.modeRow}>
          <ModeChip
            label="Entrar"
            active={mode === 'login'}
            onPress={() => switchMode('login')}
          />
          <ModeChip
            label="Crear cuenta"
            active={mode === 'register'}
            onPress={() => switchMode('register')}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label" size={8} color={colors.textDim}>
            USUARIO
          </AppText>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Tu nombre de usuario"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label" size={8} color={colors.textDim}>
            CONTRASEÑA
          </AppText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={mode === 'login' ? 'go' : 'next'}
            onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
            style={styles.input}
          />
        </View>

        {mode === 'register' ? (
          <View style={styles.field}>
            <AppText variant="label" size={8} color={colors.textDim}>
              REPITE LA CONTRASEÑA
            </AppText>
            <TextInput
              value={confirmation}
              onChangeText={setConfirmation}
              placeholder="Otra vez"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              style={styles.input}
            />
          </View>
        ) : null}

        {error ? (
          <AppText variant="caption" size={11} color={colors.red}>
            {error}
          </AppText>
        ) : null}

        <Button
          label={mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          onPress={handleSubmit}
          icon={mode === 'login' ? 'login' : 'account-plus-outline'}
          size="md"
          fullWidth
        />
      </View>

      <View style={styles.demo}>
        <AppText variant="label" size={8} color={colors.textDim}>
          CUENTAS DE PRUEBA
        </AppText>
        <AppText variant="caption" size={10} color={colors.textMuted}>
          coleccion · coleccion123 — todas las cartas
        </AppText>
        <AppText variant="caption" size={10} color={colors.textMuted}>
          novato · novato123 — cuenta de prueba con 50 tokens iniciales
        </AppText>
      </View>
    </ScrollScreen>
  );
}

function ModeChip({
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
        styles.modeChip,
        active ? styles.modeChipActive : null,
        pressed ? styles.pressed : null,
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  mark: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.35),
    backgroundColor: withAlpha(colors.accent, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radii.sm,
  },
  modeChipActive: {
    backgroundColor: withAlpha(colors.accent, 0.12),
  },
  pressed: {
    opacity: 0.75,
  },
  field: {
    gap: 4,
  },
  input: {
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: fonts.condensed,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  demo: {
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
});
