import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { OptionGroup } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { ChipGrid } from '@/components/ChipGrid';
import { ChoiceCard } from '@/components/ChoiceCard';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';
import { SelectionLimitNote } from './SelectionLimitNote';
import { sortedOptions } from './useSelection';
import { useSelectionLimit } from './useSelectionLimit';

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

  return (
    <View>
      {gender ? (
        <Section title={strings.steps.genderLabel} help={strings.steps.genderHelp}>
          <GenderChoices
            group={gender}
            selected={values.gender}
            onSelect={(id) => onChange({ gender: id })}
          />
        </Section>
      ) : null}

      {audience ? (
        <Section
          title={strings.steps.audienceLabel}
          help={strings.steps.audienceHelp}
          // Ayrac yalnizca ayiracak bir sey varsa cizilir: sunucu cinsiyet
          // grubunu kaldirirsa tepede sahipsiz bir cizgi kalmasin.
          divided={Boolean(gender)}
        >
          <AudienceChoices
            group={audience}
            selected={values.audience ?? []}
            onSelect={(next) => onChange({ audience: next })}
          />
        </Section>
      ) : null}
    </View>
  );
}

/**
 * Tekli liste de ayni kancadan geciyor: sinir yok ama "ayni secime tekrar
 * dokunmak olay degil" kurali ve secim hissi tek yerde yasamali.
 */
function GenderChoices({
  group,
  selected,
  onSelect,
}: {
  group: OptionGroup;
  selected: string | undefined;
  onSelect: (id: string) => void;
}) {
  const limit = useSelectionLimit(group, selected === undefined ? [] : [selected]);

  return (
    <>
      {sortedOptions(group).map((option) => (
        <ChoiceCard
          key={option.id}
          option={option}
          selected={selected === option.id}
          multiple={group.multiSelect}
          onPress={() => {
            const next = limit.attempt(option.id);
            if (next?.[0] !== undefined) onSelect(next[0]);
          }}
        />
      ))}
    </>
  );
}

/** Kancalar grup varken kuruluyor; grup yokken bolum zaten cizilmiyor. */
function AudienceChoices({
  group,
  selected,
  onSelect,
}: {
  group: OptionGroup;
  selected: string[];
  onSelect: (next: string[]) => void;
}) {
  const limit = useSelectionLimit(group, selected);

  return (
    <>
      <ChipGrid
        options={sortedOptions(group)}
        isSelected={(id) => selected.includes(id)}
        isBlocked={limit.isBlocked}
        blockedHint={limit.blockedHint}
        onPress={(id) => {
          const next = limit.attempt(id);
          if (next !== null) onSelect(next);
        }}
      />

      <SelectionLimitNote group={group} selected={selected} refused={limit.refused} />
    </>
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
  children: ReactNode;
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
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="caption" tone="inkSoft" style={{ marginTop: spacing.xs }}>
        {help}
      </AppText>
      <View style={{ marginTop: spacing.lg }}>{children}</View>
    </View>
  );
}
