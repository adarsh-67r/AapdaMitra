import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme } from 'react-native';

import { LoginScreen } from '@/components/login-screen';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/lib/use-auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync();
  }, [status]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {status === "loading" ? (
        <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </ThemedView>
      ) : status === "signed-out" ? (
        <LoginScreen />
      ) : (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Brand.accent }}>
          <Tabs.Screen name="index" options={{ title: 'Report' }} />
          <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
          <Tabs.Screen name="shelters" options={{ title: 'Shelters' }} />
          <Tabs.Screen name="my-reports" options={{ title: 'My Reports' }} />
          <Tabs.Screen name="emergency" options={{ title: 'Emergency' }} />
        </Tabs>
      )}
    </ThemeProvider>
  );
}
