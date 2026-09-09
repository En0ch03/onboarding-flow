import { Pressable, View } from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

/** Satir yuksekligi liste sayfalariyla ayni: iki sayfa arasinda ritim degismiyor. */
const ROW_HEIGHT = 52;

export type PhotoSource = 'camera' | 'library';

type PhotoSourceSheetProps = {
  visible: boolean;
  onSelect: (source: PhotoSource) => void;
  onClose: () => void;
  /** Sayfa ekrandan tamamen kalktiginda; secici ancak o zaman acilabiliyor. */
  onClosed?: (() => void) | undefined;
};

/**
 * Fotografin nereden gelecegi.
 *
 * Kamera bir kaynak olarak ayrica soruluyor cunku adimin kendisi "simdi bir
 * fotograf cek" demeye en yakin an; galeriye gonderip geri getirmek, cekilecek
 * fotografi olmayan birine yapilmis bir yolculuk.
 *
 * Hazir bir eylem sayfasi yerine depodaki alttan acilan sayfa kullaniliyor:
 * secim sayfalarinin tamami bu kabukta ve iki farkli sunum, ayni soruyu iki
 * ayri dille sormak olurdu.
 */
export function PhotoSourceSheet({ visible, onSelect, onClose, onClosed }: PhotoSourceSheetProps) {
  const { colors, screenPadding } = useTheme();

  const rows: { source: PhotoSource; label: string }[] = [
    { source: 'camera', label: strings.photoSource.camera },
    { source: 'library', label: strings.photoSource.library },
  ];

  return (
    <BottomSheet
      visible={visible}
      title={strings.photoSource.title}
      onClose={onClose}
      onClosed={onClosed}
    >
      <View>
        {rows.map((row) => (
          <Pressable
            key={row.source}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            onPress={() => onSelect(row.source)}
            style={({ pressed }) => ({
              height: ROW_HEIGHT,
              justifyContent: 'center',
              paddingHorizontal: screenPadding,
              backgroundColor: pressed ? colors.surface : 'transparent',
            })}
          >
            <AppText variant="control">{row.label}</AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}
