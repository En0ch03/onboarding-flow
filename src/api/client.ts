import {
  create as createAxiosInstance,
  isAxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { resolveBaseUrl, resolveStandInUrl } from './baseUrl';
import type { ApiError } from './errors';
import { createRefreshQueue, type RefreshQueue } from './refresh';
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

/**
 * Yenileme kuyrugunu, yenilemenin **hangi adrese** soruldugu ile birlikte
 * kurar.
 *
 * Ikisi bilerek tek yerde: yenileme uygulamanin tamamina ait bir is, tek bir
 * istemci ornegine degil. Birden fazla ornek varsa hepsi ayni kuyrugu ve ayni
 * adresi paylasmali -- yoksa iki ayri kuyruk es zamanli iki yenileme baslatir
 * (`refresh.ts` bunun neden tehlikeli oldugunu anlatiyor), ve sozlesmeyi
 * karsilamayan bir adrese sorulan yenileme hem gecerli bir oturumu kapatir hem
 * de refresh token'i oraya tasir.
 */
export function createRefreshQueueFor(options: {
  baseURL: string;
  bridge: AuthBridge;
  adapter?: AxiosAdapter;
}): RefreshQueue {
  const { bridge } = options;

  /**
   * Yenileme istegi asil ornek uzerinden gitmiyor: kendi interceptor'una
   * yakalanip sonsuz donguye girerdi.
   */
  const refreshClient = createAxiosInstance({
    baseURL: options.baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
    ...(options.adapter ? { adapter: options.adapter } : {}),
  });

  return createRefreshQueue(async () => {
    const refreshToken = bridge.getRefreshToken();
    if (!refreshToken) throw { kind: 'refresh_expired' as const };

    const response = await refreshClient.post(REFRESH_PATH, { refresh_token: refreshToken });
    const { access_token } = RefreshResponseSchema.parse(response.data);

    await bridge.onRefreshed(access_token);
    return access_token;
  });
}

export function createApiClient(options: {
  baseURL: string;
  bridge: AuthBridge;
  adapter?: AxiosAdapter;
  /**
   * Paylasilan kuyruk. Verilmezse ornek kendi kuyrugunu kurar -- tek ornekli
   * kurulumda ve testlerde dogru davranis budur.
   */
  refreshQueue?: RefreshQueue;
}): AxiosInstance {
  const { baseURL, bridge } = options;

  const client = createAxiosInstance({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
    ...(options.adapter ? { adapter: options.adapter } : {}),
  });

  const queue = options.refreshQueue ?? createRefreshQueueFor(options);

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
        // Bir istek yalnizca bir kez yenilenip tekrarlanir; tekrarin 401'i
        // bir daha yenileme baslatmaz, asagida ayri ele aliniyor. Ikinci bir
        // tur sonsuz donguye kapi acardi.
        config.retriedAfterRefresh !== true;

      if (!shouldRefresh) throw error;

      config.retriedAfterRefresh = true;

      let accessToken: string;
      try {
        accessToken = await queue.refresh();
      } catch {
        // Oturumu kapatabilen tek yer burasi: yenileme sunucusu hayir dedi.
        //
        // Kuyruk burada **iptal edilmiyor.** Kuyruk paylasilan bir sey ve
        // buradaki basarisizlik bu istege ait: iptal etmek, baska bir istegin
        // o anda ucusta olan yenilemesini kuyruktan silerdi ve bir sonraki 401
        // ikinci bir yenileme baslatirdi -- kuyrugun onlemek icin var oldugu
        // durumun ta kendisi. Basarisiz bir yenileme zaten kendi `finally`'siyle
        // kuyrugu bosaltiyor.
        await bridge.onSessionEnded();
        // Ozgun hata firlatiliyor: 401 govdesi zaten "oturum bitti" olarak
        // normallesiyor ve yenileme hatasinin detayi kullaniciyi ilgilendirmiyor.
        throw error;
      }

      config.headers.set('Authorization', `Bearer ${accessToken}`);

      try {
        return await client.request(config);
      } catch (retryError: unknown) {
        // Yenileme basarili oldugu icin oturum gecerli; tekrarin hatasi bu
        // istege ait ve oturumu kapatmiyor. Kullanici akisin ortasinda
        // oturumdan dusmemeli -- tek bir ucun hatasi yuzunden hic.
        //
        // Tekrarin 401'i ham birakilmiyor: ham 401 "oturum bitti" olarak
        // normallesiyor ve acilis bunu gorunce kullaniciyi token'lar diskte
        // dururken karsilamaya gonderirdi. Oturumun gecerli olduguna yenileme
        // sunucusu karar verdi; ardindan gelen 401 bir sunucu sapmasi.
        if (isAxiosError(retryError) && retryError.response?.status === 401) {
          const drift: ApiError = {
            kind: 'unexpected_response',
            detail: 'unauthorised after refresh',
          };
          throw drift;
        }
        // Diger hatalar (sunucu hatasi, zaman asimi, ag) tekrarin kendi
        // hatasi olarak iletiliyor; ilk 401 degil.
        throw retryError;
      }
    },
  );

  return client;
}

/**
 * Her iki ornegin de paylastigi oturum koprusu.
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
 * Sozlesmedeki alti uc noktanin adresi.
 *
 * Uygulamanin icinde sahte veri, sahte dal veya ortama gore degisen bir kod
 * yolu yok; gercek sunucuya gecis tek bir ortam degiskeni. Adresin nasil
 * bulundugu `baseUrl.ts` icinde.
 */
export const baseURL = resolveBaseUrl();

/**
 * Uygulamanin tek yenileme kuyrugu, sozlesme adresine bagli.
 *
 * Iki istemci ornegi de bunu paylasiyor. Yenilemenin sorulacagi yer her zaman
 * sozlesmeyi karsilayan sunucu: refresh token'i o verdi ve yalnizca o
 * dogrulayabilir.
 */
const refreshQueue = createRefreshQueueFor({ baseURL, bridge: delegatingBridge });

export const api = createApiClient({ baseURL, bridge: delegatingBridge, refreshQueue });

/**
 * Sozlesmede yeri olmayan iki ucun istemcisi: secenek listeleri ve gorsel
 * yukleme.
 *
 * Ayni yapilandirma, yalnizca adresi farkli olabilen ikinci bir ornek. Oturum
 * koprusu ve yenileme kuyrugu bilerek paylasiliyor: yukleme kimlik istiyor,
 * kullanicinin tek bir oturumu var ve o oturumu yenileyecek yer her iki
 * durumda da sozlesme adresi. Ayri bir kuyruk iki es zamanli yenileme
 * baslatirdi; kendi adresine bagli bir yenileme ise refresh token'i tezgaha
 * tasir ve tezgah onu tanimadigi icin gecerli bir oturumu kapatirdi.
 *
 * Bu, tezgahtan gelen bir 401'in oturumu asla kapatamayacagi anlamina gelmiyor:
 * sozlesme sunucusuna sorulan yenileme de basarisiz olursa oturum gercekten
 * bitmistir ve kapanir. Degisen sey, kararin dogru sunucuya sorulmasi. Yenileme
 * basarili olup tezgah yeni token'i da reddederse (ornegin tezgah sozlesme
 * sunucusunun token'ini tanimiyorsa) oturum kapanmaz: o istek bir sunucu
 * sapmasi olarak duser ve yalnizca o ekran hata gosterir.
 *
 * Adres verilmediginde `baseURL` ile ayni cikiyor, yani uygulama tek bir
 * sunucu biliyor. Ayrildiklarinda bunu kuran kisi bilerek yapmis oluyor ve
 * hangi iki ucun ayrildigi yalnizca su iki dosyadan okunuyor: `config.ts` ve
 * `media.ts`.
 */
export const standInBaseURL = resolveStandInUrl();

export const standInApi = createApiClient({
  baseURL: standInBaseURL,
  bridge: delegatingBridge,
  refreshQueue,
});
