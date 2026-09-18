import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { CalendarView } from '../types';
import { getWeekDays, startOfMonth } from '../utils/calendarDates';
import {
  calendarNavigationReducer,
  createCalendarNavigationState,
  type CalendarNavigationInit,
  type CalendarNavigationState,
} from './calendarNavigationReducer';

export type CalendarNavigation = CalendarNavigationState & {
  visibleMonth: Date;
  visibleWeek: Date[];
};

export type CalendarNavigationActions = {
  setView: (view: CalendarView) => void;
  focusDate: (date: Date) => void;
  openDay: (date: Date) => void;
  openWeek: (date: Date) => void;
  openMonth: (date: Date) => void;
  goToMonth: (month: Date) => void;
  goToToday: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
};

const StateContext = createContext<CalendarNavigation | null>(null);
const ActionsContext = createContext<CalendarNavigationActions | null>(null);

export type CalendarNavigationProviderProps = CalendarNavigationInit & {
  children: ReactNode;
};

export function CalendarNavigationProvider({
  children,
  ...init
}: CalendarNavigationProviderProps) {
  const [state, dispatch] = useReducer(
    calendarNavigationReducer,
    init,
    createCalendarNavigationState,
  );

  const value = useMemo<CalendarNavigation>(
    () => ({
      ...state,
      visibleMonth: startOfMonth(state.focusedDate),
      visibleWeek: getWeekDays(state.focusedDate),
    }),
    [state],
  );

  const actions = useMemo<CalendarNavigationActions>(
    () => ({
      setView: view => dispatch({ type: 'setView', view }),
      focusDate: date => dispatch({ type: 'focusDate', date }),
      openDay: date => dispatch({ type: 'openDate', date, view: 'day' }),
      openWeek: date => dispatch({ type: 'openDate', date, view: 'week' }),
      openMonth: date => dispatch({ type: 'openDate', date, view: 'month' }),
      goToMonth: month => dispatch({ type: 'goToMonth', month }),
      goToToday: () => dispatch({ type: 'goToToday' }),
      goToNext: () => dispatch({ type: 'step', delta: 1 }),
      goToPrevious: () => dispatch({ type: 'step', delta: -1 }),
    }),
    [],
  );

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={value}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

function useCalendarContext<T>(context: React.Context<T | null>, hook: string) {
  const value = useContext(context);

  if (value === null) {
    throw new Error(
      `${hook} must be used inside a CalendarNavigationProvider.`,
    );
  }

  return value;
}

export function useCalendarNavigation(): CalendarNavigation {
  return useCalendarContext(StateContext, 'useCalendarNavigation');
}

export function useCalendarActions(): CalendarNavigationActions {
  return useCalendarContext(ActionsContext, 'useCalendarActions');
}
