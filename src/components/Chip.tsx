import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

/** Isaret yuvasi. Bos da olsa yer tutuyor; secim cipin boyunu degistirmiyor. */
const MARK_SIZE = 16;

type ChipProps = {
  option: Option;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Yerlesim genisligi disaridan gelir; cip kendi genisligini secmez. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Kisa etiketler icin kompakt secim. Karttan farki yalnizca yogunluk: on iki
 * etiketi kart olarak dizmek ekrani okunmaz hale getiriyor.
 *
 * Secili hal cipin olculerini degistirmiyor. Onceki surumde secilen cipin
 * metnine bir onek ekleniyordu; cip genisliyor, satir yeniden akiyor ve
 * kullanicinin dokunmak uzere oldugu bir sonraki hedef parmaginin altindan
 * kayiyordu. Isaret artik sabit genislikte bir yuvada duruyor ve o yuva
 * secili olmayan cipte de var.
 *
 * Secili hal yalnizca renkle anlatilmiyor: rengi ayirt edemeyen bir kullanici
 * icin renk tek basina bilgi degil.
 */
export function Chip({ option, selected, onPress, disabled = false, style }: ChipProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={option.label}
      {...(option.hint ? { accessibilityHint: option.hint } : {})}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          backgroundColor: selected ? colors.clayTint : colors.surface,
          borderWidth: 1,
          borderColor: selected || pressed ? colors.clay : colors.hairline,
          borderRadius: radius.full,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <View style={{ width: MARK_SIZE, alignItems: 'center' }}>
        {selected ? (
          <AppText variant="caption" tone="clay" style={{ lineHeight: 14 }}>
            ✓
          </AppText>
        ) : null}
      </View>

      <AppText variant="label" numberOfLines={2} style={{ flexShrink: 1 }}>
        {option.label}
      </AppText>
    </Pressable>
  );
}
