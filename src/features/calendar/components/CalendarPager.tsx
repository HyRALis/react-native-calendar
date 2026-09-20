import React, { useCallback, useMemo } from 'react';
import { HorizontalPager } from '../../../shared/components/molecules/HorizontalPager';
import type { CalendarView } from '../types';
import { dateAtIndex, indexOfDate, pageCount } from '../utils/calendarPaging';

export type CalendarPagerProps = {
  view: CalendarView;
  date: Date;
  anchor: Date;
  onChangeDate: (pageDate: Date) => void;
  renderPage: (pageDate: Date) => React.ReactNode;
};

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
