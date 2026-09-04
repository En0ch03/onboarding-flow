import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { selectionLimit } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';
import { interestsForIntent } from './interestsGroup';
import { isBlockedByLimit, sortedOptions, toggleSelection } from './useSelection';

/**
 * Akisin tek zorunlu fikri.
 *
 * Secenekler ve kac tane secilebilecegi sunucudan geliyor; bu dosyada hicbir
 * liste yok. "Henuz emin degilim" secenegi de sunucuda duruyor ve bilerek
 * orada: zorunlu bir soruda durust bir cikis yolu birakmamak, terk uretiyor
 * ve alinan cevabi da guvenilmez kiliyor.
 */
export function IntentStep({ values, onChange, options }: StepProps) {
  const { spacing } = useTheme();
  const [refused, setRefused] = useState(false);

  const group = options.intent;
  const selected = values.intent ?? [];

  if (!group) return null;

  return (
    <View>
      {sortedOptions(group).map((option) => (
        <ChoiceCard
          key={option.id}
          option={option}
          selected={selected.includes(option.id)}
          disabled={isBlockedByLimit(group, selected, option.id)}
          onPress={() => {
            const result = toggleSelection(group, selected, option.id);
            setRefused(result.refused);
            if (result.refused) return;

            // Ilgi alanlari niyete bagli: cevabin ait oldugu liste
            // degistiginde cevap da dusuyor, yoksa gorunmeyen bir secim
            // taslakta yasamaya devam ediyor.
            const interests = interestsForIntent(values.interests, result.next, options);
            onChange({
              intent: result.next,
              ...(interests === undefined ? {} : { interests }),
            });
          }}
        />
      ))}

      {group.maxSelection !== null ? (
        <AppText
          variant="caption"
          tone={refused ? 'danger' : 'inkSoft'}
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.sm }}
        >
          {selectionLimit(group.maxSelection, selected.length)}
        </AppText>
      ) : null}
    </View>
  );
}
