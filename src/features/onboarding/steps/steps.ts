import { strings } from '@/constants/strings';

import type { StepDefinition } from '../engine/types';
import { AudienceStep } from './audience.step';
import { inspectBirthDate } from './birthDate';
import { IdentityStep } from './identity.step';
import { IntentStep } from './intent.step';
import { InterestsStep } from './interests.step';
import { MINIMUM_PHOTOS, PhotosStep } from './photos.step';

/**
 * Akisin tek kaynagi.
 *
 * Bu diziye bir eleman eklemek akisa bir adim eklemeye yetiyor: ilerleme
 * sayaci, geri davranisi ve yigin kurulumu hepsi buradan okuyor.
 */
export const steps: StepDefinition[] = [
  {
    id: 'identity',
    title: strings.steps.identityTitle,
    subtitle: strings.steps.identitySubtitle,
    component: IdentityStep,
    skippable: false,
    incompleteHint: (answers) => {
      const nameMissing = (answers.name?.trim().length ?? 0) === 0;
      const dateProblem = inspectBirthDate(answers.birthDate);

      // Tarihin nesi yanlissa adimin govdesi bunu alanin hemen altinda
      // soyluyor. Burada daha genel bir cumle tekrar etmek, kesin olani
      // bulanik olanla degistiriyor: kullanici butonun yanindakini goruyor,
      // alanin altindakini kaciriyor.
      const bodyExplainsTheDate = dateProblem !== null && dateProblem !== 'incomplete';

      if (bodyExplainsTheDate) return nameMissing ? strings.steps.identityNameHint : null;
      if (nameMissing && dateProblem !== null) return strings.steps.identityHint;
      if (nameMissing) return strings.steps.identityNameHint;
      return strings.steps.identityDateHint;
    },
    isComplete: (answers) =>
      (answers.name?.trim().length ?? 0) > 0 && inspectBirthDate(answers.birthDate) === null,
  },
  {
    id: 'audience',
    title: strings.steps.audienceTitle,
    subtitle: strings.steps.audienceSubtitle,
    component: AudienceStep,
    skippable: false,
    incompleteHint: strings.steps.audienceHint,
    isComplete: (answers) =>
      (answers.gender?.length ?? 0) > 0 && (answers.audience?.length ?? 0) > 0,
  },
  {
    id: 'intent',
    title: strings.steps.intentTitle,
    subtitle: strings.steps.intentSubtitle,
    component: IntentStep,
    skippable: false,
    incompleteHint: strings.steps.intentHint,
    isComplete: (answers) => (answers.intent?.length ?? 0) > 0,
  },
  {
    id: 'photos',
    title: strings.steps.photosTitle,
    subtitle: strings.steps.photosSubtitle,
    component: PhotosStep,
    skippable: false,
    incompleteHint: strings.steps.photosHint,
    isComplete: (answers) => (answers.photos?.length ?? 0) >= MINIMUM_PHOTOS,
  },
  {
    id: 'interests',
    title: strings.steps.interestsTitle,
    subtitle: strings.steps.interestsSubtitle,
    component: InterestsStep,
    // Akisin tek atlanabilir adimi ve bilerek en sonda.
    skippable: true,
    skipCost: strings.steps.interestsSkipCost,
    isComplete: () => true,
  },
];
