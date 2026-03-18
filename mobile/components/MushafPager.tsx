import React, { useMemo, useRef, useState, useEffect } from "react";
import { StyleSheet, View, Dimensions, ActivityIndicator } from "react-native";
import PagerView from "react-native-pager-view";
import { Image } from "expo-image";
import { MushafImages } from "../constants/MushafImages";

const { width, height } = Dimensions.get("window");

interface MushafPagerProps {
  initialPage: number; // 1-indexed (Mushaf page number)
  onPageChange?: (page: number) => void;
  chapterPages: number[]; // List of mushaf page numbers for the current chapter
}

export default function MushafPager({
  initialPage,
  onPageChange,
  chapterPages,
}: MushafPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Prefetch all pages in the current chapter group for seamless swiping
  useEffect(() => {
    const assets = chapterPages.map((p) => MushafImages[p]);
    Image.prefetch(assets);
  }, [chapterPages]);

  // Find the index of the initial page in chapterPages
  const initialIndex = useMemo(() => {
    const idx = chapterPages.indexOf(initialPage);
    return idx >= 0 ? idx : 0;
  }, [initialPage, chapterPages]);

  const onPageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    const mushafPage = chapterPages[index];
    setCurrentPage(mushafPage);
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
        onPageSelected={onPageSelected}
      >
        {chapterPages.map((pageNumber) => (
          <View key={pageNumber} style={styles.page}>
             <Image
              source={MushafImages[pageNumber]}
              style={styles.image}
              contentFit="contain"
              transition={200}
              placeholderContentFit="contain"
              priority="high"
            />
          </View>
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
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
