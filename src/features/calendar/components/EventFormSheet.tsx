import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type TextInput as NativeTextInput,
} from 'react-native';
import { Button } from '../../../shared/components/atoms/Button';
import { BottomSheet } from '../../../shared/components/molecules/BottomSheet';
import { FormField } from '../../../shared/components/molecules/FormField';
import { spacing } from '../../../shared/theme';
import type { CalendarEvent } from '../types';
import {
  createEventDraft,
  earliestStartFor,
  eventToDraft,
  hasEventDraftErrors,
  setDraftEnd,
  setDraftStart,
  validateEventDraft,
  type EventDraft,
  type EventDraftErrors,
} from '../utils/eventDraft';
import { DateTimeField } from './DateTimeField';

export type EventFormSheetProps = {
  event?: CalendarEvent;
  initialDate?: Date;
  today?: Date;
  now?: Date;
  onSubmit: (draft: EventDraft) => void;
  onClose: () => void;
};

const noErrors: EventDraftErrors = {};

export function EventFormSheet({
  event,
  initialDate,
  today,
  now,
  onSubmit,
  onClose,
}: EventFormSheetProps) {
  const [clock] = useState(() => now ?? new Date());
  const [draft, setDraft] = useState(() =>
    event
      ? eventToDraft(event)
      : createEventDraft(initialDate ?? clock, { now: clock }),
  );
  const [submitted, setSubmitted] = useState(false);
  const didSubmit = useRef(false);
  const descriptionRef =
    useRef<React.ComponentRef<typeof NativeTextInput>>(null);

  const [earliest] = useState(() =>
    event ? earliestStartFor(event, clock) : clock,
  );
  const errors = validateEventDraft(draft, earliest);
  const shown = submitted ? errors : noErrors;

  function submit() {
    if (didSubmit.current) {
      return;
    }
    setSubmitted(true);

    if (!hasEventDraftErrors(errors)) {
      didSubmit.current = true;
      onSubmit(draft);
    }
  }

  return (
    <BottomSheet
      visible
      title={event ? 'Edit event' : 'Add event'}
      onClose={onClose}
      testID="event-form-sheet"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <DateTimeField
          label="Starts"
          value={draft.start}
          today={today}
          min={earliest}
          error={shown.start}
          onChange={start => setDraft(current => setDraftStart(current, start))}
        />
        <DateTimeField
          label="Ends"
          value={draft.end}
          today={today}
          min={draft.start}
          error={shown.end}
          onChange={end => setDraft(current => setDraftEnd(current, end))}
        />
        <FormField
          label="Title"
          required
          value={draft.title}
          onChangeText={title => setDraft(current => ({ ...current, title }))}
          error={shown.title}
          returnKeyType="next"
          onSubmitEditing={() => descriptionRef.current?.focus()}
        />
        <FormField
          ref={descriptionRef}
          label="Description"
          helperText="Optional details for this event."
          value={draft.description}
          onChangeText={description =>
            setDraft(current => ({ ...current, description }))
          }
          multiline
        />
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="ghost"
          onPress={onClose}
          style={styles.action}
        />
        <Button
          title={event ? 'Save changes' : 'Save event'}
          onPress={submit}
          style={styles.action}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  form: { gap: spacing.lg, paddingBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
