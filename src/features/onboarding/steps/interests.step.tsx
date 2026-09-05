import { View } from 'react-native';

import type { OptionGroup } from '@/api/schemas';
import { ChipGrid } from '@/components/ChipGrid';

import type { StepProps } from '../engine/types';
import { groupKeyForIntent } from './interestsGroup';
import { SelectionLimitNote } from './SelectionLimitNote';
import { sortedOptions } from './useSelection';
import { useSelectionLimit } from './useSelectionLimit';

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
  if (!group) return null;

  return <InterestChoices group={group} values={values} onChange={onChange} />;
}

/** Kancalar grup varken kuruluyor; grup yokken ekran zaten bos. */
function InterestChoices({
  group,
  values,
  onChange,
}: Pick<StepProps, 'values' | 'onChange'> & { group: OptionGroup }) {
  const selected = values.interests ?? [];
  const limit = useSelectionLimit(group, selected);

  return (
    <View>
      <ChipGrid
        options={sortedOptions(group)}
        isSelected={(id) => selected.includes(id)}
        isBlocked={limit.isBlocked}
        blockedHint={limit.blockedHint}
        onPress={(id) => {
          const next = limit.attempt(id);
          if (next !== null) onChange({ interests: next });
        }}
      />

      <SelectionLimitNote group={group} selected={selected} refused={limit.refused} />
    </View>
  );
}
