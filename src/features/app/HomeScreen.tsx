import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { strings } from '@/constants/strings';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme';

/**
 * Akisin bittigi yer.
 *
 * Uygulamanin geri kalani bu calismanin kapsaminda degil; burasi yalnizca
 * onboarding'in gercekten bir yere vardigini gosteren varis noktasi.
 */
export function HomeScreen() {
  const { spacing } = useTheme();
  const endSession = useAuthStore((state) => state.endSession);

  return (
    <Screen
      align="center"
      footer={
        // Varis noktasi cikmaz sokak olamaz. Cikis yolu olmayinca hesaptan
        // ayrilmanin tek yolu uygulamayi silmek kaliyordu, ve ayni telefonu
        // kullanan ikinci bir kisinin onunde hic yol yoktu.
        //
        // Taslaga burada dokunulmuyor: akisi bitiren yol onu zaten siliyor,
        // ve oturumun kapanisini taslagin silinmesine baglamak, yenilemesi
        // tukenmis bir oturumda ag arizasini veri kaybina cevirirdi.
        <Button
          title={strings.home.signOut}
          variant="ghost"
          onPress={() => {
            void endSession();
          }}
        />
      }
    >
      <View>
        <AppText variant="display">{strings.home.title}</AppText>
        <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md }}>
          {strings.home.subtitle}
        </AppText>
      </View>
    </Screen>
  );
}
