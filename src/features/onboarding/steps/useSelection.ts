import type { Option, OptionGroup } from '@/api/schemas';

/**
 * Secim kurallari tek yerde.
 *
 * Kurallarin kendisi sunucudan geliyor: tekli mi coklu mu, en fazla kac tane,
 * zorunlu mu, hangi secenek hangilerini kapsiyor. Bir sorunun zorunlu olup
 * olmadigi da bir urun karari ve istemci surumune gomulmemeli.
 */

function covered(option: Option | undefined): string[] {
  return option?.covers ?? [];
}

function find(group: OptionGroup, id: string): Option | undefined {
  return group.options.find((option) => option.id === id);
}

/**
 * Secim kendi icinde tutarli hale getiriliyor.
 *
 * Uc kural, ucu de veriden okunuyor:
 * 1. Kapsayan bir secenek isaretlenirse kapsadiklari duser.
 * 2. Kapsanan bir secenek isaretlenirse onu kapsayan duser - kullanici daha
 *    dar bir cevap veriyor, genis olani yaninda birakmak celiski olurdu.
 * 3. Bir kapsayanin kapsadiklarinin hepsi isaretli hale gelirse secim ona
 *    toplanir: "kadinlar ve erkekler" zaten "herkes" demek.
 *
 * Kapsama **tek duzeyli**: bir kapsayanin kapsadiklari kendileri kapsayan
 * olamaz. Ic ice kapsama destegi bugun karsiligi olmayan bir genellik olurdu
 * ve toplamanin hangi secenege gidecegi belirsizlesirdi. Tarama sunucunun
 * verdigi siraya gore yapiliyor; dizinin geldigi sira degil, ilan edilen
 * sira belirleyici olsun.
 */
function reconcile(group: OptionGroup, selected: string[], added: string): string[] {
  const addedCovers = covered(find(group, added));

  let next = selected.filter((id) => {
    if (id === added) return true;
    if (addedCovers.includes(id)) return false;
    return !covered(find(group, id)).includes(added);
  });

  for (const option of sortedOptions(group)) {
    const covers = covered(option);
    if (covers.length === 0 || next.includes(option.id)) continue;
    if (covers.every((id) => next.includes(id))) {
      next = [...next.filter((id) => !covers.includes(id)), option.id];
    }
  }

  return next;
}

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

  const next = reconcile(group, [...current, id], id);

  // Sinir, uzlastirmadan sonra olculuyor: uzlastirma secim sayisini
  // dusurebiliyor ve onceden reddetmek, aslinda sigacak bir secimi
  // engellerdi.
  const limit = group.maxSelection;
  if (limit !== null && next.length > limit) {
    // Sessizce yutulmuyor: cagiran taraf sinirin dolduğunu gosterebilsin.
    return { next: current, refused: true };
  }

  return { next, refused: false };
}

/** Sinir dolduysa secili olmayan kartlar devre disi gorunur. */
export function isBlockedByLimit(group: OptionGroup, current: string[], id: string): boolean {
  if (!group.multiSelect || current.includes(id)) return false;
  if (group.maxSelection === null) return false;
  // Uzlastirma secimi kisaltabiliyorsa secenek engelli sayilmaz: kullanici
  // "Herkes"e dokunabilmeli, sinir dolu gorunse bile.
  return toggleSelection(group, current, id).refused;
}

export function sortedOptions(group: OptionGroup) {
  return [...group.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
