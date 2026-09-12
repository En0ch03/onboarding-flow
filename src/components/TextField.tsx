import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useId, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { EyeIcon } from './EyeIcon';
import { resolveGlassMode } from './glassMode';
import { useScreenGlassEnabled } from './glassScreenContext';

/**
 * Gorunurluk anahtarinin dokunma hedefi. iOS'un asgarisi 44, Android'in 48;
 * ustteki degeri alip alanin kendi yuksekligiyle birlikte buyuyecek sekilde
 * kurmak yerine sabit tutuldu, cunku hedef alandan buyurse Android tasan
 * dokunuslari iletmiyor ve anahtar sessizce oluyor. Alanin yuksekligi bugun
 * yaklasik 55; `paddingVertical` kucultulurse bu bag yeniden olculmeli.
 */
const TOGGLE_SIZE = 48;

/** Klavyeyi kapatan dugmenin dokunma hedefi; iOS'un asgarisi. */
const DISMISS_MIN_HEIGHT = 44;

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Alanin altinda gorunen hata; varsa ekran okuyucuya duyurulur. */
  error?: string | undefined;
  /** Sifre alanlarinda gorunurluk anahtari. */
  secure?: boolean;
  /**
   * Alanin solunda sabit duran, yazilamayan parca -- ulke kodu gibi.
   *
   * Genisligi olculuyor, sabit yazilmiyor: sistem yazi tipi buyudugunde sabit
   * bir bosluk metnin onekle cakismasina yol acardi.
   */
  prefix?: string | undefined;
  /**
   * Klavyenin ustune klavyeyi kapatan bir serit koyar.
   *
   * Sayisal klavyenin kendi bitirme tusu yok; onsuz kullanicinin klavyeden
   * cikmak icin ekranin bos bir yerine dokunmayi bilmesi gerekiyor. Yalnizca
   * iOS'ta ciziliyor: Android'in sayisal klavyesi bu tusu kendisi tasiyor ve
   * ikinci bir serit yalnizca yer kaplardi.
   */
  dismissAccessory?: boolean;
  /**
   * Alanin zemini.
   *
   * `solid` kendi zeminini getiriyor: kartsiz ekranlarda yazilan metnin
   * kontrasti arka plan gorseline degil bu zemine dayaniyor. `glass` ise
   * saydam bir kartin icinde duran alanlar icin -- opak alanlar kartin icini
   * kaplayinca camin gosterecek bir seyi kalmiyor ve kart dolu bir panele
   * donuyor. Kontrasti orada kartin kendi materyali tasiyor. `field` ise
   * kartsiz ekranlarda alanin **kendisinin** cam yuzey oldugu durum: etrafina
   * kart sarilmiyor, "Simdilik gec" kapsuluyle ayni receteyi alanin kendisi
   * tasiyor.
   */
  surface?: FieldSurface;
};

export type FieldSurface = 'solid' | 'glass' | 'field';

/**
 * Alan zemininin opakligi.
 *
 * `solid` neredeyse opak: altindaki gorsel yalnizca hafifce yasiyor. `glass`
 * kartin yuzeyinden ayrisacak kadar koyu: dusuk degerde alanin kenarligi
 * kartin kendi zemininden ayrismiyor ve alan kartla kaynasip kayboluyordu.
 * `field` burada yok cunku o kendi dolgusunu tasimiyor -- cam kipte sistemin
 * materyali, yedek kipte "Simdilik gec" ile ayni murekkep dolgusu.
 */
const FIELD_FILL = { solid: 0.92, glass: 0.5 } as const;

/**
 * Cam yuzeyde kenarligin opakligi.
 *
 * Alanin nerede bittigini soyleyen tek sey kenarlik: zemin saydamlasinca
 * `hairline` tonu kartin kendi kenar isiginin altinda kayboluyordu. `field`
 * de ayni kenarligi kullaniyor: cam kipte bu kenarlik materyalin bir taklidi
 * degil, odak ve hata durumunun tasiyicisi -- ikisi de karttaki alanlarla
 * ayni kanaldan konusuyor.
 *
 * Disa aciliyor: dogum tarihi alani (`BirthDateField.tsx`) bir `TextInput`
 * degil ama ayni kartsiz baglamda ayni cam receteyi kullaniyor ve ayni
 * kenarlik degerini paylasmali -- iki komsu alan farkli kalinlikta kenarlikla
 * durmasin.
 */
export const GLASS_BORDER = 0.18;

/**
 * Etiket, girdi, alan alti hata.
 *
 * Hata alanin altinda duruyor cunku kullanicinin bakisi zaten oradan geciyor;
 * formun tepesindeki bir liste, hangi alanin kastedildigini aramaya birakiyor.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    secure = false,
    prefix,
    dismissAccessory = false,
    surface = 'solid',
    ...inputProps
  },
  ref,
) {
  const { colors, radius, scheme, spacing, type } = useTheme();
  // Kimlik alan basina benzersiz: ayni ekranda iki serit olursa klavye
  // hangisini cizecegini kimlikten okuyor.
  const accessoryId = useId();
  const showAccessory = dismissAccessory && Platform.OS === 'ios';
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [prefixWidth, setPrefixWidth] = useState(0);

  // `field` yalnizca ekran cami actiysa ve sistemin gercek cam materyali
  // varsa kendi katmanini aciyor; aksi halde asagidaki yedek dolguya duser.
  const screenGlassEnabled = useScreenGlassEnabled();
  const liquidField = surface === 'field' && screenGlassEnabled && resolveGlassMode() === 'liquid';

  // Dinginlikteki kenarlik yuzeye gore degisiyor; hata ve odak renkleri
  // degismiyor: ikisi de bir durumu soyluyor ve o durum yuzeye bagli degil.
  const restingBorder = surface === 'solid' ? colors.hairline : withAlpha(colors.ink, GLASS_BORDER);
  const borderColor = error ? colors.danger : focused ? colors.clay : restingBorder;
  // Alan zemini tam opak degil: arka plan gorseli formun altinda hafifce
  // yasamaya devam ediyor, ama yazilan metnin kontrasti gorsele degil bu
  // zemine gore olculuyor. `field` ayri: kendi dolgusu yok, cam kipte
  // materyal gosteriyor, yedek kipte "Simdilik gec" ile ayni murekkep dolgusu.
  const fieldBackground =
    surface === 'field'
      ? liquidField
        ? 'transparent'
        : withAlpha(colors.ink, 0.08)
      : withAlpha(colors.surface, FIELD_FILL[surface]);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.sm }}>
        {label}
      </AppText>

      <View
        style={[
          { justifyContent: 'center' },
          // Katman alanin disina tasarsa yuvarlak kenari dorde donduruyor.
          liquidField ? { borderRadius: radius.md, overflow: 'hidden' } : null,
        ]}
      >
        {liquidField ? (
          <GlassView
            testID="glass-field"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            glassEffectStyle="regular"
            isInteractive
            colorScheme={scheme}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <TextInput
          ref={ref}
          placeholderTextColor={colors.inkSoft}
          {...inputProps}
          // Onek gorsel olarak alanin icinde ama ayri bir dugum; ekran
          // okuyucuya alanin adiyla birlikte tek parca halinde veriliyor,
          // yoksa "+90" baglamsiz bir sekilde ayrica okunurdu.
          accessibilityLabel={prefix ? `${label}, ${prefix}` : label}
          // Yayilimdan sonra geliyorlar. Once yazildiklarinda cagiranin kendi
          // `onBlur`'u (form kutuphanesi her alana bir tane veriyor) bunlari
          // eziyordu: odak halkasi bir kez yandiktan sonra hic sonmuyor ve
          // alanlar arasi gecisten sonra iki alan da odakli gorunuyordu.
          secureTextEntry={secure && !revealed}
          {...(showAccessory ? { inputAccessoryViewID: accessoryId } : null)}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={{
            ...type.control,
            color: colors.ink,
            backgroundColor: fieldBackground,
            borderWidth: 1,
            borderColor,
            borderRadius: radius.md,
            borderCurve: 'continuous',
            paddingVertical: spacing.lg,
            paddingLeft: prefix ? spacing.lg + prefixWidth + spacing.sm : spacing.lg,
            // Sifre alaninda metin, anahtarin ve ayirici cizginin altina
            // girmiyor: imlec goz ikonunun arkasinda kaybolmamali.
            paddingRight: secure ? TOGGLE_SIZE + spacing.lg : spacing.lg,
          }}
        />

        {prefix ? (
          <View
            // Dokunuslar alana gidiyor: onek bir hedef degil, alanin
            // yazilamayan bir parcasi.
            pointerEvents="none"
            // Ekran okuyucu bunu ayrica okumuyor; alanin etiketinde zaten var.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={(event) => setPrefixWidth(event.nativeEvent.layout.width)}
            style={{
              position: 'absolute',
              left: spacing.lg,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <AppText variant="control" tone="inkSoft">
              {prefix}
            </AppText>
          </View>
        ) : null}

        {secure ? (
          <View
            style={{
              position: 'absolute',
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Ayirici cizgi uclarinda soluyor: sert biten bir cizgi, alanin
                icine cizilmis ikinci bir kenarlik gibi duruyor. Uclar
                `transparent` degil alanin kendi zemini: saydam uc Android'de
                griye caliyor. */}
            <LinearGradient
              colors={[fieldBackground, colors.hairline, fieldBackground]}
              style={{ width: 1, height: spacing.xl }}
            />

            <Pressable
              accessibilityRole="button"
              // Durum bilgisi etiketin kendisinde: "Sifreyi goster" ve
              // "Sifreyi gizle". Ustune bir `selected` eklemek, ekran
              // okuyucunun "secildi" demesine ve kullanicinin neyin secildigini
              // sormasina yol aciyor.
              // Etiket alanin adiyla birlikte veriliyor: kayit ekraninda iki
              // sifre alani var ve ciplak bir "Sifreyi goster" ekran okuyucuda
              // hangisinin anahtari oldugunu soylemiyor.
              accessibilityLabel={`${label}, ${revealed ? strings.auth.hidePassword : strings.auth.showPassword}`}
              onPress={() => setRevealed((current) => !current)}
              style={({ pressed }) => ({
                width: TOGGLE_SIZE,
                height: TOGGLE_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {/* Anahtar ve dogrulama alani birlikte calisiyor: anahtar
                  yazilani gostermeyi teklif ediyor, dogrulama alani ise
                  bakmayani da durduruyor. Sifre sifirlama yolu olmayan bir
                  urunde yanlis yazilmis bir sifre hesabi kilitliyor; tek
                  basina teklif yeterli degil. */}
              <EyeIcon
                open={revealed}
                color={revealed ? colors.clay : colors.inkSoft}
                background={colors.surface}
              />
            </Pressable>
          </View>
        ) : null}
      </View>

      {showAccessory ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              backgroundColor: colors.surfaceRaised,
              alignItems: 'flex-end',
              paddingHorizontal: spacing.lg,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.common.dismissKeyboard}
              onPress={() => Keyboard.dismiss()}
              style={({ pressed }) => ({
                minHeight: DISMISS_MIN_HEIGHT,
                justifyContent: 'center',
                paddingHorizontal: spacing.sm,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <AppText variant="button" tone="clay">
                {strings.common.dismissKeyboard}
              </AppText>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}

      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.sm }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
});
