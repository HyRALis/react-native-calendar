import type { CalendarView } from '../types';
import {
  addDays,
  addMonths,
  atMidday,
  isSameDay,
  sameDayInMonth,
  startOfMonth,
} from '../utils/calendarDates';
import { clampDateToRange } from '../utils/monthPaging';

/**
 * One focused day and one view. Every view derives what it shows from the same
 * date — the month containing it, the week containing it, or the day itself —
 * so switching views can never land somewhere unrelated.
 */
export type CalendarNavigationState = {
  view: CalendarView;
  focusedDate: Date;
  today: Date;
  anchor: Date;
};

export type CalendarNavigationAction =
  | { type: 'setView'; view: CalendarView }
  | { type: 'focusDate'; date: Date }
  | { type: 'openDate'; date: Date; view: CalendarView }
  | { type: 'goToMonth'; month: Date }
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
    anchor,
    focusedDate: clampDateToRange(anchor, initialDate ?? today),
  };
}

/** How far one step moves, in the unit the current view is measured in. */
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

/** Returns the same state when nothing moved, so consumers can skip renders. */
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

    // Paging the grid keeps the day-of-month, so the focused day travels with
    // you and switching to the day view afterwards lands somewhere sensible.
    case 'goToMonth':
      return focus(state, sameDayInMonth(action.month, state.focusedDate));

    case 'step':
      return focus(state, step(state, action.delta));

    case 'goToToday':
      return focus(state, state.today);
  }
}
