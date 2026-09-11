import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { strings } from '@/constants/strings';
import { opacitiesAbove } from '@/test/opacitiesAbove';
import { renderWithTheme } from '@/test/renderWithTheme';
import { ThemeProvider } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { GlassPanel } from './GlassPanel';
import { Screen } from './Screen';
import { ScreenHeader } from './ScreenHeader';

/**
 * Olculer elle veriliyor cunku bu test kendi saglayicisini kuruyor: acik tema
 * icin farkli bir `initialScheme` gerekiyor ve ortak yardimci onu almiyor.
 * Olcu verilmezse saglayici olcum bekler ve **bos render eder** -- o durumda
 * "arka plan yok" iddiasi hicbir sey olcmez, cunku ekranin kendisi de yoktur.
 */
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Perde ekran okuyucudan gizli; sorgular gizli ogeleri de kapsiyor. */
const hidden = { includeHiddenElements: true } as const;

describe('Screen journey artwork', () => {
  it('renders the journey behind an opted-in dark screen', async () => {
    const view = await renderWithTheme(
      <Screen journeyProgress={0.5}>
        <AppText>İçerik</AppText>
      </Screen>,
    );

    expect(view.getByTestId('journey-backdrop', { includeHiddenElements: true })).toBeTruthy();
  });

  it('does not add artwork to screens that do not join the journey', async () => {
    const view = await renderWithTheme(
      <Screen>
        <AppText>İçerik</AppText>
      </Screen>,
    );

    expect(view.queryByTestId('journey-backdrop', { includeHiddenElements: true })).toBeNull();
  });

  it('keeps the light scheme on its plain paper background', async () => {
    const view = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeProvider initialScheme="light">
          <Screen journeyProgress={0.5}>
            <AppText>İçerik</AppText>
          </Screen>
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    // Once agacin gercekten cizildigi: bos bir agac da `toBeNull` verirdi ve
    // kural silinse bile test yesil kalirdi.
    expect(view.getByText('İçerik')).toBeTruthy();
    expect(view.queryByTestId('journey-backdrop', { includeHiddenElements: true })).toBeNull();
  });
});

describe('Screen karartmasiz', () => {
  it('gorselli bir ekranda ust seride perde koymuyor', async () => {
    const view = await renderWithTheme(
      <Screen journeyProgress={0.5} header={<AppText>Geri</AppText>}>
        <AppText>İçerik</AppText>
      </Screen>,
    );
    // Once agacin cizildigi: bos bir agacta perde sorgusu da patlardi.
    expect(view.getByText('Geri')).toBeTruthy();

    expect(view.queryByTestId('header-veil', hidden)).toBeNull();
  });

  it('icerigin arkasina zeminden gelen bir perde cekmiyor', async () => {
    const view = await renderWithTheme(
      <Screen journeyProgress={0.5}>
        <AppText>İçerik</AppText>
      </Screen>,
    );
    expect(view.getByText('İçerik')).toBeTruthy();

    expect(view.queryByTestId('content-veil', hidden)).toBeNull();
  });

  it('kaydirma alaninin ustunde solma katmani birakmiyor', async () => {
    // Kaydirma solmasinin kendi kimligi hic olmadi, o yuzden testID ile
    // sorgulanamiyor. Bir gradyanin ayirt edici izi `colors` dizisi: agacta
    // bu prop'u tasiyan hicbir dugum kalmamis olmali. Ust ve icerik perdeleri
    // zaten yukarida ayri sorgulandi; bu, isimsiz ucuncu katmani yakalıyor.
    const view = await renderWithTheme(
      <Screen journeyProgress={0.5} header={<AppText>Geri</AppText>}>
        <AppText>İçerik</AppText>
      </Screen>,
    );
    expect(view.getByText('İçerik')).toBeTruthy();

    const gradients = view.container.queryAll((node) => Array.isArray(node.props.colors));
    expect(gradients).toHaveLength(0);
  });
});

describe('cam yuzeyler ve ekran ritmi', () => {
  const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } =
    jest.requireMock('expo-glass-effect');

  /** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
  function onPlatform(os: 'ios' | 'android') {
    const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
    return () => {
      if (original) Object.defineProperty(Platform, 'OS', original);
    };
  }

  beforeEach(() => {
    isLiquidGlassAvailable.mockReturnValue(true);
    isGlassEffectAPIAvailable.mockReturnValue(true);
  });

  afterEach(() => {
    isLiquidGlassAvailable.mockReturnValue(false);
  });

  it('hicbir cam yuzey solan bir kabin icinde durmuyor', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(
        <Screen
          header={
            <ScreenHeader
              onBack={() => {}}
              skip={{ label: strings.common.skip, onPress: () => {} }}
            />
          }
          journeyProgress={0.5}
          footer={<Button title="Vazgeç" onPress={() => {}} variant="ghost" />}
        >
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>
        </Screen>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      // Ekranin butun cam yuzeyleri: karti bulamayan bir sorgu, "hicbiri
      // solmuyor" iddiasini bos bir listeyle dogrularadi.
      const surfaces = view.getAllByTestId(/^glass-(view|back|skip|ghost)$/, hidden);
      expect(surfaces).toHaveLength(4);

      for (const surface of surfaces) {
        // Solan bir kapta sistem materyali de soluyor ve yarim uygulanmis bir
        // efekt gibi gorunuyor; ekranin ritmi camin ustunden gecmemeli.
        expect(opacitiesAbove(surface)).toEqual([]);
        // Ustlerin gercekten gezildigi: gezinme kirilirsa liste her yuzey icin
        // bos doner ve iddia hicbir sey olcmez.
        expect(surface.parent).not.toBeNull();
      }
    } finally {
      restore();
    }
  });
});
