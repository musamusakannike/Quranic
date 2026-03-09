import React from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../lib/ThemeContext";
import { useDownloads } from "../../lib/DownloadsContext";
import { ArrowLeft, Trash2, PlayCircle, Download } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

export default function DownloadsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { downloads, deleteAudio, activeDownloads } = useDownloads();

  const handlePlay = (item: any) => {
    void Haptics.selectionAsync();
    router.push({
      pathname: "/audio/[reciterId]/[surahId]",
      params: {
        reciterId: item.reciterId,
        surahId: item.surahId,
        reciterName: item.reciterName,
        server: item.server,
        surahName: item.surahName,
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ArrowLeft color={colors.textMain} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>
          Downloads
        </Text>
        <View style={styles.headerSpacing} />
      </View>

      {downloads.length === 0 && Object.keys(activeDownloads).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Download size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No downloaded audios yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.itemCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => handlePlay(item)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                ]}
              >
                <PlayCircle size={28} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.surahName, { color: colors.textMain }]}>
                  {item.surahName}
                </Text>
                <Text style={[styles.reciterName, { color: colors.textMuted }]}>
                  {item.reciterName}
                </Text>
              </View>
              <Pressable
                onPress={() => deleteAudio(item.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color="#EF4444" />
              </Pressable>
            </Pressable>
          )}
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
    padding: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  headerSpacing: {
    width: 44,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
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
  itemInfo: {
    flex: 1,
  },
  surahName: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  reciterName: {
    fontFamily: "Satoshi",
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
});
