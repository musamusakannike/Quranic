import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"
import { Search } from "lucide-react-native";
import { useTheme } from "../../lib/ThemeContext";
import { getChapterMetadata, getVersesCount } from "../../lib/QuranHelper";

type FilterType = "all" | "mecca" | "madina";

interface ChapterListItem {
  id: number;
  name: string;
  englishName: string;
  arabicName: string;
  revelation: string;
  versesCount: number;
}

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function ChaptersScreen() {
  const { colors, isDark } = useTheme();
  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const chapters = useMemo(() => {
    const list: ChapterListItem[] = [];

    for (let chapterNumber = 1; chapterNumber <= 114; chapterNumber += 1) {
      const chapterMeta = getChapterMetadata(chapterNumber);

      if (!chapterMeta) continue;

      list.push({
        id: chapterNumber,
        name: chapterMeta.name,
        englishName: chapterMeta.englishname,
        arabicName: chapterMeta.arabicname,
        revelation: chapterMeta.revelation,
        versesCount: getVersesCount(chapterNumber),
      });
    }

    return list;
  }, []);

  const chapterStats = useMemo(() => {
    const mecca = chapters.filter(({ revelation }) => revelation === "Mecca").length;
    const madina = chapters.filter(({ revelation }) => revelation === "Madina").length;

    return {
      total: chapters.length,
      mecca,
      madina,
    };
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return chapters.filter((chapter) => {
      const chapterRevelation = chapter.revelation.toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "mecca" && chapterRevelation === "mecca") ||
        (filter === "madina" && chapterRevelation === "madina");

      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      return (
        chapter.name.toLowerCase().includes(normalizedSearch) ||
        chapter.englishName.toLowerCase().includes(normalizedSearch) ||
        chapter.arabicName.includes(searchValue)
      );
    });
  }, [chapters, filter, searchValue]);

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: chapterStats.total },
    { key: "mecca", label: "Mecca", count: chapterStats.mecca },
    { key: "madina", label: "Madina", count: chapterStats.madina },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <FlatList
        data={filteredChapters}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: withOpacity(colors.primary, 0.2),
                },
              ]}
            >
              <Text style={[styles.heroTitle, { color: colors.textMain }]}>Chapters</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                Explore all 114 surahs with quick filters and instant search.
              </Text>

              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statPill,
                    { backgroundColor: withOpacity(colors.primary, isDark ? 0.2 : 0.1) },
                  ]}
                >
                  <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[styles.statPillValue, { color: colors.primary }]}>
                    {chapterStats.total}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statPill,
                    { backgroundColor: withOpacity(colors.accent, isDark ? 0.22 : 0.14) },
                  ]}
                >
                  <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>Mecca</Text>
                  <Text style={[styles.statPillValue, { color: colors.textMain }]}>
                    {chapterStats.mecca}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statPill,
                    { backgroundColor: withOpacity(colors.success, isDark ? 0.22 : 0.14) },
                  ]}
                >
                  <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>Madina</Text>
                  <Text style={[styles.statPillValue, { color: colors.textMain }]}>
                    {chapterStats.madina}
                  </Text>
                </View>
              </View>
            </View>

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
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder="Search by surah name"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textMain }]}
              />
            </View>

            <View style={styles.filtersRow}>
              {filterOptions.map((option) => {
                const isActive = filter === option.key;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setFilter(option.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : withOpacity(colors.surface, 0.5),
                        borderColor: isActive
                          ? colors.primary
                          : withOpacity(colors.border, 0.8),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: isActive ? "#FFFFFF" : colors.textMain },
                      ]}
                    >
                      {option.label} ({option.count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {filteredChapters.length} chapter
              {filteredChapters.length === 1 ? "" : "s"} found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.chapterCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.numberBadge,
                { backgroundColor: withOpacity(colors.primary, isDark ? 0.35 : 0.14) },
              ]}
            >
              <Text style={[styles.numberText, { color: colors.primary }]}>{item.id}</Text>
            </View>

            <View style={styles.chapterBody}>
              <Text style={[styles.chapterEnglishName, { color: colors.textMain }]}>
                {item.englishName}
              </Text>
              <Text style={[styles.chapterTranslitName, { color: colors.textMuted }]}>
                {item.name}
              </Text>
            </View>

            <View style={styles.metaColumn}>
              <Text style={[styles.chapterArabicName, { color: colors.textMain }]}>
                {item.arabicName}
              </Text>
              <Text style={[styles.chapterMeta, { color: colors.textMuted }]}>
                {item.versesCount} verses • {item.revelation}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 12,
  },
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
    fontFamily: "InterBold",
    fontSize: 30,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  statPillLabel: {
    fontFamily: "InterMedium",
    fontSize: 12,
  },
  statPillValue: {
    fontFamily: "InterBold",
    fontSize: 18,
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
    fontFamily: "Inter",
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  filterText: {
    fontFamily: "InterMedium",
    fontSize: 13,
  },
  resultCount: {
    fontFamily: "InterMedium",
    fontSize: 13,
    marginBottom: 2,
  },
  chapterCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontFamily: "InterBold",
    fontSize: 16,
  },
  chapterBody: {
    flex: 1,
    gap: 2,
  },
  chapterEnglishName: {
    fontFamily: "InterSemiBold",
    fontSize: 16,
  },
  chapterTranslitName: {
    fontFamily: "Inter",
    fontSize: 13,
  },
  metaColumn: {
    alignItems: "flex-end",
    gap: 2,
  },
  chapterArabicName: {
    fontFamily: "AmiriQuran",
    fontSize: 22,
    lineHeight: 30,
  },
  chapterMeta: {
    fontFamily: "InterMedium",
    fontSize: 12,
  },
});
