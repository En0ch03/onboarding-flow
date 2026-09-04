/**
 * Sureler tek yerde: ekranlar arasi hareketin akraba hissetmesi buradan geliyor.
 * Deger secimi olculu tarafta tutuldu; bir kayit akisinda hareket, kullanicinin
 * bir sonraki girdiye ulasmasini geciktirdigi anda zarar vermeye basliyor.
 */
export const motion = {
  /** Dokunma geri bildirimi. */
  fast: 140,
  /** Ogeler arasi gecis. */
  base: 240,
  /** Ekran ve buyuk yuzey gecisleri. */
  slow: 380,
} as const;

export type MotionSpeed = keyof typeof motion;
