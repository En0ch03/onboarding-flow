import { Pressable, View } from 'react-native';

import { stepCounter, stepCounterLabel, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ScreenHeaderProps = {
  onBack?: () => void;
  /** Adim sayaci; verilmezse orta bosluk bos kalir. */
  step?: { current: number; total: number };
  /** Atlama baglantisi. Gizlenmiyor: gizli bir cikis, olmayan cikistan kotu. */
  skip?: { label: string; onPress: () => void };
};

/**
 * Geri dugmesinin olculeri. Android'in asgarisi 48; iOS'unki 44. Buyugu
 * aliniyor.
 *
 * Dokunma alanini `hitSlop` ile buyutmek yetmiyordu: kullanici gordugu
 * daireye nisan aliyor ve gorunmez bir alani hedefleyemiyor. Basilan sey
 * gorunen sey olmali, o yuzden dairenin kendisi buyudu. Ustundeki kucuk
 * `hitSlop` bir hedef degil kenar payi: nisanin birkac nokta kacmasi
 * dugmeyi kacirmak olmasin.
 */
const BACK_SIZE = 48;

/**
 * Ekranlarin ust seridi. Uc yuvasi var ve bos yuvalar yer tutuyor: baslik
 * her ekranda ayni yukseklikte basliyor, ekrandan ekrana zipliyor gibi
 * gorunmuyor.
 */
export function ScreenHeader({ onBack, step, skip }: ScreenHeaderProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: BACK_SIZE,
        marginBottom: spacing.xl,
      }}
    >
      <View style={{ width: BACK_SIZE, alignItems: 'flex-start' }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.common.back}
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => ({
              width: BACK_SIZE,
              height: BACK_SIZE,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: pressed ? colors.clay : colors.hairline,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            {/* Isaret dugmeyle birlikte buyumuyor: buyuyen sey hedef, cizim
                degil. Kalin bir ok, sade seride agir geliyor. */}
            <AppText variant="control" style={{ lineHeight: 20 }}>
              ‹
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {step ? (
        <AppText
          variant="label"
          tone="inkSoft"
          accessibilityLabel={stepCounterLabel(step.current, step.total)}
        >
          {stepCounter(step.current, step.total)}
        </AppText>
      ) : (
        <View />
      )}

      <View style={{ minWidth: BACK_SIZE, alignItems: 'flex-end' }}>
        {skip ? (
          // Atlama bilerek bir baglanti gibi duruyor: ikincil bir cikis yolu
          // birincil eylem kadar yer kaplamamali. Geri dugmesinin aksine
          // gorunur bir hedefe buyutulmuyor, ama dokunulacak alan asgariyi
          // karsiliyor.
          <Pressable
            accessibilityRole="button"
            onPress={skip.onPress}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <AppText variant="label" tone="inkSoft" style={{ textDecorationLine: 'underline' }}>
              {skip.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
