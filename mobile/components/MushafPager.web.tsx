import React, { useMemo, useRef } from "react";
import { StyleSheet, View, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
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
  const flatListRef = useRef<FlatList>(null);

  // Quran is RTL. We reverse the pages so the first page (lowest number) is on the "right"
  // In a standard LTR horizontal list, this means the first page is at the highest index.
  const rtlPages = useMemo(() => [...chapterPages].reverse(), [chapterPages]);

  // Find the index of the initial page in reversed rtlPages
  const initialIndex = useMemo(() => {
    const idx = rtlPages.indexOf(initialPage);
    return idx >= 0 ? idx : 0;
  }, [initialPage, rtlPages]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const mushafPage = rtlPages[index];
    if (onPageChange && mushafPage) {
      onPageChange(mushafPage);
    }
  };

  const renderItem = ({ item: pageNumber }: { item: number }) => (
    <View key={pageNumber} style={styles.page}>
      <Image
        source={MushafImages[pageNumber]}
        style={styles.image}
        contentFit="contain"
        transition={200}
        placeholderContentFit="contain"
        priority="high"
        cachePolicy="memory-disk"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={rtlPages}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(item) => item.toString()}
        style={styles.pager}
      />
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
