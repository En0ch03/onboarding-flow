import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ScreenIntroProps = {
  title: string;
  subtitle: string;
};

/**
 * Ekranin basligi ve altindaki tek satirlik aciklamasi.
 *
 * Bu ikili dort form ekraninda tekrar ediyordu (adim, kayit, giris,
 * tamamlanma) ve her birinde araliklar elle yazilmisti: baslikla aciklama
 * arasi bir ekranda sekiz, digerinde on iki birimdi. Tek tek bakildiginda
 * hicbiri yanlis gorunmuyor; arka arkaya gezildiginde ekranlar akraba
 * hissetmiyor.
 *
 * Karsilama ve varis ekranlari bu bileseni kullanmiyor: onlar `display`
 * olcegiyle kendi ailesini kuruyor. Fark bir unutkanlik degil bir tercih.
 */
export function ScreenIntro({ title, subtitle }: ScreenIntroProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.sm }}>
        {subtitle}
      </AppText>
    </View>
  );
}
