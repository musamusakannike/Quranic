import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Pressable, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Search, Mic, ArrowLeft, Download, Filter, X, Headphones } from "lucide-react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
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

interface VerseByVerseReciter {
  identifier: string;
  name: string;
  englishName: string;
  type: string;
}

type ReciterMode = "chapter" | "verse_by_verse";

const FULL_SURAH_LIST = Array.from({ length: 114 }, (_, i) => String(i + 1)).join(",");

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
  const [reciterMode, setReciterMode] = useState<ReciterMode>("chapter");
  const [selectedRiwayahId, setSelectedRiwayahId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [verseReciters, setVerseReciters] = useState<VerseByVerseReciter[]>([]);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%"], []);

  const handleOpenFilters = useCallback(() => {
    void Haptics.selectionAsync();
    bottomSheetModalRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

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

        const verseRecitersRes = await fetch(
          "https://api.alquran.cloud/v1/edition/format/audio",
        );

        const [recitersData, riwayatData, moshafsData] = await Promise.all([
          recitersRes.json(),
          riwayatRes.json(),
          moshafsRes.json(),
        ]);

        const verseRecitersData = await verseRecitersRes.json();

        setReciters(recitersData.reciters || []);
        setRiwayat(riwayatData.riwayat || []);
        setMoshafs(moshafsData.riwayat || []); // Note: API returns 'riwayat' key for both
        setVerseReciters(
          (verseRecitersData.data || [])
            .filter((r: VerseByVerseReciter) => r.type === "versebyverse")
            .map((r: VerseByVerseReciter) => ({
              identifier: r.identifier,
              name: r.name,
              englishName: r.englishName,
              type: r.type,
            })),
        );
      } catch (err) {
        console.error("Error fetching data", err);
        showToast("Error fetching reciters.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const filteredChapterReciters = useMemo(() => {
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

  const filteredVerseReciters = useMemo(() => {
    if (!searchQuery.trim()) return verseReciters;
    const lowerQuery = searchQuery.toLowerCase();
    return verseReciters.filter(
      (r) =>
        r.englishName.toLowerCase().includes(lowerQuery) ||
        r.name.toLowerCase().includes(lowerQuery),
    );
  }, [verseReciters, searchQuery]);

  const renderChapterItem = ({ item, index }: { item: Reciter; index: number }) => {
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

  const renderVerseItem = ({
    item,
  }: {
    item: VerseByVerseReciter;
    index: number;
  }) => {
    return (
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          router.push({
            pathname: "/audio/[reciterId]",
            params: {
              reciterId: item.identifier,
              reciterName: item.englishName,
              reciterNativeName: item.name,
              server: `https://cdn.islamic.network/quran/audio/128/${item.identifier}/`,
              surahList: FULL_SURAH_LIST,
              mode: "verse_by_verse",
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
              {item.englishName}
            </Text>
            <Text
              style={[styles.reciterType, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              Verse-by-verse recitation
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const isVerseMode = reciterMode === "verse_by_verse";
  const listData = isVerseMode ? filteredVerseReciters : filteredChapterReciters;

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
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ArrowLeft color={colors.textMain} size={22} />
        </Pressable>

        <Text style={[styles.headerTitleText, { color: colors.textMain }]}>Browse Reciters</Text>

        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            router.push("/audio/downloads");
          }}
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Download color={colors.textMain} size={18} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={listData}
          renderItem={isVerseMode ? renderVerseItem : renderChapterItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerWrapper}>
              <ImageBackground
                source={require("../../assets/images/quick-actions/audio.webp")}
                style={styles.heroCardContainer}
                imageStyle={styles.heroCardImage}
              >
                <LinearGradient
                  colors={[
                    withOpacity("#000000", isDark ? 0.45 : 0.5),
                    withOpacity("#000000", isDark ? 0.65 : 0.7),
                  ]}
                  style={styles.heroOverlay}
                >
                  <View style={styles.heroHeaderRow}>
                    <View style={styles.heroIconBadge}>
                      <Headphones size={22} color="#fff" />
                    </View>
                    <Text style={[styles.heroTitle, { color: "#FFFFFF" }]}>
                      Reciters
                    </Text>
                  </View>
                  <Text
                    style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.85)" }]}
                  >
                    {isVerseMode
                      ? "Follow along verse-by-verse with continuous chapter playback."
                      : "Listen to the Holy Quran recited by world-renowned Qaris."}
                  </Text>
                </LinearGradient>
              </ImageBackground>

              <View style={styles.modeSwitchRow}>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setReciterMode("chapter");
                  }}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor:
                        reciterMode === "chapter"
                          ? colors.primary
                          : withOpacity(colors.primary, 0.08),
                      borderColor:
                        reciterMode === "chapter"
                          ? colors.primary
                          : withOpacity(colors.border, 0.9),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      { color: reciterMode === "chapter" ? "#fff" : colors.textMain },
                    ]}
                  >
                    Chapter Reciters
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setReciterMode("verse_by_verse");
                  }}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor:
                        reciterMode === "verse_by_verse"
                          ? colors.primary
                          : withOpacity(colors.primary, 0.08),
                      borderColor:
                        reciterMode === "verse_by_verse"
                          ? colors.primary
                          : withOpacity(colors.border, 0.9),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      {
                        color:
                          reciterMode === "verse_by_verse" ? "#fff" : colors.textMain,
                      },
                    ]}
                  >
                    Verse-by-Verse
                  </Text>
                </Pressable>
              </View>

              <View style={styles.searchRow}>
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
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")}>
                      <X size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                {!isVerseMode && (
                  <Pressable
                    onPress={handleOpenFilters}
                    style={[
                      styles.filterToggleButton,
                      {
                        backgroundColor: selectedRiwayahId || selectedType ? colors.primary : colors.surface,
                        borderColor: selectedRiwayahId || selectedType ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Filter
                      size={20}
                      color={selectedRiwayahId || selectedType ? "#fff" : colors.textMain}
                      strokeWidth={2}
                    />
                    {(selectedRiwayahId || selectedType) && (
                      <View style={styles.filterBadge} />
                    )}
                  </Pressable>
                )}
              </View>

              <Text style={[styles.resultCount, { color: colors.textMuted }]}> 
                {listData.length} reciter
                {listData.length === 1 ? "" : "s"} found
              </Text>
            </View>
          }
        />
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textMain }]}>Filters</Text>
            {(selectedRiwayahId || selectedType) && (
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedRiwayahId(null);
                  setSelectedType(null);
                }}
              >
                <Text style={{ color: colors.primary, fontFamily: "SatoshiBold" }}>Reset</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMain }]}>
              Riwayat (Narration)
            </Text>
            <View style={styles.chipGrid}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedRiwayahId(null);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedRiwayahId === null ? colors.primary : colors.background,
                    borderColor: selectedRiwayahId === null ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: selectedRiwayahId === null ? "#fff" : colors.textMain }]}>All</Text>
              </Pressable>
              {riwayat.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedRiwayahId(item.id);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedRiwayahId === item.id ? colors.primary : colors.background,
                      borderColor: selectedRiwayahId === item.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedRiwayahId === item.id ? "#fff" : colors.textMain },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMain }]}>
              Moshaf (Style)
            </Text>
            <View style={styles.chipGrid}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedType(null);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedType === null ? colors.primary : colors.background,
                    borderColor: selectedType === null ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: selectedType === null ? "#fff" : colors.textMain }]}>All</Text>
              </Pressable>
              {moshafTypes.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedType(item.id);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedType === item.id ? colors.primary : colors.background,
                      borderColor: selectedType === item.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedType === item.id ? "#fff" : colors.textMain },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>
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
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleText: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
    letterSpacing: -0.2,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerWrapper: {
    marginBottom: 6,
    gap: 18,
  },
  heroCardContainer: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroCardImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: "flex-end",
    gap: 12,
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    marginLeft: 4,
  },
  reciterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    gap: 12,
    marginBottom: 16,
  },
  filterLabel: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  filterChipText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterToggleButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  bottomSheetContent: {
    padding: 24,
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 22,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeSwitchRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  modeChipText: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },
});
