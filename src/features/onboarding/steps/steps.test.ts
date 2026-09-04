import { strings } from '@/constants/strings';
import type { DraftAnswers } from '@/state/onboardingStore';

import type { OptionGroup } from '@/api/schemas';

import { birthDateMessages } from './birthDate';
import { toggleSelection } from './useSelection';
import { DEFAULT_INTERESTS_GROUP } from './interestsGroup';
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

  it('says what is wrong with an impossible date rather than calling it invalid', () => {
    // 31 Subat diye bir gun yok. "Gecerli bir tarih yaz" demek, kullanicinin
    // zaten bildigi seyi tekrar etmek.
    expect(hintFor({ name: 'Deniz', birthDate: { day: '31', month: '2', year: '1996' } })).toBe(
      birthDateMessages.invalid,
    );
  });

  it('speaks plainly at the age gate instead of hiding behind validation', () => {
    expect(hintFor({ name: 'Deniz', birthDate: { day: '1', month: '1', year: '2015' } })).toBe(
      birthDateMessages.too_young,
    );
  });

  it('names the wrong thing before the missing thing', () => {
    // Eksik bir alani kullanici zaten goruyor; yanlis bir tarihin nesi yanlis
    // oldugunu gormuyor.
    expect(hintFor({ birthDate: { day: '31', month: '2', year: '1996' } })).toBe(
      birthDateMessages.invalid,
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

describe('secim hissi yalnizca secim degistiginde', () => {
  it('degismeyen bir secim yeni bir dizi uretmiyor', () => {
    // Adimlar hissi bu referans karsilastirmasiyla karar veriyor: yeni dizi
    // yoksa gorunen bir degisiklik de yok.
    const group: OptionGroup = {
      key: 'intent',
      multiSelect: true,
      maxSelection: 1,
      required: true,
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    };

    const current = ['a'];
    expect(toggleSelection(group, current, 'b').next).toBe(current);
    expect(toggleSelection(group, current, 'a').next).not.toBe(current);
  });

  it('ilgi adiminin sordugu liste, varyant tabaniyla ayni', () => {
    // Istemci tarafindaki iki yer ayni anahtari soyluyor: adimin sordugu
    // grup ve kosullu listenin geri dusus tabani. Sunucu ucu ayri bir
    // testte bagli (`mock-server/completion.test.js`).
    const interests = steps.find((step) => step.id === 'interests');
    const group = interests?.questions?.[0]?.group;

    expect(group).toBe(DEFAULT_INTERESTS_GROUP);
  });
});
