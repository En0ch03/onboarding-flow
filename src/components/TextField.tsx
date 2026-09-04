import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

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
            paddingRight: secure ? spacing.xxl + spacing.lg : spacing.lg,
          }}
        />

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? strings.auth.hidePassword : strings.auth.showPassword}
            onPress={() => setRevealed((current) => !current)}
            hitSlop={8}
            style={{
              position: 'absolute',
              right: spacing.sm,
              padding: spacing.sm,
            }}
          >
            {/* Sifre tekrari alani yerine gorunurluk anahtari: yaziyi iki kez
                yazdirmadan ayni yazim hatasini yakaliyor. */}
            <AppText variant="label" tone="inkSoft">
              {revealed ? 'Gizle' : 'Göster'}
            </AppText>
          </Pressable>
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
