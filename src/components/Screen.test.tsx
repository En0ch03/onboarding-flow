import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';
import { renderWithTheme } from '@/test/renderWithTheme';

import { AppText } from './AppText';
import { Screen } from './Screen';

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
      <SafeAreaProvider>
        <ThemeProvider initialScheme="light">
          <Screen journeyProgress={0.5}>
            <AppText>İçerik</AppText>
          </Screen>
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    expect(view.queryByTestId('journey-backdrop', { includeHiddenElements: true })).toBeNull();
  });
});
