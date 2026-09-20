import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, controlSizes, opacity, radii, spacing } from '../../theme';
import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';
import { BottomSheet } from './BottomSheet';

export type OptionPickerOption<T> = { value: T; label: string };

export type OptionPickerProps<T> = {
  visible: boolean;
  title: string;
  options: ReadonlyArray<OptionPickerOption<T>>;
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  closeLabel?: string;
};

export function OptionPicker<T extends string | number>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  closeLabel = 'Cancel',
}: OptionPickerProps<T>) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.options}
        accessibilityRole="radiogroup"
      >
        {options.map(({ value, label }) => {
          const selected = value === selectedValue;
          return (
            <Pressable
              key={String(value)}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: selected }}
              onPress={() => onSelect(value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <Typography
                variant={selected ? 'bodyStrong' : 'body'}
                tone={selected ? 'primary' : 'default'}
              >
                {label}
              </Typography>
              {selected ? (
                <Typography tone="primary" accessible={false}>
                  {'✓'}
                </Typography>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <Button title={closeLabel} variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { flexShrink: 1 },
  options: { gap: spacing.xs, paddingBottom: spacing.sm },
  option: {
    minHeight: controlSizes.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  selected: { backgroundColor: colors.primaryLight },
  pressed: { opacity: opacity.pressed },
});
