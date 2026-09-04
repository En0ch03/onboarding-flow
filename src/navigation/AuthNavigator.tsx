import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/LoginScreen';
import { RegisterScreen } from '@/features/auth/RegisterScreen';
import { WelcomeDifferenceScreen } from '@/features/auth/WelcomeDifferenceScreen';
import { WelcomePromiseScreen } from '@/features/auth/WelcomePromiseScreen';

import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  /** Oturum kuruldu; kok gecisi bundan sonrasina karar verir. */
  onAuthenticated: (onboardingComplete: boolean) => void;
};

/**
 * Hesap acilmadan onceki ekranlar.
 *
 * Basliklar navigasyondan degil ekranin kendisinden geliyor: karsilama
 * ekranlarinda ust serit yok, form ekranlarinda yalnizca geri var.
 */
export function AuthNavigator({ onAuthenticated }: AuthNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="WelcomePromise">
        {({ navigation }) => (
          <WelcomePromiseScreen
            onStart={() => navigation.navigate('WelcomeDifference')}
            onSignIn={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="WelcomeDifference">
        {({ navigation }) => (
          <WelcomeDifferenceScreen
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Register')}
            onSkip={() => navigation.navigate('Register')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onBack={() => navigation.goBack()}
            onRegistered={() => onAuthenticated(false)}
            onSignInInstead={(email) => navigation.navigate('Login', { email })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Login">
        {({ navigation, route }) => (
          <LoginScreen
            onBack={() => navigation.goBack()}
            onSignedIn={onAuthenticated}
            initialEmail={route.params?.email ?? ''}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
