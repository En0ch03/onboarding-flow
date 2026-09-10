import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

/**
 * Cam yuzeylerin nasil cizildigi.
 *
 * Uc kip var cunku bulaniklik uc ayri gerceklige denk geliyor. Sistemin cam
 * efekti yalnizca yeni iOS surumlerinde var; onun altindaki surumlerde ayni
 * hissi veren sey genel bulaniklik. Android'de bulaniklik deneysel ve her
 * karede yeniden hesaplaniyor -- kaydirma sirasinda odenen bedel, kazanilan
 * gorunumden buyuk. Orada yuzeyler bulaniksiz ama daha opak bir dolguyla
 * duruyor: metnin zemini her kipte ayni guvende.
 */
export type GlassMode = 'liquid' | 'blur' | 'flat';

/**
 * Kip secimi tek yerde.
 *
 * Ayri bir dosyada duruyor cunku dort ayri yuzey ayni cevabi soruyor ve cevap
 * bir yerde kopyalanirsa iki yuzey ayni ekranda ayri kiplerde cizilir: kart
 * cam, seridi tasiyan dugmeler bulanik. Kopyayi engelleyen sey bu dosyanin tek
 * disa acilan cevap olmasi.
 */
export function resolveGlassMode(): GlassMode {
  if (Platform.OS !== 'ios') return 'flat';
  // Iki ayri soru soruluyor: tasarim dilinin cam olup olmadigi, ve yerel cam
  // API'sinin cihazda gercekten bulunup bulunmadigi. Bazi iOS 26 derlemeleri
  // ilkine "evet" ikincisine "hayir" diyor; orada cam katman saydam ciziliyor
  // ve metnin altinda hicbir zemin kalmiyor. Ikisi birden dogru degilse
  // bulanikliga dusmek, zemini olmayan bir yuzeyden iyi.
  return isLiquidGlassAvailable() && isGlassEffectAPIAvailable() ? 'liquid' : 'blur';
}
