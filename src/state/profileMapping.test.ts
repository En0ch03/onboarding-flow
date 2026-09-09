import { steps } from '@/features/onboarding/steps/steps';

import type { DraftAnswers } from './onboardingStore';
import { answerFieldsForStep, draftFromProfile, patchFromAnswers } from './profileMapping';

const profile = {
  user_id: 'usr_1',
  display_name: 'Deniz',
  avatar_url: null,
  preferences: {},
  onboarding_complete: false,
};

describe('draftFromProfile', () => {
  it('reads the answers the server knows about', () => {
    const answers = draftFromProfile({
      ...profile,
      preferences: {
        phone: '5551234567',
        birth_date: { day: '14', month: '3', year: '1996' },
        gender: 'woman',
        audience: ['men'],
        intent: ['long_term'],
        interests: ['coffee', 'books'],
        photos: [{ id: 'p1', url: 'https://example.test/p1.jpg' }],
      },
    });

    expect(answers).toEqual({
      phone: '5551234567',
      name: 'Deniz',
      birthDate: { day: '14', month: '3', year: '1996' },
      gender: 'woman',
      audience: ['men'],
      intent: ['long_term'],
      interests: ['coffee', 'books'],
      photos: [{ id: 'p1', url: 'https://example.test/p1.jpg' }],
    });
  });

  it('keeps only as many photos as the grid can show', () => {
    const photos = Array.from({ length: 8 }, (_, at) => ({
      id: `p${at}`,
      url: `https://example.test/p${at}.jpg`,
    }));

    const answers = draftFromProfile({ ...profile, preferences: { photos } });

    // Fazlasi ekranda gorunmuyor, silinemiyor ve sayaci "8 / 6" yapiyordu.
    expect(answers.photos).toHaveLength(6);
    expect(answers.photos?.map((item) => item.id)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('skips a value that arrived in a shape we do not expect', () => {
    const answers = draftFromProfile({
      ...profile,
      preferences: { intent: 'long_term', audience: [1, 2], birth_date: 'yesterday' },
    });

    expect(answers.intent).toBeUndefined();
    expect(answers.audience).toBeUndefined();
    expect(answers.birthDate).toBeUndefined();
    expect(answers.name).toBe('Deniz');
  });

  it('ignores an orientation already stored on the server', () => {
    // Alan profil duzenlemeye ait; onboarding taslagi onu tasimiyor ve
    // dolayisiyla bir sonraki adim kaydinda geri gondermiyor.
    const answers = draftFromProfile({
      ...profile,
      preferences: { gender: 'woman', orientation: ['bisexual'] },
    });

    expect(answers.gender).toBe('woman');
    expect('orientation' in answers).toBe(false);
  });
});

describe('patchFromAnswers', () => {
  it('sends the phone number in preferences', () => {
    // Sozlesme yalnizca uc yazilabilir alan tanimliyor ve numaranin bugun
    // sunucuda bir karsiligi yok; tercihler nesnesi zaten akisin butun
    // cevaplarini tasiyor ve anahtar setini istemci tanimliyor.
    expect(patchFromAnswers({ phone: '5551234567' }, 'phone').preferences).toEqual({
      phone: '5551234567',
    });
  });

  it('sends the name on its own field and the birth date in preferences', () => {
    const patch = patchFromAnswers(
      { name: 'Deniz', birthDate: { day: '14', month: '3', year: '1996' } },
      'identity',
    );

    expect(patch.display_name).toBe('Deniz');
    expect(patch.preferences).toEqual({ birth_date: { day: '14', month: '3', year: '1996' } });
  });

  it('sends only the two matching fields for the audience step', () => {
    const patch = patchFromAnswers({ gender: 'woman', audience: ['men'] }, 'audience');

    expect(patch.preferences).toEqual({ gender: 'woman', audience: ['men'] });
  });

  it('fills the single avatar field from the cover photo', () => {
    const patch = patchFromAnswers(
      {
        photos: [
          { id: 'p1', url: 'https://example.test/cover.jpg' },
          { id: 'p2', url: 'https://example.test/second.jpg' },
        ],
      },
      'photos',
    );

    expect(patch.avatar_url).toBe('https://example.test/cover.jpg');
    expect(patch.preferences?.photos).toHaveLength(2);
  });

  it('clears the avatar when the last photo is removed', () => {
    expect(patchFromAnswers({ photos: [] }, 'photos').avatar_url).toBeNull();
  });

  it('sends an empty list when a skippable step is skipped', () => {
    expect(patchFromAnswers({}, 'interests').preferences).toEqual({ interests: [] });
  });

  it('names the fields of every step in the flow', () => {
    // Beklenen liste elle yazili: sinanan eslemeden uretilseydi, eslemeden
    // bir alan dusuruldugunde bu test de onu aramaktan vazgecerdi.
    const expected: Record<string, (keyof DraftAnswers)[]> = {
      phone: ['phone'],
      identity: ['name', 'birthDate'],
      audience: ['gender', 'audience'],
      intent: ['intent'],
      photos: ['photos'],
      interests: ['interests'],
    };

    // Akista bu tabloda olmayan bir adim varsa alanlari korumasiz demektir.
    expect(steps.map((step) => step.id).sort()).toEqual(Object.keys(expected).sort());

    for (const [stepId, fields] of Object.entries(expected)) {
      expect(`${stepId}: ${answerFieldsForStep(stepId).join(',')}`).toBe(
        `${stepId}: ${fields.join(',')}`,
      );
    }
  });

  it('hands out a field list that cannot be modified', () => {
    // Paylasilan dizi degistirilebilir olsaydi tek bir cagiranin ekledigi
    // alan butun modul icin kalici olurdu.
    expect(Object.isFrozen(answerFieldsForStep('intent'))).toBe(true);
  });

  it('claims a field for a step only if that step actually sends it', () => {
    // Eslemenin iki yani ayrisirsa bir alan ya korumasiz kalir ya da hic
    // gelmeyecek bir cevap bekler. Yalnizca o alani doldurup gonderim
    // govdesinin gercekten dolmasi araniyor.
    const sample: DraftAnswers = {
      phone: '5551234567',
      name: 'Deniz',
      birthDate: { day: '01', month: '01', year: '1990' },
      gender: 'woman',
      audience: ['men'],
      intent: ['long_term'],
      interests: ['music'],
      photos: [{ id: 'p1', url: 'https://example.test/a.jpg' }],
    };

    for (const step of steps) {
      // Karsilastirma bos govdeye gore: `intent` gibi adimlar cevapsizken
      // bile bir govde uretiyor, dolayisiyla "govde dolu mu" sorusu hicbir
      // sey sinamiyordu. Aranan sey, alanin govdeye bir fark katmasi.
      const empty = JSON.stringify(patchFromAnswers({}, step.id));

      for (const field of answerFieldsForStep(step.id)) {
        const patch = JSON.stringify(
          patchFromAnswers({ [field]: sample[field] } as DraftAnswers, step.id),
        );

        expect(`${step.id}.${field} govdeyi degistiriyor: ${patch !== empty}`).toBe(
          `${step.id}.${field} govdeyi degistiriyor: true`,
        );
      }
    }
  });
});
