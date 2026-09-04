import type { Preferences, Profile, ProfilePatch } from '@/api/schemas';

import type { DraftAnswers } from './onboardingStore';

/**
 * Sozlesme yalnizca uc yazilabilir alan tanimliyor: ad, avatar ve serbest
 * bicimli bir tercihler nesnesi. Akisin geri kalan cevaplari tercihlerin
 * icinde tasiniyor ve anahtar setini biz tanimliyoruz.
 *
 * Anahtarlar tek yerde: iki tarafa iki ayri liste yazmak, birinin digerinden
 * sessizce ayrismasi demek.
 */
const keys = {
  birthDate: 'birth_date',
  gender: 'gender',
  audience: 'audience',
  orientation: 'orientation',
  intent: 'intent',
  interests: 'interests',
  photos: 'photos',
} as const;

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length === value.length ? items : null;
}

function readBirthDate(value: unknown): DraftAnswers['birthDate'] | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const { day, month, year } = record;

  if (typeof day !== 'string' || typeof month !== 'string' || typeof year !== 'string') return null;
  return { day, month, year };
}

function readPhotos(value: unknown): DraftAnswers['photos'] | null {
  if (!Array.isArray(value)) return null;

  const photos = value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.url !== 'string') return [];
    return [{ id: record.id, url: record.url }];
  });

  return photos.length === value.length ? photos : null;
}

/**
 * Sunucudaki profili taslak cevaplara cevirir.
 *
 * Tanimadigimiz veya beklenen sekilde olmayan bir deger sessizce atlanir:
 * yerel durum bir onbellek ve bir alan bozuk geldi diye akisin tamami
 * durmamali.
 */
export function draftFromProfile(profile: Profile): DraftAnswers {
  const preferences = profile.preferences as Preferences;
  const answers: DraftAnswers = {};

  if (profile.display_name !== null) answers.name = profile.display_name;

  const birthDate = readBirthDate(preferences[keys.birthDate]);
  if (birthDate) answers.birthDate = birthDate;

  const gender = preferences[keys.gender];
  if (typeof gender === 'string') answers.gender = gender;

  const audience = readStringArray(preferences[keys.audience]);
  if (audience) answers.audience = audience;

  const orientation = readStringArray(preferences[keys.orientation]);
  if (orientation) {
    answers.orientation = orientation;
    // Sunucuda yonelim varsa riza bir kez verilmis demektir.
    answers.orientationConsent = true;
  }

  const intent = readStringArray(preferences[keys.intent]);
  if (intent) answers.intent = intent;

  const interests = readStringArray(preferences[keys.interests]);
  if (interests) answers.interests = interests;

  const photos = readPhotos(preferences[keys.photos]);
  if (photos) answers.photos = photos;

  return answers;
}

/**
 * Bir adimin cevabini kismi profil govdesine cevirir.
 *
 * Tek buyuk bir gonderim yerine adim basina gonderim: akis ortasinda kesilse
 * bile sunucu tarafi guncel kalir.
 */
export function patchFromAnswers(answers: DraftAnswers, stepId: string): ProfilePatch {
  switch (stepId) {
    case 'identity': {
      const patch: ProfilePatch = {};
      if (answers.name !== undefined) patch.display_name = answers.name;
      if (answers.birthDate !== undefined) {
        patch.preferences = { [keys.birthDate]: answers.birthDate };
      }
      return patch;
    }

    case 'audience': {
      const preferences: Preferences = {};
      if (answers.gender !== undefined) preferences[keys.gender] = answers.gender;
      if (answers.audience !== undefined) preferences[keys.audience] = answers.audience;
      // Riza isaretlenmemisse alan govdeye hic eklenmez - bos gonderilmez.
      if (answers.orientationConsent === true && answers.orientation !== undefined) {
        preferences[keys.orientation] = answers.orientation;
      }
      return { preferences };
    }

    case 'intent':
      return { preferences: { [keys.intent]: answers.intent ?? [] } };

    case 'photos': {
      const photos = answers.photos ?? [];
      const patch: ProfilePatch = { preferences: { [keys.photos]: photos } };
      // Sozlesme tek bir avatar tanimliyor; kapak fotografi onu dolduruyor.
      patch.avatar_url = photos[0]?.url ?? null;
      return patch;
    }

    case 'interests':
      return { preferences: { [keys.interests]: answers.interests ?? [] } };

    default:
      return {};
  }
}
