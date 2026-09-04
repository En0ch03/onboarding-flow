import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { fetchOptionGroups, readCachedOptionGroups } from '@/api/config';
import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { strings } from '@/constants/strings';
import { HomeScreen } from '@/features/app/HomeScreen';
import { bootstrap } from '@/state/bootstrap';
import { useTheme } from '@/theme';

import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';

type Phase = 'loading' | 'welcome' | 'onboarding' | 'app';

/**
 * Uc makro faz, tek karar noktasi.
 *
 * Hangi fazin gosterilecegi acilis sekansindan geliyor; ekranlar bu karari
 * kendileri vermiyor. Boylece "kaldigi yerden devam" tek bir yerde dogru
 * olmak zorunda.
 */
export function RootNavigator() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [options, setOptions] = useState<OptionGroups | null>(null);

  const start = useCallback(async () => {
    // Baslangic durumu zaten 'loading'; burada tekrar ayarlamak, etkinin
    // govdesinde es zamanli bir durum yazmasi anlamina gelirdi.
    const result = await bootstrap();
    setOptions(readCachedOptionGroups());
    setPhase(result.destination);
  }, []);

  useEffect(() => {
    // Acilis sekansi bir kez, montajda calisiyor. Kural etkiden durum
    // yazilmasini uyariyor; burada yazma bir bekleme sonrasinda oluyor ve
    // hedefin hesaplanabilecegi baska bir an yok.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start();
  }, [start]);

  const retryOptions = useCallback(async () => {
    try {
      setOptions(await fetchOptionGroups());
    } catch {
      setOptions(readCachedOptionGroups());
    }
  }, []);

  if (phase === 'loading') return <HoldingScreen />;

  if (phase === 'welcome') {
    return (
      <AuthNavigator
        onAuthenticated={(onboardingComplete) => {
          setPhase(onboardingComplete ? 'app' : 'onboarding');
        }}
      />
    );
  }

  if (phase === 'onboarding') {
    // Listeler hic gelmediyse secim adimlari bos gosterilmez; anlamli bir
    // hata ve yeniden deneme sunulur.
    if (!options) return <OptionsUnavailableScreen onRetry={() => void retryOptions()} />;

    return <OnboardingNavigator options={options} onEnterApp={() => setPhase('app')} />;
  }

  return <HomeScreen />;
}

/** Hidrasyon bitene kadar hicbir yonlendirme yapilmiyor. */
function HoldingScreen() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.paper,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={colors.clay} />
    </View>
  );
}

function OptionsUnavailableScreen({ onRetry }: { onRetry: () => void }) {
  const { spacing } = useTheme();

  return (
    <Screen centered footer={<Button title={strings.common.retry} onPress={onRetry} />}>
      <AppText variant="title">{strings.errors.optionsUnavailableTitle}</AppText>
      <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md }}>
        {strings.errors.optionsUnavailableBody}
      </AppText>
    </Screen>
  );
}
