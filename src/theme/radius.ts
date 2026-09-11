/**
 * Kose yaricaplari. Yumusak ve genis: kagit hissi keskin koseyle bagdasmiyor.
 * Kapsul disindaki her yaricap `borderCurve: 'continuous'` ile eslesir.
 */
export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  /**
   * Genis kartlar icin. `lg`'den buyuk olmasi bir suslemenin degil, cam
   * yuzeyin geregi: kirilma kose yayinda topluyor ve dar bir yay onu keskin
   * bir kenar cizgisine indiriyor.
   */
  xl: 32,
  /**
   * Cam kart. Sistemin cam materyali kirilmayi kose yayinda topluyor; yay
   * buyudukce kenar bir cizgi degil bir mercek olarak okunuyor. Kartin
   * yuksekligine gore oran korunur: 46, ekranin ucte birini kaplayan bir
   * kartta yumusak, daha kucuk yuzeylerde fazla gelir.
   */
  glass: 46,
  /** Kapsul: buton ve cip. */
  full: 9999,
} as const;

export type Radius = keyof typeof radius;
