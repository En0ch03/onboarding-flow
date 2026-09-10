import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Gelistirme sunucusunun dinledigi kapi. */
export const DEV_API_PORT = 4000;

/**
 * Android emulatorunun ana makineye verdigi takma ad.
 *
 * Emulatorun icinde `localhost` emulatorun kendisi demek; ana makineye bu
 * adresten ulasiliyor. Kaynak: Android emulator agi belgelenmis davranisi.
 */
const ANDROID_EMULATOR_HOST = '10.0.2.2';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

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

  return `http://${hostFor(host)}:${DEV_API_PORT}/api/v1`;
}

/**
 * Sozlesmede yeri olmayan iki ucun adresi: secenek listeleri ve gorsel
 * yukleme.
 *
 * Sozlesme alti uc nokta tanimliyor ve bu ikisi onlarin arasinda degil;
 * ikisini de biz istedik. Dolayisiyla sozlesmeyi eksiksiz karsilayan bir
 * sunucunun bunlari da karsilamasi beklenemez, ve karsilamadiginda uygulamanin
 * elinde onlari soracak baska bir adres olmali.
 *
 * Varsayilan bilerek "ayni adres": hicbir sey soylenmezse uygulama tek bir
 * sunucu biliyor ve bugunku davranis aynen suruyor. Ikinci adres ancak biri
 * onu acikca verdiginde doguyor, yani ayrisma kazara olusamiyor ve kurulum
 * yapan kisi onu bilerek istemis oluyor.
 */
export function resolveStandInUrl(): string {
  return process.env.EXPO_PUBLIC_STANDIN_API_URL?.trim() || resolveBaseUrl();
}

/**
 * Sunucunun bildirdigi makineyi cihazin ulasabilecegi bir adrese cevirir.
 *
 * Tek duzeltme Android'de loopback icin. Expo varsayilan olarak LAN uzerinden
 * sunuyor ve o durumda gelen deger zaten dogru; ama `--localhost` ile
 * baslatildiginda `127.0.0.1` geliyor ve bu adres emulatorun **icinde**
 * emulatorun kendisini gosteriyor. Boyle bir kurulumda hicbir istek gitmez ve
 * hata sebebi gostermez. iOS simulatoru ana makinenin loopback'ini paylastigi
 * icin orada boyle bir duzeltmeye gerek yok.
 */
function hostFor(host: string | undefined): string {
  if (!host) return 'localhost';
  if (Platform.OS === 'android' && LOOPBACK.has(host)) return ANDROID_EMULATOR_HOST;
  return host;
}
