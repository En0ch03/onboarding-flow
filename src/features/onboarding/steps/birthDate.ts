import { strings } from '@/constants/strings';
import type { DraftAnswers } from '@/state/onboardingStore';

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

export const birthDateMessages: Record<Exclude<BirthDateProblem, null>, string> = {
  incomplete: strings.birthDate.incomplete,
  invalid: strings.birthDate.invalid,
  // Yas sinirinin kendisi kodda; metin sozlukte. Sinir degistiginde mesajin
  // da degismesi icin sayiyi metne gomup iki yerde tutmuyoruz.
  too_young: strings.birthDate.tooYoung.replace('{age}', String(MINIMUM_AGE)),
};
