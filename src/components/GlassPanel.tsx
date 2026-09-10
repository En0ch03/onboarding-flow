import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
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
  // Iki ayri soru soruluyor: tasarim dilinin cam olup olmadigi, ve yerel cam
  // API'sinin cihazda gercekten bulunup bulunmadigi. Bazi iOS 26 derlemeleri
  // ilkine "evet" ikincisine "hayir" diyor; orada cam katman saydam ciziliyor
  // ve metnin altinda hicbir zemin kalmiyor. Ikisi birden dogru degilse
  // bulanikliga dusmek, zemini olmayan bir karttan iyi.
  return isLiquidGlassAvailable() && isGlassEffectAPIAvailable() ? 'liquid' : 'blur';
}

/**
 * Bulanik kipte dolgunun opakligi; cam kipte ayni deger tona gidiyor.
 *
 * Deger bir denge noktasi: asagi inince metnin zemini zayifliyor, yukari
 * cikinca arkadaki gorsel kayboluyor ve kart yeniden duz bir panele donuyor.
 * Kontrast bilerek bu dolguya bagli, bulanikliga degil -- bulanikligin sonucu
 * arkadaki goruntuye gore degisir, dolgunun opakligi degismez.
 */
const TRANSLUCENT_FILL = 0.4;

/** Bulaniksiz kipte dolgu tek basina calisiyor, o yuzden daha opak. */
const FLAT_FILL = 0.86;

/**
 * Form icerigini tasiyan buzlu kart.
 *
 * Arka plandaki gorseli karartmak yerine metne kendi zeminini veriyor:
 * karartma gorseli de yok ediyordu, kart onu kenarlardan sizdirmaya devam
 * ediyor.
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
          // Kenarlik ust isigiyla alt golgenin arasinda kalmali; kendi tonu
          // one cikinca kart yuzeyden cok cerceveye benziyordu.
          borderColor: withAlpha(colors.ink, 0.12),
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
          // Yerel katman kabin `overflow: hidden` kirpmasini gormuyor, kendi
          // kose yaricapini okuyor: verilmezse cam dort koseli kaliyor ve
          // kartin yuvarlak kenari ustunde bir dikdortgen olarak duruyor.
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, borderCurve: 'continuous' }]}
        />
      ) : null}

      {mode === 'blur' ? (
        <BlurView
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          // `dark` iOS 10 oncesinden kalma duz bir koyu bulaniklik, sistemin
          // materyali degil: arkadaki rengi tasimiyor ve kart camdan cok
          // isli bir cama benziyor. Ince koyu materyal, kartin altindaki
          // gorselden renk sizdiran ama metne zemin birakan tek kalinlik.
          tint="systemThinMaterialDark"
          // Siddet iOS'ta bir animatorun ilerleme oranina donuyor
          // (`node_modules/expo-blur/ios/BlurEffectView.swift:53-56`): 100
          // disindaki her deger materyali yarida kesiyor, yani hem bulaniklik
          // hem materyalin kendi ton katmani yarim uygulaniyor.
          intensity={100}
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
        testID="glass-panel-edge-top"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: withAlpha(colors.ink, 0.3),
        }}
      />

      {/* Alt kenarda ust cizginin esi, ters yonde: isik yukaridan gelirse
          govde asagida kalinlasir. Iki cizgi olmadan kart bir yuzey degil,
          zemine yapisik bir dikdortgen gibi duruyordu. */}
      <View
        testID="glass-panel-edge-bottom"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: withAlpha(colors.veil, 0.35),
        }}
      />

      {children}
    </View>
  );
}
