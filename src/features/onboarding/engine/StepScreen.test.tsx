import { act, cleanup, fireEvent, waitFor } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

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
afterEach(() => jest.restoreAllMocks());

/** Kayitli donanimsal geri isleyicilerini toplayan casus. */
function watchBackHandler() {
  const handlers: (() => boolean)[] = [];

  jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((
    _event: string,
    handler: () => boolean,
  ) => {
    handlers.push(handler);
    return {
      remove: () => {
        const index = handlers.indexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
      },
    };
  }) as unknown as typeof BackHandler.addEventListener);

  return handlers;
}

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

  it('ayni adimin gec donen eski gonderimi yenisini ezmiyor', async () => {
    // Kullanici geri gidip ayni adimi tekrar ilerletirse iki istek ucusta
    // olabiliyor. Once baslayanin gec donen basarisi, hala ucusta olan
    // ikincisini "yazildi" diye kapatmamali: adim yazilmamis kalmali ki
    // tamamlanmadan once tekrar denensin.
    const resolvers: (() => void)[] = [];

    asMock(saveStep).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const view = await renderWithTheme(
      <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={() => {}} />,
    );

    fireEvent.press(view.getByText(strings.common.continue));
    await waitFor(() => expect(resolvers).toHaveLength(1));

    // Geri don ve ayni adimi tekrar ilerlet: ikinci gonderim ucusa cikiyor.
    await act(async () => {
      useOnboardingStore.setState({ activeStepId: 'identity' });
    });
    fireEvent.press(await view.findByText(strings.common.continue));
    await waitFor(() => expect(resolvers).toHaveLength(2));

    // Yalnizca eskisi doniyor. Korumasiz haliyle burada adim "yazildi"
    // isaretlenip listeden dusuyor.
    await act(async () => {
      resolvers[0]?.();
      await Promise.resolve();
    });

    expect(useOnboardingStore.getState().unsyncedStepIds).toContain('identity');
  });

  describe('donanimsal geri tusu', () => {
    it('bir onceki adima gidiyor', async () => {
      const handlers = watchBackHandler();
      useOnboardingStore.setState({ activeStepId: 'audience' });

      await renderWithTheme(
        <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={() => {}} />,
      );

      await act(async () => {
        expect(handlers[0]?.()).toBe(true);
      });

      expect(useOnboardingStore.getState().activeStepId).toBe('identity');
    });

    it('ilk adimda akisin disina cikisi cagiriyor', async () => {
      const handlers = watchBackHandler();
      const onExit = jest.fn();

      await renderWithTheme(
        <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={onExit} />,
      );

      await act(async () => {
        expect(handlers[0]?.()).toBe(true);
      });

      expect(onExit).toHaveBeenCalled();
      expect(useOnboardingStore.getState().activeStepId).toBe('identity');
    });

    it('adim ilerledikten sonra da guncel adimdan geriliyor', async () => {
      // Abonelik yalnizca odak degisiminde yenileniyor. Isleyici guncel
      // adimi bir referanstan okumasaydi ilk cizimin adiminda donar ve
      // ucuncu adimda geri tusu, bir adim geri gitmek yerine akistan cikis
      // onayini acardi.
      const handlers = watchBackHandler();
      const onExit = jest.fn();

      const view = await renderWithTheme(
        <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={onExit} />,
      );

      fireEvent.press(view.getByText(strings.common.continue));
      await waitFor(() => expect(useOnboardingStore.getState().activeStepId).toBe('audience'));

      await act(async () => {
        handlers[0]?.();
      });

      expect(useOnboardingStore.getState().activeStepId).toBe('identity');
      expect(onExit).not.toHaveBeenCalled();
    });

    it('ustteki geri dugmesi de ilk adimda cikisi cagiriyor', async () => {
      // Iki yol tek tanimi paylasiyor; bu test o tanimin dugme ucunu tutuyor.
      const onExit = jest.fn();

      const view = await renderWithTheme(
        <StepScreen steps={flow} options={options} onFinish={() => {}} onExit={onExit} />,
      );

      fireEvent.press(view.getByLabelText(strings.common.back));

      expect(onExit).toHaveBeenCalled();
    });

    it('ekran onde degilken dinlemiyor', async () => {
      // Kapanis ekrani ustune geldiginde adimlar yiginda mount halinde
      // kaliyor; dinlemeye devam etselerdi oradaki bir geri basisi alttaki
      // adimi degistirirdi.
      const handlers = watchBackHandler();

      await renderWithTheme(
        <StepScreen
          steps={flow}
          options={options}
          onFinish={() => {}}
          onExit={() => {}}
          focused={false}
        />,
      );

      expect(handlers).toHaveLength(0);
    });
  });
});
