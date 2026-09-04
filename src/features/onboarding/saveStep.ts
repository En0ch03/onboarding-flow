import { patchProfile } from '@/api/endpoints';
import { patchFromAnswers } from '@/state/profileMapping';
import type { DraftAnswers } from '@/state/onboardingStore';

/**
 * Bir adimin cevabini sunucuya yazar.
 *
 * Tek buyuk gonderim yerine adim basina gonderim: akis ortasinda kesilse bile
 * sunucu tarafi cihaz kadar guncel kaliyor ve sozlesmenin kismi profil
 * kabulu birebir kullaniliyor.
 */
export async function saveStep(stepId: string, answers: DraftAnswers): Promise<void> {
  const patch = patchFromAnswers(answers, stepId);
  if (Object.keys(patch).length === 0) return;

  await patchProfile(patch);
}
