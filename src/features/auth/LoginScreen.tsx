import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { login } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenIntro } from '@/components/ScreenIntro';
import { presentError } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';

import { CredentialsFields } from './CredentialsFields';
import { credentialsFormSchema, type CredentialsForm } from './credentialsForm';

type LoginScreenProps = {
  onBack: () => void;
  onSignedIn: (onboardingComplete: boolean) => void;
  /** Kayittan gelen adres tasinir; kullanici tekrar yazmaz. */
  initialEmail?: string;
};

export function LoginScreen({ onBack, onSignedIn, initialEmail = '' }: LoginScreenProps) {
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
      <ScreenIntro title={strings.auth.loginTitle} subtitle={strings.auth.loginSubtitle} />

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

      <CredentialsFields control={form.control} mode="login" onSubmit={() => void submit()} />
    </Screen>
  );
}
