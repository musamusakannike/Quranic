import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
import { ReminderTime, useAppSettings } from "../../lib/AppSettingsContext";

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
  } = useAppSettings();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const reminderLabel = useMemo(() => formatReminderTime(reminderTime), [reminderTime]);

  const handleReminderToggle = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      await disableReminder();
      return;
    }

    const enabled = await enableReminder(reminderTime);
    if (!enabled) {
      Alert.alert(
        "Permission required",
        "Please allow notifications from device settings to receive reminders.",
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textMain }]}>Settings</Text>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Appearance</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Choose app theme mode</Text>

          <View style={styles.segmentedRow}>
            {[
              { key: "system", label: "Device" },
              { key: "light", label: "Light" },
              { key: "dark", label: "Dark" },
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
                      { color: selected ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.helperText, { color: colors.textMuted }]}>Current: {resolvedTheme}</Text>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Chapter display</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain }]}>Show translations</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Disabled by default</Text>
            </View>
            <Switch
              value={showTranslations}
              onValueChange={(nextValue) => {
                void setShowTranslations(nextValue);
              }}
              trackColor={{ false: withOpacity(colors.border, 0.8), true: withOpacity(colors.primary, 0.45) }}
              thumbColor={showTranslations ? colors.primary : "#F4F4F5"}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: withOpacity(colors.border, 0.75) }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain }]}>Show transliterations</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Latin script under each ayah</Text>
            </View>
            <Switch
              value={showTransliterations}
              onValueChange={(nextValue) => {
                void setShowTransliterations(nextValue);
              }}
              trackColor={{ false: withOpacity(colors.border, 0.8), true: withOpacity(colors.primary, 0.45) }}
              thumbColor={showTransliterations ? colors.primary : "#F4F4F5"}
            />
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Daily Quran reminder</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Local notification to recite</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.textMain }]}>Enable reminder</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Sends one reminder every day</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={(nextValue) => {
                void handleReminderToggle(nextValue);
              }}
              trackColor={{ false: withOpacity(colors.border, 0.8), true: withOpacity(colors.primary, 0.45) }}
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
            <Text style={[styles.timeButtonLabel, { color: colors.textMuted }]}>Reminder time</Text>
            <Text style={[styles.timeButtonValue, { color: colors.textMain }]}>{reminderLabel}</Text>
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
                    { backgroundColor: withOpacity(colors.primary, isDark ? 0.3 : 0.16) },
                  ]}
                >
                  <Text style={[styles.doneButtonText, { color: colors.primary }]}>Done</Text>
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
