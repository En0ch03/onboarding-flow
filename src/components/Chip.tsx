import { Pressable } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ChipProps = {
  option: Option;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/**
 * Kisa etiketler icin kompakt secim. Karttan farki yalnizca yogunluk: on iki
 * etiketi kart olarak dizmek ekrani okunmaz hale getiriyor.
 */
export function Chip({ option, selected, onPress, disabled = false }: ChipProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={option.label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? colors.clayTint : colors.surface,
        borderWidth: 1,
        borderColor: selected || pressed ? colors.clay : colors.hairline,
        borderRadius: radius.full,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <AppText variant="label">{selected ? `✓  ${option.label}` : option.label}</AppText>
    </Pressable>
  );
}
