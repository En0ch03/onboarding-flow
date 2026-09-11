import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';

import { createApiClient, createRefreshQueueFor, type AuthBridge } from './client';
import { normalizeApiError } from './errors';

type Reply = { status: number; data?: unknown };

/**
 * Sunucu yerine gecen adaptor. Gercek bir HTTP katmani olmadan interceptor
 * davranisi test edilebiliyor; asil dogrulanmak istenen sey zaten sunucunun
 * kendisi degil, istemcinin 401 karsisinda ne yaptigi.
 */
function stubServer(handler: (config: InternalAxiosRequestConfig) => Reply) {
  const calls: InternalAxiosRequestConfig[] = [];

  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const reply = handler(config);
    const response = {
      status: reply.status,
      data: reply.data ?? {},
      statusText: '',
      headers: new AxiosHeaders(),
      config,
    };

    if (reply.status >= 200 && reply.status < 300) return response;
    throw new AxiosError('request failed', String(reply.status), config, {}, response);
  };

  return { adapter, calls };
}

function bridgeWith(overrides: Partial<AuthBridge> = {}) {
  const state = { access: 'access_1', refresh: 'refresh_1' };

  const bridge: AuthBridge = {
    getAccessToken: () => state.access,
    getRefreshToken: () => state.refresh,
    onRefreshed: jest.fn((token: string) => {
      state.access = token;
    }),
    onSessionEnded: jest.fn(() => {
      state.access = '';
      state.refresh = '';
    }),
    ...overrides,
  };

  return { bridge, state };
}

const baseURL = 'http://localhost:4000/api/v1';

describe('api client', () => {
  it('attaches the access token to every request', async () => {
    const { bridge } = bridgeWith();
    const server = stubServer(() => ({ status: 200, data: { ok: true } }));
    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    await client.get('/profile');

    expect(server.calls[0]?.headers.get('Authorization')).toBe('Bearer access_1');
  });

  it('refreshes once for three requests that expire together', async () => {
    const { bridge } = bridgeWith();
    let refreshCount = 0;

    const server = stubServer((config) => {
      if (config.url === '/auth/refresh') {
        refreshCount += 1;
        return { status: 200, data: { access_token: 'access_2' } };
      }
      const sent = config.headers.get('Authorization');
      return sent === 'Bearer access_2'
        ? { status: 200, data: { ok: true } }
        : { status: 401, data: { error: 'token_expired' } };
    });

    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    const results = await Promise.all([
      client.get('/profile'),
      client.get('/profile'),
      client.get('/profile'),
    ]);

    expect(refreshCount).toBe(1);
    expect(results.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(bridge.onRefreshed).toHaveBeenCalledTimes(1);
  });

  it('ends the session once when the refresh itself fails', async () => {
    const { bridge } = bridgeWith();

    const server = stubServer((config) =>
      config.url === '/auth/refresh'
        ? { status: 401, data: { error: 'refresh_expired' } }
        : { status: 401, data: { error: 'token_expired' } },
    );

    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    const outcomes = await Promise.allSettled([
      client.get('/profile'),
      client.get('/profile'),
      client.get('/profile'),
    ]);

    expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(true);

    for (const outcome of outcomes) {
      if (outcome.status === 'rejected') {
        expect(normalizeApiError(outcome.reason).kind).toBe('refresh_expired');
      }
    }

    expect(bridge.onSessionEnded).toHaveBeenCalled();
  });

  it('does not retry a request that is still unauthorised after refreshing', async () => {
    const { bridge } = bridgeWith();
    let profileCalls = 0;

    const server = stubServer((config) => {
      if (config.url === '/auth/refresh')
        return { status: 200, data: { access_token: 'access_2' } };
      profileCalls += 1;
      return { status: 401, data: { error: 'token_expired' } };
    });

    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    await expect(client.get('/profile')).rejects.toBeDefined();
    // Bir kez orijinal, bir kez yenilemeden sonra. Ucuncu bir deneme olsaydi
    // istemci sonsuz donguye girerdi.
    expect(profileCalls).toBe(2);
  });

  it('refreshes again after an earlier refresh has finished', async () => {
    const { bridge } = bridgeWith();
    let refreshCount = 0;
    let accepted = 'access_2';

    const server = stubServer((config) => {
      if (config.url === '/auth/refresh') {
        refreshCount += 1;
        accepted = `access_${refreshCount + 1}`;
        return { status: 200, data: { access_token: accepted } };
      }
      return config.headers.get('Authorization') === `Bearer ${accepted}`
        ? { status: 200, data: { ok: true } }
        : { status: 401, data: { error: 'token_expired' } };
    });

    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    await client.get('/profile');
    expect(refreshCount).toBe(1);

    // Ikinci turda sunucu yine sureyi doldurmus sayiyor; kuyruk bosaldigi
    // icin yeni bir yenileme baslamali.
    accepted = 'access_never';
    await client.get('/profile');
    expect(refreshCount).toBe(2);
  });

  it('reports a session end rather than looping when no refresh token is stored', async () => {
    const { bridge } = bridgeWith({ getRefreshToken: () => null });
    const server = stubServer(() => ({ status: 401, data: { error: 'token_expired' } }));
    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    await expect(client.get('/profile')).rejects.toBeDefined();
    expect(server.calls.filter((call) => call.url === '/auth/refresh')).toHaveLength(0);
    expect(bridge.onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it('rejects a refresh response that does not match the contract', async () => {
    const { bridge } = bridgeWith();

    const server = stubServer((config) =>
      config.url === '/auth/refresh'
        ? { status: 200, data: { token: 'wrong field name' } }
        : { status: 401, data: { error: 'token_expired' } },
    );

    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    await expect(client.get('/profile')).rejects.toBeDefined();
    expect(bridge.onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it('ends the session exactly once and reports it when a single refresh fails', async () => {
    const { bridge } = bridgeWith();

    const server = stubServer((config) =>
      config.url === '/auth/refresh'
        ? { status: 401, data: { error: 'refresh_expired' } }
        : { status: 401, data: { error: 'token_expired' } },
    );

    const client = createApiClient({ baseURL, bridge, adapter: server.adapter });

    const reason = await client.get('/profile').then(
      () => null,
      (thrown: unknown) => thrown,
    );

    expect(normalizeApiError(reason).kind).toBe('refresh_expired');
    expect(bridge.onSessionEnded).toHaveBeenCalledTimes(1);
  });
});

/**
 * Yenileme basarili oldu ama tekrarlanan istek dustu. Oturumun gecerli
 * oldugunu yenileme sunucusu soyledi; tekrarin hatasi o istege ait ve
 * kullaniciyi akisin ortasinda oturumdan dusurmemeli.
 */
describe('yenileme basarili, tekrar dusuyor', () => {
  type RetryFailure = { status: number } | 'network';

  /** Ilk deneme 401, yenileme basarili, tekrar verilen sekilde dusuyor. */
  function retryFailsWith(failure: RetryFailure) {
    const { bridge } = bridgeWith();
    let profileCalls = 0;

    const adapter: AxiosAdapter = async (config) => {
      const respond = (status: number, data: unknown) => {
        const response = {
          status,
          data,
          statusText: '',
          headers: new AxiosHeaders(),
          config,
        };
        if (status >= 200 && status < 300) return response;
        throw new AxiosError('request failed', String(status), config, {}, response);
      };

      if (config.url === '/auth/refresh') return respond(200, { access_token: 'access_2' });

      profileCalls += 1;
      if (profileCalls === 1) return respond(401, { error: 'token_expired' });

      // Yanitsiz bir hata: zaman asimi ya da ag kopmasi boyle gorunuyor.
      if (failure === 'network') throw new AxiosError('timeout', 'ECONNABORTED', config);
      return respond(failure.status, { error: 'whatever' });
    };

    const client = createApiClient({ baseURL, bridge, adapter });
    const settle = () =>
      client.get('/profile').then(
        () => {
          throw new Error('request should have failed');
        },
        (thrown: unknown) => thrown,
      );

    return { bridge, settle, profileCalls: () => profileCalls };
  }

  it('tekrar 401 alirsa oturum kapanmiyor ve hata oturum sonu sayilmiyor', async () => {
    const { bridge, settle, profileCalls } = retryFailsWith({ status: 401 });

    const reason = await settle();

    expect(normalizeApiError(reason)).toEqual({
      kind: 'unexpected_response',
      detail: 'unauthorised after refresh',
    });
    expect(bridge.onSessionEnded).not.toHaveBeenCalled();
    expect(profileCalls()).toBe(2);
  });

  it('tekrar 500 alirsa oturum kapanmiyor ve hata sunucu hatasi', async () => {
    const { bridge, settle } = retryFailsWith({ status: 500 });

    const reason = await settle();

    expect(normalizeApiError(reason).kind).toBe('server_error');
    expect(bridge.onSessionEnded).not.toHaveBeenCalled();
  });

  it('tekrar zaman asimina ugrarsa oturum kapanmiyor ve hata ag hatasi', async () => {
    const { bridge, settle } = retryFailsWith('network');

    const reason = await settle();

    expect(normalizeApiError(reason).kind).toBe('network');
    expect(bridge.onSessionEnded).not.toHaveBeenCalled();
  });
});

/**
 * Sozlesme disi uclarin ayri bir adrese gitmesi ikinci bir istemci ornegi
 * dogurdu. Yenileme tek bir sey olmak zorunda: hem kime sorulacagi hem kac kez
 * sorulacagi uygulamanin tamamina ait, tek bir ornege degil.
 */
describe('paylasilan yenileme', () => {
  const CONTRACT = 'https://gercek.example/api/v1';
  const STANDIN = 'http://192.168.1.24:4000/api/v1';

  function twoClients() {
    const { bridge } = bridgeWith();
    const refreshCalls: InternalAxiosRequestConfig[] = [];

    const { adapter, calls } = stubServer((config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls.push(config);
        return { status: 200, data: { access_token: 'access_2' } };
      }
      // Ilk deneme suresi dolmus sayiliyor; yenilemeden sonraki tekrar geciyor.
      const authorization = config.headers?.get?.('Authorization');
      if (authorization === 'Bearer access_2') return { status: 200, data: {} };
      return { status: 401, data: { error: 'token_expired' } };
    });

    const queue = createRefreshQueueFor({ baseURL: CONTRACT, bridge, adapter });

    return {
      bridge,
      calls,
      refreshCalls,
      contract: createApiClient({ baseURL: CONTRACT, bridge, adapter, refreshQueue: queue }),
      standIn: createApiClient({ baseURL: STANDIN, bridge, adapter, refreshQueue: queue }),
    };
  }

  it('iki ornek ayni anda 401 alsa bile yenileme bir kez soruluyor', async () => {
    const { contract, standIn, refreshCalls } = twoClients();

    await Promise.all([contract.get('/profile'), standIn.get('/config/options')]);

    expect(refreshCalls).toHaveLength(1);
  });

  it('yenileme sozlesme adresine gidiyor, tezgah adresine degil', async () => {
    const { standIn, refreshCalls } = twoClients();

    await standIn.get('/config/options');

    expect(refreshCalls).toHaveLength(1);
    expect(refreshCalls[0]?.baseURL).toBe(CONTRACT);
  });

  /**
   * Yorumun soz vermedigi yarisi. Tezgahtan gelen 401 oturumu "asla"
   * kapatmiyor degil: karar dogru sunucuya soruluyor ve o sunucu da hayir
   * derse oturum gercekten bitmistir.
   */
  it('sozlesme yenilemesi de basarisizsa oturum gercekten kapaniyor', async () => {
    const { bridge } = bridgeWith({ getRefreshToken: () => null });

    const { adapter } = stubServer(() => ({ status: 401, data: { error: 'token_expired' } }));
    const queue = createRefreshQueueFor({ baseURL: CONTRACT, bridge, adapter });
    const standIn = createApiClient({ baseURL: STANDIN, bridge, adapter, refreshQueue: queue });

    await expect(standIn.get('/config/options')).rejects.toBeDefined();

    expect(bridge.onSessionEnded).toHaveBeenCalled();
  });

  it('tezgahtan gelen 401 gecerli bir oturumu kapatmiyor', async () => {
    const { standIn, bridge } = twoClients();

    await standIn.get('/config/options');

    expect(bridge.onSessionEnded).not.toHaveBeenCalled();
  });

  /**
   * Tezgah bayraksiz acildiginda yasanan ariza: tezgah sozlesme sunucusunun
   * token'ini tanimiyor, yenileme sozlesme adresinde basariyor ve tezgah
   * yeni token'i da reddediyor. Fotograf adiminda kullanici karsilama
   * ekranina dusuyordu.
   */
  it('tezgah yenilemeden sonra da 401 donerse oturum kapanmiyor', async () => {
    const { bridge } = bridgeWith();
    const refreshCalls: InternalAxiosRequestConfig[] = [];

    const { adapter } = stubServer((config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls.push(config);
        return { status: 200, data: { access_token: 'access_2' } };
      }
      return { status: 401, data: { error: 'token_expired' } };
    });

    const queue = createRefreshQueueFor({ baseURL: CONTRACT, bridge, adapter });
    const standIn = createApiClient({ baseURL: STANDIN, bridge, adapter, refreshQueue: queue });

    const reason = await standIn.post('/upload', {}).then(
      () => null,
      (thrown: unknown) => thrown,
    );

    expect(refreshCalls).toHaveLength(1);
    expect(refreshCalls[0]?.baseURL).toBe(CONTRACT);
    expect(bridge.onSessionEnded).toHaveBeenCalledTimes(0);
    expect(normalizeApiError(reason).kind).toBe('unexpected_response');
  });
});
