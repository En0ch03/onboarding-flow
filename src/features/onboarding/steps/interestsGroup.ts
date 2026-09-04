import type { OptionGroups } from '@/api/schemas';

import { sortedOptions } from './useSelection';

/** Bir cevap koşullu bir liste açmiyorsa dusulen genel grup. */
export const DEFAULT_INTERESTS_GROUP = 'interests';

/**
 * Niyet cevabina gore hangi ilgi alani listesinin gosterilecegi.
 *
 * Hangi cevabin hangi listeyi actigi secenegin kendi verisinde (`unlocks`).
 * Bir kimlik burada sabit yazilsaydi sunucu onu degistirdiginde kosullu liste
 * sessizce kapanirdi ve bu hicbir yerde hata olarak gorunmezdi.
 *
 * Tarama sunucunun ilan ettigi siraya gore: birden fazla cevap bir liste
 * aciyorsa kazanan, kullanicinin ekranda ustte gordugu olmali. Ham dizi
 * sirasina birakmak, ekranla acikanmayan bir fark yaratirdi.
 *
 * Acilan grup sunulmuyorsa genel listeye dusuluyor. Geri dusus burada, tek
 * yerde: cagiranlar kendi geri dususlerini yazsaydi ekran bir listeye,
 * temizlik baska bir listeye bakabilirdi.
 */
export function groupKeyForIntent(intent: string[] | undefined, options: OptionGroups): string {
  const group = options.intent;
  if (!group) return DEFAULT_INTERESTS_GROUP;

  const unlocked = sortedOptions(group).find(
    (option) => option.unlocks !== undefined && intent?.includes(option.id),
  )?.unlocks;

  if (unlocked === undefined || options[unlocked] === undefined) return DEFAULT_INTERESTS_GROUP;
  return unlocked;
}
