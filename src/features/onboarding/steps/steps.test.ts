import { strings } from '@/constants/strings';
import type { DraftAnswers } from '@/state/onboardingStore';

import type { OptionGroup } from '@/api/schemas';

import { birthDateMessages } from './birthDate';
import { toggleSelection } from './useSelection';
import { DEFAULT_INTERESTS_GROUP } from './interestsGroup';
import { MINIMUM_PHOTOS, PHOTO_SLOTS } from './photoSlots';
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

describe('phone step gate', () => {
  const phone = steps.find((step) => step.id === 'phone');

  it('akisin ilk adimi: numara addan ve dogum tarihinden once soruluyor', () => {
    expect(steps[0]?.id).toBe('phone');
    expect(steps[1]?.id).toBe('identity');
  });

  it('numara olmadan ileri gecilmiyor', () => {
    expect(phone?.isComplete({})).toBe(false);
    expect(phone?.isComplete({ phone: '' })).toBe(false);
    expect(phone?.isComplete({ phone: '555123' })).toBe(false);
    expect(phone?.isComplete({ phone: '2121234567' })).toBe(false);
  });

  it('gecerli numarayla geciliyor', () => {
    expect(phone?.isComplete({ phone: '5551234567' })).toBe(true);
  });

  it('atlanamiyor', () => {
    // Akisin tek atlanabilir adimi ilgi alanlari ve bilerek en sonda; basa
    // atlanabilir bir adim koymak o karari bozardi.
    expect(phone?.skippable).toBe(false);
  });

  it('yarim numaraya gecersiz demiyor', () => {
    const hint = phone?.incompleteHint;
    const say = (answers: DraftAnswers) => (typeof hint === 'function' ? hint(answers) : hint);

    // Uc cumle uc ayri durum anlatiyor. Ikisi birlestirilirse kullanicilardan
    // biri kendi durumuna ait olmayan bir cumle okuyor.
    expect(say({})).toBe(strings.phone.empty);
    expect(say({ phone: '555123' })).toBe(strings.phone.partial);
    expect(say({ phone: '2121234567' })).toBe(strings.phone.invalid);
  });
});

describe('photo step gate', () => {
  const photos = steps.find((step) => step.id === 'photos');

  /** `n` tane yuklenmis fotograf; icerigi degil sayisi sinaniyor. */
  function withPhotos(n: number): DraftAnswers {
    return {
      photos: Array.from({ length: n }, (_, i) => ({
        id: `ph_${i}`,
        url: `https://example.invalid/${i}.jpg`,
      })),
    };
  }

  // Beklenen sayi burada literal duruyor. Sinanan sabitten okunsaydi, sabiti
  // degistirmek testi de degistirir ve kapi sinanmamis olurdu.
  it('asks for two photos, and two is what the constant says', () => {
    expect(MINIMUM_PHOTOS).toBe(2);
    expect(PHOTO_SLOTS).toBe(6);
  });

  it('does not let the flow past the step with fewer than two photos', () => {
    expect(photos?.isComplete({})).toBe(false);
    expect(photos?.isComplete(withPhotos(0))).toBe(false);
    expect(photos?.isComplete(withPhotos(1))).toBe(false);
  });

  it('lets the flow past at two, and above two', () => {
    expect(photos?.isComplete(withPhotos(2))).toBe(true);
    expect(photos?.isComplete(withPhotos(6))).toBe(true);
  });

  it('cannot be skipped: the threshold is not a suggestion', () => {
    expect(photos?.skippable).toBe(false);
  });
});
