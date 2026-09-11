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
 * Metin footer'in hemen ustunde: gorselin alt bandi her durakta koyu, blok
 * oraya yaslaninca perde gerekmeden okunuyor. Ustte kalan bosluk basligi
 * ortalarken olusan bosluktan farkli -- burada kurdele tek basina bir sahne.
 */
export function WelcomeDifferenceScreen({
  onContinue,
  onBack,
  onSkip,
}: WelcomeDifferenceScreenProps) {
  const { spacing } = useTheme();

  return (
    <Screen
      align="bottom"
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
