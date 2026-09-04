import { View } from 'react-native';

import { useTheme } from '@/theme';

type ProgressBarProps = {
  current: number;
  total: number;
};

/**
 * Orani kendisi hesapliyor: cagiran taraf yuzde gondermek zorunda kalirsa,
 * ayni hesap her ekranda tekrar yazilir ve biri kacinilmaz olarak farkli olur.
 */
export function ProgressBar({ current, total }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const ratio = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current }}
      style={{
        height: 3,
        borderRadius: radius.full,
        backgroundColor: colors.hairline,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${ratio * 100}%`,
          height: '100%',
          borderRadius: radius.full,
          backgroundColor: colors.clay,
        }}
      />
    </View>
  );
}
