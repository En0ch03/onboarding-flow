import { View } from 'react-native';

import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { StepProps } from '../engine/types';
import { MAX_INPUT_LENGTH, normalizePhone } from './phoneNumber';

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
        surface="field"
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
        // Sinir modulden geliyor: temizlikle birlikte sinaniyor, cunku dar bir
        // sinir yapistirilan metni temizlik gormeden kirpar.
        maxLength={MAX_INPUT_LENGTH}
        returnKeyType="done"
        // Sayisal klavyede bitirme tusu yok: onsuz klavyeden cikmanin yolu
        // ekranin bos bir yerine dokunmak ve bu, gorunmeyen bir yol.
        dismissAccessory
      />
    </View>
  );
}
