import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Bangers_400Regular } from '@expo-google-fonts/bangers';
import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed';
import { CollectionProvider } from '../providers/CollectionProvider';
import { colors } from '../theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Bangers_400Regular,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_900Black,
  });

  // Si las fuentes fallan, seguimos con las del sistema para no bloquear
  // el juego por un problema puramente estético.
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingGlyph}>?</Text>
        </View>
        <Text style={styles.loadingTitle}>HERO CARD GAME</Text>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <CollectionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="battle"
            options={{ animation: 'slide_from_right', gestureEnabled: false }}
          />
          <Stack.Screen name="hero/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </CollectionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.bgDeep,
  },
  loadingMark: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56,225,255,0.45)',
    backgroundColor: 'rgba(56,225,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  loadingGlyph: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
