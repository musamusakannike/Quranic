import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
          {t("settings.title")}
        </Text>

        {/* ── Language ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.language")}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.languageSubtitle")}
          </Text>

          <View style={[styles.segmentedRow, isRTL && { flexDirection: "row-reverse" }]}>
            {(
              [
                { key: "en" as AppLocale, label: t("settings.languageEnglish") },
                { key: "ar" as AppLocale, label: t("settings.languageArabic") },
              ] as { key: AppLocale; label: string }[]
            ).map((option) => {
              const selected = locale === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    void setLocale(option.key);
                  }}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: selected
                        ? withOpacity(colors.primary, isDark ? 0.3 : 0.14)
                        : withOpacity(colors.background, 0.55),
                      borderColor: selected
                        ? withOpacity(colors.primary, 0.55)
                        : withOpacity(colors.border, 0.8),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      {
                        color: selected ? colors.primary : colors.textMuted,
                        fontFamily: option.key === "ar" ? "CairoBold" : "SatoshiMedium",
                        fontSize: option.key === "ar" ? 15 : 13,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Appearance ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.appearance")}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.appearanceSubtitle")}
          </Text>

          <View style={[styles.segmentedRow, isRTL && { flexDirection: "row-reverse" }]}>
            {[
              { key: "system", label: t("settings.themeDevice") },
              { key: "light", label: t("settings.themeLight") },
              { key: "dark", label: t("settings.themeDark") },
            ].map((option) => {
              const selected = theme === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    void setTheme(option.key as "system" | "light" | "dark");
                  }}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: selected
                        ? withOpacity(colors.primary, isDark ? 0.3 : 0.14)
                        : withOpacity(colors.background, 0.55),
                      borderColor: selected
                        ? withOpacity(colors.primary, 0.55)
                        : withOpacity(colors.border, 0.8),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: selected ? colors.primary : colors.textMuted, fontFamily: fonts.medium },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.helperText, { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.currentTheme", { theme: resolvedTheme })}
          </Text>
        </View>

        {/* ── Chapter display ───────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
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

          <View style={[styles.segmentedRow, { marginBottom: 16 }, isRTL && { flexDirection: "row-reverse" }]}>
            {[
              { key: "list", label: t("settings.viewList") },
              { key: "verse_by_verse", label: t("settings.viewVerseByVerse") },
              { key: "mushaf", label: t("settings.viewMushaf") },
            ].map((option) => {
              const selected = readingView === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    void setReadingView(option.key as ReadingView);
                  }}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: selected
                        ? withOpacity(colors.primary, isDark ? 0.3 : 0.14)
                        : withOpacity(colors.background, 0.55),
                      borderColor: selected
                        ? withOpacity(colors.primary, 0.55)
                        : withOpacity(colors.border, 0.8),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: selected ? colors.primary : colors.textMuted, fontFamily: fonts.medium },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: withOpacity(colors.border, 0.75),
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
              trackColor={{
                false: withOpacity(colors.border, 0.8),
                true: withOpacity(colors.primary, 0.45),
              }}
              thumbColor={showTranslations ? colors.primary : "#F4F4F5"}
            />
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: withOpacity(colors.border, 0.75) },
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
              trackColor={{
                false: withOpacity(colors.border, 0.8),
                true: withOpacity(colors.primary, 0.45),
              }}
              thumbColor={showTransliterations ? colors.primary : "#F4F4F5"}
            />
          </View>
        </View>

        {/* ── Typography ────────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
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
            style={{ width: "100%", height: 40, marginTop: -8 }}
            minimumValue={22}
            maximumValue={50}
            step={1}
            value={arabicFontSize}
            onSlidingComplete={setArabicFontSize}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={withOpacity(colors.border, 0.8)}
            thumbTintColor={colors.primary}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: withOpacity(colors.border, 0.75),
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
            style={{ width: "100%", height: 40, marginTop: -8 }}
            minimumValue={12}
            maximumValue={24}
            step={1}
            value={translationFontSize}
            onSlidingComplete={setTranslationFontSize}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={withOpacity(colors.border, 0.8)}
            thumbTintColor={colors.primary}
          />
        </View>

        {/* ── Daily Reminder ────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
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
              trackColor={{
                false: withOpacity(colors.border, 0.8),
                true: withOpacity(colors.primary, 0.45),
              }}
              thumbColor={reminderEnabled ? colors.primary : "#F4F4F5"}
            />
          </View>

          <Pressable
            onPress={() => setShowTimePicker(true)}
            style={[
              styles.timeButton,
              {
                borderColor: withOpacity(colors.border, 0.85),
                backgroundColor: withOpacity(colors.background, 0.55),
              },
            ]}
          >
            <Text style={[styles.timeButtonLabel, { color: colors.textMuted, fontFamily: fonts.regular }]}>
              {t("settings.reminderTime")}
            </Text>
            <Text style={[styles.timeButtonValue, { color: colors.textMain, fontFamily: fonts.bold }]}>
              {reminderLabel}
            </Text>
          </Pressable>

          {showTimePicker ? (
            <View style={styles.timePickerWrap}>
              <DateTimePicker
                mode="time"
                value={toDateFromTime(reminderTime)}
                onChange={(event, date) => {
                  void handleTimeChange(event, date);
                }}
              />
              {Platform.OS === "ios" ? (
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  style={[
                    styles.doneButton,
                    {
                      backgroundColor: withOpacity(
                        colors.primary,
                        isDark ? 0.3 : 0.16,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[styles.doneButtonText, { color: colors.primary, fontFamily: fonts.medium }]}
                  >
                    {t("settings.done")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
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
    borderWidth: 1,
    borderRadius: 16,
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
  segmentedRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
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
    height: 1,
  },
  timeButton: {
    borderWidth: 1,
    minHeight: 46,
    borderRadius: 12,
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
});
