import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WelcomeDifferenceScreen } from '@/features/auth/WelcomeDifferenceScreen';
import { WelcomePromiseScreen } from '@/features/auth/WelcomePromiseScreen';

import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Hesap acilmadan onceki ekranlar.
 *
 * Basliklar navigasyondan degil ekranin kendisinden geliyor: karsilama
 * ekranlarinda ust serit yok, adim ekranlarinda ise sayac ve atlama
 * baglantisiyla birlikte tek bir seride toplaniyor.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="WelcomePromise">
        {({ navigation }) => (
          <WelcomePromiseScreen
            onStart={() => navigation.navigate('WelcomeDifference')}
            onSignIn={() => navigation.navigate('WelcomeDifference')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="WelcomeDifference">
        {({ navigation }) => (
          <WelcomeDifferenceScreen
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('WelcomePromise')}
            onSkip={() => navigation.navigate('WelcomePromise')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
