import React from "react";
import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { getNextPrayer, getPrayerTimes, formatPrayerTime, WidgetData } from "./SolahHelper";
import * as Location from "expo-location";
import PrayerWidgetAndroid from "../widgets/AndroidPrayerWidget";
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";

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

const WIDGET_UPDATE_TASK = "WIDGET_UPDATE_TASK";

TaskManager.defineTask(WIDGET_UPDATE_TASK, async () => {
  try {
    await updateWidget();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("Background task failed:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export const registerWidgetUpdateTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_UPDATE_TASK);
    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(WIDGET_UPDATE_TASK, {
        minimumInterval: 15, // 15 minutes
      });
    }
    await updateWidget(); // Initial update
  } catch (err) {
    console.error("Failed to register widget background task:", err);
  }
};
