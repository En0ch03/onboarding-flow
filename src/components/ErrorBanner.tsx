import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ErrorBannerProps = {
  message: string;
  /** Cikis yolu. Bir hata cikmaz olmamali. */
  action?: { label: string; onPress: () => void } | undefined;
};

/**
 * Forma ait, tek bir alana baglanamayan hatalar burada gorunur.
 *
 * Renk dusuk doygunlukta: bir kayit akisi bastan sona degerlendirme baglami
 * ve parlak kirmizi o baglamda kacinma duygusu uretiyor.
 */
export function ErrorBanner({ message, action }: ErrorBannerProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: colors.dangerTint,
        borderRadius: radius.sm,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.danger,
        padding: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <AppText variant="caption" tone="danger">
        {message}
      </AppText>

      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <AppText
            variant="caption"
            tone="ink"
            style={{ marginTop: spacing.sm, textDecorationLine: 'underline' }}
          >
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
