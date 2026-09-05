import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme } from '@/theme';

import { Chip } from './Chip';

type ChipGridProps = {
  options: Option[];
  isSelected: (id: string) => boolean;
  isBlocked: (id: string) => boolean;
  /** Sonuk cipe verilecek ipucu; sinir dolu degilse `undefined`. */
  blockedHint: (id: string) => string | undefined;
  onPress: (id: string) => void;
};

/**
 * Esit genislikte sutunlara dizilen cip izgarasi.
 *
 * Iki yerlesim de denendi. Dogal genislikte her cip kendi etiketi kadardi
 * ve satirlar buyume payiyla doluyordu; asil fark sutun kenarinin hizali
 * olup olmamasiydi. Tercih hizali sutunlardan yana ve ekranda verildi:
 * telefonda daha derli toplu duruyor. Bedeli, son satir tam dolmadiginda
 * bosluk kalmasi -- buyume payi onu kapatiyordu, esit sutun kapatmiyor.
 *
 * Yerlesimin yan faydasi da var: hucre genisligi icerikten bagimsiz oldugu
 * icin hicbir secim yerlesimi yeniden akitamiyor. Asil koruma yine de
 * cipin icindeki sabit isaret yuvasi; o, iki yerlesimde de duruyor.
 *
 * Sutun sayisi olculen genislikten geliyor, cihaz turunden degil: "telefon
 * mu tablet mi" sorusu bolunmus ekranda ve katlanabilir cihazda yanlis
 * cevap veriyor.
 *
 * Hucre dar kaldiginda -- dar bir ekranda, ya da sistem yazisi buyudugunde
 * -- etiket kirpilmiyor, satir sayisini artiriyor. Ayrintisi `Chip` icinde,
 * kararin uygulandigi yerde.
 */
function columnsFor(width: number): number {
  if (width >= 520) return 4;
  if (width >= 300) return 3;
  return 2;
}

export function ChipGrid({ options, isSelected, isBlocked, blockedHint, onPress }: ChipGridProps) {
  const { spacing } = useTheme();
  const [width, setWidth] = useState(0);

  const gap = spacing.sm;
  const columns = columnsFor(width);
  // Olculmeden once genislik verilmiyor: cipler bir kare boyunca dogal
  // genisliklerinde duruyor, sonra izgaraya oturuyor.
  const chipWidth = width === 0 ? undefined : Math.floor((width - gap * (columns - 1)) / columns);

  const measure = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next !== width) setWidth(next);
  };

  return (
    <View
      onLayout={measure}
      style={{
        // Genislik ebeveynden geliyor, icerikten degil: aksi halde hucre
        // genisligi kabin genisligini besler ve olcum salinmaya baslar.
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        // Olculmeden onceki tek kare gorunmuyor; cipler dogal genisliklerinden
        // izgaraya otururken siçrama olarak okunmasin.
        opacity: width === 0 ? 0 : 1,
      }}
    >
      {options.map((option) => (
        <Chip
          key={option.id}
          option={option}
          selected={isSelected(option.id)}
          blocked={isBlocked(option.id)}
          blockedHint={blockedHint(option.id)}
          onPress={() => onPress(option.id)}
          style={chipWidth === undefined ? undefined : { width: chipWidth }}
        />
      ))}
    </View>
  );
}
