import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useTheme } from '@/theme';

type ProgressBarProps = {
  current: number;
  total: number;
};

/**
 * Orani kendisi hesapliyor: cagiran taraf yuzde gondermek zorunda kalirsa,
 * ayni hesap her ekranda tekrar yazilir ve biri kacinilmaz olarak farkli olur.
 *
 * Dolgu adim degisince kayiyor, ziplamiyor. Iki adim arasindaki bagi kuran
 * sey bu: ziplayan bir cubuk, kullaniciya yeni bir ekran acildigini soyluyor;
 * kayan bir cubuk ayni akista ilerlendigini soyluyor.
 *
 * Hareket `scaleX` uzerinden, genislik uzerinden degil: genislik yerel
 * suruculu calismiyor ve her karede yerlesim hesabi yeniden kosuyor.
 */
export function ProgressBar({ current, total }: ProgressBarProps) {
  const { colors, radius, motion } = useTheme();
  const ratio = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;

  const [fill] = useState(() => new Animated.Value(ratio));

  useEffect(() => {
    Animated.timing(fill, {
      toValue: ratio,
      duration: motion.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fill, ratio, motion]);

  return (
    <View
      // Ekran okuyucudan gizli. Tasidigi bilginin tamamini ust seritteki
      // sayac zaten kelimelerle soyluyor ("bes adimdan iki"); ikisini birden
      // duyurmak ayni cumleyi iki kez okutmak olurdu. Cubuk burada gozun
      // ilerlemeyi bir bakista gormesi icin.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height: 3,
        borderRadius: radius.full,
        backgroundColor: colors.hairline,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius.full,
          backgroundColor: colors.clay,
          // Olcek soldan buyuyor; varsayilan merkez, dolgunun iki uctan
          // birden acilmasi demek olurdu.
          transformOrigin: 'left',
          transform: [{ scaleX: fill }],
        }}
      />
    </View>
  );
}
