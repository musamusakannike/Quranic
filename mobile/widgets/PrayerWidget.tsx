import React from "react";
import { Text, VStack, HStack, Spacer } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding, frame } from "@expo/ui/swift-ui/modifiers";
import { createWidget, WidgetEnvironment } from "expo-widgets";
import { WidgetData } from "../lib/SolahHelper";

const PrayerWidgetComponent = (props: WidgetData, context: WidgetEnvironment) => {
  'widget';
  // Props can be empty if no snapshot was set yet
  const data = props.nextPrayerName ? props : {
    nextPrayerName: "Loading...",
    nextPrayerTime: "--:--",
    countdownTimestamp: Date.now(),
    fajr: "--:--",
    dhuhr: "--:--",
    asr: "--:--",
    maghrib: "--:--",
    isha: "--:--",
  };

  const widgetFamily = context.widgetFamily;

  if (widgetFamily === "systemSmall") {
    return (
      <VStack
        modifiers={[
          padding({ all: 16 }),
          foregroundStyle("#FFFFFF"),
        ]}
      >
        <Text
          modifiers={[
            font({ size: 12, weight: "bold" }),
            foregroundStyle("#A1A1AA"),
          ]}
        >
          NEXT PRAYER
        </Text>
        <Spacer modifiers={[frame({ height: 4 })]} />
        <Text
          modifiers={[
            font({ size: 24, weight: "black" }),
          ]}
        >
          {data.nextPrayerName}
        </Text>
        <Spacer modifiers={[frame({ height: 2 })]} />
        <Text
          modifiers={[
            font({ size: 14, weight: "bold" }),
            foregroundStyle("#FDA4AF"),
          ]}
        >
          {data.nextPrayerTime}
        </Text>
      </VStack>
    );
  }

  // Medium and others
  return (
    <HStack
      modifiers={[
        padding({ all: 16 }),
      ]}
    >
      <VStack>
        <Text
          modifiers={[
            font({ size: 11, weight: "bold" }),
            foregroundStyle("#A1A1AA"),
          ]}
        >
          PRAYER TIMES
        </Text>
        <Spacer modifiers={[frame({ height: 8 })]} />
        {renderPrayerRow("Fajr", data.fajr, data.nextPrayerName === "Fajr")}
        {renderPrayerRow("Dhuhr", data.dhuhr, data.nextPrayerName === "Dhuhr")}
        {renderPrayerRow("Asr", data.asr, data.nextPrayerName === "Asr")}
        {renderPrayerRow("Maghrib", data.maghrib, data.nextPrayerName === "Maghrib")}
        {renderPrayerRow("Isha", data.isha, data.nextPrayerName === "Isha")}
      </VStack>

      <Spacer />

      <VStack
        modifiers={[
          padding({ leading: 16 }),
        ]}
      >
        <Text
          modifiers={[
            font({ size: 28, weight: "bold" }),
          ]}
        >
          {data.nextPrayerName}
        </Text>
        <Text
          modifiers={[
            font({ size: 16, weight: "bold" }),
            foregroundStyle("#FDA4AF"),
          ]}
        >
          {data.nextPrayerTime}
        </Text>
        <Spacer modifiers={[frame({ height: 8 })]} />
        <Text
          modifiers={[
            font({ size: 12, weight: "bold" }),
            foregroundStyle("#EAB308"), // Soft gold
          ]}
        >
          Countdown...
        </Text>
      </VStack>
    </HStack>
  );
};

function renderPrayerRow(label: string, time: string, isActive: boolean) {
  return (
    <HStack>
      <Text
        modifiers={[
          font({ size: 12, weight: isActive ? "bold" : "regular" }),
          foregroundStyle(isActive ? "#FFFFFF" : "#A1A1AA"),
        ]}
      >
        {label}
      </Text>
      <Spacer />
      <Text
        modifiers={[
          font({ size: 12, weight: "regular" }),
          foregroundStyle(isActive ? "#FDA4AF" : "#71717A"),
        ]}
      >
        {time}
      </Text>
    </HStack>
  );
}

export const PrayerWidget = createWidget("PrayerWidget", PrayerWidgetComponent);
export default PrayerWidget;
