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
