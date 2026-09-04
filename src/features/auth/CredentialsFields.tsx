import { useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { TextField } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { CredentialsForm } from './credentialsForm';

type CredentialsFieldsProps = {
  control: Control<CredentialsForm>;
  /** Kayit yeni bir sifre ister, giris kayitli olani; ikisi ayri ipucu. */
  mode: 'register' | 'login';
  /** Sifre alanindaki bitirme tusu formu gonderiyor. */
  onSubmit: () => void;
};

/**
 * E-posta ve sifre alanlari.
 *
 * Iki ekran ayni ikiliyi soruyor ve alanlar arasi gecis bir kez cozulecek bir
 * is: iki ekrana ayri ayri yazmak, birinde unutulmasi demek.
 *
 * E-postadaki bitirme tusu klavyeyi kapatmiyor, sifreye geciriyor. Kapanan
 * klavye, kullanicidan ekrana uzanip ikinci alana dokunmasini istiyor;
 * formun ritmi orada kesiliyor.
 */
export function CredentialsFields({ control, mode, onSubmit }: CredentialsFieldsProps) {
  const password = useRef<TextInput>(null);

  return (
    <>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label={strings.auth.emailLabel}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            // Odagi devretmeden once klavye kapanmasin: kapanip yeniden acilan
            // klavye ekrani zipratiyor.
            submitBehavior="submit"
            onSubmitEditing={() => password.current?.focus()}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            ref={password}
            label={strings.auth.passwordLabel}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secure
            autoCapitalize="none"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            textContentType={mode === 'register' ? 'newPassword' : 'password'}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        )}
      />
    </>
  );
}
