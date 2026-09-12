import { Platform } from 'react-native';

import { DEV_API_PORT, resolveBaseUrl, resolveStandInUrl } from './baseUrl';

type FakeConfig = {
  hostUri?: string | undefined;
  extra?: { apiUrl?: unknown } | undefined;
};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: {} as FakeConfig },
}));

const Constants = jest.requireMock('expo-constants').default as {
  expoConfig: FakeConfig | null;
};

/** Sunucunun bildirdigi makine. `null` = uretim paketi, hic bildirilmiyor. */
function servedFrom(hostUri: string | null) {
  const extra = Constants.expoConfig?.extra;
  Constants.expoConfig = hostUri === null ? { extra } : { hostUri, extra };
}

/** Depoda derlenmis varsayilan adres. `undefined` = alan hic yok. */
function shippedWith(apiUrl: unknown) {
  const hostUri = Constants.expoConfig?.hostUri;
  Constants.expoConfig = { hostUri, extra: apiUrl === undefined ? {} : { apiUrl } };
}

function runningOn(os: 'ios' | 'android' | 'web') {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}

const originalOS = Platform.OS;
const originalEnv = process.env.EXPO_PUBLIC_API_URL;
const originalStandInEnv = process.env.EXPO_PUBLIC_STANDIN_API_URL;
const originalLocalEnv = process.env.EXPO_PUBLIC_USE_LOCAL_API;

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_STANDIN_API_URL;
  delete process.env.EXPO_PUBLIC_USE_LOCAL_API;
  Constants.expoConfig = {};
  servedFrom('192.168.1.24:8081');
  runningOn('ios');
});

afterAll(() => {
  runningOn(originalOS as 'ios');
  if (originalEnv === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalEnv;
  if (originalStandInEnv === undefined) delete process.env.EXPO_PUBLIC_STANDIN_API_URL;
  else process.env.EXPO_PUBLIC_STANDIN_API_URL = originalStandInEnv;
  if (originalLocalEnv === undefined) delete process.env.EXPO_PUBLIC_USE_LOCAL_API;
  else process.env.EXPO_PUBLIC_USE_LOCAL_API = originalLocalEnv;
});

describe('resolveBaseUrl', () => {
  it('lets an explicit address win over everything else', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api/v1';

    expect(resolveBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('trims an explicit address rather than producing a broken url', () => {
    process.env.EXPO_PUBLIC_API_URL = '  https://api.example.com/api/v1  ';

    expect(resolveBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('derives the address from the machine already serving the bundle', () => {
    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });

  it('keeps a loopback address on iOS, where it means the host machine', () => {
    servedFrom('127.0.0.1:8081');
    runningOn('ios');

    expect(resolveBaseUrl()).toBe(`http://127.0.0.1:${DEV_API_PORT}/api/v1`);
  });

  it('rewrites a loopback address on Android, where it means the device itself', () => {
    // Bu duzeltme olmadan istek emulatorun kendi icine gider ve hicbir sey
    // dinlemedigi icin sessizce duser.
    servedFrom('127.0.0.1:8081');
    runningOn('android');

    expect(resolveBaseUrl()).toBe(`http://10.0.2.2:${DEV_API_PORT}/api/v1`);
  });

  it('rewrites the localhost spelling on Android too', () => {
    servedFrom('localhost:8081');
    runningOn('android');

    expect(resolveBaseUrl()).toBe(`http://10.0.2.2:${DEV_API_PORT}/api/v1`);
  });

  it('leaves a real network address alone on Android', () => {
    servedFrom('192.168.1.24:8081');
    runningOn('android');

    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });

  it('uses the address the repository ships with, so a fresh clone needs no setup', () => {
    shippedWith('https://api.example.com/api/v1');

    expect(resolveBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('still lets an explicit address win over the shipped one', () => {
    shippedWith('https://api.example.com/api/v1');
    process.env.EXPO_PUBLIC_API_URL = 'https://staging.example.com/api/v1';

    expect(resolveBaseUrl()).toBe('https://staging.example.com/api/v1');
  });

  it('trims the shipped address rather than producing a broken url', () => {
    shippedWith('  https://api.example.com/api/v1  ');

    expect(resolveBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('ignores a shipped address that is blank, as if the field were absent', () => {
    shippedWith('   ');

    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });

  it('ignores a shipped address that is not a string', () => {
    shippedWith(42);

    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });

  it('turns to the local server when asked, without anyone typing a machine address', () => {
    shippedWith('https://api.example.com/api/v1');
    process.env.EXPO_PUBLIC_USE_LOCAL_API = '1';

    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });

  it('accepts true as the spelling of that request', () => {
    shippedWith('https://api.example.com/api/v1');
    process.env.EXPO_PUBLIC_USE_LOCAL_API = 'true';

    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });

  it('reads a switched-off flag as off, not as merely present', () => {
    // `=0` yazan biri tam tersini istiyor; varligi dogru saymak sessiz bir
    // yonlendirme olurdu.
    shippedWith('https://api.example.com/api/v1');
    process.env.EXPO_PUBLIC_USE_LOCAL_API = '0';

    expect(resolveBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('keeps an explicit address above the local-server request', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://staging.example.com/api/v1';
    process.env.EXPO_PUBLIC_USE_LOCAL_API = '1';

    expect(resolveBaseUrl()).toBe('https://staging.example.com/api/v1');
  });

  it('falls back to localhost when nothing is serving the bundle', () => {
    servedFrom(null);
    runningOn('web');

    expect(resolveBaseUrl()).toBe(`http://localhost:${DEV_API_PORT}/api/v1`);
  });
});

/**
 * Sozlesmede olmayan iki uc: secenek listeleri ve gorsel yukleme. Bunlarin
 * adresi ayri cozuluyor, cunku sozlesmeyi karsilayan bir sunucunun onlari
 * karsilamasi gerekmiyor.
 */
describe('resolveStandInUrl', () => {
  it('stays on the contract address unless told otherwise, so the app knows one server', () => {
    expect(resolveStandInUrl()).toBe(resolveBaseUrl());
  });

  it('follows the contract address when only that one is configured', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api/v1';

    expect(resolveStandInUrl()).toBe('https://api.example.com/api/v1');
  });

  it('splits off only when a stand-in is named, and leaves the contract address alone', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api/v1';
    process.env.EXPO_PUBLIC_STANDIN_API_URL = 'http://192.168.1.24:4000/api/v1';

    expect(resolveStandInUrl()).toBe('http://192.168.1.24:4000/api/v1');
    expect(resolveBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('trims a named stand-in rather than producing a broken url', () => {
    process.env.EXPO_PUBLIC_STANDIN_API_URL = '  http://192.168.1.24:4000/api/v1  ';

    expect(resolveStandInUrl()).toBe('http://192.168.1.24:4000/api/v1');
  });

  it('follows the shipped address too, so one server stays one server', () => {
    shippedWith('https://api.example.com/api/v1');

    expect(resolveStandInUrl()).toBe('https://api.example.com/api/v1');
  });

  it('can be named on its own, while the contract address is still derived', () => {
    process.env.EXPO_PUBLIC_STANDIN_API_URL = 'http://10.0.0.5:4000/api/v1';

    expect(resolveStandInUrl()).toBe('http://10.0.0.5:4000/api/v1');
    expect(resolveBaseUrl()).toBe(`http://192.168.1.24:${DEV_API_PORT}/api/v1`);
  });
});
