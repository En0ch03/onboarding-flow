import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { EyeIcon } from './EyeIcon';

/** Gorunurluk anahtarinin dokunma hedefi. Platformlarin asgarisi. */
const TOGGLE_SIZE = 44;

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Alanin altinda gorunen hata; varsa ekran okuyucuya duyurulur. */
  error?: string | undefined;
  /** Sifre alanlarinda gorunurluk anahtari. */
  secure?: boolean;
};

/**
 * Etiket, girdi, alan alti hata.
 *
 * Hata alanin altinda duruyor cunku kullanicinin bakisi zaten oradan geciyor;
 * formun tepesindeki bir liste, hangi alanin kastedildigini aramaya birakiyor.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, secure = false, ...inputProps },
  ref,
) {
  const { colors, radius, spacing, type } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.clay : colors.hairline;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.sm }}>
        {label}
      </AppText>

      <View style={{ justifyContent: 'center' }}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.inkSoft}
          secureTextEntry={secure && !revealed}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
          style={{
            ...type.control,
            color: colors.ink,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor,
            borderRadius: radius.md,
            borderCurve: 'continuous',
            paddingVertical: spacing.lg,
            paddingLeft: spacing.lg,
            // Sifre alaninda metin, anahtarin ve ayirici cizginin altina
            // girmiyor: imlec goz ikonunun arkasinda kaybolmamali.
            paddingRight: secure ? TOGGLE_SIZE + spacing.lg : spacing.lg,
          }}
        />

        {secure ? (
          <View
            style={{
              position: 'absolute',
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Ayirici cizgi uclarinda soluyor: sert biten bir cizgi, alanin
                icine cizilmis ikinci bir kenarlik gibi duruyor. Uclar
                `transparent` degil alanin kendi zemini: saydam uc Android'de
                griye caliyor. */}
            <LinearGradient
              colors={[colors.surface, colors.hairline, colors.surface]}
              style={{ width: 1, height: spacing.xl }}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: revealed }}
              accessibilityLabel={revealed ? strings.auth.hidePassword : strings.auth.showPassword}
              onPress={() => setRevealed((current) => !current)}
              style={({ pressed }) => ({
                width: TOGGLE_SIZE,
                height: TOGGLE_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {/* Sifre tekrari alani yerine gorunurluk anahtari: yaziyi iki kez
                  yazdirmadan ayni yazim hatasini yakaliyor. */}
              <EyeIcon
                open={revealed}
                color={revealed ? colors.clay : colors.inkSoft}
                background={colors.surface}
              />
            </Pressable>
          </View>
        ) : null}
      </View>

      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.sm }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
});
