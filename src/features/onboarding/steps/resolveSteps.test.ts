import type { OptionGroup, OptionGroups } from '@/api/schemas';

import type { StepDefinition } from '../engine/types';
import { resolveSteps } from './resolveSteps';

const group = (required: boolean): OptionGroup => ({
  key: 'interests',
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
  isComplete: () => true,
  requiredGroup: 'interests',
  skippable: true,
};

const photos: StepDefinition = {
  id: 'photos',
  title: 'Fotoğraf',
  subtitle: '',
  component: () => null,
  isComplete: () => true,
  skippable: false,
};

describe('resolveSteps', () => {
  it('sunucu grubu zorunlu isaretlerse adim atlanamaz oluyor', () => {
    const options: OptionGroups = { interests: group(true) };
    expect(resolveSteps([interests], options)[0]?.skippable).toBe(false);
  });

  it('sunucu grubu zorunlu degilse adim atlanabilir kaliyor', () => {
    const options: OptionGroups = { interests: group(false) };
    expect(resolveSteps([interests], options)[0]?.skippable).toBe(true);
  });

  it('grup gelmediyse tanimdaki deger gecerli', () => {
    expect(resolveSteps([interests], {})[0]?.skippable).toBe(true);
  });

  it('grup baglamayan adima dokunmuyor', () => {
    expect(resolveSteps([photos], { interests: group(true) })[0]).toBe(photos);
  });

  it('degisiklik yoksa ayni nesneyi donduruyor', () => {
    const options: OptionGroups = { interests: group(false) };
    expect(resolveSteps([interests], options)[0]).toBe(interests);
  });
});
