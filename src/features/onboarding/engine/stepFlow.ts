import type { DraftAnswers } from '@/state/onboardingStore';

import type { StepDefinition } from './types';

/**
 * Akisin butun mantigi saf fonksiyonlarda.
 *
 * Cengelden ayri durmalari test edilebilirlik icin: bir adim ekleyip
 * ilerleme sayacinin dogru davrandigini gormek icin hicbir sey render
 * etmek gerekmiyor.
 */

export function computeVisibleSteps(
  steps: StepDefinition[],
  answers: DraftAnswers,
): StepDefinition[] {
  return steps.filter((step) => step.shouldShow?.(answers) ?? true);
}

export function indexOfStep(steps: StepDefinition[], stepId: string | null): number {
  if (stepId === null) return -1;
  return steps.findIndex((step) => step.id === stepId);
}

/** Akisin ilk gorunur adimi; bos akis diye bir sey yok ama null donebilir. */
export function firstStepId(steps: StepDefinition[], answers: DraftAnswers): string | null {
  return computeVisibleSteps(steps, answers)[0]?.id ?? null;
}

/** Sonraki gorunur adim; sonuncudaysa null - akis bitmis demektir. */
export function nextStepId(
  steps: StepDefinition[],
  answers: DraftAnswers,
  currentId: string | null,
): string | null {
  const visible = computeVisibleSteps(steps, answers);
  const index = indexOfStep(visible, currentId);
  if (index === -1) return visible[0]?.id ?? null;
  return visible[index + 1]?.id ?? null;
}

/** Onceki gorunur adim; ilkindeyse null - geri tusu akisin disina cikar. */
export function prevStepId(
  steps: StepDefinition[],
  answers: DraftAnswers,
  currentId: string | null,
): string | null {
  const visible = computeVisibleSteps(steps, answers);
  const index = indexOfStep(visible, currentId);
  if (index <= 0) return null;
  return visible[index - 1]?.id ?? null;
}

export type Progress = { current: number; total: number };

/**
 * Yuzde degil sayac. Sayac akisla birebir ve dogruyu soyluyor; yuzde,
 * kosullu adimlar yuzunden geri gidebilir ve bu kullaniciya akisin uzadigini
 * hissettirir.
 */
export function progressOf(
  steps: StepDefinition[],
  answers: DraftAnswers,
  currentId: string | null,
): Progress {
  const visible = computeVisibleSteps(steps, answers);
  const index = indexOfStep(visible, currentId);

  return { current: index === -1 ? 0 : index + 1, total: visible.length };
}

/**
 * Kaldigi adima donerken navigasyon yigini yeniden kurulur: kullanicinin
 * geri tusu, hic gormedigi bir ekrana degil bir onceki adima gitmeli.
 */
export function stackUpTo(
  steps: StepDefinition[],
  answers: DraftAnswers,
  currentId: string | null,
): string[] {
  const visible = computeVisibleSteps(steps, answers);
  const index = indexOfStep(visible, currentId);
  if (index === -1) return visible.length > 0 && visible[0] ? [visible[0].id] : [];

  return visible.slice(0, index + 1).map((step) => step.id);
}

/** Bir adimin atlanabilir olup olmadigini ve tamamlanip tamamlanmadigini birlikte sorar. */
export function canLeaveStep(step: StepDefinition, answers: DraftAnswers): boolean {
  return step.skippable || step.isComplete(answers);
}
