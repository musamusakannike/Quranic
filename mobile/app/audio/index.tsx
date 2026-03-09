import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Search, Mic } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../lib/ThemeContext";

export interface Reciter {
  id: number;
  name: string;
  letter: string;
  moshaf: Moshaf[];
}

export interface Moshaf {
  id: number;
  name: string;
  server: string;
  surah_total: number;
  moshaf_type: number;
  surah_list: string;
}

export default function AudioRecitersScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("https://mp3quran.net/api/v3/reciters?language=eng")
      .then((res) => res.json())
      .then((data) => {
        setReciters(data.reciters || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching reciters", err);
        setLoading(false);
      });
  }, []);

  const filteredReciters = useMemo(() => {
    if (!searchQuery.trim()) return reciters;
    const lowerQuery = searchQuery.toLowerCase();
    return reciters.filter((r) => r.name.toLowerCase().includes(lowerQuery));
  }, [reciters, searchQuery]);

  const renderItem = ({ item, index }: { item: Reciter; index: number }) => {
    // We'll use the first moshaf for simplicity
    const mainMoshaf = item.moshaf[0];
    if (!mainMoshaf) return null;

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 20, 200)).duration(300)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.reciterCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => {
            void Haptics.selectionAsync();
            router.push({
              pathname: "/audio/[reciterId]/",
              params: {
                reciterId: String(item.id),
                reciterName: item.name,
                server: mainMoshaf.server,
                surahList: mainMoshaf.surah_list,
              },
            });
          }}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <Mic size={24} color={colors.primary} />
          </View>
          <View style={styles.reciterInfo}>
            <Text
              style={[styles.reciterName, { color: colors.textMain }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.reciterType, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {mainMoshaf.name}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Search size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textMain }]}
          placeholder="Search Reciters..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredReciters}
          renderItem={renderItem}
          estimatedItemSize={70}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  reciterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  reciterInfo: {
    flex: 1,
    gap: 4,
  },
  reciterName: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  reciterType: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
});
