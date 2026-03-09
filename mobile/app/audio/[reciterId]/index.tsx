import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Play } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../../lib/ThemeContext";
import { getChapterMetadata } from "../../../lib/QuranHelper";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function AudioSurahsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { reciterId, reciterName, server, surahList } = useLocalSearchParams<{
    reciterId: string;
    reciterName: string;
    server: string;
    surahList: string;
  }>();

  const surahs = useMemo(() => {
    if (!surahList) return [];
    return surahList.split(",").map((idStr) => {
      const id = parseInt(idStr, 10);
      const meta = getChapterMetadata(id);
      return {
        id,
        name: meta?.englishname || `Surah ${id}`,
        arabicName: meta?.arabicname || "",
      };
    });
  }, [surahList]);

  const renderItem = ({
    item,
    index,
  }: {
    item: { id: number; name: string; arabicName: string };
    index: number;
  }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 20, 200)).duration(300)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.surahCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => {
            void Haptics.selectionAsync();
            router.push({
              pathname: "/audio/[reciterId]/[surahId]",
              params: {
                reciterId,
                surahId: String(item.id),
                reciterName,
                server,
                surahName: item.name,
              },
            });
          }}
        >
          <View
            style={[
              styles.numberCircle,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <Text style={[styles.numberText, { color: colors.textMuted }]}>
              {item.id}
            </Text>
          </View>
          <View style={styles.surahInfo}>
            <Text
              style={[styles.surahName, { color: colors.textMain }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.surahArabic, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {item.arabicName}
            </Text>
          </View>
          <View
            style={{
              padding: 8,
              backgroundColor: withOpacity(colors.primary, 0.1),
              borderRadius: 999,
            }}
          >
            <Play size={18} color={colors.primary} />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: 16 }}>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>
          {reciterName}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Select a Surah to listen
        </Text>
      </View>
      <FlashList
        data={surahs}
        renderItem={renderItem}
        estimatedItemSize={70}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontFamily: "SatoshiBold", fontSize: 24, marginBottom: 4 },
  headerSubtitle: { fontFamily: "SatoshiMedium", fontSize: 15 },
  surahCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    fontFamily: "SatoshiBold",
    fontSize: 14,
  },
  surahInfo: {
    flex: 1,
    gap: 4,
  },
  surahName: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  surahArabic: {
    fontFamily: "AmiriQuran",
    fontSize: 16,
  },
});
