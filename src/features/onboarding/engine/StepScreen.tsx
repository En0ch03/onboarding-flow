import { useCallback, useState } from 'react';
import { Keyboard, View } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenIntro } from '@/components/ScreenIntro';
import { strings } from '@/constants/strings';
import { useOnboardingStore } from '@/state/onboardingStore';
import { haptics } from '@/feedback/haptics';
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

  // Uyari adima bagli: geri donuldugunde veya bir adim atlandiginda acik
  // kaliyordu ve kullanici hic dokunmadigi bir adimi kirmizi uyariyla
  // aciyordu. Adim kimligi degisince uyari kapaniyor.
  const [hintStepId, setHintStepId] = useState<string | null>(null);

  const step = engine.currentStep;

  const advance = useCallback(
    (skipped: boolean) => {
      if (!step) return;

      // Adim gonderilmeden once yazilmamis sayiliyor, gonderim bittiginde
      // yazilmis. Yalnizca hatada isaretlemek son adimda bir yaris
      // biraktiyordu: istek daha yoldayken tamamlanma ekrani aciliyor ve
      // sunucu, henuz ulasmamis bir cevaba gore karar veriyordu. Bekleyen
      // kayitlari tamamlanmadan once tekrar deneyen mekanizma zaten var;
      // adimin ona dahil olmasi yetiyor.
      markStepUnsynced(step.id);
      void saveStep(step.id, engine.answers)
        .then(() => markStepSynced(step.id))
        .catch(() => markStepUnsynced(step.id));

      if (skipped) engine.skip();
      else engine.goNext();
    },
    [engine, markStepSynced, markStepUnsynced, step],
  );

  if (step && step.id !== hintStepId) {
    setHintStepId(step.id);
    if (hintShown) setHintShown(false);
  }

  if (!step) return null;

  const StepBody = step.component;

  // Ipucu bir cumle de olabilir, cevaplara bakan bir fonksiyon da. Fonksiyon
  // `null` donerse hicbir sey gosterilmiyor - adimin govdesi zaten konusuyor.
  const hint =
    typeof step.incompleteHint === 'function'
      ? step.incompleteHint(engine.answers)
      : step.incompleteHint;

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
              ? {
                  skip: {
                    label: strings.common.skipForNow,
                    onPress: () => {
                      haptics.advance();
                      advance(true);
                    },
                  },
                }
              : {})}
          />
          <ProgressBar current={engine.progress.current} total={engine.progress.total} />
        </View>
      }
      footer={
        <View>
          {/* Buton hicbir zaman gri degil: devre disi bir buton neyin eksik
              oldugunu soylemiyor, basildiginda soylenen bir cumle soyluyor.
              Ipucu, hata bandi gibi zeminli bir kutu degil ciplak bir satir:
              bandin isi olan bir seyin bozuldugunu soylemek, ipucununki ise
              henuz yapilmamis bir seyi hatirlatmak. Ikisi ayni gorunmemeli. */}
          {hintShown && !engine.canContinue && hint ? (
            <AppText
              variant="caption"
              tone="danger"
              accessibilityLiveRegion="polite"
              style={{ marginBottom: spacing.md, textAlign: 'center' }}
            >
              {hint}
            </AppText>
          ) : null}

          <Button
            title={
              engine.progress.current === engine.progress.total
                ? strings.common.finish
                : strings.common.continue
            }
            onPress={() => {
              if (!engine.canContinue) {
                haptics.refuse();
                // Klavye kapaniyor: uyari butonun hemen ustunde ve acik
                // klavyeyle orasi gorunmuyor. Hatayi gostermek, gosterilecek
                // yeri acmayi da kapsiyor.
                Keyboard.dismiss();
                setHintShown(true);
                return;
              }
              haptics.advance();
              setHintShown(false);
              advance(false);
            }}
          />

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
      <ScreenIntro title={step.title} subtitle={step.subtitle} />

      <StepBody values={engine.answers} onChange={engine.setAnswers} options={options} />
    </Screen>
  );
}
