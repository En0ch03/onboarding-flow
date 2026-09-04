import { useEffect } from 'react';
import { View } from 'react-native';

import { completeOnboarding } from '@/api/endpoints';
import type { OptionGroups } from '@/api/schemas';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { ScreenIntro } from '@/components/ScreenIntro';
import { presentError } from '@/constants/errorMessages';
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
};

/**
 * Kapanis, kutlama degil.
 *
 * Konfeti yerine cevaplar geri okunuyor: kullaniciya ne paylastigini
 * hatirlatiyor ve bir sonraki adimi dogal kiliyor.
 */
export function CompletionScreen({ options, onEnterApp, onEditProfile }: CompletionScreenProps) {
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
          message={presentError(failure).message}
          action={{ label: strings.common.retry, onPress: () => void finish.run() }}
        />
      ) : null}

      <ProfileRecap answers={answers} options={options} />
    </Screen>
  );
}
