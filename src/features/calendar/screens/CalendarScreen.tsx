import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { CalendarActionsBar } from '../components/CalendarActionsBar';
import { CalendarViewContent } from '../components/CalendarViewContent';
import type { CalendarEvent, CalendarView } from '../types';
import { isSameMonth, startOfMonth } from '../utils/calendarDates';
import { clampMonthToRange } from '../utils/monthPaging';

export type CalendarScreenProps = {
  view?: CalendarView;
  /** Empty until a real event source exists; injectable for tests. */
  events?: readonly CalendarEvent[];
  today?: Date;
};

/**
 * Owns the single source of truth for the visible month. Swiping, the month and
 * year pickers, the arrows and taps on adjacent-month days all reduce to one
 * `setVisibleMonth`, so none of them can disagree.
 */
export function CalendarScreen({
  view = 'month',
  events = [],
  today = new Date(),
}: CalendarScreenProps) {
  // One range definition for the pager and the year picker, so the bar can
  // never offer a month the grid cannot scroll to.
  const anchorRef = useRef(startOfMonth(today));
  const anchor = anchorRef.current;

  const [visibleMonth, setVisibleMonth] = useState(anchor);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const changeMonth = useCallback(
    (next: Date) => setVisibleMonth(clampMonthToRange(anchor, next)),
    [anchor],
  );

  const handleSelectDay = useCallback(
    (day: Date) => {
      setSelectedDate(day);
      // A leading or trailing day belongs to the neighbouring month: go there.
      setVisibleMonth(current =>
        isSameMonth(day, current) ? current : clampMonthToRange(anchor, day),
      );
    },
    [anchor],
  );

  return (
    <View style={styles.screen}>
      <CalendarActionsBar
        month={visibleMonth}
        anchor={anchor}
        today={today}
        onChangeMonth={changeMonth}
      />
      <View style={styles.content} testID={`calendar-view-${view}`}>
        <CalendarViewContent
          view={view}
          date={selectedDate ?? today}
          month={visibleMonth}
          anchor={anchor}
          today={today}
          selectedDate={selectedDate}
          events={events}
          onChangeMonth={changeMonth}
          onSelectDay={handleSelectDay}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
