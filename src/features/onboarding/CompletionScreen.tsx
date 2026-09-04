import { useEffect } from 'react';
import { View } from 'react-native';

import { completeOnboarding } from '@/api/endpoints';
import type { OptionGroups } from '@/api/schemas';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { ScreenIntro } from '@/components/ScreenIntro';
import { fieldErrorMessage, presentError } from '@/constants/errorMessages';
import { completionTitle, strings } from '@/constants/strings';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useTheme } from '@/theme';

import { ProfileMark } from './ProfileMark';
import { ProfileRecap } from './ProfileRecap';
import { saveStep } from './saveStep';

type CompletionScreenProps = {
  options: OptionGroups;
  /** Ana uygulamaya geri donulemez gecis. */
  onEnterApp: () => void;
  onEditProfile: () => void;
  /** Sunucu profili eksik buldu; reddettigi alanlarla birlikte donus. */
  onFixProfile: (fields: string[]) => void;
};

/**
 * Kapanis, kutlama degil.
 *
 * Konfeti yerine cevaplar geri okunuyor: kullaniciya ne paylastigini
 * hatirlatiyor ve bir sonraki adimi dogal kiliyor.
 */
export function CompletionScreen({
  options,
  onEnterApp,
  onEditProfile,
  onFixProfile,
}: CompletionScreenProps) {
  const { spacing } = useTheme();

  const answers = useOnboardingStore((state) => state.answers);
  const unsynced = useOnboardingStore((state) => state.unsyncedStepIds);
  const markStepSynced = useOnboardingStore((state) => state.markStepSynced);
  const clearDraft = useOnboardingStore((state) => state.clearDraft);
  const markOnboardingComplete = useAuthStore((state) => state.markOnboardingComplete);

  const finish = useAsyncAction(async () => {
    // Yazilamamis adimlar once tekrar deneniyor: sunucuda eksik bir profili
    // tamamlanmis olarak isaretlemek, kullanicinin sonradan bosluk gormesi demek.
    for (const stepId of unsynced) {
      await saveStep(stepId, answers);
      markStepSynced(stepId);
    }

    await completeOnboarding();
    markOnboardingComplete();
    return true;
  });

  useEffect(() => {
    void finish.run();
    // Ekran acildiginda bir kez calisir; tekrar denemeyi kullanici tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failure = finish.state.status === 'error' ? finish.state.error : null;

  // Uygulamaya giris sunucunun onayina bagli. Ekrana bakiyor olmak profilin
  // tamamlandigi anlamina gelmiyor: kullanici buraya bir navigasyon
  // hatasiyla da gelebilir ve o durumda eksik bir profille iceri girerdi.
  const confirmed = finish.state.status === 'success';

  // Eksik profil bir sunucu arizasi degil; bandin cikis yolu "tekrar dene"
  // degil "cevaplara don" olmali, cunku tekrar denemek ayni cevabi verecek.
  const incomplete = failure?.kind === 'validation_failed' ? failure.fields : null;
  const blocked = incomplete === null ? [] : Object.keys(incomplete);

  // Alanin kendi cumlesi varsa o yaziliyor. Genel cumle yalnizca sunucu
  // tanimadigimiz bir alan adi verdiginde kaliyor; o durumda kullaniciyi
  // hangi adima birakacagimizi da bilmiyoruz ve en azindan neyin eksik
  // oldugunu soylememiz gerekiyor.
  const firstBlocked = blocked[0];
  const incompleteMessage =
    firstBlocked === undefined || incomplete === null
      ? strings.completion.incomplete
      : `${strings.completion.incomplete} ${fieldErrorMessage(firstBlocked, incomplete[firstBlocked] ?? '')}`;

  return (
    <Screen
      align="center"
      footer={
        <View>
          <Button
            title={strings.completion.primary}
            // Taslak burada siliniyor, tamamlanma aninda degil. Tamamlanmada
            // silmek iki seyi bozuyordu: ekran gosterecegi ozeti kendi
            // siliyordu, ve "profilimi duzenle" yolu adimlari bos aciyordu.
            // Burasi akisin geri donulemez tek noktasi.
            onPress={() => {
              // Buton gri degil: onay gelmemisse basmak onayi yeniden
              // istiyor ve sonucu bant anlatiyor. Devre disi bir buton
              // neyin eksik oldugunu soylemiyor.
              if (!confirmed) {
                void finish.run();
                return;
              }
              clearDraft();
              onEnterApp();
            }}
            loading={finish.state.status === 'loading'}
          />
          <Button
            title={strings.completion.secondary}
            onPress={onEditProfile}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      }
    >
      <ProfileMark name={answers.name ?? ''} cover={answers.photos?.[0]?.url} />

      {/* Isim yalin birakiliyor: ek getirmek bir isimde dogru, digerinde bozuk. */}
      <View style={{ marginTop: spacing.xl }}>
        <ScreenIntro
          title={completionTitle(answers.name ?? '')}
          subtitle={strings.completion.subtitle}
        />
      </View>

      {/* Sarmalayici yok: bandin kendi alt boslugu var ve giristen sonra
          ikinci bir ust bosluk eklemek, bandi basliktan kopariyor. */}
      {failure ? (
        <ErrorBanner
          message={incomplete === null ? presentError(failure).message : incompleteMessage}
          action={
            incomplete === null
              ? { label: strings.common.retry, onPress: () => void finish.run() }
              : {
                  label: strings.completion.incompleteAction,
                  onPress: () => onFixProfile(blocked),
                }
          }
        />
      ) : null}

      <ProfileRecap answers={answers} options={options} />
    </Screen>
  );
}
