import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { ChoiceCard } from '@/components/ChoiceCard';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';
import { isBlockedByLimit, sortedOptions, toggleSelection } from './useSelection';

/**
 * Eslesme havuzunu belirleyen iki cevap: kendini nasil tanimladigin ve
 * kimlere gorunmek istedigin. Ucuncu bir alan yok.
 *
 * Yonelim etiketi bilerek burada sorulmuyor. Ozel nitelikli veriyi bir kayit
 * akisinda toplamak, kullanicinin hizli gecmeye calistigi bir anda en agir
 * kararlardan birini vermesini istemek demek. Alan profil duzenlemede,
 * kullanici kendi zamaninda ve kendi istegiyle geldiginde bulunuyor.
 */
export function AudienceStep({ values, onChange, options }: StepProps) {
  const { spacing } = useTheme();

  const gender = options.gender;
  const audience = options.audience;

  const selectedAudience = values.audience ?? [];

  return (
    <View>
      {gender ? (
        <View style={{ marginBottom: spacing.xl }}>
          <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.md }}>
            {strings.steps.genderLabel}
          </AppText>
          {sortedOptions(gender).map((option) => (
            <ChoiceCard
              key={option.id}
              option={option}
              selected={values.gender === option.id}
              onPress={() => onChange({ gender: option.id })}
            />
          ))}
        </View>
      ) : null}

      {audience ? (
        <View>
          <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.md }}>
            {strings.steps.audienceLabel}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {sortedOptions(audience).map((option) => (
              <Chip
                key={option.id}
                option={option}
                selected={selectedAudience.includes(option.id)}
                disabled={isBlockedByLimit(audience, selectedAudience, option.id)}
                onPress={() =>
                  onChange({
                    audience: toggleSelection(audience, selectedAudience, option.id).next,
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
