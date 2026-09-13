import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Home, BookOpen, Bookmark, Settings } from "lucide-react-native";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

const INDICATOR_WIDTH = 58;
const INDICATOR_HEIGHT = 32;

const SPRING = {
  damping: 22,
  stiffness: 280,
  mass: 0.65,
  overshootClamping: false,
} as const;

const TAB_ICONS: Record<string, typeof Home> = {
  index: Home,
  chapters: BookOpen,
  bookmarks: Bookmark,
  settings: Settings,
};

export type FallbackTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        href?: string | null;
        tabBarAccessibilityLabel?: string;
        tabBarIcon?: (props: {
          focused: boolean;
          color: string;
          size: number;
        }) => React.ReactNode;
      };
    }
  >;
  navigation: {
    emit: (e: {
      type: string;
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export default function FallbackTabBar({
  state,
  descriptors,
  navigation,
}: FallbackTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isRTL } = useLanguage();

  const visible = useMemo(
    () =>
      state.routes.filter(
        (route) => descriptors[route.key]?.options?.href !== null
      ),
    [state.routes, descriptors]
  );

  const focusedKey = state.routes[state.index]?.key;
  const focusedVisibleIndex = Math.max(
    0,
    visible.findIndex((route) => route.key === focusedKey)
  );

  const [barWidth, setBarWidth] = useState(0);
  const tabWidth =
    visible.length > 0 && barWidth > 0 ? barWidth / visible.length : 0;
  const indicatorX = useSharedValue(0);
  const hasPositioned = useRef(false);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const visualIndex = isRTL
      ? visible.length - 1 - focusedVisibleIndex
      : focusedVisibleIndex;
    const target = visualIndex * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;

    if (!hasPositioned.current) {
      indicatorX.value = target;
      hasPositioned.current = true;
      return;
    }
    indicatorX.value = withSpring(target, SPRING);
  }, [focusedVisibleIndex, tabWidth, isRTL, visible.length, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const activeColor = colors.primary;
  const inactiveColor = colors.icon;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopColor: isDark
            ? "rgba(31, 60, 49, 0.7)"
            : "rgba(229, 231, 235, 0.8)",
          backgroundColor: Platform.OS === "ios" ? "transparent" : colors.surface,
        },
      ]}
    >
      {/* iOS Frosted Glass Backing */}
      {Platform.OS === "ios" && (
        <>
          <BlurView
            intensity={isDark ? 60 : 75}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(20, 45, 36, 0.75)"
                  : "rgba(255, 255, 255, 0.78)",
              },
            ]}
          />
          {/* Subtle top rim light */}
          <View
            style={[
              styles.rimLight,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.4)",
              },
            ]}
          />
        </>
      )}

      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                backgroundColor: isDark
                  ? "rgba(10, 143, 122, 0.2)"
                  : "rgba(5, 108, 92, 0.12)",
                borderColor: isDark
                  ? "rgba(10, 143, 122, 0.35)"
                  : "rgba(5, 108, 92, 0.18)",
              },
              indicatorStyle,
            ]}
          />
        )}

        {visible.map((route) => {
          const isFocused = route.key === focusedKey;
          const options = descriptors[route.key]?.options;
          const label = options?.title ?? route.name;
          const Icon =
            TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? Home;
          const color = isFocused ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              onPress={() => {
                void Haptics.selectionAsync();
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.iconSlot}>
                {options?.tabBarIcon ? (
                  options.tabBarIcon({
                    focused: isFocused,
                    color,
                    size: 20,
                  })
                ) : (
                  <Icon
                    size={20}
                    color={color}
                    strokeWidth={isFocused ? 2.5 : 2.0}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: isRTL
                      ? isFocused
                        ? "CairoBold"
                        : "CairoMedium"
                      : isFocused
                      ? "SatoshiBold"
                      : "SatoshiMedium",
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    position: "relative",
    overflow: "hidden",
  },
  rimLight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  row: {
    alignItems: "flex-start",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 1,
    gap: 3,
  },
  iconSlot: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    paddingHorizontal: 2,
  },
});
