import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme } from '@/theme';

import { Chip } from './Chip';

type ChipGridProps = {
  options: Option[];
  isSelected: (id: string) => boolean;
  isDisabled: (id: string) => boolean;
  onPress: (id: string) => void;
};

/**
 * Esit genislikte sutunlara dizilen cip izgarasi.
 *
 * Cipler dogal genisliklerinde sarildiginda satirlar duzensiz doluyor ve
 * satir sonlarinda tirtikli bosluklar kaliyor. Esit sutun bunu cozerken bir
 * yan fayda daha veriyor: hucre genisligi icerikten bagimsiz oldugu icin
 * hicbir secim yerlesimi yeniden akitamiyor.
 *
 * Sutun sayisi olculen genislikten geliyor, cihaz turunden degil. Uc sutun
 * telefonda dogru duruyor; dar ekranda ikiye, tablette dorde gidiyor. Esik
 * asagi cekilip cok dar cihazlarda da uc sutun zorlanmadi: o genislikte
 * hucreye kalan metin alani etiketleri okunmaz hale getiriyor.
 */
function columnsFor(width: number): number {
  if (width >= 520) return 4;
  if (width >= 300) return 3;
  return 2;
}

export function ChipGrid({ options, isSelected, isDisabled, onPress }: ChipGridProps) {
  const { spacing } = useTheme();
  const [width, setWidth] = useState(0);

  const gap = spacing.sm;
  const columns = columnsFor(width);
  // Olculmeden once genislik verilmiyor: cipler bir kare boyunca dogal
  // genisliklerinde duruyor, sonra izgaraya oturuyor.
  const chipWidth =
    width === 0 ? undefined : Math.floor((width - gap * (columns - 1)) / columns);

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
          disabled={isDisabled(option.id)}
          onPress={() => onPress(option.id)}
          style={chipWidth === undefined ? undefined : { width: chipWidth }}
        />
      ))}
    </View>
  );
}
