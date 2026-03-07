import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../lib/ThemeContext";

export default function SettingsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.textMain }]}>
        Settings Tab
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: "SatoshiMedium",
    fontSize: 20,
  },
});
