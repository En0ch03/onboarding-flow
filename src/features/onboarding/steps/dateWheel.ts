import type { DraftAnswers } from '@/state/onboardingStore';

import { inspectBirthDate } from './birthDate';

/** Dogrulamanin alt siniriyla ayni: cark dogrulamanin reddedecegi yili sunmuyor. */
export const EARLIEST_YEAR = 1900;

/** Bos taslakta cark buradan aciliyor: akla yatkin bir baslangic satiri. */
export const OPENING_AGE = 25;

export type DateParts = { day: number; month: number; year: number };

/**
 * Ayin gun sayisi. `new Date(y, m, 0)` bir onceki ayin son gunu demek; ay
 * burada birden basladigi icin bu, istenen ayin son gunune denk geliyor.
 * Artik yil hesabini elde yapmaya gerek birakmiyor.
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Yillar buyukten kucuge diziliyor: carki acan kisi genc yillari once
 * goruyor ve cogu kullanici oraya birkac satir uzakta duruyor.
 *
 * Ust sinir bu yil, alt sinir 1900. Ust siniri "on sekiz yasindan buyuk"
 * diye kismak, yas kapisini bir dogrulama olmaktan cikarip sessiz bir
 * engele cevirirdi; kapinin ates edebilmesi icin kucuk yasin secilebilir
 * olmasi gerekiyor. Gelecek bir tarih ise zaten hic sunulmuyor.
 */
export function yearRange(today: Date): number[] {
  const newest = today.getFullYear();
  const years: number[] = [];
  for (let year = newest; year >= EARLIEST_YEAR; year -= 1) years.push(year);
  return years;
}

/** Gun, ayin uzunlugunu asamaz: 31 Ocak'tan Subat'a gecince 28'e iniyor. */
export function clampParts(parts: DateParts): DateParts {
  const last = daysInMonth(parts.year, parts.month);
  return parts.day <= last ? parts : { ...parts, day: last };
}

export function openingParts(today: Date): DateParts {
  return { day: 1, month: 1, year: today.getFullYear() - OPENING_AGE };
}

/**
 * Taslakta gecerli bir tarih varsa cark oradan aciliyor. "Gecerli" burada
 * takvimde var olmak demek; yas kapisi ayri bir kontrol ve carkin acilis
 * yerini belirlemesi gerekmiyor - kucuk yasli bir tarih girmis kullanici
 * carki actiginda kendi yazdigini gormeli.
 */
export function partsFromDraft(draft: DraftAnswers['birthDate'], today: Date): DateParts {
  if (!draft) return openingParts(today);

  const problem = inspectBirthDate(draft);
  if (problem === 'incomplete' || problem === 'invalid') return openingParts(today);

  return { day: Number(draft.day), month: Number(draft.month), year: Number(draft.year) };
}

/** Taslak bicimi degismiyor: sunucu esleme katmani ve dogrulama bunu bekliyor. */
export function draftFromParts(parts: DateParts): NonNullable<DraftAnswers['birthDate']> {
  return { day: String(parts.day), month: String(parts.month), year: String(parts.year) };
}

/** Kullanici henuz secim yapmadiysa alan bos gorunur. */
export function hasChosenDate(draft: DraftAnswers['birthDate']): boolean {
  if (!draft) return false;
  return draft.day !== '' && draft.month !== '' && draft.year !== '';
}
