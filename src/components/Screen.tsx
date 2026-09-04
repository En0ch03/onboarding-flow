import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/**
 * Bir rengin saydam halini uretir.
 *
 * `transparent` anahtar kelimesi kullanilmiyor cunku o `rgba(0,0,0,0)` demek
 * ve Android'de gradyanin saydam ucu griye caliyor. Solmanin gorunmez olmasi
 * icin iki uc da ayni renk olmali, yalnizca alfasi degismeli.
 */
function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type ScreenProps = {
  /** Ust serit: geri, adim sayaci, atlama. */
  header?: ReactNode;
  children: ReactNode;
  /** Birincil eylem. Klavyenin ustunde kalir, altinda degil. */
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
 * Iki platform farkli davraniyor: iOS'ta klavye icerigin uzerine biniyor ve
 * dolgu eklemek gerekiyor; Android'de pencere zaten yeniden boyutlaniyor,
 * dolayisiyla yuksekligi kisitlamak dogru davranis.
 */
export function Screen({ header, children, footer, centered = false }: ScreenProps) {
  const { colors, screenPadding, spacing } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: screenPadding,
            paddingTop: spacing.sm,
            // Son eleman alt seride yapisik bitmesin: bir alan hatasi
            // tam sinirda kalirsa kirpilmis gibi okunuyor.
            paddingBottom: spacing.xxl,
            ...(centered ? { justifyContent: 'center' } : null),
          }}
          // Klavye acikken butona ilk dokunusun calismasi icin: aksi halde
          // ilk dokunus yalnizca klavyeyi kapatiyor, kullanici iki kez basiyor.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {header}
          {children}
        </ScrollView>

        {footer ? (
          <View>
            {/* Icerik alt seride sert bir cizgiyle carpmasin: opak bir serit,
                altinda devam eden bir metni kesilmis gibi gosteriyor ve
                kullanici orada bir sey olup olmadigini anlamiyor. Solma,
                "burada devami var" demenin sessiz yolu. */}
            <LinearGradient
              colors={[withAlpha(colors.paper, 0), colors.paper]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '100%',
                height: spacing.xxl,
              }}
              pointerEvents="none"
            />
            <View
              style={{
                paddingHorizontal: screenPadding,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                backgroundColor: colors.paper,
              }}
            >
              {footer}
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
