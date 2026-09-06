/**
 * Ham renk degerleri. Bu dosya disinda hicbir yerde altili renk kodu bulunmaz.
 *
 * Palet iki varyantli kuruldu cunku koyu varyant sonradan eklenecek bir is degil,
 * urunun birincil gorunumu. Tek varyantla baslayip sonra ikinciyi turetmek,
 * kontrast kararlarini iki kez almak demek olurdu.
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
  /** Birincil eylem rengi. */
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
   * Hata. Doygun kirmizi degil: kirmizinin olculmus etkisi arzu ekseninde ve
   * degerlendirme baglaminda kacinma uretiyor; bir kayit akisi bastan sona
   * degerlendirme baglami. Yasak hue duzeyinde degil doygunluk duzeyinde.
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
};

export const palettes: Record<ColorScheme, Palette> = {
  light: {
    paper: '#FBF8F3',
    surface: '#F4EFE7',
    surfaceRaised: '#EFE8DD',
    ink: '#1A1614',
    inkSoft: '#6B6259',
    clay: '#7A4A3A',
    clayDeep: '#5F3729',
    clayTint: 'rgba(122, 74, 58, 0.08)',
    onClay: '#FBF8F3',
    hairline: '#E3DCD1',
    success: '#4A6350',
    danger: '#8A4A42',
    dangerTint: 'rgba(138, 74, 66, 0.08)',
    scrim: '#000000',
  },
  dark: {
    paper: '#14110F',
    surface: '#1E1A17',
    surfaceRaised: '#262019',
    ink: '#F2EDE6',
    inkSoft: '#A69C91',
    clay: '#C08668',
    clayDeep: '#9B6647',
    clayTint: 'rgba(192, 134, 104, 0.14)',
    // Koyu varyantta birincil buton acik renkli, uzerindeki metin koyu olur.
    onClay: '#14110F',
    hairline: '#2E2823',
    success: '#8FAE97',
    danger: '#D89A92',
    dangerTint: 'rgba(216, 154, 146, 0.12)',
    scrim: '#000000',
  },
};
