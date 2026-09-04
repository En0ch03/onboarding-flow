import { useState } from 'react';
import { Image, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme';

const SIZE = 88;

/**
 * Kapak fotografi, yoksa adin ilk harfi.
 *
 * Once burada soyut bir amblem vardi ve kullanicinin kendisiyle hicbir ilgisi
 * yoktu. Kapanis ekraninin isi kullaniciya ne kurdugunu gostermek;
 * gosterilecek en dogru sey profilinin yuzu.
 *
 * Ekran okuyucudan gizli: tasidigi bilginin tamami (ad) iki satir asagida
 * zaten okunuyor ve ciplak bir "D" harfi orada yalnizca gurultu olurdu.
 */
export function ProfileMark({ name, cover }: { name: string; cover?: string | undefined }) {
  const { colors, radius } = useTheme();
  // Medya sunucuda yasiyor ve taslak diskte; sunucu yeniden baslatildiginda
  // kayitli bir adres 404 doner. Hata yakalanmazsa geriye ne fotograf ne harf
  // kalir, yalnizca bos bir daire.
  const [broken, setBroken] = useState(false);

  const shape = {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    overflow: 'hidden' as const,
    backgroundColor: colors.clay,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (cover && !broken) {
    return (
      <View
        style={shape}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={{ uri: cover }}
          onError={() => setBroken(true)}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  }

  // `slice` cok kodlu bir harfte yarim karakter uretir; `Array.from` tam
  // harfi veriyor.
  const first = Array.from(name.trim())[0] ?? '';

  return (
    <View style={shape} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <AppText variant="title" tone="onClay" style={{ lineHeight: 40 }}>
        {first === 'i' ? 'İ' : first.toLocaleUpperCase('tr-TR')}
      </AppText>
    </View>
  );
}
