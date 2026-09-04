import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
} from '@expo-google-fonts/figtree';
import {
  Newsreader_300Light,
  Newsreader_400Regular,
  Newsreader_500Medium,
} from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';

/**
 * Yazi tipleri acilista bir kez yuklenir.
 *
 * Donen ikinci deger hata: yukleme basarisiz olursa akis durmaz, platform kendi
 * varsayilan ailesine duser. Bir yazi tipi dosyasi yuzunden kullanicinin
 * uygulamaya hic giremedigi bir durum, yanlis fontla girdigi durumdan kotu.
 */
export function useAppFonts(): { ready: boolean; error: Error | null } {
  const [loaded, error] = useFonts({
    Newsreader_300Light,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
  });

  return { ready: loaded || error !== null, error };
}
