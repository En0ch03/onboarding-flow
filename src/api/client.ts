import {
  create as createAxiosInstance,
  isAxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { createRefreshQueue } from './refresh';
import { RefreshResponseSchema } from './schemas';

/**
 * Istemcinin oturumla tek temas noktasi. Depolama ve durum yonetimi buraya
 * enjekte ediliyor; ag katmani hangi deponun kullanildigini bilmiyor ve bu
 * sayede cihaz olmadan test edilebiliyor.
 */
export type AuthBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  /** Yenileme basarili: yeni access token saklanir. */
  onRefreshed: (accessToken: string) => void | Promise<void>;
  /** Yenileme de basarisiz: oturum nazikce sonlandirilir, taslak korunur. */
  onSessionEnded: () => void | Promise<void>;
};

/** Oturum kurulmadan once gecerli olan koprü: token yok, yapilacak is yok. */
export const anonymousBridge: AuthBridge = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  onRefreshed: () => {},
  onSessionEnded: () => {},
};

/**
 * On saniye. Sozlesme her uc noktanin zaman asimina ugrayabilecegini soyluyor;
 * suresiz bekleyen bir istek, kullanicinin ekraninda donmus bir arayuz demek.
 */
export const REQUEST_TIMEOUT_MS = 10000;

const REFRESH_PATH = '/auth/refresh';

type RetryableConfig = InternalAxiosRequestConfig & { retriedAfterRefresh?: boolean };

export function createApiClient(options: {
  baseURL: string;
  bridge: AuthBridge;
  adapter?: AxiosAdapter;
}): AxiosInstance {
  const { baseURL, bridge } = options;

  const client = createAxiosInstance({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
    ...(options.adapter ? { adapter: options.adapter } : {}),
  });

  /**
   * Yenileme istegi bu ornek uzerinden gitmiyor: kendi interceptor'una
   * yakalanip sonsuz donguye girerdi.
   */
  const refreshClient = createAxiosInstance({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
    ...(options.adapter ? { adapter: options.adapter } : {}),
  });

  const queue = createRefreshQueue(async () => {
    const refreshToken = bridge.getRefreshToken();
    if (!refreshToken) throw { kind: 'refresh_expired' as const };

    const response = await refreshClient.post(REFRESH_PATH, { refresh_token: refreshToken });
    const { access_token } = RefreshResponseSchema.parse(response.data);

    await bridge.onRefreshed(access_token);
    return access_token;
  });

  client.interceptors.request.use((config) => {
    const token = bridge.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const failure = isAxiosError(error) ? error : null;
      const config = failure?.config as RetryableConfig | undefined;

      const shouldRefresh =
        failure?.response?.status === 401 &&
        config !== undefined &&
        // Bir istek yalnizca bir kez yenilenip tekrarlanir; ikinci 401
        // gercekten yetkisiz demektir ve kullaniciya ulasmali.
        config.retriedAfterRefresh !== true;

      if (!shouldRefresh) throw error;

      config.retriedAfterRefresh = true;

      try {
        const accessToken = await queue.refresh();
        config.headers.set('Authorization', `Bearer ${accessToken}`);
        return await client.request(config);
      } catch {
        queue.cancel();
        await bridge.onSessionEnded();
        // Ozgun hata firlatiliyor: 401 govdesi zaten "oturum bitti" olarak
        // normallesiyor ve yenileme hatasinin detayi kullaniciyi ilgilendirmiyor.
        throw error;
      }
    },
  );

  return client;
}

/**
 * Uygulamanin kullandigi tek ornek.
 *
 * Koprü calisma aninda takiliyor cunku oturum deposu acilista kuruluyor ve ag
 * katmani deponun varligini beklememeli. Takilmadan once uygulama oturumsuz
 * kabul edilir.
 */
let activeBridge: AuthBridge = anonymousBridge;

export function setAuthBridge(bridge: AuthBridge): void {
  activeBridge = bridge;
}

const delegatingBridge: AuthBridge = {
  getAccessToken: () => activeBridge.getAccessToken(),
  getRefreshToken: () => activeBridge.getRefreshToken(),
  onRefreshed: (token) => activeBridge.onRefreshed(token),
  onSessionEnded: () => activeBridge.onSessionEnded(),
};

/**
 * Uygulamanin sunucu hakkinda bildigi tek sey. Sahte veri, sahte dal veya
 * ortama gore degisen bir kod yolu yok; gercek sunucuya gecis bu degisken.
 */
export const baseURL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const api = createApiClient({ baseURL, bridge: delegatingBridge });
