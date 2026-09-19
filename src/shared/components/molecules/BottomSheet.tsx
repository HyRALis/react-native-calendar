import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../theme';
import { Typography } from '../atoms/Typography';

export type BottomSheetProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Defaults to `Dismiss <title>`; override when the title reads awkwardly. */
  dismissLabel?: string;
  testID?: string;
};

/**
 * A panel that rises from the bottom edge and is only as tall as its content,
 * up to most of the screen. Built from core primitives so no sheet library is
 * needed. The caller owns the content; this owns the scrim, the safe area and
 * every way out: the backdrop, Android back, and the accessibility escape.
 */
export function BottomSheet({
  visible,
  title,
  children,
  onClose,
  dismissLabel,
  testID,
}: BottomSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      animationType="slide"
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
          testID={testID}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              dismissLabel ?? `Dismiss ${title.toLowerCase()}`
            }
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          {/* box-none keeps the empty space above the panel tappable, so the
              backdrop below still closes the sheet. */}
          <KeyboardAvoidingView
            style={styles.lift}
            pointerEvents="box-none"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <SafeAreaView edges={['bottom']} style={styles.panel}>
              <View style={styles.grabber} />
              <Typography variant="title" accessibilityRole="header">
                {title}
              </Typography>
              {children}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim },
  lift: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    maxHeight: '90%',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: spacing.xxxl,
    height: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
  },
});
