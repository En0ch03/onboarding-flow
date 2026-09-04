import { useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { haptics } from '@/feedback/haptics';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

/** Satir yuksekligi sabit: liste acilirken secili satira dogrudan atlayabilsin. */
const ROW_HEIGHT = 52;

export type PickerOption = { value: number; label: string };

type PickerSheetProps = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  /** Henuz secilmemisse null. */
  value: number | null;
  onSelect: (value: number) => void;
  onClose: () => void;
};

/**
 * Alttan acilan tek soruluk secim sayfasi.
 *
 * Cark yerine liste. Cark, degeri parmagin hizina ve suzulmenin nerede
 * durduguna baglıyor; liste dokunulan satiri veriyor ve baska hicbir sey
 * yapmiyor. Bir tarihi vermek icin uc kez dokunmak, uc kez cark cevirip
 * durdugu yeri onaylamaktan hem hizli hem kesin.
 *
 * Secim aninda kapaniyor: ayri bir onay dugmesi, kullanicinin zaten verdigi
 * karari ikinci kez sormak olurdu.
 */
export function PickerSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: PickerSheetProps) {
  const { colors, spacing, screenPadding } = useTheme();

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <FlatList
        data={options}
        keyExtractor={(option) => String(option.value)}
        getItemLayout={(_data, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        // Uzun listeler secili degerin uzerinde aciliyor: yil listesinde
        // kullaniciyi bugunden dogum yilina kadar kaydirtmak kabul edilemez.
        initialScrollIndex={selectedIndex > 0 ? selectedIndex : undefined}
        contentContainerStyle={{ paddingBottom: spacing.md }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const selected = item.value === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
              onPress={() => {
                // Bir satira dokunmak da bir secim: cipteki hissin ayni
                // sinifta olani, iki ekran otede farkli davranmamali.
                if (!selected) haptics.select();
                onSelect(item.value);
              }}
              style={({ pressed }) => ({
                height: ROW_HEIGHT,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: screenPadding,
                backgroundColor: pressed ? colors.surface : 'transparent',
              })}
            >
              <AppText variant="control" tone={selected ? 'clay' : 'ink'}>
                {item.label}
              </AppText>

              {/* Secili satirin isareti; renk tek basina bilgi degil. */}
              <View style={{ width: 16, alignItems: 'flex-end' }}>
                {selected ? (
                  <AppText variant="control" tone="clay">
                    ✓
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}
