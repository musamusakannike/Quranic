import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ImageBackground,
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
    image: require("../assets/images/adhkaar/sunrise.jpg"),
    height: 220,
  },
  {
    id: "evening",
    title: "Evening",
    subtitle: "Supplications for the evening",
    icon: Moon,
    color: "#6366F1", // Indigo
    image: require("../assets/images/adhkaar/sunset.jpg"),
    height: 180,
  },
  {
    id: "after-solah",
    title: "After Solaah",
    subtitle: "Supplications after every prayer",
    icon: Clock,
    color: "#10B981", // Emerald
    image: require("../assets/images/adhkaar/after-solah.jpg"),
    height: 190,
  },
  {
    id: "40-robbanahs",
    title: "40 Robbanahs",
    subtitle: "Supplications from the Holy Quran",
    icon: BookOpen,
    color: "#EC4899", // Pink
    image: require("../assets/images/adhkaar/40-robanna.jpg"),
    height: 230,
  },
  {
    id: "daily-adhkaar",
    title: "Daily Adhkaar",
    subtitle: "Essential daily supplications",
    icon: Sparkles,
    color: "#8B5CF6", // Violet
    image: require("../assets/images/adhkaar/sunrise.jpg"), // Fallback to sunrise
    height: 170,
  },
];

const CategoryCard = ({ category, colors }: any) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.masonryCard,
        { height: category.height },
        {
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => {
        // Future implementation: navigate to the specific category page
      }}
    >
      <ImageBackground
        source={category.image}
        style={styles.cardImageBackground}
        imageStyle={styles.cardImage}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.cardContent}>
          <View style={[styles.iconWrapSmall, { backgroundColor: category.color }]}>
            <category.icon color="#FFF" size={20} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{category.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {category.subtitle}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

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

        <View style={styles.masonryContainer}>
          <View style={styles.masonryColumn}>
            {ADHKAAR_CATEGORIES.filter((_, i) => i % 2 === 0).map((category) => (
              <CategoryCard key={category.id} category={category} colors={colors} />
            ))}
          </View>
          <View style={styles.masonryColumn}>
            {ADHKAAR_CATEGORIES.filter((_, i) => i % 2 !== 0).map((category) => (
              <CategoryCard key={category.id} category={category} colors={colors} />
            ))}
          </View>
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
  masonryContainer: {
    flexDirection: "row",
    gap: 12,
  },
  masonryColumn: {
    flex: 1,
    gap: 12,
  },
  masonryCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImageBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardImage: {
    borderRadius: 20,
  },
  cardContent: {
    padding: 16,
    zIndex: 2,
  },
  iconWrapSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTextWrap: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  cardSubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
