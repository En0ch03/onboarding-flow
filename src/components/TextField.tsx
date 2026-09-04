import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { EyeIcon } from './EyeIcon';

/**
 * Gorunurluk anahtarinin dokunma hedefi. iOS'un asgarisi 44, Android'in 48;
 * ustteki degeri alip alanin kendi yuksekligiyle birlikte buyuyecek sekilde
 * kurmak yerine sabit tutuldu, cunku hedef alandan buyurse Android tasan
 * dokunuslari iletmiyor ve anahtar sessizce oluyor. Alanin yuksekligi bugun
 * yaklasik 55; `paddingVertical` kucultulurse bu bag yeniden olculmeli.
 */
const TOGGLE_SIZE = 48;

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
          placeholderTextColor={colors.inkSoft}
          {...inputProps}
          accessibilityLabel={label}
          // Yayilimdan sonra geliyorlar. Once yazildiklarinda cagiranin kendi
          // `onBlur`'u (form kutuphanesi her alana bir tane veriyor) bunlari
          // eziyordu: odak halkasi bir kez yandiktan sonra hic sonmuyor ve
          // alanlar arasi gecisten sonra iki alan da odakli gorunuyordu.
          secureTextEntry={secure && !revealed}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
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
              // Durum bilgisi etiketin kendisinde: "Sifreyi goster" ve
              // "Sifreyi gizle". Ustune bir `selected` eklemek, ekran
              // okuyucunun "secildi" demesine ve kullanicinin neyin secildigini
              // sormasina yol aciyor.
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
