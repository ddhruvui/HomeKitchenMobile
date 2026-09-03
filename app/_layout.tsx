import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Newsreader_500Medium, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold } from '@expo-google-fonts/public-sans';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persistOptions, queryClient } from '@/lib/query';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({ Newsreader_500Medium, Newsreader_600SemiBold, PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold, DMMono_500Medium });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions} onSuccess={() => { queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries()); }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack>
    </PersistQueryClientProvider>
  );
}
