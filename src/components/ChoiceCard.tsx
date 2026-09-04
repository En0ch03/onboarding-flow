import { Pressable, View } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ChoiceCardProps = {
  option: Option;
  selected: boolean;
  onPress: () => void;
  /** Sinir dolmusken secilemeyen kartlar sonuk gorunur ama kaybolmaz. */
  disabled?: boolean;
};

/**
 * Secim karti. Secenegin kendisi disaridan geliyor; bu bilesen hicbir liste
 * tasimiyor.
 *
 * Secili durum yalnizca renkle degil, isaret ve kenarlikla da anlatiliyor:
 * rengi ayirt edemeyen bir kullanici icin renk tek basina bilgi degil.
 */
export function ChoiceCard({ option, selected, onPress, disabled = false }: ChoiceCardProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={option.label}
      {...(option.hint ? { accessibilityHint: option.hint } : {})}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        backgroundColor: selected ? colors.clayTint : colors.surface,
        borderWidth: 1,
        borderColor: selected || pressed ? colors.clay : colors.hairline,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        opacity: disabled ? 0.45 : 1,
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

      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: selected ? colors.clay : colors.hairline,
          backgroundColor: selected ? colors.clay : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <AppText variant="caption" tone="onClay" style={{ lineHeight: 14 }}>
            ✓
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
