import { formatPeriodLabel, formatWeekRange, stepUnit } from './calendarLabels';

const wednesday = new Date(2026, 2, 18, 12);

test('the month view needs no period line', () => {
  expect(formatPeriodLabel('month', wednesday)).toBeNull();
});

test('the day view names the weekday and the date', () => {
  expect(formatPeriodLabel('day', wednesday)).toBe(
    wednesday.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  );
});

test('a week inside one month names that month once', () => {
  expect(formatPeriodLabel('week', wednesday)).toBe(
    `16 – ${new Date(2026, 2, 22, 12).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
    })}`,
  );
});

test('a week crossing a month names both sides', () => {
  const crossing = new Date(2026, 3, 1, 12);
  const options = { day: 'numeric', month: 'short' } as const;

  expect(formatWeekRange(crossing)).toBe(
    `${new Date(2026, 2, 30, 12).toLocaleDateString(
      undefined,
      options,
    )} – ${new Date(2026, 3, 5, 12).toLocaleDateString(undefined, options)}`,
  );
});

test('a week crossing a year names both sides', () => {
  const crossing = new Date(2026, 11, 31, 12);
  expect(formatWeekRange(crossing)).toContain('–');
});

test('each view steps in its own unit', () => {
  expect(stepUnit).toEqual({ day: 'day', week: 'week', month: 'month' });
});
