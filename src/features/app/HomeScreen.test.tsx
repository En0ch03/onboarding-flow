import { act, cleanup, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { strings } from '@/constants/strings';
import { useAuthStore } from '@/state/authStore';
import { storageKeys } from '@/storage/keys';
import { renderWithTheme } from '@/test/renderWithTheme';

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
});
