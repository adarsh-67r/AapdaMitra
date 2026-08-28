import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { LoginScreen } from '@/components/login-screen';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/use-auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync();
  }, [status]);

  // The navigator's own chrome is themed too. Left on the stock DarkTheme /
  // DefaultTheme, the tab bar and the screen background underneath sit on
  // React Navigation's greys, which are not this product's paper.
  const navigationTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: theme.background,
      card: theme.backgroundElement,
      border: theme.border,
      text: theme.text,
      primary: theme.accent,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      {status === "loading" ? (
        <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </ThemedView>
      ) : status === "signed-out" ? (
        <LoginScreen />
      ) : (
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.textSecondary,
            tabBarStyle: {
              backgroundColor: theme.backgroundElement,
              borderTopColor: theme.border,
            },
          }}
        >
          {/* Dashboard first, matching the web client: what is true where you
              are standing comes before the form for telling anyone about it. */}
          <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
          <Tabs.Screen name="index" options={{ title: 'Report' }} />
          <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
          <Tabs.Screen name="shelters" options={{ title: 'Shelter' }} />
          <Tabs.Screen name="my-reports" options={{ title: 'Mine' }} />
          <Tabs.Screen name="emergency" options={{ title: 'Help' }} />
        </Tabs>
      )}
    </ThemeProvider>
  );
}
