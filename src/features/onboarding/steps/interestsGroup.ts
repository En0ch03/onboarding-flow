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
/**
 * Sunucudan gelen bir anahtarla duz nesneye bakmak yetmiyor: `'toString'`
 * gibi bir deger kalitilan bir ozellige denk geliyor, "var" gorunuyor ve
 * hemen ardindaki `group.options` erisimi cokuyordu.
 */
function groupAt(options: OptionGroups, key: string) {
  return Object.prototype.hasOwnProperty.call(options, key) ? options[key] : undefined;
}

export function groupKeyForIntent(intent: string[] | undefined, options: OptionGroups): string {
  const group = options.intent;
  if (!group) return DEFAULT_INTERESTS_GROUP;

  const unlocked = sortedOptions(group).find(
    (option) => option.unlocks !== undefined && intent?.includes(option.id),
  )?.unlocks;

  if (unlocked === undefined || groupAt(options, unlocked) === undefined) {
    return DEFAULT_INTERESTS_GROUP;
  }
  return unlocked;
}

/**
 * Niyet degistiginde ilgi alanlarini yeni listeye gore suzer.
 *
 * Arkadaslik secip bir etiket isaretleyen, sonra niyetini degistiren
 * kullanicinin cevabi artik gosterilmeyen bir listeye aitti: ekranda hicbir
 * cip secili gorunmuyor ama cevap taslakta duruyor, ozete ham kimlik olarak
 * dusuyor ve sunucuya oyle yaziliyordu. Cevabin ait oldugu liste degistiginde
 * cevap da dusuyor.
 */
export function interestsForIntent(
  interests: string[] | undefined,
  intent: string[] | undefined,
  options: OptionGroups,
): string[] | undefined {
  if (interests === undefined) return undefined;

  const served = groupAt(options, groupKeyForIntent(intent, options));
  if (served === undefined) return interests;

  const ids = new Set(served.options.map((option) => option.id));
  return interests.filter((id) => ids.has(id));
}
