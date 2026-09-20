import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HorizontalPager } from './HorizontalPager';

const items = ['a', 'b', 'c', 'd'];

function renderPager(index: number, onIndexChange = jest.fn()) {
  const view = render(
    <HorizontalPager
      testID="pager"
      items={items}
      index={index}
      onIndexChange={onIndexChange}
      renderPage={item => <Text>{`page ${item}`}</Text>}
      keyExtractor={item => item}
    />,
  );
  fireEvent(screen.getByTestId('pager'), 'layout', {
    nativeEvent: { layout: { width: 300, height: 500, x: 0, y: 0 } },
  });
  return { ...view, onIndexChange };
}

function swipeTo(offsetX: number) {
  fireEvent(screen.getByTestId('pager'), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: offsetX, y: 0 },
      layoutMeasurement: { width: 300, height: 500 },
      contentSize: { width: 1200, height: 500 },
    },
  });
}

test('renders the controlled page', () => {
  renderPager(0);
  expect(screen.getByText('page a')).toBeOnTheScreen();
});

test('settling on a new page reports its index once', () => {
  const { onIndexChange } = renderPager(0);
  swipeTo(600);
  expect(onIndexChange).toHaveBeenCalledTimes(1);
  expect(onIndexChange).toHaveBeenCalledWith(2);
});

test('settling back on the current page reports nothing', () => {
  const { onIndexChange } = renderPager(1);
  swipeTo(300);
  expect(onIndexChange).not.toHaveBeenCalled();
});

test('changing the index prop does not report a swipe', () => {
  const onIndexChange = jest.fn();
  const { rerender } = renderPager(0, onIndexChange);
  rerender(
    <HorizontalPager
      testID="pager"
      items={items}
      index={3}
      onIndexChange={onIndexChange}
      renderPage={item => <Text>{`page ${item}`}</Text>}
      keyExtractor={item => item}
    />,
  );
  expect(onIndexChange).not.toHaveBeenCalled();
});
