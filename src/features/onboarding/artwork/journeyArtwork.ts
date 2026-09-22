import { Asset } from 'expo-asset';

/**
 * Yolculuk gorselinin tek kaynagi.
 *
 * Ayni dosyayi iki yerde `require` etmek, dosya adi degistiginde birinin
 * geride kalmasi demek: acilista bir goruntu on yuklenip ekranda baskasi
 * cizilirdi ve bekleme hicbir ise yaramazdi.
 */
export const journeyArtworkModule = require('../../../../assets/onboarding/journey-crimson-master-v2.png');

/**
 * Acilista gorselin beklenecegi en uzun sure.
 *
 * Alti saniye iki yondan da olculu: gelistirmede dosya her soguk acilista
 * Metro sunucusundan LAN uzerinden iniyor ve birkac yuz kilobayt icin comert
 * bir pay birakiyor; ote yandan agi olmayan birini bir arka plan gorseli
 * ugruna kapida tutmamak icin bir yerde kesilmesi gerekiyor. Sinir yoksa
 * kotu bir ag uygulamayi bos bir zeminde suresiz kilitler.
 */
export const ARTWORK_PRELOAD_CEILING_MS = 6000;

/**
 * Gorseli onbellege indirir; basarisizlik ve zaman asimi ayni sonucu verir.
 *
 * Ikisinin ayni kapiya cikmasi bilincli: gorsel bir sus, kapi degil. Her iki
 * durumda da akis baslar ve gorsel geldiginde yerine oturur.
 */
export async function preloadJourneyArtwork(
  ceilingMs: number = ARTWORK_PRELOAD_CEILING_MS,
): Promise<'ready' | 'skipped'> {
  let ceiling: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Asset.fromModule(journeyArtworkModule)
        .downloadAsync()
        .then(() => 'ready' as const),
      new Promise<'skipped'>((resolve) => {
        ceiling = setTimeout(() => resolve('skipped'), ceilingMs);
      }),
    ]);
  } catch {
    return 'skipped';
  } finally {
    // Indirme once bittiginde sayac bosuna calisir kalirdi; testlerde de acik
    // bir zamanlayici birakiyor.
    clearTimeout(ceiling);
  }
}

const MASTER_ASPECT_RATIO = 3;

export const journeyStops = {
  welcome: 0,
  difference: 0.12,
  register: 0.24,
  stepStart: 0.34,
  stepEnd: 0.88,
  completion: 1,
} as const;

export function journeyOffset(
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
): { width: number; translateX: number } {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const width = Math.max(viewportWidth, viewportHeight * MASTER_ASPECT_RATIO);
  const travel = width - viewportWidth;

  return { width, translateX: -travel * clampedProgress };
}

export function stepJourneyProgress(current: number, total: number): number {
  if (total <= 1) return journeyStops.stepStart;

  const stepProgress = Math.min(1, Math.max(0, (current - 1) / (total - 1)));
  if (stepProgress === 0) return journeyStops.stepStart;
  if (stepProgress === 1) return journeyStops.stepEnd;

  return journeyStops.stepStart + stepProgress * (journeyStops.stepEnd - journeyStops.stepStart);
}
