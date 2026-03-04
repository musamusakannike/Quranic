import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../lib/ThemeContext";

export default function Index() {
  const { colors, isDark, theme, setTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            shadowColor: "#000",
          },
        ]}
      >
        <Text style={[styles.arabicText, { color: colors.textMain }]}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </Text>
        <Text style={[styles.englishText, { color: colors.textMuted }]}>
          In the name of Allah, the Entirely Merciful, the Especially Merciful.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                theme === "light" ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => setTheme("light")}
        >
          <Text style={{ color: theme === "light" ? "#fff" : colors.textMain }}>
            Light
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                theme === "dark" ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => setTheme("dark")}
        >
          <Text style={{ color: theme === "dark" ? "#fff" : colors.textMain }}>
            Dark
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                theme === "system" ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => setTheme("system")}
        >
          <Text
            style={{ color: theme === "system" ? "#fff" : colors.textMain }}
          >
            System
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    marginBottom: 40,
  },
  arabicText: {
    fontFamily: "AmiriQuran",
    fontSize: 42,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 70,
  },
  englishText: {
    fontFamily: "InterMedium",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});
