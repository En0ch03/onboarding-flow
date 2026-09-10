import { View, type ViewProps } from 'react-native';
import type { BlurViewProps } from 'expo-blur';

/** Testler bulanik katmani bu kimlikle bulur. */
export const BLUR_VIEW_TEST_ID = 'blur-view';

/**
 * Bulanikligin kendisi yerel bir katmanda hesaplaniyor; testte olculebilecek
 * bir goruntu yok. Taklit prop'lari agacta birakiyor, boylece dogrulanan sey
 * bulanikligin gorunumu degil, hangi ton ve siddetle istendigi.
 */
export function BlurView(props: BlurViewProps) {
  return <View {...(props as ViewProps)} testID={BLUR_VIEW_TEST_ID} />;
}
