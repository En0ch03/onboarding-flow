import { useCallback, useState } from 'react';
import { View } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { strings } from '@/constants/strings';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useTheme } from '@/theme';

import { saveStep } from '../saveStep';
import type { StepDefinition } from './types';
import { useStepEngine } from './useStepEngine';

type StepScreenProps = {
  steps: StepDefinition[];
  options: OptionGroups;
  onFinish: () => void;
  /** Ilk adimdan geri: akisin disina cikis cagirana birakiliyor. */
  onExit: () => void;
};

/**
 * Adimlarin tek kabugu.
 *
 * Ekran, adim bilesenine yalnizca cevaplari ve bir degistirici veriyor;
 * adimlar navigasyonu, ilerlemeyi veya kaydetmeyi bilmiyor.
 */
export function StepScreen({ steps, options, onFinish, onExit }: StepScreenProps) {
  const { spacing } = useTheme();
  const engine = useStepEngine(steps, { onFinish });
  const markStepUnsynced = useOnboardingStore((state) => state.markStepUnsynced);
  const markStepSynced = useOnboardingStore((state) => state.markStepSynced);
  const [hintShown, setHintShown] = useState(false);

  const step = engine.currentStep;

  const advance = useCallback(
    (skipped: boolean) => {
      if (!step) return;

      // Kayit ilerlemeyi bloke etmiyor: cevap zaten cihazda duruyor ve
      // basarisiz kalan adim tamamlanmadan once tekrar deneniyor.
      void saveStep(step.id, engine.answers)
        .then(() => markStepSynced(step.id))
        .catch(() => markStepUnsynced(step.id));

      if (skipped) engine.skip();
      else engine.goNext();
    },
    [engine, markStepSynced, markStepUnsynced, step],
  );

  if (!step) return null;

  const StepBody = step.component;

  return (
    <Screen
      header={
        <View>
          <ScreenHeader
            onBack={() => {
              if (!engine.goBack()) onExit();
            }}
            step={engine.progress}
            {...(step.skippable
              ? { skip: { label: strings.common.skipForNow, onPress: () => advance(true) } }
              : {})}
          />
          <ProgressBar current={engine.progress.current} total={engine.progress.total} />
        </View>
      }
      footer={
        <View>
          {/* Buton hicbir zaman gri degil: devre disi bir buton neyin eksik
              oldugunu soylemiyor, basildiginda soylenen bir cumle soyluyor. */}
          <Button
            title={
              engine.progress.current === engine.progress.total
                ? strings.common.finish
                : strings.common.continue
            }
            onPress={() => {
              if (!engine.canContinue) {
                setHintShown(true);
                return;
              }
              setHintShown(false);
              advance(false);
            }}
          />

          {hintShown && !engine.canContinue && step.incompleteHint ? (
            <AppText
              variant="caption"
              tone="danger"
              accessibilityLiveRegion="polite"
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              {step.incompleteHint}
            </AppText>
          ) : null}
          {step.skippable && step.skipCost ? (
            <AppText
              variant="caption"
              tone="inkSoft"
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              {step.skipCost}
            </AppText>
          ) : null}
        </View>
      }
    >
      <AppText variant="title" accessibilityRole="header" style={{ marginTop: spacing.lg }}>
        {step.title}
      </AppText>
      <AppText
        variant="subhead"
        tone="inkSoft"
        style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
      >
        {step.subtitle}
      </AppText>

      <StepBody values={engine.answers} onChange={engine.setAnswers} options={options} />
    </Screen>
  );
}
