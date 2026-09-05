import type { OptionGroup } from '@/api/schemas';

/**
 * Secim kurallari tek yerde.
 *
 * Kurallarin kendisi sunucudan geliyor: tekli mi coklu mu, en fazla kac tane,
 * zorunlu mu. Bir sorunun zorunlu olup olmadigi da bir urun karari ve istemci
 * surumune gomulmemeli.
 *
 * Seceneklerin birbirini kapsamasi kaldirildi. "Kadinlar" ve "Erkekler"
 * isaretlenince secimin kendiliginden "Herkes"e toplanmasi cihazda tersine
 * cevrildi: dokunulan secenegin disinda bir seyin isaretini degistirmek,
 * kullanicinin vermedigi bir cevabi ona gosteriyor ve geri almak icin hangi
 * cipe basmak gerektigi belli olmuyordu. Bir dokunus artik yalnizca
 * dokunulan secenegi degistiriyor.
 */

export function toggleSelection(
  group: OptionGroup,
  current: string[],
  id: string,
): { next: string[]; refused: boolean } {
  if (!group.multiSelect) {
    return { next: current.includes(id) ? current : [id], refused: false };
  }

  if (current.includes(id)) {
    return { next: current.filter((item) => item !== id), refused: false };
  }

  const limit = group.maxSelection;
  if (limit !== null && current.length >= limit) {
    // Sessizce yutulmuyor: cagiran taraf sinirin doldugunu gosterebilsin.
    return { next: current, refused: true };
  }

  return { next: [...current, id], refused: false };
}

/**
 * Sinir dolu ve bu secenek secili degil: kart sonuk gorunur. Devre disi
 * degil -- dokunus hala geliyor ve `toggleSelection` onu reddediyor; sebebi
 * soyleyen taraf o red.
 */
export function isAtLimit(group: OptionGroup, current: string[], id: string): boolean {
  if (!group.multiSelect || current.includes(id)) return false;
  if (group.maxSelection === null) return false;
  return current.length >= group.maxSelection;
}

export function sortedOptions(group: OptionGroup) {
  return [...group.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
