import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { login } from '@/api/endpoints';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { presentError } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme';

import { credentialsFormSchema, type CredentialsForm } from './credentialsForm';

type LoginScreenProps = {
  onBack: () => void;
  onSignedIn: (onboardingComplete: boolean) => void;
  /** Kayittan gelen adres tasinir; kullanici tekrar yazmaz. */
  initialEmail?: string;
};

export function LoginScreen({ onBack, onSignedIn, initialEmail = '' }: LoginScreenProps) {
  const { spacing } = useTheme();
  const startSession = useAuthStore((state) => state.startSession);

  const form = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsFormSchema),
    defaultValues: { email: initialEmail, password: '' },
    mode: 'onTouched',
  });

  const action = useAsyncAction(login);

  const submit = form.handleSubmit(async (values) => {
    const session = await action.run(values);
    if (!session) return;

    await startSession(session);
    onSignedIn(session.onboarding_complete);
  });

  const failure = action.state.status === 'error' ? action.state.error : null;

  return (
    <Screen
      header={<ScreenHeader onBack={onBack} />}
      footer={
        <Button
          title={strings.auth.loginSubmit}
          onPress={() => void submit()}
          loading={action.state.status === 'loading'}
        />
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {strings.auth.loginTitle}
      </AppText>
      <AppText
        variant="subhead"
        tone="inkSoft"
        style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
      >
        {strings.auth.loginSubtitle}
      </AppText>

      {/* Hatali giriste alanlar bosaltilmiyor: kullanici genellikle tek bir
          karakteri duzeltecek, hepsini yeniden yazmayacak. */}
      {failure ? (
        <ErrorBanner
          message={presentError(failure).message}
          {...(failure.kind === 'network' || failure.kind === 'server_error'
            ? { action: { label: strings.common.retry, onPress: () => void submit() } }
            : {})}
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
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
          />
        )}
      />
    </Screen>
  );
}
