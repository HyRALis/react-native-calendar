import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../../../shared/theme';
import type { CalendarEvent, CalendarView } from '../types';
import { MonthPager } from './MonthPager';
import { DayView } from './views/DayView';
import { WeekView } from './views/WeekView';

export type CalendarViewContentProps = {
  view: CalendarView;
  /** The focused day for day and week views. */
  date: Date;
  /** The month the grid shows; only used by the month view. */
  month?: Date;
  /** Origin of the pageable month range; only used by the month view. */
  anchor?: Date;
  today?: Date;
  selectedDate?: Date | null;
  events?: readonly CalendarEvent[];
  onChangeMonth?: (month: Date) => void;
  onSelectDay?: (day: Date) => void;
};

/** The screen no longer scrolls, so day and week views own their scrolling. */
export function CalendarViewContent({
  view,
  date,
  month = date,
  anchor,
  today,
  selectedDate = null,
  events = [],
  onChangeMonth,
  onSelectDay,
}: CalendarViewContentProps) {
  if (view === 'month') {
    return (
      <MonthPager
        month={month}
        anchor={anchor}
        onChangeMonth={onChangeMonth ?? noop}
        today={today}
        selectedDate={selectedDate}
        events={events}
        onSelectDay={onSelectDay}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {view === 'day' ? <DayView date={date} /> : <WeekView date={date} />}
    </ScrollView>
  );
}

function noop() {}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md },
});
