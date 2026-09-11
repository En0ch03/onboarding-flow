import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { strings } from '@/constants/strings';
import { journeyStops } from '@/features/onboarding/artwork/journeyArtwork';
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
 * reddediyor, ikincisi onu baska bir seyle degistiriyor. Bu yuzden iki ayri
 * satir: tek blok halinde yazildiginda arada gecen an kayboluyor. Hemen
 * altindaki satir urunun nasil calistigini soyluyor, duygudan sonra somut
 * bilgi.
 *
 * Metin ust seridin hemen altinda. Ortalandiginda geri ve gec dugmeleriyle
 * arasinda hicbir sey olmayan buyuk bir bosluk kaliyordu.
 */
export function WelcomeDifferenceScreen({
  onContinue,
  onBack,
  onSkip,
}: WelcomeDifferenceScreenProps) {
  const { spacing } = useTheme();

  return (
    <Screen
      glass={false}
      journeyProgress={journeyStops.difference}
      header={
        <ScreenHeader onBack={onBack} skip={{ label: strings.common.skip, onPress: onSkip }} />
      }
      footer={<Button title={strings.welcome.differencePrimary} onPress={onContinue} />}
    >
      <View>
        {/* Iki satir tek baslik: ekran okuyucu ikisini bir cumle olarak
            okuyor, goz ise aradaki duraklamayi goruyor. */}
        <View accessible accessibilityRole="header">
          <AppText variant="title">{strings.welcome.differenceTitleFirst}</AppText>
          <AppText variant="title" style={{ marginTop: spacing.sm }}>
            {strings.welcome.differenceTitleSecond}
          </AppText>
        </View>
        {/* Aralik form ekranlarindakinden genis ve bilerek: baslik burada iki
            satir. Sekiz birimlik dar aralik, aciklamayi basligin ucuncu
            satiri gibi gosteriyor ve tam da ayirmaya calistigimiz seyi geri
            birlestiriyor. */}
        <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.xl }}>
          {strings.welcome.differenceSubtitle}
        </AppText>
      </View>
    </Screen>
  );
}
