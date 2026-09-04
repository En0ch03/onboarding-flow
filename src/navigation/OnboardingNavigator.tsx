import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { CompletionScreen } from '@/features/onboarding/CompletionScreen';
import { StepScreen } from '@/features/onboarding/engine/StepScreen';
import { firstIncompleteStepId } from '@/features/onboarding/engine/stepFlow';
import { stepForFields } from '@/features/onboarding/steps/blockingStep';
import { resolveSteps } from '@/features/onboarding/steps/resolveSteps';
import { steps } from '@/features/onboarding/steps/steps';
import { strings } from '@/constants/strings';
import { useOnboardingStore } from '@/state/onboardingStore';

export type OnboardingStackParamList = {
  Steps: undefined;
  Completion: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

type OnboardingNavigatorProps = {
  options: OptionGroups;
  onEnterApp: () => void;
  /** Ilk adimda geri: akistan cikis. Taslak korunur. */
  onLeaveFlow: () => void;
};

/**
 * Adimlar tek bir ekranda yasiyor; yigin iki rotadan ibaret.
 *
 * Adimlar ayri rotalar olsaydi akisa bir adim eklemek navigasyona da
 * dokunmayi gerektirirdi ve "adim eklemek bir dosya ve bir dizi elemani"
 * iddiasi dogru olmazdi.
 */
export function OnboardingNavigator({
  options,
  onEnterApp,
  onLeaveFlow,
}: OnboardingNavigatorProps) {
  const setActiveStep = useOnboardingStore((state) => state.setActiveStep);

  // Zorunluluk kurallari sunucudan; tanimdaki degerler yalnizca sunucu
  // sussa gecerli olan.
  const flow = useMemo(() => resolveSteps(steps, options), [options]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Steps">
        {({ navigation }) => (
          <StepScreen
            steps={flow}
            options={options}
            onFinish={() => navigation.navigate('Completion')}
            onExit={() => confirmExit(onLeaveFlow)}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Completion" options={{ gestureEnabled: false }}>
        {({ navigation }) => (
          <CompletionScreen
            options={options}
            onEnterApp={onEnterApp}
            onFixProfile={(fields) => {
              // Once sunucunun soyledigi alan, sonra istemcinin kendi gordugu
              // engel. Ikisi de yoksa son adim kaliyor; o durumda kullanici
              // ayni reddi bir daha alabilir, bu yuzden bant hangi alanin
              // sorunlu oldugunu ayrica yaziyor.
              const answers = useOnboardingStore.getState().answers;
              const target =
                stepForFields(flow, fields) ??
                firstIncompleteStepId(flow, answers) ??
                flow[flow.length - 1]?.id ??
                '';

              setActiveStep(target);
              navigation.popTo('Steps');
            }}
            onEditProfile={() => {
              // Bir adim geriye: kullanici tamamlanmadan hemen once neredeyse
              // oraya donuyor. Akisin basina atmak, duzeltmek istedigi tek
              // cevap icin bes adimi yeniden gezdirmek olurdu.
              setActiveStep(flow[flow.length - 1]?.id ?? '');

              // `navigate` degil `popTo`: bu surumde `navigate` yiginda
              // geriye donmuyor, ayni ada ikinci bir ekran itiyor. Tamamlanma
              // ekrani adimlarin altinda asili kaliyor ve kullanici herhangi
              // bir adimda geri kaydirdiginda oraya dusuyordu. Kapanis
              // ekranina yalnizca akisi bitirerek gelinir; asagisinda
              // beklemez.
              navigation.popTo('Steps');
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/**
 * Ilk adimda geri: cikis onaya baglaniyor. Kazara cikip cevaplarini
 * kaybettigini sanan bir kullanici geri gelmiyor.
 *
 * Cikis, uygulamayi kapatmak degil karsilamaya donmek. Uygulamayi kendi
 * kendine kapatmak iOS'ta zaten mumkun degil ve orada dugme sessizce hicbir
 * sey yapiyordu. Donus noktasi olarak karsilama dogru yer: taslak diskte
 * kaliyor, oturum kapaniyor ve kullanici geri giris yaptiginda acilis
 * sekansi onu kaldigi adima birakiyor - diyalogda yazan sey tam olarak bu.
 */
function confirmExit(onLeaveFlow: () => void) {
  Alert.alert(strings.exitFlow.title, strings.exitFlow.body, [
    { text: strings.exitFlow.stay, style: 'cancel' },
    { text: strings.exitFlow.leave, style: 'destructive', onPress: onLeaveFlow },
  ]);
}
