import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '@/theme';
import { useAppFonts } from '@/theme/useAppFonts';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { ready } = useAppFonts();
  const theme = useTheme();

  // Yazi tipleri hazir olmadan ekran cizilmiyor: once varsayilan aileyle
  // cizip sonra degistirmek, metnin gozle gorulur sekilde yeniden akmasina
  // yol aciyor.
  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.colors.paper }} />;

  return (
    <NavigationContainer theme={navigationTheme(theme)}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

/**
 * Navigasyonun kendi zemin rengi de temadan geliyor; aksi halde ekran
 * gecislerinde bir kare boyunca beyaz bir zemin goruntuleniyor.
 */
function navigationTheme(theme: ReturnType<typeof useTheme>): Theme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.paper,
      card: theme.colors.paper,
      text: theme.colors.ink,
      border: theme.colors.hairline,
      primary: theme.colors.clay,
    },
  };
}
