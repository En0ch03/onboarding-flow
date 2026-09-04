import { StyleSheet } from 'react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { WelcomeDifferenceScreen } from './WelcomeDifferenceScreen';
import { WelcomePromiseScreen } from './WelcomePromiseScreen';

const noop = () => {};

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
