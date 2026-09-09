import { View } from 'react-native';

import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { StepProps } from '../engine/types';
import { normalizePhone } from './phoneNumber';

/**
 * Akisin ilk adimi: telefon numarasi.
 *
 * Numara akisin basinda soruluyor cunku hesabin sahibini belirleyen sey o;
 * profil sorulari ondan sonra geliyor. Dogrulama (kod gonderme) yok --
 * numaranin sunucu tarafinda bugun bir karsiligi yok ve olmayan bir uca
 * yazilmis bir dogrulama akisi, sinanamayacak bir vaat olurdu.
 *
 * Ulke kodu alanda sabit ve yazilamiyor. Bir ulke listesi, kendi basina
 * sunucudan gelmesi gereken ikinci bir taksonomi acardi.
 */
export function PhoneStep({ values, onChange }: StepProps) {
  return (
    <View>
      <TextField
        label={strings.steps.phoneLabel}
        prefix={strings.steps.phonePrefix}
        placeholder={strings.steps.phonePlaceholder}
        value={values.phone ?? ''}
        // Temizlik yazarken yapiliyor, alandan cikarken degil: yapistirilan
        // bir numara (`+90 555 123 45 67`) alanda oldugu gibi kalirsa
        // kullanici neyin saklandigini goremez.
        onChangeText={(text) => onChange({ phone: normalizePhone(text) })}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        // On haneden uzun: yapistirilan ulke kodlu bicimler alana sigsin ve
        // temizlik onlari kirpabilsin.
        maxLength={15}
        returnKeyType="done"
      />
    </View>
  );
}
