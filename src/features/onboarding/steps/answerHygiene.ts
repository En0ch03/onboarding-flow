import type { OptionGroups } from '@/api/schemas';
import type { DraftAnswers } from '@/state/onboardingStore';

import { interestsForIntent } from './interestsGroup';

function served(options: OptionGroups, key: string): Set<string> | null {
  const group = options[key];
  return group ? new Set(group.options.map((option) => option.id)) : null;
}

/** Verilmemis bir alani `undefined` ile doldurmuyor; hic yoksa yok kaliyor. */
function assign(
  answers: DraftAnswers,
  key: 'audience' | 'intent' | 'interests',
  value: string[] | undefined,
): void {
  if (value === undefined) delete answers[key];
  else answers[key] = value;
}

function keep(ids: string[] | undefined, valid: Set<string> | null): string[] | undefined {
  if (ids === undefined) return undefined;
  if (valid === null) return ids;
  return ids.filter((id) => valid.has(id));
}

/**
 * Sunucunun artik sunmadigi cevaplari taslaktan dusurur.
 *
 * Secenek listeleri sunucudan geliyor ve oradan bir secenek kaldirilabiliyor.
 * Kaldirildiginda kullanicinin o cevabi bir hayalete donusuyordu: ekranda
 * hicbir sey secili gorunmuyor ama adim tamamlanmis sayiliyor, kullanici
 * hicbir secim gormeden ileri gecebiliyor ve olu kimlik sunucuya geri
 * yaziliyordu.
 *
 * Temizlik tek yerde ve tek anda yapiliyor: listeler alindiktan hemen sonra.
 * Ekran, tamamlanma kontrolu ve sunucuya yazma o andan sonra ayni gercegi
 * goruyor.
 *
 * Grup hic gelmediyse cevaba dokunulmuyor: eksik bir liste, cevabin gecersiz
 * oldugu anlamina gelmiyor.
 */
export function pruneAnswers(answers: DraftAnswers, options: OptionGroups): DraftAnswers {
  const next: DraftAnswers = { ...answers };
  // Cevabin hangi alanini hangi grubun karsiladigi istemcide sayiliyor:
  // taslak alan adlariyla grup anahtarlarinin eslemesi sozlesmede yok.
  // Sunucu yeni bir grup eklerse bu liste de buyumeli.

  const genders = served(options, 'gender');
  if (next.gender !== undefined && genders !== null && !genders.has(next.gender)) {
    delete next.gender;
  }

  assign(next, 'audience', keep(next.audience, served(options, 'audience')));
  assign(next, 'intent', keep(next.intent, served(options, 'intent')));
  // Ilgi alanlari grubu niyete gore degisiyor; temizlik once niyet
  // temizlendikten sonra dogru grubu soruyor.
  assign(next, 'interests', interestsForIntent(next.interests, next.intent, options));

  // Hicbir sey dusmediyse ayni nesne donuyor: cagiran, temizligin gercekten
  // bir sey degistirip degistirmedigini referans karsilastirmasiyla anlasin.
  return same(answers, next) ? answers : next;
}

function same(before: DraftAnswers, after: DraftAnswers): boolean {
  if (before.gender !== after.gender) return false;
  return (['audience', 'intent', 'interests'] as const).every((key) => {
    const a = before[key];
    const b = after[key];
    if (a === undefined || b === undefined) return a === b;
    return a.length === b.length && a.every((id, index) => id === b[index]);
  });
}
