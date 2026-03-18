import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { useTheme } from "../lib/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronRight, Sun, Moon, Clock, BookOpen, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";

const ADHKAAR_CATEGORIES = [
  {
    id: "morning",
    title: "Morning",
    subtitle: "Supplications for the morning",
    icon: Sun,
    color: "#F59E0B", // Amber
  },
  {
    id: "evening",
    title: "Evening",
    subtitle: "Supplications for the evening",
    icon: Moon,
    color: "#6366F1", // Indigo
  },
  {
    id: "after-solah",
    title: "After Solaah",
    subtitle: "Supplications after every prayer",
    icon: Clock,
    color: "#10B981", // Emerald
  },
  {
    id: "40-robbanahs",
    title: "40 Robbanahs",
    subtitle: "Supplications from the Holy Quran",
    icon: BookOpen,
    color: "#EC4899", // Pink
  },
  {
    id: "daily-adhkaar",
    title: "Daily Adhkaar",
    subtitle: "Essential daily supplications",
    icon: Sparkles,
    color: "#8B5CF6", // Violet
  },
];

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function AdhkaarScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.14 : 0.08),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.textMain} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>Adhkaar</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, { color: colors.textMain }]}>
            Daily Remembrance 🤲
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.textMuted }]}>
            Establish a connection with Allah through these selected authentic supplications.
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
          {ADHKAAR_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: withOpacity(colors.border, 0.5),
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={() => {
                // Future implementation: navigate to the specific category page
                // router.push(`/adhkaar/${category.id}`);
              }}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: withOpacity(category.color, 0.15) },
                ]}
              >
                <category.icon color={category.color} size={24} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: colors.textMain }]}>
                  {category.title}
                </Text>
                <Text style={[styles.categorySubtitle, { color: colors.textMuted }]}>
                  {category.subtitle}
                </Text>
              </View>
              <ChevronRight color={colors.textMuted} size={20} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  introSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  introTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    marginBottom: 8,
  },
  introSubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
    lineHeight: 22,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 17,
  },
  categorySubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
});
