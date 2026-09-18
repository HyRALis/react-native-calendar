import React, { useCallback, useMemo } from 'react';
import { HorizontalPager } from '../../../shared/components/molecules/HorizontalPager';
import type { CalendarView } from '../types';
import { dateAtIndex, indexOfDate, pageCount } from '../utils/calendarPaging';

export type CalendarPagerProps = {
  view: CalendarView;
  /** The focused date; the page holding it is the one shown. */
  date: Date;
  anchor: Date;
  /** Reports the start of the page swiped to: a 1st, a Monday, or the day. */
  onChangeDate: (pageDate: Date) => void;
  renderPage: (pageDate: Date) => React.ReactNode;
};

/**
 * Swipes between whatever the current view pages over: months, weeks or days.
 *
 * Pages are addressed by index rather than by a materialised array of dates,
 * so the day view's several thousand pages cost an array of numbers instead of
 * an array of Dates, and the list identity stays stable for a whole view.
 */
export function CalendarPager({
  view,
  date,
  anchor,
  onChangeDate,
  renderPage,
}: CalendarPagerProps) {
  const indices = useMemo(
    () => Array.from({ length: pageCount(view, anchor) }, (_, index) => index),
    [anchor, view],
  );

  const index = indexOfDate(view, anchor, date);

  const handleIndexChange = useCallback(
    (next: number) => onChangeDate(dateAtIndex(view, anchor, next)),
    [anchor, onChangeDate, view],
  );

  const renderIndex = useCallback(
    (pageIndex: number) => renderPage(dateAtIndex(view, anchor, pageIndex)),
    [anchor, renderPage, view],
  );

  return (
    <HorizontalPager
      // Remounting per view resets the pager's settled page, so a list built
      // for months never inherits a week's scroll position.
      key={view}
      testID={`${view}-pager`}
      items={indices}
      index={index}
      onIndexChange={handleIndexChange}
      renderPage={renderIndex}
      keyExtractor={pageIndex => String(pageIndex)}
      extraData={renderIndex}
    />
  );
}
