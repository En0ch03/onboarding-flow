import type { DraftAnswers } from '@/state/onboardingStore';

import {
  canLeaveStep,
  computeVisibleSteps,
  firstStepId,
  nextStepId,
  prevStepId,
  progressOf,
  stackUpTo,
} from './stepFlow';
import type { StepDefinition } from './types';

const placeholder = () => null;

function step(id: string, overrides: Partial<StepDefinition> = {}): StepDefinition {
  return {
    id,
    component: placeholder,
    isComplete: () => true,
    skippable: false,
    ...overrides,
  };
}

const flow: StepDefinition[] = [
  step('identity'),
  step('audience'),
  step('intent'),
  step('photos'),
  step('interests', {
    skippable: true,
    // Arkadaslik arayan kullaniciya farkli bir etiket seti gosteriliyor;
    // burada kosulun kendisi test ediliyor.
    shouldShow: (answers) => (answers.intent?.length ?? 0) > 0,
  }),
];

const noAnswers: DraftAnswers = {};
const withIntent: DraftAnswers = { intent: ['friendship'] };

describe('visible steps', () => {
  it('hides a step whose condition is not met', () => {
    expect(computeVisibleSteps(flow, noAnswers).map((item) => item.id)).toEqual([
      'identity',
      'audience',
      'intent',
      'photos',
    ]);
  });

  it('shows it once the condition holds', () => {
    expect(computeVisibleSteps(flow, withIntent)).toHaveLength(5);
  });
});

describe('moving through the flow', () => {
  it('starts on the first visible step', () => {
    expect(firstStepId(flow, noAnswers)).toBe('identity');
  });

  it('walks forward and back', () => {
    expect(nextStepId(flow, withIntent, 'identity')).toBe('audience');
    expect(prevStepId(flow, withIntent, 'audience')).toBe('identity');
  });

  it('skips over a hidden step instead of landing on it', () => {
    expect(nextStepId(flow, noAnswers, 'photos')).toBeNull();
    expect(nextStepId(flow, withIntent, 'photos')).toBe('interests');
  });

  it('reports the end of the flow rather than looping', () => {
    expect(nextStepId(flow, withIntent, 'interests')).toBeNull();
  });

  it('reports that back from the first step leaves the flow', () => {
    expect(prevStepId(flow, withIntent, 'identity')).toBeNull();
  });

  it('falls back to the first step when the stored step no longer exists', () => {
    expect(nextStepId(flow, noAnswers, 'a_step_we_removed')).toBe('identity');
  });
});

describe('progress', () => {
  it('counts only the steps the user will actually see', () => {
    expect(progressOf(flow, noAnswers, 'photos')).toEqual({ current: 4, total: 4 });
    expect(progressOf(flow, withIntent, 'photos')).toEqual({ current: 4, total: 5 });
  });

  it('grows with the flow when a step is added, with no other change', () => {
    const longer = [...flow, step('location')];
    expect(progressOf(longer, withIntent, 'photos')).toEqual({ current: 4, total: 6 });
  });
});

describe('stack rebuild', () => {
  it('rebuilds every step up to the one being resumed', () => {
    expect(stackUpTo(flow, withIntent, 'photos')).toEqual([
      'identity',
      'audience',
      'intent',
      'photos',
    ]);
  });

  it('rebuilds only the first step when there is nothing to resume', () => {
    expect(stackUpTo(flow, noAnswers, null)).toEqual(['identity']);
  });
});

describe('leaving a step', () => {
  it('holds an incomplete required step', () => {
    const required = step('identity', { isComplete: () => false });
    expect(canLeaveStep(required, noAnswers)).toBe(false);
  });

  it('lets a skippable step through even when empty', () => {
    const optional = step('interests', { isComplete: () => false, skippable: true });
    expect(canLeaveStep(optional, noAnswers)).toBe(true);
  });
});
