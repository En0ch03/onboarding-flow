import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

/**
 * Iz kalinligi. Uc piksel, bir cizgiden kalin ve bir cubuktan ince: ekranda
 * bir sey oldugunu soyluyor ama markanin altinda ikinci bir oge gibi
 * durmuyor.
 */
const TRACK_HEIGHT = 3;

/**
 * Suzulen parcanin ize orani.
 *
 * Ucte bir civari: daha kisasi uzun izde kaybolan bir noktaya donusuyor,
 * daha uzunu ise bastan sona dolu gorunup "ne kadar kaldi" izlenimi
 * veriyor -- oysa burada bilinen bir ilerleme yok.
 */
const SEGMENT_RATIO = 0.32;

export function LaunchScreen() {
  const { colors, motion, radius, screenPadding, spacing } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  /**
   * Bir tur, iki ucun arasindaki tek gecis.
   *
   * Belirtec olcegindeki en uzun sure ekranlar arasi gecise gore ayarlanmis;
   * bir bekleme cubugunda o tempo telasli goruluyor ve gozu yoruyor. Ayni
   * belirtecin kati aliniyor: hareket olcegin disina cikmiyor, yalnizca
   * beklemeye yakisan bir hizda kaliyor.
   */
  const sweepDuration = motion.slow * 3;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Iz olculmeden hareket baslamiyor: gidilecek mesafe bilinmiyor ve
    // parca yerinde titrerdi.
    if (reduceMotion || trackWidth === 0) return;

    offset.setValue(0);
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(offset, {
          toValue: 1,
          duration: sweepDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration: sweepDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    sweep.start();
    return () => sweep.stop();
  }, [offset, reduceMotion, sweepDuration, trackWidth]);

  const measureTrack = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next !== trackWidth) setTrackWidth(next);
  };

  const segmentWidth = Math.round(trackWidth * SEGMENT_RATIO);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Bu ekran yazi tipleri yuklenmeden ciziliyor -- zaten onlari beklemek
          icin var. Yedek yazi tipiyle olculen bir cerceve, gercek yazi tipi
          gelince oldugu gibi kaliyor ve daha genis harfler cerceveyi sagdan
          tasip kesiliyordu. Bu yuzden satirlar kendi genisliklerine
          yapismiyor: cerceve satir boyunca uzuyor, ortalamayi metnin kendisi
          yapiyor. Boylece hicbir olcum cerceveyi metinden dar birakamiyor. */}
      <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center' }}>
        <AppText variant="display" style={styles.centered}>
          {strings.launch.title}
        </AppText>
        <AppText
          variant="subhead"
          tone="inkSoft"
          style={[styles.centered, { marginTop: spacing.lg }]}
        >
          {strings.launch.status}
        </AppText>
        <AppText
          variant="caption"
          tone="inkSoft"
          style={[styles.centered, { marginTop: spacing.xs }]}
        >
          {strings.launch.hint}
        </AppText>
      </View>

      {/* Cubuk metnin yanina degil ekranin dibine yaziliyor: bekleme,
          okunacak cumleyle ayni yerde yarismamali. */}
      <View
        testID="launch-progress"
        accessibilityRole="progressbar"
        // Cubugun kendi cumlesi yok: ekranda yazan bekleme satirini
        // kullaniyor, boylece ekran okuyucu duyduğu sey ile gorunen sey
        // ayni kaliyor.
        accessibilityLabel={strings.launch.status}
        onLayout={measureTrack}
        style={{
          height: TRACK_HEIGHT,
          marginHorizontal: screenPadding,
          marginBottom: spacing.xxxl,
          borderRadius: radius.full,
          backgroundColor: colors.hairline,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          testID="launch-progress-segment"
          style={{
            width: segmentWidth,
            height: TRACK_HEIGHT,
            borderRadius: radius.full,
            backgroundColor: colors.clay,
            transform: [
              {
                translateX: offset.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.max(0, trackWidth - segmentWidth)],
                }),
              },
            ],
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignSelf: 'stretch', textAlign: 'center' },
});
