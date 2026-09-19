import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components/atoms/Typography';
import { colors, spacing } from '../../../../shared/theme';
import type { CalendarEvent } from '../../types';
import {
  getMonthWeeks,
  isSameDay,
  isSameMonth,
} from '../../utils/calendarDates';
import { eventsForDay } from '../../utils/calendarEvents';
import { MonthDayCell } from './MonthDayCell';

export type MonthViewProps = {
  /** The month to render; only its year and month are read. */
  month: Date;
  today?: Date;
  selectedDate?: Date | null;
  events?: readonly CalendarEvent[];
  maxEventRows?: number;
  onSelectDay?: (day: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
};

/** One month as a full-height grid. Stateless: paging lives in MonthPager. */
export function MonthView({
  month,
  today,
  selectedDate = null,
  events = [],
  maxEventRows = 3,
  onSelectDay,
  onSelectEvent,
}: MonthViewProps) {
  const weeks = useMemo(() => getMonthWeeks(month), [month]);

  return (
    <View style={styles.month}>
      <View style={styles.weekdays}>
        {weeks[0].map(day => (
          <View key={day.getDay()} style={styles.weekdayCell}>
            <Typography variant="caption" tone="muted" style={styles.centered}>
              {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Typography>
          </View>
        ))}
      </View>
      <View style={styles.weeks}>
        {weeks.map(week => (
          <View key={week[0].getTime()} style={styles.week}>
            {week.map(day => (
              <MonthDayCell
                key={day.getTime()}
                day={day}
                events={eventsForDay(events, day)}
                inCurrentMonth={isSameMonth(day, month)}
                isToday={today ? isSameDay(day, today) : false}
                isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                maxEventRows={maxEventRows}
                onPress={onSelectDay}
                onSelectEvent={onSelectEvent}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  month: { flex: 1, backgroundColor: colors.background },
  weekdays: { flexDirection: 'row', paddingVertical: spacing.xs },
  weekdayCell: { flex: 1 },
  centered: { textAlign: 'center' },

  weeks: { flex: 1 },
  week: { flex: 1, flexDirection: 'row' },
});
