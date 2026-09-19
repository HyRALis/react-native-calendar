import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { formatTimeOfDay } from '../utils/timeOfDay';
import { AddEventSheet } from './AddEventSheet';

const focused = new Date(2026, 2, 17, 12);
/** Pinned so the default start does not depend on the clock the suite runs on. */
const now = new Date(2026, 2, 17, 9, 47);

function dateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function renderSheet() {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  render(
    <AddEventSheet
      initialDate={focused}
      today={focused}
      now={now}
      onSubmit={onSubmit}
      onClose={onClose}
    />,
  );

  return { onSubmit, onClose };
}

function save() {
  fireEvent.press(screen.getByRole('button', { name: 'Save event' }));
}

test('repeated save taps submit a valid draft only once', () => {
  const { onSubmit } = renderSheet();
  fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
  save();
  save();
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('opens as a sheet titled Add event with every field', () => {
  renderSheet();

  expect(screen.getByRole('header', { name: 'Add event' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Starts date' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Starts time' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Ends date' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Ends time' })).toBeOnTheScreen();
  expect(screen.getByLabelText('Title')).toBeOnTheScreen();
  expect(screen.getByLabelText('Description')).toBeOnTheScreen();
});

test('the draft starts on the day the calendar is focused on', () => {
  renderSheet();

  expect(screen.getAllByText(dateLabel(focused)).length).toBeGreaterThan(0);
});

test('saving without a title reports the error and submits nothing', () => {
  const { onSubmit } = renderSheet();

  save();

  expect(onSubmit).not.toHaveBeenCalled();
  expect(
    screen.getByRole('alert', { name: 'Enter a title for this event.' }),
  ).toBeOnTheScreen();
});

test('nothing is marked wrong before the first attempt to save', () => {
  renderSheet();

  expect(screen.queryByRole('alert')).toBeNull();
});

test('saving a titled draft reports the whole draft', () => {
  const { onSubmit } = renderSheet();

  fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
  fireEvent.changeText(screen.getByLabelText('Description'), 'Daily sync');
  save();

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Standup', description: 'Daily sync' }),
  );

  const [draft] = onSubmit.mock.calls[0];
  expect(draft.start.getDate()).toBe(focused.getDate());
  expect(draft.end.getTime()).toBeGreaterThan(draft.start.getTime());
});

test('moving the start day carries the end day with it', () => {
  const { onSubmit } = renderSheet();
  const later = new Date(2026, 2, 26, 12);

  fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));
  fireEvent.press(
    screen.getByRole('button', {
      name: later.toLocaleDateString(undefined, { dateStyle: 'full' }),
    }),
  );
  fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
  save();

  const [draft] = onSubmit.mock.calls[0];
  expect(draft.start.getDate()).toBe(26);
  expect(draft.end.getDate()).toBe(26);
});

test('an end that is not after the start is rejected', () => {
  const { onSubmit } = renderSheet();

  // The end cannot be dragged before the start's day at all, so the only way
  // left to break the rule is to land it exactly on the start.
  fireEvent.press(screen.getByRole('button', { name: 'Ends time' }));
  fireEvent.press(
    screen.getByRole('radio', { name: formatTimeOfDay(10 * 60) }),
  );
  fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
  save();

  expect(onSubmit).not.toHaveBeenCalled();
  expect(
    screen.getByRole('alert', { name: 'The end must come after the start.' }),
  ).toBeOnTheScreen();
});

describe('the past is out of reach', () => {
  test('the draft opens at the next free slot, never behind the clock', () => {
    const { onSubmit } = renderSheet();

    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
    save();

    const [draft] = onSubmit.mock.calls[0];
    expect(draft.start).toEqual(new Date(2026, 2, 17, 10, 0));
  });

  test('days that have already passed cannot be chosen as the start', () => {
    renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));

    expect(
      screen.getByRole('button', {
        name: new Date(2026, 2, 16, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        }),
      }),
    ).toBeDisabled();
  });

  test('times that have already passed today are not offered', () => {
    renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));

    expect(
      screen.queryByRole('radio', { name: formatTimeOfDay(9 * 60) }),
    ).toBeNull();
    expect(
      screen.getByRole('radio', { name: formatTimeOfDay(10 * 60) }),
    ).toBeOnTheScreen();
  });

  test('a start walked back into the past through a later day is rejected', () => {
    const { onSubmit } = renderSheet();
    const later = new Date(2026, 2, 26, 12);

    // A later day frees up the whole clock again, including this morning.
    fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));
    fireEvent.press(
      screen.getByRole('button', {
        name: later.toLocaleDateString(undefined, { dateStyle: 'full' }),
      }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));
    fireEvent.press(
      screen.getByRole('radio', { name: formatTimeOfDay(8 * 60) }),
    );

    // Coming back to today carries that morning time with it.
    fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));
    fireEvent.press(
      screen.getByRole('button', {
        name: focused.toLocaleDateString(undefined, { dateStyle: 'full' }),
      }),
    );
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
    save();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByRole('alert', { name: 'An event cannot start in the past.' }),
    ).toBeOnTheScreen();
  });
});

test('cancelling closes without submitting', () => {
  const { onSubmit, onClose } = renderSheet();

  fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSubmit).not.toHaveBeenCalled();
});
