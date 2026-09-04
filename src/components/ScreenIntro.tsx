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
 * Bu ikili dokuz ekranda tekrar ediyordu ve her birinde araliklar elle
 * yazilmisti: baslikla aciklama arasi bir ekranda sekiz, digerinde yirmi
 * dort, ucuncusunde on iki birimdi. Tek tek bakildiginda hicbiri yanlis
 * gorunmuyor; arka arkaya gezildiginde ekranlar akraba hissetmiyor.
 *
 * Ritim artik tek yerde. Bir ekranin farkli durmasi gerekiyorsa bu bileseni
 * kullanmiyor - fark bir unutkanlik degil bir tercih oluyor.
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
