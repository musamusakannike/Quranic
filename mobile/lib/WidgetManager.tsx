import React from "react";
import { Platform } from "react-native";
import { PrayerWidget } from "../widgets/PrayerWidget";
import { requestWidgetUpdate } from "react-native-android-widget";
import { getNextPrayer, getPrayerTimes, formatPrayerTime, WidgetData } from "./SolahHelper";
import * as Location from "expo-location";
import { PrayerWidgetAndroid } from "../widgets/AndroidPrayerWidget";

export const updateWidget = async () => {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const nextP = getNextPrayer(latitude, longitude);
    const times = getPrayerTimes(latitude, longitude);

    const data: WidgetData = {
      nextPrayerName: nextP.label,
      nextPrayerTime: formatPrayerTime(nextP.time),
      countdownTimestamp: nextP.time.getTime(),
      fajr: formatPrayerTime(times.fajr),
      dhuhr: formatPrayerTime(times.dhuhr),
      asr: formatPrayerTime(times.asr),
      maghrib: formatPrayerTime(times.maghrib),
      isha: formatPrayerTime(times.isha),
    };

    if (Platform.OS === "ios") {
      // Update iOS Widget Snapshot
      PrayerWidget.updateSnapshot(data);
    }

    if (Platform.OS === "android") {
      // Update Android Widget
      requestWidgetUpdate({
        widgetName: "PrayerWidget",
        renderWidget: (props) => (
          <PrayerWidgetAndroid 
            data={data} 
            widgetWidth={props.width} 
            widgetHeight={props.height} 
          />
        ),
      });
    }
    
  } catch (err) {
    console.error("Failed to update widget:", err);
  }
};
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

const WIDGET_UPDATE_TASK = "WIDGET_UPDATE_TASK";

TaskManager.defineTask(WIDGET_UPDATE_TASK, async () => {
  await updateWidget();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export const registerWidgetUpdateTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_UPDATE_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(WIDGET_UPDATE_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
    await updateWidget(); // Initial update
  } catch (err) {
    console.error("Failed to register widget background task:", err);
  }
};
