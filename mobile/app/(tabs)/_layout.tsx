import { Tabs } from "expo-router";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";
import { Home, BookOpen, Bookmark, Settings } from "lucide-react-native";
import { Platform, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function TabIcon({
  focused,
  activeColor,
  inactiveColor,
  Icon,
}: {
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  Icon: typeof Home;
}) {
  if (focused) {
    return (
      <LinearGradient
        colors={[withOpacity(activeColor, 0.9), activeColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minWidth: 46,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} color="#FFFFFF" strokeWidth={2.7} />
      </LinearGradient>
    );
  }

  return (
    <View
      style={{
        minWidth: 46,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <Icon size={20} color={inactiveColor} strokeWidth={2.5} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const canUseLiquidGlass =
    Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  const handleTabPress = () => {
    void Haptics.selectionAsync();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.icon,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            {Platform.OS === "ios" && canUseLiquidGlass ? (
              <GlassView
                style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
                glassEffectStyle="regular"
                colorScheme={isDark ? "dark" : "light"}
                tintColor={withOpacity(colors.primary, isDark ? 0.16 : 0.1)}
              />
            ) : null}
            {Platform.OS === "ios" && !canUseLiquidGlass ? (
              <BlurView
                style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
                tint={isDark ? "dark" : "light"}
                intensity={58}
              />
            ) : null}
            <LinearGradient
              colors={
                Platform.OS === "ios"
                  ? [
                      withOpacity(colors.surface, isDark ? 0.36 : 0.46),
                      withOpacity(colors.primary, isDark ? 0.22 : 0.14),
                    ]
                  : [
                      withOpacity(colors.surface, 0.98),
                      withOpacity(colors.primary, isDark ? 0.17 : 0.1),
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
            {Platform.OS === "ios" ? (
              <LinearGradient
                colors={[withOpacity("#FFFFFF", isDark ? 0.16 : 0.32), "transparent"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ position: "absolute", top: 0, right: 0, left: 0, height: 24 }}
              />
            ) : null}
          </View>
        ),
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios" ? "transparent" : colors.surface,
          borderWidth: 0,
          borderTopColor:
            Platform.OS === "ios"
              ? withOpacity(colors.border, 0.28)
              : withOpacity(colors.border, 0.7),
          borderTopWidth: Platform.OS === "ios" ? 0.6 : 1,
          elevation: 0,
          shadowColor: "#000000",
          shadowOpacity: Platform.OS === "ios" ? (isDark ? 0.4 : 0.22) : 0,
          shadowRadius: Platform.OS === "ios" ? 24 : 0,
          shadowOffset: { width: 0, height: -8 },
          height: Platform.OS === "ios" ? 70 : 68,
          paddingBottom: Platform.OS === "ios" ? 26 : 12,
          paddingTop: 10,
          position: Platform.OS === "ios" ? "absolute" : "relative",
          left: Platform.OS === "ios" ? 12 : 0,
          right: Platform.OS === "ios" ? 12 : 0,
          bottom: Platform.OS === "ios" ? 20 : 0,
          marginHorizontal: Platform.OS === "ios" ? 10 : 0,
          marginBottom: 0,
          borderRadius: Platform.OS === "ios" ? 28 : 0,
          overflow: "hidden",
        },
        tabBarLabelStyle: {
          fontFamily: isRTL ? "CairoMedium" : "SatoshiMedium",
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeColor={colors.primary}
              inactiveColor={colors.icon}
              Icon={Home}
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: t("tabs.chapters"),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeColor={colors.primary}
              inactiveColor={colors.icon}
              Icon={BookOpen}
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: t("tabs.bookmarks"),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeColor={colors.primary}
              inactiveColor={colors.icon}
              Icon={Bookmark}
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeColor={colors.primary}
              inactiveColor={colors.icon}
              Icon={Settings}
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}
