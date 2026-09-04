import type { OptionGroup, OptionGroups } from '@/api/schemas';

import type { StepDefinition } from '../engine/types';
import { resolveSteps } from './resolveSteps';

const group = (key: string, required: boolean): OptionGroup => ({
  key,
  multiSelect: true,
  maxSelection: null,
  required,
  options: [{ id: 'books', label: 'Kitap' }],
});

const interests: StepDefinition = {
  id: 'interests',
  title: 'Neye vakit ayırırsın?',
  subtitle: '',
  component: () => null,
  // Adimin kendi sarti yok; zorunluluk yalnizca sunucudan gelebiliyor.
  isComplete: () => true,
  questions: [{ group: 'interests', answer: 'interests' }],
  skippable: true,
};

const audience: StepDefinition = {
  id: 'audience',
  title: 'Kimlere görünmek istersin?',
  subtitle: '',
  component: () => null,
  isComplete: (answers) => (answers.gender?.length ?? 0) > 0,
  questions: [
    { group: 'gender', answer: 'gender' },
    { group: 'audience', answer: 'audience' },
  ],
  skippable: false,
};

const photos: StepDefinition = {
  id: 'photos',
  title: 'Fotoğraf',
  subtitle: '',
  component: () => null,
  isComplete: () => true,
  skippable: false,
};

const resolve = (step: StepDefinition, options: OptionGroups) => resolveSteps([step], options)[0]!;

describe('resolveSteps', () => {
  it('sunucu grubu zorunlu isaretlerse atlama yolu kapaniyor', () => {
    expect(resolve(interests, { interests: group('interests', true) }).skippable).toBe(false);
  });

  it('zorunluluk yalnizca Atlayi gizlemiyor, bos cevabi da gecirmiyor', () => {
    // Kozmetik bir zorunluluk, kullanicinin hicbir sey secmeden "Devam"a
    // basmasina izin verirdi.
    const step = resolve(interests, { interests: group('interests', true) });
    expect(step.isComplete({})).toBe(false);
    expect(step.isComplete({ interests: [] })).toBe(false);
    expect(step.isComplete({ interests: ['books'] })).toBe(true);
  });

  it('sunucu grubu zorunlu degilse adim atlanabilir kaliyor', () => {
    const step = resolve(interests, { interests: group('interests', false) });
    expect(step.skippable).toBe(true);
    expect(step.isComplete({})).toBe(true);
  });

  it('bir adimin sorularindan biri zorunluysa adim atlanamaz', () => {
    const step = resolve(audience, {
      gender: group('gender', true),
      audience: group('audience', false),
    });
    expect(step.skippable).toBe(false);
    expect(step.isComplete({ gender: 'woman' })).toBe(true);
    expect(step.isComplete({ audience: ['women'] })).toBe(false);
  });

  it('adimin kendi sarti sunucununkiyle birlikte gecerli', () => {
    const step = resolve(audience, {
      gender: group('gender', false),
      audience: group('audience', true),
    });
    // Tanim cinsiyeti ariyor, sunucu kitleyi zorunlu tutuyor; ikisi de gerekli.
    expect(step.isComplete({ audience: ['women'] })).toBe(false);
    expect(step.isComplete({ gender: 'woman' })).toBe(false);
    expect(step.isComplete({ gender: 'woman', audience: ['women'] })).toBe(true);
  });

  it('grup gelmediyse tanimdaki degerler gecerli', () => {
    expect(resolve(interests, {})).toBe(interests);
  });

  it('soru baglamayan adima dokunmuyor', () => {
    expect(resolve(photos, { interests: group('interests', true) })).toBe(photos);
  });

  it('degisiklik yoksa ayni nesneyi donduruyor', () => {
    expect(resolve(interests, { interests: group('interests', false) })).toBe(interests);
  });
});
