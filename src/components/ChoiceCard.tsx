import { GlassView } from 'expo-glass-effect';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Option } from '@/api/schemas';
import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { resolveGlassMode } from './glassMode';
import { useScreenGlassEnabled } from './glassScreenContext';

type ChoiceCardProps = {
  option: Option;
  selected: boolean;
  onPress: () => void;
  /**
   * Liste birden fazla cevap aliyor mu. Ekran okuyucunun kullandigi rolu bu
   * belirliyor; goruntude bir karsiligi yok.
   */
  multiple: boolean;
  /**
   * Sinir dolmusken secilemeyen kart sonuk gorunur ama kaybolmaz ve
   * dokunulabilir kalir: dokunus, neden secilemedigini soyletir.
   */
  blocked?: boolean;
  /** Sonuk karta ekran okuyucunun verecegi cikis yolu. */
  blockedHint?: string | undefined;
};

/**
 * Secim karti. Secenegin kendisi disaridan geliyor; bu bilesen hicbir liste
 * tasimiyor.
 *
 * Secim dili cip ile ayni: kenarlik ve dolgu. Sagdaki onay dairesi kalkti --
 * secili olmayan kartta bos duran bir daire kullaniciya hicbir sey
 * soylemiyordu, ustelik etiketin yerini aliyordu.
 *
 * Secili durum yalnizca renkle anlatilmiyor: kenarlik secilince kalinlasiyor
 * ve ic bosluk ayni miktarda kucululuyor, yani kart olcu degistirmiyor.
 *
 * Yuzey "Simdilik gec" kapsuluyle (`ScreenHeader.tsx`) ayni cam recetesini
 * kullaniyor: cam kipte sistemin materyali disinda hicbir katman yok, yedek
 * kipte tek katman ince bir mürekkep dolgusu. Secim isareti bu katmanin
 * ustune, kenarlikla ayni yerde duruyor; cam kalkmiyor, ustune bir ton daha
 * biniyor.
 */
export function ChoiceCard({
  option,
  selected,
  onPress,
  multiple,
  blocked = false,
  blockedHint,
}: ChoiceCardProps) {
  const { colors, radius, scheme, spacing } = useTheme();
  const liquid = useScreenGlassEnabled() && resolveGlassMode() === 'liquid';
  const hint = blocked ? blockedHint : option.hint;

  // Kenarlik farki ic boslukla telafi ediliyor: 1 + 17 = 2 + 16.
  const border = selected ? 2 : 1;
  const pad = selected ? 0 : 1;

  return (
    <Pressable
      // Tek secimli listede "onay kutusu" yanlis: ekran okuyucu kullanicisina
      // birden fazla secebilecegini soyler. Rol listenin turunden geliyor.
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={option.label}
      {...(hint ? { accessibilityHint: hint } : {})}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          borderWidth: border,
          borderColor: selected || pressed ? colors.clay : withAlpha(colors.ink, 0.22),
          borderRadius: radius.md,
          borderCurve: 'continuous',
          paddingVertical: spacing.lg + pad,
          paddingHorizontal: spacing.lg + pad,
          marginBottom: spacing.md,
          opacity: blocked ? 0.45 : 1,
          // Cam kipte kabin kendi dolgusu yok; katman kartin alaninin disina
          // tasarsa yuvarlak kenari dorde dondururdu.
          overflow: 'hidden',
        },
        // Cam kipte ekstra bir dolgu materyalin uzerine biniyor ve onu taklit
        // eden bir katmana donduruyor; "Simdilik gec" ile ayni kural.
        liquid ? null : { backgroundColor: withAlpha(colors.ink, pressed ? 0.16 : 0.08) },
      ]}
    >
      {liquid ? (
        <GlassView
          testID="glass-choice-card"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          glassEffectStyle="regular"
          isInteractive
          colorScheme={scheme}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
        />
      ) : null}

      {selected ? (
        <View
          testID="choice-card-selected-tint"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.clayTint }]}
        />
      ) : null}

      <View style={{ flex: 1 }}>
        <AppText variant="control">{option.label}</AppText>
        {option.hint ? (
          <AppText variant="caption" tone="inkSoft" style={{ marginTop: 2 }}>
            {option.hint}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
