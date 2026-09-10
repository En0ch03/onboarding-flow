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

  it('tezgahtan gelen 401 gecerli bir oturumu kapatmiyor', async () => {
    const { standIn, bridge } = twoClients();

    await standIn.get('/config/options');

    expect(bridge.onSessionEnded).not.toHaveBeenCalled();
  });
});
