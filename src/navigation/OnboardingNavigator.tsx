import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, BackHandler } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { CompletionScreen } from '@/features/onboarding/CompletionScreen';
import { StepScreen } from '@/features/onboarding/engine/StepScreen';
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
};

/**
 * Adimlar tek bir ekranda yasiyor; yigin iki rotadan ibaret.
 *
 * Adimlar ayri rotalar olsaydi akisa bir adim eklemek navigasyona da
 * dokunmayi gerektirirdi ve "adim eklemek bir dosya ve bir dizi elemani"
 * iddiasi dogru olmazdi.
 */
export function OnboardingNavigator({ options, onEnterApp }: OnboardingNavigatorProps) {
  const setActiveStep = useOnboardingStore((state) => state.setActiveStep);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Steps">
        {({ navigation }) => (
          <StepScreen
            steps={steps}
            options={options}
            onFinish={() => navigation.navigate('Completion')}
            onExit={confirmExit}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Completion" options={{ gestureEnabled: false }}>
        {({ navigation }) => (
          <CompletionScreen
            options={options}
            onEnterApp={onEnterApp}
            onEditProfile={() => {
              // Atlanan bir adima donmek icin: akisin basina degil, ilk
              // adima donuluyor ve cevaplar yerinde duruyor.
              setActiveStep(steps[0]?.id ?? '');
              navigation.navigate('Steps');
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
 */
function confirmExit() {
  Alert.alert(strings.exitFlow.title, strings.exitFlow.body, [
    { text: strings.exitFlow.stay, style: 'cancel' },
    { text: strings.exitFlow.leave, style: 'destructive', onPress: () => BackHandler.exitApp() },
  ]);
}
