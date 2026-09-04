/**
 * Kose yaricaplari. Yumusak ve genis: kagit hissi keskin koseyle bagdasmiyor.
 * Kapsul disindaki her yaricap `borderCurve: 'continuous'` ile eslesir.
 */
export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  /** Kapsul: buton ve cip. */
  full: 9999,
} as const;

export type Radius = keyof typeof radius;
