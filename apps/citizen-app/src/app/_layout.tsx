import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme } from 'react-native';

import { LoginScreen } from '@/components/login-screen';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/use-auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {loading ? (
        <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </ThemedView>
      ) : !session ? (
        <LoginScreen />
      ) : (
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" options={{ title: 'Report' }} />
          <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
          <Tabs.Screen name="shelters" options={{ title: 'Shelters' }} />
          <Tabs.Screen name="my-reports" options={{ title: 'My Reports' }} />
        </Tabs>
      )}
    </ThemeProvider>
  );
}
