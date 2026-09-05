import { useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import type { OptionGroup } from '@/api/schemas';
import { selectionLimitReached, strings } from '@/constants/strings';
import { haptics } from '@/feedback/haptics';

import { isAtLimit, toggleSelection } from './useSelection';

/**
 * Bir listenin ust sinirina carpan dokunusun cevabi.
 *
 * Sinir dolunca kartlar sonuyordu ama basilamiyordu; dokunus hicbir yere
 * ulasmadigi icin sebebi soyleyen kod hic calismiyordu. Kullanici sonuk bir
 * karta basiyor, hicbir sey olmuyor ve neden olmadigini ekranda arayacagi
 * bir yer yoktu. Simdi dokunus geliyor, reddediliyor ve reddi soyleniyor:
 * his, metin ve ekran okuyucu ayni anda.
 *
 * Kartlar "devre disi" ilan edilmiyor. Devre disi bir denetim, ekran
 * okuyucuya sebepsiz bir "kullanilamaz" der; sonuk ama dokunulabilir bir
 * kart ise dokununca sebebi verir ve ipucuyla cikis yolunu gosterir.
 *
 * Uc listenin ucu de buradan geciyor: sinira carpmanin ne hissettirdigi
 * ekrandan ekrana degismemeli.
 */
export function useSelectionLimit(group: OptionGroup, selected: string[]) {
  const [refused, setRefused] = useState(false);

  /** Dokunusu dener; reddedildiyse `null`, degilse yeni secim. */
  function attempt(id: string): string[] | null {
    const result = toggleSelection(group, selected, id);

    if (result.refused) {
      setRefused(true);
      void haptics.refuse();
      // `accessibilityLiveRegion` yalnizca Android'de duyuruluyor; iOS'ta
      // da duyulmasi icin duyuru elle yapiliyor.
      if (group.maxSelection !== null) {
        AccessibilityInfo.announceForAccessibility(selectionLimitReached(group.maxSelection));
      }
      return null;
    }

    // Ayni secime tekrar dokunmak (tekli listede) bir olay degil: his
    // gorunen bir degisikligi onayliyor, dokunusun kendisini degil.
    if (result.next === selected) return null;

    setRefused(false);
    void haptics.select();
    return result.next;
  }

  return {
    attempt,
    /** Sinir dolu ve bu secenek secili degil: sonuk gorunur, dokunulabilir. */
    isBlocked: (id: string) => isAtLimit(group, selected, id),
    /** Sonuk karta ekran okuyucunun verecegi cikis yolu. */
    blockedHint: (id: string) =>
      isAtLimit(group, selected, id) ? strings.selection.blockedHint : undefined,
    refused,
  };
}
