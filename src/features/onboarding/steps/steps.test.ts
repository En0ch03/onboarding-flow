import { strings } from '@/constants/strings';
import type { DraftAnswers } from '@/state/onboardingStore';

import { steps } from './steps';

const identity = steps.find((step) => step.id === 'identity');

/** Adimin, ileri basildiginda soyleyecegi cumle. */
function hintFor(answers: DraftAnswers): string | null | undefined {
  const hint = identity?.incompleteHint;
  return typeof hint === 'function' ? hint(answers) : hint;
}

const validDate = { day: '11', month: '4', year: '1996' };

describe('identity step hint', () => {
  it('names both when nothing has been filled in', () => {
    expect(hintFor({})).toBe(strings.steps.identityHint);
  });

  it('names only the name when the date is already valid', () => {
    expect(hintFor({ birthDate: validDate })).toBe(strings.steps.identityNameHint);
  });

  it('names only the date when the name is already there', () => {
    expect(hintFor({ name: 'Deniz' })).toBe(strings.steps.identityDateHint);
  });

  it('stays silent when the field itself already explains the date', () => {
    // 31 Şubat diye bir gün yok. Alanın altında "böyle bir tarih yok" yazıyor;
    // butonun yanında daha genel bir cümle tekrar etmek, kullanıcının gördüğü
    // mesajı kesin olandan bulanık olana çeviriyor.
    expect(hintFor({ name: 'Deniz', birthDate: { day: '31', month: '2', year: '1996' } })).toBe(
      null,
    );
  });

  it('stays silent for the age gate too, which the field also explains', () => {
    expect(hintFor({ name: 'Deniz', birthDate: { day: '1', month: '1', year: '2015' } })).toBe(
      null,
    );
  });

  it('still asks for the name when the date is invalid and the name is missing', () => {
    // Govde tarihi anlatiyor ama adin eksikligini kimse soylemiyor.
    expect(hintFor({ birthDate: { day: '31', month: '2', year: '1996' } })).toBe(
      strings.steps.identityNameHint,
    );
  });

  it('treats a name of only spaces as missing', () => {
    expect(hintFor({ name: '   ', birthDate: validDate })).toBe(strings.steps.identityNameHint);
  });
});

describe('step flow shape', () => {
  it('has exactly one skippable step and it is the last one', () => {
    const skippable = steps.filter((step) => step.skippable);

    expect(skippable).toHaveLength(1);
    expect(steps[steps.length - 1]?.skippable).toBe(true);
  });

  it('gives every skippable step a line saying what skipping costs', () => {
    steps.filter((step) => step.skippable).forEach((step) => expect(step.skipCost).toBeTruthy());
  });
});
