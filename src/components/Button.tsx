import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { resolveGlassMode } from './glassMode';
import { useScreenGlassEnabled } from './glassScreenContext';

type ButtonVariant = 'primary' | 'ghost';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

/**
 * Birincil eylemin en az bu kadar yuksek olmasi gerekiyor.
 *
 * Asgari dokunma hedefi 48; buton ondan belirgin sekilde buyuk cunku ekrandaki
 * tek birincil eylem o ve gozun once ona takilmasi isteniyor. Yukseklik ic
 * boslukla birlikte veriliyor: sistem yazisi buyudugunde ic bosluk butonu
 * kendiliginden buyutuyor, taban ise kucuk yazida butonun cilizlasmasini
 * engelliyor.
 */
const MIN_HEIGHT = 56;

/**
 * Dort durum gorsel olarak ayri: durur, basili, yukleniyor, devre disi.
 * Dokunulmus bir buton dokunulmus gorunmeli; bu yuzden basili durumda hem
 * saydamlik hem de bir piksellik cokme var.
 *
 * Yukleniyor durumunda etiket yerinde kaliyor ve gorunmez oluyor: etiketi
 * spinner ile degistirmek butonun genisligini oynatiyor ve dokunma hedefi
 * parmagin altinda kayiyor.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors, radius, scheme, spacing, shadows } = useTheme();
  const glassScreenEnabled = useScreenGlassEnabled();
  const inactive = disabled || loading;

  // Birincil eylem kizil kaliyor: marka rengi kimligin tasiyicisi ve cama
  // cevrilirse ekranda tutunacak tek renk kalmiyor. Cam yalnizca ikincil
  // eylemde.
  //
  // Devre disi hal disarida cunku o hali anlatan sey butun butonun solmasi ve
  // solan bir kapta sistem materyali de soluyor -- cam, yarim uygulanmis bir
  // efekte donuyor. Orada bugunku kenarlikli cizim, solmasiyla birlikte
  // oldugu gibi kaliyor.
  const glassGhost =
    variant === 'ghost' && !disabled && glassScreenEnabled && resolveGlassMode() === 'liquid';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: radius.full,
          minHeight: MIN_HEIGHT,
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: disabled ? 0.45 : 1,
          transform: [{ translateY: pressed && !inactive ? 1 : 0 }],
        },
        variant === 'primary' && !inactive ? { boxShadow: shadows.soft } : null,
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {variant === 'primary' ? (
            <LinearGradient
              colors={[pressed ? colors.clayDeep : colors.clay, colors.clayDeep]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : glassGhost ? (
            <GlassView
              testID="glass-ghost"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              glassEffectStyle="regular"
              // Basili hal icin ayri bir solma yok: dokunusa tepki veren sivi
              // deformasyonu materyalin kendisi tasiyor ve ustune eklenen bir
              // saydamlik animasyonu onun uzerine binen ikinci bir hareket
              // olurdu. Yuklenirken kapaniyor: dokunusu kabul etmeyen bir
              // butonun dokununca deforme olmasi, olmayan bir tepkiyi vaat
              // ediyor.
              isInteractive={!inactive}
              colorScheme={scheme}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
            />
          ) : (
            <View
              testID="ghost-edge"
              style={[
                StyleSheet.absoluteFill,
                {
                  // Kil payi bir cizgi, kizil zeminli bir ekranda ikincil
                  // eylemi neredeyse gorunmez birakiyordu; kenarlik artik
                  // metnin kendi renginden turuyor ve ayni ailede kaliyor.
                  // Perdeler kalkinca dugme dogrudan gorselin uzerinde
                  // kaliyor; %28 zeminle 2,18:1 veriyordu, %40 3,41:1'e
                  // cikariyor ve WCAG'nin dokunma hedefi esigini geciyor.
                  borderWidth: 1,
                  borderColor: pressed ? colors.clay : withAlpha(colors.ink, 0.4),
                  borderRadius: radius.full,
                  borderCurve: 'continuous',
                },
              ]}
            />
          )}

          <View
            style={{
              // Bir punto fazlasi bilincli: olcek adimlari 16 ve 24, ikisi de
              // bu yukseklikte ya sikisik ya da gevsek duruyor.
              paddingVertical: spacing.lg + 2,
              paddingHorizontal: spacing.xl,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText
              variant="button"
              tone={variant === 'primary' ? 'onClay' : 'ink'}
              style={{ opacity: loading ? 0 : 1 }}
              numberOfLines={1}
            >
              {title}
            </AppText>

            {loading ? (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <ActivityIndicator
                  color={variant === 'primary' ? colors.onClay : colors.ink}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}
