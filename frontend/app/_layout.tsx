import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { accessToken, hydrate } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await hydrate();
      } catch (error) {
        console.error('Failed to prepare app:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {accessToken ? (
        <Stack.Screen name="(app)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
