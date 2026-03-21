import React from "react";
import {
  FlexWidget,
  TextWidget,
} from "react-native-android-widget";
import { WidgetData } from "../lib/SolahHelper";

export function PrayerWidgetAndroid({
  data,
  widgetWidth,
  widgetHeight,
}: {
  data: WidgetData;
  widgetWidth: number;
  widgetHeight: number;
}) {
  const isSmall = widgetWidth < 180;

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#1A1A1A",
        padding: 16,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TextWidget
        text="NEXT PRAYER"
        style={{
          fontSize: 10,
          color: "#A1A1AA",
          fontWeight: "normal",
        }}
      />
      <TextWidget
        text={data.nextPrayerName}
        style={{
          fontSize: 24,
          color: "#FFFFFF",
          fontWeight: "bold",
        }}
      />
      <TextWidget
        text={`at ${data.nextPrayerTime}`}
        style={{
          fontSize: 14,
          color: "#FDA4AF",
        }}
      />
      {!isSmall && (
        <FlexWidget style={{ marginTop: 12, width: "match_parent" }}>
          <PrayerRow label="Fajr" time={data.fajr} isActive={data.nextPrayerName === "Fajr"} />
          <PrayerRow label="Dhuhr" time={data.dhuhr} isActive={data.nextPrayerName === "Dhuhr"} />
          <PrayerRow label="Asr" time={data.asr} isActive={data.nextPrayerName === "Asr"} />
          <PrayerRow label="Maghrib" time={data.maghrib} isActive={data.nextPrayerName === "Maghrib"} />
          <PrayerRow label="Isha" time={data.isha} isActive={data.nextPrayerName === "Isha"} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

function PrayerRow({ label, time, isActive }: { label: string; time: string; isActive: boolean }) {
  return (
    <FlexWidget style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, width: "match_parent" }}>
      <TextWidget
        text={label}
        style={{
          fontSize: 12,
          color: isActive ? "#FFFFFF" : "#A1A1AA",
          fontWeight: isActive ? "bold" : "normal",
        }}
      />
      <TextWidget
        text={time}
        style={{
          fontSize: 12,
          color: isActive ? "#FDA4AF" : "#71717A",
        }}
      />
    </FlexWidget>
  );
}
