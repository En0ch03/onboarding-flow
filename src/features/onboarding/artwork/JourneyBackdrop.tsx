import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme, withAlpha } from '@/theme';

import { journeyOffset } from './journeyArtwork';

const artwork = require('../../../../assets/onboarding/onboarding-crimson-journey-master-v2.png');

type JourneyBackdropProps = {
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
        source={artwork}
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

      {/* Aydinlatma ve karartma renkleri paletten geliyor. Burada ham hex
          tasimak, "altili renk kodu yalnizca tek dosyada" kuralini sessizce
          delerdi: perde bir efekt degil, temanin bir parcasi. */}
      <LinearGradient
        testID="journey-glow"
        colors={[
          withAlpha(colors.glowStrong, 0.34),
          withAlpha(colors.glowDeep, 0.16),
          withAlpha(colors.veil, 0),
        ]}
        locations={[0, 0.44, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.12, y: 0.72 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Karartma daha erken basliyor ve daha derine iniyor: metin blogu
          ekranin ust yarisinda duruyor ve gorselin en acik bolgesi tam oraya
          denk gelebiliyor. Kontrast gorsele gore degil, perdeye gore olculur;
          perde zayifsa olculen sey bir sey ifade etmez. */}
      <LinearGradient
        testID="journey-veil"
        colors={[withAlpha(colors.veil, 0), withAlpha(colors.veil, 0.86)]}
        locations={[0.36, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
