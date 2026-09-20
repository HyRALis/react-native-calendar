import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../shared/components/atoms/Button';
import { Typography } from '../../../shared/components/atoms/Typography';
import {
  colors,
  controlSizes,
  opacity,
  radii,
  spacing,
} from '../../../shared/theme';
import { calendarViews, type CalendarView } from '../types';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';

export type CalendarDrawerProps = {
  visible: boolean;
  selectedView: CalendarView;
  onSelectView: (view: CalendarView) => void;
  onClose: () => void;
};

export function CalendarDrawer({
  visible,
  selectedView,
  onSelectView,
  onClose,
}: CalendarDrawerProps) {
  const reducedMotion = useReducedMotion();
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'fade'}
      statusBarTranslucent
      navigationBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <View
          style={styles.overlay}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss calendar menu"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.panel}>
            <ScrollView contentContainerStyle={styles.content}>
              <Typography variant="title" accessibilityRole="header">
                Calendar views
              </Typography>
              <Typography tone="muted">
                Choose how you see your schedule.
              </Typography>
              <View style={styles.options}>
                {calendarViews.map(({ value, label }) => {
                  const selected = selectedView === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: selected }}
                      onPress={() => onSelectView(value)}
                      style={({ pressed }) => [
                        styles.option,
                        selected && styles.selected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Typography
                        variant="bodyStrong"
                        tone={selected ? 'primary' : 'default'}
                      >
                        {label}
                      </Typography>
                      {selected ? (
                        <Typography tone="primary" accessible={false}>
                          {'\u2713'}
                        </Typography>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <Button title="Close menu" variant="ghost" onPress={onClose} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim },
  panel: {
    flex: 1,
    width: '84%',
    maxWidth: 320,
    backgroundColor: colors.surface,
  },
  content: { padding: spacing.xl, gap: spacing.md },
  options: { gap: spacing.sm, marginVertical: spacing.lg },
  option: {
    minHeight: controlSizes.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  selected: { backgroundColor: colors.primaryLight },
  pressed: { opacity: opacity.pressed },
});
