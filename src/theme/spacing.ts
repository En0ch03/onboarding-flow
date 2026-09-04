/**
 * Tek bir aralik olcegi, 4 katlari uzerine kurulu.
 * Adimlar kullanima gore degil boyuta gore adlandirildi; "kart ici bosluk" gibi
 * bir ad, ayni degerin baska bir yerde kullanilmasini engelliyor.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Ekran kenar bosluğu. Bu yon genis bosluga dayaniyor: algilanan kalite
 * renkten once yogunluktan geliyor, o yuzden kenar bosluğu comert tutuldu.
 */
export const screenPadding = spacing.xl;

export type Spacing = keyof typeof spacing;
