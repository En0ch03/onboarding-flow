import { act, fireEvent, render } from '@testing-library/react-native';
import { Dimensions, processColor, StyleSheet } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, ThemeProvider, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { Screen } from './Screen';

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

/** Icerik blogunun olculdugunu bildiren yerlesim olayi. */
async function layoutContent(view: Awaited<ReturnType<typeof renderWithTheme>>, height: number) {
  await act(async () => {
    fireEvent(view.getByTestId('content-block', hidden), 'layout', {
      nativeEvent: { layout: { width: 342, height, x: 0, y: 0 } },
    });
  });
}

describe('Screen icerik perdesi', () => {
  it('metnin arkasina zeminden gelen bir perde cekiyor', async () => {
    const view = await renderWithTheme(
      <Screen journeyProgress={0.5}>
        <AppText>İçerik</AppText>
      </Screen>,
    );
    // Agac gercekten cizildi mi: bos bir agacta asagidaki sorgu da patlardi.
    expect(view.getByText('İçerik')).toBeTruthy();

    await layoutContent(view, 200);

    const veil = view.getByTestId('content-veil', hidden);
    expect(veil.props.colors).toEqual([
      processColor(withAlpha(palettes.dark.paper, 0)),
      processColor(withAlpha(palettes.dark.paper, 0.72)),
      processColor(withAlpha(palettes.dark.paper, 0.86)),
    ]);
  });

  it('perde tum ekrani degil yalnizca icerik blogunu kapliyor', async () => {
    const view = await renderWithTheme(
      <Screen align="center" journeyProgress={0.5}>
        <AppText>İçerik</AppText>
      </Screen>,
    );
    expect(view.getByText('İçerik')).toBeTruthy();

    await layoutContent(view, 200);

    // Olculen blok 200; perde onu iki ucundan 24'er tasiyor. Ekranin kendisi
    // 844: perde tum ekrani kaplasaydi gorsel bogulurdu.
    const style = StyleSheet.flatten(view.getByTestId('content-veil', hidden).props.style) as {
      height: number;
      top: number;
    };
    expect(style.height).toBe(248);
    expect(style.top).toBe(-24);
    expect(Dimensions.get('window').height).toBeGreaterThan(style.height);
  });

  it('gorselsiz ekrana perde koymuyor', async () => {
    const view = await renderWithTheme(
      <Screen>
        <AppText>İçerik</AppText>
      </Screen>,
    );
    expect(view.getByText('İçerik')).toBeTruthy();

    await layoutContent(view, 200);

    // Duz zemin uzerinde zeminden zemine bir gradyan hicbir sey yapmaz; bos
    // bir katman cizmek yerine hic cizilmiyor.
    expect(view.queryByTestId('content-veil', hidden)).toBeNull();
  });
});
