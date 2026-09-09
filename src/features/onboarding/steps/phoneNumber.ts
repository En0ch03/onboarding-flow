import { strings } from '@/constants/strings';

/**
 * Telefon numarasi Turkiye bicimiyle aliniyor: on hane, bes ile baslar.
 *
 * Ulke kodu secici yok ve alanda `+90` sabit duruyor. Ilk pazar Turkiye; bir
 * ulke listesi, kendi basina sunucudan gelmesi gereken ikinci bir taksonomi
 * acardi ve bugun karsiligi olmayan bir soru olurdu.
 */

/** On hane, bes ile baslayan. */
const LENGTH = 10;
const MOBILE_PREFIX = '5';

export type PhoneProblem = 'incomplete' | 'invalid' | null;

/**
 * Kullanicinin yazdigini saklanabilir bir numaraya cevirir.
 *
 * Yazim isaretleri dusuyor, ve alisilmis iki onek de: bastaki sifir ile
 * bastaki ulke kodu. Ikisi de yaygin yazim; bunlari hata sayip kullaniciya
 * geri vermek, duzeltmesi bir satir olan bir seyi ona yikmak olurdu.
 *
 * Kirpma yalnizca uzunluk tuttugunda yapiliyor: `5905551234` bastaki `90`a
 * benziyor ama zaten on hane ve kirpilirsa gecerli bir numara bozulurdu.
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === LENGTH + 2 && digits.startsWith('90')) return digits.slice(2);
  if (digits.length === LENGTH + 1 && digits.startsWith('0')) return digits.slice(1);

  return digits;
}

/**
 * Numaranin sorunu; sorun yoksa `null`.
 *
 * Eksik ile gecersiz ayri: yazmaya devam eden birine "gecersiz" demek, henuz
 * yapmadigi bir hatayi yuzune vurmak olurdu.
 */
export function inspectPhone(value: string | undefined): PhoneProblem {
  const digits = normalizePhone(value ?? '');

  if (digits.length < LENGTH) return 'incomplete';
  if (digits.length > LENGTH) return 'invalid';

  return digits.startsWith(MOBILE_PREFIX) ? null : 'invalid';
}

export const phoneMessages: Record<Exclude<PhoneProblem, null>, string> = {
  incomplete: strings.phone.incomplete,
  invalid: strings.phone.invalid,
};
