export function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    12,
  );
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

export function dayOfWeekIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function getWeekDays(date: Date): Date[] {
  const monday = startOfWeek(date);

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

export function atMidday(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12).getDate();
}

export function sameDayInMonth(month: Date, day: Date): Date {
  return new Date(
    month.getFullYear(),
    month.getMonth(),
    Math.min(day.getDate(), getDaysInMonth(month)),
    12,
  );
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function atTime(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}

export function combineDateAndTime(day: Date, time: Date): Date {
  return atTime(day, minutesOfDay(time));
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function differenceInDays(from: Date, to: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;

  return Math.round(
    (atMidday(to).getTime() - atMidday(from).getTime()) / dayMs,
  );
}
