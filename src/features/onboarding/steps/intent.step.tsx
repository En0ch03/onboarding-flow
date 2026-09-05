import { View } from 'react-native';

import type { OptionGroup } from '@/api/schemas';
import { ChoiceCard } from '@/components/ChoiceCard';

import type { StepProps } from '../engine/types';
import { interestsForIntent } from './interestsGroup';
import { SelectionLimitNote } from './SelectionLimitNote';
import { sortedOptions } from './useSelection';
import { useSelectionLimit } from './useSelectionLimit';

/**
 * Akisin tek zorunlu fikri.
 *
 * Secenekler ve kac tane secilebilecegi sunucudan geliyor; bu dosyada hicbir
 * liste yok. "Henuz emin degilim" secenegi de sunucuda duruyor ve bilerek
 * orada: zorunlu bir soruda durust bir cikis yolu birakmamak, terk uretiyor
 * ve alinan cevabi da guvenilmez kiliyor.
 */
export function IntentStep({ values, onChange, options }: StepProps) {
  const group = options.intent;
  if (!group) return null;

  return <IntentChoices group={group} values={values} onChange={onChange} options={options} />;
}

/** Kancalar grup varken kuruluyor; grup yokken ekran zaten bos. */
function IntentChoices({ group, values, onChange, options }: StepProps & { group: OptionGroup }) {
  const selected = values.intent ?? [];
  const limit = useSelectionLimit(group, selected);

  return (
    <View>
      {sortedOptions(group).map((option) => (
        <ChoiceCard
          key={option.id}
          option={option}
          selected={selected.includes(option.id)}
          blocked={limit.isBlocked(option.id)}
          blockedHint={limit.blockedHint(option.id)}
          onPress={() => {
            const next = limit.attempt(option.id);
            if (next === null) return;

            // Ilgi alanlari niyete bagli: cevabin ait oldugu liste
            // degistiginde cevap da dusuyor, yoksa gorunmeyen bir secim
            // taslakta yasamaya devam ediyor.
            const interests = interestsForIntent(values.interests, next, options);
            onChange({
              intent: next,
              ...(interests === undefined ? {} : { interests }),
            });
          }}
        />
      ))}

      <SelectionLimitNote group={group} selected={selected} refused={limit.refused} />
    </View>
  );
}
