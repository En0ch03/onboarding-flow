import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme';

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
  const { spacing } = useTheme();

  // Istenen grup yoksa genel listeye dusuluyor: sunucu bir grubu
  // kaldirdiginda adim bos kalmamali.
  const group = options[groupKeyForIntent(values.intent)] ?? options.interests;
  const selected = values.interests ?? [];

  if (!group) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {sortedOptions(group).map((option) => (
        <Chip
          key={option.id}
          option={option}
          selected={selected.includes(option.id)}
          disabled={isBlockedByLimit(group, selected, option.id)}
          onPress={() => onChange({ interests: toggleSelection(group, selected, option.id).next })}
        />
      ))}
    </View>
  );
}
