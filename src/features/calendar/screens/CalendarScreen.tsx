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

export function CalendarScreen({ events = [] }: CalendarScreenProps) {
  const { view, focusedDate, visibleMonth, today, anchor } =
    useCalendarNavigation();
  const { goToMonth, focusDate } = useCalendarActions();

  return (
    <View style={styles.screen}>
      <CalendarActionsBar
        month={visibleMonth}
        anchor={anchor}
        today={today}
        onChangeMonth={goToMonth}
      />
      <View style={styles.content} testID={`calendar-view-${view}`}>
        <CalendarViewContent
          view={view}
          date={focusedDate}
          month={visibleMonth}
          anchor={anchor}
          today={today}
          selectedDate={focusedDate}
          events={events}
          onChangeMonth={goToMonth}
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
