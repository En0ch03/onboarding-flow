import type { AxiosInstance } from 'axios';

/**
 * Kurulan her axios ornegi adresiyle birlikte kaydediliyor. Modul duzeyindeki
 * baglamanin tek gozlem noktasi bu: yenileme istemcisi disari verilmiyor ve
 * hangi adrese bagli oldugu baska turlu gorulemiyor.
 */
const createdBaseUrls: (string | undefined)[] = [];

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    create: (config: { baseURL?: string }) => {
      createdBaseUrls.push(config?.baseURL);
      return actual.create(config);
    },
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: '192.168.1.24:8081' } },
}));

/**
 * Bu dosya `./client`'i **mock'lamiyor** ve sebebi bu.
 *
 * `config.ts` ve `media.ts` testleri istemciyi mock'ladigi icin yalnizca
 * "hangi sembol cagrildi"yi gorebiliyor; iki sembolun ayni nesne olup
 * olmadigini goremezler. Ayrismanin gercekten dogdugu -- yani ikinci adresin
 * bir ise yaradigi -- ancak gercek ornekler kurularak sinanabiliyor.
 */
function loadClient(env: Record<string, string | undefined>): {
  api: AxiosInstance;
  standInApi: AxiosInstance;
} {
  const previous = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  createdBaseUrls.length = 0;

  let loaded!: { api: AxiosInstance; standInApi: AxiosInstance };
  jest.isolateModules(() => {
    loaded = require('./client') as { api: AxiosInstance; standInApi: AxiosInstance };
  });

  process.env = previous;
  return loaded;
}

describe('iki adres', () => {
  it('hicbir sey verilmediginde uygulama tek bir sunucu biliyor', () => {
    const { api, standInApi } = loadClient({
      EXPO_PUBLIC_API_URL: undefined,
      EXPO_PUBLIC_STANDIN_API_URL: undefined,
    });

    expect(standInApi.defaults.baseURL).toBe(api.defaults.baseURL);
  });

  it('yalniz sozlesme adresi verildiginde de tek sunucu kaliyor', () => {
    const { api, standInApi } = loadClient({
      EXPO_PUBLIC_API_URL: 'https://gercek.example/api/v1',
      EXPO_PUBLIC_STANDIN_API_URL: undefined,
    });

    expect(api.defaults.baseURL).toBe('https://gercek.example/api/v1');
    expect(standInApi.defaults.baseURL).toBe('https://gercek.example/api/v1');
  });

  it('tezgah adresi verildiginde iki ornek gercekten ayrisiyor', () => {
    const { api, standInApi } = loadClient({
      EXPO_PUBLIC_API_URL: 'https://gercek.example/api/v1',
      EXPO_PUBLIC_STANDIN_API_URL: 'http://192.168.1.24:4000/api/v1',
    });

    expect(api.defaults.baseURL).toBe('https://gercek.example/api/v1');
    expect(standInApi.defaults.baseURL).toBe('http://192.168.1.24:4000/api/v1');
    // Ayni nesne olsalardi adreslerden biri digerini eziyor olurdu.
    expect(standInApi).not.toBe(api);
  });
});

/**
 * Yenileme, oturumu veren sunucuya sorulmali. Tezgah adresine sorulsaydi iki
 * sey birden olurdu: gercek sunucunun refresh token'i oraya tasinirdi, ve
 * tezgah onu tanimadigi icin gecerli bir oturum kapanirdi.
 */
describe('yenilemenin adresi', () => {
  const CONTRACT = 'https://gercek.example/api/v1';
  const STANDIN = 'http://192.168.1.24:4000/api/v1';

  it('adresler ayrisirken bile yenileme istemcisi tezgaha baglanmiyor', () => {
    loadClient({
      EXPO_PUBLIC_API_URL: CONTRACT,
      EXPO_PUBLIC_STANDIN_API_URL: STANDIN,
    });

    // Uc ornek kuruluyor: sozlesme istemcisi, paylasilan yenileme istemcisi,
    // tezgah istemcisi. Tezgah adresine bagli olan yalnizca sonuncusu.
    expect(createdBaseUrls.filter((url) => url === STANDIN)).toHaveLength(1);
    expect(createdBaseUrls.filter((url) => url === CONTRACT)).toHaveLength(2);
  });

  it('tek sunucuya cozuldugunde de fazladan yenileme istemcisi kurulmuyor', () => {
    loadClient({
      EXPO_PUBLIC_API_URL: CONTRACT,
      EXPO_PUBLIC_STANDIN_API_URL: undefined,
    });

    // Ayri bir kuyruk kurulsaydi dorduncu bir ornek olurdu.
    expect(createdBaseUrls).toHaveLength(3);
  });
});
