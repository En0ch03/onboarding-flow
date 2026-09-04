import type { OptionGroups } from '@/api/schemas';
import type { DraftAnswers } from '@/state/onboardingStore';

import type { StepDefinition, StepQuestion } from '../engine/types';

function answered(answers: DraftAnswers, key: StepQuestion['answer']): boolean {
  const value = answers[key];
  if (value === undefined) return false;
  return typeof value === 'string' ? value.length > 0 : value.length > 0;
}

/**
 * Adim tanimlarini sunucunun kurallariyla birlestirir.
 *
 * Bugun tek kural zorunluluk, ve iki yere birden dokunuyor: zorunlu bir soru
 * hem atlama yolunu kapatiyor hem bos cevabin adimi tamamlamasini engelliyor.
 * Yalnizca "Atla"yi gizlemek kozmetik olurdu; kullanici hicbir sey secmeden
 * "Devam"a basip gecebilirdi.
 *
 * Kural istemci surumune gomulmus olsaydi, bir sorunun zorunlulugunu
 * degistirmek yeni bir surum ve magaza onayi gerektirirdi - oysa bu bir urun
 * karari.
 *
 * Sunucu gruplari gondermiyorsa tanimdaki degerler gecerli kaliyor: eksik bir
 * liste, akisin kurallarini silmemeli.
 */
export function resolveSteps(steps: StepDefinition[], options: OptionGroups): StepDefinition[] {
  return steps.map((step) => {
    const questions = step.questions ?? [];
    const known = questions.filter((question) => options[question.group] !== undefined);
    if (known.length === 0) return step;

    const required = known.filter((question) => options[question.group]?.required === true);
    const skippable = required.length === 0;

    // Sunucunun soyledigi tanimdakiyle ayniysa nesne yeniden kurulmuyor: yeni
    // bir referans, adim listesini tutan her seyi bosuna yeniliyor.
    if (skippable === step.skippable && required.length === 0) return step;

    return {
      ...step,
      skippable,
      isComplete: (answers) =>
        step.isComplete(answers) &&
        required.every((question) => answered(answers, question.answer)),
    };
  });
}
