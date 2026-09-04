import { strings } from '@/constants/strings';
import type { DraftAnswers } from '@/state/onboardingStore';

/**
 * Yasal kapi ve bu yuzden istemcide.
 *
 * Sunucudan gelen bir sayiya baglamak, liste gelmediginde kapinin ne olacagi
 * sorusunu aciyor: acik birakmak kabul edilemez, kapatmak uygulamayi
 * kullanilmaz yapiyor. Sabit bir sinir her iki durumda da ayni davraniyor.
 */
export const MINIMUM_AGE = 18;

export type BirthDateProblem = 'incomplete' | 'invalid' | 'too_young' | null;

/**
 * Tarih dogrulamasi.
 *
 * `new Date(1996, 1, 31)` sessizce 2 Mart'a kayiyor; kontrol bu yuzden geri
 * okuma yapiyor. Kullanicinin yazdigi tarih varolmayan bir tarihse bunu
 * soylemek, sessizce baska bir tarihi kaydetmekten iyi.
 */
export function inspectBirthDate(value: DraftAnswers['birthDate']): BirthDateProblem {
  if (!value) return 'incomplete';

  const { day, month, year } = value;
  if (day.trim() === '' || month.trim() === '' || year.trim() === '') return 'incomplete';

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return 'invalid';
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return 'invalid';

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return 'invalid';
  }

  const now = new Date();
  if (date.getTime() > now.getTime()) return 'invalid';

  return ageOn(date, now) < MINIMUM_AGE ? 'too_young' : null;
}

export function ageOn(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * Taslaktan okunan yas; tarih dogrulamadan gecmiyorsa `null`.
 *
 * Yarim, takvimde olmayan veya yas sinirinin altinda bir taslak yas
 * uretmiyor. Son sart savunma amacli: kapiyi gecmeden yasin gosterildigi
 * ekrana gelinemiyor.
 */
export function ageFromDraft(value: DraftAnswers['birthDate']): number | null {
  if (value === undefined || inspectBirthDate(value) !== null) return null;

  const birth = new Date(Number(value.year), Number(value.month) - 1, Number(value.day));
  return ageOn(birth, new Date());
}

export const birthDateMessages: Record<Exclude<BirthDateProblem, null>, string> = {
  incomplete: strings.birthDate.incomplete,
  invalid: strings.birthDate.invalid,
  // Yas sinirinin kendisi kodda; metin sozlukte. Sinir degistiginde mesajin
  // da degismesi icin sayiyi metne gomup iki yerde tutmuyoruz.
  too_young: strings.birthDate.tooYoung.replace('{age}', String(MINIMUM_AGE)),
};
