import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CalendarEvent } from '../types';
import { formatEventDateTime } from '../utils/calendarEvents';
import { EventDetailsSheet } from './EventDetailsSheet';

const event: CalendarEvent = {
  id: 'event-1',
  title: 'Standup',
  start: new Date(2026, 2, 17, 9, 0),
  end: new Date(2026, 2, 17, 9, 30),
  description: 'Daily sync',
};

function renderDetails(
  overrides: Partial<CalendarEvent> = {},
  withEdit = true,
) {
  const onEdit = jest.fn();
  const onClose = jest.fn();
  render(
    <EventDetailsSheet
      event={{ ...event, ...overrides }}
      onEdit={withEdit ? onEdit : undefined}
      onClose={onClose}
    />,
  );

  return { onEdit, onClose };
}

test('shows the event it was given', () => {
  renderDetails();

  expect(
    screen.getByRole('header', { name: 'Event details' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Standup')).toBeOnTheScreen();
  expect(screen.getByText(formatEventDateTime(event.start))).toBeOnTheScreen();
  expect(screen.getByText('Daily sync')).toBeOnTheScreen();
});

test.each([
  ['end time', { end: undefined }, 'No end time'],
  ['description', { description: undefined }, 'No description'],
])('says so when the event has no %s', (_name, overrides, expected) => {
  renderDetails(overrides);

  expect(screen.getByText(expected)).toBeOnTheScreen();
});

test('asking to edit reports the event being shown', () => {
  const { onEdit, onClose } = renderDetails();

  fireEvent.press(screen.getByRole('button', { name: 'Edit event' }));

  expect(onEdit).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'event-1' }),
  );
  expect(onClose).not.toHaveBeenCalled();
});

test('the edit action is hidden where no handler is given', () => {
  renderDetails({}, false);

  expect(screen.queryByRole('button', { name: 'Edit event' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
});

test.each([
  ['the close button', () => fireEvent.press(screen.getByLabelText('Close'))],
  [
    'the backdrop',
    () => fireEvent.press(screen.getByLabelText('Dismiss event details')),
  ],
])('dismissing with %s closes without editing', (_name, dismiss) => {
  const { onEdit, onClose } = renderDetails();

  dismiss();

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onEdit).not.toHaveBeenCalled();
});
