import * as SecureStore from 'expo-secure-store';

import { storageKeys } from './keys';

/**
 * Token'lar cihazin kendi anahtarligina yaziliyor, duz anahtar-deger deposuna
 * degil. Duz depo, kok erisimi olan bir cihazda veya bir yedekleme dosyasinda
 * okunabilir; oturum anahtari orada durmamali.
 *
 * Sifre hicbir zaman saklanmiyor - ne burada ne baska bir yerde.
 */
export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(storageKeys.accessToken, tokens.accessToken),
    SecureStore.setItemAsync(storageKeys.refreshToken, tokens.refreshToken),
  ]);
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(storageKeys.accessToken, accessToken);
}

/**
 * Ikisinden biri eksikse oturum yok sayilir: yarim bir oturumla acilmak,
 * kullaniciyi akisin ortasinda beklenmedik bir sekilde disari atar.
 */
export async function readTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(storageKeys.accessToken),
    SecureStore.getItemAsync(storageKeys.refreshToken),
  ]);

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(storageKeys.accessToken),
    SecureStore.deleteItemAsync(storageKeys.refreshToken),
  ]);
}
