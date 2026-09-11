import type { TextStyle } from 'react-native';

/**
 * Iki aile: basliklarda yuksek kontrastli bir display serifi, arayuzde dost
 * canlisi bir sans.
 *
 * Agirlik `fontWeight` ile degil ayri dosya adlariyla veriliyor. Statik font
 * dosyalari yuklendiginde `fontWeight` iOS'ta sentetik kalinlik uretir veya
 * sistem fontuna duser; ailenin kendi kesimini istemek tek dogru yol.
 *
 * Aile yuklenemezse platform kendi varsayilanina duser ve akis calismaya devam
 * eder; yazi tipi bir engel degil.
 */
export const fonts = {
  serifSemiBold: 'Fraunces_600SemiBold',
  sansMedium: 'Figtree_500Medium',
  sansSemiBold: 'Figtree_600SemiBold',
} as const;

/**
 * Adlandirilmis metin bicimleri. Ekranlar `fontSize` gormez.
 *
 * Renk bilerek disarida birakildi: renk varyanta gore degisiyor, bu olcek ise
 * statik. Ikisini ayni nesnede birlestirmek, olcegi bir cengele bagimli kilardi.
 *
 * Basliklar ince degil dolgun: "tok" gorunmenin yolu boyuttan cok kontrasttan
 * ve agirliktan geciyor. Ince bir serif buyutuldugunde daha buyuk degil daha
 * kirilgan gorunuyor.
 */
export const type = {
  /** Karsilama ekranlarinin ana cumlesi. */
  display: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.6,
  },
  /** Adim ve form basliklari. */
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  /** Uzun basliklarin sigmadigi yerde bir kademe asagi. */
  titleCompact: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  /** Bolum basligi. */
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 23,
  },
  /** Govde metni. */
  body: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 26,
  },
  /** Baslik altindaki aciklama satiri. */
  subhead: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 23,
  },
  /** Secim karti, cip ve girdi metni. */
  control: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  /** Buton metni. */
  button: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 21,
  },
  /** Alan etiketi ve adim sayaci. */
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  /** Hata metni, sinir aciklamasi, yasal satir. */
  caption: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
