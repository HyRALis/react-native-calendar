import type { CalendarEvent } from '../types';
import {
  addMinutes,
  atTime,
  combineDateAndTime,
  minutesOfDay,
} from './calendarDates';

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
  now?: Date;
  minuteStep?: number;
  durationMinutes?: number;
};

export const defaultMinuteStep = 15;
export const defaultDurationMinutes = 60;

export function roundUpToStep(date: Date, step: number): Date {
  const safeStep = Math.max(1, Math.round(step));

  const minutes =
    minutesOfDay(date) +
    date.getSeconds() / 60 +
    date.getMilliseconds() / 60000;
  return atTime(date, Math.ceil(minutes / safeStep) * safeStep);
}

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

export function eventToDraft(
  event: CalendarEvent,
  durationMinutes = defaultDurationMinutes,
): EventDraft {
  return {
    title: event.title,
    description: event.description ?? '',
    start: event.start,
    end: event.end ?? addMinutes(event.start, durationMinutes),
  };
}

export function earliestStartFor(event: CalendarEvent, now: Date): Date {
  return event.start.getTime() < now.getTime() ? event.start : now;
}

export function setDraftStart(draft: EventDraft, start: Date): EventDraft {
  const shift = start.getTime() - draft.start.getTime();

  return { ...draft, start, end: new Date(draft.end.getTime() + shift) };
}

export function setDraftEnd(draft: EventDraft, end: Date): EventDraft {
  return { ...draft, end };
}

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
