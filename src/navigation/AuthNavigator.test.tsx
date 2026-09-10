import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { act, cleanup } from '@testing-library/react-native';

import { renderWithTheme } from '@/test/renderWithTheme';

import { AuthNavigator } from './AuthNavigator';
import type { AuthStackParamList } from './types';

/**
 * Ekranlarin kendileri burada sinanmiyor; sinanan sey navigatorun bir ekran
 * bittiginde yukariya ne bildirdigi. Kayit ekrani yerine, `onRegistered`'i
 * disaridan cagirabilecegimiz bir kanca birakiliyor.
 */
let registered: (() => void) | null = null;

jest.mock('@/features/auth/RegisterScreen', () => ({
  RegisterScreen: ({ onRegistered }: { onRegistered: () => void }) => {
    registered = onRegistered;
    return null;
  },
}));
jest.mock('@/features/auth/LoginScreen', () => ({ LoginScreen: () => null }));
jest.mock('@/features/auth/WelcomePromiseScreen', () => ({ WelcomePromiseScreen: () => null }));
jest.mock('@/features/auth/WelcomeDifferenceScreen', () => ({
  WelcomeDifferenceScreen: () => null,
}));

beforeEach(() => {
  registered = null;
});

afterEach(async () => {
  await cleanup();
});

describe('AuthNavigator', () => {
  it('yeni acilan hesabi akisi tamamlamis saymiyor', async () => {
    // Yeni bir hesabin onunde akisin tamami duruyor. Buradan `true`
    // bildirilseydi kullanici hic soru gormeden uygulamaya dusuverirdi ve
    // kok gecisi bu isareti sorgulamadan kabul ediyor.
    const onAuthenticated = jest.fn();
    const ref = createNavigationContainerRef<AuthStackParamList>();

    const view = await renderWithTheme(
      <NavigationContainer ref={ref}>
        <AuthNavigator onAuthenticated={onAuthenticated} />
      </NavigationContainer>,
    );

    await act(async () => {
      ref.navigate('Register');
    });

    expect(registered).not.toBeNull();

    await act(async () => {
      registered?.();
    });

    expect(onAuthenticated).toHaveBeenCalledWith(false);
    expect(onAuthenticated).toHaveBeenCalledTimes(1);

    await view.unmount();
  });
});
