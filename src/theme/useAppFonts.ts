import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
} from '@expo-google-fonts/figtree';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';

/**
 * Yazi tipleri acilista bir kez yuklenir.
 *
 * Yalnizca olcegin adiyla cagirdigi kesimler yukleniyor. Kullanilmayan bir
 * kesim acilis suresine giren ama ekranda hicbir karsiligi olmayan bir dosya.
 *
 * Donen ikinci deger hata: yukleme basarisiz olursa akis durmaz, platform kendi
 * varsayilan ailesine duser. Bir yazi tipi dosyasi yuzunden kullanicinin
 * uygulamaya hic giremedigi bir durum, yanlis fontla girdigi durumdan kotu.
 */
export function useAppFonts(): { ready: boolean; error: Error | null } {
  const [loaded, error] = useFonts({
    PlayfairDisplay_600SemiBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
  });

  return { ready: loaded || error !== null, error };
}
