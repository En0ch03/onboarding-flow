import { GlassView } from 'expo-glass-effect';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { resolveGlassMode } from './glassMode';

/** Bu mesafenin altinda birakilan bir surukleme, sayfayi kapatmiyor. */
const DISMISS_DISTANCE = 96;

type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /**
   * Sayfa ekrandan tamamen kalktiginda cagriliyor.
   *
   * Native bir secici -- kamera, galeri, izin diyalogu -- ancak burada
   * acilabilir. Gorunurlugu kaldirmak yetmiyor: kapanis animasyonu boyunca
   * `Modal` ayakta kaliyor ve onun ustune sunulan denetleyici, `Modal`
   * kapaninca altindan cekiliyor. Ekranda hicbir sey acilmiyor, dokunuslar
   * bir yere gitmiyor.
   */
  onClosed?: (() => void) | undefined;
  children: ReactNode;
};

/**
 * Alttan acilan sayfa.
 *
 * Dosya iki yuz satir sinirinin biraz uzerinde ve bilerek bolunmedi: perde,
 * yuzey, surukleme ve yasam dongusu tek bir hareketin parcalari. Ayri
 * dosyalara bolmek dort dosyayi ayni anda okumayi gerektirirdi.
 *
 * `Modal`'in kendi `animationType="slide"` degeri perdeyi de sayfayla birlikte
 * kaydiriyor; o zaman arka plan bir anda kararmiyor, asagidan yukari doğru
 * boyaniyor. Perde ve sayfa burada ayri hareket ediyor: perde soluyor, sayfa
 * kayiyor. Modern uygulamalarin hepsinde bu ikisi ayri.
 *
 * Kapanis uc yoldan: perdeye dokunmak, sayfayi asagi surukleyip birakmak, ve
 * Android'de donanimsal geri tusu. Tek bir cikis yolu birakmak, kullaniciyi
 * aradigi jesti denemeye zorluyor.
 *
 * Hareket `Animated` ile yaziliyor, ek bir kutuphaneyle degil: iki ozellik
 * (saydamlik ve dikey kayma) icin yerel surucu zaten yeterli.
 */
export function BottomSheet({ visible, title, onClose, onClosed, children }: BottomSheetProps) {
  const { colors, radius, scheme, spacing, screenPadding, motion } = useTheme();
  const insets = useSafeAreaInsets();
  // Sayfa yuzeyi cam kipte sistemin materyaliyle, yedeklerde bugunku opak
  // yuzeyle ciziliyor. Perde cam degil: karartmasi gereken sey arkadaki ekran
  // ve saydam bir perde o isi yapmaz.
  const liquid = resolveGlassMode() === 'liquid';
  const { height } = useWindowDimensions();

  // Kapanis animasyonunun gorunebilmesi icin `Modal` bir sure daha ayakta
  // kaliyor: gorunurluk bittiginde hemen sokulurse sayfa kaybolur, kaymaz.
  const [mounted, setMounted] = useState(visible);

  // Acilirken sayfa hemen takiliyor; kapanirken animasyon bitene kadar
  // kaliyor. Cizim sirasinda duzeltmek, bir kare gecikmeden once dogru
  // duruma gecmenin desteklenen yolu.
  if (visible && !mounted) setMounted(true);
  // Baslangic degeri bir kez uretiliyor; her cizimde yeni bir deger kurmak
  // animasyonu bastan basltirdi.
  const [progress] = useState(() => new Animated.Value(0));
  const [drag] = useState(() => new Animated.Value(0));

  // Cagri her cizimde tazeleniyor ama asagidaki efektin bagimliligi degil.
  // Bagimlilik olsaydi satir ici yazilmis bir fonksiyon her cizimde kimlik
  // degistirir, efekt yeniden koser ve animasyon bastan baslardi.
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });

  // Haber, `Modal` sokuldukten **sonra** veriliyor. Animasyonun bitis geri
  // cagrisinda vermek, React henuz `Modal`i sokmeden native bir secici acmak
  // olurdu -- yani duzeltilmek istenen seyin ta kendisi.
  const wasMounted = useRef(false);
  useEffect(() => {
    if (mounted) {
      wasMounted.current = true;
      return;
    }

    // Hic acilmamis bir sayfa kapanmis sayilmiyor: ilk cizimde `mounted`
    // zaten false ve buradan haber gitmemeli.
    if (!wasMounted.current) return;
    wasMounted.current = false;
    onClosedRef.current?.();
  }, [mounted]);

  useEffect(() => {
    // Yarida kesilmis bir kapanistan kalan kayma yeni acilisa tasinmiyor:
    // tasinsaydi sayfa dinlenme yerinin altinda acilir ve orada kalirdi.
    if (visible) drag.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? motion.base : motion.fast,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        drag.setValue(0);
      }
    });

    return () => animation.stop();
  }, [visible, progress, drag, motion]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Yalnizca asagi dogru ve belirgin bir hareket sayfayi tutuyor; kucuk
        // dokunuslar listeye gitmeye devam ediyor.
        // Asagi dogru ve dikeye yakin bir hareket sayfayi tutuyor. Yatay
        // sapan bir kaydirmayi da yakalamak, sayfayi yanlislikla kapatiyor.
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) drag.setValue(gesture.dy);
        },
        // Hareket disaridan sonlandirilirsa (sistem jesti, sayfanin
        // kapanmasi) `Release` hic gelmiyor ve kayma oldugu yerde donuyor.
        onPanResponderTerminate: () => {
          Animated.timing(drag, {
            toValue: 0,
            duration: motion.fast,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        },
        onPanResponderRelease: (_event, gesture) => {
          // Uzun bir surukleme de, kisa ama hizli bir savurma da kapatiyor;
          // ikincisi olmadan sayfa agir hissediliyor.
          if (gesture.dy > DISMISS_DISTANCE || gesture.vy > 0.8) {
            onClose();
            return;
          }
          Animated.timing(drag, {
            toValue: 0,
            duration: motion.fast,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        },
      }),
    [drag, motion, onClose],
  );

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.scrim,
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
          }}
          // Kapanis suresince perde gorunmez ama hala dokunuslari yutuyordu;
          // arkadaki ekrana yapilan dokunus ikinci bir kapanis cagiriyordu.
          pointerEvents={visible ? 'auto' : 'none'}
        >
          {/* Perdenin etiketi sayfanin basligi degil yaptigi is: dokununca
              sayfa kapaniyor ve ekran okuyucu bunu duymali. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.common.close}
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.View
          style={{
            // Cam kipte yuzeyin kendi rengi yok: opak bir dolgu materyali
            // tamamen ortuyordu. Kayma `transform` ile, `opacity` ile degil --
            // solan bir kapta cam yuzey de soluyor ve sistem materyali yarim
            // uygulanmis gibi gorunuyor.
            backgroundColor: liquid ? 'transparent' : colors.surfaceRaised,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            borderCurve: 'continuous',
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            maxHeight: height * 0.62,
            transform: [
              {
                translateY: Animated.add(
                  progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.62, 0] }),
                  drag,
                ),
              },
            ],
          }}
        >
          {liquid ? (
            <GlassView
              testID="glass-sheet"
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              glassEffectStyle="regular"
              // Sayfa suruklenen bir yuzey ama dokunusu tutan sey tutamak
              // bolgesindeki hareket dinleyicisi; materyalin kendi dokunma
              // deformasyonu burada ikinci bir tepki olurdu.
              colorScheme={scheme}
              // Yerel katman kabin yaricapini gormuyor, kendi kosesini okuyor:
              // verilmezse cam dort koseli kalir ve sayfanin yuvarlak ust
              // kenarinin ustunde bir dikdortgen olarak durur.
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                  borderCurve: 'continuous',
                },
              ]}
            />
          ) : null}

          {/* Surukleme yalnizca bu baslik bolgesinden tutuluyor. Sayfanin
              tamamina baglansaydi icerideki listenin asagi kaydirilmasi
              sayfayi kapatmaya calisirdi. */}
          <View {...pan.panHandlers}>
            {/* Tutamac, sayfanin suruklenebilir oldugunu soyleyen tek isaret. */}
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: radius.full,
                  backgroundColor: colors.hairline,
                }}
              />
            </View>

            <AppText
              variant="heading"
              accessibilityRole="header"
              style={{
                paddingHorizontal: screenPadding,
                paddingTop: spacing.lg,
                paddingBottom: spacing.md,
              }}
            >
              {title}
            </AppText>
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
