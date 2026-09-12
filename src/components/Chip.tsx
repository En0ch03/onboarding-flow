import { GlassView } from 'expo-glass-effect';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { resolveGlassMode } from './glassMode';
import { useScreenGlassEnabled } from './glassScreenContext';

/**
 * Secim anindaki nabzin tepesi.
 *
 * Kucuk tutuldu: dokunulan seyin cevap verdigini gostermeye yetiyor ama
 * komsu cipleri itecek kadar buyumuyor -- olcek yerlesimi yeniden akitmiyor,
 * cip kendi merkezinde bir an genisleyip geri geliyor.
 */
const PULSE_SCALE = 1.04;

type ChipProps = {
  option: Option;
  selected: boolean;
  onPress: () => void;
  /**
   * Sinir dolu ve bu cip secili degil. Sonuk gorunur ama dokunulabilir:
   * dokunus reddi soyler. Devre disi ilan edilmez -- ekran okuyucuya
   * sebepsiz bir "kullanilamaz" demek, sebebi soylemekten kotu.
   */
  blocked?: boolean;
  /** Sonuk cipe ekran okuyucunun verecegi cikis yolu. */
  blockedHint?: string | undefined;
};

/**
 * Kisa etiketler icin kompakt secim. Karttan farki yalnizca yogunluk: on iki
 * etiketi kart olarak dizmek ekrani okunmaz hale getiriyor.
 *
 * Cip kendi etiketi kadar genis. Esit genislikteki hucre denendi ve uzun
 * etiketleri alt alta kiriyordu; kirilmis bir etiket cipi kucuk bir karta
 * cevirip listenin taranabilirligini bitiriyor.
 *
 * Secili hal cipin olculerini degistirmiyor. Kenarlik secilince kalinlasiyor
 * ama ic bosluk ayni miktarda kucululuyor; aksi halde dokunulan cip parmagin
 * altinda buyur ve bir sonraki hedef kayardi.
 *
 * Secili hal yalnizca renkle anlatilmiyor: kalinlasan kenarlik, rengi ayirt
 * edemeyen kullanici icin ikinci kanal; ekran okuyucu ise durumu zaten
 * kelimeyle aliyor.
 *
 * Yuzey "Simdilik gec" kapsuluyle ayni cam recetesini kullaniyor: cam kipte
 * sistemin materyali disinda hicbir katman yok, yedek kipte tek katman ince
 * bir murekkep dolgusu. Secim isareti bu katmanin ustune biniyor, camin
 * yerini almiyor.
 */
export function Chip({ option, selected, onPress, blocked = false, blockedHint }: ChipProps) {
  const { colors, radius, scheme, spacing, motion } = useTheme();
  const liquid = useScreenGlassEnabled() && resolveGlassMode() === 'liquid';
  const hint = blocked ? blockedHint : option.hint;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  // Ilk cizimde nabiz atmiyor: acilista zaten secili gelen cipler hep birden
  // titrerdi. Nabiz bir gecise ait, bir duruma degil.
  const wasSelected = useRef(selected);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const becameSelected = selected && !wasSelected.current;
    wasSelected.current = selected;
    if (!becameSelected || reduceMotion) return;

    const pulse = Animated.sequence([
      Animated.timing(scale, {
        toValue: PULSE_SCALE,
        duration: motion.fast / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: motion.fast / 2,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [motion.fast, reduceMotion, scale, selected]);

  // Kenarlik farki ic boslukla telafi ediliyor: 1 + 17 = 2 + 16.
  const border = selected ? 2 : 1;
  const pad = selected ? 0 : 1;

  return (
    <Animated.View
      testID={`chip-pulse-${option.id}`}
      // Cip kendi etiketi kadar yer kapliyor; satirin kalanina yayilmiyor.
      style={{ alignSelf: 'flex-start', transform: [{ scale }] }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={option.label}
        {...(hint ? { accessibilityHint: hint } : {})}
        onPress={onPress}
        style={({ pressed }) => [
          {
            borderWidth: border,
            borderColor: selected || pressed ? colors.clay : withAlpha(colors.ink, 0.22),
            borderRadius: radius.full,
            paddingVertical: spacing.md + pad,
            paddingHorizontal: spacing.lg + pad,
            opacity: blocked ? 0.45 : 1,
            // Cam kipte katman cipin disina tasarsa kapsulu dorde donduruyor.
            overflow: 'hidden',
          },
          // Cam kipte ekstra bir dolgu materyalin uzerine biniyor ve onu
          // taklit eden bir katmana donduruyor; "Simdilik gec" ile ayni kural.
          liquid ? null : { backgroundColor: withAlpha(colors.ink, pressed ? 0.16 : 0.08) },
        ]}
      >
        {liquid ? (
          <GlassView
            testID="glass-chip"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            glassEffectStyle="regular"
            isInteractive
            colorScheme={scheme}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
          />
        ) : null}

        {selected ? (
          <View
            testID="chip-selected-tint"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.clayTint }]}
          />
        ) : null}

        {/* Etiket tek satirda kaliyor. Buyuk sistem yazisinda bu, etiketin
            kuyrugunun kirpilmasi demek; bu bedel, satir kirmanin cipi
            yukseltip parmagin altindaki hedefi kaydirmasina tercih
            ediliyor. */}
        <AppText variant="control" numberOfLines={1}>
          {option.label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}
