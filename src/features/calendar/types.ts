export type CalendarView = 'day' | 'week' | 'month';

export const calendarViews: ReadonlyArray<{
  value: CalendarView;
  label: string;
}> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

/**
 * One scheduled entry. Kept free of any storage concern so the views can be fed
 * from a prop today and a real repository later without changing a component.
 */
export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
};
