import { useCallback, useEffect, useState } from 'react';

import { fetchOptionGroups, readCachedOptionGroups } from '@/api/config';
import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { strings } from '@/constants/strings';
import { HomeScreen } from '@/features/app/HomeScreen';
import { LaunchScreen } from '@/features/app/LaunchScreen';
import { preloadJourneyArtwork } from '@/features/onboarding/artwork/journeyArtwork';
import { useAuthStore } from '@/state/authStore';
import { adoptServerProfile, bootstrap } from '@/state/bootstrap';
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
    //
    // Gorsel sekansla birlikte bekleniyor, arkasindan degil: sirayla
    // koslardi ve acilis iki beklemenin toplami kadar uzardi. Gorselin
    // kendi ust siniri var, o yuzden bu bekleme sinirsiz degil.
    const [result] = await Promise.all([bootstrap(), preloadJourneyArtwork()]);
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

  /**
   * Oturum akisin ortasinda biterse uygulama orada birakmiyor.
   *
   * Yenileme tukendiginde token'lar siliniyor ama faz kendiliginden
   * degismiyordu: kullanici token'siz halde adimlarda kaliyor, her istekte
   * "oturumun sona erdi" bandini goruyor ve o bandin gosterdigi cikis yolu
   * hicbir yere goturmuyordu. Taslak diskte kaliyor; kullanici giris
   * yapinca kaldigi adimdan devam ediyor.
   */
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.status === 'anonymous' && previous.status === 'authenticated') {
          setPhase('welcome');
        }
      }),
    [],
  );

  const retryOptions = useCallback(async () => {
    try {
      setOptions(await fetchOptionGroups());
    } catch {
      setOptions(readCachedOptionGroups());
    }
  }, []);

  if (phase === 'loading') return <LaunchScreen />;

  if (phase === 'welcome') {
    return (
      <AuthNavigator
        onAuthenticated={(onboardingComplete) => {
          void resolveSignIn(onboardingComplete, setPhase);
        }}
      />
    );
  }

  if (phase === 'onboarding') {
    // Listeler hic gelmediyse secim adimlari bos gosterilmez; anlamli bir
    // hata ve yeniden deneme sunulur.
    if (!options) return <OptionsUnavailableScreen onRetry={() => void retryOptions()} />;

    return (
      <OnboardingNavigator
        options={options}
        onEnterApp={() => setPhase('app')}
        onLeaveFlow={() => {
          // Taslak bilerek silinmiyor: kullanici geri geldiginde cevaplari
          // yerinde bulacak.
          void useAuthStore.getState().endSession();
          setPhase('welcome');
        }}
      />
    );
  }

  return <HomeScreen />;
}

/**
 * Giristen sonra nereye gidilecegi.
 *
 * Ayri bir fonksiyon cunku hata tam olarak burada yasadi: profili benimseyen
 * fonksiyon dogru olsa bile **cagrilmadigi** surece kullanici baska bir
 * cihazda verdigi cevaplari gormuyordu. O fonksiyonun kendi testleri bu
 * cagriyi tutmuyor; burasi tutuyor.
 *
 * Giris, acilis sekansinin tamamini yeniden kosturmuyor ama sunucudaki
 * profili okumasi gerekiyor. Uzlastirma da ayni cagrinin icinde, cunku
 * aradan gecen surede sunucudan bir secenek kaldirilmis olabilir.
 */
export async function resolveSignIn(
  onboardingComplete: boolean,
  setPhase: (phase: Phase) => void,
): Promise<void> {
  setPhase('loading');

  try {
    const adoption = await adoptServerProfile();

    // Oturum bu arada bittiyse kullanici akisin icine birakilmiyor: token'i
    // olmayan biri her adimda 401 alir ve "oturumun sona erdi" bandini
    // akisin ortasinda gorurdu.
    if (adoption === 'session-lost') return setPhase('welcome');

    setPhase(onboardingComplete || adoption === 'complete' ? 'app' : 'onboarding');
  } catch {
    // Beklenmeyen bir dusus bekleme ekraninda birakmamali: orada ne geri
    // tusu var ne yeniden deneme, tek cikis uygulamayi kapatmak olurdu.
    setPhase('welcome');
  }
}

function OptionsUnavailableScreen({ onRetry }: { onRetry: () => void }) {
  const { spacing } = useTheme();

  return (
    <Screen align="center" footer={<Button title={strings.common.retry} onPress={onRetry} />}>
      <AppText variant="title">{strings.errors.optionsUnavailableTitle}</AppText>
      <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md }}>
        {strings.errors.optionsUnavailableBody}
      </AppText>
    </Screen>
  );
}
