import { useCallback, useMemo } from 'react';

import {
  useOnboardingStore,
  type AnswersUpdate,
  type DraftAnswers,
} from '@/state/onboardingStore';

import {
  canLeaveStep,
  computeVisibleSteps,
  firstStepId,
  nextStepId,
  prevStepId,
  progressOf,
  type Progress,
} from './stepFlow';
import type { StepDefinition } from './types';

export type StepEngine = {
  visibleSteps: StepDefinition[];
  currentStep: StepDefinition | null;
  progress: Progress;
  answers: DraftAnswers;
  /** Zorunlu bir adim tamamlanmadan ileri gidilmez. */
  canContinue: boolean;
  setAnswers: (update: AnswersUpdate) => void;
  goNext: () => void;
  /** Ilk adimdan geri gidilirse akisin disina cikilir; cagiran karar verir. */
  goBack: () => boolean;
  skip: () => void;
};

/**
 * Saf akis fonksiyonlarini taslakla birlestiren tek yer. Bu cengelin kendi
 * karari yok; sadece durumu ve fonksiyonlari birbirine bagliyor.
 */
export function useStepEngine(
  steps: StepDefinition[],
  { onFinish }: { onFinish: () => void },
): StepEngine {
  const answers = useOnboardingStore((state) => state.answers);
  const activeStepId = useOnboardingStore((state) => state.activeStepId);
  const setDraftAnswers = useOnboardingStore((state) => state.setAnswers);
  const setActiveStep = useOnboardingStore((state) => state.setActiveStep);
  const markStepCompleted = useOnboardingStore((state) => state.markStepCompleted);

  const visibleSteps = useMemo(() => computeVisibleSteps(steps, answers), [steps, answers]);

  const currentStepId = activeStepId ?? firstStepId(steps, answers);
  const currentStep = visibleSteps.find((step) => step.id === currentStepId) ?? null;

  const progress = useMemo(
    () => progressOf(steps, answers, currentStepId),
    [steps, answers, currentStepId],
  );

  const advance = useCallback(() => {
    if (!currentStep) return;
    markStepCompleted(currentStep.id);

    const next = nextStepId(steps, answers, currentStep.id);
    if (next === null) {
      onFinish();
      return;
    }
    setActiveStep(next);
  }, [answers, currentStep, markStepCompleted, onFinish, setActiveStep, steps]);

  const goBack = useCallback(() => {
    const previous = prevStepId(steps, answers, currentStepId);
    if (previous === null) return false;
    setActiveStep(previous);
    return true;
  }, [answers, currentStepId, setActiveStep, steps]);

  return {
    visibleSteps,
    currentStep,
    progress,
    answers,
    canContinue: currentStep ? currentStep.isComplete(answers) : false,
    setAnswers: setDraftAnswers,
    goNext: advance,
    goBack,
    skip: useCallback(() => {
      if (currentStep && canLeaveStep(currentStep, answers)) advance();
    }, [advance, answers, currentStep]),
  };
}
