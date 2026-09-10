import { View } from 'react-native';

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
 * Dogal genislikte dizilen cipler; satir dolunca alta sariyor.
 *
 * Esit genislikte sutunlar denendi ve ekranda reddedildi: hizali sutun kenari
 * derli toplu duruyordu ama bedeli, sutundan uzun her etiketin alt alta
 * kirilmasiydi. Bir cip etiketini dikey kirdiginda okunacak sey degil
 * cozulecek sey haline geliyor.
 *
 * Olcum de birlikte kalkti: hucre genisligi hesaplanmadigi icin ilk kareyi
 * gizlemeye ve genislik durumu tutmaya gerek kalmiyor. Cipler ilk cizimde
 * dogru yerinde.
 */
export function ChipGrid({ options, isSelected, isBlocked, blockedHint, onPress }: ChipGridProps) {
  const { spacing } = useTheme();

  return (
    <View
      testID="chip-grid"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
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
        />
      ))}
    </View>
  );
}
