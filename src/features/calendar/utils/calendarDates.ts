/** Use local calendar arithmetic so DST and UTC offsets do not shift dates. */
export function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    12,
  );
}

/** Weeks start on Monday. */
export function getWeekDays(date: Date): Date[] {
  const monday = addDays(date, -((date.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function getMonthWeeks(date: Date): Date[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);

  const start = getWeekDays(first)[0];

  const weekCount = Math.ceil(
    (((first.getDay() + 6) % 7) + last.getDate()) / 7,
  );

  return Array.from({ length: weekCount }, (_, index) =>
    getWeekDays(addDays(start, index * 7)),
  );
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
}

export function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function differenceInMonths(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}
