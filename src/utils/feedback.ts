import * as Haptics from 'expo-haptics';

function run(action: () => Promise<void>) {
  try {
    void action().catch(() => {});
  } catch {
    // La vibración es opcional (web/emuladores pueden no soportarla).
  }
}

export const hapticSelect = () => run(() => Haptics.selectionAsync());
export const hapticTap = () =>
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const hapticImpact = () =>
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const hapticSuccess = () =>
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticError = () =>
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
