import { act, cleanup, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/state/authStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { RootNavigator, resolveSignIn } from './RootNavigator';

jest.mock('@/state/bootstrap', () => ({
  bootstrap: jest.fn(),
  adoptServerProfile: jest.fn(),
}));
jest.mock('@/api/config', () => ({
  fetchOptionGroups: jest.fn(),
  readCachedOptionGroups: jest.fn(() => ({})),
}));

/**
 * Karsilama yigini yerine, `onAuthenticated`'i disaridan cagirabilecegimiz
 * bir kanca birakiyoruz: sinanan sey giris ekranlarinin kendisi degil, kok
 * navigatorun giristen sonra ne yaptigi.
 */
let signedIn: ((onboardingComplete: boolean) => void) | null = null;

jest.mock('./AuthNavigator', () => ({
  AuthNavigator: ({ onAuthenticated }: { onAuthenticated: (complete: boolean) => void }) => {
    signedIn = onAuthenticated;
    return null;
  },
}));

// Adim yigini bir navigasyon kabi istiyor; burada sinanan sey o degil.
jest.mock('./OnboardingNavigator', () => ({ OnboardingNavigator: () => null }));

const { bootstrap, adoptServerProfile } = jest.requireMock('@/state/bootstrap');

/**
 * Hata tam olarak burada yasadi: giris yolu sunucudaki profili hic
 * okumuyordu ve kullanici baska bir cihazda verdigi cevaplari gormuyordu.
 * Benimseme fonksiyonunun kendi testleri o cagriyi tutmuyor.
 */
beforeEach(() => {
  signedIn = null;
  adoptServerProfile.mockReset();
  adoptServerProfile.mockResolvedValue('in-progress');

  bootstrap.mockReset();
  bootstrap.mockResolvedValue({
    destination: 'welcome',
    resumeStepId: null,
    optionsAvailable: true,
  });
});

afterEach(async () => {
  await cleanup();

  // Oturum durumu kuresel: bir testin biraktigi `anonymous`, sonraki testin
  // `unknown`dan basladigini varsayan iddiasini sessizce dogru gosterirdi.
  useAuthStore.setState({
    status: 'unknown',
    userId: null,
    accessToken: null,
    refreshToken: null,
    onboardingComplete: false,
  });
});

describe('resolveSignIn', () => {
  it('sunucudaki profili okumadan hicbir yere gitmiyor', async () => {
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(adoptServerProfile).toHaveBeenCalled();
    expect(setPhase.mock.calls.map(([phase]) => phase)).toEqual(['loading', 'onboarding']);
  });

  it('sunucu profili tamamlanmis buldiysa uygulamaya gidiyor', async () => {
    adoptServerProfile.mockResolvedValue('complete');
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('app');
  });

  it('giris tamamlanmis dediyse profil okumasi bunu geri almiyor', async () => {
    const setPhase = jest.fn();

    await resolveSignIn(true, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('app');
  });

  it('oturum bu arada bittiyse akisa degil karsilamaya birakiyor', async () => {
    // Token'i olmayan biri akisin icinde her adimda 401 alir ve "oturumun
    // sona erdi" bandini akisin ortasinda gorurdu.
    adoptServerProfile.mockResolvedValue('session-lost');
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('welcome');
  });

  it('beklenmeyen bir dususte bekleme ekraninda birakmiyor', async () => {
    // O ekranda ne geri tusu var ne yeniden deneme; tek cikis uygulamayi
    // kapatmak olurdu.
    adoptServerProfile.mockRejectedValue(new Error('boom'));
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('welcome');
  });
});

describe('RootNavigator', () => {
  it('giris tamamlandiginda sunucudaki profili okuyor', async () => {
    // Karar fonksiyonunun kendi testleri cagriyi tutmuyor: bu test, kok
    // navigatorun onu gercekten cagirdigini tutuyor. Bag koparildiginda
    // hicbir sey dusmuyordu.
    await renderWithTheme(<RootNavigator />);
    await waitFor(() => expect(signedIn).not.toBeNull());

    await act(async () => {
      signedIn?.(false);
    });

    expect(adoptServerProfile).toHaveBeenCalled();
  });

  it('oturum akisin ortasinda biterse karsilamaya donuyor', async () => {
    // Yenileme tukendiginde token'lar siliniyor ama faz kendiliginden
    // degismiyordu: kullanici token'siz halde adimlarda kaliyor ve her
    // istekte "oturumun sona erdi" bandini goruyordu.
    bootstrap.mockResolvedValue({
      destination: 'onboarding',
      resumeStepId: 'identity',
      optionsAvailable: true,
    });

    const view = await renderWithTheme(<RootNavigator />);
    await waitFor(() => expect(bootstrap).toHaveBeenCalled());

    await act(async () => {
      useAuthStore.setState({ status: 'authenticated' });
    });
    await act(async () => {
      useAuthStore.setState({ status: 'anonymous' });
    });

    // Karsilama yigini taklit edildigi icin varligi `onAuthenticated`
    // kancasinin yeniden kurulmasindan okunuyor.
    await waitFor(() => expect(signedIn).not.toBeNull());
    expect(view).toBeTruthy();
  });
});
