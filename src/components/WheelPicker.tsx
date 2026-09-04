import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';

export const WHEEL_ROWS = 5;

/**
 * Satir yuksekligi sistem yazi tipi olcegini takip ediyor. Sabit birakilirsa
 * olcegi buyutmus kullanicida metin satira sigmiyor ve carkin ortasindaki
 * secili deger kirpiliyor. Ust sinir var: 2x olcekte cark ekrani yutuyor.
 */
export function wheelRowHeight(fontScale: number): number {
  return Math.round(44 * Math.min(Math.max(fontScale, 1), 1.6));
}

export type WheelItem = { value: number; label: string };

type WheelPickerProps = {
  items: WheelItem[];
  value: number;
  onChange: (value: number) => void;
  /** Ekran okuyucuya carkin ne sectigini soyler. */
  accessibilityLabel: string;
  fontScale: number;
  /** Uclarin solacagi zemin. Bilesen icinde bulunduğu yuzeyi tahmin etmiyor. */
  background: string;
  /** Uc cark yan yana dururken genislik dagilimi cagirana ait. */
  flex?: number;
};

/**
 * Kaydirilan secim carki.
 *
 * Klavye acmadan sayi secmenin yolu. Hazir bir tarih secici yerine kendi
 * carkimiz var cunku iki platformun yerel sunumu birbirini tutmuyor: iOS
 * doner bir cark veriyor, Android takvim penceresi. Ayni akista iki farkli
 * jest ogretmek yerine tek bir sunum var ve iki platformda da ayni.
 *
 * Sunulmayan bir deger secilemiyor. Gun listesi ayin uzunlugu kadar oldugu
 * icin "31 Subat" yazmanin bir yolu yok; dogrulama hala sinirda duruyor ama
 * arayuz o hataya hic firsat vermiyor.
 */
export function WheelPicker({
  items,
  value,
  onChange,
  accessibilityLabel,
  fontScale,
  background,
  flex = 1,
}: WheelPickerProps) {
  const { colors, radius, spacing } = useTheme();
  const scroller = useRef<ScrollView>(null);
  // Kullanici parmagini carkin uzerindeyken disaridan kaydirmak, hareketi
  // ortasinda kesip zipratiyor. Bu bayrak o cakismayi engelliyor.
  const dragging = useRef(false);

  const rowHeight = wheelRowHeight(fontScale);
  const height = rowHeight * WHEEL_ROWS;
  const padding = rowHeight * ((WHEEL_ROWS - 1) / 2);

  const index = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  const scrollToIndex = useCallback(
    (target: number, animated: boolean) => {
      scroller.current?.scrollTo({ y: target * rowHeight, animated });
    },
    [rowHeight],
  );

  useEffect(() => {
    if (!dragging.current) scrollToIndex(index, false);
  }, [index, scrollToIndex]);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false;
    const row = Math.round(event.nativeEvent.contentOffset.y / rowHeight);
    const item = items[Math.min(Math.max(row, 0), items.length - 1)];
    if (item && item.value !== value) onChange(item.value);
  };

  const step = (direction: 1 | -1) => {
    const item = items[Math.min(Math.max(index + direction, 0), items.length - 1)];
    if (item && item.value !== value) onChange(item.value);
  };

  return (
    <View style={{ flex, height }}>
      {/* Secili satirin seridi carkin altinda duruyor: hangi satirin gecerli
          oldugunu soyleyen tek isaret bu. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: padding,
          height: rowHeight,
          borderRadius: radius.sm,
          borderCurve: 'continuous',
          backgroundColor: colors.clayTint,
        }}
      />

      <ScrollView
        ref={scroller}
        // Ekran okuyucuda cark kaydirilamaz; artir/azalt jesti tek erisim yolu.
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: items[index]?.label }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          step(event.nativeEvent.actionName === 'increment' ? -1 : 1)
        }
        showsVerticalScrollIndicator={false}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: padding }}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        // Parmak durarak birakildiginda momentum olayi hic gelmiyor; deger o
        // durumda burada kesinlesiyor.
        onScrollEndDrag={settle}
        onMomentumScrollEnd={settle}
        onLayout={() => scrollToIndex(index, false)}
      >
        {items.map((item, row) => (
          <Pressable
            key={item.value}
            // Dokunarak secmek carki cevirmekten hizli ve titrek elde daha
            // guvenilir. Kaydirma tek yol degil.
            onPress={() => scrollToIndex(row, true)}
            style={{ height: rowHeight, justifyContent: 'center', alignItems: 'center' }}
          >
            <AppText
              variant="control"
              tone={row === index ? 'ink' : 'inkSoft'}
              numberOfLines={1}
              style={{ paddingHorizontal: spacing.xs }}
            >
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Ust ve alt uclar soluyor: cark, kirpilmis bir liste degil donen bir
          yuzey gibi okunuyor. */}
      <WheelFade height={padding} colors={[background, withAlpha(background, 0)]} edge="top" />
      <WheelFade height={padding} colors={[withAlpha(background, 0), background]} edge="bottom" />
    </View>
  );
}

function WheelFade({
  height,
  colors,
  edge,
}: {
  height: number;
  colors: [string, string];
  edge: 'top' | 'bottom';
}) {
  return (
    <LinearGradient
      colors={colors}
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, height, [edge]: 0 }}
    />
  );
}
