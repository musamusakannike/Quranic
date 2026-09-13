import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import SegmentedControl from "@expo/ui/community/segmented-control";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";

import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../lib/ThemeContext";
import {
  ReminderTime,
  ReadingView,
  useAppSettings,
} from "../../lib/AppSettingsContext";
import { useLanguage } from "../../lib/LanguageContext";
import { useAppFonts } from "../../lib/i18n/useAppFonts";
import type { AppLocale } from "../../lib/i18n";
import { GlassSurface } from "../../components/GlassSurface";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const toDateFromTime = ({ hour, minute }: ReminderTime) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

const formatReminderTime = ({ hour, minute }: ReminderTime) => {
  const tempDate = new Date();
  tempDate.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(tempDate);
};

export default function SettingsScreen() {
  const { colors, theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { t, locale, setLocale, isRTL } = useLanguage();
  const fonts = useAppFonts();
  const {
    showTranslations,
    showTransliterations,
    reminderEnabled,
    reminderTime,
    setShowTranslations,
    setShowTransliterations,
    setReminderTime,
    enableReminder,
    disableReminder,
    arabicFontSize,
    translationFontSize,
    setArabicFontSize,
    setTranslationFontSize,
    readingView,
    setReadingView,
  } = useAppSettings();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const reminderLabel = useMemo(
    () => formatReminderTime(reminderTime),
    [reminderTime],
  );

  const sectionBorderColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : withOpacity(colors.border, 0.7);

  const dividerColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : withOpacity(colors.border, 0.6);

  const activeAccentColor = isDark ? colors.primaryLight : colors.primary;
  const switchInactiveTrack = isDark
    ? "rgba(255, 255, 255, 0.18)"
    : withOpacity(colors.border, 0.7);
  const sliderInactiveTrack = isDark
    ? "rgba(255, 255, 255, 0.16)"
    : withOpacity(colors.border, 0.7);

  // Option lists for the three native segmented controls. Using
  // `@expo/ui/community/segmented-control` here instead of hand-rolled
  // Pressables gives a real UISegmentedControl on iOS (which automatically
  // picks up the Liquid Glass treatment on iOS 26) and a Jetpack Compose
  // segmented row on Android — no bespoke styling required, which is the
  // point: it's the system control, so it always looks current.
  const languageOptions = [
    { key: "en" as AppLocale, label: t("settings.languageEnglish") },
    { key: "ar" as AppLocale, label: t("settings.languageArabic") },
  ];
  const themeOptions = [
    { key: "system" as const, label: t("settings.themeDevice") },
    { key: "light" as const, label: t("settings.themeLight") },
    { key: "dark" as const, label: t("settings.themeDark") },
  ];
  const readingViewOptions = [
    { key: "list" as ReadingView, label: t("settings.viewList") },
    { key: "verse_by_verse" as ReadingView, label: t("settings.viewVerseByVerse") },
    { key: "mushaf" as ReadingView, label: t("settings.viewMushaf") },
  ];

  const handleReminderToggle = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      await disableReminder();
      return;
    }

    const enabled = await enableReminder(reminderTime);
    if (!enabled) {
      Alert.alert(
        t("settings.permissionRequired"),
        t("settings.notificationPermissionMsg"),
      );
    }
  };

  const handleTimeChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }

    if (!selectedDate) {
      return;
    }

    const nextTime = {
      hour: selectedDate.getHours(),
      minute: selectedDate.getMinutes(),
    };

    await setReminderTime(nextTime);

    if (reminderEnabled) {
      await enableReminder(nextTime);
    }

    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.12 : 0.05),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
          {t("settings.title")}
        </Text>

        {/* ── Language ─────────────────────────────────────────────────── */}
        <GlassSurface
          solidColor={colors.surface}
          style={[styles.sectionCard, { borderColor: sectionBorderColor }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.language")}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.languageSubtitle")}
          </Text>

          <SegmentedControl
            values={languageOptions.map((option) => option.label)}
            selectedIndex={languageOptions.findIndex((option) => option.key === locale)}
            onChange={(event) => {
              const option = languageOptions[event.nativeEvent.selectedSegmentIndex];
              if (option) void setLocale(option.key);
            }}
            appearance={isDark ? "dark" : "light"}
            tintColor={activeAccentColor}
            style={styles.segmentedControl}
          />
        </GlassSurface>

        {/* ── Appearance ───────────────────────────────────────────────── */}
        <GlassSurface
          solidColor={colors.surface}
          style={[styles.sectionCard, { borderColor: sectionBorderColor }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.appearance")}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.appearanceSubtitle")}
          </Text>

          <SegmentedControl
            values={themeOptions.map((option) => option.label)}
            selectedIndex={themeOptions.findIndex((option) => option.key === theme)}
            onChange={(event) => {
              const option = themeOptions[event.nativeEvent.selectedSegmentIndex];
              if (option) void setTheme(option.key);
            }}
            appearance={isDark ? "dark" : "light"}
            tintColor={activeAccentColor}
            style={styles.segmentedControl}
          />

          <Text style={[styles.helperText, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.currentTheme", { theme: resolvedTheme })}
          </Text>
        </GlassSurface>

        {/* ── Chapter display ───────────────────────────────────────────── */}
        <GlassSurface
          solidColor={colors.surface}
          style={[styles.sectionCard, { borderColor: sectionBorderColor }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.chapterDisplay")}
          </Text>

          <Text
            style={[
              styles.sectionSubtitle,
              { color: colors.textMuted, marginBottom: 4, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("settings.chooseReadingView")}
          </Text>

          <SegmentedControl
            values={readingViewOptions.map((option) => option.label)}
            selectedIndex={readingViewOptions.findIndex((option) => option.key === readingView)}
            onChange={(event) => {
              const option = readingViewOptions[event.nativeEvent.selectedSegmentIndex];
              if (option) void setReadingView(option.key);
            }}
            appearance={isDark ? "dark" : "light"}
            tintColor={activeAccentColor}
            style={[styles.segmentedControl, { marginBottom: 4 }]}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: dividerColor,
                marginBottom: 16,
              },
            ]}
          />

          <View style={[styles.settingRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain, fontFamily: fonts.medium, textAlign: isRTL ? "right" : "left" }]}>
                {t("settings.showTranslations")}
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}
              >
                {t("settings.showTranslationsDesc")}
              </Text>
            </View>
            <Switch
              value={showTranslations}
              onValueChange={(nextValue) => {
                void setShowTranslations(nextValue);
              }}
              trackColor={{ false: switchInactiveTrack, true: activeAccentColor }}
              ios_backgroundColor={switchInactiveTrack}
              thumbColor={Platform.OS === "android" ? (isDark ? "#E5E7EB" : "#F4F4F5") : undefined}
            />
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: dividerColor },
            ]}
          />

          <View style={[styles.settingRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain, fontFamily: fonts.medium, textAlign: isRTL ? "right" : "left" }]}>
                {t("settings.showTransliterations")}
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}
              >
                {t("settings.showTransliterationsDesc")}
              </Text>
            </View>
            <Switch
              value={showTransliterations}
              onValueChange={(nextValue) => {
                void setShowTransliterations(nextValue);
              }}
              trackColor={{ false: switchInactiveTrack, true: activeAccentColor }}
              ios_backgroundColor={switchInactiveTrack}
              thumbColor={Platform.OS === "android" ? (isDark ? "#E5E7EB" : "#F4F4F5") : undefined}
            />
          </View>
        </GlassSurface>

        {/* ── Typography ────────────────────────────────────────────────── */}
        <GlassSurface
          solidColor={colors.surface}
          style={[styles.sectionCard, { borderColor: sectionBorderColor }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.typography")}
          </Text>

          <View style={[styles.settingRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain, fontFamily: fonts.medium, textAlign: isRTL ? "right" : "left" }]}>
                {t("settings.arabicTextSize")}
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}
              >
                {t("settings.sizeLabel", { size: Math.round(arabicFontSize) })}
              </Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={22}
            maximumValue={50}
            step={1}
            value={arabicFontSize}
            onSlidingComplete={setArabicFontSize}
            minimumTrackTintColor={activeAccentColor}
            maximumTrackTintColor={sliderInactiveTrack}
            thumbTintColor={activeAccentColor}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: dividerColor,
                marginVertical: 4,
              },
            ]}
          />

          <View style={[styles.settingRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain, fontFamily: fonts.medium, textAlign: isRTL ? "right" : "left" }]}>
                {t("settings.translationTextSize")}
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}
              >
                {t("settings.sizeLabel", { size: Math.round(translationFontSize) })}
              </Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={24}
            step={1}
            value={translationFontSize}
            onSlidingComplete={setTranslationFontSize}
            minimumTrackTintColor={activeAccentColor}
            maximumTrackTintColor={sliderInactiveTrack}
            thumbTintColor={activeAccentColor}
          />
        </GlassSurface>

        {/* ── Daily Reminder ────────────────────────────────────────────── */}
        <GlassSurface
          solidColor={colors.surface}
          style={[styles.sectionCard, { borderColor: sectionBorderColor }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.dailyReminder")}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.dailyReminderSubtitle")}
          </Text>

          <View style={[styles.settingRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain, fontFamily: fonts.medium, textAlign: isRTL ? "right" : "left" }]}>
                {t("settings.enableReminder")}
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}
              >
                {t("settings.enableReminderDesc")}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={(nextValue) => {
                void handleReminderToggle(nextValue);
              }}
              trackColor={{ false: switchInactiveTrack, true: activeAccentColor }}
              ios_backgroundColor={switchInactiveTrack}
              thumbColor={Platform.OS === "android" ? (isDark ? "#E5E7EB" : "#F4F4F5") : undefined}
            />
          </View>

          {/* The time button is its own small glass "pill" — on iOS 26 it
              becomes an interactive Liquid Glass capsule that reacts to
              touch; everywhere else it's a plain bordered row. */}
          <GlassSurface
            solidColor={isDark ? withOpacity(colors.surface, 0.7) : withOpacity(colors.background, 0.6)}
            glassTint={isDark ? withOpacity(colors.primaryLight, 0.12) : undefined}
            isInteractive
            borderRadius={14}
          >
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={[
                styles.timeButton,
                { borderColor: sectionBorderColor },
              ]}
            >
              <Text style={[styles.timeButtonLabel, { color: colors.textMuted, fontFamily: fonts.regular }]}>
                {t("settings.reminderTime")}
              </Text>
              <Text style={[styles.timeButtonValue, { color: colors.textMain, fontFamily: fonts.bold }]}>
                {reminderLabel}
              </Text>
            </Pressable>
          </GlassSurface>

          {showTimePicker ? (
            <View style={styles.timePickerWrap}>
              <DateTimePicker
                mode="time"
                value={toDateFromTime(reminderTime)}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant={isDark ? "dark" : "light"}
                textColor={colors.textMain}
                onChange={(event, date) => {
                  void handleTimeChange(event, date);
                }}
              />
              {Platform.OS === "ios" ? (
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <GlassSurface
                    solidColor={withOpacity(colors.primary, isDark ? 0.32 : 0.16)}
                    glassTint={activeAccentColor}
                    isInteractive
                    borderRadius={999}
                    style={styles.doneButton}
                  >
                    <Text
                      style={[styles.doneButtonText, { color: activeAccentColor, fontFamily: fonts.medium }]}
                    >
                      {t("settings.done")}
                    </Text>
                  </GlassSurface>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </GlassSurface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 38,
    gap: 14,
  },
  title: {
    fontFamily: "SatoshiBold",
    fontSize: 28,
    marginBottom: 2,
  },
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 17,
  },
  sectionSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 13,
    marginTop: -6,
  },
  segmentedControl: {
    height: 36,
  },
  helperText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    textTransform: "capitalize",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  settingTextWrap: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
  },
  settingDescription: {
    fontFamily: "Satoshi",
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: -8,
  },
  timeButton: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeButtonLabel: {
    fontFamily: "Satoshi",
    fontSize: 13,
  },
  timeButtonValue: {
    fontFamily: "SatoshiBold",
    fontSize: 15,
  },
  timePickerWrap: {
    gap: 8,
  },
  doneButton: {
    alignSelf: "flex-end",
    minWidth: 72,
    minHeight: 36,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
});