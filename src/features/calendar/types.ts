export type CalendarView = 'day' | 'week' | 'month';

export const calendarViews: ReadonlyArray<{
  value: CalendarView;
  label: string;
}> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  description?: string;
};
