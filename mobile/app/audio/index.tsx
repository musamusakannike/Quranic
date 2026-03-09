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
import { Search, Mic, ArrowLeft, Download } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../lib/ThemeContext";
import { useToast } from "../../lib/ToastContext";
import * as Network from "expo-network";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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

function ReciterCard({ item, index, mainMoshaf, colors, isDark }: any) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        router.push({
          pathname: "/audio/[reciterId]",
          params: {
            reciterId: String(item.id),
            reciterName: item.name,
            server: mainMoshaf.server,
            surahList: mainMoshaf.surah_list,
          },
        });
      }}
    >
      <LinearGradient
        colors={[
          colors.surface,
          withOpacity(colors.primary, isDark ? 0.08 : 0.04),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.reciterCard, { borderColor: colors.border }]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: withOpacity(
                colors.primary,
                isDark ? 0.35 : 0.14,
              ),
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
      </LinearGradient>
    </Pressable>
  );
}

export default function AudioRecitersScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchReciters = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected || !networkState.isInternetReachable) {
          showToast("You are offline. Cannot fetch new reciters.", "offline");
          setLoading(false);
          return;
        }

        const res = await fetch(
          "https://mp3quran.net/api/v3/reciters?language=eng",
        );
        const data = await res.json();
        setReciters(data.reciters || []);
      } catch (err) {
        console.error("Error fetching reciters", err);
        showToast("Error fetching reciters.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchReciters();
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
      <ReciterCard
        item={item}
        index={index}
        mainMoshaf={mainMoshaf}
        colors={colors}
        isDark={isDark}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.12 : 0.06),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            router.back();
          }}
          style={({ pressed }) => [
            styles.headerButton,
            {
              opacity: pressed ? 0.6 : 1,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <ArrowLeft color={colors.textMain} size={24} />
        </Pressable>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            router.push("/audio/downloads");
          }}
          style={({ pressed }) => [
            styles.headerButton,
            {
              opacity: pressed ? 0.6 : 1,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <Download color={colors.textMain} size={20} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredReciters}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerWrapper}>
              <LinearGradient
                colors={[
                  colors.surface,
                  withOpacity(colors.primary, isDark ? 0.16 : 0.08),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.heroCard,
                  {
                    borderColor: withOpacity(colors.primary, 0.2),
                  },
                ]}
              >
                <Text style={[styles.heroTitle, { color: colors.textMain }]}>
                  Reciters
                </Text>
                <Text
                  style={[styles.heroSubtitle, { color: colors.textMuted }]}
                >
                  Listen to the Holy Quran recited by your favorite
                  world-renowned Qaris.
                </Text>
              </LinearGradient>

              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Search size={18} color={colors.textMuted} strokeWidth={2.5} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textMain }]}
                  placeholder="Search Reciters..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <Text style={[styles.resultCount, { color: colors.textMuted }]}>
                {filteredReciters.length} reciter
                {filteredReciters.length === 1 ? "" : "s"} found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerWrapper: {
    marginBottom: 6,
    gap: 14,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 30,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Satoshi",
    fontSize: 14,
  },
  resultCount: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    marginBottom: 2,
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
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  reciterType: {
    fontFamily: "Satoshi",
    fontSize: 13,
  },
});
