import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

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
            paddingBottom: spacing.lg,
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
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
