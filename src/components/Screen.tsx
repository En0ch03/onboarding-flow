import { type ReactNode } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JourneyBackdrop } from '@/features/onboarding/artwork/JourneyBackdrop';
import { spacing as scale, useTheme } from '@/theme';

import { GlassScreenProvider } from './glassScreenContext';

type ScreenProps = {
  /** Ust serit: geri, adim sayaci, atlama. Kaydirilmaz, yerinde durur. */
  header?: ReactNode;
  children: ReactNode;
  /** Birincil eylem. Icerigin sonunda, sayfanin dibinde. */
  footer?: ReactNode;
  /**
   * Ekranin cam yuzey cizip cizmeyecegi.
   *
   * Varsayilan acik: form ve secim ekranlari hicbir sey vermeden bugunku
   * davranisi koruyor. Yalnizca duz metne dayanan ekranlar `false` verip
   * kendi baslik dugmelerini ve hayalet dugmesini yedek gorunumde birakiyor.
   */
  glass?: boolean;
  /**
   * Icerigin dikey yeri.
   *
   * `top` icerigi ust seridin hemen altina koyar. `upper` onu asagi dogru
   * biraz iter ama ortalamaz: metin ust sol bolgede, kosede degil, iceriden
   * bir bosluk birakarak duruyor. `center` dikeyde ortalar.
   *
   * `upper` boslugu ust seridin uzerine biniyor, yerine gecmiyor: seritli bir
   * ekranda ikisi toplanir ve icerik beklenenden asagi duser.
   */
  align?: ScreenAlign;
  /** Sifir ile bir arasinda, uzun onboarding sanatinin gorunecek kadraji. */
  journeyProgress?: number;
};

export type ScreenAlign = 'top' | 'upper' | 'center';

/**
 * `upper` boslugu sabit degil oranli: sabit bir deger kucuk ekranda icerigi
 * asagi itip butonun uzerine bindiriyor, buyuk ekranda ise kayboluyor.
 */
const UPPER_INSET_RATIO = 0.12;

/** Icerigin ust boslugu: baslik seridiyle metnin ilk satiri arasindaki nefes. */
const CONTENT_TOP_INSET = scale.xl;

/**
 * Akistaki her ekranin kabugu.
 *
 * Klavye sorunu burada bir kez cozuluyor. Ekran ekran cozmek, ekranlardan
 * birinde unutulmasi demek ve bu, kullanicinin yazdigi seyi goremedigi bir
 * ekran olarak ortaya cikiyor.
 *
 * Eylem butonu klavyeyle birlikte yukari **cikmiyor.** Cikan bir buton, her
 * tusa basista ziplayan bir arayuz demek ve elin altindaki hedef yer
 * degistiriyor. Buton icerigin sonunda, sayfanin dibinde duruyor; klavye
 * acildiginda onun ustunu ortuyor ve kullanici klavyeyi kapatinca geri
 * geliyor. Korunmasi gereken sey butonun gorunurlugu degil, girdi alaninin
 * ortulmemesi -- ve bunu kaydirma alaninin kisalmasi zaten sagliyor.
 *
 * Ust serit kaydirilmiyor: ortalanan ekranlarda icerikle birlikte ortalaniyor
 * ve geri dugmesi ekranin ortasinda kaliyordu. Seridin ustunde de gercek bir
 * bosluk var: cihazin durum cubuguna yaslanan bir dugme dokunulmasi zor bir
 * dugme.
 */
export function Screen({
  header,
  children,
  footer,
  align = 'top',
  journeyProgress,
  glass = true,
}: ScreenProps) {
  const { colors, scheme, screenPadding, spacing } = useTheme();
  const { height } = useWindowDimensions();
  const showJourney = journeyProgress !== undefined && scheme === 'dark';

  return (
    <GlassScreenProvider value={glass}>
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        {showJourney ? <JourneyBackdrop progress={journeyProgress} /> : null}
        <SafeAreaView
          style={{ flex: 1, backgroundColor: showJourney ? 'transparent' : colors.paper }}
          edges={['top', 'bottom']}
        >
          {header ? (
            <View style={{ paddingHorizontal: screenPadding, paddingTop: spacing.lg }}>
              {header}
            </View>
          ) : null}

          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: screenPadding,
                paddingTop: CONTENT_TOP_INSET,
                paddingBottom: spacing.xl,
              }}
              // Odaklanan alan klavyenin altinda kalmasin diye kaydirma alani
              // klavye kadar kisaliyor. Butonu tasimiyor, yalnizca icerigi.
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              // Klavye acikken butona ilk dokunusun calismasi icin: aksi halde
              // ilk dokunus yalnizca klavyeyi kapatiyor, kullanici iki kez basiyor.
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {/* `flex: 1` degil `flexGrow: 1`. Ilki `flexBasis: 0` demek ve icerik
              kutusunu "gorunur alan eksi footer" boyutuna sabitliyor; o zaman
              icerik kabi hicbir zaman gorunur alandan buyuk olmuyor ve
              ScrollView kaydirmiyor - tasan icerik kirpiliyor. `flexGrow` ile
              kutu kisa icerikte boslugu dolduruyor, uzun icerikte kendi
              yuksekligini aliyor. */}
              <View
                style={{
                  flexGrow: 1,
                  ...(align === 'center' ? { justifyContent: 'center' } : null),
                  ...(align === 'upper'
                    ? { paddingTop: Math.round(height * UPPER_INSET_RATIO) }
                    : null),
                }}
              >
                {children}
              </View>

              {footer ? <View style={{ paddingTop: spacing.xl }}>{footer}</View> : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </GlassScreenProvider>
  );
}
