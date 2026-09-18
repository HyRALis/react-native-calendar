import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { CalendarActionsBar } from '../components/CalendarActionsBar';
import { CalendarViewContent } from '../components/CalendarViewContent';
import {
  useCalendarActions,
  useCalendarNavigation,
} from '../navigation/CalendarNavigationProvider';
import type { CalendarEvent } from '../types';

export type CalendarScreenProps = {
  /** Empty until a real event source exists; injectable for tests. */
  events?: readonly CalendarEvent[];
};

/**
 * Renders whatever the navigation context is focused on. The screen holds no
 * date state of its own, so the header drawer, the actions bar, swiping and day
 * taps all move the same focused date and stay in step across views.
 */
export function CalendarScreen({ events = [] }: CalendarScreenProps) {
  const { view, focusedDate, visibleMonth, today, anchor } =
    useCalendarNavigation();
  const { goToMonth, goToPage, goToNext, goToPrevious, goToToday, focusDate } =
    useCalendarActions();

  return (
    <View style={styles.screen}>
      <CalendarActionsBar
        view={view}
        month={visibleMonth}
        focusedDate={focusedDate}
        anchor={anchor}
        today={today}
        onChangeMonth={goToMonth}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
      />
      <View style={styles.content} testID={`calendar-view-${view}`}>
        <CalendarViewContent
          view={view}
          date={focusedDate}
          anchor={anchor}
          today={today}
          selectedDate={focusedDate}
          events={events}
          onChangeDate={goToPage}
          // Focusing a day in a neighbouring period moves the pager there too,
          // because the visible page is derived from the focused date.
          onSelectDay={focusDate}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
