import { Text, type TextProps } from 'react-native';

import { useTheme, type TypeVariant } from '@/theme';

/** Metnin rolu; ham renk yerine rol secilir. */
type Tone = 'ink' | 'inkSoft' | 'clay' | 'onClay' | 'success' | 'danger';

type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: Tone;
};

/**
 * Tum metinler bu bilesenden gecer; ekranlar `fontSize` gormez.
 *
 * Renk burada uygulanip olcege gomulmedi: olcek statik, renk varyanta gore
 * degisiyor. Ikisini ayni nesnede birlestirmek olcegi bir cengele bagimli kilardi.
 */
export function AppText({ variant = 'body', tone = 'ink', style, ...rest }: AppTextProps) {
  const { type, colors } = useTheme();

  return <Text style={[type[variant], { color: colors[tone] }, style]} {...rest} />;
}
