/**
 * Ham renk degerleri. Bu dosya disinda hicbir yerde altili renk kodu bulunmaz.
 *
 * Palet iki varyantli kuruldu cunku koyu varyant sonradan eklenecek bir is degil,
 * urunun birincil gorunumu. Tek varyantla baslayip sonra ikinciyi turetmek,
 * kontrast kararlarini iki kez almak demek olurdu.
 *
 * Renkler akisin arka planindaki gorselden turedi, tersi degil: siyah zemin
 * uzerine kizil bir firca seridi. Vurgu rengi gorselle ayni aileden olmazsa
 * ekranda iki ayri urun goruntusu cikiyor.
 */

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  /** Ekranin zemini. */
  paper: string;
  /** Kart, girdi alani ve secim yuzeyleri. */
  surface: string;
  /** Yuzeyin uzerine binen ikinci kademe (klavye, sayfa alti seritleri). */
  surfaceRaised: string;
  /** Ana metin. */
  ink: string;
  /** Ikincil metin, etiket, aciklama. */
  inkSoft: string;
  /**
   * Birincil eylem, kizil.
   *
   * Kizil yalnizca eylemde, secili kenarlikta ve ilerleme cubugunda kullanilir;
   * genis yuzeylerde ve govde metninde asla. Kirmizinin olculmus kacinma etkisi
   * doygunluk ve kapladigi alanla buyuyor, hue'nun kendisiyle degil.
   */
  clay: string;
  /** Birincil eylemin gradyan alt ucu ve basili hali. */
  clayDeep: string;
  /** Secili durumlarin cok soluk dolgusu. */
  clayTint: string;
  /** Birincil eylemin uzerindeki metin. */
  onClay: string;
  /** Kenarlik ve ayirici cizgi. */
  hairline: string;
  /** Basari. */
  success: string;
  /**
   * Hata. Eylem kiziliyla karistirilmayacak kadar acik ve soluk: ikisi ayni
   * hue ailesinden oldugu icin ayrimi parlaklik tasiyor.
   */
  danger: string;
  /** Hatanin cok soluk dolgusu. */
  dangerTint: string;
  /**
   * Sayfa altindan acilan yuzeylerin arkasindaki perde.
   *
   * Iki varyantta da ayni: perde bir yuzey degil, arkadaki icerigin uzerine
   * cekilen bir orgu. Koyu temada zemine yaklasan bir perde is gormezdi --
   * ayirmasi gereken sey zaten koyu.
   */
  scrim: string;
  /** Arka plan gorselinin uzerindeki kizil aydinlatmanin sicak ucu. */
  glowStrong: string;
  /** Ayni aydinlatmanin derin ucu. */
  glowDeep: string;
  /**
   * Gorselin uzerine cekilen karartma perdesi.
   *
   * Zeminden bir tik daha koyu: perde zeminle ayni olsaydi gorselin bittigi
   * yerle ekranin bittigi yer ayni tonda birlesir ve karartma is gormezdi.
   */
  veil: string;
};

export const palettes: Record<ColorScheme, Palette> = {
  light: {
    paper: '#F5F2ED',
    surface: '#EDE8E1',
    surfaceRaised: '#E6E0D8',
    ink: '#111011',
    inkSoft: '#5E5652',
    clay: '#8B0D1A',
    clayDeep: '#63080F',
    clayTint: 'rgba(139, 13, 26, 0.10)',
    onClay: '#F5F2ED',
    hairline: '#DDD6CE',
    success: '#4A6350',
    danger: '#8A2F2F',
    dangerTint: 'rgba(138, 47, 47, 0.10)',
    scrim: '#000000',
    // Uc perde rolu iki varyantta ayni. Acik varyantta arka plan gorseli
    // cizilmiyor; degerleri bos birakmak yerine koyu varyanttakiyle esitlemek,
    // gorsel bir gun acik varyanta acilirsa perdenin gorselle ayni aileden
    // kalmasini sagliyor.
    glowStrong: '#B51F2E',
    glowDeep: '#4A0710',
    veil: '#050505',
  },
  dark: {
    paper: '#0B0B0B',
    surface: '#151316',
    surfaceRaised: '#1C191D',
    ink: '#F5F2ED',
    inkSoft: '#B5ADA8',
    clay: '#C50337',
    clayDeep: '#8B0D1A',
    clayTint: 'rgba(197, 3, 55, 0.16)',
    // Kizil yeterince koyu: uzerindeki metin kirik beyaz kaliyor ve buton iki
    // varyantta da ayni sesle konusuyor.
    onClay: '#F5F2ED',
    hairline: '#2A2529',
    success: '#8FAE97',
    danger: '#E28B8B',
    dangerTint: 'rgba(226, 139, 139, 0.12)',
    scrim: '#000000',
    glowStrong: '#B51F2E',
    glowDeep: '#4A0710',
    veil: '#050505',
  },
};
