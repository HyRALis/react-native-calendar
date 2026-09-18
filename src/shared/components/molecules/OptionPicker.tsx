import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, controlSizes, opacity, radii, spacing } from '../../theme';
import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';

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

/**
 * A modal single-choice list. Built from core primitives so no picker
 * dependency is needed, and generic so any feature can reuse it.
 */
export function OptionPicker<T extends string | number>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  closeLabel = 'Cancel',
}: OptionPickerProps<T>) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View
        style={styles.overlay}
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title.toLowerCase()}`}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.panel}>
          <Typography
            variant="title"
            accessibilityRole="header"
            style={styles.title}
          >
            {title}
          </Typography>
          <ScrollView
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: '70%',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  title: { marginBottom: spacing.xs },
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
