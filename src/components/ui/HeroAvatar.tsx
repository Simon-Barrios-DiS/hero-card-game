import React, { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { avatarTint, colors, fonts } from '../../theme';
import type { Hero } from '../../game/types';

interface HeroAvatarProps {
  hero: Hero;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  initialsSize?: number;
  priority?: 'low' | 'normal' | 'high';
}

function initials(name: string): string {
  const words = name
    .replace(/[-_/.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Retrato con fundido y respaldo de iniciales. Si la imagen externa falla
 * (sin conexión, CDN caído) la carta sigue teniendo una identidad visual.
 */
export function HeroAvatar({
  hero,
  style,
  borderRadius = 0,
  initialsSize = 38,
  priority = 'normal',
}: HeroAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl === hero.imageUrl;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: avatarTint(hero.id), borderRadius },
        style,
      ]}
    >
      <AppText
        variant="display"
        size={initialsSize}
        color="rgba(255,255,255,0.22)"
        style={styles.initials}
      >
        {initials(hero.name)}
      </AppText>

      {!failed ? (
        <Image
          source={{ uri: hero.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={240}
          cachePolicy="memory-disk"
          priority={priority}
          recyclingKey={String(hero.id)}
          onError={() => setFailedUrl(hero.imageUrl)}
          alt={`Retrato de ${hero.name}`}
          accessibilityLabel={`Retrato de ${hero.name}`}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <View pointerEvents="none" style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.display,
    textAlign: 'center',
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: colors.black,
    opacity: 0.04,
  },
});
