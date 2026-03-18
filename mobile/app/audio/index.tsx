import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Pressable, FlatList } from "react-native";
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

export interface Riwayah {
  id: number;
  name: string;
}

export interface MoshafDefinition {
  id: number;
  moshaf_type: number;
  moshaf_id: number;
  name: string;
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
  const [riwayat, setRiwayat] = useState<Riwayah[]>([]);
  const [moshafs, setMoshafs] = useState<MoshafDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiwayahId, setSelectedRiwayahId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const moshafTypes = useMemo(() => {
    return [
      { id: "murattal", name: "Murattal" },
      { id: "mujawwad", name: "Mujawwad" },
      { id: "mo-lim", name: "Teaching" },
    ];
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected || !networkState.isInternetReachable) {
          showToast("You are offline. Cannot fetch new reciters.", "offline");
          setLoading(false);
          return;
        }

        const [recitersRes, riwayatRes, moshafsRes] = await Promise.all([
          fetch("https://mp3quran.net/api/v3/reciters?language=eng"),
          fetch("https://mp3quran.net/api/v3/riwayat?language=eng"),
          fetch("https://mp3quran.net/api/v3/moshaf?language=eng"),
        ]);

        const [recitersData, riwayatData, moshafsData] = await Promise.all([
          recitersRes.json(),
          riwayatRes.json(),
          moshafsRes.json(),
        ]);

        setReciters(recitersData.reciters || []);
        setRiwayat(riwayatData.riwayat || []);
        setMoshafs(moshafsData.riwayat || []); // Note: API returns 'riwayat' key for both
      } catch (err) {
        console.error("Error fetching data", err);
        showToast("Error fetching reciters.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredReciters = useMemo(() => {
    let result = reciters;

    // Filter by Riwayah
    if (selectedRiwayahId) {
      // Find all moshaf IDs that belong to this Riwayah
      const validMoshafIds = moshafs
        .filter((m: MoshafDefinition) => m.moshaf_id === selectedRiwayahId)
        .map((m: MoshafDefinition) => m.id);

      result = result.filter((r: Reciter) =>
        r.moshaf.some((m: Moshaf) => validMoshafIds.includes(m.moshaf_type)),
      );
    }

    // Filter by Type (Murattal, Mujawwad, etc.)
    if (selectedType) {
      result = result.filter((r: Reciter) =>
        r.moshaf.some((m: Moshaf) => {
          const moshafDef = moshafs.find((def: MoshafDefinition) => def.id === m.moshaf_type);
          if (!moshafDef) return false;
          const nameLower = moshafDef.name.toLowerCase();
          if (selectedType === "murattal") return nameLower.includes("murattal");
          if (selectedType === "mujawwad") return nameLower.includes("mojawwad");
          if (selectedType === "mo-lim") return nameLower.includes("mo'lim") || nameLower.includes("molim");
          return false;
        }),
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((r: Reciter) => r.name.toLowerCase().includes(lowerQuery));
    }

    return result;
  }, [reciters, searchQuery, selectedRiwayahId, selectedType, moshafs]);

  const renderItem = ({ item, index }: { item: Reciter; index: number }) => {
    // Find the best moshaf to display based on filters
    let mainMoshaf = item.moshaf[0];
    
    if (selectedRiwayahId || selectedType) {
      const filteredMoshafs = item.moshaf.filter((m: Moshaf) => {
        const moshafDef = moshafs.find((def: MoshafDefinition) => def.id === m.moshaf_type);
        if (!moshafDef) return false;
        
        const matchesRiwayah = !selectedRiwayahId || moshafDef.moshaf_id === selectedRiwayahId;
        
        let matchesType = true;
        if (selectedType) {
          const nameLower = moshafDef.name.toLowerCase();
          if (selectedType === "murattal") matchesType = nameLower.includes("murattal");
          else if (selectedType === "mujawwad") matchesType = nameLower.includes("mojawwad");
          else if (selectedType === "mo-lim") matchesType = nameLower.includes("mo'lim") || nameLower.includes("molim");
        }
        
        return matchesRiwayah && matchesType;
      });
      
      if (filteredMoshafs.length > 0) {
        mainMoshaf = filteredMoshafs[0];
      }
    }

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

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.textMain }]}>
                  Riwayat (Narration)
                </Text>
                <FlatList
                  data={[{ id: null as unknown as number, name: "All" }, ...riwayat]}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedRiwayahId(item.id);
                      }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            selectedRiwayahId === item.id
                              ? colors.primary
                              : colors.surface,
                          borderColor:
                            selectedRiwayahId === item.id
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              selectedRiwayahId === item.id
                                ? "#fff"
                                : colors.textMain,
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                  ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                  contentContainerStyle={{ paddingRight: 16 }}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.textMain }]}>
                  Moshaf (Style)
                </Text>
                <FlatList
                  data={[{ id: null as unknown as string, name: "All" }, ...moshafTypes]}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedType(item.id);
                      }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            selectedType === item.id
                              ? colors.primary
                              : colors.surface,
                          borderColor:
                            selectedType === item.id
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              selectedType === item.id ? "#fff" : colors.textMain,
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                  ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                  contentContainerStyle={{ paddingRight: 16 }}
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
  filterSection: {
    gap: 10,
  },
  filterLabel: {
    fontFamily: "SatoshiBold",
    fontSize: 15,
    marginLeft: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
});
