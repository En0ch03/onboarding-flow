import { useMemo } from 'react';
import { View } from 'react-native';

import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { StepProps } from '../engine/types';
import { BirthDateField } from './BirthDateField';
import { chosenParts, draftFromParts, partsFromDraft } from './dateWheel';

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
  // Bugun her isteyisde yeniden hesaplanirsa yil listesi ve acilis satiri
  // referans olarak degisip carki gereksiz yere yeniden kuruyor.
  const today = useMemo(() => new Date(), []);

  // Cark her zaman bir satir gostermek zorunda, ama alan bos kalabilmeli.
  // `opening` carkin acilacagi yer, `parts` ise kullanicinin gercekten
  // sectigi deger; ikisi ayni sey degil.
  const opening = useMemo(() => partsFromDraft(values.birthDate, today), [values.birthDate, today]);
  const parts = useMemo(() => chosenParts(values.birthDate), [values.birthDate]);

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
        opening={opening}
        onChange={(next) => onChange({ birthDate: draftFromParts(next) })}
        today={today}
      />
    </View>
  );
}
