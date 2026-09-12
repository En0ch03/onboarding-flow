import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Gelistirme sunucusunun dinledigi kapi. */
export const DEV_API_PORT = 4000;

/** Bayragin acik sayildigi yazimlar. Geri kalan her sey kapali. */
const TRUTHY = new Set(['1', 'true']);

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
 * Dort kademe, bu sirayla:
 *
 * 1. `EXPO_PUBLIC_API_URL` verilmisse o kullanilir. Baska bir backend'e
 *    gecis bundan ibaret; uygulamanin icinde ortama gore dallanan bir kod
 *    yolu yok.
 *
 * 2. Yerel sunucu bayragi aciksa adres, uygulamanin **zaten bagli oldugu**
 *    gelistirme makinesinden turetilir. Depoyla birlikte gelen sunucuyu
 *    kullanmak isteyen kisinin yapmasi gereken tek sey bu; makinesinin
 *    adresini bilmek zorunda degil.
 *
 * 3. Ikisi de yoksa uygulamanin **kendi yapilandirmasindaki** adres
 *    kullanilir. Bu, depoyu klonlayan birinin hicbir sey ayarlamadan gercek
 *    API'ye baglanmasini sagliyor: calistirmanin bedeli okunacak bir yer
 *    tutucu degil, tek bir komut.
 *
 * 4. Yapilandirmada da adres yoksa ikinci kademenin turetmesine dusuluyor.
 *    Depoyu catallayip o alani bosaltan biri icin uygulama calisir kaliyor;
 *    adressiz bir istemci hicbir istek gondermez ve sebebini de gostermez.
 */
export function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured;

  if (!wantsLocalApi()) {
    const shipped = shippedApiUrl();
    if (shipped) return shipped;
  }

  return localApiUrl();
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
 * Uygulamanin kendi yapilandirmasinda duran adres.
 *
 * Deger koda gomulmuyor, yapilandirma alaninda duruyor: degistirmek isteyen
 * kisinin okumasi gereken tek bir yer olmali ve bu yer kod olmamali.
 *
 * Tur kontrolu ihmal degil sinir: burada duran deger bir JSON dosyasindan
 * geliyor ve yanlis yazilmis bir alan yuzunden uygulamanin `undefined`
 * iceren bir adrese istek atmasi, sebebi gorunmeyen bir ariza olur.
 */
function shippedApiUrl(): string | null {
  const value = Constants.expoConfig?.extra?.apiUrl;
  if (typeof value !== 'string') return null;
  return value.trim() || null;
}

/**
 * Yerel sunucuya donme istegi. Adres degil bir istek; sebebi `hostFor`
 * altinda anlatiliyor.
 *
 * Degisken **adiyla, dogrudan** okunuyor: `process.env[birDegisken]`
 * bicimindeki okuma paketleyici tarafindan gorulmez ve yalnizca gelistirmede
 * calisir, paketlenmis uygulamada sessizce bos doner. Ayni dosyadaki diger
 * iki degisken de bu yuzden dogrudan okunuyor; kural lint tarafindan
 * korunuyor.
 *
 * Bayragin varligi degil degeri okunuyor: `=0` yazan biri tam tersini
 * istiyor ve bunu varlik sayan bir kontrol onu sessizce yerel sunucuya
 * gonderirdi. Bosluk ve buyuk harf tolere ediliyor; kimse bir bayragi
 * yazimi yuzunden kaybetmemeli.
 */
function wantsLocalApi(): boolean {
  const value = process.env.EXPO_PUBLIC_USE_LOCAL_API?.trim().toLowerCase();
  return TRUTHY.has(value ?? '');
}

/** Depoyla gelen sunucunun adresi, bagli olunan makineden turetilerek. */
function localApiUrl(): string {
  // "192.168.1.24:8081" veya "127.0.0.1:8081" bicimindedir; yalnizca uretim
  // paketlerinde tanimsiz olur ve orada zaten yukaridaki adres beklenir.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  return `http://${hostFor(host)}:${DEV_API_PORT}/api/v1`;
}

/**
 * Sunucunun bildirdigi makineyi cihazin ulasabilecegi bir adrese cevirir.
 *
 * Adresi elle yazdirmak yerine bagli olunan makineyi okumanin sebebi burada:
 * `localhost` telefonda telefonun kendisi, Android emulatorunde emulatorun
 * kendisi demek - gelistirme makinesi degil. Tek bir dogru degeri olmayan bir
 * seyi README'de yazdirmak, uc ortamin ucunde farkli bir deger istemek olur.
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
