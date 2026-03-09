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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Select Reciter",
        }}
      />
      <Stack.Screen
        name="[reciterId]/index"
        options={{
          title: "Select Surah",
        }}
      />
      <Stack.Screen
        name="[reciterId]/[surahId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
