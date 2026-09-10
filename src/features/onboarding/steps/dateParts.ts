import type { DraftAnswers } from '@/state/onboardingStore';

/** Dogrulamanin alt siniriyla ayni: cark dogrulamanin reddedecegi yili sunmuyor. */
export const EARLIEST_YEAR = 1900;

/** Uc cevabin her biri ayri verilebiliyor; verilmeyeni `null`. */
export type PartialDate = { day: number | null; month: number | null; year: number | null };

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

/**
 * Uclu taslaktan takvimdeki nokta; tarih yarim veya takvimde yoksa `null`.
 *
 * `new Date(2023, 1, 31)` sessizce 3 Mart'a kayiyor, bu yuzden geri okuma
 * yapiliyor. Kaymis bir tarihi carkin acilis yeri olarak kullanmak, kullaniciya
 * hic vermedigi bir cevabi gostermek olurdu.
 */
export function dateFromParts(parts: PartialDate): Date | null {
  const { day, month, year } = parts;
  if (day === null || month === null || year === null) return null;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Carkin verdigi tarih taslagin uclu bicimine donuyor; ay burada birden basliyor. */
export function partsFromDate(date: Date): PartialDate {
  return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
}
