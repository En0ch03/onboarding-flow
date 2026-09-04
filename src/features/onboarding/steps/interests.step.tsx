import { ChipGrid } from '@/components/ChipGrid';

import type { StepProps } from '../engine/types';
import { isBlockedByLimit, sortedOptions, toggleSelection } from './useSelection';

/**
 * Niyet cevabina gore farkli bir etiket seti gosteriliyor.
 *
 * Arkadaslik arayan birine ikili bulusmayi cagristiran etiketleri sunmak,
 * cevabi sorup dikkate almamak demek. Kosullu adim mekanizmasinin gercek
 * kullanimi bu.
 */
export function groupKeyForIntent(intent: string[] | undefined): string {
  return intent?.includes('friendship') ? 'interests_friendship' : 'interests';
}

export function InterestsStep({ values, onChange, options }: StepProps) {
  // Istenen grup yoksa genel listeye dusuluyor: sunucu bir grubu
  // kaldirdiginda adim bos kalmamali.
  const group = options[groupKeyForIntent(values.intent)] ?? options.interests;
  const selected = values.interests ?? [];

  if (!group) return null;

  return (
    <ChipGrid
      options={sortedOptions(group)}
      isSelected={(id) => selected.includes(id)}
      isDisabled={(id) => isBlockedByLimit(group, selected, id)}
      onPress={(id) => onChange({ interests: toggleSelection(group, selected, id).next })}
    />
  );
}
