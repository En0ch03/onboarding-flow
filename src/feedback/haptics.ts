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
 * Hatalari yutuluyor: titresim motoru olmayan ya da izin vermeyen bir cihazda
 * akisin durmasi icin hicbir sebep yok. His bir ek, bilginin tasiyicisi degil
 * - o yuzden bir titresim eksikligi cagiran tarafa kacamiyor.
 *
 * Bu dosya temanin yaninda degil: tema saf deger sozlukleri tasiyor, burasi
 * cihaza giden yan etkili bir surucu.
 */
function fire(run: () => Promise<void>): Promise<void> {
  try {
    return run().catch(() => {});
  } catch {
    // Modul beklenmedik bicimde yoksa his kayboluyor, akis kaybolmuyor.
    return Promise.resolve();
  }
}

export const haptics = {
  /** Bir secenek isaretlendi veya birakildi. */
  select: () => fire(() => Haptics.selectionAsync()),
  /** Adim ilerledi. */
  advance: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Ilerleme reddedildi; eksik bir sey var. */
  refuse: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
