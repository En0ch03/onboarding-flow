import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { strings } from '@/constants/strings';
import { journeyStops } from '@/features/onboarding/artwork/journeyArtwork';
import { useTheme } from '@/theme';

type WelcomePromiseScreenProps = {
  onStart: () => void;
  onSignIn: () => void;
};

/**
 * Ilk ekran urunu tarif etmiyor, bir sahne kuruyor.
 *
 * Olcek bilerek buyuk: bu gorsel yonun en buyuk riski sablon hissi ve o riske
 * kucuk basliklarla uygulandiginda dusuluyor. Boslugun kendisi de bir arac;
 * algilanan kalite renkten once yogunluktan geliyor.
 *
 * Cumle dikeyde ortalanmiyor. Ortalanmis bir baslik afis gibi duruyor ve
 * okuma dogal olarak ust sol kosede basliyor; metin oraya dogru cekildi ama
 * koseye yaslanmadi, iceriden bir bosluk birakildi.
 */
export function WelcomePromiseScreen({ onStart, onSignIn }: WelcomePromiseScreenProps) {
  const { spacing } = useTheme();

  return (
    <Screen
      align="upper"
      glass={false}
      journeyProgress={journeyStops.welcome}
      footer={
        <View>
          <Button title={strings.welcome.promisePrimary} onPress={onStart} />
          <Button
            title={strings.welcome.promiseSecondary}
            onPress={onSignIn}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      }
    >
      <View>
        <AppText variant="display" accessibilityRole="header">
          {strings.welcome.promiseTitle}
        </AppText>
        <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md, maxWidth: 320 }}>
          {strings.welcome.promiseSubtitle}
        </AppText>
      </View>
    </Screen>
  );
}
