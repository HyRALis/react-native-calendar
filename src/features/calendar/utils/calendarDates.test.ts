import {
  addDays,
  addMinutes,
  addMonths,
  atTime,
  combineDateAndTime,
  differenceInMonths,
  getMonthWeeks,
  getWeekDays,
  isSameDay,
  isSameMonth,
  minutesOfDay,
  startOfMonth,
} from './calendarDates';

test('week starts on Monday and crosses year boundaries', () => {
  const days = getWeekDays(new Date(2027, 0, 3));
  expect(days).toHaveLength(7);
  expect(days[0].getDay()).toBe(1);
  expect(isSameDay(days[0], new Date(2026, 11, 28))).toBe(true);
  expect(isSameDay(days[6], new Date(2027, 0, 3))).toBe(true);
});

test.each([
  [2024, 1, 5, 29], // Leap February.
  [2021, 1, 4, 28], // Monday start, exactly four weeks.
  [2026, 2, 6, 31], // Sunday start, six-week month.
])(
  'month %i/%i includes every date once in complete weeks',
  (year, month, weekCount, dayCount) => {
    const weeks = getMonthWeeks(new Date(year, month, 15));
    expect(weeks).toHaveLength(weekCount);
    weeks.forEach(week => {
      expect(week).toHaveLength(7);
      expect(week[0].getDay()).toBe(1);
      expect(week[6].getDay()).toBe(0);
    });
    const currentMonth = weeks.flat().filter(day => day.getMonth() === month);
    expect(currentMonth.map(day => day.getDate())).toEqual(
      Array.from({ length: dayCount }, (_, index) => index + 1),
    );
  },
);

test('day arithmetic preserves local dates around daylight-saving transitions', () => {
  const original = new Date(2026, 2, 29, 23);
  const next = addDays(original, 1);
  expect([next.getFullYear(), next.getMonth(), next.getDate()]).toEqual([
    2026, 2, 30,
  ]);
  expect(original.getDate()).toBe(29);
  expect(isSameDay(original, new Date(2026, 2, 29, 1))).toBe(true);
});

test('startOfMonth normalises to the 1st at midday', () => {
  const start = startOfMonth(new Date(2026, 2, 31, 23, 45));
  expect([start.getMonth(), start.getDate(), start.getHours()]).toEqual([
    2, 1, 12,
  ]);
});

test.each([
  [new Date(2026, 0, 31), 1, 2026, 1], // Jan 31 + 1 month is February, never March.
  [new Date(2026, 0, 15), -1, 2025, 11], // Backwards across a year boundary.
  [new Date(2025, 11, 1), 1, 2026, 0], // Forwards across a year boundary.
  [new Date(2024, 5, 10), 0, 2024, 5],
])('addMonths(%s, %i) lands on %i-%i', (date, months, year, month) => {
  const shifted = addMonths(date, months);
  expect([
    shifted.getFullYear(),
    shifted.getMonth(),
    shifted.getDate(),
  ]).toEqual([year, month, 1]);
});

test('isSameMonth compares year and month, not the month number alone', () => {
  expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 2, 31))).toBe(true);
  expect(isSameMonth(new Date(2025, 2, 1), new Date(2026, 2, 1))).toBe(false);
});

test('differenceInMonths is signed and spans years', () => {
  expect(differenceInMonths(new Date(2025, 11, 1), new Date(2027, 0, 1))).toBe(
    13,
  );
  expect(differenceInMonths(new Date(2027, 0, 1), new Date(2025, 11, 1))).toBe(
    -13,
  );
});

test('minutesOfDay counts from midnight', () => {
  expect(minutesOfDay(new Date(2026, 2, 17, 0, 0))).toBe(0);
  expect(minutesOfDay(new Date(2026, 2, 17, 9, 30))).toBe(570);
  expect(minutesOfDay(new Date(2026, 2, 17, 23, 59))).toBe(1439);
});

test('atTime keeps the calendar day and sets the time', () => {
  const day = new Date(2026, 2, 17, 23, 45);
  expect(atTime(day, 570)).toEqual(new Date(2026, 2, 17, 9, 30));
});

test('atTime rolls a whole day into tomorrow', () => {
  expect(atTime(new Date(2026, 2, 17, 12), 24 * 60)).toEqual(
    new Date(2026, 2, 18, 0, 0),
  );
});

test('combineDateAndTime takes the day from one date and the clock from another', () => {
  expect(
    combineDateAndTime(new Date(2026, 3, 2, 12), new Date(2026, 2, 17, 8, 15)),
  ).toEqual(new Date(2026, 3, 2, 8, 15));
});

test('addMinutes moves by elapsed time and crosses midnight', () => {
  expect(addMinutes(new Date(2026, 2, 17, 23, 30), 60)).toEqual(
    new Date(2026, 2, 18, 0, 30),
  );
  expect(addMinutes(new Date(2026, 2, 17, 9, 0), -90)).toEqual(
    new Date(2026, 2, 17, 7, 30),
  );
});
