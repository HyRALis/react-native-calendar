import React, { useCallback, useMemo, useRef } from 'react';
import { HorizontalPager } from '../../../shared/components/molecules/HorizontalPager';
import type { CalendarEvent } from '../types';
import { startOfMonth } from '../utils/calendarDates';
import { buildMonthRange, indexOfMonth } from '../utils/monthPaging';
import { MonthView } from './views/MonthView';

export type MonthPagerProps = {
  month: Date;
  anchor?: Date;
  onChangeMonth: (month: Date) => void;
  today?: Date;
  selectedDate?: Date | null;
  events?: readonly CalendarEvent[];
  onSelectDay?: (day: Date) => void;
};

export function MonthPager({
  month,
  anchor: anchorProp,
  onChangeMonth,
  today,
  selectedDate = null,
  events = [],
  onSelectDay,
}: MonthPagerProps) {
  const fallbackAnchorRef = useRef(startOfMonth(month));
  const anchor = anchorProp ?? fallbackAnchorRef.current;

  const months = useMemo(() => buildMonthRange(anchor), [anchor]);
  const index = indexOfMonth(anchor, month);

  const handleIndexChange = useCallback(
    (next: number) => onChangeMonth(months[next]),
    [months, onChangeMonth],
  );

  const renderPage = useCallback(
    (page: Date) => (
      <MonthView
        month={page}
        today={today}
        selectedDate={selectedDate}
        events={events}
        onSelectDay={onSelectDay}
      />
    ),
    [events, onSelectDay, selectedDate, today],
  );

  return (
    <HorizontalPager
      testID="month-pager"
      items={months}
      index={index}
      onIndexChange={handleIndexChange}
      renderPage={renderPage}
      keyExtractor={page => String(page.getTime())}
      extraData={renderPage}
    />
  );
}
