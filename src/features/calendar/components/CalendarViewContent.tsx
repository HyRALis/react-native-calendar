import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { controlSizes, spacing } from '../../../shared/theme';
import type { CalendarEvent, CalendarView } from '../types';
import { CalendarPager } from './CalendarPager';
import { DayView } from './views/DayView';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';

export type CalendarViewContentProps = {
  view: CalendarView;
  date: Date;
  anchor?: Date;
  today?: Date;
  selectedDate?: Date | null;
  events?: readonly CalendarEvent[];
  onChangeDate?: (pageDate: Date) => void;
  onSelectDay?: (day: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
};

export function CalendarViewContent({
  view,
  date,
  anchor = date,
  today,
  selectedDate = null,
  events = [],
  onChangeDate = noop,
  onSelectDay,
  onSelectEvent,
}: CalendarViewContentProps) {
  const renderPage = useCallback(
    (pageDate: Date) => {
      if (view === 'month') {
        return (
          <MonthView
            month={pageDate}
            today={today}
            selectedDate={selectedDate}
            events={events}
            onSelectDay={onSelectDay}
            onSelectEvent={onSelectEvent}
          />
        );
      }

      return (
        <ScrollView contentContainerStyle={styles.scroll}>
          {view === 'day' ? (
            <DayView
              date={pageDate}
              today={today}
              events={events}
              onSelectEvent={onSelectEvent}
            />
          ) : (
            <WeekView
              date={pageDate}
              today={today}
              selectedDate={selectedDate}
              onSelectDay={onSelectDay}
              events={events}
              onSelectEvent={onSelectEvent}
            />
          )}
        </ScrollView>
      );
    },
    [events, onSelectDay, onSelectEvent, selectedDate, today, view],
  );

  return (
    <CalendarPager
      view={view}
      date={date}
      anchor={anchor}
      onChangeDate={onChangeDate}
      renderPage={renderPage}
    />
  );
}

function noop() {}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: controlSizes.lg + spacing.xl * 2,
    gap: spacing.md,
  },
});
