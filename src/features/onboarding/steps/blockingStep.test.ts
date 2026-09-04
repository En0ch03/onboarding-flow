import type { StepDefinition } from '../engine/types';

import { stepForFields } from './blockingStep';
import { steps } from './steps';

const placeholder = () => null;

function step(id: string, groups: string[] = []): StepDefinition {
  return {
    id,
    title: id,
    subtitle: '',
    component: placeholder,
    isComplete: () => true,
    skippable: false,
    ...(groups.length > 0
      ? { questions: groups.map((group) => ({ group, answer: 'interests' as const })) }
      : {}),
  };
}

const flow: StepDefinition[] = [
  step('identity'),
  step('audience', ['gender', 'audience']),
  step('intent', ['intent']),
  step('photos'),
  step('interests', ['interests']),
];

describe('stepForFields', () => {
  it('secenek listesi adini o listeyi soran adima cozuyor', () => {
    expect(stepForFields(flow, ['intent'])).toBe('intent');
    expect(stepForFields(flow, ['audience'])).toBe('audience');
  });

  it('listesi olmayan alanlari da adimlarina cozuyor', () => {
    expect(stepForFields(flow, ['birth_date'])).toBe('identity');
    expect(stepForFields(flow, ['display_name'])).toBe('identity');
    expect(stepForFields(flow, ['photos'])).toBe('photos');
  });

  it('birden fazla alan geldiginde akista en erken olani seciyor', () => {
    // Kullanici geriye dogru degil ileriye dogru duzeltiyor; ilk eksik olan
    // adim dogru baslangic.
    expect(stepForFields(flow, ['interests', 'gender'])).toBe('audience');
  });

  it('tanimadigi alan icin null donuyor', () => {
    expect(stepForFields(flow, ['avatar_url'])).toBeNull();
    expect(stepForFields(flow, [])).toBeNull();
  });

  it('gercek akista da her sunucu alani bir adima cozuluyor', () => {
    // Sahte akisla sinamak yetmiyor: `steps.ts` icindeki bir adim kimligi
    // degisirse bu esleme sessizce bozulur ve kullanici, sunucunun
    // reddettigi alani duzeltemeden son adimda ayni reddi almaya devam eder.
    for (const field of ['display_name', 'birth_date', 'photos', 'gender', 'audience', 'intent']) {
      expect(stepForFields(steps, [field])).not.toBeNull();
    }
  });
});
