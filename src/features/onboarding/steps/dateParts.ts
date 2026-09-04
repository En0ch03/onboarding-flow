import type { DraftAnswers } from '@/state/onboardingStore';

/** Dogrulamanin alt siniriyla ayni: liste dogrulamanin reddedecegi yili sunmuyor. */
export const EARLIEST_YEAR = 1900;

/** Uc cevabin her biri ayri verilebiliyor; verilmeyeni `null`. */
export type PartialDate = { day: number | null; month: number | null; year: number | null };

/**
 * Ayin gun sayisi. `new Date(y, m, 0)` bir onceki ayin son gunu demek; ay
 * burada birden basladigi icin bu, istenen ayin son gunune denk geliyor.
 * Artik yil hesabini elde yapmaya gerek birakmiyor.
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Yillar buyukten kucuge: listeyi acan kisi genc yillari once goruyor.
 *
 * Ust sinir bu yil, alt sinir 1900. Ust siniri "on sekiz yasindan buyuk" diye
 * kismak, yas kapisini bir dogrulama olmaktan cikarip sessiz bir engele
 * cevirirdi; kapinin ates edebilmesi icin kucuk yasin secilebilir olmasi
 * gerekiyor. Gelecek bir yil ise zaten hic sunulmuyor.
 */
export function yearRange(today: Date): number[] {
  const newest = today.getFullYear();
  const years: number[] = [];
  for (let year = newest; year >= EARLIEST_YEAR; year -= 1) years.push(year);
  return years;
}

/**
 * Gun listesinin uzunlugu.
 *
 * Ay secilmediyse takvimin en uzun ayi sunuluyor: kullaniciyi "once ayi sec"
 * diye siraya sokmak, uc bagimsiz alanin anlamini bozardi.
 *
 * Ay seciliyken yil henuz verilmemisse artik yil varsayiliyor. Yili beklemek
 * "31 Subat" ara durumunu mumkun kiliyordu ve gun, kullanici yili sectigi
 * anda aciklamasiz kayboluyordu. Artik yil varsaymak yalnizca 29 Subat'i
 * acik birakiyor; onu pesinen elemek, o gun dogmus birine kendi gununu
 * gostermemek olurdu.
 */
export function dayCount(month: number | null, year: number | null): number {
  if (month === null) return 31;
  return daysInMonth(year ?? LEAP_YEAR, month);
}

/** Yil bilinmiyorken ayin en uzun halini veren bir yil. */
const LEAP_YEAR = 2000;

function readPart(text: string | undefined): number | null {
  if (!text || text.trim() === '') return null;
  const value = Number(text);
  return Number.isInteger(value) ? value : null;
}

/** Taslaktaki uc alan birbirinden bagimsiz okunuyor; yarim tarih gecerli bir ara durum. */
export function partsFromDraft(draft: DraftAnswers['birthDate']): PartialDate {
  return {
    day: readPart(draft?.day),
    month: readPart(draft?.month),
    year: readPart(draft?.year),
  };
}

/** Taslak bicimi degismiyor: sunucu esleme katmani ve dogrulama bunu bekliyor. */
export function draftFromParts(parts: PartialDate): NonNullable<DraftAnswers['birthDate']> {
  return {
    day: parts.day === null ? '' : String(parts.day),
    month: parts.month === null ? '' : String(parts.month),
    year: parts.year === null ? '' : String(parts.year),
  };
}
