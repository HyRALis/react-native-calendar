import type { CalendarEvent } from '../types';
import {
  addMinutes,
  atTime,
  combineDateAndTime,
  minutesOfDay,
} from './calendarDates';

/** What the form holds. Strings stay unvalidated here so typing is never fought. */
export type EventDraft = {
  title: string;
  description: string;
  start: Date;
  end: Date;
};

export type EventDraftErrors = {
  title?: string;
  start?: string;
  end?: string;
};

export type EventDraftOptions = {
  /** The clock the default start is rounded up from. */
  now?: Date;
  minuteStep?: number;
  durationMinutes?: number;
};

export const defaultMinuteStep = 15;
export const defaultDurationMinutes = 60;

/** Rounds up to the next whole `step` minutes, so a new event starts on a slot. */
export function roundUpToStep(date: Date, step: number): Date {
  const safeStep = Math.max(1, Math.round(step));

  const minutes =
    minutesOfDay(date) +
    date.getSeconds() / 60 +
    date.getMilliseconds() / 60000;
  return atTime(date, Math.ceil(minutes / safeStep) * safeStep);
}

/**
 * A blank draft on `day`, starting at the next free slot after the current
 * time of day. Picking a day in the grid and opening the form therefore lands
 * on that day rather than on today — unless that day has already passed, in
 * which case the draft starts now, because the past cannot be scheduled.
 */
export function createEventDraft(
  day: Date,
  {
    now = new Date(),
    minuteStep = defaultMinuteStep,
    durationMinutes = defaultDurationMinutes,
  }: EventDraftOptions = {},
): EventDraft {
  const onDay = roundUpToStep(combineDateAndTime(day, now), minuteStep);
  const start =
    onDay.getTime() < now.getTime() ? roundUpToStep(now, minuteStep) : onDay;

  return {
    title: '',
    description: '',
    start,
    end: addMinutes(start, durationMinutes),
  };
}

/** Moving the start carries the end along, so the duration is kept. */
export function setDraftStart(draft: EventDraft, start: Date): EventDraft {
  const shift = start.getTime() - draft.start.getTime();

  return { ...draft, start, end: new Date(draft.end.getTime() + shift) };
}

export function setDraftEnd(draft: EventDraft, end: Date): EventDraft {
  return { ...draft, end };
}

/**
 * `now` is read once when the form opens rather than on every keystroke, so a
 * draft does not turn invalid underneath someone who is still filling it in.
 */
export function validateEventDraft(
  draft: EventDraft,
  now: Date = new Date(),
): EventDraftErrors {
  const errors: EventDraftErrors = {};

  if (!draft.title.trim()) {
    errors.title = 'Enter a title for this event.';
  }

  if (!Number.isFinite(draft.start.getTime())) {
    errors.start = 'Choose a valid start date.';
  } else if (draft.start.getTime() < now.getTime()) {
    errors.start = 'An event cannot start in the past.';
  }

  if (!Number.isFinite(draft.end.getTime())) {
    errors.end = 'Choose a valid end date.';
  } else if (draft.end.getTime() <= draft.start.getTime()) {
    errors.end = 'The end must come after the start.';
  }

  return errors;
}

export function hasEventDraftErrors(errors: EventDraftErrors): boolean {
  return Boolean(errors.title || errors.start || errors.end);
}

/** The stored event: trimmed, with an empty description left off entirely. */
export function draftToEvent(draft: EventDraft, id: string): CalendarEvent {
  const description = draft.description.trim();
  const event: CalendarEvent = {
    id,
    title: draft.title.trim(),
    start: draft.start,
    end: draft.end,
  };

  return description ? { ...event, description } : event;
}
