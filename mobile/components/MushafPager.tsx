import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import PagerView from "react-native-pager-view";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MushafImages } from "../constants/MushafImages";

const { width, height } = Dimensions.get("window");

interface MushafPagerProps {
  initialPage: number; // 1-indexed (Mushaf page number)
  onPageChange?: (page: number) => void;
  chapterPages: number[]; // List of mushaf page numbers for the current chapter
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

function ZoomableMushafPage({
  pageNumber,
  onZoomStateChange,
}: {
  pageNumber: number;
  onZoomStateChange: (isZoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  useAnimatedReaction(
    () => scale.value > 1.01,
    (isZoomed, previous) => {
      if (isZoomed !== previous) {
        runOnJS(onZoomStateChange)(isZoomed);
      }
    },
    [onZoomStateChange],
  );

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      const nextScale = clamp(
        startScale.value * event.scale,
        MIN_SCALE,
        MAX_SCALE,
      );
      scale.value = nextScale;

      const maxX = ((width * nextScale) - width) / 2;
      const maxY = ((height * nextScale) - height) / 2;

      translateX.value = clamp(translateX.value, -maxX, maxX);
      translateY.value = clamp(translateY.value, -maxY, maxY);
    })
    .onEnd(() => {
      if (scale.value <= 1.01) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1.01) {
        return;
      }

      const maxX = ((width * scale.value) - width) / 2;
      const maxY = ((height * scale.value) - height) / 2;

      translateX.value = clamp(startTranslateX.value + event.translationX, -maxX, maxX);
      translateY.value = clamp(startTranslateY.value + event.translationY, -maxY, maxY);
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.page}>
        <Animated.View style={[styles.imageWrapper, animatedImageStyle]}>
          <Image
            source={MushafImages[pageNumber]}
            style={styles.image}
            contentFit="contain"
            transition={200}
            placeholderContentFit="contain"
            priority="high"
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export default function MushafPager({
  initialPage,
  onPageChange,
  chapterPages,
}: MushafPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Quran is RTL. We reverse the pages so the first page (lowest number) is on the "right"
  const rtlPages = useMemo(() => [...chapterPages].reverse(), [chapterPages]);

  // Find the index of the initial page in reversed rtlPages
  const initialIndex = useMemo(() => {
    const idx = rtlPages.indexOf(initialPage);
    return idx >= 0 ? idx : 0;
  }, [initialPage, rtlPages]);

  const onPageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    const mushafPage = rtlPages[index];
    setIsZoomed(false);
    if (onPageChange) {
      onPageChange(mushafPage);
    }
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        scrollEnabled={!isZoomed}
        onPageSelected={onPageSelected}
      >
        {rtlPages.map((pageNumber) => (
          <ZoomableMushafPage
            key={pageNumber}
            pageNumber={pageNumber}
            onZoomStateChange={setIsZoomed}
          />
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
