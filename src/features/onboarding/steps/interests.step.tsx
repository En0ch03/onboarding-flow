import { ChipGrid } from '@/components/ChipGrid';
import { haptics } from '@/feedback/haptics';

import type { StepProps } from '../engine/types';
import { groupKeyForIntent } from './interestsGroup';
import { isBlockedByLimit, sortedOptions, toggleSelection } from './useSelection';

/**
 * Niyet cevabina gore farkli bir etiket seti gosteriliyor.
 *
 * Arkadaslik arayan birine ikili bulusmayi cagristiran etiketleri sunmak,
 * cevabi sorup dikkate almamak demek. Kosullu adim mekanizmasinin gercek
 * kullanimi bu.
 */
export function InterestsStep({ values, onChange, options }: StepProps) {
  // Geri dusus `groupKeyForIntent` icinde: burada ikinci bir tane yazmak,
  // ekranin bir listeye, temizligin baska bir listeye bakmasina yol aciyordu.
  const group = options[groupKeyForIntent(values.intent, options)];
  const selected = values.interests ?? [];

  if (!group) return null;

  return (
    <ChipGrid
      options={sortedOptions(group)}
      isSelected={(id) => selected.includes(id)}
      isDisabled={(id) => isBlockedByLimit(group, selected, id)}
      onPress={(id) => {
        const { next } = toggleSelection(group, selected, id);
        if (next === selected) return;
        haptics.select();
        onChange({ interests: next });
      }}
    />
  );
}
