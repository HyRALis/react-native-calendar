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
import {
  createEventDraft,
  hasEventDraftErrors,
  setDraftEnd,
  setDraftStart,
  validateEventDraft,
  type EventDraft,
  type EventDraftErrors,
} from '../utils/eventDraft';
import { DateTimeField } from './DateTimeField';

export type AddEventSheetProps = {
  /** The day the calendar is focused on; the draft starts there. */
  initialDate: Date;
  today?: Date;
  /** The clock the default start rounds up from; injectable for tests. */
  now?: Date;
  onSubmit: (draft: EventDraft) => void;
  onClose: () => void;
};

const noErrors: EventDraftErrors = {};

/**
 * The "Add event" form. Mounted means open, so every visit starts from a blank
 * draft and nothing has to be reset on the way out. The sheet owns the draft
 * and shows it; every rule about what a valid draft is lives in `eventDraft`.
 */
export function AddEventSheet({
  initialDate,
  today,
  now,
  onSubmit,
  onClose,
}: AddEventSheetProps) {
  // Read once, so the draft does not expire underneath someone still typing.
  const [clock] = useState(() => now ?? new Date());
  const [draft, setDraft] = useState(() =>
    createEventDraft(initialDate, { now: clock }),
  );
  const [submitted, setSubmitted] = useState(false);
  const didSubmit = useRef(false);
  const descriptionRef =
    useRef<React.ComponentRef<typeof NativeTextInput>>(null);

  const errors = validateEventDraft(draft, clock);
  // Nothing is marked wrong until the first attempt, so the empty form opens calm.
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
    <BottomSheet visible title="Add event" onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nothing before now for the start, nothing before the start for the
            end, so most of the past is unreachable rather than rejected. */}
        <DateTimeField
          label="Starts"
          value={draft.start}
          today={today}
          min={clock}
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
        <Button title="Save event" onPress={submit} style={styles.action} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  /** Shrinks within the sheet's height cap so a tall form scrolls. */
  scroll: { flexShrink: 1 },
  form: { gap: spacing.lg, paddingBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
