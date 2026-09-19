import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CalendarEvent } from '../../types';
import { DayView } from './DayView';

const date = new Date(2026, 2, 17, 12);
const events: CalendarEvent[] = Array.from({ length: 8 }, (_, index) => ({
  id: String(index),
  title: `Event ${index} with a complete title that should wrap over as many lines as needed`,
  start: new Date(2026, 2, 17, 9 + index),
}));

test('day lists every event in time order with untruncated titles', () => {
  const onSelectEvent = jest.fn();
  render(
    <DayView
      date={date}
      events={[...events].reverse()}
      onSelectEvent={onSelectEvent}
    />,
  );
  expect(
    screen
      .getAllByRole('button')
      .map(row => row.props.accessibilityLabel.split(',')[0]),
  ).toEqual(events.map(event => event.title));
  events.forEach(event => {
    expect(screen.getByText(event.title).props.numberOfLines).toBeUndefined();
  });
  fireEvent.press(screen.getByText(events[7].title));
  expect(onSelectEvent).toHaveBeenCalledWith(events[7]);
});

test('the day includes overnight events but excludes events from another day', () => {
  const overnight = {
    id: 'overnight',
    title: 'Overnight',
    start: new Date(2026, 2, 16, 23),
    end: new Date(2026, 2, 17, 2),
  };
  const other = {
    id: 'other',
    title: 'Tomorrow',
    start: new Date(2026, 2, 18, 9),
  };
  render(<DayView date={date} events={[overnight, other]} />);
  expect(screen.getByText('Overnight')).toBeOnTheScreen();
  expect(screen.queryByText('Tomorrow')).toBeNull();
});
