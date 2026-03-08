import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import { ThemeProvider } from "../lib/ThemeContext";
import { AppSettingsProvider } from "../lib/AppSettingsContext";
import { BookmarksProvider } from "../lib/BookmarksContext";

// Prevent auto hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    AmiriQuran: AmiriQuran_400Regular,
    Satoshi: require("../assets/fonts/Satoshi-Regular.ttf"),
    SatoshiMedium: require("../assets/fonts/Satoshi-Medium.ttf"),
    SatoshiBold: require("../assets/fonts/Satoshi-Bold.ttf"),
  });

  useEffect(() => {
    // Only handle error here, we'll hide splash screen in a better place or app index
    if (error) {
      SplashScreen.hideAsync();
    }
  }, [error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <BookmarksProvider>
        <AppSettingsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AppSettingsProvider>
      </BookmarksProvider>
    </ThemeProvider>
  );
}
