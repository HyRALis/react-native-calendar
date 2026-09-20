import type { CalendarView } from '../types';
import {
  addDays,
  addMonths,
  atMidday,
  dayOfWeekIndex,
  isSameDay,
  sameDayInMonth,
  startOfMonth,
} from '../utils/calendarDates';
import { clampDateToRange } from '../utils/calendarPaging';

export type CalendarNavigationState = {
  view: CalendarView;
  focusedDate: Date;
  today: Date;
  now: Date;
  anchor: Date;
};

export type CalendarNavigationAction =
  | { type: 'setView'; view: CalendarView }
  | { type: 'focusDate'; date: Date }
  | { type: 'openDate'; date: Date; view: CalendarView }
  | { type: 'goToMonth'; month: Date }
  | { type: 'goToPage'; pageDate: Date }
  | { type: 'step'; delta: number }
  | { type: 'goToToday' };

export type CalendarNavigationInit = {
  today?: Date;
  initialDate?: Date;
  initialView?: CalendarView;
};

export function createCalendarNavigationState({
  today = new Date(),
  initialDate,
  initialView = 'month',
}: CalendarNavigationInit = {}): CalendarNavigationState {
  const anchor = startOfMonth(today);

  return {
    view: initialView,
    today: atMidday(today),
    now: today,
    anchor,
    focusedDate: clampDateToRange(anchor, initialDate ?? today),
  };
}

function step(state: CalendarNavigationState, delta: number): Date {
  switch (state.view) {
    case 'day':
      return addDays(state.focusedDate, delta);
    case 'week':
      return addDays(state.focusedDate, delta * 7);
    case 'month':
      return sameDayInMonth(
        addMonths(state.focusedDate, delta),
        state.focusedDate,
      );
  }
}

function pageStart(state: CalendarNavigationState, pageDate: Date): Date {
  switch (state.view) {
    case 'day':
      return pageDate;
    case 'week':
      return addDays(pageDate, dayOfWeekIndex(state.focusedDate));
    case 'month':
      return sameDayInMonth(pageDate, state.focusedDate);
  }
}

function focus(
  state: CalendarNavigationState,
  date: Date,
): CalendarNavigationState {
  const focusedDate = clampDateToRange(state.anchor, date);

  return isSameDay(focusedDate, state.focusedDate)
    ? state
    : { ...state, focusedDate };
}

export function calendarNavigationReducer(
  state: CalendarNavigationState,
  action: CalendarNavigationAction,
): CalendarNavigationState {
  switch (action.type) {
    case 'setView':
      return action.view === state.view
        ? state
        : { ...state, view: action.view };

    case 'focusDate':
      return focus(state, action.date);

    case 'openDate': {
      const focused = focus(state, action.date);
      return focused.view === action.view
        ? focused
        : { ...focused, view: action.view };
    }

    case 'goToMonth':
      return focus(state, sameDayInMonth(action.month, state.focusedDate));

    case 'goToPage':
      return focus(state, pageStart(state, action.pageDate));

    case 'step':
      return focus(state, step(state, action.delta));

    case 'goToToday':
      return focus(state, state.today);
  }
}
