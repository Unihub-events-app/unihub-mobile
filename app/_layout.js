import "react-native-reanimated";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSessionStore } from "../lib/auth";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { GitHubUpdater } from "../components/GitHubUpdater";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { resolvedMode, theme } = useTheme();

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <GitHubUpdater />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    useSessionStore.getState().hydrateSession();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <RootLayoutContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
