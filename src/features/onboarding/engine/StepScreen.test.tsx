import { cleanup, fireEvent, waitFor } from '@testing-library/react-native';

import type { OptionGroups } from '@/api/schemas';
import { strings } from '@/constants/strings';
import { useOnboardingStore } from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { saveStep } from '../saveStep';

import { StepScreen } from './StepScreen';
import type { StepDefinition } from './types';

jest.mock('../saveStep', () => ({ saveStep: jest.fn(async () => {}) }));

function asMock<T extends (...args: never[]) => unknown>(fn: T) {
  return fn as unknown as jest.Mock;
}

const options: OptionGroups = {};

const flow: StepDefinition[] = [
  {
    id: 'identity',
    title: 'Adın ne?',
    subtitle: '',
    component: () => null,
    isComplete: () => true,
    skippable: false,
  },
  {
    id: 'audience',
    title: 'Kimler görsün?',
    subtitle: '',
    component: () => null,
    isComplete: () => true,
    skippable: false,
  },
];

afterEach(cleanup);

beforeEach(() => {
  useOnboardingStore.setState({ answers: {}, unsyncedStepIds: [], activeStepId: 'identity' });
  asMock(saveStep).mockImplementation(async () => {});
});

describe('StepScreen', () => {
  it('adimi gonderim bitene kadar yazilmamis sayiyor', async () => {
    // Son adimda bu bir yaris kapatiyor: tamamlanma ekrani, henuz sunucuya
    // ulasmamis bir cevaba gore karar veremesin.
    let release = (): void => {};
    asMock(saveStep).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const view = await renderWithTheme(
      <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={() => {}} />,
    );

    fireEvent.press(view.getByText(strings.common.continue));

    await waitFor(() =>
      expect(useOnboardingStore.getState().unsyncedStepIds).toContain('identity'),
    );

    release();

    await waitFor(() =>
      expect(useOnboardingStore.getState().unsyncedStepIds).not.toContain('identity'),
    );
  });

  it('gonderim basarisiz olursa adim yazilmamis kaliyor', async () => {
    asMock(saveStep).mockImplementation(async () => {
      throw new Error('network');
    });

    const view = await renderWithTheme(
      <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={() => {}} />,
    );

    fireEvent.press(view.getByText(strings.common.continue));

    await waitFor(() =>
      expect(useOnboardingStore.getState().unsyncedStepIds).toContain('identity'),
    );
  });

  it('kayit basarisiz olsa da akis duruyor degil', async () => {
    asMock(saveStep).mockImplementation(async () => {
      throw new Error('network');
    });

    const view = await renderWithTheme(
      <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={() => {}} />,
    );

    fireEvent.press(view.getByText(strings.common.continue));

    await waitFor(() => expect(useOnboardingStore.getState().activeStepId).toBe('audience'));
  });
});
