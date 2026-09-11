import { Platform, StyleSheet } from 'react-native';

import { strings } from '@/constants/strings';
import { GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
import { renderWithTheme } from '@/test/renderWithTheme';

import { WelcomeDifferenceScreen } from './WelcomeDifferenceScreen';
import { WelcomePromiseScreen } from './WelcomePromiseScreen';

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

const noop = () => {};

/** Arka katmanlar ekran okuyucudan gizli; sorgular gizli ogeleri de kapsiyor. */
const hidden = { includeHiddenElements: true } as const;

/** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
function onPlatform(os: 'ios' | 'android') {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

type Node = { props?: { style?: unknown }; children?: unknown } | string | null;

/**
 * Kabugun icerik kutusu `flexGrow: 1` tasiyor; ortalanmis olani ayirt eden
 * sey uzerindeki `justifyContent`. Agacta boyle bir kutu varsa ekran
 * ortalaniyor demektir.
 */
function hasCentredContent(node: Node | Node[]): boolean {
  if (node === null || typeof node === 'string') return false;
  if (Array.isArray(node)) return node.some(hasCentredContent);

  const style = StyleSheet.flatten(node.props?.style) as Record<string, unknown> | undefined;
  if (style?.flexGrow === 1 && style?.justifyContent === 'center') return true;

  return hasCentredContent((node.children ?? []) as Node[]);
}

describe('karsilama ekranlari', () => {
  beforeEach(() => {
    isLiquidGlassAvailable.mockReturnValue(false);
    isGlassEffectAPIAvailable.mockReturnValue(true);
  });

  it('duz metne dayanan ekranlarda cam kipi acik olsa bile hic cizilmiyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const promise = await renderWithTheme(
        <WelcomePromiseScreen onStart={noop} onSignIn={noop} />,
      );
      // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular
      // da "yok" derdi ve kural silinse bile test yesil kalirdi.
      expect(promise.getByText(strings.welcome.promiseTitle)).toBeTruthy();
      // Ekranin tek cam adayi hayalet dugme: sahne kuran bu ekranda metnin
      // disinda okunacak bir zemin kalmamali.
      expect(promise.queryByTestId('glass-ghost', hidden)).toBeNull();
      expect(promise.queryByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeNull();

      const difference = await renderWithTheme(
        <WelcomeDifferenceScreen onContinue={noop} onBack={noop} onSkip={noop} />,
      );
      expect(difference.getByText(strings.welcome.differenceTitleFirst)).toBeTruthy();
      // Bu ekranin iki adayi var: geri dairesi ve gec kapsulu; ikisi de
      // yedek gorunumunde kalmali.
      expect(difference.queryByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeNull();
      expect(difference.queryByTestId('glass-back', hidden)).toBeNull();
      expect(difference.queryByTestId('glass-skip', hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('ikinci ekranin cumlesi iki ayri satir', async () => {
    const view = await renderWithTheme(
      <WelcomeDifferenceScreen onContinue={noop} onBack={noop} onSkip={noop} />,
    );

    // Yapisik tek blok degil: iki ayri metin dugumu.
    expect(view.getByText(strings.welcome.differenceTitleFirst)).toBeTruthy();
    expect(view.getByText(strings.welcome.differenceTitleSecond)).toBeTruthy();
    expect(
      view.queryByText(
        `${strings.welcome.differenceTitleFirst} ${strings.welcome.differenceTitleSecond}`,
      ),
    ).toBeNull();
  });

  it('ikinci ekranda geri solda, gec sagda', async () => {
    const view = await renderWithTheme(
      <WelcomeDifferenceScreen onContinue={noop} onBack={noop} onSkip={noop} />,
    );

    expect(view.getByLabelText(strings.common.back)).toBeTruthy();
    expect(view.getByText(strings.common.skip)).toBeTruthy();
  });

  it('hicbir karsilama ekrani icerigini dikeyde ortalamiyor', async () => {
    const promise = await renderWithTheme(<WelcomePromiseScreen onStart={noop} onSignIn={noop} />);
    const difference = await renderWithTheme(
      <WelcomeDifferenceScreen onContinue={noop} onBack={noop} onSkip={noop} />,
    );

    // Yokluk iddiasi once varligi kanitliyor: bos render eden bir ekran da
    // "ortalanmiyor" derdi ve test sessizce gecerdi.
    expect(promise.getByText(strings.welcome.promiseTitle)).toBeTruthy();
    expect(difference.getByText(strings.welcome.differenceTitleFirst)).toBeTruthy();

    expect(hasCentredContent(promise.toJSON())).toBe(false);
    expect(hasCentredContent(difference.toJSON())).toBe(false);
  });
});
