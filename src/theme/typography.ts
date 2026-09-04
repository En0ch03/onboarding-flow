import type { TextStyle } from 'react-native';

/**
 * Iki aile: basliklarda editoryal bir serif, arayuzde dost canlisi bir sans.
 *
 * Agirlik `fontWeight` ile degil ayri dosya adlariyla veriliyor. Statik font
 * dosyalari yuklendiginde `fontWeight` iOS'ta sentetik kalinlik uretir veya
 * sistem fontuna duser; ailenin kendi kesimini istemek tek dogru yol.
 *
 * Aile yuklenemezse platform kendi varsayilanina duser ve akis calismaya devam
 * eder; yazi tipi bir engel degil.
 */
export const fonts = {
  serifLight: 'Newsreader_300Light',
  serifRegular: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  sansRegular: 'Figtree_400Regular',
  sansMedium: 'Figtree_500Medium',
  sansSemiBold: 'Figtree_600SemiBold',
} as const;

/**
 * Adlandirilmis metin bicimleri. Ekranlar `fontSize` gormez.
 *
 * Renk bilerek disarida birakildi: renk varyanta gore degisiyor, bu olcek ise
 * statik. Ikisini ayni nesnede birlestirmek, olcegi bir cengele bagimli kilardi.
 *
 * Olcek bilerek cesur: bu gorsel yonun en buyuk riski "sablon" hissi ve
 * kucuk basliklarla uygulandiginda o riske dusuyor.
 */
export const type = {
  /** Karsilama ekranlarinin ana cumlesi. */
  display: {
    fontFamily: fonts.serifLight,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  /** Adim ve form basliklari. */
  title: {
    fontFamily: fonts.serifLight,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  /** Uzun basliklarin sigmadigi yerde bir kademe asagi. */
  titleCompact: {
    fontFamily: fonts.serifLight,
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  /** Bolum basligi. */
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  /** Govde metni. */
  body: {
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 25,
  },
  /** Baslik altindaki aciklama satiri. */
  subhead: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  /** Secim karti ve girdi metni. */
  control: {
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 21,
  },
  /** Buton metni. */
  button: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  /** Alan etiketi ve adim sayaci. */
  label: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 17,
  },
  /** Hata metni, sinir aciklamasi, yasal satir. */
  caption: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
