import type { OptionGroup } from '@/api/schemas';

/**
 * Secim kurallari tek yerde.
 *
 * Kurallarin kendisi sunucudan geliyor: tekli mi coklu mu, en fazla kac tane,
 * zorunlu mu. Bir sorunun zorunlu olup olmadigi da bir urun karari ve istemci
 * surumune gomulmemeli.
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
    // Sessizce yutulmuyor: cagiran taraf sinirin dolduğunu gosterebilsin.
    return { next: current, refused: true };
  }

  return { next: [...current, id], refused: false };
}

/** Sinir dolduysa secili olmayan kartlar devre disi gorunur. */
export function isBlockedByLimit(group: OptionGroup, current: string[], id: string): boolean {
  if (!group.multiSelect || current.includes(id)) return false;
  return group.maxSelection !== null && current.length >= group.maxSelection;
}

export function sortedOptions(group: OptionGroup) {
  return [...group.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
