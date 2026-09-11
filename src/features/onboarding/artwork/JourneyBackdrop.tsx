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

import { journeyArtworkModule, journeyOffset } from './journeyArtwork';

type JourneyBackdropProps = {
  progress: number;
  /**
   * Perdenin agirligi.
   *
   * `full` metni dogrudan gorselin uzerine koyan ekranlar icin: orada kontrast
   * perdeden geliyor. `light` ise metnin zeminini kendisi getiren, icerigini
   * saydam bir kartin icine alan ekranlar icin. Tam karartma kartin altindaki
   * bolgeyi neredeyse siyaha indiriyor ve saydam bir yuzeyin kiracak bir
   * goruntusu kalmiyor: kart o zaman camdan cok duz bir panele benziyor.
   */
  veil?: VeilWeight;
};

export type VeilWeight = 'full' | 'light';

/**
 * Perdenin metin bolgesindeki en yuksek opakligi.
 *
 * `full` degeri gorselin en acik bolgesinde bile metni tasiyacak kadar yuksek.
 * `light` onun ucte birine yakin: karartmayi tamamen kaldirmak da secenek
 * degil, cunku kartin disinda kalan buton ve yasal satir hala gorselin uzerinde
 * duruyor.
 */
const VEIL_PEAK = { full: 0.86, light: 0.3 } as const;

/**
 * Karartmanin basladigi dikey oran.
 *
 * Asagi kaydirmak, karartmanin ekranin daha kucuk bir bolumunde toplanmasi
 * demek: gorselin ust yarisi acik kaliyor ve kartin arkasindan gecen serit
 * gorunur oluyor.
 */
const VEIL_START = { full: 0.36, light: 0.55 } as const;

/**
 * Parilti katmaninin opakliklari.
 *
 * Parilti de bir katman: kartin bolgesinde toplandiginda kirilacak goruntuyu
 * kendi tonuyla orttuyor. Hafif kipte yariya iniyor -- tamamen kaldirmak
 * gorselin sag ust kosesindeki isik kaynagini yok ederdi.
 */
const GLOW_STRENGTH = {
  full: { near: 0.34, far: 0.16 },
  light: { near: 0.17, far: 0.08 },
} as const;

export function JourneyBackdrop({ progress, veil = 'full' }: JourneyBackdropProps) {
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

      {/* Aydinlatma ve karartma renkleri paletten geliyor. Burada ham hex
          tasimak, "altili renk kodu yalnizca tek dosyada" kuralini sessizce
          delerdi: perde bir efekt degil, temanin bir parcasi. */}
      <LinearGradient
        testID="journey-glow"
        colors={[
          withAlpha(colors.glowStrong, GLOW_STRENGTH[veil].near),
          withAlpha(colors.glowDeep, GLOW_STRENGTH[veil].far),
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
        colors={[withAlpha(colors.veil, 0), withAlpha(colors.veil, VEIL_PEAK[veil])]}
        locations={[VEIL_START[veil], 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
