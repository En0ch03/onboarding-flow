import type { OptionGroups } from '@/api/schemas';
import { useOnboardingStore, type DraftAnswers } from '@/state/onboardingStore';

import type { StepQuestion } from '../engine/types';
import { pruneAnswers } from './answerHygiene';
import { resolveSteps } from './resolveSteps';
import { steps } from './steps';

/**
 * Taslagi sunucunun sundugu seceneklerle uzlastirir.
 *
 * Iki is birden yapiyor ve ikincisi olmadan birincisi yarim kaliyor:
 * sunucunun artik sunmadigi cevaplar dusuyor, **ve** bir cevabi elinden
 * alinan adim kullaniciya yeniden soruluyor. Yalnizca cevabi dusurmek,
 * kullanicinin o adimi hic gormeden akisi bitirmesine izin veriyordu -
 * tamamlanmis isaret yerinde kaliyor ve akis motoru en bastaki eksik adimi
 * yeniden hesaplamiyor.
 *
 * Hicbir sey dusmediyse hicbir sey olmuyor: her acilista kullaniciyi geri
 * sarmak, akisin ortasindaki birini nedensiz geriye atardi.
 */
export function reconcileDraftWithOptions(options: OptionGroups): void {
  const store = useOnboardingStore.getState();

  const cleaned = pruneAnswers(store.answers, options);
  if (cleaned === store.answers) return;

  store.replaceAnswers(cleaned);

  // Geri sarma yalnizca **cevabi elinden alinan** adima. En bastaki eksik
  // adima sarmak, hic dokunmadigimiz bir eksigi bahane edip kullaniciyi
  // akisin basina atardi.
  const touched = changedAnswers(store.answers, cleaned);
  const missing = resolveSteps(steps, options).find(
    (step) =>
      (step.questions ?? []).some((question) => touched.has(question.answer)) &&
      !step.isComplete(cleaned),
  );

  if (missing !== undefined) store.rewindTo(missing.id);
}

function changedAnswers(before: DraftAnswers, after: DraftAnswers): Set<StepQuestion['answer']> {
  const touched = new Set<StepQuestion['answer']>();
  if (before.gender !== after.gender) touched.add('gender');

  for (const key of ['audience', 'intent', 'interests'] as const) {
    if ((before[key]?.length ?? 0) !== (after[key]?.length ?? 0)) touched.add(key);
  }

  return touched;
}
