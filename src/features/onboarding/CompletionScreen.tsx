import { useEffect } from 'react';
import { View } from 'react-native';

import { completeOnboarding } from '@/api/endpoints';
import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { presentError } from '@/constants/errorMessages';
import { completionTitle, strings } from '@/constants/strings';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useTheme } from '@/theme';

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
  const { colors, radius, spacing } = useTheme();

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
    clearDraft();
    return true;
  });

  useEffect(() => {
    void finish.run();
    // Ekran acildiginda bir kez calisir; tekrar denemeyi kullanici tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelsFor = (groupKey: string, ids: string[] | undefined) => {
    const group = options[groupKey];
    if (!group || !ids?.length) return '—';
    return ids
      .map((id) => group.options.find((option) => option.id === id)?.label ?? id)
      .join(', ');
  };

  const failure = finish.state.status === 'error' ? finish.state.error : null;

  return (
    <Screen
      centered
      footer={
        <View>
          <Button
            title={strings.completion.primary}
            onPress={onEnterApp}
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
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.full,
          backgroundColor: colors.clay,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}
      >
        <AppText variant="title" tone="onClay" style={{ lineHeight: 36 }}>
          ✦
        </AppText>
      </View>

      {/* Isim yalin birakiliyor: ek getirmek bir isimde dogru, digerinde bozuk. */}
      <AppText variant="title" accessibilityRole="header">
        {completionTitle(answers.name ?? '')}
      </AppText>
      <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md }}>
        {strings.completion.subtitle}
      </AppText>

      {failure ? (
        <View style={{ marginTop: spacing.xl }}>
          <ErrorBanner
            message={presentError(failure).message}
            action={{ label: strings.common.retry, onPress: () => void finish.run() }}
          />
        </View>
      ) : null}

      <View
        style={{
          marginTop: spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          paddingTop: spacing.lg,
          gap: spacing.md,
        }}
      >
        <RecapRow
          label={strings.completion.recapIntent}
          value={labelsFor('intent', answers.intent)}
        />
        <RecapRow label={strings.completion.recapPhotos} value={`${answers.photos?.length ?? 0}`} />
        <RecapRow
          label={strings.completion.recapInterests}
          value={`${answers.interests?.length ?? 0}`}
        />
      </View>
    </Screen>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
      <AppText variant="label" tone="inkSoft">
        {label}
      </AppText>
      <AppText variant="label" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
