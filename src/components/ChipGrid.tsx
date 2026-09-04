import { View } from 'react-native';

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
 * Sarilan cip listesi.
 *
 * Her cip kendi etiketinin gerektirdigi kadar genis; kisa etiket kisa bir cip
 * demek. Esit sutunlu bir izgara denendi ve geri alindi: hucreleri esitlemek
 * "Kahve" ile "Doga yuruyusu"ne ayni yeri vermek demek ve liste bir tablo gibi
 * okunmaya basliyor.
 *
 * Satirlar yine de tam doluyor. Yoga sarma kipinde artan bosluğu **satir
 * satir** dagitiyor, dolayisiyla her cipe `flexGrow` vermek, o satira sigan
 * ciplerin dogal genislikleri oraninda genisleyip satiri kapatmasini sagliyor.
 * Satir sonlarinda tirtikli bosluk kalmiyor, boyut farklari korunuyor.
 *
 * Secim yerlesimi yine akitamiyor: isaret sabit genislikte bir yuvada
 * duruyor ve o yuva secili olmayan cipte de var, yani cipin dogal genisligi
 * secimle degismiyor.
 */
export function ChipGrid({ options, isSelected, isDisabled, onPress }: ChipGridProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => (
        <Chip
          key={option.id}
          option={option}
          selected={isSelected(option.id)}
          disabled={isDisabled(option.id)}
          onPress={() => onPress(option.id)}
          style={{ flexGrow: 1 }}
        />
      ))}
    </View>
  );
}
