import { useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { TextField, type FieldSurface } from '@/components/TextField';
import { strings } from '@/constants/strings';

import type { CredentialsForm, RegisterForm } from './credentialsForm';

type CredentialsFieldsProps = {
  /**
   * Iki ekranin formu ayni degil: kayit formunda bir alan fazla. Ortak iki
   * alan iki formda da ayni ad ve ayni tiple duruyor.
   */
  control: Control<CredentialsForm> | Control<RegisterForm>;
  /** Kayit yeni bir sifre ister, giris kayitli olani; ikisi ayri ipucu. */
  mode: 'register' | 'login';
  /** Sifre alanindaki bitirme tusu formu gonderiyor. */
  onSubmit: () => void;
  /**
   * Alanlarin zemini.
   *
   * Iki ekranin kabugu ayni degil: biri alanlari saydam bir kartin icine
   * aliyor, digeri dogrudan gorselin uzerine koyuyor. Zemini ekran secmezse
   * ya kartin ici opak alanlarla doluyor ya da kartsiz ekranda metnin altinda
   * hicbir sey kalmiyor.
   */
  surface?: FieldSurface;
};

/**
 * E-posta ve sifre alanlari.
 *
 * Iki ekran ayni ikiliyi soruyor ve alanlar arasi gecis bir kez cozulecek bir
 * is: iki ekrana ayri ayri yazmak, birinde unutulmasi demek.
 *
 * E-postadaki bitirme tusu klavyeyi kapatmiyor, sifreye geciriyor. Kapanan
 * klavye, kullanicidan ekrana uzanip ikinci alana dokunmasini istiyor;
 * formun ritmi orada kesiliyor. Kayitta ayni devir bir alan daha suruyor:
 * sifreden dogrulama alanina.
 */
export function CredentialsFields({
  control,
  mode,
  onSubmit,
  surface = 'solid',
}: CredentialsFieldsProps) {
  const password = useRef<TextInput>(null);
  const confirmPassword = useRef<TextInput>(null);
  const isRegister = mode === 'register';
  // Ortak iki alan icin formun dar hali yetiyor; ucuncu alan yalnizca genis
  // olaninda var ve zaten yalnizca kayitta ciziliyor.
  const shared = control as Control<CredentialsForm>;

  return (
    <>
      <Controller
        control={shared}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            surface={surface}
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
        control={shared}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            surface={surface}
            ref={password}
            label={strings.auth.passwordLabel}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secure
            autoCapitalize="none"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            textContentType={isRegister ? 'newPassword' : 'password'}
            returnKeyType={isRegister ? 'next' : 'done'}
            {...(isRegister
              ? {
                  submitBehavior: 'submit' as const,
                  onSubmitEditing: () => confirmPassword.current?.focus(),
                }
              : { onSubmitEditing: onSubmit })}
          />
        )}
      />

      {isRegister ? (
        <Controller
          control={control as Control<RegisterForm>}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              surface={surface}
              ref={confirmPassword}
              label={strings.auth.confirmPasswordLabel}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          )}
        />
      ) : null}
    </>
  );
}
