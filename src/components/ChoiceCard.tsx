import { Pressable, View } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';

type ChoiceCardProps = {
  option: Option;
  selected: boolean;
  onPress: () => void;
  /**
   * Liste birden fazla cevap aliyor mu. Ekran okuyucunun kullandigi rolu bu
   * belirliyor; goruntude bir karsiligi yok.
   */
  multiple: boolean;
  /**
   * Sinir dolmusken secilemeyen kart sonuk gorunur ama kaybolmaz ve
   * dokunulabilir kalir: dokunus, neden secilemedigini soyletir.
   */
  blocked?: boolean;
  /** Sonuk karta ekran okuyucunun verecegi cikis yolu. */
  blockedHint?: string | undefined;
};

/**
 * Secim karti. Secenegin kendisi disaridan geliyor; bu bilesen hicbir liste
 * tasimiyor.
 *
 * Secim dili cip ile ayni: kenarlik ve dolgu. Sagdaki onay dairesi kalkti --
 * secili olmayan kartta bos duran bir daire kullaniciya hicbir sey
 * soylemiyordu, ustelik etiketin yerini aliyordu.
 *
 * Secili durum yalnizca renkle anlatilmiyor: kenarlik secilince kalinlasiyor
 * ve ic bosluk ayni miktarda kucululuyor, yani kart olcu degistirmiyor.
 */
export function ChoiceCard({
  option,
  selected,
  onPress,
  multiple,
  blocked = false,
  blockedHint,
}: ChoiceCardProps) {
  const { colors, radius, spacing } = useTheme();
  const hint = blocked ? blockedHint : option.hint;

  // Kenarlik farki ic boslukla telafi ediliyor: 1 + 17 = 2 + 16.
  const border = selected ? 2 : 1;
  const pad = selected ? 0 : 1;

  return (
    <Pressable
      // Tek secimli listede "onay kutusu" yanlis: ekran okuyucu kullanicisina
      // birden fazla secebilecegini soyler. Rol listenin turunden geliyor.
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={option.label}
      {...(hint ? { accessibilityHint: hint } : {})}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: selected ? colors.clayTint : 'transparent',
        borderWidth: border,
        borderColor: selected || pressed ? colors.clay : withAlpha(colors.ink, 0.22),
        borderRadius: radius.md,
        borderCurve: 'continuous',
        paddingVertical: spacing.lg + pad,
        paddingHorizontal: spacing.lg + pad,
        marginBottom: spacing.md,
        opacity: blocked ? 0.45 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="control">{option.label}</AppText>
        {option.hint ? (
          <AppText variant="caption" tone="inkSoft" style={{ marginTop: 2 }}>
            {option.hint}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
