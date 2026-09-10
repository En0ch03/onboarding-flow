import { GlassContainer, GlassView } from 'expo-glass-effect';
import { Pressable, StyleSheet, View } from 'react-native';

import { stepCounter, stepCounterLabel, strings } from '@/constants/strings';
import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { resolveGlassMode } from './glassMode';

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
 * Okun tepeden tirnaga yuksekligi.
 *
 * Ok bir metin glifi degil, cizilmis bir sekil: glif ailenin kesimine gore
 * inceliyor, dikeyde satir yuksekligiyle kayiyor ve yazi tipi yuklenemezse
 * bambaska bir karaktere donusuyordu. Cizim yazi tipinden bagimsiz.
 */
const CHEVRON_HEIGHT = 22;

/**
 * Kolun uzunlugu. Kare kirk bes derece dondurulunce iki kenari bir "<"
 * olusturuyor ve o seklin yuksekligi kenarin koseden koseye izdusumu kadar
 * cikiyor; istenen yuksekligi kenara cevirmenin yolu bu.
 */
const CHEVRON_ARM = CHEVRON_HEIGHT / Math.SQRT2;

/** Dokunma hedefinin platform asgarisi. */
const SKIP_MIN_HEIGHT = 44;

/**
 * Ekranlarin ust seridi. Uc yuvasi var ve bos yuvalar yer tutuyor: baslik
 * her ekranda ayni yukseklikte basliyor, ekrandan ekrana zipliyor gibi
 * gorunmuyor.
 *
 * Cam kipte geri dairesi ve gecme kapsulu ayni grubun icinde duruyor: ikisi
 * seridin iki ucunda ve birlikte hareket ediyor, ayri gruplarda olsalardi
 * sistem onlari birbirinden habersiz iki yuzey gibi cizerdi. Sayac grubun
 * icinde ama cam degil -- okunmasi gereken bir metin, dokunulacak bir hedef
 * degil.
 */
export function ScreenHeader({ onBack, step, skip }: ScreenHeaderProps) {
  const { colors, radius, scheme, spacing } = useTheme();
  const liquid = resolveGlassMode() === 'liquid';

  const rowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: BACK_SIZE,
    marginBottom: spacing.xl,
  } as const;

  const content = (
    <>
      <View style={{ width: BACK_SIZE, alignItems: 'flex-start' }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.common.back}
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              {
                width: BACK_SIZE,
                height: BACK_SIZE,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
              },
              // Cam kipte dugmenin dolgusu ve kenarligi yok: ikisi de
              // materyalin uzerine binen opak katmanlar ve basili hali de
              // sistemin kendi deformasyonu tasiyor.
              liquid
                ? null
                : {
                    borderWidth: 1,
                    borderColor: pressed ? colors.clay : colors.hairline,
                    backgroundColor: colors.surface,
                  },
            ]}
          >
            {liquid ? (
              <GlassView
                testID="glass-back"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                glassEffectStyle="regular"
                // Basili hal icin ayri bir solma yok: dokunusa tepki veren
                // sivi deformasyon materyalin kendi davranisi ve onu acan sey
                // bu bayrak. Ustune eklenen bir saydamlik animasyonu, camin
                // uyum davranisini bozan ikinci bir hareket olurdu.
                isInteractive
                colorScheme={scheme}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
              />
            ) : null}

            {/* Isaret dugmeyle birlikte buyumuyor: buyuyen sey hedef, cizim
                degil. */}
            <View
              testID="back-chevron"
              style={{
                width: CHEVRON_ARM,
                height: CHEVRON_ARM,
                borderLeftWidth: 2,
                borderBottomWidth: 2,
                borderColor: colors.ink,
                transform: [{ rotate: '45deg' }],
                // Dondurulen sekil kendi kutusunun sagina yasliyor; daireye
                // gore ortalamak icin geri cekiliyor.
                marginLeft: 4,
              }}
            />
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
          // Atlama gorunur bir hedef: alti cizili kucuk bir baglanti cihazda
          // hem zor okunuyor hem zor dokunuluyordu. Hedefi gorunmez bir
          // `hitSlop`a birakmak yerine kapsulun kendisi asgariyi karsiliyor;
          // kullanici gordugu seye nisan aliyor.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={skip.label}
            onPress={skip.onPress}
            hitSlop={8}
            style={({ pressed }) => [
              {
                minHeight: SKIP_MIN_HEIGHT,
                justifyContent: 'center',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
              },
              liquid ? null : { backgroundColor: withAlpha(colors.ink, pressed ? 0.16 : 0.08) },
            ]}
          >
            {liquid ? (
              <GlassView
                testID="glass-skip"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                glassEffectStyle="regular"
                isInteractive
                colorScheme={scheme}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
              />
            ) : null}

            <AppText variant="button" tone="ink">
              {skip.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  // Grup yalnizca cam kipte var: yedek kiplerde bos bir sarmalayici, seridin
  // olcusunu degistirmeden agaci derinlestirmekten baska bir sey yapmaz.
  return liquid ? (
    // Mesafe, iki yuzeyin birbirini etkilemeye basladigi uzaklik. Serit
    // olcusunde en kucuk aralik yeterli: daha buyugu, ekranin iki ucundaki
    // dugmelerin birbirine dogru akmasina yol aciyor.
    <GlassContainer spacing={spacing.sm} style={rowStyle}>
      {content}
    </GlassContainer>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
}
