import { Stack } from "expo-router";
import { useTheme } from "../../lib/ThemeContext";

export default function AudioLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textMain,
        headerTitleStyle: {
          fontFamily: "SatoshiBold",
        },
        headerShadowVisible: false,
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[reciterId]/index" />
      <Stack.Screen name="[reciterId]/[surahId]" />
    </Stack>
  );
}
