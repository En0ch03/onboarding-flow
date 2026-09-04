import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

type WelcomeDifferenceScreenProps = {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
};

/**
 * Ilk ekran sahneyi kurdu, ikincisi kullaniciyi icine aliyor.
 *
 * Iki cumlenin arasindaki nokta isin merkezi: birincisi bir ihtimali
 * reddediyor, ikincisi onu baska bir seyle degistiriyor. Hemen altindaki
 * satir urunun nasil calistigini soyluyor - duygudan sonra somut bilgi.
 */
export function WelcomeDifferenceScreen({
  onContinue,
  onBack,
  onSkip,
}: WelcomeDifferenceScreenProps) {
  const { spacing } = useTheme();

  return (
    <Screen
      centered
      header={
        <ScreenHeader onBack={onBack} skip={{ label: strings.common.skip, onPress: onSkip }} />
      }
      footer={<Button title={strings.welcome.differencePrimary} onPress={onContinue} />}
    >
      <View>
        <AppText variant="title" accessibilityRole="header">
          {strings.welcome.differenceTitle}
        </AppText>
        <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.lg }}>
          {strings.welcome.differenceSubtitle}
        </AppText>
      </View>
    </Screen>
  );
}
