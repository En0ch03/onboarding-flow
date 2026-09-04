import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

/** Bu mesafenin altinda birakilan bir surukleme, sayfayi kapatmiyor. */
const DISMISS_DISTANCE = 96;

type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
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
export function BottomSheet({ visible, title, onClose, children }: BottomSheetProps) {
  const { colors, radius, spacing, screenPadding, motion } = useTheme();
  const insets = useSafeAreaInsets();
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
            backgroundColor: '#000000',
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
            backgroundColor: colors.surfaceRaised,
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
