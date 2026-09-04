import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { register as registerAccount } from '@/api/endpoints';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { fieldErrorMessage, presentError } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme';

import { credentialsFormSchema, type CredentialsForm } from './credentialsForm';

type RegisterScreenProps = {
  onBack: () => void;
  onRegistered: () => void;
  /** Bu e-posta zaten kayitliysa girise gecis; adres tasinir. */
  onSignInInstead: (email: string) => void;
};

export function RegisterScreen({ onBack, onRegistered, onSignInInstead }: RegisterScreenProps) {
  const { spacing } = useTheme();
  const startSession = useAuthStore((state) => state.startSession);

  const form = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsFormSchema),
    defaultValues: { email: '', password: '' },
    // Her tus vurusunda degil, alandan cikildiginda dogrula: kullanici hala
    // yazarken kirmizi bir mesaj gostermek yardim degil, acele ettirme.
    mode: 'onTouched',
  });

  const action = useAsyncAction(registerAccount);

  useEffect(() => {
    if (action.state.status !== 'error') return;
    const error = action.state.error;

    // Alan bazli hatalar ilgili alanin altina duser; geri kalani forma.
    if (error.kind === 'validation_failed') {
      for (const [field, code] of Object.entries(error.fields)) {
        if (field === 'email' || field === 'password') {
          form.setError(field, { message: fieldErrorMessage(field, code) });
        }
      }
    }
  }, [action.state, form]);

  const submit = form.handleSubmit(async (values) => {
    const session = await action.run(values);
    if (!session) return;

    await startSession(session);
    onRegistered();
  });

  const failure = action.state.status === 'error' ? action.state.error : null;
  const showBanner = failure !== null && failure.kind !== 'validation_failed';

  return (
    <Screen
      header={<ScreenHeader onBack={onBack} />}
      footer={
        <View>
          <Button
            title={strings.auth.registerSubmit}
            onPress={() => void submit()}
            loading={action.state.status === 'loading'}
          />
          <AppText
            variant="caption"
            tone="inkSoft"
            style={{ marginTop: spacing.md, textAlign: 'center' }}
          >
            {strings.auth.legal}
          </AppText>
        </View>
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {strings.auth.registerTitle}
      </AppText>
      <AppText
        variant="subhead"
        tone="inkSoft"
        style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
      >
        {strings.auth.registerSubtitle}
      </AppText>

      {showBanner ? (
        <ErrorBanner
          message={presentError(failure).message}
          action={
            failure.kind === 'email_taken'
              ? {
                  label: presentError(failure).action ?? '',
                  onPress: () => onSignInInstead(form.getValues('email')),
                }
              : undefined
          }
        />
      ) : null}

      <Controller
        control={form.control}
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
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            label={strings.auth.passwordLabel}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
          />
        )}
      />
    </Screen>
  );
}
