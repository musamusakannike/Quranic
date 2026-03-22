import React, {
  useState,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Repeat,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  BarChart2,
  ChevronDown,
  X,
  RefreshCcw,
  Brain,
  Star,
  TrendingUp,
} from "lucide-react-native";

import { useTheme } from "../lib/ThemeContext";
import {
  useHifz,
  type MemorizationStatus,
} from "../lib/HifzContext";
import {
  getChapterMetadata,
  getChapterVerses,
  getVersesCount,
  getVerseTranslation,
} from "../lib/QuranHelper";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// All 114 chapters list for picker
const ALL_CHAPTERS = Array.from({ length: 114 }, (_, i) => {
  const meta = getChapterMetadata(i + 1);
  return {
    number: i + 1,
    name: meta?.englishname ?? `Surah ${i + 1}`,
    arabicName: meta?.arabicname ?? "",
    verses: getVersesCount(i + 1),
  };
});

type ActiveTab = "loop" | "reveal" | "progress";

// ─── Status color helpers ────────────────────────────────────────────────────
const STATUS_COLORS = {
  memorized: "#10B981",
  learning: "#F59E0B",
  not_started: "transparent",
};

const STATUS_BORDER = {
  memorized: "#10B981",
  learning: "#F59E0B",
  not_started: "#374151",
};

// ─── Loop Mode Tab ───────────────────────────────────────────────────────────
function LoopTab({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { loopConfig, setLoopConfig } = useHifz();
  const router = useRouter();

  const [selectedChapter, setSelectedChapter] = useState(
    loopConfig?.chapter ?? 2,
  );
  const [startVerse, setStartVerse] = useState(loopConfig?.startVerse ?? 1);
  const [endVerse, setEndVerse] = useState(loopConfig?.endVerse ?? 5);
  const [repeatCount, setRepeatCount] = useState(loopConfig?.repeatCount ?? 3);
  const [chapterPickerVisible, setChapterPickerVisible] = useState(false);

  const chapterInfo = ALL_CHAPTERS[selectedChapter - 1];
  const maxVerses = chapterInfo?.verses ?? 1;

  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openPicker = () => {
    setChapterPickerVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePicker = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setChapterPickerVisible(false));
  };

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const handleStartLoop = () => {
    const sv = clamp(startVerse, 1, maxVerses);
    const ev = clamp(endVerse, sv, maxVerses);
    const config = {
      chapter: selectedChapter,
      startVerse: sv,
      endVerse: ev,
      repeatCount,
    };
    setLoopConfig(config);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: "/chapter/[id]",
      params: {
        id: String(selectedChapter),
        verse: String(sv),
        loopStart: String(sv),
        loopEnd: String(ev),
        loopCount: String(repeatCount),
      },
    });
  };

  return (
    <View style={{ flex: 1, gap: 20 }}>
      {/* Chapter selector */}
      <View
        style={[
          loopStyles.card,
          { backgroundColor: isDark ? withOpacity(colors.surface, 0.9) : colors.surface, borderColor: withOpacity(colors.border, 0.7) },
        ]}
      >
        <Text style={[loopStyles.cardLabel, { color: colors.textMuted }]}>Surah</Text>
        <Pressable
          onPress={openPicker}
          style={[
            loopStyles.selectorBtn,
            { borderColor: withOpacity(colors.primary, 0.4), backgroundColor: withOpacity(colors.primary, 0.06) },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[loopStyles.selectorMain, { color: colors.textMain }]}>
              {chapterInfo?.arabicName}
            </Text>
            <Text style={[loopStyles.selectorSub, { color: colors.textMuted }]}>
              {selectedChapter}. {chapterInfo?.name} · {maxVerses} verses
            </Text>
          </View>
          <ChevronDown size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Verse Range */}
      <View
        style={[
          loopStyles.card,
          { backgroundColor: isDark ? withOpacity(colors.surface, 0.9) : colors.surface, borderColor: withOpacity(colors.border, 0.7) },
        ]}
      >
        <Text style={[loopStyles.cardLabel, { color: colors.textMuted }]}>Ayah Range</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[loopStyles.inputLabel, { color: colors.textMuted }]}>From</Text>
            <View style={[loopStyles.numberInputRow, { borderColor: withOpacity(colors.border, 0.8), backgroundColor: withOpacity(colors.primary, 0.04) }]}>
              <Pressable
                onPress={() => setStartVerse((v) => clamp(v - 1, 1, endVerse))}
                style={[loopStyles.stepBtn, { backgroundColor: withOpacity(colors.primary, 0.12) }]}
              >
                <Text style={[loopStyles.stepBtnText, { color: colors.primary }]}>−</Text>
              </Pressable>
              <Text style={[loopStyles.stepValue, { color: colors.textMain }]}>{startVerse}</Text>
              <Pressable
                onPress={() => setStartVerse((v) => clamp(v + 1, 1, endVerse))}
                style={[loopStyles.stepBtn, { backgroundColor: withOpacity(colors.primary, 0.12) }]}
              >
                <Text style={[loopStyles.stepBtnText, { color: colors.primary }]}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[loopStyles.inputLabel, { color: colors.textMuted }]}>To</Text>
            <View style={[loopStyles.numberInputRow, { borderColor: withOpacity(colors.border, 0.8), backgroundColor: withOpacity(colors.primary, 0.04) }]}>
              <Pressable
                onPress={() => setEndVerse((v) => clamp(v - 1, startVerse, maxVerses))}
                style={[loopStyles.stepBtn, { backgroundColor: withOpacity(colors.primary, 0.12) }]}
              >
                <Text style={[loopStyles.stepBtnText, { color: colors.primary }]}>−</Text>
              </Pressable>
              <Text style={[loopStyles.stepValue, { color: colors.textMain }]}>{endVerse}</Text>
              <Pressable
                onPress={() => setEndVerse((v) => clamp(v + 1, startVerse, maxVerses))}
                style={[loopStyles.stepBtn, { backgroundColor: withOpacity(colors.primary, 0.12) }]}
              >
                <Text style={[loopStyles.stepBtnText, { color: colors.primary }]}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <Text style={[loopStyles.rangeHint, { color: colors.textMuted }]}>
          {endVerse - startVerse + 1} ayah{endVerse - startVerse + 1 !== 1 ? "s" : ""} selected
        </Text>
      </View>

      {/* Repeat Count */}
      <View
        style={[
          loopStyles.card,
          { backgroundColor: isDark ? withOpacity(colors.surface, 0.9) : colors.surface, borderColor: withOpacity(colors.border, 0.7) },
        ]}
      >
        <Text style={[loopStyles.cardLabel, { color: colors.textMuted }]}>Repetitions</Text>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {[2, 3, 5, 7, 10, 15, 20].map((n) => (
            <Pressable
              key={n}
              onPress={() => { void Haptics.selectionAsync(); setRepeatCount(n); }}
              style={[
                loopStyles.repeatChip,
                {
                  backgroundColor: repeatCount === n ? colors.primary : withOpacity(colors.primary, 0.08),
                  borderColor: repeatCount === n ? colors.primary : withOpacity(colors.primary, 0.2),
                },
              ]}
            >
              <Text style={[loopStyles.repeatChipText, { color: repeatCount === n ? "#fff" : colors.primary }]}>
                ×{n}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[loopStyles.rangeHint, { color: colors.textMuted }]}>
          Each ayah will repeat {repeatCount} times
        </Text>
      </View>

      {/* Start Button */}
      <Pressable
        onPress={handleStartLoop}
        style={({ pressed }) => [
          loopStyles.startBtn,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <LinearGradient
          colors={[colors.primaryLight ?? "#0A8F7A", colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={loopStyles.startBtnGradient}
        >
          <Repeat size={18} color="#fff" />
          <Text style={loopStyles.startBtnText}>Start Loop Session</Text>
        </LinearGradient>
      </Pressable>

      {/* Chapter Picker Sheet */}
      {chapterPickerVisible && (
        <Modal transparent visible animationType="none" onRequestClose={closePicker} statusBarTranslucent>
          <TouchableWithoutFeedback onPress={closePicker}>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.55)", opacity: backdropAnim }]}
            />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              loopStyles.pickerSheet,
              { backgroundColor: colors.background, transform: [{ translateY: sheetAnim }] },
            ]}
          >
            <View style={loopStyles.sheetHandleWrap}>
              <View style={[loopStyles.sheetHandle, { backgroundColor: withOpacity(colors.border, 0.7) }]} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={[loopStyles.pickerTitle, { color: colors.textMain }]}>Select Surah</Text>
              <TouchableOpacity
                onPress={closePicker}
                style={[loopStyles.closeBtn, { backgroundColor: withOpacity(colors.border, 0.4) }]}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ALL_CHAPTERS}
              keyExtractor={(item) => String(item.number)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 6 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedChapter(item.number);
                    setStartVerse(1);
                    setEndVerse(Math.min(5, item.verses));
                    closePicker();
                  }}
                  style={[
                    loopStyles.chapterRow,
                    {
                      backgroundColor:
                        selectedChapter === item.number
                          ? withOpacity(colors.primary, 0.1)
                          : "transparent",
                      borderColor: withOpacity(colors.border, 0.5),
                    },
                  ]}
                >
                  <View style={[loopStyles.chapterNum, { backgroundColor: withOpacity(colors.primary, selectedChapter === item.number ? 0.25 : 0.08) }]}>
                    <Text style={[{ fontFamily: "SatoshiBold", fontSize: 13, color: colors.primary }]}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontFamily: "SatoshiMedium", fontSize: 14, color: colors.textMain }]}>{item.name}</Text>
                    <Text style={[{ fontFamily: "Satoshi", fontSize: 12, color: colors.textMuted }]}>{item.verses} verses</Text>
                  </View>
                  <Text style={{ fontFamily: "AmiriQuran", fontSize: 18, color: colors.primary }}>{item.arabicName}</Text>
                </Pressable>
              )}
            />
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ─── Hide & Reveal Tab ───────────────────────────────────────────────────────
function RevealTab({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { getVerseStatus, setVerseStatus } = useHifz();
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [hideAll, setHideAll] = useState(true);
  const [revealedVerses, setRevealedVerses] = useState<Set<number>>(new Set());
  const [chapterPickerVisible, setChapterPickerVisible] = useState(false);

  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const chapterInfo = ALL_CHAPTERS[selectedChapter - 1];
  const verses = useMemo(() => getChapterVerses(selectedChapter), [selectedChapter]);
  const translations = useMemo(
    () => verses.map((_, i) => getVerseTranslation(selectedChapter, i + 1)),
    [selectedChapter, verses],
  );

  const openPicker = () => {
    setChapterPickerVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  };

  const closePicker = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setChapterPickerVisible(false));
  };

  const toggleReveal = (verseNum: number) => {
    void Haptics.selectionAsync();
    setRevealedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const markMemorized = async (verseNum: number) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const current = getVerseStatus(selectedChapter, verseNum);
    const next: MemorizationStatus = current === "memorized" ? "not_started" : "memorized";
    await setVerseStatus(selectedChapter, verseNum, next);
  };

  const isRevealed = (verseNum: number) => !hideAll || revealedVerses.has(verseNum);

  return (
    <View style={{ flex: 1, gap: 16 }}>
      {/* Controls Row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={openPicker}
          style={[
            revealStyles.chapterBtn,
            { flex: 1, backgroundColor: isDark ? withOpacity(colors.surface, 0.9) : colors.surface, borderColor: withOpacity(colors.border, 0.7) },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[revealStyles.chapterBtnSub, { color: colors.textMuted }]}>Surah</Text>
            <Text style={[revealStyles.chapterBtnMain, { color: colors.textMain }]} numberOfLines={1}>
              {chapterInfo?.name}
            </Text>
          </View>
          <ChevronDown size={16} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={() => { void Haptics.selectionAsync(); setHideAll((h) => !h); setRevealedVerses(new Set()); }}
          style={[
            revealStyles.toggleBtn,
            { backgroundColor: hideAll ? withOpacity(colors.primary, 0.12) : withOpacity(colors.success, 0.12), borderColor: hideAll ? withOpacity(colors.primary, 0.4) : withOpacity(colors.success, 0.4) },
          ]}
        >
          {hideAll ? <EyeOff size={18} color={colors.primary} /> : <Eye size={18} color={colors.success} />}
          <Text style={[revealStyles.toggleBtnText, { color: hideAll ? colors.primary : colors.success }]}>
            {hideAll ? "Hidden" : "Shown"}
          </Text>
        </Pressable>
      </View>

      {hideAll && (
        <View style={[revealStyles.hintBox, { backgroundColor: withOpacity(colors.primary, 0.07), borderColor: withOpacity(colors.primary, 0.2) }]}>
          <Eye size={14} color={colors.primary} />
          <Text style={[revealStyles.hintText, { color: colors.primary }]}>
            Tap any ayah to reveal it and test your memory
          </Text>
        </View>
      )}

      <FlatList
        data={verses}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          const verseNum = index + 1;
          const revealed = isRevealed(verseNum);
          const status = getVerseStatus(selectedChapter, verseNum);

          return (
            <Pressable
              onPress={() => toggleReveal(verseNum)}
              style={[
                revealStyles.verseCard,
                {
                  backgroundColor: isDark ? withOpacity(colors.surface, 0.85) : colors.surface,
                  borderColor:
                    status === "memorized"
                      ? withOpacity(colors.success, 0.5)
                      : withOpacity(colors.border, 0.6),
                },
              ]}
            >
              {/* Verse number badge */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={[revealStyles.verseBadge, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
                  <Text style={[revealStyles.verseBadgeText, { color: colors.primary }]}>{verseNum}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => void markMemorized(verseNum)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {status === "memorized" ? (
                    <CheckCircle2 size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.textMuted} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Arabic text */}
              {revealed ? (
                <Text style={[revealStyles.arabicText, { color: colors.textMain }]}>{item}</Text>
              ) : (
                <View style={[revealStyles.blurPlaceholder, { backgroundColor: withOpacity(colors.primary, 0.08) }]}>
                  <View style={[revealStyles.blurLine, { backgroundColor: withOpacity(colors.primary, 0.18), width: "95%" }]} />
                  <View style={[revealStyles.blurLine, { backgroundColor: withOpacity(colors.primary, 0.14), width: "80%" }]} />
                  <View style={[revealStyles.blurLine, { backgroundColor: withOpacity(colors.primary, 0.10), width: "60%" }]} />
                  <Text style={[revealStyles.tapRevealText, { color: colors.primary }]}>Tap to reveal</Text>
                </View>
              )}

              {/* Translation */}
              {revealed && translations[index] && (
                <Text style={[revealStyles.translationText, { color: colors.textMuted }]} numberOfLines={2}>
                  {translations[index]}
                </Text>
              )}
            </Pressable>
          );
        }}
      />

      {/* Chapter Picker */}
      {chapterPickerVisible && (
        <Modal transparent visible animationType="none" onRequestClose={closePicker} statusBarTranslucent>
          <TouchableWithoutFeedback onPress={closePicker}>
            <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.55)", opacity: backdropAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[loopStyles.pickerSheet, { backgroundColor: colors.background, transform: [{ translateY: sheetAnim }] }]}>
            <View style={loopStyles.sheetHandleWrap}>
              <View style={[loopStyles.sheetHandle, { backgroundColor: withOpacity(colors.border, 0.7) }]} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={[loopStyles.pickerTitle, { color: colors.textMain }]}>Select Surah</Text>
              <TouchableOpacity onPress={closePicker} style={[loopStyles.closeBtn, { backgroundColor: withOpacity(colors.border, 0.4) }]}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ALL_CHAPTERS}
              keyExtractor={(item) => String(item.number)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 6 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedChapter(item.number);
                    setRevealedVerses(new Set());
                    closePicker();
                  }}
                  style={[
                    loopStyles.chapterRow,
                    { backgroundColor: selectedChapter === item.number ? withOpacity(colors.primary, 0.1) : "transparent", borderColor: withOpacity(colors.border, 0.5) },
                  ]}
                >
                  <View style={[loopStyles.chapterNum, { backgroundColor: withOpacity(colors.primary, selectedChapter === item.number ? 0.25 : 0.08) }]}>
                    <Text style={{ fontFamily: "SatoshiBold", fontSize: 13, color: colors.primary }}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "SatoshiMedium", fontSize: 14, color: colors.textMain }}>{item.name}</Text>
                    <Text style={{ fontFamily: "Satoshi", fontSize: 12, color: colors.textMuted }}>{item.verses} verses</Text>
                  </View>
                  <Text style={{ fontFamily: "AmiriQuran", fontSize: 18, color: colors.primary }}>{item.arabicName}</Text>
                </Pressable>
              )}
            />
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ─── Progress Dashboard Tab ───────────────────────────────────────────────────
function ProgressTab({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { getChapterStats, resetChapter } = useHifz();
  const [viewMode, setViewMode] = useState<"surah" | "juz">("surah");

  const surahStats = useMemo(
    () =>
      ALL_CHAPTERS.map((ch) => ({
        ...ch,
        ...getChapterStats(ch.number, ch.verses),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getChapterStats],
  );

  const totalMemorized = useMemo(
    () => surahStats.reduce((sum, s) => sum + s.memorized, 0),
    [surahStats],
  );
  const totalLearning = useMemo(
    () => surahStats.reduce((sum, s) => sum + s.learning, 0),
    [surahStats],
  );
  const totalVerses = 6236;
  const overallPct = Math.round((totalMemorized / totalVerses) * 100);
  const learningPct = Math.round((totalLearning / totalVerses) * 100);

  const handleReset = (ch: { number: number; name: string; verses: number }) => {
    Alert.alert(
      `Reset ${ch.name}`,
      "This will clear all memorization data for this Surah. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void resetChapter(ch.number, ch.verses);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  };

  const activeChapters = surahStats.filter(
    (s) => s.memorized > 0 || s.learning > 0,
  );

  return (
    <View style={{ flex: 1, gap: 16 }}>
      {/* Overall stats cards */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <LinearGradient
          colors={[withOpacity(colors.success, isDark ? 0.28 : 0.12), withOpacity(colors.success, isDark ? 0.14 : 0.06)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[progressStyles.statCard, { borderColor: withOpacity(colors.success, 0.3) }]}
        >
          <CheckCircle2 size={20} color={colors.success} />
          <Text style={[progressStyles.statValue, { color: colors.success }]}>{totalMemorized}</Text>
          <Text style={[progressStyles.statLabel, { color: withOpacity(colors.success, 0.8) }]}>Memorized</Text>
          <Text style={[progressStyles.statPct, { color: withOpacity(colors.success, 0.65) }]}>{overallPct}% of Quran</Text>
        </LinearGradient>

        <LinearGradient
          colors={[withOpacity(colors.warning, isDark ? 0.28 : 0.12), withOpacity(colors.warning, isDark ? 0.14 : 0.06)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[progressStyles.statCard, { borderColor: withOpacity(colors.warning, 0.3) }]}
        >
          <Brain size={20} color={colors.warning} />
          <Text style={[progressStyles.statValue, { color: colors.warning }]}>{totalLearning}</Text>
          <Text style={[progressStyles.statLabel, { color: withOpacity(colors.warning, 0.8) }]}>Learning</Text>
          <Text style={[progressStyles.statPct, { color: withOpacity(colors.warning, 0.65) }]}>{learningPct}% of Quran</Text>
        </LinearGradient>
      </View>

      {/* Overall Progress Bar */}
      <View style={[progressStyles.overallCard, { backgroundColor: isDark ? withOpacity(colors.surface, 0.9) : colors.surface, borderColor: withOpacity(colors.border, 0.7) }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={[progressStyles.overallLabel, { color: colors.textMain }]}>Overall Progress</Text>
          </View>
          <Text style={[progressStyles.overallPct, { color: colors.primary }]}>{overallPct}%</Text>
        </View>
        <View style={[progressStyles.bigTrack, { backgroundColor: withOpacity(colors.border, isDark ? 0.6 : 0.4) }]}>
          <View
            style={[progressStyles.bigFillMemorized, { width: `${overallPct}%`, backgroundColor: colors.success }]}
          />
          <View
            style={[progressStyles.bigFillLearning, { width: `${learningPct}%`, left: `${overallPct}%`, backgroundColor: colors.warning }]}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
            <Text style={[progressStyles.legendText, { color: colors.textMuted }]}>Memorized</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning }} />
            <Text style={[progressStyles.legendText, { color: colors.textMuted }]}>Learning</Text>
          </View>
        </View>
      </View>

      {/* Surah breakdown */}
      {activeChapters.length === 0 ? (
        <View style={[progressStyles.emptyState, { backgroundColor: isDark ? withOpacity(colors.surface, 0.6) : colors.surface, borderColor: withOpacity(colors.border, 0.5) }]}>
          <Star size={32} color={withOpacity(colors.primary, 0.4)} />
          <Text style={[progressStyles.emptyTitle, { color: colors.textMain }]}>No Hifz started yet</Text>
          <Text style={[progressStyles.emptySubtitle, { color: colors.textMuted }]}>
            Use the Hide & Reveal tab to mark ayahs as memorized
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={[progressStyles.sectionLabel, { color: colors.textMuted }]}>BY SURAH</Text>
          {activeChapters.map((ch) => {
            const memPct = (ch.memorized / ch.total) * 100;
            const learnPct = (ch.learning / ch.total) * 100;
            return (
              <View
                key={ch.number}
                style={[progressStyles.surahRow, { backgroundColor: isDark ? withOpacity(colors.surface, 0.85) : colors.surface, borderColor: withOpacity(colors.border, 0.6) }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 }}>
                  <View style={[progressStyles.surahNum, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
                    <Text style={[progressStyles.surahNumText, { color: colors.primary }]}>{ch.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[progressStyles.surahName, { color: colors.textMain }]}>{ch.name}</Text>
                    <Text style={[progressStyles.surahMeta, { color: colors.textMuted }]}>
                      {ch.memorized} memorized · {ch.learning} learning · {ch.total} total
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleReset(ch)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <RefreshCcw size={15} color={withOpacity(colors.textMuted, 0.7)} />
                  </Pressable>
                </View>
                <View style={[progressStyles.miniTrack, { backgroundColor: withOpacity(colors.border, isDark ? 0.5 : 0.35) }]}>
                  <View style={{ width: `${memPct}%`, height: "100%", backgroundColor: colors.success, borderRadius: 999 }} />
                  <View style={{ width: `${learnPct}%`, height: "100%", backgroundColor: colors.warning, borderRadius: 999 }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HifzScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>("loop");

  const tabConfig: { id: ActiveTab; label: string; Icon: any }[] = [
    { id: "loop", label: "Loop Mode", Icon: Repeat },
    { id: "reveal", label: "Hide & Reveal", Icon: Eye },
    { id: "progress", label: "Progress", Icon: BarChart2 },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.12 : 0.07),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: withOpacity(colors.border, 0.5) }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: withOpacity(colors.border, isDark ? 0.5 : 0.4) }]}
        >
          <ArrowLeft size={20} color={colors.textMain} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Hifz</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Memorization Suite</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: withOpacity(colors.primary, 0.12), borderColor: withOpacity(colors.primary, 0.3) }]}>
          <Brain size={14} color={colors.primary} />
          <Text style={[styles.headerBadgeText, { color: colors.primary }]}>Hifz</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: withOpacity(colors.border, 0.5) }]}>
        {tabConfig.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => { void Haptics.selectionAsync(); setActiveTab(tab.id); }}
            style={[
              styles.tabItem,
              activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <tab.Icon
              size={16}
              color={activeTab === tab.id ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.id ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "loop" && <LoopTab colors={colors} isDark={isDark} />}
        {activeTab === "reveal" && <RevealTab colors={colors} isDark={isDark} />}
        {activeTab === "progress" && <ProgressTab colors={colors} isDark={isDark} />}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "SatoshiBold", fontSize: 22, letterSpacing: -0.3 },
  headerSub: { fontFamily: "Satoshi", fontSize: 12.5 },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  headerBadgeText: { fontFamily: "SatoshiBold", fontSize: 12 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontFamily: "SatoshiMedium", fontSize: 12 },
  content: { padding: 16, gap: 16 },
});

const loopStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: { fontFamily: "SatoshiMedium", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  selectorMain: { fontFamily: "AmiriQuran", fontSize: 20 },
  selectorSub: { fontFamily: "SatoshiMedium", fontSize: 13 },
  inputLabel: { fontFamily: "SatoshiMedium", fontSize: 12 },
  numberInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontFamily: "SatoshiBold", fontSize: 20 },
  stepValue: { fontFamily: "SatoshiBold", fontSize: 20, flex: 1, textAlign: "center" },
  rangeHint: { fontFamily: "Satoshi", fontSize: 12 },
  repeatChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  repeatChipText: { fontFamily: "SatoshiBold", fontSize: 14 },
  startBtn: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  startBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  startBtnText: { fontFamily: "SatoshiBold", fontSize: 16, color: "#fff" },
  pickerSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.82, paddingTop: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 24,
  },
  sheetHandleWrap: { alignItems: "center", paddingBottom: 8 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2 },
  pickerTitle: { fontFamily: "SatoshiBold", fontSize: 18 },
  closeBtn: { width: 32, height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  chapterRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  chapterNum: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});

const revealStyles = StyleSheet.create({
  chapterBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, borderWidth: 1, padding: 12,
  },
  chapterBtnSub: { fontFamily: "SatoshiMedium", fontSize: 11 },
  chapterBtnMain: { fontFamily: "SatoshiBold", fontSize: 14 },
  toggleBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  toggleBtnText: { fontFamily: "SatoshiBold", fontSize: 13 },
  hintBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  hintText: { fontFamily: "SatoshiMedium", fontSize: 12, flex: 1 },
  verseCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  verseBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  verseBadgeText: { fontFamily: "SatoshiBold", fontSize: 12 },
  arabicText: { fontFamily: "AmiriQuran", fontSize: 22, lineHeight: 38, textAlign: "right" },
  blurPlaceholder: { borderRadius: 10, padding: 14, gap: 8, alignItems: "flex-end" },
  blurLine: { height: 14, borderRadius: 999 },
  tapRevealText: { fontFamily: "SatoshiMedium", fontSize: 11, alignSelf: "center", marginTop: 4 },
  translationText: { fontFamily: "Satoshi", fontSize: 13, lineHeight: 19, marginTop: 6 },
});

const progressStyles = StyleSheet.create({
  statCard: {
    flex: 1, borderRadius: 18, padding: 14, gap: 4, borderWidth: 1,
    alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontFamily: "SatoshiBold", fontSize: 28, letterSpacing: -0.5 },
  statLabel: { fontFamily: "SatoshiBold", fontSize: 13 },
  statPct: { fontFamily: "Satoshi", fontSize: 11 },
  overallCard: {
    borderRadius: 18, padding: 16, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  overallLabel: { fontFamily: "SatoshiBold", fontSize: 15 },
  overallPct: { fontFamily: "SatoshiBold", fontSize: 15 },
  bigTrack: { height: 12, borderRadius: 999, overflow: "hidden", position: "relative", flexDirection: "row" },
  bigFillMemorized: { height: "100%", borderRadius: 999 },
  bigFillLearning: { height: "100%", borderRadius: 999, position: "absolute", top: 0 },
  legendText: { fontFamily: "Satoshi", fontSize: 12 },
  sectionLabel: { fontFamily: "SatoshiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  surahRow: {
    borderRadius: 16, padding: 14, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  surahNum: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  surahNumText: { fontFamily: "SatoshiBold", fontSize: 13 },
  surahName: { fontFamily: "SatoshiBold", fontSize: 14 },
  surahMeta: { fontFamily: "Satoshi", fontSize: 11, marginTop: 1 },
  miniTrack: { height: 6, borderRadius: 999, overflow: "hidden", flexDirection: "row", marginTop: 4 },
  emptyState: {
    borderRadius: 18, borderWidth: 1, padding: 32,
    alignItems: "center", gap: 10,
  },
  emptyTitle: { fontFamily: "SatoshiBold", fontSize: 16 },
  emptySubtitle: { fontFamily: "Satoshi", fontSize: 13, textAlign: "center", lineHeight: 20 },
});
