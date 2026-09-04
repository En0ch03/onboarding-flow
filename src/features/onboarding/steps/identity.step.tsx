import { useMemo } from 'react';
import { View } from 'react-native';

import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { StepProps } from '../engine/types';
import { BirthDateField } from './BirthDateField';
import { draftFromParts, partsFromDraft } from './dateParts';

/**
 * Yas kapisi akisin ilk adiminda.
 *
 * Kullanicidan fotograf ve tercihlerini isteyip sonra "burayi kullanamazsin"
 * demek yanlis sira; sorunun cevabi akisin en basinda belli oluyor.
 *
 * Ad yazilarak, tarih secilerek aliniyor. Ikisi ayni turden bir soru degil:
 * ad serbest metin, tarih ise takvimden bir nokta. Tarihi yazdirmak, ekranin
 * yarisini klavyeye verip ustune "31 Subat" yazma imkani birakiyordu.
 */
export function IdentityStep({ values, onChange }: StepProps) {
  // Bugun her cizimde yeniden hesaplanirsa yil listesi referans olarak
  // degisip listeyi gereksiz yere yeniden kuruyor.
  const today = useMemo(() => new Date(), []);
  const parts = useMemo(() => partsFromDraft(values.birthDate), [values.birthDate]);

  return (
    <View>
      <TextField
        label={strings.steps.nameLabel}
        value={values.name ?? ''}
        onChangeText={(name) => onChange({ name })}
        autoComplete="given-name"
        textContentType="givenName"
        maxLength={50}
        returnKeyType="done"
      />

      <BirthDateField
        value={parts}
        onChange={(next) => onChange({ birthDate: draftFromParts(next) })}
        today={today}
      />
    </View>
  );
}
