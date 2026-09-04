import * as Haptics from 'expo-haptics';

/**
 * Dokunma geri bildirimi.
 *
 * Uc an, uc his ve baska hicbir yer: bir sey secildiginde, adim ilerledigi
 * ve ilerlemenin reddedildiginde. Her dokunusa titresim vermek, geri
 * bildirimi gurultuye cevirir ve o zaman hicbiri bir sey anlatmaz. Olcut
 * hareketle ayni: arayuz bir sey **oldugunu** onayliyorsa his var, aksi
 * halde yok.
 *
 * Cagrilar beklenmiyor ve hatalari yutuluyor: titresim motoru olmayan ya da
 * izin vermeyen bir cihazda akisin durmasi icin hicbir sebep yok. His bir
 * ek, bilginin tasiyicisi degil.
 */
function fire(run: () => Promise<void>): void {
  void run().catch(() => {});
}

export const haptics = {
  /** Bir secenek isaretlendi veya birakildi. */
  select: () => fire(() => Haptics.selectionAsync()),
  /** Adim ilerledi. */
  advance: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Ilerleme reddedildi; eksik bir sey var. */
  refuse: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
