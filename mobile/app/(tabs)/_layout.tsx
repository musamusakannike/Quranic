import React from "react";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Home, BookOpen, Bookmark, Settings } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";
import { isLiquidGlassSupported } from "../../hooks/useLiquidGlass";
import FallbackTabBar, {
  type FallbackTabBarProps,
} from "../../components/navigation/FallbackTabBar";

function IosLiquidGlassTabs() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const activeColor = isDark ? colors.primaryLight : colors.primary;

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={activeColor}
      iconColor={{ default: colors.icon, selected: activeColor }}
      labelStyle={{
        default: {
          color: colors.icon,
          fontFamily: isRTL ? "CairoMedium" : "SatoshiMedium",
          fontSize: 11,
        },
        selected: {
          color: activeColor,
          fontFamily: isRTL ? "CairoBold" : "SatoshiBold",
          fontSize: 11,
        },
      }}
      blurEffect={
        isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"
      }
      shadowColor="transparent"
      disableTransparentOnScrollEdge
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync();
        },
      }}
    >
      <NativeTabs.Trigger
        name="index"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Label>{t("tabs.home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="chapters"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Label>
          {t("tabs.chapters")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
          md="menu_book"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="bookmarks"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Label>
          {t("tabs.bookmarks")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark.fill" }}
          md="bookmark"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Label>
          {t("tabs.settings")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function FallbackTabs() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => (
        <FallbackTabBar {...(props as unknown as FallbackTabBarProps)} />
      )}
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? colors.primaryLight : colors.primary,
        tabBarInactiveTintColor: colors.icon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Home size={size ?? 20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: t("tabs.chapters"),
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size ?? 20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: t("tabs.bookmarks"),
          tabBarIcon: ({ color, size }) => (
            <Bookmark size={size ?? 20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <Settings size={size ?? 20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassSupported()) {
    return <IosLiquidGlassTabs />;
  }
  return <FallbackTabs />;
}
