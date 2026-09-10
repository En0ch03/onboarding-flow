import { render } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';
import { renderWithTheme } from '@/test/renderWithTheme';

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
