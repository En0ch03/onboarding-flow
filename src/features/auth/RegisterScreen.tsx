import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { register as registerAccount } from '@/api/endpoints';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { GlassPanel } from '@/components/GlassPanel';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenIntro } from '@/components/ScreenIntro';
import { fieldErrorMessage, isRetryable, presentError } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { journeyStops } from '@/features/onboarding/artwork/journeyArtwork';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme';

import { CredentialsFields } from './CredentialsFields';
import { registerFormSchema, type RegisterForm } from './credentialsForm';

type RegisterScreenProps = {
  onBack: () => void;
  onRegistered: () => void;
  /** Bu e-posta zaten kayitliysa girise gecis; adres tasinir. */
  onSignInInstead: (email: string) => void;
};

export function RegisterScreen({ onBack, onRegistered, onSignInInstead }: RegisterScreenProps) {
  const { spacing } = useTheme();
  const startSession = useAuthStore((state) => state.startSession);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
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
    // Dogrulama alani formda kaliyor, istekte yer almiyor: sunucu ayni sifreyi
    // iki kez almiyor ve sozlesme buyumuyor.
    const session = await action.run({ email: values.email, password: values.password });
    if (!session) return;

    await startSession(session);
    onRegistered();
  });

  const failure = action.state.status === 'error' ? action.state.error : null;
  const showBanner = failure !== null && failure.kind !== 'validation_failed';

  return (
    <Screen
      journeyProgress={journeyStops.register}
      // Metnin zeminini kart tasiyor; ustune bir de perde cekmek gorseli iki
      // kez karartirdi. Ust serit kartin disinda, onun perdesi yerinde kaliyor.
      contentVeil={false}
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
      {/* Kart yalnizca formu tasiyor: buton ve yasal satir disarida kaliyor,
          cunku sayfanin dibindeki eylem kartin bir parcasi degil. */}
      {/* Kartin arkasinda akisin kizil gorseli duruyor ve genis bir yuzeyin
          isi onu gostermek, tona bogmak degil: uyum yapan materyal arkadaki
          parlakliga gore kendi tonunu kuruyor ve gorseli bir renk katmaninin
          altinda birakiyor. Bu secim yalnizca karta ait; seritteki dugmeler ve
          alttan acilan sayfa uyum yapan materyalde kaliyor, cunku kucuk bir
          kontrolun uzerindeki isaret arkasindaki her sey degistikce okunamaz
          hale geliyor. */}
      {/* Kart uygulamanin kendi semasinda kaliyor: acik sema cihazda camin
          kenarina beyaz bir cerceve gibi duran bir parlama koydu. Bugunun
          bedeli, koyu semanin cama ekledigi hafif karartma; onu kartin
          altindaki gorselin karartmasini sifira cekerek dengeliyoruz. */}
      <GlassPanel glassStyle="clear">
        <ScreenIntro title={strings.auth.registerTitle} subtitle={strings.auth.registerSubtitle} />

        {/* Bandin eylemi hatanin turune gore degisiyor: alinmis bir e-posta
          girise goturur, gecici bir ariza ise ayni istegi tekrarlatir.
          Tekrar denenebilir bir hatada dugmesiz bir bant, metnin soyledigi
          seyi ("tekrar dene") yapacak yeri gostermiyordu. */}
        {showBanner ? (
          <ErrorBanner
            message={presentError(failure).message}
            {...(failure.kind === 'email_taken'
              ? {
                  action: {
                    label: presentError(failure).action ?? '',
                    onPress: () => onSignInInstead(form.getValues('email')),
                  },
                }
              : isRetryable(failure)
                ? {
                    action: {
                      label: presentError(failure).action ?? strings.common.retry,
                      onPress: () => void submit(),
                    },
                  }
                : {})}
          />
        ) : null}

        <CredentialsFields
          control={form.control}
          mode="register"
          // Alanlar kartin icinde: opak zeminleri camin gosterecek bir seyini
          // birakmiyordu.
          surface="glass"
          onSubmit={() => void submit()}
        />
      </GlassPanel>
    </Screen>
  );
}
