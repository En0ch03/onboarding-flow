import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, withAlpha } from '@/theme';

type ScreenProps = {
  /** Ust serit: geri, adim sayaci, atlama. Kaydirilmaz, yerinde durur. */
  header?: ReactNode;
  children: ReactNode;
  /** Birincil eylem. Icerigin sonunda, sayfanin dibinde. */
  footer?: ReactNode;
  /** Karsilama ekranlari icerigi dikeyde ortalar. */
  centered?: boolean;
};

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
 * geliyor. Brief'in sarti girdi alaninin ortulmemesi, ki o korunuyor.
 *
 * Ust serit kaydirilmiyor: `centered` ekranlarda icerikle birlikte ortalaniyor
 * ve geri dugmesi ekranin ortasinda kaliyordu.
 */
export function Screen({ header, children, footer, centered = false }: ScreenProps) {
  const { colors, screenPadding, spacing } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top', 'bottom']}>
      {header ? (
        <View style={{ paddingHorizontal: screenPadding, paddingTop: spacing.sm }}>{header}</View>
      ) : null}

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: screenPadding,
            paddingTop: spacing.md,
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
              kutu kisa icerikte bosluğu dolduruyor, uzun icerikte kendi
              yuksekligini aliyor. */}
          <View style={{ flexGrow: 1, ...(centered ? { justifyContent: 'center' } : null) }}>
            {children}
          </View>

          {footer ? <View style={{ paddingTop: spacing.xl }}>{footer}</View> : null}
        </ScrollView>

        {/* Icerik ust seride sert bir cizgiyle carpmasin: kaydirirken metnin
            kesildigi yer, orada bir sey bittigi izlenimi veriyor. Solma
            "yukarida devami var" demenin sessiz yolu. */}
        <LinearGradient
          colors={[colors.paper, withAlpha(colors.paper, 0)]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: spacing.xl }}
          pointerEvents="none"
        />
      </View>
    </SafeAreaView>
  );
}
