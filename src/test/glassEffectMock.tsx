import { View, type ViewProps } from 'react-native';
import type { GlassContainerProps, GlassViewProps } from 'expo-glass-effect';

/** Testler cam katmani bu kimlikle bulur. */
export const GLASS_VIEW_TEST_ID = 'glass-view';

/** Testler cam grubunu bu kimlikle bulur. */
export const GLASS_CONTAINER_TEST_ID = 'glass-container';

/**
 * Sistemin cam efektinin varligi cihaza ve isletim sistemi surumune bagli;
 * testte o cevap yok. Varsayilan `false`, cunku surumu yeterli olmayan cihaz
 * cogunluk: yedek yolun yanlislikla hic denenmemesi, cihazda bos bir kart
 * olarak ortaya cikardi. Cam yolunu sinayan test cevabi kendisi verir.
 */
export const isLiquidGlassAvailable = jest.fn(() => false);

/**
 * Cam gorunumunun tasarim dili olarak acik olmasi, yerel API'nin de orada
 * oldugu anlamina gelmiyor; ikisi ayri sorular ve testte ayri ayri
 * cevaplanabilmeli. Varsayilan `true`: bu ikinci soru ayni surumlerin kucuk
 * bir kisminda "hayir" diyor, birincisi ise cogunlukta.
 */
export const isGlassEffectAPIAvailable = jest.fn(() => true);

/**
 * Gercek cam gorunumu yerel bir katman aciyor; testte ne cizilir ne olculur.
 * Taklidin isi prop'lari agacta tutmak: dogrulanan sey modulun kendisi degil,
 * ona hangi degerlerin verildigi.
 *
 * Kendi kimligini yalnizca cagiran bir kimlik vermediyse koyuyor: ayni agacta
 * birden fazla cam yuzey olabiliyor ve hepsi ayni kimligi tasisaydi testin
 * hangisine baktigi belirsiz kalirdi.
 */
export function GlassView(props: GlassViewProps) {
  return <View {...(props as ViewProps)} testID={props.testID ?? GLASS_VIEW_TEST_ID} />;
}

/**
 * Grubun isi yerel tarafta: icindeki cam yuzeyler birbirine yaklasinca
 * birlesiyor. Testte olculecek bir birlesme yok; dogrulanan sey yuzeylerin
 * gercekten ayni grubun icinde durdugu ve gruba hangi mesafenin verildigi.
 */
export function GlassContainer(props: GlassContainerProps) {
  return <View {...(props as ViewProps)} testID={props.testID ?? GLASS_CONTAINER_TEST_ID} />;
}
