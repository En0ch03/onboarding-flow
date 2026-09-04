import { draftFromProfile, patchFromAnswers } from './profileMapping';

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
        birth_date: { day: '14', month: '3', year: '1996' },
        gender: 'woman',
        audience: ['men'],
        intent: ['long_term'],
        interests: ['coffee', 'books'],
        photos: [{ id: 'p1', url: 'https://example.test/p1.jpg' }],
      },
    });

    expect(answers).toEqual({
      name: 'Deniz',
      birthDate: { day: '14', month: '3', year: '1996' },
      gender: 'woman',
      audience: ['men'],
      intent: ['long_term'],
      interests: ['coffee', 'books'],
      photos: [{ id: 'p1', url: 'https://example.test/p1.jpg' }],
    });
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
});
