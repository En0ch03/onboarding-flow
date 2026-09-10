import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, withAlpha } from '@/theme';

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kartin arkasinin nasil cizildigi.
 *
 * Uc kip var cunku bulaniklik uc ayri gerceklige denk geliyor. Sistemin cam
 * efekti yalnizca yeni iOS surumlerinde var; onun altindaki surumlerde ayni
 * hissi veren sey genel bulaniklik. Android'de bulaniklik deneysel ve her
 * karede yeniden hesaplaniyor -- kaydirma sirasinda odenen bedel, kazanilan
 * gorunumden buyuk. Orada kart bulaniksiz ama daha opak bir dolguyla duruyor:
 * metnin zemini her kipte ayni guvende.
 */
export type GlassMode = 'liquid' | 'blur' | 'flat';

export function resolveGlassMode(): GlassMode {
  if (Platform.OS !== 'ios') return 'flat';
  return isLiquidGlassAvailable() ? 'liquid' : 'blur';
}

/** Bulanik kipte dolgunun opakligi; cam kipte ayni deger tona gidiyor. */
const TRANSLUCENT_FILL = 0.55;

/** Bulaniksiz kipte dolgu tek basina calisiyor, o yuzden daha opak. */
const FLAT_FILL = 0.86;

/**
 * Form icerigini tasiyan buzlu kart.
 *
 * Arka plandaki gorseli karartmak yerine metne kendi zeminini veriyor:
 * karartma gorseli de yok ediyordu, kart onu kenarlardan sizdirmaya devam
 * ediyor. Okunabilirlik bilerek bulanikliga baglanmadi -- bulanikligin
 * sonucu arkadaki goruntuye gore degisir, dolgunun opakligi degismez.
 *
 * Kart dekoratif: butun katmanlari ekran okuyucudan gizli ve dokunusu
 * gecirmiyor, icerik oldugu gibi erisilebilir kaliyor.
 */
export function GlassPanel({ children, style }: GlassPanelProps) {
  const { colors, radius, spacing } = useTheme();
  const mode = resolveGlassMode();
  const tint = withAlpha(colors.paper, TRANSLUCENT_FILL);

  return (
    <View
      testID="glass-panel"
      style={[
        {
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          // Katmanlar kartin kosesinden tasmasin: tasan bir dolgu, yuvarlak
          // kenari dorde donduruyor.
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: withAlpha(colors.ink, 0.14),
          padding: spacing.xl,
        },
        style,
      ]}
    >
      {mode === 'liquid' ? (
        <GlassView
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          glassEffectStyle="regular"
          tintColor={tint}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {mode === 'blur' ? (
        <BlurView
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          tint="dark"
          intensity={50}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {mode === 'liquid' ? null : (
        <View
          testID="glass-panel-fill"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: mode === 'flat' ? withAlpha(colors.surface, FLAT_FILL) : tint },
          ]}
        />
      )}

      {/* Ust kenardaki bir tik daha acik cizgi: cam hissini veren sey isigin
          kartin ust kenarinda toplanmasi. Kenarligin tek tonu, karti yuzeyden
          cok cerceveye benzetiyordu. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: withAlpha(colors.ink, 0.22),
        }}
      />

      {children}
    </View>
  );
}
