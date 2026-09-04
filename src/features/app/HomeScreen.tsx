import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

/**
 * Akisin bittigi yer.
 *
 * Uygulamanin geri kalani bu calismanin kapsaminda degil; burasi yalnizca
 * onboarding'in gercekten bir yere vardigini gosteren varis noktasi.
 */
export function HomeScreen() {
  const { spacing } = useTheme();

  return (
    <Screen align="center">
      <View>
        <AppText variant="display">{strings.home.title}</AppText>
        <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md }}>
          {strings.home.subtitle}
        </AppText>
      </View>
    </Screen>
  );
}
