import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ChipGrid } from '@/components/ChipGrid';
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
 *
 * Iki soru ayri bolumler halinde duruyor. Tek bir liste gibi gorundugunde
 * ikinci sorunun birincinin devami sanildigi, cihazda gorulen bir sey.
 */
export function AudienceStep({ values, onChange, options }: StepProps) {
  const gender = options.gender;
  const audience = options.audience;

  const selectedAudience = values.audience ?? [];

  return (
    <View>
      {gender ? (
        <Section title={strings.steps.genderLabel} help={strings.steps.genderHelp}>
          {sortedOptions(gender).map((option) => (
            <ChoiceCard
              key={option.id}
              option={option}
              selected={values.gender === option.id}
              onPress={() => onChange({ gender: option.id })}
            />
          ))}
        </Section>
      ) : null}

      {audience ? (
        <Section title={strings.steps.audienceLabel} help={strings.steps.audienceHelp} divided>
          <ChipGrid
            options={sortedOptions(audience)}
            isSelected={(id) => selectedAudience.includes(id)}
            isDisabled={(id) => isBlockedByLimit(audience, selectedAudience, id)}
            onPress={(id) =>
              onChange({ audience: toggleSelection(audience, selectedAudience, id).next })
            }
          />
        </Section>
      ) : null}
    </View>
  );
}

/** Iki soruyu birbirinden ayiran bolum basligi ve tek satirlik aciklamasi. */
function Section({
  title,
  help,
  divided = false,
  children,
}: {
  title: string;
  help: string;
  divided?: boolean;
  children: React.ReactNode;
}) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={
        divided
          ? {
              marginTop: spacing.xl,
              paddingTop: spacing.xl,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
            }
          : undefined
      }
    >
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="inkSoft" style={{ marginTop: spacing.xs }}>
        {help}
      </AppText>
      <View style={{ marginTop: spacing.lg }}>{children}</View>
    </View>
  );
}
