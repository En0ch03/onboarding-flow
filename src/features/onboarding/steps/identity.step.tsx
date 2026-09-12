import { useMemo } from 'react';
import { View } from 'react-native';

import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { StepProps } from '../engine/types';
import { BirthDateField } from './BirthDateField';
import { draftFromParts, partsFromDraft } from './dateParts';

/**
 * Yas kapisi akisin basinda: onunde yalnizca telefon adimi var.
 *
 * Kullanicidan fotograf ve tercihlerini isteyip sonra "burayi kullanamazsin"
 * demek yanlis sira; sorunun cevabi akisin en basinda belli oluyor. Telefon
 * adimi bunu bozmuyor: tek bir alan ve kullanicinin zaten verdigi bir bilgi,
 * kapiya varmadan once emek isteyen hicbir sey sorulmuyor.
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
        surface="field"
        label={strings.steps.nameLabel}
        value={values.name ?? ''}
        onChangeText={(name) => onChange({ name })}
        // Kirpma yazarken degil alandan cikilinca: yazarken kirpmak, ad ile
        // soyad arasina bosluk koymayi imkansiz kilardi.
        onBlur={() => {
          const settled = (values.name ?? '').trim();
          if (settled !== values.name) onChange({ name: settled });
        }}
        autoComplete="given-name"
        textContentType="givenName"
        // Sunucunun kabul ettigi ad uzunlugu sozlesmede yazmiyor. Sinir yine
        // de bir yerde durmali: sinirsiz bir alan, ekrani ve kapanis
        // cumlesini bozacak kadar uzun bir deger kabul eder. Deger, bir adin
        // makul ustunden secildi; sunucu bir sinir bildirirse oradan gelmeli.
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
