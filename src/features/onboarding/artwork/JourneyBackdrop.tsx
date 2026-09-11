import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme } from '@/theme';

import { journeyArtworkModule, journeyOffset } from './journeyArtwork';

type JourneyBackdropProps = {
  /** Yolculuktaki konum: 0 baslangic, 1 varis. */
  progress: number;
};

export function JourneyBackdrop({ progress }: JourneyBackdropProps) {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const { colors, motion } = useTheme();
  const target = journeyOffset(progress, viewportWidth, viewportHeight);
  const [translateX] = useState(() => new Animated.Value(target.translateX));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      translateX.setValue(target.translateX);
      return;
    }

    const animation = Animated.timing(translateX, {
      toValue: target.translateX,
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [motion.slow, reduceMotion, target.translateX, translateX]);

  return (
    <View
      testID="journey-backdrop"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: colors.paper }]}
    >
      <Animated.Image
        testID="journey-artwork"
        source={journeyArtworkModule}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: target.width,
          height: viewportHeight,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}
