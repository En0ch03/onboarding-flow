import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';

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
  const { colors, radius, spacing, shadows } = useTheme();
  const inactive = disabled || loading;

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
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  // Kil payi bir cizgi, kizil zeminli bir ekranda ikincil
                  // eylemi neredeyse gorunmez birakiyordu; kenarlik artik
                  // metnin kendi renginden turuyor ve ayni ailede kaliyor.
                  borderWidth: 1,
                  borderColor: pressed ? colors.clay : withAlpha(colors.ink, 0.28),
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
