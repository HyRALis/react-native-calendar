import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { clampIndex, pageIndexFromOffset } from '../../utils/paging';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type HorizontalPagerProps<T> = {
  items: readonly T[];
  index: number;
  onIndexChange: (index: number) => void;
  renderPage: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  extraData?: unknown;
  testID?: string;
};

export function HorizontalPager<T>({
  items,
  index,
  onIndexChange,
  renderPage,
  keyExtractor,
  extraData,
  testID,
}: HorizontalPagerProps<T>) {
  const reducedMotion = useReducedMotion();
  const listRef = useRef<FlatList<T>>(null);
  const settledIndexRef = useRef(index);
  const { width: windowWidth } = useWindowDimensions();
  const [pageWidth, setPageWidth] = useState(windowWidth);

  const safeIndex = clampIndex(index, items.length);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setPageWidth(current => (current === width ? current : width));
    }
  }, []);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = pageIndexFromOffset(
        event.nativeEvent.contentOffset.x,
        pageWidth,
        items.length,
      );

      if (next === settledIndexRef.current) {
        return;
      }

      settledIndexRef.current = next;
      onIndexChange(next);
    },
    [items.length, onIndexChange, pageWidth],
  );

  useEffect(() => {
    if (safeIndex === settledIndexRef.current) {
      return;
    }

    settledIndexRef.current = safeIndex;
    listRef.current?.scrollToIndex({
      index: safeIndex,
      animated: !reducedMotion,
    });
  }, [safeIndex, reducedMotion]);

  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: settledIndexRef.current * pageWidth,
      animated: false,
    });
  }, [pageWidth]);

  const getItemLayout = useCallback(
    (_: ArrayLike<T> | null | undefined, itemIndex: number) => ({
      length: pageWidth,
      offset: pageWidth * itemIndex,
      index: itemIndex,
    }),
    [pageWidth],
  );

  const renderItem = useCallback(
    ({ item, index: itemIndex }: ListRenderItemInfo<T>) => (
      <View style={[styles.page, { width: pageWidth }]}>
        {renderPage(item, itemIndex)}
      </View>
    ),
    [pageWidth, renderPage],
  );

  const data = useMemo(() => items as T[], [items]);

  return (
    <FlatList
      ref={listRef}
      testID={testID}
      style={styles.list}
      data={data}
      extraData={extraData}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      initialScrollIndex={safeIndex}
      getItemLayout={getItemLayout}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onLayout={handleLayout}
      onMomentumScrollEnd={handleMomentumEnd}
      windowSize={3}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      removeClippedSubviews={false}
      onScrollToIndexFailed={({ averageItemLength, index: failed }) => {
        listRef.current?.scrollToOffset({
          offset: failed * (pageWidth || averageItemLength),
          animated: false,
        });
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  page: { flex: 1 },
});
