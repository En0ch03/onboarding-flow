import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { cleanup, fireEvent, waitFor } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { strings } from '@/constants/strings';
import { usePhotoTransfers } from '@/features/onboarding/steps/photoTransfers';
import { useOnboardingStore } from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { OnboardingNavigator, type OnboardingStackParamList } from './OnboardingNavigator';

jest.mock('@/api/endpoints', () => ({
  completeOnboarding: jest.fn(async () => ({ onboarding_complete: true })),
  patchProfile: jest.fn(async () => ({})),
}));
jest.mock('@/features/onboarding/saveStep', () => ({ saveStep: jest.fn(async () => {}) }));

/**
 * Kullanicinin bildirdigi ariza buydu: herhangi bir adimda ekrani yana
 * kaydirinca kapanis ekranina dusuluyordu. Sebep, "Profilimi duzenle"nin
 * yigina ikinci bir adim ekrani itmesi ve kapanisin altta asili kalmasiydi.
 *
 * `stackBehaviour.test.ts` kutuphanenin bu davranisini civiliyor; burasi
 * navigatorun hangisini cagirdigini civiliyor. Ikisi ayri sorular.
 */

const options: OptionGroups = {
  gender: {
    key: 'gender',
    multiSelect: false,
    maxSelection: null,
    required: true,
    options: [{ id: 'woman', label: 'Kadınım' }],
  },
  audience: {
    key: 'audience',
    multiSelect: true,
    maxSelection: 3,
    required: true,
    options: [{ id: 'everyone', label: 'Herkes' }],
  },
  intent: {
    key: 'intent',
    multiSelect: true,
    maxSelection: 2,
    required: true,
    options: [{ id: 'long_term', label: 'Uzun soluklu bir ilişki' }],
  },
  interests: {
    key: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'books', label: 'Kitap' }],
  },
};

const answers = {
  name: 'Deniz',
  birthDate: { day: '14', month: '3', year: '1996' },
  gender: 'woman',
  audience: ['everyone'],
  intent: ['long_term'],
  interests: ['books'],
  photos: [
    { id: 'p1', url: 'http://example.test/p1' },
    { id: 'p2', url: 'http://example.test/p2' },
  ],
};

afterEach(cleanup);
afterEach(() => jest.restoreAllMocks());

async function mountAtLastStep() {
  useOnboardingStore.setState({
    answers,
    unsyncedStepIds: [],
    activeStepId: 'interests',
    completedStepIds: [],
  });

  const ref = createNavigationContainerRef<OnboardingStackParamList>();

  const view = await renderWithTheme(
    <NavigationContainer ref={ref}>
      <OnboardingNavigator options={options} onEnterApp={() => {}} onLeaveFlow={() => {}} />
    </NavigationContainer>,
  );

  return { view, routes: () => ref.getRootState()?.routes.map((route) => route.name) ?? [] };
}

describe('OnboardingNavigator', () => {
  it('akis bitince kapanis ekrani adimlarin uzerine geliyor', async () => {
    const { view, routes } = await mountAtLastStep();
    expect(routes()).toEqual(['Steps']);

    fireEvent.press(view.getByText(strings.common.finish));

    await waitFor(() => expect(routes()).toEqual(['Steps', 'Completion']));
  });

  it('profilini duzenle kapanis ekranini yigindan dusuruyor', async () => {
    // Ekran yigindan dusmezse, kullanici adimlarda gezerken altinda
    // bekliyor ve bir geri kaydirma onu oraya birakiyor.
    const { view, routes } = await mountAtLastStep();

    fireEvent.press(view.getByText(strings.common.finish));
    await waitFor(() => expect(routes()).toEqual(['Steps', 'Completion']));

    fireEvent.press(await view.findByText(strings.completion.secondary));

    await waitFor(() => expect(routes()).toEqual(['Steps']));
  });

  it('kapanis ekranindayken geri tusu alttaki adimi degistirmiyor', async () => {
    // Adimlar kapanis ekraninin altinda mount halinde kaliyor. Donanimsal
    // geri tusunu dinlemeye devam etselerdi, buradaki bir geri basisi
    // gorunmeyen bir adimi degistirirdi.
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

    const { view, routes } = await mountAtLastStep();

    fireEvent.press(view.getByText(strings.common.finish));
    await waitFor(() => expect(routes()).toEqual(['Steps', 'Completion']));
    await view.findByText(strings.completion.primary);

    for (const handler of [...handlers]) handler();

    expect(useOnboardingStore.getState().activeStepId).toBe('interests');
  });
});

describe('OnboardingNavigator: akisin omru', () => {
  it('yigin sokulunce devam eden yukleme isaretleri gidiyor', async () => {
    // Cikis, oturumun bitmesi ya da uygulamaya giris: ucu de bu yigini
    // sokuyor. Isaretler kalsaydi bir sonraki kullanici onceki kullanicinin
    // dusen yuklemesini kendi izgarasinda gorurdu.
    usePhotoTransfers.getState().mark(0, 'failed');
    const { view } = await mountAtLastStep();

    await view.unmount();

    expect(usePhotoTransfers.getState().transfers.size).toBe(0);
  });
});
