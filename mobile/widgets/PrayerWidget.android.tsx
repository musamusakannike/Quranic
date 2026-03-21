import { WidgetData } from "../lib/SolahHelper";

export const PrayerWidget = {
  updateSnapshot: (data: WidgetData) => {
    // No-op for Android, handled by react-native-android-widget
  },
  updateTimeline: (entries: any) => {
    // No-op for Android
  }
};

export default PrayerWidget;
