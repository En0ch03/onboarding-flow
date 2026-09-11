import { BlurView } from 'expo-blur';
import { GlassView, type GlassColorScheme, type GlassStyle } from 'expo-glass-effect';
import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, withAlpha } from '@/theme';

import { resolveGlassMode } from './glassMode';

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Cam kipinde sistemin hangi materyalini kullanacagi.
   *
   * `regular` arkasindaki parlakliga gore kendi tonunu ve golgesini
   * ayarliyor; `clear` bunlari yapmiyor, kalici olarak daha saydam kaliyor ve
   * arkasindaki icerigin kendisini gosteriyor. Kucuk kontroller icin `clear`
   * yanlis secim -- uzerlerindeki isaret arkadaki her sey degistikce
   * okunamaz hale geliyor. Genis bir kartin arkasinda ise zengin bir gorsel
   * duruyor ve onu tona bogmadan gostermenin yolu bu.
   */
  glassStyle?: Extract<GlassStyle, 'regular' | 'clear'>;
  /**
   * Cam kipinde materyalin gorunum semasi.
   *
   * Varsayilan uygulamanin kendi temasi. Koyu semada sistem camin altina bir
   * karartma katmani koyuyor; koyu bir gorselin ustunde bu, saydam camin bile
   * bugulu gorunmesine yetiyor. Karti acik semaya almak o katmani kaldiriyor
   * ve arkadaki gorseli oldugu gibi birakiyor; metin zaten koyu gorselin
   * ustunde okunuyor, camin semasina bagli degil.
   */
  colorScheme?: GlassColorScheme;
};

/**
 * Bulanik kipte dolgunun opakligi.
 *
 * Deger bir denge noktasi: asagi inince metnin zemini zayifliyor, yukari
 * cikinca arkadaki gorsel kayboluyor ve kart yeniden duz bir panele donuyor.
 * Kontrast bilerek bu dolguya bagli, bulanikliga degil -- bulanikligin sonucu
 * arkadaki goruntuye gore degisir, dolgunun opakligi degismez.
 *
 * Cam kipte boyle bir dolgu yok: orada kontrasti da optigi de sistemin kendi
 * materyali tasiyor ve uzerine eklenen her katman onun uyum davranisini
 * bozuyor.
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
 * Cam kipte kartin uzerinde sistemin materyalinden baska hicbir katman yok.
 * Kirilma, isigin kenarda toplanmasi, arkadaki parlakliga gore ton ve icerige
 * gore koyulasan golge -- hepsi materyalin kendi davranisi. Elle eklenen bir
 * dolgu ya da kenar cizgisi bunlarin uzerine biniyor ve materyali taklit
 * eden bir katmana donduruyor; taklit, aslinin ustunde durunca aslini bozuyor.
 * Yedek kiplerde ise o katmanlar tek basina calisiyor ve kaliyor.
 *
 * Kart dekoratif: butun katmanlari ekran okuyucudan gizli ve dokunusu
 * gecirmiyor, icerik oldugu gibi erisilebilir kaliyor.
 */
export function GlassPanel({
  children,
  style,
  glassStyle = 'regular',
  colorScheme,
}: GlassPanelProps) {
  const { colors, radius, scheme, spacing } = useTheme();
  const mode = resolveGlassMode();
  const liquid = mode === 'liquid';

  return (
    <View
      testID="glass-panel"
      style={[
        {
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          // Katmanlar kartin kosesinden tasmasin: tasan bir dolgu, yuvarlak
          // kenari dorde donduruyor.
          overflow: 'hidden',
          // Yatayda dikeyden genis: cam kirilmayi kenar bandinda gosteriyor ve
          // dar bir dolguda o bant icerigin altinda kaliyor. Dikeyi de ayni
          // olcude buyutmek karti ekranin tasiyabileceginden uzun yapardi.
          paddingHorizontal: spacing.xxl,
          paddingVertical: spacing.xl,
        },
        liquid
          ? null
          : {
              borderWidth: 1,
              // Kenarlik ust isigiyla alt golgenin arasinda kalmali; kendi
              // tonu one cikinca kart yuzeyden cok cerceveye benziyordu.
              borderColor: withAlpha(colors.ink, 0.12),
            },
        style,
      ]}
    >
      {liquid ? (
        <GlassView
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          glassEffectStyle={glassStyle}
          // Sema varsayilan olarak uygulamanin kendi anahtarindan geliyor:
          // materyalin "auto" degeri sistemi okuyor, uygulamayi degil. Kart
          // bunu bilerek ezebiliyor (bkz. prop yorumu).
          colorScheme={colorScheme ?? scheme}
          // Yerel katman kabin `overflow: hidden` kirpmasini gormuyor, kendi
          // kose yaricapini okuyor: verilmezse cam dort koseli kaliyor ve
          // kartin yuvarlak kenari ustunde bir dikdortgen olarak duruyor.
          style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, borderCurve: 'continuous' }]}
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

      {liquid ? null : (
        <View
          testID="glass-panel-fill"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                mode === 'flat'
                  ? withAlpha(colors.surface, FLAT_FILL)
                  : withAlpha(colors.paper, TRANSLUCENT_FILL),
            },
          ]}
        />
      )}

      {/* Ust kenardaki bir tik daha acik cizgi: cam hissini veren sey isigin
          kartin ust kenarinda toplanmasi. Kenarligin tek tonu, karti yuzeyden
          cok cerceveye benzetiyordu. Cam kipte bu isik zaten materyalin
          icinde; elle cizilen ikinci bir cizgi onun uzerine biniyor. */}
      {liquid ? null : (
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
      )}

      {/* Alt kenarda ust cizginin esi, ters yonde: isik yukaridan gelirse
          govde asagida kalinlasir. Iki cizgi olmadan kart bir yuzey degil,
          zemine yapisik bir dikdortgen gibi duruyordu. */}
      {liquid ? null : (
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
      )}

      {children}
    </View>
  );
}
