import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useTheme } from "../lib/ThemeContext";
import { useAppSettings } from "../lib/AppSettingsContext";
import { BookOpen, Bookmark, Settings, BellRing } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Welcome to Quranic",
    description:
      "Read, reflect, and connect with the Holy Quran. Immerse yourself in the divine words.",
    icon: BookOpen,
  },
  {
    id: "2",
    title: "Seamless Progress",
    description:
      "Your recitation progress is saved seamlessly. Pick up exactly where you left off.",
    icon: Bookmark,
  },
  {
    id: "3",
    title: "Daily Reminders",
    description:
      "Build a consistent habit with daily reminders tailored to your schedule.",
    icon: BellRing,
  },
  {
    id: "4",
    title: "Fully Customizable",
    description:
      "Personalize your experience with themes, translations, and transliterations.",
    icon: Settings,
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { setHasSeenOnboarding } = useAppSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const buttonScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / width);
      // We can't update state directly here in a worklet simply on reanimated 2 so we rely on onScrollEndDrag/onMomentumScrollEnd from ScrollView props if needed or runOnJS.
    },
  });

  const handleScrollEnd = (e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(offset / width));
  };

  const handleNext = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
      setCurrentIndex((prev) => prev + 1);
    } else {
      await setHasSeenOnboarding(true);
      router.replace("/(tabs)");
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
      >
        {SLIDES.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Icon size={64} color={colors.primary} strokeWidth={1.5} />
                </View>
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.textMain }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.description, { color: colors.textMuted }]}>
                  {slide.description}
                </Text>
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];
              const dotWidth = interpolate(
                scrollX.value,
                inputRange,
                [8, 24, 8],
                Extrapolation.CLAMP,
              );
              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
                Extrapolation.CLAMP,
              );
              return { width: dotWidth, opacity };
            });

            return (
              <Animated.View
                key={index.toString()}
                style={[
                  styles.dot,
                  { backgroundColor: colors.primary },
                  dotStyle,
                ]}
              />
            );
          })}
        </View>

        <AnimatedPressable
          style={[styles.buttonWrapper, buttonAnimatedStyle]}
          onPressIn={() => (buttonScale.value = withSpring(0.96))}
          onPressOut={() => (buttonScale.value = withSpring(1))}
          onPress={handleNext}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 0.4,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontFamily: "SatoshiBold",
    fontSize: 28,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "SatoshiBold",
    fontSize: 18,
  },
});
