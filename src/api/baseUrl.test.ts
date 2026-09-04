import { Platform } from 'react-native';

import { DEV_API_PORT, resolveBaseUrl } from './baseUrl';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: {} as { hostUri?: string } },
}));

const Constants = jest.requireMock('expo-constants').default as {
  expoConfig: { hostUri?: string } | null;
};

/** Sunucunun bildirdigi makine. `null` = uretim paketi, hic bildirilmiyor. */
function servedFrom(hostUri: string | null) {
  Constants.expoConfig = hostUri === null ? null : { hostUri };
}

function runningOn(os: 'ios' | 'android' | 'web') {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}

const originalOS = Platform.OS;
const originalEnv = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_API_URL;
  servedFrom('192.168.1.24:8081');
  runningOn('ios');
});

afterAll(() => {
  runningOn(originalOS as 'ios');
  if (originalEnv === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalEnv;
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

  it('falls back to localhost when nothing is serving the bundle', () => {
    servedFrom(null);
    runningOn('web');

    expect(resolveBaseUrl()).toBe(`http://localhost:${DEV_API_PORT}/api/v1`);
  });
});
