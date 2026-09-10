import { act, cleanup, fireEvent, waitFor } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { strings } from '@/constants/strings';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingStore } from '@/state/onboardingStore';
import { storageKeys } from '@/storage/keys';
import { renderWithTheme } from '@/test/renderWithTheme';

import { journeyOffset, journeyStops } from '@/features/onboarding/artwork/journeyArtwork';

import { HomeScreen } from './HomeScreen';

const session = {
  user_id: 'usr_1',
  access_token: 'access_1',
  refresh_token: 'refresh_1',
  onboarding_complete: true,
};

beforeEach(async () => {
  await SecureStore.deleteItemAsync(storageKeys.accessToken);
  await SecureStore.deleteItemAsync(storageKeys.refreshToken);
  await AsyncStorage.clear();

  useAuthStore.setState({
    status: 'unknown',
    userId: null,
    accessToken: null,
    refreshToken: null,
    onboardingComplete: false,
  });
});

afterEach(cleanup);

describe('varis ekrani', () => {
  it('akisin bittigi yer bir cikmaz sokak degil: oturum kapatilabiliyor', async () => {
    await act(async () => {
      await useAuthStore.getState().startSession(session);
    });

    const screen = await renderWithTheme(<HomeScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText(strings.home.signOut));
    });

    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
  });

  /**
   * Bu test bir satirin **yoklugunu** koruyor. Cikista taslagi silmek, ayni
   * yolu kullanan tukenmis yenilemenin de taslagi goturmesi demek; yani bir ag
   * arizasi veri kaybina donusur. Yoklugu ancak ekleyerek sinanabilir ve
   * eklemeyi yakalayan baska bir test yok.
   */
  it('cikis yerel taslagi goturmuyor', async () => {
    await act(async () => {
      await useAuthStore.getState().startSession(session);
      useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
      useOnboardingStore.getState().setActiveStep('name');
      useOnboardingStore.getState().markStepCompleted('name');
    });

    const screen = await renderWithTheme(<HomeScreen />);

    await act(async () => {
      fireEvent.press(await screen.findByText(strings.home.signOut));
    });

    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));

    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
    expect(useOnboardingStore.getState().activeStepId).toBe('name');
    expect(useOnboardingStore.getState().completedStepIds).toContain('name');
  });

  it('cikis, cihazdaki anahtarlari da birakmiyor', async () => {
    await act(async () => {
      await useAuthStore.getState().startSession(session);
    });

    const screen = await renderWithTheme(<HomeScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText(strings.home.signOut));
    });

    await waitFor(async () => {
      expect(await SecureStore.getItemAsync(storageKeys.refreshToken)).toBeNull();
    });
  });

  /**
   * Varis ekrani akisin devami; kendi basina duran bos bir sayfa degil.
   * Yolculugun ardisik kadrajlari burada son buluyor ve ekranin geri kalani
   * ayni gorseli tasidigi icin varis noktasi da onu tasimali.
   */
  it('yolculugun son kadrajini gosteriyor', async () => {
    const screen = await renderWithTheme(<HomeScreen />);

    const artwork = screen.getByTestId('journey-artwork', { includeHiddenElements: true });
    // Olcu varsayilmiyor: arka plan pencereyi okuyor, test de ayni yerden okuyor.
    const window = Dimensions.get('window');
    const { width, translateX } = journeyOffset(
      journeyStops.completion,
      window.width,
      window.height,
    );

    expect(artwork.props.style).toEqual(
      expect.objectContaining({ width, transform: [{ translateX }] }),
    );
  });
});
