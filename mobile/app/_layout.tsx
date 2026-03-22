import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import { ThemeProvider } from "../lib/ThemeContext";
import { AppSettingsProvider } from "../lib/AppSettingsContext";
import { BookmarksProvider } from "../lib/BookmarksContext";
import { AudioProvider } from "../lib/AudioContext";
import { ToastProvider } from "../lib/ToastContext";
import { DownloadsProvider } from "../lib/DownloadsContext";
import MiniPlayer from "../components/MiniPlayer";
import { View } from "react-native";
import { registerWidgetUpdateTask } from "../lib/WidgetManager";
import { HifzProvider } from "../lib/HifzContext";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
    void registerWidgetUpdateTask();
  }, []);

  useEffect(() => {
    // Only handle error here, we'll hide splash screen in a better place or app index
    if (error) {
      SplashScreen.hideAsync();
    }
  }, [error]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider>
          <ToastProvider>
            <DownloadsProvider>
              <AudioProvider>
                <BookmarksProvider>
                  <AppSettingsProvider>
                    <HifzProvider>
                      <View style={{ flex: 1 }}>
                        {!loaded && !error ? null : (
                          <>
                            <Stack screenOptions={{ headerShown: false }} />
                            <MiniPlayer />
                          </>
                        )}
                      </View>
                    </HifzProvider>
                  </AppSettingsProvider>
                </BookmarksProvider>
              </AudioProvider>
            </DownloadsProvider>
          </ToastProvider>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
