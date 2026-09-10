import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme, withAlpha } from '@/theme';

import { resolveGlassMode, type GlassMode } from './glassMode';

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
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

/** Rozette kipin yerini tutan harf. */
const MODE_LETTERS: Record<GlassMode, string> = { liquid: 'L', blur: 'B', flat: 'F' };

/**
 * Sistemin saydamligi kisitlayip kisitlamadigi.
 *
 * Ayri bir kanca cunku cevap asenkron geliyor ve yalniz iOS'ta anlamli. Cevap
 * gelmeden veya hic gelmeyecekse soru isareti kaliyor: burada yanlis bir
 * "acik" yazmak, cihazi tutan kisiyi yanlis yone gonderir.
 */
function useTransparencyLabel() {
  const [label, setLabel] = useState('saydamlık ?');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((limited) => {
        if (alive) setLabel(limited ? 'saydamlık kısıtlı' : 'saydamlık açık');
      })
      // Erisilebilirlik sorusu cevapsiz kalabilir; rozet bir teshis araci,
      // cevaplayamadigi soru yuzunden ekrani dusurmemeli.
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return label;
}

/**
 * Kartin hangi kiple cizildigini soyleyen kucuk etiket.
 *
 * Cihazda gorulen "efekt tam olmamis" tablosunun uc ayri sebebi olabiliyor:
 * yanlis kip, isletim sistemi surumu, ya da saydamligi kisitlayan bir
 * erisilebilirlik ayari. Uc bilgi ayni anda ekranda durursa cihazi tutan kisi
 * tek bakista soyleyebiliyor; terminal ciktisi icin cihaz basina gecmek gerek.
 */
function GlassModeBadge({ mode }: { mode: GlassMode }) {
  const { colors, radius, spacing } = useTheme();
  const transparency = useTransparencyLabel();
  const system = Platform.OS === 'ios' ? 'iOS' : 'Android';

  return (
    <Text
      testID="glass-mode-badge"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        top: spacing.xs,
        right: spacing.xs,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: radius.sm,
        overflow: 'hidden',
        fontSize: 10,
        color: colors.ink,
        backgroundColor: withAlpha(colors.scrim, 0.55),
      }}
    >
      {`${MODE_LETTERS[mode]} · ${system} ${Platform.Version} · ${transparency}`}
    </Text>
  );
}

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
export function GlassPanel({ children, style }: GlassPanelProps) {
  const { colors, radius, scheme, spacing } = useTheme();
  const mode = resolveGlassMode();
  const liquid = mode === 'liquid';

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
          padding: spacing.xl,
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
          glassEffectStyle="regular"
          // Sema uygulamanin kendi anahtarindan geliyor: sistem koyu temadayken
          // uygulama acik temada olabiliyor ve materyalin "auto" degeri sistemi
          // okuyor, uygulamayi degil.
          colorScheme={scheme}
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

      {/* Yalniz gelistirme derlemesinde: urun derlemesinde bu dal hic
          degerlendirilmiyor, paketleyici olu kodu ayikliyor. */}
      {__DEV__ ? <GlassModeBadge mode={mode} /> : null}
    </View>
  );
}
