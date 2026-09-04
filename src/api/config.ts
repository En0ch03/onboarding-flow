import { api } from './client';
import { OptionGroupsSchema, type OptionGroups } from './schemas';

/**
 * Secenek listelerinin tek dikisi.
 *
 * Sozlesmede bu uc nokta yok; talep edildi. Cevap gelene kadar gelistirme
 * sunucusundan servis ediliyor ve tek bir fonksiyonun arkasinda yalitildi:
 * mekanizma degistiginde degisecek dosya bu.
 *
 * Gomulu varsayilan liste tutulmuyor. Iki kaynak, ayrisma riski demek:
 * istemcide bir kimlik, sunucuda baskasi yazildigi an eslesme sessizce
 * bozulur ve bu hata hicbir yerde hata olarak gorunmez.
 */
let cached: OptionGroups | null = null;
let inFlight: Promise<OptionGroups> | null = null;

export async function fetchOptionGroups(): Promise<OptionGroups> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  const attempt = api
    .get('/config/options')
    .then((response) => {
      const groups = OptionGroupsSchema.parse(response.data);
      cached = groups;
      return groups;
    })
    .finally(() => {
      if (inFlight === attempt) inFlight = null;
    });

  inFlight = attempt;
  return attempt;
}

/** Son basarili listeler; henuz hic gelmediyse null. */
export function readCachedOptionGroups(): OptionGroups | null {
  return cached;
}

/**
 * Onbellegi bosaltir. Bugun yalnizca testler cagiriyor.
 *
 * Oturum kapanisinda **bilerek** cagrilmiyor. Cagrilsaydi tekrar giris yapan
 * kullanici icin listeler yeniden alinana kadar hicbir liste olmayacakti ve
 * taslak uzlastirmasi (`reconcileDraftWithOptions`) atlanacakti; cevrimdisi
 * bir girise denk gelirse de secim adimlari bos kalacakti. Bayat bir liste,
 * hic liste olmamasindan iyi.
 *
 * Bunun bedeli su: sunucudaki bir degisiklik uygulama yeniden acilana kadar
 * gorunmuyor. Kabul edildi - listeler saatte bir degisen seyler degil.
 */
export function clearOptionGroupCache(): void {
  cached = null;
  inFlight = null;
}
