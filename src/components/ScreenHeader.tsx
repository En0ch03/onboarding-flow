import { Pressable, View } from 'react-native';

import { stepCounter } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ScreenHeaderProps = {
  onBack?: () => void;
  /** Adim sayaci; verilmezse orta bosluk bos kalir. */
  step?: { current: number; total: number };
  /** Atlama baglantisi. Gizlenmiyor: gizli bir cikis, olmayan cikistan kotu. */
  skip?: { label: string; onPress: () => void };
};

/**
 * Ekranlarin ust seridi. Uc yuvasi var ve bos yuvalar yer tutuyor: baslik
 * her ekranda ayni yukseklikte basliyor, ekrandan ekrana zipliyor gibi
 * gorunmuyor.
 */
export function ScreenHeader({ onBack, step, skip }: ScreenHeaderProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 32,
        marginBottom: spacing.xl,
      }}
    >
      <View style={{ width: 32, alignItems: 'flex-start' }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: pressed ? colors.clay : colors.hairline,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <AppText variant="control" style={{ lineHeight: 20 }}>
              ‹
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {step ? (
        <AppText variant="label" tone="inkSoft" accessibilityLabel={`Adım ${step.current}`}>
          {stepCounter(step.current, step.total)}
        </AppText>
      ) : (
        <View />
      )}

      <View style={{ minWidth: 32, alignItems: 'flex-end' }}>
        {skip ? (
          <Pressable accessibilityRole="button" onPress={skip.onPress} hitSlop={12}>
            <AppText variant="label" tone="inkSoft" style={{ textDecorationLine: 'underline' }}>
              {skip.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
