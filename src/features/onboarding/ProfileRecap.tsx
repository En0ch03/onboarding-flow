import { View } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { nameWithAge, phoneSummary, photoSummary, strings } from '@/constants/strings';
import type { DraftAnswers } from '@/state/onboardingStore';
import { useTheme } from '@/theme';

import { ageFromDraft } from './steps/birthDate';
import { groupKeyForIntent } from './steps/interestsGroup';

type ProfileRecapProps = {
  answers: DraftAnswers;
  options: OptionGroups;
};

/**
 * Kapanis ekranindaki ozet.
 *
 * Cevaplar sayiyla degil kendi kelimeleriyle geri okunuyor: "Ilgi alanlari 3"
 * kimseye ne sectigini hatirlatmiyor. Kart kendi yuzeyinde duruyor ki
 * okunacak bir sey oldugu belli olsun.
 */
export function ProfileRecap({ answers, options }: ProfileRecapProps) {
  const { colors, radius, spacing } = useTheme();

  const labelsFor = (groupKey: string, ids: string[] | undefined) => {
    if (!ids?.length) return strings.completion.recapEmpty;

    const group = options[groupKey];
    // Grup hic gelmediginde kullaniciyi suclamiyoruz: cevabi vermis olabilir,
    // eksik olan sunucunun etiket katalogu.
    if (!group) return strings.completion.recapEmpty;

    // Cozulemeyen bir kimlik gosterilmiyor. Ham kimlikler Ingilizce ve
    // kullanicinin hicbir yerde gormedigi seyler; ekrana dusmeleri, ozeti
    // "board_games" yazan bir satira cevirir.
    const labels = ids
      .map((id) => group.options.find((option) => option.id === id)?.label)
      .filter((label): label is string => label !== undefined);

    return labels.length > 0 ? labels.join(', ') : strings.completion.recapEmpty;
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <AppText variant="heading">
        {nameWithAge(answers.name ?? '', ageFromDraft(answers.birthDate))}
      </AppText>

      <RecapRow label={strings.completion.recapPhone} value={phoneSummary(answers.phone)} />
      <RecapRow
        label={strings.completion.recapAudience}
        value={labelsFor('audience', answers.audience)}
      />
      <RecapRow
        label={strings.completion.recapIntent}
        value={labelsFor('intent', answers.intent)}
      />
      <RecapRow
        label={strings.completion.recapInterests}
        // Ilgi alanlari grubu niyete gore degisiyor; ozet, kullanicinin
        // gordugu listeye karsi etiket cozmeli.
        value={labelsFor(groupKeyForIntent(answers.intent, options), answers.interests)}
      />
      <RecapRow
        label={strings.completion.recapPhotos}
        value={photoSummary(answers.photos?.length ?? 0)}
      />
    </View>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();

  return (
    // Etiket ve deger tek bir odak: ayri ayri okundugunda ekran okuyucu
    // kullanicisi "Kimler gorecek" ile "Herkes" arasindaki bagi kaybediyor.
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}
    >
      <AppText variant="label" tone="inkSoft">
        {label}
      </AppText>
      <AppText variant="label" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
