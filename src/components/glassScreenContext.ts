import { createContext, useContext } from 'react';

/**
 * Bir ekranin cam yuzey cizip cizmeyecegi.
 *
 * Cam ciyen dort yuzey (baslik dugmeleri, hayalet dugme, kart, alt sayfa)
 * hangi ekranda oldugunu bilmiyor -- bilseydi karar dorde bolunur ve bir
 * ekran unutulunca orada eski davranis sessizce kalirdi. Karar tek yerde
 * veriliyor ve buradan asagi akiyor: varsayilan acik, yalnizca metne
 * dayanan ekranlar kendi degerini kapali gecerek bu baglami eziyor.
 */
const GlassScreenContext = createContext(true);

export const GlassScreenProvider = GlassScreenContext.Provider;

export function useScreenGlassEnabled(): boolean {
  return useContext(GlassScreenContext);
}
