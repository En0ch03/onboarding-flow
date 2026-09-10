/* eslint-disable @typescript-eslint/no-require-imports -- jest taklitleri require ile yukleniyor */
// Test ortami, cihazda calisan yerel modullerin yerine sade taklitler kullanir.
// Amac modulun kendisini dogrulamak degil; onu kullanan mantigi yalitmak.

// Guvenli depolama cihaz anahtarligina yaziyor; testte bellek yeterli.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

// Kalici depo icin paketin kendi taklidi kullaniliyor.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Titresim cihaz donanimina gidiyor; testte cagrilarin yapildigi yeter.
// Sabitler gercek modulden geliyor: elle yazilmis bir alt kume, yeni bir his
// eklendiginde testi yesil birakip cihazda yanlis hissi gecirirdi.
jest.mock('expo-haptics', () => ({
  ...jest.requireActual('expo-haptics'),
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
}));

// Tarih carki yerel bir gorunum aciyor; testte cizilecek bir sey yok. Taklit
// prop'lari agacta tutuyor ve olayi testin tetiklemesine izin veriyor.
jest.mock('@react-native-community/datetimepicker', () => require('@/test/dateTimePickerMock'));
