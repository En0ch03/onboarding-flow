import Constants from 'expo-constants';

/** Gelistirme sunucusunun dinledigi kapi. */
export const DEV_API_PORT = 4000;

/**
 * Uygulamanin sunucu hakkinda bildigi tek sey.
 *
 * Uc kademe, bu sirayla:
 *
 * 1. `EXPO_PUBLIC_API_URL` verilmisse o kullanilir. Gercek sunucuya gecis
 *    bundan ibaret; uygulamanin icinde ortama gore dallanan bir kod yolu yok.
 *
 * 2. Verilmemisse adres, uygulamanin **zaten bagli oldugu** gelistirme
 *    makinesinden turetilir. Expo, paketi hangi adresten sunuyorsa sunucu da
 *    orada calisiyor demektir.
 *
 *    Bu kademe kurulumdaki en yaygin hatayi ortadan kaldiriyor: `localhost`
 *    telefonda telefonun kendisi, Android emulatorunde ise emulatorun kendisi
 *    demek - gelistirme makinesi degil. Adresi elle yazdirmak yerine, bagli
 *    olunan makineyi okumak dogru adresi her uc durumda da veriyor:
 *    simulator, emulator ve ayni agdaki fiziksel cihaz.
 *
 * 3. Ikisi de yoksa `localhost` - web ve testler icin makul varsayilan.
 */
export function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured;

  // "192.168.1.24:8081" veya "127.0.0.1:8081" bicimindedir; yalnizca uretim
  // paketlerinde tanimsiz olur ve orada zaten yukaridaki degisken beklenir.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  if (host) return `http://${host}:${DEV_API_PORT}/api/v1`;

  return `http://localhost:${DEV_API_PORT}/api/v1`;
}
