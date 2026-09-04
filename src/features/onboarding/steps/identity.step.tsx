import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';
import { birthDateMessages, inspectBirthDate } from './birthDate';

/**
 * Yas kapisi akisin ilk adiminda.
 *
 * Kullanicidan fotograf ve tercihlerini isteyip sonra "burayi kullanamazsin"
 * demek yanlis sira; sorunun cevabi akisin en basinda belli oluyor.
 *
 * Tarih uc ayri alan. Yerel tarih secici mobilde daha cok hata uretiyor ve
 * ekran okuyucuyla kullanimi zor. Otomatik alan atlama da yok: kullanici
 * kendi ritminde yaziyor, imlec elinden alinmiyor.
 */
export function IdentityStep({ values, onChange }: StepProps) {
  const { spacing } = useTheme();
  const birthDate = values.birthDate ?? { day: '', month: '', year: '' };
  const problem = inspectBirthDate(values.birthDate);
  const touched = Object.values(birthDate).some((part) => part !== '');

  const setPart = (part: 'day' | 'month' | 'year') => (text: string) =>
    onChange({ birthDate: { ...birthDate, [part]: text.replace(/[^0-9]/g, '') } });

  return (
    <View>
      <TextField
        label={strings.steps.nameLabel}
        value={values.name ?? ''}
        onChangeText={(name) => onChange({ name })}
        autoComplete="given-name"
        textContentType="givenName"
        maxLength={50}
        returnKeyType="next"
      />

      <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.sm }}>
        {strings.steps.birthDateLabel}
      </AppText>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TextField
            label={strings.steps.dayLabel}
            value={birthDate.day}
            onChangeText={setPart('day')}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label={strings.steps.monthLabel}
            value={birthDate.month}
            onChangeText={setPart('month')}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={{ flex: 1.3 }}>
          <TextField
            label={strings.steps.yearLabel}
            value={birthDate.year}
            onChangeText={setPart('year')}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      {touched && problem !== null && problem !== 'incomplete' ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {birthDateMessages[problem]}
        </AppText>
      ) : null}
    </View>
  );
}
